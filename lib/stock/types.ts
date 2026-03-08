export type Product = {
  id: string;
  name: string;
  base_price: number;
  stock: number;
  active: boolean;
};

export type TxLineInput = {
  product_id: string;
  quantity: number;
  price: number; // preço aplicado (OUT) / custo opcional (IN). Envia sempre número.
};

export type MovementRow = {
  id: string;
  type: "IN" | "OUT";
  created_at: string;
  stock_tx_lines: {
    quantity: number;
    price: number | null;
    products: { name: string } | null;
  }[];
};