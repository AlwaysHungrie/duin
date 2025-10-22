#!/bin/bash

# Script to set up swap file for memory-constrained servers
# Run with: sudo bash setup-swap.sh

echo "Setting up swap file for Next.js build optimization..."

# Check if swap already exists
if [ -f /swapfile ]; then
    echo "Swap file already exists. Current swap status:"
    swapon --show
    exit 0
fi

# Create 4GB swap file
echo "Creating 4GB swap file..."
sudo fallocate -l 4G /swapfile

# Set proper permissions
sudo chmod 600 /swapfile

# Set up swap
sudo mkswap /swapfile

# Enable swap
sudo swapon /swapfile

# Make it permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Optimize swap settings
echo "Optimizing swap settings..."
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
echo 'vm.vfs_cache_pressure=50' | sudo tee -a /etc/sysctl.conf

# Apply settings
sudo sysctl -p

echo "Swap file setup complete!"
echo "Current memory status:"
free -h
echo ""
echo "Swap status:"
swapon --show
