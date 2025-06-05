package main

import (
	"context"
	"fmt"
	"log"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	"github.com/aws/aws-sdk-go-v2/service/ec2/types"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env file
	godotenv.Load()

	// Load AWS config
	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		log.Fatalf("Failed to load AWS config: %v", err)
	}

	client := ec2.NewFromConfig(cfg)

	fmt.Println("🔍 Testing AWS permissions...")

	// Test 1: List images (basic permission test)
	fmt.Println("Testing DescribeImages permission...")
	_, err = client.DescribeImages(context.TODO(), &ec2.DescribeImagesInput{
		Owners: []string{"amazon"},
		Filters: []types.Filter{
			{
				Name:   aws.String("name"),
				Values: []string{"amzn2-ami-hvm-*"},
			},
			{
				Name:   aws.String("state"),
				Values: []string{"available"},
			},
		},
		MaxResults: aws.Int32(5),
	})
	if err != nil {
		log.Fatalf("❌ DescribeImages failed: %v", err)
	}
	fmt.Println("✅ DescribeImages works!")

	// Test 2: List instances 
	fmt.Println("Testing DescribeInstances permission...")
	_, err = client.DescribeInstances(context.TODO(), &ec2.DescribeInstancesInput{
		MaxResults: aws.Int32(5),
	})
	if err != nil {
		log.Fatalf("❌ DescribeInstances failed: %v", err)
	}
	fmt.Println("✅ DescribeInstances works!")

	fmt.Println("🎉 Basic AWS permissions are working!")
	fmt.Println("You can now try creating a VM through the frontend.")
}