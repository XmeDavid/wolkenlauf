package providers

import (
	"context"
	"fmt"
	"strings"
	"time"

	"vm-provisioner/internal/config"
	"vm-provisioner/internal/models"
	"vm-provisioner/internal/utils"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	"github.com/aws/aws-sdk-go-v2/service/ec2/types"
)

type AWSProvider struct {
	client *ec2.Client
	config config.AWSConfig
}

var awsGPUInstances = map[string]bool{
	"g4dn.xlarge":    true,
	"g4dn.2xlarge":   true,
	"g4dn.4xlarge":   true,
	"g4dn.8xlarge":   true,
	"g4dn.12xlarge":  true,
	"g4dn.16xlarge":  true,
	"g4dn.metal":     true,
	"p3.2xlarge":     true,
	"p3.8xlarge":     true,
	"p3.16xlarge":    true,
	"p3dn.24xlarge":  true,
	"p4d.24xlarge":   true,
	"g5.xlarge":      true,
	"g5.2xlarge":     true,
	"g5.4xlarge":     true,
	"g5.8xlarge":     true,
	"g5.12xlarge":    true,
	"g5.16xlarge":    true,
	"g5.24xlarge":    true,
	"g5.48xlarge":    true,
}

func NewAWSProvider(cfg config.AWSConfig) (*AWSProvider, error) {
	awsCfg, err := awsconfig.LoadDefaultConfig(context.TODO(),
		awsconfig.WithRegion(cfg.Region),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to load AWS config: %w", err)
	}

	return &AWSProvider{
		client: ec2.NewFromConfig(awsCfg),
		config: cfg,
	}, nil
}

func (p *AWSProvider) SupportsInstanceType(instanceType string) bool {
	// AWS supports both CPU and GPU instances
	return strings.HasPrefix(instanceType, "t3.") ||
		strings.HasPrefix(instanceType, "t2.") ||
		strings.HasPrefix(instanceType, "m5.") ||
		strings.HasPrefix(instanceType, "c5.") ||
		awsGPUInstances[instanceType]
}

func (p *AWSProvider) CreateVM(req *models.VMRequest) (*models.VMResponse, error) {
	// Generate SSH credentials
	sshPassword := utils.GenerateRandomPassword(16)
	
	// Get the correct AMI for the region
	ami := req.Image
	if ami == "" {
		var err error
		if awsGPUInstances[req.InstanceType] {
			// Find latest Deep Learning AMI
			ami, err = p.getLatestDeepLearningAMI(req.Region)
			if err != nil {
				fmt.Printf("⚠️  Deep Learning AMI not found, falling back to Ubuntu: %v\n", err)
				// Fallback to Ubuntu if Deep Learning AMI not found
				ami, err = p.getLatestUbuntuAMI(req.Region)
				if err != nil {
					return nil, fmt.Errorf("failed to find suitable AMI: %w", err)
				}
			}
		} else {
			// Find latest Ubuntu 20.04 LTS
			ami, err = p.getLatestUbuntuAMI(req.Region)
			if err != nil {
				return nil, fmt.Errorf("failed to find Ubuntu AMI: %w", err)
			}
		}
	}

	fmt.Printf("🖼️  Using AMI: %s for region %s\n", ami, req.Region)

	// Create or get security group that allows SSH
	securityGroupID, err := p.ensureSSHSecurityGroup()
	if err != nil {
		return nil, fmt.Errorf("failed to create security group: %w", err)
	}

	// Determine the correct username for the AMI
	sshUsername := "ec2-user" // Amazon Linux 2 default
	if strings.Contains(strings.ToLower(ami), "ubuntu") {
		sshUsername = "ubuntu"
	}

	// Generate cloud-init script
	cloudInitScript := fmt.Sprintf(`#!/bin/bash
# Set up SSH access for %s user
echo '%s:%s' | chpasswd
sed -i 's/PasswordAuthentication no/PasswordAuthentication yes/' /etc/ssh/sshd_config
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config
systemctl restart sshd

# Install basic tools (detect package manager)
if command -v yum &> /dev/null; then
    # Amazon Linux 2
    yum update -y
    yum install -y htop git curl wget python3 pip3
elif command -v apt-get &> /dev/null; then
    # Ubuntu
    apt-get update
    apt-get install -y htop git curl wget python3 python3-pip
fi

# For GPU instances, verify CUDA installation
if command -v nvidia-smi &> /dev/null; then
    echo "✅ GPU detected: $(nvidia-smi --query-gpu=name --format=csv,noheader,nounits)"
    echo "✅ CUDA version: $(nvcc --version | grep release)"
fi

# Create welcome message
cat > /etc/motd << 'EOF'
🚀 Welcome to your Wolkenlauf VM!

Instance Type: %s
Provider: AWS
SSH Username: %s
SSH Password: %s

Commands to try:
- htop: System monitoring
- nvidia-smi: GPU status (if GPU instance)
- python3: Python interpreter

Happy coding! 🎉
EOF

echo "✅ VM setup complete!"
`, sshUsername, sshUsername, sshPassword, req.InstanceType, sshUsername, sshPassword)

	// Create EC2 instance
	runInput := &ec2.RunInstancesInput{
		ImageId:          aws.String(ami),
		InstanceType:     types.InstanceType(req.InstanceType),
		MinCount:         aws.Int32(1),
		MaxCount:         aws.Int32(1),
		SecurityGroupIds: []string{securityGroupID},
		UserData:         aws.String(utils.EncodeBase64(cloudInitScript)),
		TagSpecifications: []types.TagSpecification{
			{
				ResourceType: types.ResourceTypeInstance,
				Tags: []types.Tag{
					{Key: aws.String("Name"), Value: aws.String(req.Name)},
					{Key: aws.String("Provider"), Value: aws.String("wolkenlauf")},
					{Key: aws.String("UserID"), Value: aws.String(req.UserID)},
					{Key: aws.String("CreatedAt"), Value: aws.String(time.Now().Format(time.RFC3339))},
				},
			},
		},
	}

	// Handle spot instances
	if req.UseSpotInstance {
		runInput.InstanceMarketOptions = &types.InstanceMarketOptionsRequest{
			MarketType: types.MarketTypeSpot,
			SpotOptions: &types.SpotMarketOptions{
				SpotInstanceType: types.SpotInstanceTypeOneTime,
			},
		}
	}

	result, err := p.client.RunInstances(context.TODO(), runInput)
	if err != nil {
		return nil, fmt.Errorf("failed to create EC2 instance: %w", err)
	}

	instance := result.Instances[0]
	instanceID := *instance.InstanceId

	// For now, don't allocate Elastic IP - use the instance's natural public IP
	// The monitoring will update the correct IP when the instance is running

	return &models.VMResponse{
		ID:           instanceID,
		Name:         req.Name,
		Provider:     "aws",
		InstanceType: req.InstanceType,
		Region:       req.Region,
		Status:       "pending",
		PublicIP:     "", // Will be updated when instance is running
		SSHUsername:  sshUsername,
		SSHPassword:  sshPassword,
		Image:        ami,
		CreatedAt:    time.Now(),
	}, nil
}

func (p *AWSProvider) DeleteVM(id string) error {
	// Get instance details to find associated Elastic IP
	describeResult, err := p.client.DescribeInstances(context.TODO(), &ec2.DescribeInstancesInput{
		InstanceIds: []string{id},
	})
	if err != nil {
		return fmt.Errorf("failed to describe instance: %w", err)
	}

	// Release Elastic IP if associated
	if len(describeResult.Reservations) > 0 && len(describeResult.Reservations[0].Instances) > 0 {
		instance := describeResult.Reservations[0].Instances[0]
		if instance.PublicIpAddress != nil {
			// Find and release the Elastic IP
			addressesResult, err := p.client.DescribeAddresses(context.TODO(), &ec2.DescribeAddressesInput{
				PublicIps: []string{*instance.PublicIpAddress},
			})
			if err == nil && len(addressesResult.Addresses) > 0 {
				allocationID := addressesResult.Addresses[0].AllocationId
				if allocationID != nil {
					p.client.ReleaseAddress(context.TODO(), &ec2.ReleaseAddressInput{
						AllocationId: allocationID,
					})
				}
			}
		}
	}

	// Terminate the instance
	_, err = p.client.TerminateInstances(context.TODO(), &ec2.TerminateInstancesInput{
		InstanceIds: []string{id},
	})
	if err != nil {
		return fmt.Errorf("failed to terminate instance: %w", err)
	}

	return nil
}

func (p *AWSProvider) GetVMStatus(id string) (*models.VMStatus, error) {
	result, err := p.client.DescribeInstances(context.TODO(), &ec2.DescribeInstancesInput{
		InstanceIds: []string{id},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to describe instance: %w", err)
	}

	if len(result.Reservations) == 0 || len(result.Reservations[0].Instances) == 0 {
		return nil, fmt.Errorf("instance not found")
	}

	instance := result.Reservations[0].Instances[0]
	status := string(instance.State.Name)
	
	// Convert AWS states to our standard states
	switch status {
	case "pending":
		status = "pending"
	case "running":
		status = "running"
	case "stopping", "stopped":
		status = "stopped"
	case "terminating", "terminated":
		status = "terminated"
	}

	publicIP := ""
	if instance.PublicIpAddress != nil {
		publicIP = *instance.PublicIpAddress
	}

	return &models.VMStatus{
		ID:        id,
		Status:    status,
		PublicIP:  publicIP,
		UpdatedAt: time.Now(),
	}, nil
}

// Helper function to find the latest Ubuntu 20.04 LTS AMI
func (p *AWSProvider) getLatestUbuntuAMI(region string) (string, error) {
	// Try Amazon Linux 2 first (more stable and widely available)
	ami, err := p.searchAMI("amzn2-ami-hvm-*-x86_64-gp2", "amazon")
	if err == nil {
		return ami, nil
	}
	
	// Fallback to Ubuntu
	return p.searchAMI("ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server-*", "099720109477")
}

// Helper function to find the latest Deep Learning AMI
func (p *AWSProvider) getLatestDeepLearningAMI(region string) (string, error) {
	// Try various Deep Learning AMI patterns
	patterns := []string{
		"Deep Learning AMI (Ubuntu 20.04)*",
		"Deep Learning AMI (Ubuntu 18.04)*", 
		"Deep Learning AMI GPU*",
	}
	
	for _, pattern := range patterns {
		ami, err := p.searchAMI(pattern, "amazon")
		if err == nil {
			return ami, nil
		}
	}
	
	// If no Deep Learning AMI found, fallback to regular Ubuntu
	return p.getLatestUbuntuAMI(region)
}

// Generic AMI search function
func (p *AWSProvider) searchAMI(namePattern, owner string) (string, error) {
	input := &ec2.DescribeImagesInput{
		Filters: []types.Filter{
			{
				Name:   aws.String("name"),
				Values: []string{namePattern},
			},
			{
				Name:   aws.String("state"),
				Values: []string{"available"},
			},
		},
		Owners: []string{owner},
	}

	result, err := p.client.DescribeImages(context.TODO(), input)
	if err != nil {
		return "", fmt.Errorf("failed to search for AMI: %w", err)
	}

	if len(result.Images) == 0 {
		return "", fmt.Errorf("no AMI found matching pattern: %s", namePattern)
	}

	// Find the most recent AMI
	latestAMI := result.Images[0]
	for _, image := range result.Images {
		if image.CreationDate != nil && latestAMI.CreationDate != nil {
			if *image.CreationDate > *latestAMI.CreationDate {
				latestAMI = image
			}
		}
	}

	return *latestAMI.ImageId, nil
}

// ensureSSHSecurityGroup creates or gets a security group that allows SSH access
func (p *AWSProvider) ensureSSHSecurityGroup() (string, error) {
	ctx := context.TODO()
	
	// Try to find existing security group
	groupName := "wolkenlauf-ssh-access"
	describeResult, err := p.client.DescribeSecurityGroups(ctx, &ec2.DescribeSecurityGroupsInput{
		Filters: []types.Filter{
			{
				Name:   aws.String("group-name"),
				Values: []string{groupName},
			},
		},
	})
	
	if err == nil && len(describeResult.SecurityGroups) > 0 {
		// Security group already exists
		return *describeResult.SecurityGroups[0].GroupId, nil
	}
	
	// Get default VPC
	vpcs, err := p.client.DescribeVpcs(ctx, &ec2.DescribeVpcsInput{
		Filters: []types.Filter{
			{
				Name:   aws.String("is-default"),
				Values: []string{"true"},
			},
		},
	})
	if err != nil {
		return "", fmt.Errorf("failed to find default VPC: %w", err)
	}
	
	if len(vpcs.Vpcs) == 0 {
		return "", fmt.Errorf("no default VPC found")
	}
	
	vpcID := *vpcs.Vpcs[0].VpcId
	
	// Create security group
	createResult, err := p.client.CreateSecurityGroup(ctx, &ec2.CreateSecurityGroupInput{
		GroupName:   aws.String(groupName),
		Description: aws.String("Wolkenlauf SSH access security group"),
		VpcId:       aws.String(vpcID),
		TagSpecifications: []types.TagSpecification{
			{
				ResourceType: types.ResourceTypeSecurityGroup,
				Tags: []types.Tag{
					{Key: aws.String("Name"), Value: aws.String(groupName)},
					{Key: aws.String("ManagedBy"), Value: aws.String("wolkenlauf")},
				},
			},
		},
	})
	if err != nil {
		return "", fmt.Errorf("failed to create security group: %w", err)
	}
	
	securityGroupID := *createResult.GroupId
	
	// Add SSH rule (port 22)
	_, err = p.client.AuthorizeSecurityGroupIngress(ctx, &ec2.AuthorizeSecurityGroupIngressInput{
		GroupId: aws.String(securityGroupID),
		IpPermissions: []types.IpPermission{
			{
				IpProtocol: aws.String("tcp"),
				FromPort:   aws.Int32(22),
				ToPort:     aws.Int32(22),
				IpRanges: []types.IpRange{
					{
						CidrIp:      aws.String("0.0.0.0/0"),
						Description: aws.String("SSH access from anywhere"),
					},
				},
			},
		},
	})
	if err != nil {
		return "", fmt.Errorf("failed to add SSH rule: %w", err)
	}
	
	fmt.Printf("🔒 Created security group %s with SSH access\n", securityGroupID)
	return securityGroupID, nil
}