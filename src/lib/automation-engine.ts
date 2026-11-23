import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const PRIVATE_DIR = path.join(process.cwd(), "private");
const CONFIG_FILE = path.join(PRIVATE_DIR, "automations-config.json");
const QUEUE_FILE = path.join(PRIVATE_DIR, "automation-queue.json");

// ─── Types ────────────────────────────────────────────────────────────────────

export type AutomationTaskType =
  | "abandoned_cart_step1"
  | "abandoned_cart_step2"
  | "post_purchase"
  | "welcome_step0"
  | "welcome_step1"
  | "welcome_step2";

export type AutomationTask = {
  id: string;
  type: AutomationTaskType;
  userId: string;
  email: string;
  firstName: string;
  data: {
    productTitle?: string;
    productUrl?: string;
    reviewUrl?: string;
    cartUrl?: string;
  };
  executeAt: string; // ISO
  status: "pending" | "sent" | "failed" | "cancelled";
  executedAt?: string;
  error?: string;
  createdAt: string;
};

export type WelcomeStep = {
  delayHours: number;
  subject: string;
  body: string;
};

export type AutomationsConfig = {
  abandonedCart: {
    enabled: boolean;
    step1DelayHours: number;
    step1Subject: string;
    step1Body: string;
    step2DelayHours: number;
    step2Subject: string;
    step2Body: string;
  };
  postPurchase: {
    enabled: boolean;
    delayDays: number;
    subject: string;
    body: string;
  };
  welcome: {
    enabled: boolean;
    steps: WelcomeStep[];
  };
};

const DEFAULT_CONFIG: AutomationsConfig = {
  abandonedCart: {
    enabled: false,
    step1DelayHours: 1,
    step1Subject: "Vous avez oublié quelque chose... 🛒",
    step1Body:
      "<p>Bonjour <strong>{{firstName}}</strong>,</p><p>Vous avez laissé <strong>{{productTitle}}</strong> dans votre panier. Ne laissez pas passer cette opportunité !</p><p><a href='{{cartUrl}}' style='background:#E8B800;color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block'>Finaliser mon achat →</a></p>",
    step2DelayHours: 24,
    step2Subject: "Dernière chance — votre panier vous attend 👀",
    step2Body:
      "<p>Bonjour <strong>{{firstName}}</strong>,</p><p>Votre panier avec <strong>{{productTitle}}</strong> est toujours disponible. Profitez-en maintenant !</p><p><a href='{{cartUrl}}' style='background:#E8B800;color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block'>Retourner à mon panier →</a></p>",
  },
  postPurchase: {
    enabled: false,
    delayDays: 3,
    subject: "Comment était votre expérience ? ⭐",
    body: "<p>Bonjour <strong>{{firstName}}</strong>,</p><p>Merci pour votre achat de <strong>{{productTitle}}</strong> il y a quelques jours. Votre avis nous aide beaucoup !</p><p><a href='{{reviewUrl}}' style='background:#E8B800;color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block'>Laisser mon avis →</a></p>",
  },
  welcome: {
    enabled: false,
    steps: [
      {
        delayHours: 0,
        subject: "Bienvenue sur SMART LIFE ! 🎉",
        body: "<p>Bonjour <strong>{{firstName}}</strong>,</p><p>Bienvenue dans la communauté SMART LIFE ! Votre compte est prêt.</p><p>Découvrez nos guides pratiques pour lancer et développer votre business.</p><p><a href='{{siteUrl}}/ebooks' style='background:#E8B800;color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block'>Explorer le catalogue →</a></p>",
      },
      {
        delayHours: 24,
        subject: "Nos conseils gratuits pour bien vous lancer 💡",
        body: "<p>Bonjour <strong>{{firstName}}</strong>,</p><p>Avez-vous lu nos conseils gratuits ? Métier par métier, ils vous montrent comment bien démarrer votre activité.</p><p><a href='{{siteUrl}}/conseils' style='background:#27A827;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block'>Lire les conseils →</a></p>",
      },
      {
        delayHours: 72,
        subject: "L'accompagnement SMART LIFE 🚀",
        body: "<p>Bonjour <strong>{{firstName}}</strong>,</p><p>Saviez-vous que nous proposons un accompagnement personnalisé ? Nos consultants vous aident à atteindre vos objectifs.</p><p><a href='{{siteUrl}}/accompagnement' style='background:#E8B800;color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block'>Découvrir l'accompagnement →</a></p>",
      },
    ],
  },
};

// ─── Config ───────────────────────────────────────────────────────────────────

export async function readConfig(): Promise<AutomationsConfig> {
  try {
    const raw = await readFile(CONFIG_FILE, "utf-8");
    return { ...DEFAULT_CONFIG, ...(JSON.parse(raw) as Partial<AutomationsConfig>) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export async function writeConfig(config: AutomationsConfig): Promise<void> {
  await mkdir(PRIVATE_DIR, { recursive: true });
  await writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
}

// ─── Queue ────────────────────────────────────────────────────────────────────

const MAX_QUEUE_SIZE = 1000;

export async function readQueue(): Promise<AutomationTask[]> {
  try {
    const raw = await readFile(QUEUE_FILE, "utf-8");
    return JSON.parse(raw) as AutomationTask[];
  } catch {
    return [];
  }
}

export async function writeQueue(queue: AutomationTask[]): Promise<void> {
  await mkdir(PRIVATE_DIR, { recursive: true });
  // Keep only last MAX_QUEUE_SIZE entries
  const trimmed = queue.slice(-MAX_QUEUE_SIZE);
  await writeFile(QUEUE_FILE, JSON.stringify(trimmed, null, 2), "utf-8");
}

// ─── Schedule / Cancel ────────────────────────────────────────────────────────

export async function scheduleTask(
  task: Omit<AutomationTask, "id" | "createdAt" | "status">
): Promise<void> {
  const queue = await readQueue();
  const newTask: AutomationTask = {
    ...task,
    id: crypto.randomUUID(),
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  queue.push(newTask);
  await writeQueue(queue);
}

export async function cancelPendingTasks(
  userId: string,
  types: AutomationTaskType[]
): Promise<void> {
  const queue = await readQueue();
  let changed = false;
  for (const task of queue) {
    if (
      task.userId === userId &&
      task.status === "pending" &&
      types.includes(task.type)
    ) {
      task.status = "cancelled";
      changed = true;
    }
  }
  if (changed) await writeQueue(queue);
}

// ─── Template replacement ─────────────────────────────────────────────────────

function applyTemplate(
  text: string,
  vars: Record<string, string>
): string {
  let result = text;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  return result;
}

// ─── Email sending ────────────────────────────────────────────────────────────

export async function sendAutomationEmail(
  to: string,
  subject: string,
  htmlBody: string,
  vars: Record<string, string>
): Promise<void> {
  const finalSubject = applyTemplate(subject, vars);
  const finalBody = applyTemplate(htmlBody, vars);

  const wrappedHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #ffffff; padding: 40px; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: #E8B800; font-size: 28px; margin: 0;">SMART LIFE</h1>
      </div>
      <div style="color: #ccc; font-size: 15px; line-height: 1.7;">
        ${finalBody}
      </div>
      <p style="color: #666; font-size: 12px; border-top: 1px solid #222; padding-top: 20px; margin-top: 32px;">
        Pour toute question : <a href="mailto:support@smartlifecm.com" style="color: #E8B800;">support@smartlifecm.com</a>
      </p>
    </div>
  `;

  console.log(`\n📧 AUTOMATION EMAIL`);
  console.log(`   À: ${to}`);
  console.log(`   Sujet: ${finalSubject}\n`);

  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM ?? "noreply@smartlifecm.com";

  if (resendKey) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject: finalSubject,
        html: wrappedHtml,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(`Resend error: ${JSON.stringify(err)}`);
    }
    console.log(`✅ Automation email sent via Resend to ${to}`);
  } else {
    console.log("ℹ️  RESEND_API_KEY non configuré — email simulé (automation)");
  }
}
