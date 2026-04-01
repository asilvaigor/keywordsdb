resource "google_service_account" "local_account" {
  account_id   = "local-account"
  display_name = "Account for doing local tests"
}

resource "google_project_iam_member" "local_account" {
  for_each = toset([
    "roles/datastore.user",
    "roles/storage.objectUser",
    "roles/iam.serviceAccountTokenCreator",
  ])
  project = var.project_id
  role    = each.key
  member  = "serviceAccount:${google_service_account.local_account.email}"
}

resource "google_service_account_key" "local_account" {
  service_account_id = google_service_account.local_account.name
}

resource "local_file" "local_account_key" {
  content  = base64decode(google_service_account_key.local_account.private_key)
  filename = "local-account-key.tfstate"
}

resource "cloudflare_account_token" "local_account" {
  account_id = var.cloudflare_account_id
  name       = "KeywordsDB Local Account Token"

  policies = [{
    effect = "allow"
    permission_groups = [{
      id = "2efd5506f9c8494dacb1fa10a3e7d5b6" # Workers R2 Storage Bucket Item Write
    }]
    resources = jsonencode({
      "com.cloudflare.edge.r2.bucket.${var.cloudflare_account_id}_default_keywordsdb" = "*"
    })
  }]
}

resource "local_file" "cloudflare_local_account_key" {
  content = jsonencode({
    access_key_id     = cloudflare_account_token.local_account.id
    secret_access_key = sha256(cloudflare_account_token.local_account.value)
    endpoint_url      = "https://${var.cloudflare_account_id}.r2.cloudflarestorage.com"
  })
  filename = "cloudflare-local-account-key.tfstate"
}
