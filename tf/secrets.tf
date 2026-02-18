resource "google_project_service" "secretmanager" {
  service = "secretmanager.googleapis.com"
}

locals {
  worker_secrets = {
    "GOOGLE_ADS_LOGIN_CUSTOMER_ID" = var.google_ads_login_customer_id
    "GOOGLE_ADS_DEVELOPER_TOKEN"   = var.google_ads_developer_token
    "WORKER_SERVICE_ACCOUNT_KEY"   = google_service_account_key.worker_google.private_key
    "CLICKHOUSE_PASSWORD"          = var.clickhouse_password
    "GCS_ACCESS_KEY_ID"            = google_storage_hmac_key.clickhouse_hmac_key.access_id
    "GCS_SECRET_ACCESS_KEY"        = google_storage_hmac_key.clickhouse_hmac_key.secret
    "BING_CLIENT_ID"               = var.bing_client_id
    "BING_ACCOUNT_ID"              = var.bing_account_id
    "BING_DEVELOPER_TOKEN"         = var.bing_developer_token
    "BING_REFRESH_TOKEN"           = var.bing_refresh_token
  }
}

resource "google_secret_manager_secret" "secrets" {
  for_each  = local.worker_secrets
  secret_id = each.key

  replication {
    user_managed {
      replicas {
        location = var.location
      }
    }
  }

  depends_on = [google_project_service.secretmanager]
}

resource "google_secret_manager_secret_version" "secret-versions" {
  for_each    = local.worker_secrets
  secret      = google_secret_manager_secret.secrets[each.key].id
  secret_data = each.value
}
