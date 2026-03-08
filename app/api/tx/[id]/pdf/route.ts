import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, PDFPage, StandardFonts, rgb } from "pdf-lib";
import { getSupabaseServer } from "@/lib/supabase/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

type TxRow = {
  id: string;
  type: "IN" | "OUT";
  created_at: string;
  user_id: string;
};

type ProfileRow = {
  id: string;
  name: string | null;
};

type LineRow = {
  id: string;
  quantity: number;
  price: number;
  product: {
    name: string | null;
  } | null;
};

function kz(value: number) {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "AOA",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDateTimePT(value: string) {
  const d = new Date(value);
  return new Intl.DateTimeFormat("pt-PT", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}

function drawCenteredText(
  page: PDFPage,
  text: string,
  y: number,
  size: number,
  pageWidth: number,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>
) {
  const textWidth = font.widthOfTextAtSize(text, size);
  const x = Math.max(0, (pageWidth - textWidth) / 2);

  page.drawText(text, {
    x,
    y,
    size,
    font,
    color: rgb(0, 0, 0),
  });
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const supabase = await getSupabaseServer();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { data: tx, error: txError } = await supabase
    .from("stock_tx")
    .select("id, type, created_at, user_id")
    .eq("id", id)
    .single<TxRow>();

  if (txError || !tx) {
    return NextResponse.json(
      { error: "Transação não encontrada" },
      { status: 404 }
    );
  }

  if (tx.type !== "OUT") {
    return NextResponse.json(
      { error: "PDF disponível apenas para saídas" },
      { status: 400 }
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name")
    .eq("id", tx.user_id)
    .single<ProfileRow>();

  const { data: lines, error: linesError } = await supabase
    .from("stock_tx_lines")
    .select(`
      id,
      quantity,
      price,
      product:products (
        name
      )
    `)
    .eq("tx_id", tx.id)
    .returns<LineRow[]>();

  if (linesError || !lines || lines.length === 0) {
    return NextResponse.json(
      { error: "Linhas da transação não encontradas" },
      { status: 404 }
    );
  }

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // 59 mm ≈ 167 pt
  const pageWidth = 167;
  const topPadding = 12;
  const bottomPadding = 16;
  const leftX = 6;
  const lineHeight = 11;

  // altura calculada com base no conteúdo
  const estimatedHeight =
    topPadding +
    72 + // logo
    16 + // espaço
    12 + // nome da loja
    12 + // subtítulo
    16 + // espaço
    12 + // data
    12 + // operador
    12 + // separador
    lines.length * 34 + // linhas do recibo
    12 + // separador final
    16 + // total
    16 + // transação
    bottomPadding;

  let pageHeight = Math.max(estimatedHeight, 260);
  const page = pdfDoc.addPage([pageWidth, pageHeight]);

  let y = pageHeight - topPadding;

  // Logo
  try {
    const logoPath = path.join(process.cwd(), "public", "logo_redondo.png");
    const logoBytes = await readFile(logoPath);
    const logoImage = await pdfDoc.embedPng(logoBytes);

    const logoSize = 72;
    const logoX = (pageWidth - logoSize) / 2;
    const logoY = y - logoSize;

    page.drawImage(logoImage, {
      x: logoX,
      y: logoY,
      width: logoSize,
      height: logoSize,
    });

    y = logoY - 10;
  } catch {
    // Se o logo não existir, o recibo continua a ser gerado.
    y -= 6;
  }

  drawCenteredText(page, "Sandra Cosméticos", y, 10, pageWidth, fontBold);
  y -= 13;

  drawCenteredText(page, "Recibo de Venda", y, 8, pageWidth, font);
  y -= 16;

  page.drawText(`Data: ${formatDateTimePT(tx.created_at)}`, {
    x: leftX,
    y,
    size: 7,
    font,
  });
  y -= lineHeight;

  page.drawText(`Operador: ${profile?.name || "Utilizador"}`, {
    x: leftX,
    y,
    size: 7,
    font,
  });
  y -= lineHeight;

  page.drawText("--------------------------------", {
    x: leftX,
    y,
    size: 7,
    font,
  });
  y -= lineHeight;

  let grandTotal = 0;

  for (const line of lines) {
    const qty = Number(line.quantity || 0);
    const unitPrice = Number(line.price || 0);
    const total = qty * unitPrice;
    grandTotal += total;

    const productName = line.product?.name || "Produto";

    page.drawText(productName.slice(0, 26), {
      x: leftX,
      y,
      size: 8,
      font: fontBold,
    });
    y -= lineHeight;

    page.drawText(`${qty} x ${kz(unitPrice)}`, {
      x: leftX,
      y,
      size: 7,
      font,
    });
    y -= lineHeight;

    page.drawText(`Total: ${kz(total)}`, {
      x: leftX,
      y,
      size: 7,
      font,
    });
    y -= lineHeight + 3;
  }

  page.drawText("--------------------------------", {
    x: leftX,
    y,
    size: 7,
    font,
  });
  y -= lineHeight + 2;

  page.drawText(`TOTAL: ${kz(grandTotal)}`, {
    x: leftX,
    y,
    size: 9,
    font: fontBold,
  });
  y -= 16;

  page.drawText(`Tx: ${tx.id.slice(0, 8).toUpperCase()}`, {
    x: leftX,
    y,
    size: 6,
    font,
  });

  const pdfBytes = await pdfDoc.save();

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="saida-${tx.id}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}