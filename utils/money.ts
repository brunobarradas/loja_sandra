export function kz(value: number | string | null | undefined): string {
  if (value === null || value === undefined) {
    return "0,00 Kz";
  }

  const num =
    typeof value === "string"
      ? Number(value.replace(",", "."))
      : Number(value);

  if (!Number.isFinite(num)) {
    return "0,00 Kz";
  }

  return (
    new Intl.NumberFormat("pt-PT", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num) + " Kz"
  );
}