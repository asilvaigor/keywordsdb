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
