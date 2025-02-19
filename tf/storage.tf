resource "google_storage_bucket" "keywordsdb" {
  name     = "keywordsdb-prd"
  location = var.location
  soft_delete_policy {
    retention_duration_seconds = 0
  }
  lifecycle_rule {
    action {
      type = "Delete"
    }
    condition {
      age = 1
    }
  }
}
