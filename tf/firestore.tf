resource "google_project_service" "firestore" {
  service = "firestore.googleapis.com"
}

resource "google_firestore_database" "database" {
  for_each    = toset(["stg"])
  name        = "keywordsdb-${each.key}"
  type        = "FIRESTORE_NATIVE"
  location_id = var.location

  depends_on = [google_project_service.firestore]
}
