import posthog from "posthog-js";

export function identify(email: string) {
  posthog.identify(email);
}
