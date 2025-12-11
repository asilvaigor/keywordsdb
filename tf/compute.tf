resource "google_project_service" "compute" {
  service = "compute.googleapis.com"
}

resource "google_project_service" "error_reporting" {
  service = "clouderrorreporting.googleapis.com"
}

resource "google_project_service" "batch" {
  service = "batch.googleapis.com"
}

resource "google_service_account" "worker_ingestion" {
  account_id   = "worker-ingestion"
  display_name = "Worker-ingestion"
}

resource "google_service_account_key" "worker_ingestion" {
  service_account_id = google_service_account.worker_ingestion.name
}

resource "google_project_iam_member" "worker_ingestion" {
  for_each = toset([
    "roles/artifactregistry.reader",
    "roles/logging.logWriter",
    "roles/secretmanager.secretAccessor",
    "roles/bigquery.user",
    "roles/bigquery.dataOwner",
    "roles/storage.objectUser",
    "roles/datastore.user",
    "roles/batch.agentReporter",
  ])
  project = var.project_id
  role    = each.key
  member  = "serviceAccount:${google_service_account.worker_ingestion.email}"
}
