"use client";

import { useState } from "react";
import type { Product, TxLineInput } from "@/lib/stock/types";
import TxLinesEditor from "./TxLinesEditor";
import { createStockIn } from "@/lib/stock/actions";

export default function StockEntryForm({ products }: { products: Product[] }) {
  const [lines, setLines] = useState<TxLineInput[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setMsg(null);

    const res = await createStockIn(lines);
    setBusy(false);

    if (!res.ok) return setMsg(res.message ?? "Erro.");
    setMsg(`Entrada criada (${res.txId})`);
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <TxLinesEditor products={products} mode="IN" onChange={setLines} />

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={submit}
          disabled={busy}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-60"
        >
          {busy ? "A guardar..." : "Guardar entrada"}
        </button>

        {msg && <div className="text-sm text-gray-700">{msg}</div>}
      </div>
    </div>
  );
}