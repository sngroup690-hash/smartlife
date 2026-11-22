// Setup: crontab -e → */15 * * * * curl -s "http://localhost:3000/api/cron/automations?secret=ADMIN_PASSWORD_VALUE"
//
// This endpoint processes the automation queue and sends pending emails.
// Call every 15 minutes via cron.

import { NextRequest, NextResponse } from "next/server";
import {
  readConfig,
  readQueue,
  writeQueue,
  sendAutomationEmail,
  type AutomationTask,
  type AutomationsConfig,
} from "@/lib/automation-engine";

function getTemplateVars(
  task: AutomationTask,
  config: AutomationsConfig
): Record<string, string> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return {
    firstName: task.firstName,
    productTitle: task.data.productTitle ?? "",
    cartUrl: task.data.cartUrl ?? `${appUrl}/checkout`,
    reviewUrl: task.data.reviewUrl ?? `${appUrl}/ebooks`,
    siteUrl: appUrl,
  };
}

function getSubjectAndBody(
  task: AutomationTask,
  config: AutomationsConfig
): { subject: string; body: string } | null {
  switch (task.type) {
    case "abandoned_cart_step1":
      return {
        subject: config.abandonedCart.step1Subject,
        body: config.abandonedCart.step1Body,
      };
    case "abandoned_cart_step2":
      return {
        subject: config.abandonedCart.step2Subject,
        body: config.abandonedCart.step2Body,
      };
    case "post_purchase":
      return {
        subject: config.postPurchase.subject,
        body: config.postPurchase.body,
      };
    case "welcome_step0":
      return config.welcome.steps[0]
        ? { subject: config.welcome.steps[0].subject, body: config.welcome.steps[0].body }
        : null;
    case "welcome_step1":
      return config.welcome.steps[1]
        ? { subject: config.welcome.steps[1].subject, body: config.welcome.steps[1].body }
        : null;
    case "welcome_step2":
      return config.welcome.steps[2]
        ? { subject: config.welcome.steps[2].subject, body: config.welcome.steps[2].body }
        : null;
    default:
      return null;
  }
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (!secret || secret !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const now = new Date();
  const config = await readConfig();
  const queue = await readQueue();

  const due = queue.filter(
    (t) => t.status === "pending" && new Date(t.executeAt) <= now
  );

  let processed = 0;
  let failed = 0;

  for (const task of due) {
    const templateData = getSubjectAndBody(task, config);
    if (!templateData) {
      task.status = "failed";
      task.error = "Template introuvable";
      task.executedAt = now.toISOString();
      failed++;
      continue;
    }

    const vars = getTemplateVars(task, config);

    try {
      await sendAutomationEmail(task.email, templateData.subject, templateData.body, vars);
      task.status = "sent";
      task.executedAt = now.toISOString();
      processed++;
    } catch (err) {
      task.status = "failed";
      task.error = err instanceof Error ? err.message : String(err);
      task.executedAt = now.toISOString();
      failed++;
    }
  }

  if (due.length > 0) {
    await writeQueue(queue);
  }

  return NextResponse.json({ processed, failed, checked: due.length });
}
