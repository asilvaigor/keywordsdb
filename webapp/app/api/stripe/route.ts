import type { NextRequest } from "next/server";
import Stripe from "stripe";
import { cancelSubscription, upsertSubscription } from "@/lib/db/users";
import { findSubscriptionType } from "@/lib/stripe/stripe";

function getSubscriptionTier(subscriptionType: string): "pro" | "max" {
  return ["pro_monthly", "pro_yearly"].includes(subscriptionType)
    ? "pro"
    : "max";
}

async function getCustomerEmail(
  stripe: Stripe,
  subscription: Stripe.Subscription,
): Promise<string> {
  const customerId = subscription.customer as string;
  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted) {
    throw new Error(`Customer ${customerId} has been deleted`);
  }
  if (!customer.email) {
    throw new Error(`Customer ${customerId} has no email`);
  }
  return customer.email;
}

export const POST = async (req: NextRequest) => {
  if (process.env.STRIPE_CHECKOUT_ACTIVATED === "false") {
    return new Response("Checkout not activated", { status: 403 });
  }
  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature") as string;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

    const event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string,
    );

    console.log(`Got stripe event ${event.type}`);

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const email = await getCustomerEmail(stripe, subscription);
        const priceId = subscription.items.data[0]?.price?.id;
        if (!priceId) {
          throw new Error("No price ID found in subscription");
        }
        const subscriptionType = findSubscriptionType(priceId);
        const tier = getSubscriptionTier(subscriptionType);

        if (subscription.status === "active") {
          console.log("Activating subscription for", email, "with tier", tier);
          await upsertSubscription(email, tier);
        } else if (
          subscription.status === "canceled" ||
          subscription.status === "unpaid"
        ) {
          console.log("Canceling subscription for", email);
          await cancelSubscription(email);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const email = await getCustomerEmail(stripe, subscription);
        await cancelSubscription(email);
        break;
      }
    }

    return new Response("Success", { status: 200 });
  } catch (error) {
    console.log(error);
    return new Response("Server error", { status: 500 });
  }
};
