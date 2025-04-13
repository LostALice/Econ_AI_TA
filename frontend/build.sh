#!/bin/bash
# Code by AkinoAlice@TyrantRey

REMOTE_URL=$(git config --get remote.origin.url)

REPO_NAME=$(basename -s .git "$REMOTE_URL")

IMAGE_NAME="${REPO_NAME,,}"          
IMAGE_NAME="${IMAGE_NAME//-/_}"      
IMAGE_NAME="${IMAGE_NAME}_frontend"  

IMAGE_TAG=$(date +"%Y%m%d-%H%M%S")

echo "Building image: ${IMAGE_NAME}:${IMAGE_TAG}"

docker build -t "${IMAGE_NAME}:${IMAGE_TAG}" .

if [ $? -eq 0 ]; then
    echo "Docker image ${IMAGE_NAME}:${IMAGE_TAG} built successfully."
else
    echo "Docker image build failed."
    exit 1
fi