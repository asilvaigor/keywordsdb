resource "google_project_service" "firestore" {
  service = "firestore.googleapis.com"
}

resource "google_firestore_database" "database" {
  for_each    = toset(["prd"])
  name        = "keywordsdb-${each.key}"
  type        = "FIRESTORE_NATIVE"
  location_id = var.location

  depends_on = [google_project_service.firestore]
}

resource "google_firestore_field" "keywords_cache_ttl" {
  for_each   = google_firestore_database.database
  database   = each.value.name
  collection = "keywords-cache"
  field      = "expires_at"
  ttl_config {}
}
