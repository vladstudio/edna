package main

import (
	"bytes"
	"embed"
	"fmt"
	"io/fs"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"os/signal"
	"path/filepath"
	"slices"
	"strings"
	"syscall"
	"time"

	"github.com/felixge/httpsnoop"
	hutil "github.com/kjk/common/httputil"
	"github.com/kjk/common/u"
)

var (
	//go:embed dist/*
	wwwFS embed.FS
	//go:embed secrets.env
	secretsEnv []byte
)

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
			// case "/auth/ghlogin":
			// 	handleLoginGitHub(w, r)
			// 	return
			// case "/auth/githubcb":
			// 	handleGithubCallback(w, r)
			// 	return
		}

		// if strings.HasPrefix(uri, "/event/") {
		// 	handleEvent(w, r)
		// 	return
		// }

		tryServeRedirect := func(uri string) bool {
			if uri == "/home" {
				http.Redirect(w, r, "/", http.StatusPermanentRedirect)
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
				logf("handlerWithMetrics: panicked with with %v\n", p)
				errStr := fmt.Sprintf("Error: %v", p)
				http.Error(w, errStr, http.StatusInternalServerError)
				return
			}
			logHTTPReq(r, m.Code, m.Written, m.Duration)
			if m.Code == 200 {
				// pirschSendHit(r)
			}
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
		// Ctrl-C sends SIGINT
		sctx, stop := signal.NotifyContext(ctx(), os.Interrupt /*SIGINT*/, os.Kill /* SIGKILL */, syscall.SIGTERM)
		defer stop()
		<-sctx.Done()

		logf("Got one of the signals. Shutting down http server\n")
		_ = httpSrv.Shutdown(ctx())
		select {
		case <-chServerClosed:
			// do nothing
		case <-time.After(time.Second * 5):
			// timeout
			logf("timed out trying to shut down http server")
		}
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
		//ServeCompressed:  true,
	}
}

func runServerDev() {
	// must be same as vite.config.js
	proxyURLStr := "http://localhost:3035"

	if hasBun() {
		u.RunLoggedInDir("frontend", "bun", "install")
		closeDev, err := startLoggedInDir(".", "bun", "run", "webapp:dev")
		must(err)
		defer closeDev()
	} else {
		u.RunLoggedInDir("frontend", "yarn")
		closeDev, err := startLoggedInDir(".", "yarn", "webapp:dev")
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
