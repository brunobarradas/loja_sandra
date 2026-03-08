import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { kz } from "@/utils/money";

type ProfileRow = {
  id: string;
  name: string | null;
  role: "admin" | "employee" | null;
};

type SalesMonthRow = {
  month: string;
  total: number | string | null;
};

type TopProductRow = {
  product_id: string;
  product_name: string;
  total_qty: number | string;
  total_value: number | string;
};

type LowStockRow = {
  id: string;
  name: string;
  stock: number;
};

function toNumber(value: number | string | null | undefined) {
  if (value == null) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function monthKeyNow() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export default async function DashboardPage() {
  const supabase = await getSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,name,role")
    .eq("id", user.id)
    .single<ProfileRow>();

  const role: "admin" | "employee" =
    profile?.role === "admin" ? "admin" : "employee";

  const isAdmin = role === "admin";

  const [
    { count: productsCount },
    { count: stockZeroCount },
    salesMonthRes,
    { count: movementsTodayCount },
    topProductsRes,
    lowStockRes,
  ] = await Promise.all([
    supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("active", true),

    supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("active", true)
      .lte("stock", 0),

    isAdmin
      ? supabase
          .from("sales_per_month")
          .select("month,total")
          .order("month", { ascending: false })
      : Promise.resolve({ data: [], error: null }),

    supabase
      .from("stock_tx")
      .select("*", { count: "exact", head: true })
      .gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),

    isAdmin
      ? supabase.rpc("top_selling_products", { p_limit: 10 })
      : Promise.resolve({ data: [], error: null }),

    supabase
      .from("products")
      .select("id,name,stock")
      .eq("active", true)
      .order("stock", { ascending: true })
      .limit(5),
  ]);

  const salesMonth = (salesMonthRes.data ?? []) as SalesMonthRow[];
  const topProducts = (topProductsRes.data ?? []) as TopProductRow[];
  const lowStock = (lowStockRes.data ?? []) as LowStockRow[];

  const currentMonth = monthKeyNow();
  const currentMonthSales =
    salesMonth.find((row) => row.month === currentMonth)?.total ?? 0;

  const latestMonths = salesMonth.slice(0, 6);

  return (
    <main className="space-y-6">
      <section className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
            Dashboard
          </h1>
          <p className="mt-2 text-base text-slate-500">
            {isAdmin
              ? "Visão geral: vendas, stock e atividade recente."
              : "Visão operacional da loja."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/stock/out"
            className="inline-flex h-11 items-center rounded-full bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            Nova venda
          </Link>

          {isAdmin && (
            <Link
              href="/stock/in"
              className="inline-flex h-11 items-center rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              Nova entrada
            </Link>
          )}
        </div>
      </section>

      <section
        className={`grid grid-cols-1 gap-4 md:grid-cols-2 ${
          isAdmin ? "xl:grid-cols-4" : "xl:grid-cols-3"
        }`}
      >
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Produtos</p>
          <p className="mt-3 text-4xl font-semibold text-slate-900">
            {productsCount ?? 0}
          </p>
          <p className="mt-2 text-sm text-slate-500">Total registado</p>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Stock baixo</p>
          <p className="mt-3 text-4xl font-semibold text-slate-900">
            {stockZeroCount ?? 0}
          </p>
          <p className="mt-2 text-sm text-slate-500">Stock a zero</p>
        </article>

        {isAdmin && (
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Vendas do mês</p>
            <p className="mt-3 text-4xl font-semibold text-slate-900">
              {kz(toNumber(currentMonthSales))}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Baseado em sales_per_month
            </p>
          </article>
        )}

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Movimentos hoje</p>
          <p className="mt-3 text-4xl font-semibold text-slate-900">
            {movementsTodayCount ?? 0}
          </p>
          <p className="mt-2 text-sm text-slate-500">Entradas + saídas</p>
        </article>
      </section>

      {isAdmin ? (
        <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">
                  Vendas (últimos meses)
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Tendência mensal. Se ainda não houver vendas, o gráfico fica
                  vazio.
                </p>
              </div>

              <Link
                href="/movements"
                className="inline-flex h-10 items-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                Ver movimentos
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              {latestMonths.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                  Ainda não existem dados de vendas por mês.
                </div>
              ) : (
                latestMonths.map((row) => (
                  <div
                    key={row.month}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3"
                  >
                    <span className="text-sm font-medium text-slate-900">
                      {row.month}
                    </span>
                    <span className="text-sm text-slate-600">
                      {kz(toNumber(row.total))}
                    </span>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">
                Top 10 produtos mais vendidos
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Ranking por quantidade vendida.
              </p>
            </div>

            <div className="mt-5 space-y-3">
              {topProducts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                  Ainda não existem vendas registadas.
                </div>
              ) : (
                topProducts.map((item, index) => (
                  <div
                    key={item.product_id}
                    className="rounded-2xl border border-slate-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">
                          {index + 1}. {item.product_name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {toNumber(item.total_qty)} unidades vendidas
                        </p>
                      </div>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        {kz(toNumber(item.total_value))}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">
                Operação rápida
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Acesso rápido às tarefas do dia.
              </p>
            </div>

            <div className="mt-5 grid gap-3">
              <Link
                href="/stock/out"
                className="rounded-2xl border border-slate-200 p-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                Registar venda
              </Link>

              <Link
                href="/stock"
                className="rounded-2xl border border-slate-200 p-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                Ver stock
              </Link>

              <Link
                href="/movements"
                className="rounded-2xl border border-slate-200 p-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                Ver movimentos
              </Link>
            </div>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">
                Alertas de stock
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Produtos que exigem atenção.
              </p>
            </div>

            <div className="mt-5 space-y-3">
              {lowStock.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                  Sem alertas de stock neste momento.
                </div>
              ) : (
                lowStock.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 p-4"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {item.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Stock: {item.stock}
                      </p>
                    </div>

                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                      Baixo
                    </span>
                  </div>
                ))
              )}
            </div>
          </article>
        </section>
      )}

      {isAdmin && (
        <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="xl:col-start-3">
            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">
                  Alertas de stock
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Top 5 com stock mais baixo.
                </p>
              </div>

              <div className="mt-5 space-y-3">
                {lowStock.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                    Sem alertas de stock neste momento.
                  </div>
                ) : (
                  lowStock.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-2xl border border-slate-200 p-4"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {item.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Stock: {item.stock}
                        </p>
                      </div>

                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                        Baixo
                      </span>
                    </div>
                  ))
                )}
              </div>
            </article>
          </div>
        </section>
      )}
    </main>
  );
}