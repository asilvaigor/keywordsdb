"use server";

import { redirect } from "next/navigation";
import Stripe from "stripe";
import { PRICE_IDS } from "@/lib/stripe/stripe";

export async function checkout({
  email,
  checkoutOption,
}: {
  email: string;
  checkoutOption: "pro_monthly" | "pro_yearly" | "max_monthly" | "max_yearly";
}) {
  if (process.env.STRIPE_CHECKOUT_ACTIVATED === "false") {
    redirect("/paywall");
  }
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email,
      line_items: [{ price: PRICE_IDS[checkoutOption], quantity: 1 }],
      success_url: `${process.env.BETTER_AUTH_URL}/dashboard`,
      cancel_url: process.env.BETTER_AUTH_URL,
    });
    if (checkoutSession.url) {
      redirect(checkoutSession.url);
    }
    return { error: "Could not create checkout session. Please try again." };
  } catch (error) {
    console.log("Error creating checkout session:", error);
    // Re-throw Next.js redirect errors so the router can handle them
    const digest = (error as unknown as { digest?: string }).digest;
    if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    return { error: "Something went wrong. Please try again." };
  }
}
