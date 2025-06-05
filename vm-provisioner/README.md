# VM Provisioner Backend

Multi-cloud VM provisioning service supporting AWS (GPU instances) and Hetzner Cloud (CPU instances).

## Features

🚀 **Multi-Cloud Support**
- **AWS EC2**: GPU instances for AI/ML training (g4dn, p3, p4d series)
- **Hetzner Cloud**: Cost-effective CPU instances for development

🔧 **Instance Types**
- **AWS GPU**: g4dn.xlarge (T4), p3.2xlarge (V100), p4d.24xlarge (8x A100)
- **AWS CPU**: t3.micro, t3.small, t3.medium, etc.
- **Hetzner**: cx11, cx21, cx31 (super cheap CPU instances)

⚡ **Smart Features**
- Spot instance support (AWS) for 70% cost savings
- Auto SSH setup with password authentication
- Pre-configured with ML libraries (PyTorch, TensorFlow)
- Elastic IP allocation for consistent access

## Quick Start

1. **Install dependencies**:
```bash
go mod tidy
```

2. **Set up environment variables**:
```bash
cp .env.example .env
# Edit .env with your AWS and Hetzner credentials
```

3. **Run the server**:
```bash
go run main.go
```

## API Endpoints

### Create VM
```bash
POST /vm/create
{
  "name": "my-gpu-vm",
  "provider": "aws",
  "instanceType": "g4dn.xlarge",
  "region": "us-east-1",
  "useSpotInstance": true,
  "userId": "user123"
}
```

### Delete VM
```bash
DELETE /vm/:id?provider=aws
```

### Get VM Status
```bash
GET /vm/:id/status?provider=aws
```

## Configuration

### AWS Setup
1. Create IAM user with EC2 permissions
2. Get Access Key ID and Secret Access Key
3. Set in environment variables

### Hetzner Setup
1. Get API token from Hetzner Cloud Console
2. Set HETZNER_TOKEN in environment variables

## Instance Types

### AWS GPU (AI/ML Training)
- `g4dn.xlarge`: 4 vCPU, 16GB RAM, T4 GPU (~$0.50/hr, spot: ~$0.15/hr)
- `p3.2xlarge`: 8 vCPU, 61GB RAM, V100 GPU (~$3/hr, spot: ~$1/hr)
- `p4d.24xlarge`: 96 vCPU, 1152GB RAM, 8x A100 GPU (~$33/hr, spot: ~$10/hr)

### Hetzner CPU (Development)
- `cx11`: 1 vCPU, 2GB RAM (~$0.005/hr)
- `cx21`: 2 vCPU, 4GB RAM (~$0.011/hr)
- `cx31`: 2 vCPU, 8GB RAM (~$0.021/hr)

## Pre-installed Software

### AWS GPU Instances
- CUDA drivers and toolkit
- PyTorch with GPU support
- TensorFlow with GPU support
- Jupyter notebooks
- nvidia-smi, nvtop

### Hetzner CPU Instances
- PyTorch (CPU version)
- TensorFlow (CPU version)
- Python 3, Node.js
- Docker
- Development tools

## Security

- SSH password authentication enabled
- Random password generation
- Proper firewall rules (security groups)
- Instance tagging for identification