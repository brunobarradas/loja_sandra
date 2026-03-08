// app/(app)/stock/out/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/browser";
import { kz } from "@/lib/utils/money";

type Product = {
  id: string;
  name: string;
  stock: number;
  base_price: number;
};

type Line = {
  product_id: string;
  quantity: string;   // string para input
  unit_price: string; // string para input
};

const MAX_LINES = 5;

function toNumber(v: string) {
  const n = Number(String(v ?? "").trim().replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

export default function StockOutPage() {
  const supabase = useMemo(() => getSupabaseBrowser(), []);

  const [products, setProducts] = useState<Product[]>([]);
  const [lines, setLines] = useState<Line[]>(
    Array.from({ length: MAX_LINES }, () => ({ product_id: "", quantity: "", unit_price: "" }))
  );

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id,name,stock,base_price")
        .eq("active", true)
        .order("name", { ascending: true });

      if (error) {
        setMsg({ ok: false, text: error.message });
        return;
      }

      setProducts((data ?? []) as any);
    })();
  }, [supabase]);

  const productMap = useMemo(() => {
    const m = new Map<string, Product>();
    for (const p of products) m.set(p.id, p);
    return m;
  }, [products]);

  function setLine(idx: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  function clearAll() {
    setLines(Array.from({ length: MAX_LINES }, () => ({ product_id: "", quantity: "", unit_price: "" })));
    setMsg(null);
  }

  const computed = useMemo(() => {
    const payload = [];
    let total = 0;

    for (const l of lines) {
      if (!l.product_id) continue;

      const q = toNumber(l.quantity);
      const p = toNumber(l.unit_price);

      if (!Number.isFinite(q) || q <= 0) continue;
      if (!Number.isFinite(p) || p < 0) continue;

      payload.push({
        product_id: l.product_id,
        quantity: q,
        unit_price: p,
      });

      total += q * p;
    }

    return { payload, total };
  }, [lines]);

  async function submit() {
    setMsg(null);

    // validação: pelo menos 1 linha válida
    if (computed.payload.length === 0) {
      setMsg({ ok: false, text: "Preenche pelo menos 1 linha (produto + quantidade + preço)." });
      return;
    }

    // validações por linha: stock e duplicados (opcional)
    // Vamos impedir duplicados para não confundir (podes permitir se quiseres somar).
    const seen = new Set<string>();
    for (const l of computed.payload) {
      if (seen.has(l.product_id)) {
        setMsg({ ok: false, text: "Não repitas o mesmo produto em linhas diferentes. Junta a quantidade numa só linha." });
        return;
      }
      seen.add(l.product_id);

      const prod = productMap.get(l.product_id);
      if (prod && Number(prod.stock ?? 0) < l.quantity) {
        setMsg({ ok: false, text: `Stock insuficiente para "${prod.name}". Disponível: ${prod.stock}` });
        return;
      }
    }

    setSaving(true);
    try {
      const { data: txId, error } = await supabase.rpc("create_stock_tx", {
  p_type: "OUT",
  p_lines: computed.payload,
});

if (error) {
  setMsg({ ok: false, text: error.message });
  return;
}

if (!txId) {
  setMsg({ ok: false, text: "Não foi possível obter o ID da transação." });
  return;
}

window.open(`/api/tx/${txId}/pdf`, "_blank");

setMsg({ ok: true, text: "Venda registada e stock atualizado ✅" });

      // refrescar lista de produtos para mostrar stock atualizado
      const { data } = await supabase
        .from("products")
        .select("id,name,stock,base_price")
        .eq("active", true)
        .order("name", { ascending: true });

      setProducts((data ?? []) as any);

      // limpar inputs
      setLines(Array.from({ length: MAX_LINES }, () => ({ product_id: "", quantity: "", unit_price: "" })));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Vendas</h1>
          <p className="text-sm text-zinc-600">Regista até 5 linhas numa venda (produto, quantidade e preço aplicado).</p>
        </div>

<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="rounded-2xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white">
          Total: {kz(computed.total)}
        </div>

        {msg ? (
          <div
            className={`rounded-2xl px-4 py-2.5 text-sm font-semibold ${
              msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
            }`}
          >
            {msg.text}
          </div>
        ) : null}
      </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={clearAll}
            className="rounded-2xl border bg-white px-4 py-2.5 text-sm font-semibold hover:bg-zinc-50"
            disabled={saving}
          >
            Limpar
          </button>

          <button
            type="button"
            onClick={submit}
            className="rounded-2xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
            disabled={saving}
          >
            {saving ? "A registar…" : "Registar venda"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {lines.map((l, idx) => {
          const prod = l.product_id ? productMap.get(l.product_id) : undefined;

          return (
            <div key={idx} className="rounded-3xl border bg-white p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                <div className="sm:col-span-6">
                  <label className="text-sm font-semibold">Produto (linha {idx + 1})</label>
                  <select
                    className="mt-1 w-full rounded-2xl border px-4 py-2.5"
                    value={l.product_id}
                    onChange={(e) => {
                      const id = e.target.value;
                      const p = id ? productMap.get(id) : undefined;
                      setLine(idx, {
                        product_id: id,
                        unit_price: p ? String(p.base_price ?? 0) : "",
                      });
                    }}
                  >
                    <option value="">Escolher produto…</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — Stock: {p.stock} — {kz(p.base_price)}
                      </option>
                    ))}
                  </select>

                  <div className="mt-2 text-xs text-zinc-500">
                    {prod ? `Stock atual: ${prod.stock} · Preço base: ${kz(prod.base_price)}` : "—"}
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label className="text-sm font-semibold">Quantidade</label>
                  <input
                    className="mt-1 w-full rounded-2xl border px-4 py-2.5"
                    placeholder="Ex: 2"
                    value={l.quantity}
                    onChange={(e) => setLine(idx, { quantity: e.target.value })}
                    inputMode="numeric"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="text-sm font-semibold">Preço venda (Kz)</label>
                  <input
                    className="mt-1 w-full rounded-2xl border px-4 py-2.5"
                    placeholder={prod ? String(prod.base_price ?? 0) : "Ex: 1500"}
                    value={l.unit_price}
                    onChange={(e) => setLine(idx, { unit_price: e.target.value })}
                    inputMode="decimal"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      
    </div>
  );
}