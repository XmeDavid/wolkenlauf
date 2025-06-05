package config

import (
	"os"
)

type Config struct {
	AWS     AWSConfig
	Hetzner HetznerConfig
}

type AWSConfig struct {
	Region          string
	AccessKeyID     string
	SecretAccessKey string
}

type HetznerConfig struct {
	Token string
}

func Load() *Config {
	return &Config{
		AWS: AWSConfig{
			Region:          getEnv("AWS_REGION", "us-east-1"),
			AccessKeyID:     getEnv("AWS_ACCESS_KEY_ID", ""),
			SecretAccessKey: getEnv("AWS_SECRET_ACCESS_KEY", ""),
		},
		Hetzner: HetznerConfig{
			Token: getEnv("HETZNER_TOKEN", ""),
		},
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}