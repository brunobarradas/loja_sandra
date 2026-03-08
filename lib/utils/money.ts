// lib/utils/money.ts
export function kz(value: number) {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat("pt-AO", {
    style: "currency",
    currency: "AOA",
    minimumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);
}