package main

import (
	"flag"
	"log"

	_ "smail/docs"
	"smail/microservices/email/app"
)

// @title           Smail API
// @version         1.0
// @host            localhost:8082
// @BasePath        /
func main() {
	var configPath string
	flag.StringVar(&configPath, "config", "configs/email/config.yaml", "path to config file")
	flag.Parse()

	application := app.New(configPath)
	if application == nil {
		log.Fatal("invalid config")
	}
	application.Run(configPath)
}
