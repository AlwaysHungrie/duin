#!/bin/bash

# Script to expand existing swap file for Next.js build optimization
# Run with: sudo bash expand-swap.sh

echo "Expanding existing swap file..."

# Check current swap status
echo "Current swap status:"
swapon --show
echo ""

# Disable current swap
echo "Disabling current swap..."
sudo swapoff /swapfile

# Remove old swap file
echo "Removing old swap file..."
sudo rm /swapfile

# Create new 6GB swap file (expanded from 2GB)
echo "Creating new 6GB swap file..."
sudo fallocate -l 6G /swapfile

# Set proper permissions
sudo chmod 600 /swapfile

# Set up swap
sudo mkswap /swapfile

# Enable swap
sudo swapon /swapfile

# Update fstab to reflect new size
sudo sed -i 's|/swapfile none swap sw 0 0|/swapfile none swap sw 0 0|' /etc/fstab

echo "Swap file expansion complete!"
echo ""
echo "New memory status:"
free -h
echo ""
echo "New swap status:"
swapon --show
