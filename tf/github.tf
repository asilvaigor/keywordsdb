resource "google_iam_workload_identity_pool" "github" {
  project                   = var.project_id
  workload_identity_pool_id = "github"
  display_name              = "GitHub Actions Pool"
}

resource "google_iam_workload_identity_pool_provider" "github" {
  project                            = var.project_id
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-provider"
  display_name                       = "GitHub Actions Provider"
  attribute_mapping = {
    "google.subject"             = "assertion.sub"
    "attribute.actor"            = "assertion.actor"
    "attribute.repository"       = "assertion.repository"
    "attribute.repository_owner" = "assertion.repository_owner"
  }
  attribute_condition = "assertion.repository_owner == 'asilvaigor'"
  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}

resource "google_project_iam_custom_role" "compute_update" {
  role_id = "compute_update"
  title   = "Compute Instance Update"
  permissions = [
    "compute.projects.get",
    "compute.instances.get",
    "compute.instances.setMetadata",
    "compute.instances.start",
    "compute.instances.stop",
  ]
}

resource "google_project_iam_member" "github_actions" {
  for_each = {
    cloudbuild     = "roles/cloudbuild.builds.builder"
    compute_update = google_project_iam_custom_role.compute_update.id
    iam            = "roles/iam.serviceAccountUser"
    storage        = "roles/storage.objectViewer",
    cloudrun       = "roles/run.sourceDeveloper"
  }

  project = var.project_id
  role    = each.value
  member  = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.repository/asilvaigor/keywordsdb"
}

resource "github_actions_variable" "workload_identity_provider" {
  variable_name = "WORKLOAD_IDENTITY_PROVIDER"
  repository    = "keywordsdb"
  value         = google_iam_workload_identity_pool_provider.github.name
}

resource "github_actions_variable" "project_id" {
  variable_name = "PROJECT_ID"
  repository    = "keywordsdb"
  value         = var.project_id
}

resource "github_actions_variable" "location" {
  variable_name = "CLICKHOUSE_URL"
  repository    = "keywordsdb"
  value         = var.clickhouse_url
}

resource "github_actions_variable" "clickhouse_username" {
  variable_name = "CLICKHOUSE_USERNAME"
  repository    = "keywordsdb"
  value         = var.clickhouse_username
}

resource "github_actions_secret" "clickhouse_password" {
  secret_name     = "CLICKHOUSE_PASSWORD"
  repository      = "keywordsdb"
  plaintext_value = var.clickhouse_password
}
