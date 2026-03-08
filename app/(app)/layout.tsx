import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";

type ProfileRow = {
  id: string;
  name: string | null;
  role: "admin" | "employee" | null;
};

type NavItem = {
  href: string;
  label: string;
  icon: string;
  roles: Array<"admin" | "employee">;
};

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await getSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,name,role")
    .eq("id", user.id)
    .single<ProfileRow>();

  const role: "admin" | "employee" =
    profile?.role === "admin" ? "admin" : "employee";

  const navItems: NavItem[] = [
    { href: "/", label: "Dashboard", icon: "🏠", roles: ["admin", "employee"] },
    { href: "/products", label: "Produtos", icon: "📦", roles: ["admin"] },
    { href: "/stock", label: "Stock", icon: "📊", roles: ["admin", "employee"] },
    { href: "/stock/in", label: "Entradas", icon: "➕", roles: ["admin"] },
    { href: "/stock/out", label: "Vendas", icon: "🧾", roles: ["admin", "employee"] },
    { href: "/movements", label: "Movimentos", icon: "📈", roles: ["admin", "employee"] },
    { href: "/settings", label: "Configuração", icon: "⚙️", roles: ["admin"] },
  ];

  const visibleNavItems = navItems.filter((item) => item.roles.includes(role));

  async function signOut() {
    "use server";
    const supabase = await getSupabaseServer();
    await supabase.auth.signOut();
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[290px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <p className="text-sm text-slate-400">Aplicação</p>
                <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
                  Stock Loja
                </h2>
              </div>

              <div className="relative h-14 w-14 overflow-hidden rounded-full border border-slate-200 bg-white">
                <Image
                  src="/logo_redondo.png"
                  alt="Sandra Cosméticos"
                  fill
                  className="object-cover"
                  sizes="56px"
                  priority
                />
              </div>
            </div>

            <nav className="mt-5 space-y-4">
              {visibleNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 text-base font-medium text-slate-600 transition hover:text-slate-900"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-400">Sessão</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">
              {profile?.name || user.email}
            </p>
            <p className="mt-1 text-sm text-slate-500">{user.email}</p>
            <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
              Perfil: {role}
            </p>

            <form action={signOut} className="mt-4">
              <button
                type="submit"
                className="inline-flex h-10 w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                Terminar sessão
              </button>
            </form>
          </div>
        </aside>

        <div className="min-w-0 space-y-6">
          <header className="flex items-center justify-between gap-4 rounded-[28px] border border-slate-200 bg-white px-6 py-4 shadow-sm">
            <div>
              <p className="text-sm text-slate-400">Bem-vindo</p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                Gestão de Stock em tempo real
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-base text-slate-600">{user.email}</span>
              <div className="relative h-10 w-10 overflow-hidden rounded-full border border-slate-300 bg-white">
                <Image
                  src="/logo_redondo.png"
                  alt="Sandra Cosméticos"
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              </div>
            </div>
          </header>

          <section>{children}</section>
        </div>
      </div>
    </div>
  );
}