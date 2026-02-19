resource "google_service_account" "clickhouse" {
  account_id = "clickhouse"
  project    = var.project_id
}

resource "google_storage_hmac_key" "clickhouse_hmac_key" {
  service_account_email = google_service_account.clickhouse.email
  project               = var.project_id
}

resource "google_storage_bucket_iam_member" "clickhouse" {
  for_each = toset(["prd", "stg"])
  bucket = google_storage_bucket.keywordsdb[each.key].name
  role   = "roles/storage.objectUser"
  member = "serviceAccount:${google_service_account.clickhouse.email}"
}

resource "local_file" "clickhouse_hmac_key" {
  content = jsonencode({
    access_id = google_storage_hmac_key.clickhouse_hmac_key.access_id
    secret    = google_storage_hmac_key.clickhouse_hmac_key.secret
  })
  filename = "clickhouse-hmac-key.tfstate"
}
