resource "google_project_service" "compute" {
  service = "compute.googleapis.com"
}

resource "google_project_service" "error_reporting" {
  service = "clouderrorreporting.googleapis.com"
}

resource "google_service_account" "worker" {
  account_id   = "worker-2"
  display_name = "Worker"
}

resource "google_service_account_key" "worker" {
  service_account_id = google_service_account.worker.name
}

resource "google_project_iam_member" "worker" {
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
  member  = "serviceAccount:${google_service_account.worker.email}"
}

module "worker_container" {
  source  = "terraform-google-modules/container-vm/google"
  version = "~> 3.2"

  cos_image_name = "cos-117-18613-164-4"

  container = {
    image = "${var.location}-docker.pkg.dev/${var.project_id}/keywordsdb/worker:keep"
    command = [
      "python", "workers/src/workers/keyword_planner/main.py"
    ]

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

resource "google_compute_instance" "worker_stg" {
  project      = var.project_id
  name         = "worker-stg"
  machine_type = "e2-micro"
  zone         = "us-central1-a"

  boot_disk {
    initialize_params {
      image = module.worker_container.source_image
    }
  }

  network_interface {
    network = "default"
    access_config {}
  }

  metadata = {
    gce-container-declaration = module.worker_container.metadata_value
    google-logging-enabled    = "true"
    google-monitoring-enabled = "true"
  }

  labels = {
    container-vm = module.worker_container.vm_container_label
  }


  service_account {
    email  = google_service_account.worker.email
    scopes = ["cloud-platform"]
  }

  lifecycle {
    ignore_changes = [
      metadata["gce-container-declaration"],
      metadata["ssh-keys"],
    ]
  }
}
