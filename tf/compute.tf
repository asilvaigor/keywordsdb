resource "google_project_service" "compute" {
  service = "compute.googleapis.com"
}

resource "google_project_service" "error_reporting" {
  service = "clouderrorreporting.googleapis.com"
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
  ])
  project = var.project_id
  role    = each.key
  member  = "serviceAccount:${google_service_account.worker_ingestion.email}"
}

resource "google_compute_instance_template" "worker_ingestion_prd" {
  for_each     = toset(["prd"])
  name_prefix  = "worker-ingestion-${each.key}-"
  machine_type = "g1-small"
  region       = "us-central1"

  disk {
    source_image = "cos-cloud/cos-stable"
    auto_delete  = true
    boot         = true
    disk_type    = "pd-standard"
    disk_size_gb = 10
  }

  scheduling {
    preemptible                 = true
    automatic_restart           = false
    provisioning_model          = "SPOT"
    instance_termination_action = "STOP"
  }

  network_interface {
    network = "default"
    access_config {}
  }

  metadata = {
    startup-script            = file("${path.module}/compute-worker-startup.sh")
    env                       = each.key
    image-tag                 = "keep"
    google-logging-enabled    = "true"
    google-monitoring-enabled = "true"
  }

  service_account {
    email  = google_service_account.worker_ingestion.email
    scopes = ["cloud-platform"]
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "google_compute_instance_group_manager" "worker_ingestion_prd" {
  for_each = toset(["prd"])
  name     = "worker-ingestion-${each.key}-igm"
  zone     = "us-central1-a"

  base_instance_name = "worker-ingestion-${each.key}"
  target_size        = 1

  version {
    instance_template = google_compute_instance_template.worker_ingestion_prd[each.key].id
  }
}
