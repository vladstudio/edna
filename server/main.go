package main

import (
	"flag"
	"time"
)

var (
	// assets being served on-demand by vite
	flgRunDev bool
	// compiled assets embedded in the binary
	flgRunProd bool
	// compiled assets served from server/dist directory
	// mostly for testing that the assets are correctly built
	flgRunProdLocal bool
)

func isDev() bool {
	return flgRunDev
}

func measureDuration() func() {
	timeStart := time.Now()
	return func() {
		logf("took %s\n", time.Since(timeStart))
	}
}

func main() {
	var (
		flgDeployHetzner  bool
		flgSetupAndRun    bool
		flgBuildLocalProd bool
		flgUpdateGoDeps   bool
	)
	{
		flag.BoolVar(&flgRunDev, "run-dev", false, "run the server in dev mode")
		flag.BoolVar(&flgRunProd, "run-prod", false, "run server in production")
		flag.BoolVar(&flgRunProdLocal, "run-prod-local", false, "run server in production but locally")
		flag.BoolVar(&flgDeployHetzner, "deploy-hetzner", false, "deploy to hetzner")
		flag.BoolVar(&flgBuildLocalProd, "build-local-prod", false, "build for production run locally")
		flag.BoolVar(&flgSetupAndRun, "setup-and-run", false, "setup and run on the server")
		flag.BoolVar(&flgUpdateGoDeps, "update-go-deps", false, "update go dependencies")
		flag.Parse()
	}
	if GitCommitHash != "" {
		uriBase := "https://github.com/kjk/onlinetool.io/commit/"
		logf("onlinetool.io, build: %s (%s)\n", GitCommitHash, uriBase+GitCommitHash)
	}

}
