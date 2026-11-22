import { NextRequest, NextResponse } from "next/server";
import { readQueue, writeQueue } from "@/lib/automation-engine";

// GET /api/admin/automations/queue — returns last 200 tasks sorted by createdAt desc
export async function GET(req: NextRequest) {
  const adminPassword = req.headers.get("x-admin-password");
  if (!adminPassword || adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const queue = await readQueue();
  const sorted = [...queue]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 200);

  return NextResponse.json(sorted);
}

// DELETE /api/admin/automations/queue — remove completed/failed/cancelled tasks
export async function DELETE(req: NextRequest) {
  const adminPassword = req.headers.get("x-admin-password");
  if (!adminPassword || adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const queue = await readQueue();
  const cleaned = queue.filter((t) => t.status === "pending");
  await writeQueue(cleaned);

  return NextResponse.json({ success: true, removed: queue.length - cleaned.length });
}
