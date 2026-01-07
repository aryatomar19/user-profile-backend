#!/bin/bash

echo "=============================="
echo "Starting Backend Deployment..."
echo "=============================="

echo "Pulling latest code..."
git pull origin main

echo "Installing dependencies..."
npm install

echo "Restarting backend service..."
sudo systemctl restart user-profile-backend

echo "Checking service status..."
sudo systemctl status user-profile-backend --no-pager

echo "=============================="
echo "Backend Deployment Completed!"
echo "=============================="
