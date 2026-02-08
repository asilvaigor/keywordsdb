resource "google_monitoring_notification_channel" "email" {
  display_name = "asilvaigor@gmail.com"
  type         = "email"

  labels = {
    email_address = "asilvaigor@gmail.com"
  }
}

resource "google_monitoring_alert_policy" "batch_error_logs" {
  display_name = "Batch Error Logs Alert"
  combiner     = "OR"
  severity     = "ERROR"

  conditions {
    display_name = "Error logs from VMs"
    condition_matched_log {
      filter = <<-EOT
        logName="projects/keywordsdb-3/logs/batch_task_logs"
        severity>=ERROR
        NOT textPayload=~"error waiting for container: unexpected EOF"
      EOT
    }
  }

  alert_strategy {
    auto_close = "604800s" # 7 days
    notification_rate_limit {
      period = "1800s" # 30 minutes
    }
  }

  notification_channels = [
    google_monitoring_notification_channel.email.id,
  ]
}
