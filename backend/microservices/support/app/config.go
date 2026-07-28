package app

import (
	"fmt"

	"smail/internal/app"
	"smail/internal/pkg/logger"
	"smail/internal/pkg/middleware"
	"smail/internal/pkg/utils"
	"smail/pkg/postgres"

	"github.com/spf13/viper"
)

type Config struct {
	ServerPort string `mapstructure:"port"`

	JWTManager utils.JWTManager `mapstructure:"jwt"`

	CORS   middleware.CORSConfig `mapstructure:"cors"`
	Logger logger.Config         `mapstructure:"logger"`

	Db postgres.Config `mapstructure:"postgres"`
}

func Load(path string) (*Config, error) {

	if err := app.Init(path); err != nil {
		return nil, fmt.Errorf(
			"error initializing config: %w",
			err,
		)
	}

	cfg := &Config{}

	if err := viper.Unmarshal(cfg); err != nil {
		return nil, fmt.Errorf(
			"error unmarshaling config: %w",
			err,
		)
	}

	return cfg, nil
}
