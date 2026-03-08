"use client";

import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase/browser";

export default function LogoutButton() {
  const router = useRouter();

  return (
    <button
      onClick={async () => {
        const supabase = getSupabaseBrowser();
        await supabase.auth.signOut();
        router.replace("/login");
        router.refresh();
      }}
      className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50"
    >
      Terminar sessão
    </button>
  );
}