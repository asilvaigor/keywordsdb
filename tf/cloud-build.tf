resource "google_project_service" "artifact_registry" {
  service = "artifactregistry.googleapis.com"
}

resource "google_project_service" "cloudbuild" {
  service = "cloudbuild.googleapis.com"
}

resource "google_service_account" "cloudbuild" {
  account_id   = "cloud-build"
  display_name = "Cloud Build Service Account"
}

resource "google_project_iam_member" "cloudbuild" {
  for_each = toset([
    "roles/cloudbuild.builds.builder",
  ])
  project = var.project_id
  role    = each.key
  member  = "serviceAccount:${google_service_account.cloudbuild.email}"
}

resource "google_artifact_registry_repository" "main" {
  repository_id          = "keywordsdb"
  format                 = "DOCKER"
  cleanup_policy_dry_run = false
  cleanup_policies {
    id     = "delete-old"
    action = "DELETE"
    condition {
      older_than = "3600s"
    }
  }
  depends_on = [google_project_service.artifact_registry]
}

resource "google_storage_bucket" "cloudbuild" {
  name                        = "keywordsdb-cloudbuild"
  location                    = var.location
  uniform_bucket_level_access = true
  lifecycle_rule {
    condition {
      age = 1
    }
    action {
      type = "Delete"
    }
  }
  soft_delete_policy {
    retention_duration_seconds = 0
  }
}
