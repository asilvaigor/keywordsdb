resource "google_project_service" "cloud_scheduler" {
  service = "cloudscheduler.googleapis.com"
}

resource "google_service_account" "batch_scheduler" {
  account_id   = "batch-scheduler"
  display_name = "Batch Job Scheduler"
}

resource "google_project_iam_member" "batch_scheduler" {
  for_each = toset([
    "roles/batch.jobsEditor",
    "roles/iam.serviceAccountUser",
  ])
  project = var.project_id
  role    = each.key
  member  = "serviceAccount:${google_service_account.batch_scheduler.email}"
}

locals {
  machine_types = {
    g1_small = {
      cpu         = 1000
      mem         = 1740
      disk_type   = "pd-standard"
      machine_type = "g1-small"
    }
    c4d_standard_2 = {
      cpu         = 2000
      mem         = 7160
      disk_type   = "hyperdisk-balanced"
      machine_type = "c4d-standard-2"
    }
  }

  scheduler_jobs = {
    google = {
      description  = "Triggers google worker batch job daily at 8pm UTC"
      schedule     = "0 20 * * *"
      command      = ["python", "-u", "src/workers/google/main.py"]
      machine_type = "g1_small"
    }
    bing = {
      description  = "Triggers bing worker batch job every 3 days at 12am UTC"
      schedule     = "0 0 */3 * *"
      command      = ["python", "-u", "src/workers/bing/main.py"]
      machine_type = "g1_small"
    }
    classifier = {
      description  = "Triggers classifier worker batch every 3 days at 1am UTC"
      schedule     = "0 1 */3 * *"
      command      = ["python", "-u", "src/workers/classifier/main.py"]
      machine_type = "c4d_standard_2"
    }
    replicator = {
      description  = "Triggers replicator worker batch job daily at 1am UTC"
      schedule     = "0 1 * * *"
      command      = ["python", "-u", "src/workers/replicator/main.py"]
      machine_type = "g1_small"
    }
  }
}

resource "google_cloud_scheduler_job" "worker_prd" {
  for_each         = local.scheduler_jobs
  name             = "worker-${each.key}-prd"
  description      = each.value.description
  schedule         = each.value.schedule
  time_zone        = "UTC"
  attempt_deadline = "320s"

  retry_config {
    retry_count = 1
  }

  http_target {
    http_method = "POST"
    uri         = "https://batch.googleapis.com/v1/projects/${var.project_id}/locations/${var.location}/jobs"
    headers = {
      "Content-Type" = "application/json"
    }

    body = base64encode(jsonencode({
      labels = {
        job_name = "worker-${each.key}-prd"
      }
      taskGroups = [
        {
          taskSpec = {
            runnables = {
              container = {
                imageUri = "us-central1-docker.pkg.dev/${var.project_id}/keywordsdb/workers:keep"
                commands = each.value.command
              }
            }
            computeResource = {
              cpuMilli  = local.machine_types[each.value.machine_type].cpu
              memoryMib = local.machine_types[each.value.machine_type].mem
            }
            environment = {
              variables = {
                ENV = "prd"
              }
            }
            maxRunDuration = "43200s" # 12 hours
            maxRetryCount  = 10
          }
          taskCount   = 1
          parallelism = 1
        }
      ],
      allocationPolicy = {
        instances = [{
          policy = {
            machineType       = local.machine_types[each.value.machine_type].machine_type
            provisioningModel = "SPOT"
            bootDisk = {
              type   = local.machine_types[each.value.machine_type].disk_type
              sizeGb = 30 # minimum size for COS image
              image  = "batch-cos"
            }
          }
        }]
        serviceAccount = {
          email = google_service_account.worker[each.key].email
        }
        labels = {
          job_name = "worker-${each.key}-prd"
        }
      },
      logsPolicy = {
        destination = "CLOUD_LOGGING"
      }
    }))

    oauth_token {
      service_account_email = google_service_account.batch_scheduler.email
    }
  }

  depends_on = [
    google_project_service.cloud_scheduler,
    google_project_service.batch
  ]
}

