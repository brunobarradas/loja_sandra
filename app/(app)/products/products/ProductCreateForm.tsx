"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import {
  createProductAction,
  updateProductAction,
} from "../actions";

type ProductOption = {
  id: string;
  name: string;
  base_price: number | null;
  stock: number | null;
  active: boolean | null;
};

type Props = {
  products: ProductOption[];
};

type ActionState = {
  ok: boolean;
  message: string;
};

const initialState: ActionState = { ok: false, message: "" };

export default function ProductCreateForm({ products }: Props) {
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [selectedProductId, setSelectedProductId] = useState("");

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId) ?? null,
    [products, selectedProductId]
  );

  const [createState, createFormAction, createPending] = useActionState(
    createProductAction,
    initialState
  );

  const [editState, editFormAction, editPending] = useActionState(
    updateProductAction,
    initialState
  );

  const [name, setName] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [stock, setStock] = useState("0");
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (mode === "create") {
      setName("");
      setBasePrice("");
      setStock("0");
      setActive(true);
      return;
    }

    if (selectedProduct) {
      setName(selectedProduct.name ?? "");
      setBasePrice(String(selectedProduct.base_price ?? 0));
      setStock(String(selectedProduct.stock ?? 0));
      setActive(Boolean(selectedProduct.active));
    }
  }, [mode, selectedProduct]);

  const state = mode === "create" ? createState : editState;
  const pending = mode === "create" ? createPending : editPending;
  const formAction = mode === "create" ? createFormAction : editFormAction;

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setMode("create");
                setSelectedProductId("");
              }}
              className={`inline-flex h-11 items-center rounded-full px-5 text-sm font-semibold transition ${
                mode === "create"
                  ? "bg-slate-900 text-white"
                  : "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
              }`}
            >
              Criar produto
            </button>

            <button
              type="button"
              onClick={() => setMode("edit")}
              className={`inline-flex h-11 items-center rounded-full px-5 text-sm font-semibold transition ${
                mode === "edit"
                  ? "bg-slate-900 text-white"
                  : "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
              }`}
            >
              Alterar produto
            </button>
          </div>

          {mode === "edit" && (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Produto a alterar
              </label>
              <select
                name="product_id_select"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="h-11 w-full rounded-2xl border border-slate-300 px-4 text-sm outline-none transition focus:border-slate-500"
                required
              >
                <option value="">Seleciona um produto</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {mode === "edit" && (
            <input type="hidden" name="product_id" value={selectedProductId} />
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_160px]">
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Nome
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Arroz 1kg"
                className="h-14 w-full rounded-3xl border border-slate-900/80 px-5 text-sm outline-none transition focus:border-slate-900"
              />
            </div>

            <div>
              <label
                htmlFor="base_price"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Preço base (€)
              </label>
              <input
                id="base_price"
                name="base_price"
                type="number"
                min="0"
                step="0.01"
                required
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                placeholder="1,99"
                className="h-14 w-full rounded-3xl border border-slate-900/80 px-5 text-sm outline-none transition focus:border-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-[160px_1fr]">
            <div>
              <label
                htmlFor="stock"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Stock
              </label>
              <input
                id="stock"
                name="stock"
                type="number"
                min="0"
                step="1"
                required
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-300 px-4 text-sm outline-none transition focus:border-slate-500"
              />
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="h-4 w-4"
                />
                Produto ativo
              </label>
              <input
                type="hidden"
                name="active"
                value={active ? "true" : "false"}
              />
            </div>
          </div>

          <div className="pt-1">
            {mode === "create" ? (
              <Button type="submit" disabled={pending}>
                {pending ? "A guardar..." : "Criar produto"}
              </Button>
            ) : (
              <Button type="submit" disabled={pending || !selectedProductId}>
                {pending ? "A guardar..." : "Gravar alteração"}
              </Button>
            )}
          </div>

          {state.message ? (
            <p
              className={
                state.ok
                  ? "text-sm text-emerald-600"
                  : "text-sm text-red-600"
              }
            >
              {state.message}
            </p>
          ) : null}
        </div>
      </form>
    </div>
  );
}