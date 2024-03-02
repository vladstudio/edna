package main

import (
	"context"
	"fmt"
	"io/fs"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"syscall"

	"github.com/kjk/common/u"
)

var (
	f          = fmt.Sprintf
	e          = fmt.Errorf
	must       = u.Must
	panicIf    = u.PanicIf
	panicIfErr = u.PanicIfErr
	isWinOrMac = u.IsWinOrMac
	isLinux    = u.IsLinux
	formatSize = u.FormatSize
)

func ctx() context.Context {
	return context.Background()
}

func getCallstackFrames(skip int) []string {
	var callers [32]uintptr
	n := runtime.Callers(skip+1, callers[:])
	frames := runtime.CallersFrames(callers[:n])
	var cs []string
	for {
		frame, more := frames.Next()
		if !more {
			break
		}
		s := frame.File + ":" + strconv.Itoa(frame.Line)
		cs = append(cs, s)
	}
	return cs
}

func getCallstack(skip int) string {
	frames := getCallstackFrames(skip + 1)
	return strings.Join(frames, "\n")
}

func copyFilesRecurMust(srcDir, dstDir string) {
	srcDirLen := len(srcDir)
	onFile := func(path string, de fs.DirEntry) (bool, error) {
		dstPath := filepath.Join(dstDir, path[srcDirLen:])
		err := u.CopyFile(path, dstPath)
		panicIfErr(err)
		logf("copied '%s' to '%s'\n", path, dstPath)
		return false, nil
	}
	u.IterDir(srcDir, onFile)
}

func push[S ~[]E, E any](s *S, els ...E) {
	*s = append(*s, els...)
}

func sliceLimit[S ~[]E, E any](s S, max int) S {
	if len(s) > max {
		return s[:max]
	}
	return s
}

func waitForSigIntOrKill() {
	// Ctrl-C sends SIGINT
	sctx, stop := signal.NotifyContext(ctx(), os.Interrupt /*SIGINT*/, os.Kill /* SIGKILL */, syscall.SIGTERM)
	defer stop()
	<-sctx.Done()
}

func printFS(fsys fs.FS, startDir string) {
	logf("printFS('%s')\n", startDir)
	dfs := fsys.(fs.ReadDirFS)
	nFiles := 0
	u.IterReadDirFS(dfs, startDir, func(filePath string, d fs.DirEntry) error {
		logf("%s\n", filePath)
		nFiles++
		return nil
	})
	logf("%d files\n", nFiles)
}

func updateGoDeps(noProxy bool) {
	{
		cmd := exec.Command("go", "get", "-u", ".")
		cmd.Dir = "server"
		if noProxy {
			cmd.Env = append(os.Environ(), "GOPROXY=direct")
		}
		logf("running: %s in dir '%s'\n", cmd.String(), cmd.Dir)
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		err := cmd.Run()
		panicIf(err != nil, "go get failed with '%s'", err)
	}
	{
		cmd := exec.Command("go", "mod", "tidy")
		cmd.Dir = "server"
		logf("running: %s in dir '%s'\n", cmd.String(), cmd.Dir)
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		err := cmd.Run()
		panicIf(err != nil, "go get failed with '%s'", err)
	}
}
