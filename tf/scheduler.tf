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
  scheduler_jobs = {
    google = {
      description = "Triggers google worker batch job daily at 8pm UTC"
      schedule    = "0 20 * * *"
      command     = ["python", "-u", "src/workers/google/main.py"]
    }
    bing = {
      description = "Triggers bing worker batch job every 3 days at 12am UTC"
      schedule    = "0 0 */3 * *"
      command     = ["python", "-u", "src/workers/bing/main.py"]
    }
    replicator = {
      description = "Triggers replicator worker batch job daily at 1am UTC"
      schedule    = "0 1 * * *"
      command     = ["python", "-u", "src/workers/replicator/main.py"]
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
              cpuMilli  = 1000
              memoryMib = 1740
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
            machineType       = "g1-small"
            provisioningModel = "SPOT"
            bootDisk = {
              type   = "pd-standard"
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

