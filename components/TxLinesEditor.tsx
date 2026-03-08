"use client";

import { useMemo, useState } from "react";
import type { Product, TxLineInput } from "@/lib/stock/types";

type Props = {
  products: Product[];
  mode: "IN" | "OUT";
  onChange: (lines: TxLineInput[]) => void;
};

export default function TxLinesEditor({ products, mode, onChange }: Props) {
  const [lines, setLines] = useState<TxLineInput[]>([
    { product_id: "", quantity: 1, price: 0 },
  ]);

  const productMap = useMemo(() => {
    const m = new Map<string, Product>();
    products.forEach((p) => m.set(p.id, p));
    return m;
  }, [products]);

  function sync(next: TxLineInput[]) {
    setLines(next);
    onChange(next);
  }

  function addLine() {
    sync([...lines, { product_id: "", quantity: 1, price: 0 }]);
  }

  function removeLine(i: number) {
    const next = lines.filter((_, idx) => idx !== i);
    sync(next.length ? next : [{ product_id: "", quantity: 1, price: 0 }]);
  }

  function update(i: number, patch: Partial<TxLineInput>) {
    const next = [...lines];
    next[i] = { ...next[i], ...patch };

    // se escolher produto em OUT: pré-preencher preço com base_price
    if (patch.product_id) {
      const p = productMap.get(patch.product_id);
      if (p) {
        next[i].price = mode === "OUT" ? Number(p.base_price) : Number(next[i].price ?? 0);
      }
    }

    sync(next);
  }

  return (
    <div className="space-y-3">
      {lines.map((l, i) => {
        const p = l.product_id ? productMap.get(l.product_id) : null;

        return (
          <div key={i} className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-6">
              <label className="text-sm text-gray-600">Produto</label>
              <select
                className="w-full border rounded-lg p-2"
                value={l.product_id}
                onChange={(e) => update(i, { product_id: e.target.value })}
              >
                <option value="">Selecionar…</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {mode === "OUT" ? `(stock: ${p.stock})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="text-sm text-gray-600">Qtd</label>
              <input
                className="w-full border rounded-lg p-2"
                type="number"
                min={1}
                value={l.quantity}
                onChange={(e) => update(i, { quantity: Number(e.target.value) })}
              />
            </div>

            <div className="col-span-3">
              <label className="text-sm text-gray-600">
                {mode === "OUT" ? "Preço aplicado" : "Preço (opcional)"}
              </label>
              <input
                className="w-full border rounded-lg p-2"
                type="number"
                step="0.01"
                value={l.price}
                onChange={(e) => update(i, { price: Number(e.target.value) })}
                placeholder={p ? String(p.base_price) : "0"}
              />
            </div>

            <div className="col-span-1 flex gap-2">
              <button
                type="button"
                className="w-full border rounded-lg p-2 hover:bg-gray-50"
                onClick={() => removeLine(i)}
                title="Remover"
              >
                ✕
              </button>
            </div>
          </div>
        );
      })}

      <div className="flex gap-2">
        <button
          type="button"
          className="border rounded-lg px-4 py-2 hover:bg-gray-50"
          onClick={addLine}
        >
          + Adicionar linha
        </button>
      </div>
    </div>
  );
}