import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { kz } from "@/utils/money";

type ProductRow = {
  id: string;
  name: string;
  base_price: number | null;
  stock: number | null;
  active: boolean | null;
};

async function createStockInAction(formData: FormData) {
  "use server";

  const supabase = await getSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: "admin" | "employee" | null }>();

  if (profile?.role !== "admin") {
    throw new Error("Sem permissão para registar entradas.");
  }

  const productId = String(formData.get("product_id") ?? "").trim();
  const quantity = Number(formData.get("quantity") ?? 0);
  const unitPrice = Number(formData.get("unit_price") ?? 0);

  if (!productId) {
    throw new Error("Seleciona um produto.");
  }

  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error("Indica uma quantidade válida.");
  }

  if (!Number.isFinite(unitPrice) || unitPrice < 0) {
    throw new Error("Indica um preço unitário válido.");
  }

  const { error } = await supabase.rpc("create_stock_tx", {
    p_type: "IN",
    p_lines: [
      {
        product_id: productId,
        quantity,
        unit_price: unitPrice,
      },
    ],
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/stock/in");
  revalidatePath("/stock");
  revalidatePath("/movements");
  revalidatePath("/");
}

export default async function StockInPage() {
  const supabase = await getSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: "admin" | "employee" | null }>();

  if (profile?.role !== "admin") {
    redirect("/");
  }

  const { data: products, error } = await supabase
    .from("products")
    .select("id,name,base_price,stock,active")
    .eq("active", true)
    .order("name", { ascending: true })
    .returns<ProductRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return (
    <main className="space-y-6">
      <section>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
          Entradas de stock
        </h1>
        <p className="mt-2 text-base text-slate-500">
          Regista reposições e novas entradas de produtos.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              Nova entrada
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Seleciona o produto e indica a quantidade a adicionar.
            </p>
          </div>

          <form action={createStockInAction} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="product_id"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Produto
              </label>
              <select
                id="product_id"
                name="product_id"
                required
                className="h-11 w-full rounded-2xl border border-slate-300 px-4 text-sm outline-none transition focus:border-slate-500"
              >
                <option value="">Seleciona um produto</option>
                {(products ?? []).map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="quantity"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Quantidade
              </label>
              <input
                id="quantity"
                name="quantity"
                type="number"
                min="1"
                step="1"
                required
                defaultValue={1}
                className="h-11 w-full rounded-2xl border border-slate-300 px-4 text-sm outline-none transition focus:border-slate-500"
              />
            </div>

            <div>
              <label
                htmlFor="unit_price"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Preço unitário
              </label>
              <input
                id="unit_price"
                name="unit_price"
                type="number"
                min="0"
                step="0.01"
                required
                defaultValue={0}
                className="h-11 w-full rounded-2xl border border-slate-300 px-4 text-sm outline-none transition focus:border-slate-500"
              />
            </div>

            <button
              type="submit"
              className="inline-flex h-11 items-center rounded-full bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Registar entrada
            </button>
          </form>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">
                Produtos disponíveis
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Lista de produtos ativos prontos para reposição.
              </p>
            </div>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              {products?.length ?? 0} produtos
            </span>
          </div>

          <div className="mt-6 overflow-x-auto">
            {!products || products.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
                Ainda não existem produtos ativos.
              </div>
            ) : (
              <table className="min-w-full border-separate border-spacing-y-3">
                <thead>
                  <tr>
                    <th className="px-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Produto
                    </th>
                    <th className="px-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Preço base
                    </th>
                    <th className="px-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Stock atual
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {products.map((product) => (
                    <tr
                      key={product.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50"
                    >
                      <td className="rounded-l-2xl px-4 py-4 text-sm font-semibold text-slate-900">
                        {product.name}
                      </td>

                      <td className="px-4 py-4 text-sm text-slate-700">
                        {kz(Number(product.base_price ?? 0))}
                      </td>

                      <td className="rounded-r-2xl px-4 py-4 text-sm text-slate-700">
                        {product.stock ?? 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </article>
      </section>
    </main>
  );
}