variable "google_ads_login_customer_id" {
  description = "Google Ads Login Customer ID"
  type        = string
  sensitive   = true
}

variable "google_ads_developer_token" {
  description = "Google Ads Developer Token"
  type        = string
  sensitive   = true
}

variable "cloudflare_api_token" {
  type        = string
  description = "Cloudflare API token"
  sensitive   = true
}

variable "cloudflare_zone_id" {
  type        = string
  description = "Cloudflare Zone ID for keywordsdb.com"
}

variable "clickhouse_url" {
  type        = string
  description = "ClickHouse URL for the ClickHouse database"
}

variable "clickhouse_username" {
  type        = string
  description = "ClickHouse username"
  sensitive   = true
}

variable "clickhouse_password" {
  type        = string
  description = "ClickHouse password"
  sensitive   = true
}

variable "bing_client_id" {
  type        = string
  description = "Bing Ads Client ID"
  sensitive   = true
}

variable "bing_account_id" {
  type        = string
  description = "Bing Ads Account ID"
  sensitive   = true
}

variable "bing_developer_token" {
  type        = string
  description = "Bing Ads Developer Token"
  sensitive   = true
}

variable "bing_refresh_token" {
  type        = string
  description = "Bing Ads Refresh Token"
  sensitive   = true
}

variable "better_auth_resend_key" {
  type        = string
  description = "BetterAuth Resend Key"
  sensitive   = true
}

variable "better_auth_secret" {
  type        = string
  description = "BetterAuth Secret"
  sensitive   = true
}

variable "better_auth_google_id" {
  type        = string
  description = "BetterAuth Google Client ID"
  sensitive   = true
}

variable "better_auth_google_secret" {
  type        = string
  description = "BetterAuth Google Client Secret"
  sensitive   = true
}
