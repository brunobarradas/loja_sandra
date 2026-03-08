import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, PDFPage, StandardFonts, rgb } from "pdf-lib";
import { getSupabaseServer } from "@/lib/supabase/server";

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

function drawTableHeader(
  page: PDFPage,
  pageWidth: number,
  y: number,
  marginX: number,
  fontBold: Awaited<ReturnType<PDFDocument["embedFont"]>>
) {
  const colX = {
    produto: marginX,
    quantidade: 300,
    unitario: 380,
    total: 480,
  };

  page.drawRectangle({
    x: marginX,
    y: y - 6,
    width: pageWidth - marginX * 2,
    height: 22,
    color: rgb(0.92, 0.92, 0.92),
  });

  page.drawText("Produto", {
    x: colX.produto,
    y,
    size: 10,
    font: fontBold,
  });

  page.drawText("Qtd.", {
    x: colX.quantidade,
    y,
    size: 10,
    font: fontBold,
  });

  page.drawText("Valor Unitário", {
    x: colX.unitario,
    y,
    size: 10,
    font: fontBold,
  });

  page.drawText("Valor Total", {
    x: colX.total,
    y,
    size: 10,
    font: fontBold,
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
    return NextResponse.json({ error: "Transação não encontrada" }, { status: 404 });
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

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const marginX = 40;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - 50;

  page.drawText("Saída de Stock", {
    x: marginX,
    y,
    size: 18,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  y -= 28;

  page.drawText(`Transação: ${tx.id}`, {
    x: marginX,
    y,
    size: 10,
    font,
  });

  y -= 16;

  page.drawText(`Data: ${formatDateTimePT(tx.created_at)}`, {
    x: marginX,
    y,
    size: 10,
    font,
  });

  y -= 16;

  page.drawText(`Utilizador: ${profile?.name || "Utilizador"}`, {
    x: marginX,
    y,
    size: 10,
    font,
  });

  y -= 30;

  drawTableHeader(page, pageWidth, y, marginX, fontBold);
  y -= 24;

  const colX = {
    produto: marginX,
    quantidade: 300,
    unitario: 380,
    total: 480,
  };

  let grandTotal = 0;

  for (const line of lines) {
    const qty = Number(line.quantity || 0);
    const unitPrice = Number(line.price || 0);
    const total = qty * unitPrice;
    grandTotal += total;

    if (y < 80) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - 50;

      page.drawText("Continuação", {
        x: marginX,
        y,
        size: 14,
        font: fontBold,
      });

      y -= 28;
      drawTableHeader(page, pageWidth, y, marginX, fontBold);
      y -= 24;
    }

    page.drawText(line.product?.name || "Produto", {
      x: colX.produto,
      y,
      size: 10,
      font,
    });

    page.drawText(String(qty), {
      x: colX.quantidade,
      y,
      size: 10,
      font,
    });

    page.drawText(kz(unitPrice), {
      x: colX.unitario,
      y,
      size: 10,
      font,
    });

    page.drawText(kz(total), {
      x: colX.total,
      y,
      size: 10,
      font,
    });

    y -= 18;
  }

  y -= 10;

  page.drawLine({
    start: { x: marginX, y },
    end: { x: pageWidth - marginX, y },
    thickness: 1,
    color: rgb(0.7, 0.7, 0.7),
  });

  y -= 20;

  page.drawText("Total Geral:", {
    x: 380,
    y,
    size: 11,
    font: fontBold,
  });

  page.drawText(kz(grandTotal), {
    x: 480,
    y,
    size: 11,
    font: fontBold,
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