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
