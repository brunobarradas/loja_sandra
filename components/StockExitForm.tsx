"use client";

import { useState } from "react";
import type { Product, TxLineInput } from "@/lib/stock/types";
import TxLinesEditor from "./TxLinesEditor";
import { createStockOut } from "@/lib/stock/actions";

export default function StockExitForm({ products }: { products: Product[] }) {
  const [lines, setLines] = useState<TxLineInput[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setMsg(null);

    const res = await createStockOut(lines);
    setBusy(false);

    if (!res.ok) return setMsg(res.message ?? "Erro.");
    setMsg(`Venda registada (${res.txId})`);
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <TxLinesEditor products={products} mode="OUT" onChange={setLines} />

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={submit}
          disabled={busy}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60"
        >
          {busy ? "A registar..." : "Confirmar venda"}
        </button>

        {msg && <div className="text-sm text-gray-700">{msg}</div>}
      </div>
    </div>
  );
}