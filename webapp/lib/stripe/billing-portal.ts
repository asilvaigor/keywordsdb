"use server";

import { redirect } from "next/navigation";
import Stripe from "stripe";

export async function billingPortal({ email }: { email: string }) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

  // Find the Stripe customer by email
  const customers = await stripe.customers.list({ email, limit: 1 });
  const customer = customers.data[0];
  if (!customer) {
    return { error: "No billing account found. Please contact support." };
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: `${process.env.BETTER_AUTH_URL}/dashboard`,
    });
    redirect(session.url);
  } catch (error) {
    const digest = (error as unknown as { digest?: string }).digest;
    if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    return { error: "Could not open billing portal. Please try again." };
  }
}
