import posthog from "posthog-js";

const NEXT_PUBLIC_POSTHOG_KEY =
  "phc_jvpaTuqsQm5N6nIAVAt3zEfPMpHx2waU9mwIhIBqd9r";
const NEXT_PUBLIC_POSTHOG_HOST = "https://us.i.posthog.com";

posthog.init(NEXT_PUBLIC_POSTHOG_KEY, {
  api_host: NEXT_PUBLIC_POSTHOG_HOST,
  defaults: "2026-01-30",
});
