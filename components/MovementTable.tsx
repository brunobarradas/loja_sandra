import type { MovementRow } from "@/lib/stock/types";

export default function MovementTable({ rows }: { rows: MovementRow[] }) {
  return (
    <div className="bg-white rounded-xl shadow p-6 overflow-x-auto">
      <table className="w-full">
        <thead className="border-b">
          <tr className="text-left">
            <th className="p-2">Data</th>
            <th className="p-2">Tipo</th>
            <th className="p-2">Linhas</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((tx) => (
            <tr key={tx.id} className="border-b align-top">
              <td className="p-2 whitespace-nowrap">
                {new Date(tx.created_at).toLocaleString("pt-PT")}
              </td>
              <td className="p-2 font-semibold">{tx.type}</td>
              <td className="p-2">
                <div className="space-y-1">
                  {tx.stock_tx_lines?.map((l, idx) => (
                    <div key={idx} className="text-sm">
                      <span className="font-medium">
                        {l.products?.name ?? "Produto"}
                      </span>
                      {" — "}
                      Qtd: {l.quantity}
                      {" — "}
                      Preço: {l.price ?? 0} €
                    </div>
                  ))}
                </div>
              </td>
            </tr>
          ))}

          {rows.length === 0 && (
            <tr>
              <td className="p-4 text-gray-500" colSpan={3}>
                Sem movimentos.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}