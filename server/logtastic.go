package main

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/carlmjohnson/requests"
)

var (
	logtasticServer = "127.0.0.1:9327"
	// logtasticServer = "l.arslexis.io"
	logtasticApiKey        = ""
	logtasticThrottleUntil time.Time
)

func getBestIPAddress(r *http.Request) string {
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

func logtasticPOST(uriPath string, d []byte, mime string) error {
	uri := "http://" + logtasticServer + uriPath

	throttleLeft := time.Until(logtasticThrottleUntil)
	if throttleLeft > 0 {
		logfLocal(" skipping because throttling for %s\n", throttleLeft)
		return nil
	}
	// logfLocal("logtasticPOST %s\n", uri)
	var s string
	r := requests.
		URL(uri).
		BodyBytes(d).
		ContentType(mime)
	if logtasticApiKey != "" {
		r = r.Header("X-Api-Key", logtasticApiKey)
	}
	err := r.ToString(&s).
		Fetch(ctx())
	if err != nil {
		logfLocal("logtasticPOST %s failed: %v, will throttle for 5 mins\n", uri, err)
		logtasticThrottleUntil = time.Now().Add(time.Minute * 5)
		return err
	}
	return nil
}

func logtasticPOSTJsonData(uriPath string, d []byte) error {
	return logtasticPOST(uriPath, d, "application/json")
}

func logtasticPOSTJson(uriPath string, v interface{}) error {
	d, _ := json.Marshal(v)
	return logtasticPOSTJsonData(uriPath, d)
}

func logtasticPOSTPlainText(uriPath string, d []byte) error {
	return logtasticPOST(uriPath, d, "text/plain")
}

func logtasticPOSTPlainTextString(uriPath string, s string) error {
	return logtasticPOSTPlainText(uriPath, []byte(s))
}

func getHeader(h http.Header, hdrKey string, mapKey string, m map[string]interface{}) {
	val := h.Get(hdrKey)
	if len(val) > 0 {
		m[mapKey] = val
	}
}

var referrerQueryParams = []string{
	"ref",
	"referer",
	"referrer",
	"source",
	"utm_source",
}

func getReferrerFromHeaderOrQuery(r *http.Request) string {
	referrer := r.Header.Get("Referer")
	if referrer == "" {
		for _, param := range referrerQueryParams {
			referrer = r.URL.Query().Get(param)
			if referrer != "" {
				return referrer
			}
		}
	}
	return referrer
}

func getRequestInfo(r *http.Request, m map[string]interface{}) {
	m["method"] = r.Method
	m["url"] = r.URL.String()
	m["ip"] = getBestIPAddress(r)
	m["user_agent"] = r.UserAgent()
	m["referrer"] = getReferrerFromHeaderOrQuery(r)
	hdr := r.Header
	getHeader(hdr, "Accept-Language", "accept_accept_language", m)
	getHeader(hdr, "Sec-CH-UA", "sec_ch_ua", m)
	getHeader(hdr, "Sec-CH-UA-Mobile", "sec_ch_ua_mobile", m)
	getHeader(hdr, "Sec-CH-UA-Platform", "sec_ch_ua_platform", m)
	getHeader(hdr, "Sec-CH-UA-Platform-Version", "sec_ch_ua_platform_version", m)
	getHeader(hdr, "Sec-CH-Width", "sec_ch_width", m)
	getHeader(hdr, "Sec-CH-Viewport-Width", "sec_ch_viewport_width", m)
}

func logtasticLog(s string) error {
	return logtasticPOSTPlainTextString("/api/v1/log", s)
}

func logtasticHit(r *http.Request, code int, size int64, dur time.Duration) {
	m := map[string]interface{}{}
	getRequestInfo(r, m)
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
		getRequestInfo(r, m)
	}
	logtasticPOSTJson("/api/v1/event", m)
}

// TODO: send callstack as a separate field
// TODO: send server build hash so we can auto-link callstack lines
// to	source code on github
func logtasticError(r *http.Request, s string) {
	m := map[string]interface{}{}
	if r != nil {
		getRequestInfo(r, m)
	}
	m["msg"] = s
	logtasticPOSTJson("/api/v1/error", m)
}
