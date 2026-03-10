import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import ProductCreateForm from "./products/ProductCreateForm";
import { kz } from "@/utils/money";

type ProductRow = {
  id: string;
  name: string;
  base_price: number | null;
  stock: number | null;
  active: boolean | null;
  created_at: string | null;
};

export default async function ProductsPage() {
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
    .select("id,name,base_price,stock,active,created_at")
    .order("created_at", { ascending: false })
    .returns<ProductRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return (
    <main className="space-y-6">
      <section>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
          Produtos
        </h1>
        <p className="mt-2 text-base text-slate-500">
          Gestão do catálogo de produtos da loja.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              Novo produto
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Adiciona um produto ao catálogo.
            </p>
          </div>

          <div className="mt-6">
            <ProductCreateForm />
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">
                Lista de produtos
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Produtos registados no sistema.
              </p>
            </div>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              {products?.length ?? 0} produtos
            </span>
          </div>

          <div className="mt-6 overflow-x-auto">
            {!products || products.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
                Ainda não existem produtos registados.
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
                      Stock
                    </th>
                    <th className="px-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Estado
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

                      <td className="px-4 py-4 text-sm text-slate-700">
                        {product.stock ?? 0}
                      </td>

                      <td className="rounded-r-2xl px-4 py-4">
                        {product.active ? (
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                            Ativo
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-700">
                            Inativo
                          </span>
                        )}
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