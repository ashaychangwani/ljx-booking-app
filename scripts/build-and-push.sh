#!/bin/bash

# LJX Booking App - Multi-platform Docker Build and Push Script
# Usage: ./scripts/build-and-push.sh [dockerhub-username] [tag]
# Example: ./scripts/build-and-push.sh ashayc v1.2.0

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if buildx is available
if ! docker buildx version >/dev/null 2>&1; then
    print_error "Docker buildx is not available. Please ensure you have Docker Desktop or buildx plugin installed."
    exit 1
fi

# Parse arguments
DOCKERHUB_USERNAME=${1:-"ashayc"}
TAG=${2:-"latest"}
IMAGE_NAME="$DOCKERHUB_USERNAME/ljx-booking-app"
FULL_IMAGE_TAG="$IMAGE_NAME:$TAG"

print_info "Building and pushing multi-platform Docker image"
print_info "Username: $DOCKERHUB_USERNAME"
print_info "Image: $FULL_IMAGE_TAG"
print_info "Platforms: linux/amd64, linux/arm64"

# Check if user is logged into Docker Hub
if ! docker info | grep -q "Username:"; then
    print_warning "You may not be logged into Docker Hub. Run 'docker login' if the push fails."
fi

# Verify we're in the right directory
if [[ ! -f "Dockerfile" ]]; then
    print_error "Dockerfile not found. Please run this script from the project root directory."
    exit 1
fi

if [[ ! -f "package.json" ]]; then
    print_error "package.json not found. Please run this script from the project root directory."
    exit 1
fi

# Check if database file exists
if [[ ! -f "backend/database.sqlite" ]]; then
    print_warning "backend/database.sqlite not found. The image will be built without existing data."
fi

print_info "Starting multi-platform build..."

# Build and push multi-platform image (AMD64 FIRST for guaranteed compatibility)
print_info "Building for platforms: linux/amd64,linux/arm64 (AMD64 prioritized)"
docker buildx build \
    --platform linux/amd64,linux/arm64 \
    --tag "$FULL_IMAGE_TAG" \
    --push \
    .

if [[ $? -eq 0 ]]; then
    print_success "Multi-platform image built and pushed successfully!"
    print_success "Image: $FULL_IMAGE_TAG"
    print_info "The image supports both AMD64 and ARM64 architectures"
    print_info ""
    print_info "To use the image:"
    print_info "  docker pull $FULL_IMAGE_TAG"
    print_info "  docker run -d -p 3000:3000 -p 3001:3001 $FULL_IMAGE_TAG"
    print_info ""
    print_info "Or add to your docker-compose.yml:"
    print_info "  image: $FULL_IMAGE_TAG"
else
    print_error "Build failed. Please check the error messages above."
    exit 1
fi

# Optional: Test the image locally
read -p "Would you like to test the image locally? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Testing image locally..."
    
    # Stop any existing test container
    docker stop ljx-test-build 2>/dev/null || true
    docker rm ljx-test-build 2>/dev/null || true
    
    # Run test container
    print_info "Starting test container on ports 3102:3000 and 3103:3001..."
    docker run -d --name ljx-test-build -p 3102:3000 -p 3103:3001 "$FULL_IMAGE_TAG"
    
    # Wait for container to start
    sleep 10
    
    # Test health endpoint
    if curl -f http://localhost:3103/health >/dev/null 2>&1; then
        print_success "Health check passed! ✅"
        print_info "Frontend: http://localhost:3102"
        print_info "Backend: http://localhost:3103"
        print_info "Health: http://localhost:3103/health"
        
        read -p "Press enter to stop the test container..."
        docker stop ljx-test-build
        docker rm ljx-test-build
        print_success "Test container stopped and removed"
    else
        print_error "Health check failed ❌"
        print_info "Container logs:"
        docker logs ljx-test-build
        docker stop ljx-test-build
        docker rm ljx-test-build
    fi
fi

print_success "Script completed successfully! 🎉"