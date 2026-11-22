import { NextRequest, NextResponse } from "next/server";
import { getAllTransactions, type UnifiedTransaction } from "@/lib/transaction-store";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

function checkAuth(req: NextRequest): boolean {
  const { searchParams } = new URL(req.url);
  const pw = searchParams.get("password") || req.headers.get("x-admin-password") || "";
  return pw === ADMIN_PASSWORD;
}

const STATUS_LABELS: Record<string, string> = {
  successful: "Réussi",
  failed: "Échoué",
  abandoned: "Abandonné",
  pending: "En attente",
};

function toCsv(rows: UnifiedTransaction[]): string {
  const headers = ["Date", "Heure", "Référence", "Client", "Email", "Téléphone", "Produit", "Montant (FCFA)", "Statut"];
  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [
    headers.map(escape).join(","),
    ...rows.map(r => {
      const d = new Date(r.ts);
      return [
        escape(d.toLocaleDateString("fr-FR")),
        escape(d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })),
        escape(r.reference),
        escape(r.customerName),
        escape(r.customerEmail),
        escape(r.customerPhone),
        escape(r.product),
        escape(r.amount),
        escape(STATUS_LABELS[r.status] || r.status),
      ].join(",");
    }),
  ];
  return "﻿" + lines.join("\r\n");
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") || "json";
  const statusFilter = searchParams.get("status") || "";
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let transactions = await getAllTransactions();

  if (statusFilter) {
    transactions = transactions.filter(t => t.status === statusFilter);
  }
  if (from) {
    const fromDate = new Date(from);
    transactions = transactions.filter(t => new Date(t.ts) >= fromDate);
  }
  if (to) {
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);
    transactions = transactions.filter(t => new Date(t.ts) <= toDate);
  }

  if (format === "csv") {
    return new Response(toCsv(transactions), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="ventes-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  const kpis = {
    total: transactions.length,
    successful: transactions.filter(t => t.status === "successful").length,
    failed: transactions.filter(t => t.status === "failed").length,
    abandoned: transactions.filter(t => t.status === "abandoned").length,
    pending: transactions.filter(t => t.status === "pending").length,
    revenue: transactions
      .filter(t => t.status === "successful")
      .reduce((sum, t) => sum + t.amount, 0),
  };

  return NextResponse.json({ transactions, kpis });
}
