#!/bin/bash

# Get the environment from instance metadata
ENV=$(curl -s "http://metadata.google.internal/computeMetadata/v1/instance/attributes/env" -H "Metadata-Flavor: Google")
PROJECT_ID=$(curl -s "http://metadata.google.internal/computeMetadata/v1/project/project-id" -H "Metadata-Flavor: Google")
IMAGE_TAG=$(curl -s "http://metadata.google.internal/computeMetadata/v1/instance/attributes/image-tag" -H "Metadata-Flavor: Google")

# Container configuration
CONTAINER_NAME="worker-ingestion"
IMAGE_URL="us-central1-docker.pkg.dev/${PROJECT_ID}/keywordsdb/workers:${IMAGE_TAG}"

# Set home directory to save docker credentials
export HOME=/home/appuser
mkdir -p $HOME

# Configure docker authentication using docker-credential-gcr
docker-credential-gcr configure-docker --registries=us-central1-docker.pkg.dev

# Stop and remove the container if it exists
docker stop $CONTAINER_NAME || true
docker rm $CONTAINER_NAME || true

# Pull the latest version of the container image
docker pull $IMAGE_URL

# Run docker container with Cloud Logging enabled
docker run -d \
  -u 65534 \
  --name $CONTAINER_NAME \
  --restart=always \
  -e ENV="$ENV" \
  --tmpfs /cache:rw,size=50m \
  $IMAGE_URL \
  python -u src/workers/ingestion/main.py

# Clean up
docker system prune -af || true
