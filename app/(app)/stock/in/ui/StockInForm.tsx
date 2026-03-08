"use client";

import { useActionState } from "react";
import Button from "@/components/ui/Button";
import { createStockInAction } from "../actions";

const initialState = { ok: false, message: "" };

export default function StockInForm({
  products,
}: {
  products: { id: string; name: string; stock: number }[];
}) {
  const [state, action, pending] = useActionState(createStockInAction, initialState);

  return (
    <form action={action} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
      <div className="sm:col-span-2">
        <label className="text-sm font-semibold">Produto</label>
        <select
          name="product_id"
          className="mt-1 w-full rounded-2xl border px-4 py-2.5"
          required
          defaultValue=""
        >
          <option value="" disabled>
            Seleciona...
          </option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} (stock: {p.stock})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-semibold">Quantidade</label>
        <input
          name="qty"
          className="mt-1 w-full rounded-2xl border px-4 py-2.5"
          placeholder="Ex: 10"
          required
        />
      </div>

      <div className="flex items-end">
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "A guardar..." : "Guardar entrada"}
        </Button>
      </div>

      {state?.message ? (
        <div
          className={`sm:col-span-4 rounded-2xl px-4 py-2 text-sm font-semibold ${
            state.ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
          }`}
        >
          {state.message}
        </div>
      ) : null}
    </form>
  );
}