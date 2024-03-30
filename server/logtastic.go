package main

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/carlmjohnson/requests"
	"github.com/kjk/common/httputil"
)

type logtasticOp struct {
	uri  string
	mime string
	d    []byte
}

const logtasticThrottleTimeout = time.Second * 2

var (
	logtasticServer = "127.0.0.1:9327"
	// logtasticServer = "l.arslexis.io"
	logtasticApiKey        = ""
	logtasticThrottleUntil time.Time
	logtasticCh            = make(chan logtasticOp, 1000)
	startLogWorker         sync.Once
)

func getBestRemoteAddress(r *http.Request) string {
	h := r.Header
	potentials := []string{h.Get("CF-Connecting-IP"), h.Get("X-Real-Ip"), h.Get("X-Forwarded-For"), r.RemoteAddr}
	for _, v := range potentials {
		// sometimes they are stored as "ip1, ip2, ip3" with ip1 being the best
		parts := strings.Split(v, ",")
		res := strings.TrimSpace(parts[0])
		if res != "" {
			return res
		}
	}
	return ""
}

func logtasticWorker() {
	logfLocal("logtasticWorker started\n")
	for op := range logtasticCh {
		logfLocal("logtasticPOST %s\n", op.uri)
		uri := op.uri
		d := op.d
		mime := op.mime
		r := requests.
			URL(uri).
			BodyBytes(d).
			ContentType(mime)
		if logtasticApiKey != "" {
			r = r.Header("X-Api-Key", logtasticApiKey)
		}
		ctx, cancel := context.WithTimeout(ctx(), time.Second*10)
		err := r.Fetch(ctx)
		cancel()
		if err != nil {
			logfLocal("logtasticPOST %s failed: %v, will throttle for %s\n", uri, err, logtasticThrottleTimeout)
			logtasticThrottleUntil = time.Now().Add(logtasticThrottleTimeout)
		}
	}
}

func logtasticPOST(uriPath string, d []byte, mime string) {
	startLogWorker.Do(func() {
		go logtasticWorker()
	})

	throttleLeft := time.Until(logtasticThrottleUntil)
	if throttleLeft > 0 {
		logfLocal(" skipping because throttling for %s\n", throttleLeft)
		return
	}

	uri := "http://" + logtasticServer + uriPath
	// logfLocal("logtasticPOST %s\n", uri)
	op := logtasticOp{
		uri:  uri,
		mime: mime,
		d:    d,
	}

	select {
	case logtasticCh <- op:
	default:
		logfLocal("logtasticPOST %s failed: channel full\n", uri)
	}
}

func logtasticPOSTJsonData(uriPath string, d []byte) {
	logtasticPOST(uriPath, d, "application/json")
}

func logtasticPOSTJson(uriPath string, v interface{}) {
	d, _ := json.Marshal(v)
	logtasticPOSTJsonData(uriPath, d)
}

func logtasticPOSTPlainText(uriPath string, d []byte) {
	logtasticPOST(uriPath, d, "text/plain")
}

func logtasticPOSTPlainTextString(uriPath string, s string) {
	logtasticPOSTPlainText(uriPath, []byte(s))
}

func logtasticLog(s string) {
	logtasticPOSTPlainTextString("/api/v1/log", s)
}

func logtasticHit(r *http.Request, code int, size int64, dur time.Duration) {
	m := map[string]interface{}{}
	httputil.GetRequestInfo(r, m)
	if dur > 0 {
		m["dur_ms"] = float64(dur) / float64(time.Millisecond)
	}
	if code >= 400 {
		m["status"] = code
	}
	if size > 0 {
		m["size"] = size
	}
	logtasticPOSTJson("/api/v1/hit", m)
}

func logtasticEvent(r *http.Request, m map[string]interface{}) {
	if r != nil {
		httputil.GetRequestInfo(r, m)
	}
	logtasticPOSTJson("/api/v1/event", m)
}

// TODO: send callstack as a separate field
// TODO: send server build hash so we can auto-link callstack lines
// to	source code on github
func logtasticError(r *http.Request, s string) {
	m := map[string]interface{}{}
	if r != nil {
		httputil.GetRequestInfo(r, m)
	}
	m["msg"] = s
	logtasticPOSTJson("/api/v1/error", m)
}

func handleEvent(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()

	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	d, err := io.ReadAll(r.Body)
	if logIfErrf(err, "reading body") {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}
	// we validate it's json and agument it with ip of the user's browser
	var m map[string]interface{}
	err = json.Unmarshal(d, &m)
	if logIfErrf(err, "unmarshalling body\n%s\n", limitString(string(d), 100)) {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}
	logtasticEvent(r, m)
}

func limitString(s string, n int) string {
	if len(s) > n {
		return s[:n]
	}
	return s
}
