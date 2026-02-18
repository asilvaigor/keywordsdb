resource "google_storage_bucket" "keywordsdb" {
  for_each = toset(["stg", "prd"])
  name     = "keywordsdb-${each.key}"
  location = var.location
  soft_delete_policy {
    retention_duration_seconds = 0
  }
  lifecycle_rule {
    action {
      type = "Delete"
    }
    condition {
      age = 30
    }
  }
}
