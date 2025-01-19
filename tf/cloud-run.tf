resource "google_project_service" "cloudrun" {
  service = "run.googleapis.com"
}

resource "google_service_account" "worker_trigger" {
  account_id   = "worker-trigger"
  display_name = "Cloud Run backend"
}

resource "google_project_iam_member" "worker_trigger" {
  for_each = toset([
    "roles/run.invoker",
  ])
  project = var.project_id
  role    = each.key
  member  = "serviceAccount:${google_service_account.worker_trigger.email}"
}

# resource "google_cloud_run_v2_service" "worker_trigger" {
#   for_each = toset(["stg", "prd"])
#   name     = "worker-trigger-${each.key}"
#   location = var.location
#   template {
#     service_account                  = google_service_account.worker_trigger.email
#     timeout                          = "30s"
#     max_instance_request_concurrency = 1
#     containers {
#       image   = "${var.location}-docker.pkg.dev/${var.project_id}/keywordsdb/worker:${each.key}"
#       command = ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8080", "--log-level", "critical"]
#       resources {
#         limits = {
#           cpu    = "200m"
#           memory = "512Mi"
#         }
#         startup_cpu_boost = true
#         cpu_idle          = true
#       }
#       ports {
#         name           = "http1"
#         container_port = 8080
#       }
#     }
#   }
#   lifecycle {
#     ignore_changes = [client, client_version, template[0].containers[0].env]
#   }
#   depends_on = [google_project_service.cloudrun]
# }
