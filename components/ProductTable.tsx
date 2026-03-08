"use client"

import { Product } from "@/lib/stock/types"

export default function ProductTable({products}:{products:Product[]}){

return(

<table className="w-full border">

<thead>
<tr className="bg-gray-100">
<th>Produto</th>
<th>Preço</th>
<th>Stock</th>
</tr>
</thead>

<tbody>

{products.map(p=>(
<tr key={p.id} className="border-t">
<td>{p.name}</td>
<td>{p.base_price}€</td>
<td>{p.stock}</td>
</tr>
))}

</tbody>

</table>

)

}