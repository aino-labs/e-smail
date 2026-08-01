package app

import (
	"fmt"
	"time"

	"smail/internal/app"
	"smail/internal/pkg/logger"
	"smail/internal/pkg/middleware"
	"smail/internal/pkg/utils"
	"smail/pkg/minio"
	"smail/pkg/postgres"

	"github.com/spf13/viper"
)

type AvatarConfig struct {
	MaxSizeMB    int64    `mapstructure:"max_size_mb"`
	AllowedTypes []string `mapstructure:"allowed_types"`
}

type GRPCConfig struct {
	UserPort string `mapstructure:"user_port"`
}

type GRPCClients struct {
	FolderService string `mapstructure:"folder_service"`
}

type RateLimitConfig struct {
	Rate      float64       `mapstructure:"rate_per_second"`
	Burst     float64       `mapstructure:"burst"`
	MaxFails  int           `mapstructure:"max_fails"`
	BaseBlock time.Duration `mapstructure:"base_block"`
	MaxBlock  time.Duration `mapstructure:"max_block"`
	TTL       time.Duration `mapstructure:"ttl"`

	TrustedProxies []string `mapstructure:"trusted_proxies"`
}

type Config struct {
	ServerPort string `mapstructure:"port"`

	JWTManager utils.JWTManager `mapstructure:"jwt"`

	CORS   middleware.CORSConfig `mapstructure:"cors"`
	Logger logger.Config         `mapstructure:"logger"`

	Db postgres.Config `mapstructure:"postgres"`
	S3 minio.Config    `mapstructure:"minio"`

	Avatar AvatarConfig `mapstructure:"avatar"`

	GRPC        GRPCConfig  `mapstructure:"grpc"`
	GRPCClients GRPCClients `mapstructure:"grpc_clients"`

	RateLimit RateLimitConfig `mapstructure:"rate_limit"`
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
