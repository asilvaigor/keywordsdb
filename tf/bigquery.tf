resource "google_project_service" "bigquery" {
  service = "bigquery.googleapis.com"
}

resource "google_bigquery_dataset" "keywords" {
  dataset_id            = "keywords"
  friendly_name         = "Keywords"
  location              = "US"
  max_time_travel_hours = 48
  depends_on            = [google_project_service.bigquery]
}

resource "google_bigquery_table" "keywords" {
  dataset_id = google_bigquery_dataset.keywords.dataset_id
  table_id   = "keywords"

  clustering = ["keyword"]
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
      name = "volume_history"
      type = "BYTES"
      mode = "NULLABLE"
    },
    {
      name = "group_id"
      type = "INTEGER"
      mode = "NULLABLE"
    },
    {
      name = "updated_at"
      type = "DATE"
      mode = "REQUIRED"
    },
    {
      name = "ingested_at"
      type = "DATE"
      mode = "NULLABLE"
    }
  ])
}

resource "google_bigquery_table" "keywords_tmp" {
  dataset_id = google_bigquery_dataset.keywords.dataset_id
  table_id   = "keywords-tmp"

  clustering = ["keyword"]
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
      name = "cpc_low"
      type = "FLOAT"
      mode = "NULLABLE"
    },
    {
      name = "cpc_avg"
      type = "FLOAT"
      mode = "NULLABLE"
    },
    {
      name = "volume_history"
      type = "BYTES"
      mode = "NULLABLE"
    },
    {
      name = "updated_at"
      type = "DATE"
      mode = "REQUIRED"
    },
    {
      name = "ingested_at"
      type = "DATE"
      mode = "NULLABLE"
    }
  ])
}
