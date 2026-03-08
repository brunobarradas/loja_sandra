// app/(app)/stock/page.tsx
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { getSupabaseServer } from "@/lib/supabase/server";
import { kz } from "@/lib/utils/money";

export default async function StockPage() {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from("products")
    .select("id,name,stock,base_price,active")
    .order("name", { ascending: true });

  const rows = error ? [] : (data ?? []);

  return (
    <div className="space-y-6">
      <PageHeader title="Stock" subtitle="Stock atual por produto." />

      <Card>
        <CardHeader title="Stock atual" subtitle={`Produtos: ${rows.length}`} />

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-zinc-500">
              <tr className="border-b">
                <th className="py-2">Produto</th>
                <th className="py-2">Stock</th>
                <th className="py-2">Preço base (Kz)</th>
                <th className="py-2">Ativo</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((p: any) => (
                <tr key={p.id} className="border-b last:border-b-0">
                  <td className="py-2 font-medium">{p.name}</td>
                  <td className="py-2">{Number(p.stock ?? 0)}</td>
                  <td className="py-2">{kz(p.base_price)}</td>
                  <td className="py-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        p.active ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-700"
                      }`}
                    >
                      {p.active ? "Sim" : "Não"}
                    </span>
                  </td>
                </tr>
              ))}

              {rows.length === 0 ? (
                <tr>
                  <td className="py-6 text-zinc-500" colSpan={4}>
                    Ainda não há produtos.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}