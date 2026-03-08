// components/AppShell.tsx
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";

function NavItem({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
    >
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-white border shadow-sm group-hover:bg-zinc-50">
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </Link>
  );
}

export default function AppShell({
  userEmail,
  children,
}: {
  userEmail: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <div className="mx-auto flex max-w-7xl gap-6 p-4">
        {/* Sidebar */}
        <aside className="hidden w-72 shrink-0 md:block">
          <div className="sticky top-4 space-y-4">
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-zinc-500">Aplicação</div>
                  <div className="text-lg font-semibold leading-tight">
                    Stock Loja
                  </div>
                </div>
                <div className="h-10 w-10 rounded-2xl bg-zinc-900" />
              </div>

              <div className="mt-4 h-px bg-zinc-100" />

              <nav className="mt-4 space-y-1">
                <NavItem
                  href="/"
                  label="Dashboard"
                  icon={<span className="text-xs">🏠</span>}
                />
                <NavItem
                  href="/products"
                  label="Produtos"
                  icon={<span className="text-xs">📦</span>}
                />
		<NavItem
    		  href="/stock"
        	  label="Stock"
    		  icon={<span className="text-xs">📊</span>}
  		/>
                <NavItem
                  href="/stock/in"
                  label="Entradas"
                  icon={<span className="text-xs">➕</span>}
                />
                <NavItem
                  href="/stock/out"
                  label="Vendas"
                  icon={<span className="text-xs">🧾</span>}
                />
                <NavItem
                  href="/movements"
                  label="Movimentos"
                  icon={<span className="text-xs">📈</span>}
                />
              </nav>
            </div>

            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="text-xs text-zinc-500">Sessão</div>
              <div className="mt-1 truncate text-sm font-medium">{userEmail}</div>
              <div className="mt-3">
                <LogoutButton />
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="min-w-0 flex-1">
          {/* Topbar */}
          <header className="mb-6 rounded-2xl border bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="text-xs text-zinc-500">Bem-vindo</div>
                <div className="truncate text-base font-semibold">
                  Gestão de Stock em tempo real
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-sm text-zinc-600 truncate max-w-[260px]">
                  {userEmail}
                </div>
                <div className="h-10 w-10 rounded-2xl border bg-zinc-50" />
              </div>
            </div>
          </header>

          <main className="space-y-6">{children}</main>

          <footer className="py-8 text-center text-xs text-zinc-500">
            Stock Loja · MVP
          </footer>
        </div>
      </div>
    </div>
  );
}