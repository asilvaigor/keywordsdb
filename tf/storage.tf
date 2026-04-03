resource "google_storage_bucket" "keywordsdb_backup" {
  for_each = toset(["stg", "prd"])
  name     = "keywordsdb-backup-${each.key}"
  location = var.location
  soft_delete_policy {
    retention_duration_seconds = 0
  }
  lifecycle_rule {
    action {
      type = "Delete"
    }
    condition {
      age = 7
    }
  }
}

resource "google_storage_bucket" "keywordsdb_kaggle" {
  name     = "keywordsdb-kaggle"
  location = "us-east1"
  soft_delete_policy {
    retention_duration_seconds = 0
  }
}

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
      age            = 1
      matches_prefix = ["download"]
    }
  }
}
