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

resource "cloudflare_r2_bucket" "keywordsdb" {
  account_id = var.cloudflare_account_id
  name = "keywordsdb"
  location = "enam"
  storage_class = "Standard"
}
