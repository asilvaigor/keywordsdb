terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "7.18.0"
    }
    github = {
      source  = "integrations/github"
      version = "6.11.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "5.16.0"
    }
  }
  backend "gcs" {
    bucket = "keywordsdb-terraform"
  }
}

provider "google" {
  project = var.project_id
  region  = var.location
}

provider "github" {}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

resource "google_project" "default" {
  provider = google-beta

  project_id      = var.project_id
  name            = "keywordsdb"
  billing_account = "01F96D-826454-49A4BB"
}

resource "google_storage_bucket" "terraform" {
  name     = "keywordsdb-terraform"
  location = var.location
  soft_delete_policy {
    retention_duration_seconds = 0
  }
  depends_on = [google_project.default]
}

variable "location" {
  type    = string
  default = "us-central1"
}

variable "project_id" {
  type    = string
  default = "keywordsdb-3"
}
