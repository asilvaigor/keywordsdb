import { loadStripe } from "@stripe/stripe-js";

const NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_ENV === "prd"
    ? "pk_live_51T1wCzQKrorq4nxeSDaXY0koMjOqmP0ls3xMCLguGyar50GDFZI75DeIeI4HFKdLmSmpcmrkP4iHrzOdEbreklxC00BdPucO5V"
    : "pk_test_51T1wDTKNXEzJl6yDVAwkcsvV0HA0x8JJntyMpbSIXqzMwNyRYsVNN3gueEnyqsqaBbAOGG1zsUtVkdEni6vsOEoT00X6hGriVf";

export const stripePromise = loadStripe(NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export const PRICE_IDS =
  process.env.NEXT_PUBLIC_ENV === "prd"
    ? {
        pro_monthly: "price_1T1wqFQKrorq4nxe5TPqJouZ",
        pro_yearly: "price_1T1wqSQKrorq4nxexc8JzreT",
        max_monthly: "price_1T1wr1QKrorq4nxe57NVP2uG",
        max_yearly: "price_1T1wrFQKrorq4nxeqe3J13Ik",
      }
    : {
        pro_monthly: "price_1T2Ss0KNXEzJl6yD1O6tjEcl",
        pro_yearly: "price_1T2SsNKNXEzJl6yD1HYy0Npz",
        max_monthly: "price_1T2St4KNXEzJl6yDmKB0JfBq",
        max_yearly: "price_1T2StNKNXEzJl6yDghu6zjxe",
      };

export function findSubscriptionType(
  priceId: string,
): "pro_monthly" | "pro_yearly" | "max_monthly" | "max_yearly" {
  const allPriceIds = Object.entries(PRICE_IDS);
  for (const [key, value] of allPriceIds) {
    if (value === priceId) {
      return key as "pro_monthly" | "pro_yearly" | "max_monthly" | "max_yearly";
    }
  }
  throw new Error(`Price ID ${priceId} not found`);
}
