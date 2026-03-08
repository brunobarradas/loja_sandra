"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function createStockInAction(_: any, formData: FormData) {
  const product_id = String(formData.get("product_id") ?? "");
  const qty = Number(String(formData.get("qty") ?? "").replace(",", "."));

  if (!product_id) {
    return { ok: false, message: "Seleciona um produto." };
  }

  if (!Number.isFinite(qty) || qty <= 0) {
    return { ok: false, message: "Quantidade inválida." };
  }

  const supabase = await getSupabaseServer();

  const { error } = await supabase.rpc("create_stock_tx", {
    p_type: "IN",
    p_lines: [
      {
        product_id: product_id,
        quantity: qty
      }
    ]
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/stock");
  revalidatePath("/stock/in");
  revalidatePath("/movements");

  return { ok: true, message: "Entrada de stock registada com sucesso." };
}