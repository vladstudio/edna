package main

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"sync"
	"time"

	"github.com/carlmjohnson/requests"
	"github.com/kjk/common/filerotate"
	"github.com/kjk/common/httputil"
	"github.com/kjk/common/siserlogger"
)

type logtasticOp struct {
	uri  string
	mime string
	d    []byte
}

const logtasticThrottleTimeout = time.Second * 15

var (
	logtasticServer = "127.0.0.1:9327"
	// logtasticServer = "l.arslexis.io"
	logtasticApiKey        = ""
	logtasticLogDir        = ""
	logtasticLoggerLogs    *filerotate.File
	logtasticLoggerErrors  *siserlogger.Logger
	logtasticLoggerEvents  *siserlogger.Logger
	logtasticLoggerHits    *siserlogger.Logger
	logtasticThrottleUntil time.Time
	logtasticCh            = make(chan logtasticOp, 1000)
	startLogWorker         sync.Once
)

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

const (
	mimeJSON      = "application/json"
	mimePlainText = "text/plain"
)

func writeLog(d []byte) {
	if logtasticLogDir == "" {
		return
	}
	if logtasticLoggerLogs == nil {
		var err error
		logtasticLoggerLogs, err = filerotate.NewDaily(logtasticLogDir, "logs", nil)
		if err != nil {
			logfLocal("failed to open log file logs: %v\n", err)
			return
		}
	}
	logtasticLoggerLogs.Write(d)
}

func logtasticLog(s string) {
	d := []byte(s)
	writeLog(d)
	logtasticPOST("/api/v1/log", d, mimePlainText)
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

	d, _ := json.Marshal(m)
	writeSiserLog("hit", &logtasticLoggerHits, d)

	logtasticPOST("/api/v1/hit", d, mimeJSON)
}

func logtasticEvent(r *http.Request, m map[string]interface{}) {
	if r != nil {
		httputil.GetRequestInfo(r, m)
	}

	d, _ := json.Marshal(m)
	writeSiserLog("event", &logtasticLoggerEvents, d)

	logtasticPOST("/api/v1/event", d, mimeJSON)
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

func maybeOpenLogFile(name string, lPtr **siserlogger.Logger) *siserlogger.Logger {
	if *lPtr != nil {
		return *lPtr
	}
	if logtasticLogDir == "" {
		return nil
	}

	l, err := siserlogger.NewDaily(logtasticLogDir, name, nil)
	if err != nil {
		logfLocal("failed to open log file %s: %v\n", name, err)
		return nil
	}
	*lPtr = l
	return l
}

func writeSiserLog(name string, lPtr **siserlogger.Logger, d []byte) {
	l := maybeOpenLogFile(name, lPtr)
	if l != nil {
		l.Write(d)
	}
}

// TODO: send callstack as a separate field
// TODO: send server build hash so we can auto-link callstack lines
// to	source code on github
func logtasticError(r *http.Request, s string) {
	writeSiserLog("errors", &logtasticLoggerErrors, []byte(s))

	m := map[string]interface{}{}
	if r != nil {
		httputil.GetRequestInfo(r, m)
	}
	m["msg"] = s
	d, _ := json.Marshal(m)
	logtasticPOST("/api/v1/error", d, mimeJSON)
}

func limitString(s string, n int) string {
	if len(s) > n {
		return s[:n]
	}
	return s
}
