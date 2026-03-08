// components/SalesChart.tsx
"use client";

import { kz } from "@/lib/utils/money";

type Row = { month: string; total: number };

export default function SalesChart({ data }: { data?: Row[] }) {
  const rows = Array.isArray(data) ? data : [];

  return (
    <div className="space-y-2">
      {rows.length === 0 ? (
        <div className="rounded-2xl border bg-zinc-50 p-4 text-sm text-zinc-600">
          Sem dados de vendas ainda.
        </div>
      ) : (
        rows.map((r) => (
          <div
            key={r.month}
            className="flex items-center justify-between rounded-2xl border bg-white px-4 py-3"
          >
            <div className="text-sm font-semibold">{r.month}</div>
            <div className="text-sm text-zinc-600">{kz(r.total || 0)}</div>
          </div>
        ))
      )}
    </div>
  );
}