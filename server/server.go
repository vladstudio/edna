package main

import (
	"bytes"
	"context"
	"embed"
	"fmt"
	"io"
	"io/fs"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"path/filepath"
	"slices"
	"strings"
	"sync"
	"time"

	"github.com/felixge/httpsnoop"
	hutil "github.com/kjk/common/httputil"
	"github.com/kjk/common/logtastic"
	"github.com/kjk/common/u"

	"github.com/google/go-github/github"
	"golang.org/x/oauth2"
)

var (
	//go:embed dist/*
	wwwFS embed.FS
	//go:embed secrets.env
	secretsEnv []byte
)

var (
	// random string for oauth2 API calls to protect against CSRF
	oauthSecretPrefix = "231411243-"
	gitHubEndpoint    = oauth2.Endpoint{
		AuthURL:  "https://github.com/login/oauth/authorize",
		TokenURL: "https://github.com/login/oauth/access_token",
	}
	githubConfig = oauth2.Config{
		ClientID:     "",
		ClientSecret: "",
		// select level of access you want https://developer.github.com/v3/oauth/#scopes
		Scopes:   []string{"user:email", "read:user", "gist"},
		Endpoint: gitHubEndpoint,
	}
)

func getGithubConfig(r *http.Request) *oauth2.Config {
	logf("getGithubConfig: r.Host: '%s'\n", r.Host)
	host := strings.ToLower(r.Host)
	if githubConfig.ClientID == "" {
		// we need to register a GitHub app for each callback domain
		if strings.Contains(host, "localhost") {
			// https://github.com/settings/applications/1159176 : localhost
			githubConfig.ClientID = "77ba1cbe7c0eff7c462b"
			// githubConfig.ClientSecret = secretGitHubLocal
			logf("getGithubConfig: using localhost config\n")
		} else if strings.Contains(host, "edna.vlad.studio") {
			// https://github.com/settings/applications/2495749 : tools.arslexis.io
			githubConfig.ClientID = "ff6bcecdb5df037a208d"
			// githubConfig.ClientSecret = secretGitHubToolsArslexis
			logf("getGithubConfig: using edna.vlad.studio config\n")
		} else {
			panicIf(true, "unsupported host: %s", host)
		}
	}
	return &githubConfig
}

func logLogin(ctx context.Context, r *http.Request, token *oauth2.Token) {
	conf := getGithubConfig(r)
	oauthClient := conf.Client(ctx, token)
	client := github.NewClient(oauthClient)
	user, _, err := client.Users.Get(ctx, "")
	if err != nil {
		logf("client.Users.Get() faled with '%s'\n", err)
		return
	}
	logf("logged in as GitHub user: %s\n", *user.Login)
	m := map[string]string{}
	if user.Login != nil {
		m["user"] = *user.Login
	}
	if user.Email != nil {
		m["email"] = *user.Email
	}
	if user.Name != nil {
		m["name"] = *user.Name
	}
	// pirschSendEvent(r, "github_login", 0, m)
}

// /auth/ghlogin
func handleLoginGitHub(w http.ResponseWriter, r *http.Request) {
	conf := getGithubConfig(r)
	if conf.ClientID == "" {
		serveInternalError(w, e("missing github client id"))
		return
	}
	if conf.ClientSecret == "" {
		serveInternalError(w, e("missing github client secret"))
		return
	}
	uri := conf.AuthCodeURL(oauthSecretPrefix, oauth2.AccessTypeOnline)
	logf("handleLoginGitHub: redirect to '%s'\n", uri)
	tempRedirect(w, r, uri)
}

// /auth/githubcb
func handleGithubCallback(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	logf("handleGithubCallback: '%s'\n", r.URL)
	state := r.FormValue("state")
	if !strings.HasPrefix(state, oauthSecretPrefix) {
		logErrorf("invalid oauth state, expected '%s*', got '%s'\n", oauthSecretPrefix, state)
		tempRedirect(w, r, "/")
		return
	}

	code := r.FormValue("code")
	conf := getGithubConfig(r)
	token, err := conf.Exchange(context.Background(), code)
	if err != nil {
		logErrorf("oauthGoogleConf.Exchange() failed with '%s'\n", err)
		tempRedirect(w, r, "/")
		return
	}
	logf("token: %#v", token)
	ac := token.AccessToken
	uri := "/github_success?access_token=" + ac
	logf("token: %#v\nuri: %s\n", token, uri)
	tempRedirect(w, r, uri)

	// can't put in the background because that cancels ctx
	logLogin(ctx, r, token)
}

var (
	cachedCurrencyRatesJSON []byte
	currencyRatesLastUpdate time.Time
	muCurrency              sync.Mutex
	currencyUpdateFreq      = time.Hour * 24
	// https://www.exchangerate-api.com/docs/free, rate limited, updates rates once a day
	currencyRatesURL1 = "https://open.er-api.com/v6/latest/EUR"
	// I also have https://apilayer.com/marketplace/fixer-api account
	// on https://apilayer.com/account
	// which is free for 100 reqs per month
)

func getCurrencyRates() ([]byte, error) {
	rsp, err := http.Get(currencyRatesURL1)
	if err != nil {
		return nil, err
	}
	defer rsp.Body.Close()
	if rsp.StatusCode == 200 {
		return io.ReadAll(rsp.Body)
	}
	return nil, e("getCurrencyRates: got status code %d", rsp.StatusCode)
}

// TODO: implement without using https://currencies.heynote.com/rates.json
func serverApiCurrencyRates(w http.ResponseWriter, r *http.Request) {
	logf("serverCurrencyRates\n")
	muCurrency.Lock()
	defer muCurrency.Unlock()

	if cachedCurrencyRatesJSON != nil {
		sinceUpdate := time.Since(currencyRatesLastUpdate)
		logf("serverCurrencyRates: have cached data, since update: %s\n", sinceUpdate)
		if sinceUpdate < currencyUpdateFreq {
			logf("serverCurrencyRates: using cached data\n")
			serveJSON(w, []byte(cachedCurrencyRatesJSON))
			return
		}
	}

	d, err := getCurrencyRates()
	if err != nil {
		logf("serverCurrencyRates: getCurrencyRates() failed with: '%s'\n", err)
		if cachedCurrencyRatesJSON != nil {
			serveJSON(w, cachedCurrencyRatesJSON)
			return
		}
		serveInternalError(w, err)
		return
	}
	logf("serverCurrencyRates: got data of size %d %s\n", len(d), truncData(d, 64))
	cachedCurrencyRatesJSON = d
	currencyRatesLastUpdate = time.Now()
	serveJSON(w, d)
}

func truncData(data []byte, maxLen int) string {
	if len(data) > maxLen {
		return string(data[:maxLen]) + "..."
	}
	return string(data)
}

func isMacBasedOnUserAgent(r *http.Request) bool {
	ua := strings.ToLower(r.UserAgent())
	// TODO: verify this
	return strings.Contains(ua, "mac")
}

// in dev, proxyHandler redirects assets to vite web server
// in prod, assets must be pre-built in frontend/dist directory
func makeHTTPServer(serveOpts *hutil.ServeFileOptions, proxyHandler *httputil.ReverseProxy) *http.Server {
	panicIf(serveOpts == nil, "must provide serveOpts")

	mainHandler := func(w http.ResponseWriter, r *http.Request) {
		uri := r.URL.Path
		logf("mainHandler: '%s'\n", r.RequestURI)

		switch uri {
		case "/ping", "/ping.txt":
			content := bytes.NewReader([]byte("pong"))
			http.ServeContent(w, r, "foo.txt", time.Time{}, content)
			return
		case "/api/currency_rates.json":
			serverApiCurrencyRates(w, r)
			return
			// case "/auth/ghlogin":
			// 	handleLoginGitHub(w, r)
			// 	return
			// case "/auth/githubcb":
			// 	handleGithubCallback(w, r)
			// 	return
		}

		if strings.HasPrefix(uri, "/api/goplay/") {
			handleGoPlayground(w, r)
			return
		}
		if strings.HasPrefix(uri, "/event") {
			logtastic.HandleEvent(w, r)
			return
		}

		tryServeRedirect := func(uri string) bool {
			if uri == "/home" {
				http.Redirect(w, r, "/", http.StatusTemporaryRedirect)
				return true
			}
			if uri == "/help" {
				newURL := "/help-win.html"
				if isMacBasedOnUserAgent(r) {
					newURL = "/help-mac.html"
				}
				http.Redirect(w, r, newURL, http.StatusTemporaryRedirect)
				return true
			}
			return false
		}
		if tryServeRedirect(uri) {
			return
		}

		if proxyHandler != nil {
			transformRequestForProxy := func() {
				uris := []string{"/github_success", "/gisteditor/nogist", "/gisteditor/edit"}
				shouldProxyURI := slices.Contains(uris, uri)
				if !shouldProxyURI {
					return
				}
				newPath := uri + ".html"
				newURI := strings.Replace(r.URL.String(), uri, newPath, 1)
				var err error
				r.URL, err = url.Parse(newURI)
				must(err)
			}

			transformRequestForProxy()
			proxyHandler.ServeHTTP(w, r)
			return
		}

		if hutil.TryServeURLFromFS(w, r, serveOpts) {
			logf("mainHandler: served '%s' via httputil.TryServeFile\n", uri)
			return
		}

		http.NotFound(w, r)
	}

	handlerWithMetrics := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		m := httpsnoop.CaptureMetrics(http.HandlerFunc(mainHandler), w, r)
		defer func() {
			if p := recover(); p != nil {
				logErrorf("handlerWithMetrics: panicked with with %v\n", p)
				errStr := fmt.Sprintf("Error: %v", p)
				http.Error(w, errStr, http.StatusInternalServerError)
				return
			}
			logHTTPReq(r, m.Code, m.Written, m.Duration)
			logtastic.LogHit(r, m.Code, m.Written, m.Duration)
			// axiomLogHTTPReq(ctx(), r, m.Code, int(m.Written), m.Duration)
		}()
	})

	httpSrv := &http.Server{
		ReadTimeout:  120 * time.Second,
		WriteTimeout: 120 * time.Second,
		IdleTimeout:  120 * time.Second,
		Handler:      http.HandlerFunc(handlerWithMetrics),
	}
	httpAddr := fmt.Sprintf(":%d", httpPort)
	if isWinOrMac() {
		httpAddr = "localhost" + httpAddr
	}
	httpSrv.Addr = httpAddr
	return httpSrv
}

func serverListenAndWait(httpSrv *http.Server) func() {
	chServerClosed := make(chan bool, 1)
	go func() {
		err := httpSrv.ListenAndServe()
		// mute error caused by Shutdown()
		if err == http.ErrServerClosed {
			err = nil
		}
		if err == nil {
			logf("HTTP server shutdown gracefully\n")
		} else {
			logf("httpSrv.ListenAndServe error '%s'\n", err)
		}
		chServerClosed <- true
	}()

	return func() {
		waitForSigIntOrKill()

		logf("Got one of the signals. Shutting down http server\n")
		_ = httpSrv.Shutdown(ctx())
		select {
		case <-chServerClosed:
			// do nothing
		case <-time.After(time.Second * 5):
			// timeout
			logf("timed out trying to shut down http server")
		}
		logf("stopping logtastic\n")
		logtastic.Stop()
	}
}

func mkFsysEmbedded() fs.FS {
	fsys := wwwFS
	printFS(fsys, "dist")
	logf("mkFsysEmbedded: serving from embedded FS\n")
	return fsys
}

func mkFsysDirDist() fs.FS {
	dir := "server"
	fsys := os.DirFS(dir)
	printFS(fsys, "dist")
	logf("mkFsysDirDist: serving from dir '%s'\n", dir)
	return fsys
}

func mkFsysDirPublic() fs.FS {
	dir := filepath.Join("..", "public")
	fsys := os.DirFS(dir)
	printFS(fsys, "dist")
	logf("mkFsysDirPublic: serving from dir '%s'\n", dir)
	return fsys
}

func mkServeFileOptions(fsys fs.FS) *hutil.ServeFileOptions {
	return &hutil.ServeFileOptions{
		SupportCleanURLS:     true,
		ForceCleanURLS:       true,
		FS:                   fsys,
		DirPrefix:            "dist/",
		LongLivedURLPrefixes: []string{"/assets/"},
		ServeCompressed:      false, // when served via Cloudflare, no need to compress
	}
}

func runServerDev() {
	// must be same as vite.config.js
	proxyURLStr := "http://localhost:3035"
	logf("runServerDev\n")
	if hasBun() {
		runLoggedInDir(".", "bun", "install")
		closeDev, err := startLoggedInDir(".", "bun", "run", "dev")
		must(err)
		defer closeDev()
	} else {
		runLoggedInDir(".", "yarn")
		closeDev, err := startLoggedInDir(".", "yarn", "dev")
		must(err)
		defer closeDev()
	}

	proxyURL, err := url.Parse(proxyURLStr)
	must(err)
	proxyHandler := httputil.NewSingleHostReverseProxy(proxyURL)

	fsys := mkFsysDirPublic()
	serveOpts := mkServeFileOptions(fsys)
	httpSrv := makeHTTPServer(serveOpts, proxyHandler)

	//closeHTTPLog := OpenHTTPLog("onlinetool")
	//defer closeHTTPLog()

	logf("runServerDev(): starting on '%s', dev: %v\n", httpSrv.Addr, isDev())
	if isWinOrMac() {
		time.Sleep(time.Second * 2)
		u.OpenBrowser("http://" + httpSrv.Addr)
	}
	waitFn := serverListenAndWait(httpSrv)
	waitFn()
}

func runServerProd() {
	checkHasEmbeddedFiles()

	fsys := mkFsysEmbedded()
	serveOpts := mkServeFileOptions(fsys)
	httpSrv := makeHTTPServer(serveOpts, nil)
	logf("runServerProd(): starting on 'http://%s', dev: %v, prod: %v, prod local: %v\n", httpSrv.Addr, flgRunDev, flgRunProd, flgRunProdLocal)
	if isWinOrMac() {
		time.Sleep(time.Second * 2)
		u.OpenBrowser("http://" + httpSrv.Addr)
	}
	waitFn := serverListenAndWait(httpSrv)
	waitFn()
}

func runServerProdLocal() {
	var fsys fs.FS
	if countFilesInFS(wwwFS) > 5 {
		fsys = mkFsysEmbedded()
	} else {
		rebuildFrontend()
		fsys = mkFsysDirDist()
	}
	GitCommitHash, _ = getGitHashDateMust()

	serveOpts := mkServeFileOptions(fsys)
	httpSrv := makeHTTPServer(serveOpts, nil)
	logf("runServerProdLocal(): starting on 'http://%s', dev: %v, prod: %v, prod local: %v\n", httpSrv.Addr, flgRunDev, flgRunProd, flgRunProdLocal)
	if isWinOrMac() {
		time.Sleep(time.Second * 2)
		u.OpenBrowser("http://" + httpSrv.Addr)
	}
	waitFn := serverListenAndWait(httpSrv)
	waitFn()
	emptyFrontEndBuildDir()
}
