#!/bin/bash

# Build and push API Docker image
# Usage: ./docker-build.sh [tag] [environment]

set -e

# Configuration
APP_NAME="api"
TAG=${1:-latest}
ENVIRONMENT=${2:-dev}
AWS_REGION=${AWS_REGION:-us-east-1}

# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# ECR repository URL
ECR_REPO="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/xo-market-${ENVIRONMENT}-${APP_NAME}"

echo "Building ${APP_NAME} Docker image..."
echo "Environment: ${ENVIRONMENT}"
echo "Tag: ${TAG}"
echo "ECR Repository: ${ECR_REPO}"

# Build the Docker image from the project root
# The Dockerfile expects to be run from the monorepo root
cd ../../../  # Go back to project root

docker build -f infrastructure/apps/api/Dockerfile -t ${ECR_REPO}:${TAG} .

# Login to ECR
echo "Logging into ECR..."
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REPO}

# Push the image
echo "Pushing image to ECR..."
docker push ${ECR_REPO}:${TAG}

echo "Successfully pushed ${ECR_REPO}:${TAG}"

# Also tag and push as 'latest' if not already
if [ "$TAG" != "latest" ]; then
    docker tag ${ECR_REPO}:${TAG} ${ECR_REPO}:latest
    docker push ${ECR_REPO}:latest
    echo "Also pushed ${ECR_REPO}:latest"
fi