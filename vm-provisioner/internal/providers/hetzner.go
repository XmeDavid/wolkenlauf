package providers

import (
	"context"
	"fmt"
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
	"cx11":  true, // 1 vCPU, 2 GB RAM
	"cx21":  true, // 2 vCPU, 4 GB RAM
	"cx31":  true, // 2 vCPU, 8 GB RAM
	"cx41":  true, // 4 vCPU, 16 GB RAM
	"cx51":  true, // 8 vCPU, 32 GB RAM
	"cpx11": true, // 2 vCPU, 2 GB RAM (AMD)
	"cpx21": true, // 3 vCPU, 4 GB RAM (AMD)
	"cpx31": true, // 4 vCPU, 8 GB RAM (AMD)
	"cpx41": true, // 8 vCPU, 16 GB RAM (AMD)
	"cpx51": true, // 16 vCPU, 32 GB RAM (AMD)
}

func NewHetznerProvider(cfg config.HetznerConfig) (*HetznerProvider, error) {
	if cfg.Token == "" {
		return nil, fmt.Errorf("Hetzner token is required")
	}

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

	// Generate SSH credentials
	sshPassword := utils.GenerateRandomPassword(16)

	// Get server type
	serverType, _, err := p.client.ServerType.GetByName(ctx, req.InstanceType)
	if err != nil {
		return nil, fmt.Errorf("invalid instance type %s: %w", req.InstanceType, err)
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

	// Create server
	createOpts := hcloud.ServerCreateOpts{
		Name:       req.Name,
		ServerType: serverType,
		Image:      image,
		Datacenter: datacenter,
		UserData:   cloudInitScript,
		Labels: map[string]string{
			"provider":   "wolkenlauf",
			"user-id":    req.UserID,
			"created-at": time.Now().Format(time.RFC3339),
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
	fmt.Sscanf(id, "%d", &serverID)

	server, _, err := p.client.Server.GetByID(ctx, serverID)
	if err != nil {
		return nil, fmt.Errorf("failed to get server status: %w", err)
	}

	if server == nil {
		return nil, fmt.Errorf("server not found")
	}

	// Convert Hetzner status to our standard status
	status := strings.ToLower(string(server.Status))
	switch status {
	case "initializing":
		status = "pending"
	case "running":
		status = "running"
	case "off":
		status = "stopped"
	case "deleting":
		status = "terminated"
	}

	publicIP := ""
	if server.PublicNet.IPv4.IP != nil {
		publicIP = server.PublicNet.IPv4.IP.String()
	}

	return &models.VMStatus{
		ID:        id,
		Status:    status,
		PublicIP:  publicIP,
		UpdatedAt: time.Now(),
	}, nil
}