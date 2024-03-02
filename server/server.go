package main

import "embed"

var (
	//go:embed dist/*
	wwwFS embed.FS
	//go:embed secrets.env
	secretsEnv []byte
)

var (
	// must be same as vite.config.js
	proxyURLStr = "http://localhost:3025"
)
