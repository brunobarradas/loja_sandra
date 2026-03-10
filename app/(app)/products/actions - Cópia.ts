"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function createProductAction(_: any, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();

  const raw = String(formData.get("sale_price") ?? "").trim();
  const normalized = raw.replace(",", ".");
  const base_price = Number(normalized);

  if (!name) {
    return { ok: false, message: "Nome é obrigatório." };
  }

  if (!Number.isFinite(base_price)) {
    return { ok: false, message: "Preço inválido." };
  }

  const supabase = await getSupabaseServer();

  const { error } = await supabase.from("products").insert({
    name,
    base_price,
    stock: 0,
    active: true
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/products");

  return { ok: true, message: "Produto criado com sucesso" };
}