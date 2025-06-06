package main

import (
	"log"
	"os"

	"vm-provisioner/internal/config"
	"vm-provisioner/internal/handlers"
	"vm-provisioner/internal/providers"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: .env file not found, using environment variables")
	}

	// Load configuration
	cfg := config.Load()

	// Initialize cloud providers
	awsProvider, err := providers.NewAWSProvider(cfg.AWS)
	if err != nil {
		log.Fatalf("Failed to initialize AWS provider: %v", err)
	}

	hetznerProvider, err := providers.NewHetznerProvider(cfg.Hetzner)
	if err != nil {
		log.Fatalf("Failed to initialize Hetzner provider: %v", err)
	}

	// Initialize handlers
	handler := handlers.NewVMHandler(awsProvider, hetznerProvider)

	// Setup Gin router
	r := gin.Default()

	// Add CORS middleware
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "healthy"})
	})

	// Debug endpoint
	r.POST("/debug", func(c *gin.Context) {
		body, _ := c.GetRawData()
		log.Printf("🐛 Raw request body: %s", string(body))
		c.JSON(200, gin.H{"received": string(body)})
	})

	// VM management endpoints
	r.POST("/vm/create", handler.CreateVM)
	r.DELETE("/vm/:id", handler.DeleteVM)
	r.GET("/vm/:id/status", handler.GetVMStatus)

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🚀 VM Provisioner starting on port %s", port)
	log.Printf("📡 Supported providers: AWS (GPU), Hetzner (CPU)")
	
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}