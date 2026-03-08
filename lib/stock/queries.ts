import { getSupabaseServer } from "@/lib/supabase/server";

export async function fetchActiveProducts() {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from("products")
    .select("id,name,base_price,stock,active")
    .eq("active", true)
    .order("name");

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchMovements(params: {
  type?: "IN" | "OUT";
  from?: string; // yyyy-mm-dd
  to?: string;   // yyyy-mm-dd
  limit?: number;
}) {
  const supabase = await getSupabaseServer();

  let q = supabase
    .from("stock_tx")
    .select(
      `
      id,
      type,
      created_at,
      stock_tx_lines(
        quantity,
        price,
        products(name)
      )
    `
    )
    .order("created_at", { ascending: false })
    .limit(params.limit ?? 50);

  if (params.type) q = q.eq("type", params.type);
  if (params.from) q = q.gte("created_at", `${params.from}T00:00:00`);
  if (params.to) q = q.lte("created_at", `${params.to}T23:59:59`);

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data ?? [];
}