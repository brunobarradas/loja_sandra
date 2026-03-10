import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { kz } from "@/utils/money";

type ProductRow = {
  id: string;
  name: string;
  stock: number | null;
  base_price: number | null;
  active: boolean | null;
};

export default async function StockPage() {
  const supabase = await getSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: products, error } = await supabase
    .from("products")
    .select("id,name,stock,base_price,active")
    .eq("active", true)
    .order("name", { ascending: true })
    .returns<ProductRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return (
    <main className="space-y-6">
      <section className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
            Stock
          </h1>
          <p className="mt-2 text-base text-slate-500">
            Stock atual por produto.
          </p>
        </div>

        <Link
          href="/api/stock/pdf"
          target="_blank"
          className="inline-flex h-11 items-center rounded-full bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          Exportar PDF
        </Link>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            Stock atual
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Produtos: {products?.length ?? 0}
          </p>
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
                    Stock
                  </th>
                  <th className="px-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Preço base (Kz)
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
                      {product.stock ?? 0}
                    </td>

                    <td className="rounded-r-2xl px-4 py-4 text-sm text-slate-700">
                      {kz(Number(product.base_price ?? 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </main>
  );
}