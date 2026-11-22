import { NextRequest, NextResponse } from "next/server";
import {
  readConfig,
  scheduleTask,
  cancelPendingTasks,
  type AutomationTaskType,
} from "@/lib/automation-engine";

type TrackBody = {
  event: "cart_add" | "purchase" | "register" | "post_purchase";
  userId: string;
  email: string;
  firstName: string;
  data: {
    productTitle?: string;
    cartUrl?: string;
    reviewUrl?: string;
    productUrl?: string;
  };
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as TrackBody;
    const { event, userId, email, firstName, data } = body;

    if (!event || !userId || !email) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }

    const config = await readConfig();
    const now = new Date();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    if (event === "cart_add") {
      if (!config.abandonedCart.enabled) {
        return NextResponse.json({ ok: true, skipped: "disabled" });
      }

      // Cancel previous pending cart tasks for this user
      const cartTypes: AutomationTaskType[] = ["abandoned_cart_step1", "abandoned_cart_step2"];
      await cancelPendingTasks(userId, cartTypes);

      // Schedule step 1
      const step1At = new Date(now.getTime() + config.abandonedCart.step1DelayHours * 60 * 60 * 1000);
      await scheduleTask({
        type: "abandoned_cart_step1",
        userId,
        email,
        firstName,
        data: { productTitle: data.productTitle, cartUrl: data.cartUrl ?? `${appUrl}/checkout` },
        executeAt: step1At.toISOString(),
      });

      // Schedule step 2
      const step2At = new Date(now.getTime() + config.abandonedCart.step2DelayHours * 60 * 60 * 1000);
      await scheduleTask({
        type: "abandoned_cart_step2",
        userId,
        email,
        firstName,
        data: { productTitle: data.productTitle, cartUrl: data.cartUrl ?? `${appUrl}/checkout` },
        executeAt: step2At.toISOString(),
      });

      return NextResponse.json({ ok: true, scheduled: 2 });
    }

    if (event === "purchase") {
      // Cancel all pending cart tasks
      const cartTypes: AutomationTaskType[] = ["abandoned_cart_step1", "abandoned_cart_step2"];
      await cancelPendingTasks(userId, cartTypes);
      return NextResponse.json({ ok: true });
    }

    if (event === "post_purchase") {
      if (!config.postPurchase.enabled) {
        return NextResponse.json({ ok: true, skipped: "disabled" });
      }

      const executeAt = new Date(now.getTime() + config.postPurchase.delayDays * 24 * 60 * 60 * 1000);
      await scheduleTask({
        type: "post_purchase",
        userId,
        email,
        firstName,
        data: {
          productTitle: data.productTitle,
          reviewUrl: data.reviewUrl ?? `${appUrl}/ebooks`,
        },
        executeAt: executeAt.toISOString(),
      });

      return NextResponse.json({ ok: true, scheduled: 1 });
    }

    if (event === "register") {
      if (!config.welcome.enabled) {
        return NextResponse.json({ ok: true, skipped: "disabled" });
      }

      const stepTypes: AutomationTaskType[] = ["welcome_step0", "welcome_step1", "welcome_step2"];
      for (let i = 0; i < config.welcome.steps.length && i < 3; i++) {
        const step = config.welcome.steps[i];
        const executeAt = new Date(now.getTime() + step.delayHours * 60 * 60 * 1000);
        await scheduleTask({
          type: stepTypes[i],
          userId,
          email,
          firstName,
          data: {},
          executeAt: executeAt.toISOString(),
        });
      }

      return NextResponse.json({ ok: true, scheduled: config.welcome.steps.length });
    }

    return NextResponse.json({ error: "Événement inconnu" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
