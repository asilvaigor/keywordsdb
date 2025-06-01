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
  ])
  project = var.project_id
  role    = each.key
  member  = "serviceAccount:${google_service_account.worker_ingestion.email}"
}

module "worker_ingestion_container" {
  source  = "terraform-google-modules/container-vm/google"
  version = "~> 3.2"

  container = {
    image   = "${var.location}-docker.pkg.dev/${var.project_id}/keywordsdb/workers:keep"
    command = ["python", "src/workers/ingestion/main.py"]

    volumeMounts = [
      {
        mountPath = "/cache"
        name      = "tempfs-0"
        readOnly  = false
      },
    ]
  }

  volumes = [
    {
      name = "tempfs-0"

      emptyDir = {
        medium = "Memory"
      }
    },
  ]

  restart_policy = "Always"
}

resource "google_compute_instance" "worker_ingestion_stg" {
  project      = var.project_id
  name         = "worker-ingestion-stg"
  machine_type = "e2-micro"
  zone         = "us-central1-a"

  boot_disk {
    initialize_params {
      image = module.worker_ingestion_container.source_image
    }
  }

  network_interface {
    network = "default"
    access_config {}
  }

  metadata = {
    gce-container-declaration = module.worker_ingestion_container.metadata_value
    google-logging-enabled    = "true"
    google-monitoring-enabled = "true"
  }

  labels = {
    container-vm = module.worker_ingestion_container.vm_container_label
  }


  service_account {
    email  = google_service_account.worker_ingestion.email
    scopes = ["cloud-platform"]
  }

  lifecycle {
    ignore_changes = [
      metadata["gce-container-declaration"],
      metadata["ssh-keys"],
    ]
  }
}
