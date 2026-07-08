package main

import (
	"flag"
	"log"

	_ "smail/docs"
	"smail/microservices/folder/app"
)

// @title           Smail API
// @version         1.0
// @host            localhost:8083
// @BasePath        /
func main() {
	var configPath string
	flag.StringVar(&configPath, "config", "configs/folder/config.yaml", "path to config file")
	flag.Parse()

	application := app.New(configPath)
	if application == nil {
		log.Fatal("invalid config")
	}
	application.Run(configPath)
}
