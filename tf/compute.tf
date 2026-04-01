resource "google_project_service" "compute" {
  service = "compute.googleapis.com"
}

resource "google_project_service" "error_reporting" {
  service = "clouderrorreporting.googleapis.com"
}

resource "google_project_service" "batch" {
  service = "batch.googleapis.com"
}

locals {
  worker_common_roles = [
    "roles/artifactregistry.reader",
    "roles/logging.logWriter",
    "roles/secretmanager.secretAccessor",
    "roles/batch.agentReporter",
  ]

  workers = {
    google = {
      display_name = "Worker-google"
      roles = [
        "roles/bigquery.user",
        "roles/bigquery.dataOwner",
        "roles/storage.objectUser",
        "roles/datastore.user",
      ]
    }
    bing = {
      display_name = "Worker-bing"
      roles = [
        "roles/bigquery.user",
        "roles/bigquery.dataOwner",
        "roles/storage.objectUser",
      ]
    }
    replicator = {
      display_name = "Worker-replicator"
      roles = [
        "roles/storage.objectUser",
        "roles/storage.bucketViewer",
        "roles/datastore.user",
      ]
    }
    classifier = {
      display_name = "Worker-classifier"
      roles = [
        "roles/bigquery.user",
        "roles/bigquery.dataOwner",
        "roles/storage.objectUser",
      ]
    }
  }

  worker_iam_bindings = {
    for item in flatten([
      for worker, cfg in local.workers : [
        for role in concat(local.worker_common_roles, cfg.roles) : {
          key    = "${worker}/${role}"
          worker = worker
          role   = role
        }
      ]
    ]) : item.key => item
  }
}

resource "google_service_account" "worker" {
  for_each     = local.workers
  account_id   = "worker-${each.key}"
  display_name = each.value.display_name
}

resource "google_service_account_key" "worker" {
  for_each           = local.workers
  service_account_id = google_service_account.worker[each.key].name
}

resource "google_project_iam_member" "worker" {
  for_each = local.worker_iam_bindings
  project  = var.project_id
  role     = each.value.role
  member   = "serviceAccount:${google_service_account.worker[each.value.worker].email}"
}
