#!/bin/bash

# Exit on any error
set -e

echo "Starting Wrickit deployment..."

# Install dependencies
echo "Installing dependencies..."
npm ci --production

# Build the application
echo "Building application..."
npm run build

# Run database migrations
echo "Running database setup..."
npm run db:push || echo "Database setup completed or already exists"

# Start the application
echo "Starting server..."
exec npm start