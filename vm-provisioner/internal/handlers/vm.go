package handlers

import (
	"fmt"
	"log"
	"net/http"

	"vm-provisioner/internal/models"

	"github.com/gin-gonic/gin"
)

type VMHandler struct {
	awsProvider     models.CloudProvider
	hetznerProvider models.CloudProvider
}

func NewVMHandler(aws, hetzner models.CloudProvider) *VMHandler {
	return &VMHandler{
		awsProvider:     aws,
		hetznerProvider: hetzner,
	}
}

func (h *VMHandler) getProvider(providerName string) models.CloudProvider {
	switch providerName {
	case "aws":
		return h.awsProvider
	case "hetzner":
		return h.hetznerProvider
	default:
		return nil
	}
}

func (h *VMHandler) CreateVM(c *gin.Context) {
	var req models.VMRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("❌ Invalid request body: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.Printf("📝 Received VM request: %+v", req)

	log.Printf("🚀 Creating VM: %s (%s %s in %s)", req.Name, req.Provider, req.InstanceType, req.Region)

	// Get the appropriate provider
	provider := h.getProvider(req.Provider)
	if provider == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("unsupported provider: %s", req.Provider)})
		return
	}

	// Validate instance type for provider
	if !provider.SupportsInstanceType(req.InstanceType) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": fmt.Sprintf("instance type %s not supported by provider %s", req.InstanceType, req.Provider),
		})
		return
	}

	// Create the VM
	response, err := provider.CreateVM(&req)
	if err != nil {
		log.Printf("❌ Failed to create VM: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	log.Printf("✅ VM created successfully: %s (ID: %s, IP: %s)", response.Name, response.ID, response.PublicIP)
	c.JSON(http.StatusCreated, response)
}

func (h *VMHandler) DeleteVM(c *gin.Context) {
	id := c.Param("id")
	provider := c.Query("provider")

	if provider == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "provider query parameter is required"})
		return
	}

	log.Printf("🗑️  Deleting VM: %s (%s)", id, provider)

	// Get the appropriate provider
	cloudProvider := h.getProvider(provider)
	if cloudProvider == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("unsupported provider: %s", provider)})
		return
	}

	// Delete the VM
	if err := cloudProvider.DeleteVM(id); err != nil {
		log.Printf("❌ Failed to delete VM: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	log.Printf("✅ VM deleted successfully: %s", id)
	c.JSON(http.StatusOK, gin.H{"message": "VM deleted successfully"})
}

func (h *VMHandler) GetVMStatus(c *gin.Context) {
	id := c.Param("id")
	provider := c.Query("provider")

	if provider == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "provider query parameter is required"})
		return
	}

	// Get the appropriate provider
	cloudProvider := h.getProvider(provider)
	if cloudProvider == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("unsupported provider: %s", provider)})
		return
	}

	// Get VM status
	status, err := cloudProvider.GetVMStatus(id)
	if err != nil {
		log.Printf("❌ Failed to get VM status: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, status)
}