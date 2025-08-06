#!/bin/bash

# Build and push all Docker images
# Usage: ./build-all.sh [tag] [environment]

set -e

TAG=${1:-latest}
ENVIRONMENT=${2:-dev}

echo "Building all Docker images for environment: ${ENVIRONMENT}"
echo "Tag: ${TAG}"
echo ""

# Build API
echo "=== Building API ==="
cd api
./docker-build.sh ${TAG} ${ENVIRONMENT}
cd ..

echo ""

# Build Worker  
echo "=== Building Worker ==="
cd worker
./docker-build.sh ${TAG} ${ENVIRONMENT}
cd ..

echo ""
echo "✅ All images built and pushed successfully!"
echo ""
echo "Next steps:"
echo "1. Update your terraform.tfvars with the new image URLs:"
echo "   api_container_image    = \"$(aws sts get-caller-identity --query Account --output text).dkr.ecr.${AWS_REGION:-us-east-1}.amazonaws.com/xo-market-${ENVIRONMENT}-api:${TAG}\""
echo "   worker_container_image = \"$(aws sts get-caller-identity --query Account --output text).dkr.ecr.${AWS_REGION:-us-east-1}.amazonaws.com/xo-market-${ENVIRONMENT}-worker:${TAG}\""
echo ""
echo "2. Apply your Terraform configuration:"
echo "   cd ../environments/${ENVIRONMENT}"
echo "   terraform apply"