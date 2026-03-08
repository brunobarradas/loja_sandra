import PageHeader from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { getSupabaseServer } from "@/lib/supabase/server";

type TxLite = {
  created_at: string | null;
  type: string | null;
  user_id: string | null;
};

type ProductLite = {
  name: string | null;
};

type MovementRow = {
  id: string;
  quantity: number | null;
  stock_tx: TxLite | null;
  product: ProductLite | null;
};

function formatDateTimePT(iso?: string | null) {
  if (!iso) return "—";

  const d = new Date(iso);

  return new Intl.DateTimeFormat("pt-PT", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function badgeClass(type?: string | null) {
  if (type === "IN") return "bg-emerald-50 text-emerald-700";
  if (type === "OUT") return "bg-rose-50 text-rose-700";
  return "bg-zinc-100 text-zinc-700";
}

export default async function MovementsPage() {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from("stock_tx_lines")
    .select(
      `
      id,
      quantity,
      stock_tx:tx_id (
        created_at,
        type,
        user_id
      ),
      product:product_id (
        name
      )
    `
    )
    .limit(200);

  let rows: MovementRow[] = (data ?? []) as any[];

  /*
  ORDENAR CORRETAMENTE
  1) por data mais recente
  2) depois por tipo
  */
  rows = rows.sort((a, b) => {
    const da = new Date(a.stock_tx?.created_at ?? 0).getTime();
    const db = new Date(b.stock_tx?.created_at ?? 0).getTime();

    return db - da;
  });

  const userIds = Array.from(
    new Set(
      rows
        .map((r) => r.stock_tx?.user_id)
        .filter((v): v is string => typeof v === "string" && v.length > 0)
    )
  );

  const userMap = new Map<string, string>();

  if (userIds.length) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id,name")
      .in("id", userIds);

    (profs ?? []).forEach((p: any) => {
      userMap.set(p.id, p.name ?? "—");
    });
  }

  return (
    <div className="space-y-6">

      <PageHeader
        title="Movimentos"
        subtitle="Histórico detalhado de entradas e saídas"
      />

      <Card>

        <CardHeader
          title="Últimos movimentos"
          subtitle={
            error
              ? `Erro: ${error.message}`
              : `A mostrar ${rows.length} movimentos`
          }
        />

        <div className="mt-4 overflow-x-auto">

          <table className="w-full text-sm">

            <thead className="text-left text-zinc-500">

              <tr className="border-b">
                <th className="py-2">Data</th>
                <th className="py-2">Tipo</th>
                <th className="py-2">Utilizador</th>
                <th className="py-2">Produto</th>
                <th className="py-2 text-right">Quantidade</th>
              </tr>

            </thead>

            <tbody>

              {rows.map((r) => {

                const tx = r.stock_tx;
                const userId = tx?.user_id ?? "";
                const who = userId ? userMap.get(userId) ?? "—" : "—";
                const productName = r.product?.name ?? "—";
                const qty = Number(r.quantity ?? 0);

                return (

                  <tr key={r.id} className="border-b last:border-b-0">

                    <td className="py-2">
                      {formatDateTimePT(tx?.created_at)}
                    </td>

                    <td className="py-2">

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClass(
                          tx?.type
                        )}`}
                      >
                        {tx?.type ?? "—"}
                      </span>

                    </td>

                    <td className="py-2 font-semibold">
                      {who}
                    </td>

                    <td className="py-2 font-medium">
                      {productName}
                    </td>

                    <td className="py-2 text-right font-semibold">
                      {qty}
                    </td>

                  </tr>

                );

              })}

              {rows.length === 0 && (
                <tr>
                  <td className="py-6 text-zinc-500" colSpan={5}>
                    Sem movimentos registados
                  </td>
                </tr>
              )}

            </tbody>

          </table>

        </div>

      </Card>

    </div>
  );
}