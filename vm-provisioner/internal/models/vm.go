package models

import "time"

// VMRequest represents a request to create a new VM
type VMRequest struct {
	Name                 string `json:"name" binding:"required"`
	Provider             string `json:"provider" binding:"required"` // "aws" or "hetzner"
	InstanceType         string `json:"instanceType" binding:"required"`
	Region               string `json:"region" binding:"required"`
	UseSpotInstance      bool   `json:"useSpotInstance,omitempty"`
	Image                string `json:"image,omitempty"`
	AutoTerminateMinutes int    `json:"autoTerminateMinutes,omitempty"`
	UserID               string `json:"userId" binding:"required"`
}

// VMResponse represents the response when creating a VM
type VMResponse struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	Provider     string    `json:"provider"`
	InstanceType string    `json:"instanceType"`
	Region       string    `json:"region"`
	Status       string    `json:"status"`
	PublicIP     string    `json:"publicIp,omitempty"`
	SSHUsername  string    `json:"sshUsername,omitempty"`
	SSHPassword  string    `json:"sshPassword,omitempty"`
	Image        string    `json:"image,omitempty"`
	CreatedAt    time.Time `json:"createdAt"`
}

// VMStatus represents the current status of a VM
type VMStatus struct {
	ID        string `json:"id"`
	Status    string `json:"status"`
	PublicIP  string `json:"publicIp,omitempty"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// Provider interface that both AWS and Hetzner must implement
type CloudProvider interface {
	CreateVM(req *VMRequest) (*VMResponse, error)
	DeleteVM(id string) error
	GetVMStatus(id string) (*VMStatus, error)
	SupportsInstanceType(instanceType string) bool
}