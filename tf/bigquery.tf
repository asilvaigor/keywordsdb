resource "google_project_service" "bigquery" {
  service = "bigquery.googleapis.com"
}

resource "google_bigquery_dataset" "keywords" {
  dataset_id    = "keywords"
  friendly_name = "Keywords"
  location      = "US"
  depends_on    = [google_project_service.bigquery]

}

resource "google_bigquery_table" "keywords" {
  dataset_id = google_bigquery_dataset.keywords.dataset_id
  table_id   = "keywords"

  table_constraints {
    primary_key {
      columns = ["keyword"]
    }
  }

  schema = jsonencode([
    {
      name = "keyword"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "avg_monthly_searches"
      type = "INTEGER"
      mode = "REQUIRED"
    },
    {
      name = "competition_index"
      type = "INTEGER"
      mode = "REQUIRED"
    },
    {
      name = "cpc_high"
      type = "FLOAT"
      mode = "REQUIRED"
    },
    {
      name = "updated_at"
      type = "DATE"
      mode = "REQUIRED"
    }
  ])
}
