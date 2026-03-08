"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServer } from "@/lib/supabase/server";
import { TxLineInput } from "./types";

function cleanLines(lines: TxLineInput[]) {
  const cleaned = lines
    .filter((l) => l.product_id && Number(l.quantity) > 0)
    .map((l) => ({
      product_id: l.product_id,
      quantity: Number(l.quantity),
      price: Number.isFinite(Number(l.price)) ? Number(l.price) : 0,
    }));

  if (cleaned.length === 0) throw new Error("Sem linhas válidas.");
  return cleaned;
}

export async function createStockIn(lines: TxLineInput[]) {
  const supabase = await getSupabaseServer();

  const p_lines = cleanLines(lines);

  const { data, error } = await supabase.rpc("create_stock_tx", {
    p_type: "IN",
    p_lines,
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath("/products");
  revalidatePath("/stock/in");
  revalidatePath("/movements");
  return { ok: true, txId: data as string };
}

export async function createStockOut(lines: TxLineInput[]) {
  const supabase = await getSupabaseServer();

  const p_lines = cleanLines(lines);

  const { data, error } = await supabase.rpc("create_stock_tx", {
    p_type: "OUT",
    p_lines,
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath("/products");
  revalidatePath("/stock/out");
  revalidatePath("/movements");
  return { ok: true, txId: data as string };
}