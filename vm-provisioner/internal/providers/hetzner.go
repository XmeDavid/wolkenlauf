package providers

import (
	"context"
	"fmt"
	"regexp"
	"strings"
	"time"

	"vm-provisioner/internal/config"
	"vm-provisioner/internal/models"
	"vm-provisioner/internal/utils"

	"github.com/hetznercloud/hcloud-go/v2/hcloud"
)

type HetznerProvider struct {
	client *hcloud.Client
	config config.HetznerConfig
}

var hetznerInstanceTypes = map[string]bool{
	"cpx11": true, // 2 vCPU, 2 GB RAM (AMD)
	"cpx21": true, // 3 vCPU, 4 GB RAM (AMD)
	"cpx31": true, // 4 vCPU, 8 GB RAM (AMD)
	"cpx41": true, // 8 vCPU, 16 GB RAM (AMD)
	"cpx51": true, // 16 vCPU, 32 GB RAM (AMD)
	"cax11": true, // 2 vCPU, 4 GB RAM (ARM)
	"cax21": true, // 4 vCPU, 8 GB RAM (ARM)
	"cax31": true, // 8 vCPU, 16 GB RAM (ARM)
	"cax41": true, // 16 vCPU, 32 GB RAM (ARM)
	"cx22":  true, // 2 vCPU, 4 GB RAM (Intel)
	"cx32":  true, // 4 vCPU, 8 GB RAM (Intel)
	"cx42":  true, // 8 vCPU, 16 GB RAM (Intel)
	"cx52":  true, // 16 vCPU, 32 GB RAM (Intel)
}

func NewHetznerProvider(cfg config.HetznerConfig) (*HetznerProvider, error) {
	if cfg.Token == "" {
		return nil, fmt.Errorf("Hetzner token is required")
	}

	fmt.Printf("🔑 Initializing Hetzner provider with token: %s...%s\n", 
		cfg.Token[:8], cfg.Token[len(cfg.Token)-8:])

	client := hcloud.NewClient(hcloud.WithToken(cfg.Token))

	return &HetznerProvider{
		client: client,
		config: cfg,
	}, nil
}

func (p *HetznerProvider) SupportsInstanceType(instanceType string) bool {
	return hetznerInstanceTypes[instanceType]
}

func (p *HetznerProvider) CreateVM(req *models.VMRequest) (*models.VMResponse, error) {
	ctx := context.Background()

	// Test API connection first
	fmt.Printf("🔍 Testing Hetzner API connection...\n")
	serverTypes, _, err := p.client.ServerType.List(ctx, hcloud.ServerTypeListOpts{})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to Hetzner API: %w", err)
	}
	fmt.Printf("✅ Successfully connected to Hetzner API, found %d server types\n", len(serverTypes))

	// Generate SSH credentials
	sshPassword := utils.GenerateRandomPassword(16)

	// Get server type
	fmt.Printf("🔍 Looking for server type: %s\n", req.InstanceType)
	
	// First, let's see all available server types
	fmt.Printf("🔍 Available Hetzner server types:\n")
	for _, st := range serverTypes {
		fmt.Printf("  - %s: %d CPU, %.1fGB RAM\n", 
			st.Name, st.Cores, st.Memory)
	}
	
	serverType, _, err := p.client.ServerType.GetByName(ctx, req.InstanceType)
	if err != nil {
		return nil, fmt.Errorf("invalid instance type '%s' - see available types above: %w", req.InstanceType, err)
	}

	// Get datacenter/location
	datacenter, _, err := p.client.Datacenter.GetByName(ctx, req.Region)
	if err != nil {
		// Try as location instead
		location, _, err := p.client.Location.GetByName(ctx, req.Region)
		if err != nil {
			return nil, fmt.Errorf("invalid region %s: %w", req.Region, err)
		}
		// Get first datacenter from location
		datacenters, _, err := p.client.Datacenter.List(ctx, hcloud.DatacenterListOpts{})
		if err != nil {
			return nil, fmt.Errorf("failed to list datacenters: %w", err)
		}
		for _, dc := range datacenters {
			if dc.Location.Name == location.Name {
				datacenter = dc
				break
			}
		}
		if datacenter == nil {
			return nil, fmt.Errorf("no datacenter found for location %s", req.Region)
		}
	}

	// Get image
	imageName := req.Image
	if imageName == "" {
		imageName = "ubuntu-20.04"
	}
	
	image, _, err := p.client.Image.GetByName(ctx, imageName)
	if err != nil {
		return nil, fmt.Errorf("invalid image %s: %w", imageName, err)
	}

	// Generate cloud-init script
	cloudInitScript := fmt.Sprintf(`#!/bin/bash
# Set up SSH access
echo 'root:%s' | chpasswd
sed -i 's/PasswordAuthentication no/PasswordAuthentication yes/' /etc/ssh/sshd_config
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config
systemctl restart sshd

# Install basic development tools
apt-get update
apt-get install -y htop git curl wget build-essential python3 python3-pip nodejs npm docker.io

# Add user to docker group
usermod -aG docker root

# Install Python ML libraries (CPU versions)
pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
pip3 install tensorflow-cpu scikit-learn jupyter matplotlib pandas numpy

# Create welcome message
cat > /etc/motd << 'EOF'
🚀 Welcome to your Wolkenlauf VM!

Instance Type: %s
Provider: Hetzner Cloud
SSH Password: %s

Pre-installed software:
- Python 3 with PyTorch (CPU), TensorFlow (CPU), Jupyter
- Node.js and npm
- Docker
- Git and development tools

Note: This is a CPU-only instance. For GPU workloads, use AWS instances.

Happy coding! 🎉
EOF

echo "✅ Hetzner VM setup complete!"
`, sshPassword, req.InstanceType, sshPassword)

	// Sanitize server name for Hetzner (alphanumeric + hyphens only, max 63 chars)
	sanitizedName := sanitizeHetznerName(req.Name)

	// Create server
	createOpts := hcloud.ServerCreateOpts{
		Name:       sanitizedName,
		ServerType: serverType,
		Image:      image,
		Datacenter: datacenter,
		UserData:   cloudInitScript,
		Labels: map[string]string{
			"provider": "wolkenlauf",
			"managed":  "true",
		},
	}

	result, _, err := p.client.Server.Create(ctx, createOpts)
	if err != nil {
		return nil, fmt.Errorf("failed to create Hetzner server: %w", err)
	}

	server := result.Server
	publicIP := ""
	if server.PublicNet.IPv4.IP != nil {
		publicIP = server.PublicNet.IPv4.IP.String()
	}

	return &models.VMResponse{
		ID:           fmt.Sprintf("%d", server.ID),
		Name:         req.Name,
		Provider:     "hetzner",
		InstanceType: req.InstanceType,
		Region:       req.Region,
		Status:       "pending",
		PublicIP:     publicIP,
		SSHUsername:  "root",
		SSHPassword:  sshPassword,
		CreatedAt:    time.Now(),
	}, nil
}

func (p *HetznerProvider) DeleteVM(id string) error {
	ctx := context.Background()

	// Convert string ID to int64
	var serverID int64
	fmt.Sscanf(id, "%d", &serverID)

	server, _, err := p.client.Server.GetByID(ctx, serverID)
	if err != nil {
		return fmt.Errorf("failed to find server: %w", err)
	}

	if server == nil {
		return fmt.Errorf("server not found")
	}

	_, err = p.client.Server.Delete(ctx, server)
	if err != nil {
		return fmt.Errorf("failed to delete server: %w", err)
	}

	return nil
}

func (p *HetznerProvider) GetVMStatus(id string) (*models.VMStatus, error) {
	ctx := context.Background()

	// Convert string ID to int64
	var serverID int64
	n, err := fmt.Sscanf(id, "%d", &serverID)
	if err != nil || n != 1 {
		return nil, fmt.Errorf("invalid server ID format '%s': %w", id, err)
	}

	fmt.Printf("🔍 Checking Hetzner server status for ID: %s (parsed as %d)\n", id, serverID)

	server, _, err := p.client.Server.GetByID(ctx, serverID)
	if err != nil {
		return nil, fmt.Errorf("failed to get server status: %w", err)
	}

	if server == nil {
		return nil, fmt.Errorf("server not found")
	}

	// Log the raw status from Hetzner API
	rawStatus := string(server.Status)
	fmt.Printf("📊 Raw Hetzner server status: '%s'\n", rawStatus)

	// Convert Hetzner status to our standard status
	status := strings.ToLower(rawStatus)
	originalStatus := status
	
	switch status {
	case "initializing":
		status = "pending"
	case "starting":
		status = "pending"
	case "running":
		status = "running"
	case "stopping":
		status = "stopping"
	case "off":
		status = "stopped"
	case "deleting":
		status = "terminated"
	default:
		// Log unknown status for debugging
		fmt.Printf("⚠️  Unknown Hetzner status '%s', defaulting to 'pending'\n", originalStatus)
		status = "pending"
	}

	publicIP := ""
	if server.PublicNet.IPv4.IP != nil {
		publicIP = server.PublicNet.IPv4.IP.String()
	}

	fmt.Printf("📡 Hetzner VM %s: Status %s -> %s, IP: %s\n", id, originalStatus, status, publicIP)

	return &models.VMStatus{
		ID:        id,
		Status:    status,
		PublicIP:  publicIP,
		UpdatedAt: time.Now(),
	}, nil
}

// sanitizeHetznerName cleans the name to meet Hetzner requirements
// Rules: alphanumeric + hyphens only, max 63 chars, no leading/trailing hyphens
func sanitizeHetznerName(name string) string {
	// Convert to lowercase
	name = strings.ToLower(name)
	
	// Replace invalid characters with hyphens
	reg := regexp.MustCompile(`[^a-z0-9-]`)
	name = reg.ReplaceAllString(name, "-")
	
	// Remove multiple consecutive hyphens
	reg = regexp.MustCompile(`-+`)
	name = reg.ReplaceAllString(name, "-")
	
	// Remove leading and trailing hyphens
	name = strings.Trim(name, "-")
	
	// Ensure max length of 63 characters
	if len(name) > 63 {
		name = name[:63]
		name = strings.TrimRight(name, "-")
	}
	
	// Ensure name is not empty
	if name == "" {
		name = "wolkenlauf-vm"
	}
	
	return name
}