const NEXT_PUBLIC_POSTHOG_KEY =
  "phc_jvpaTuqsQm5N6nIAVAt3zEfPMpHx2waU9mwIhIBqd9r";

function initPostHog() {
  import("posthog-js").then(({ default: posthog }) => {
    posthog.init(NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: "https://t.keywordsdb.com",
      ui_host: "https://us.posthog.com",
      defaults: "2026-01-30",
    });
  });
}

if (typeof window !== "undefined") {
  if ("requestIdleCallback" in window) {
    requestIdleCallback(initPostHog);
  } else {
    setTimeout(initPostHog, 200);
  }
}
