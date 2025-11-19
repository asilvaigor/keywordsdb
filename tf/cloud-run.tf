resource "google_service_account" "cloudrun_webapp" {
  account_id   = "cloudrun-webapp"
  display_name = "Cloud Run"
}

resource "google_project_iam_member" "cloudrun_webapp" {
  for_each = toset([
    "roles/iam.serviceAccountTokenCreator",
    "roles/datastore.user",
  ])
  project = var.project_id
  role    = each.key
  member  = "serviceAccount:${google_service_account.cloudrun_webapp.email}"
}

resource "google_project_service" "cloudrun" {
  service = "run.googleapis.com"
}

# resource "google_cloud_run_v2_service" "webapp" {
#   for_each = toset(["prd"])
#   name     = "webapp-${each.key}"
#   location = var.location
#   ingress  = "INGRESS_TRAFFIC_ALL"
#   template {
#     max_instance_request_concurrency = 100
#     service_account                  = google_service_account.cloudrun_webapp.email
#     timeout                          = "90s"
#     scaling {
#       max_instance_count = 4
#     }
#     containers {
#       image = "${var.location}-docker.pkg.dev/${var.project_id}/keywordsdb/webapp:${each.key}"
#       resources {
#         limits = {
#           cpu    = "1"
#           memory = "1Gi"
#         }
#         startup_cpu_boost = true
#         cpu_idle          = true
#       }
#       ports {
#         name           = "http1"
#         container_port = 3000
#       }
#     }
#   }
#   lifecycle {
#     ignore_changes = [client, client_version, template[0].containers[0].env, template[0].containers[0].name]
#   }
#   depends_on = [google_project_service.cloudrun]
# }

# resource "google_cloud_run_service_iam_binding" "cloudrun_webapp_iam" {
#   for_each = google_cloud_run_v2_service.webapp
#   service  = each.value.name
#   location = var.location
#   role     = "roles/run.invoker"
#   members  = ["allUsers"]
# }

# resource "google_cloud_run_domain_mapping" "webapp" {
#   for_each = toset(["keywordsdb.com", "www.keywordsdb.com"])
#   name     = each.key
#   location = var.location
#   metadata {
#     namespace = var.project_id
#   }
#   spec {
#     route_name = google_cloud_run_v2_service.webapp["prd"].name
#   }
# }

resource "cloudflare_dns_record" "webapp_a" {
  for_each = toset([
    "216.239.32.21",
    "216.239.34.21",
    "216.239.36.21",
    "216.239.38.21"
  ])
  zone_id = var.cloudflare_zone_id
  name    = "@"
  content = each.key
  type    = "A"
  proxied = true
  ttl     = 1
}

resource "cloudflare_dns_record" "webapp_aaaa" {
  for_each = toset([
    "2001:4860:4802:32::15",
    "2001:4860:4802:34::15",
    "2001:4860:4802:36::15",
    "2001:4860:4802:38::15"
  ])
  zone_id = var.cloudflare_zone_id
  name    = "@"
  content = each.key
  type    = "AAAA"
  proxied = true
  ttl     = 1
}

resource "cloudflare_dns_record" "webapp" {
  # for_each = google_cloud_run_v2_service.webapp
  zone_id  = var.cloudflare_zone_id
  name     = "www"
  content  = "ghs.googlehosted.com"
  type     = "CNAME"
  proxied  = true
  ttl      = 1
}
