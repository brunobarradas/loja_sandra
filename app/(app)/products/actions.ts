"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServer } from "@/lib/supabase/server";

type ActionState = {
  ok: boolean;
  message: string;
};

async function requireAdmin() {
  const supabase = await getSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      message: "Sessão inválida.",
      supabase: null,
      user: null,
    } as const;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: "admin" | "employee" | null }>();

  if (profile?.role !== "admin") {
    return {
      ok: false,
      message: "Sem permissão para gerir produtos.",
      supabase: null,
      user: null,
    } as const;
  }

  return {
    ok: true,
    message: "",
    supabase,
    user,
  } as const;
}

export async function createProductAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const auth = await requireAdmin();

  if (!auth.ok || !auth.supabase) {
    return { ok: false, message: auth.message };
  }

  const supabase = auth.supabase;

  const name = String(formData.get("name") ?? "").trim();
  const basePriceRaw = String(formData.get("base_price") ?? "").trim();
  const stockRaw = String(formData.get("stock") ?? "").trim();
  const activeRaw = String(formData.get("active") ?? "true").trim();

  if (!name) {
    return { ok: false, message: "Indica o nome do produto." };
  }

  const basePrice = Number(basePriceRaw.replace(",", "."));
  if (!Number.isFinite(basePrice) || basePrice < 0) {
    return { ok: false, message: "Preço base inválido." };
  }

  const stock = stockRaw ? Number(stockRaw) : 0;
  if (!Number.isFinite(stock) || stock < 0) {
    return { ok: false, message: "Stock inválido." };
  }

  const active = activeRaw === "true";

  const { error } = await supabase.from("products").insert({
    name,
    base_price: basePrice,
    stock,
    active,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/products");
  revalidatePath("/stock");
  revalidatePath("/");

  return { ok: true, message: "Produto criado com sucesso." };
}

export async function updateProductAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const auth = await requireAdmin();

  if (!auth.ok || !auth.supabase) {
    return { ok: false, message: auth.message };
  }

  const supabase = auth.supabase;

  const productId = String(formData.get("product_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const basePriceRaw = String(formData.get("base_price") ?? "").trim();
  const stockRaw = String(formData.get("stock") ?? "").trim();
  const activeRaw = String(formData.get("active") ?? "true").trim();

  if (!productId) {
    return { ok: false, message: "Seleciona um produto para alterar." };
  }

  if (!name) {
    return { ok: false, message: "Indica o nome do produto." };
  }

  const basePrice = Number(basePriceRaw.replace(",", "."));
  if (!Number.isFinite(basePrice) || basePrice < 0) {
    return { ok: false, message: "Preço base inválido." };
  }

  const stock = stockRaw ? Number(stockRaw) : 0;
  if (!Number.isFinite(stock) || stock < 0) {
    return { ok: false, message: "Stock inválido." };
  }

  const active = activeRaw === "true";

  const { error } = await supabase
    .from("products")
    .update({
      name,
      base_price: basePrice,
      stock,
      active,
    })
    .eq("id", productId);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/products");
  revalidatePath("/stock");
  revalidatePath("/");

  return { ok: true, message: "Produto alterado com sucesso." };
}