"use client";

import { useActionState } from "react";
import Button from "@/components/ui/Button";
import { createProductAction } from "./actions";

const initialState = { ok: false, message: "" };

export default function ProductCreateForm() {
  const [state, action, pending] = useActionState(createProductAction, initialState);

  return (
    <form action={action} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="sm:col-span-2">
        <label className="text-sm font-semibold">Nome</label>
        <input
          name="name"
          className="mt-1 w-full rounded-2xl border px-4 py-2.5"
          placeholder="Ex: Arroz 1kg"
          required
        />
      </div>

      <div>
        <label className="text-sm font-semibold">Preço base (€)</label>
        <input
          name="sale_price"
          className="mt-1 w-full rounded-2xl border px-4 py-2.5"
          placeholder="1,99"
          required
        />
      </div>

      <div className="sm:col-span-3 flex items-center gap-3">
        <Button type="submit">{pending ? "A gravar..." : "Criar produto"}</Button>

        {state?.message ? (
          <div
            className={`rounded-2xl px-4 py-2 text-sm font-semibold ${
              state.ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
            }`}
          >
            {state.message}
          </div>
        ) : null}
      </div>
    </form>
  );
}