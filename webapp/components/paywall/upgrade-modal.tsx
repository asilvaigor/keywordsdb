import { ArrowRight, Check, Gem, Loader2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { plans } from "@/components/landing/pricing";
import { trustFeatures } from "@/components/paywall";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { billingPortal } from "@/lib/stripe/billing-portal";

function UpgradeModal({
  open,
  onOpenChange,
  email,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email?: string;
}) {
  const [isBillingPending, startBillingTransition] = useTransition();
  const plan = plans.find((p) => p.name === "Max");
  if (!plan) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gem className="size-4 text-primary" />
            Upgrade to Max
          </DialogTitle>
          <DialogDescription>
            Exporting to CSV or Parquet is not available in your current plan.
            Upgrade to the Max plan to access this feature.
          </DialogDescription>
        </DialogHeader>

        {/* Max plan features */}
        <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
          <div className="flex items-baseline gap-2">
            <span className="text-lg text-muted-foreground line-through">
              {plan.monthly.originalPrice}
            </span>
            <span className="text-3xl font-bold">{plan.monthly.price}</span>
            <span className="text-muted-foreground">/month</span>
          </div>
          <ul className="space-y-2">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Trust signals */}
        <div className="grid grid-cols-2 gap-2">
          {trustFeatures.map((feature) => (
            <div
              key={feature.label}
              className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/30 p-2"
            >
              <feature.icon className="h-4 w-4 shrink-0 text-primary" />
              <span className="text-[11px] text-muted-foreground leading-tight">
                {feature.label}
              </span>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button
            disabled={isBillingPending}
            onClick={() => {
              if (!email) return;
              startBillingTransition(async () => {
                const result = await billingPortal({ email });
                if (result?.error) {
                  toast.error(result.error);
                }
              });
            }}
          >
            {isBillingPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Manage subscription
            <ArrowRight className="h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default UpgradeModal;
