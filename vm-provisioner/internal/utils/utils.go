package utils

import (
	"crypto/rand"
	"encoding/base64"
	"math/big"
)

// GenerateRandomPassword generates a random password of the specified length
func GenerateRandomPassword(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	
	password := make([]byte, length)
	for i := range password {
		num, _ := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
		password[i] = charset[num.Int64()]
	}
	
	return string(password)
}

// EncodeBase64 encodes a string to base64
func EncodeBase64(data string) string {
	return base64.StdEncoding.EncodeToString([]byte(data))
}