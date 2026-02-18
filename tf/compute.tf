resource "google_project_service" "compute" {
  service = "compute.googleapis.com"
}

resource "google_project_service" "error_reporting" {
  service = "clouderrorreporting.googleapis.com"
}

resource "google_project_service" "batch" {
  service = "batch.googleapis.com"
}

resource "google_service_account" "worker_google" {
  account_id   = "worker-google"
  display_name = "Worker-google"
}

resource "google_service_account_key" "worker_google" {
  service_account_id = google_service_account.worker_google.name
}

resource "google_project_iam_member" "worker_google" {
  for_each = toset([
    "roles/artifactregistry.reader",
    "roles/logging.logWriter",
    "roles/secretmanager.secretAccessor",
    "roles/bigquery.user",
    "roles/bigquery.dataOwner",
    "roles/storage.objectUser",
    "roles/storage.bucketViewer",
    "roles/datastore.user",
    "roles/batch.agentReporter",
  ])
  project = var.project_id
  role    = each.key
  member  = "serviceAccount:${google_service_account.worker_google.email}"
}

resource "google_service_account" "worker_bing" {
  account_id   = "worker-bing"
  display_name = "Worker-bing"
}

resource "google_service_account_key" "worker_bing" {
  service_account_id = google_service_account.worker_bing.name
}

resource "google_project_iam_member" "worker_bing" {
  for_each = toset([
    "roles/artifactregistry.reader",
    "roles/logging.logWriter",
    "roles/secretmanager.secretAccessor",
    "roles/bigquery.user",
    "roles/bigquery.dataOwner",
    "roles/storage.objectUser",
    "roles/storage.bucketViewer",
    "roles/batch.agentReporter",
  ])
  project = var.project_id
  role    = each.key
  member  = "serviceAccount:${google_service_account.worker_bing.email}"
}
