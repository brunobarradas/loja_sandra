import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getSupabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

type ProductRow = {
  id: string;
  name: string;
  stock: number | null;
  base_price: number | null;
  active: boolean | null;
};

function kz(value: number) {
  return new Intl.NumberFormat("pt-PT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value) + " Kz";
}

function formatDateTimePT(value: Date) {
  return new Intl.DateTimeFormat("pt-PT", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(value);
}

export async function GET() {
  const supabase = await getSupabaseServer();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { data: products, error } = await supabase
    .from("products")
    .select("id,name,stock,base_price,active")
    .eq("active", true)
    .order("name", { ascending: true })
    .returns<ProductRow[]>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 40;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - 40;

  // Logo
  try {
    const logoPath = path.join(process.cwd(), "public", "logo_redondo.png");
    const logoBytes = await readFile(logoPath);
    const logoImage = await pdfDoc.embedPng(logoBytes);

    const logoSize = 52;

    page.drawImage(logoImage, {
      x: margin,
      y: y - logoSize,
      width: logoSize,
      height: logoSize,
    });
  } catch {
    // continua sem logo se não conseguir ler
  }

  page.drawText("Relatório de Stock Atual", {
    x: margin + 70,
    y: y - 10,
    size: 18,
    font: fontBold,
    color: rgb(0.05, 0.05, 0.05),
  });

  page.drawText(`Data e hora de impressão: ${formatDateTimePT(new Date())}`, {
    x: margin + 70,
    y: y - 30,
    size: 10,
    font,
    color: rgb(0.25, 0.25, 0.25),
  });

  y -= 80;

  page.drawText(
    "Nota: Os preços apresentados correspondem ao preço base atual e podem variar a qualquer momento.",
    {
      x: margin,
      y,
      size: 10,
      font,
      color: rgb(0.35, 0.35, 0.35),
      maxWidth: pageWidth - margin * 2,
    }
  );

  y -= 30;

  // Cabeçalho da tabela
  page.drawRectangle({
    x: margin,
    y: y - 6,
    width: pageWidth - margin * 2,
    height: 22,
    color: rgb(0.93, 0.94, 0.96),
  });

  const colX = {
    produto: margin + 6,
    quantidade: 390,
    preco: 470,
  };

  page.drawText("Produto", {
    x: colX.produto,
    y,
    size: 10,
    font: fontBold,
  });

  page.drawText("Quantidade", {
    x: colX.quantidade,
    y,
    size: 10,
    font: fontBold,
  });

  page.drawText("Preço base", {
    x: colX.preco,
    y,
    size: 10,
    font: fontBold,
  });

  y -= 24;

  for (const product of products ?? []) {
    if (y < 60) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - 50;

      page.drawRectangle({
        x: margin,
        y: y - 6,
        width: pageWidth - margin * 2,
        height: 22,
        color: rgb(0.93, 0.94, 0.96),
      });

      page.drawText("Produto", {
        x: colX.produto,
        y,
        size: 10,
        font: fontBold,
      });

      page.drawText("Quantidade", {
        x: colX.quantidade,
        y,
        size: 10,
        font: fontBold,
      });

      page.drawText("Preço base", {
        x: colX.preco,
        y,
        size: 10,
        font: fontBold,
      });

      y -= 24;
    }

    page.drawText(product.name ?? "-", {
      x: colX.produto,
      y,
      size: 10,
      font,
      maxWidth: 300,
    });

    page.drawText(String(product.stock ?? 0), {
      x: colX.quantidade,
      y,
      size: 10,
      font,
    });

    page.drawText(kz(Number(product.base_price ?? 0)), {
      x: colX.preco,
      y,
      size: 10,
      font,
    });

    y -= 18;

    page.drawLine({
      start: { x: margin, y: y + 4 },
      end: { x: pageWidth - margin, y: y + 4 },
      thickness: 0.5,
      color: rgb(0.85, 0.85, 0.85),
    });
  }

  const pdfBytes = await pdfDoc.save();

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="stock-atual.pdf"',
      "Cache-Control": "no-store",
    },
  });
}