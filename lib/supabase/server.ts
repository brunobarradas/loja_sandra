// lib/supabase/server.ts
import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";

function parseCookieHeader(cookieHeader: string | null) {
  if (!cookieHeader) return [];
  return cookieHeader
    .split(";")
    .map((c) => c.trim())
    .filter(Boolean)
    .map((pair) => {
      const idx = pair.indexOf("=");
      const name = idx >= 0 ? pair.slice(0, idx) : pair;
      const value = idx >= 0 ? pair.slice(idx + 1) : "";
      return { name, value };
    });
}

export async function getSupabaseServer() {
  // Next 16: em certos contexts isto precisa de await
  const cookieStore = await cookies();
  const hdrs = await headers();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        const getAll = (cookieStore as any).getAll;
        if (typeof getAll === "function") return getAll.call(cookieStore);

        // Fallback: parse ao header "cookie"
        const cookieHeader = (hdrs as any).get?.("cookie") ?? null;
        return parseCookieHeader(cookieHeader);
      },

      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            (cookieStore as any).set?.(name, value, options);
          });
        } catch {
          // Em alguns Server Components pode ser readonly; em Server Actions funciona
        }
      },
    },
  });
}