resource "google_project_service" "googleads" {
  service = "googleads.googleapis.com"
}

resource "google_project_service" "serviceusage" {
  service = "serviceusage.googleapis.com"
}

resource "google_project_service" "apikeys" {
  service = "apikeys.googleapis.com"
}

resource "google_project_service" "pagespeedonline" {
  service = "pagespeedonline.googleapis.com"
}

resource "google_apikeys_key" "psi" {
  name         = "psi-api-key"
  display_name = "PageSpeed Insights API Key"
  project      = var.project_id

  restrictions {
    api_targets {
      service = "pagespeedonline.googleapis.com"
    }
  }

  depends_on = [google_project_service.serviceusage, google_project_service.apikeys, google_project_service.pagespeedonline]
}
