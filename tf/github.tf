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
    "compute.instanceGroupManagers.get",
    "compute.instanceGroupManagers.update",
    "compute.instanceTemplates.useReadOnly",
    "compute.instanceTemplates.get",
    "compute.instances.create",
    "compute.instances.setMetadata",
    "compute.instances.setLabels",
    "compute.disks.create",
    "compute.subnetworks.use",
    "compute.subnetworks.useExternalIp",
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

locals {
  github_variables = {
    WORKLOAD_IDENTITY_PROVIDER = google_iam_workload_identity_pool_provider.github.name
    PROJECT_ID                 = var.project_id
    CLICKHOUSE_URL             = var.clickhouse_url
    CLICKHOUSE_USERNAME        = var.clickhouse_username
  }

  github_secrets = {
    CLICKHOUSE_PASSWORD  = var.clickhouse_password
  }
}

resource "github_actions_variable" "variables" {
  for_each = local.github_variables

  variable_name = each.key
  repository    = "keywordsdb"
  value         = each.value
}

resource "github_actions_secret" "secrets" {
  for_each = local.github_secrets

  secret_name     = each.key
  repository      = "keywordsdb"
  plaintext_value = each.value
}
