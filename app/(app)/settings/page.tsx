import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { createUserAction, resetPinAction } from "./actions";

type ProfileRow = {
  id: string;
  name: string | null;
  role: "admin" | "employee" | null;
  email: string | null;
};

export default async function SettingsPage() {
  const supabase = await getSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: me } = await supabase
    .from("profiles")
    .select("id,name,role,email")
    .eq("id", user.id)
    .single<ProfileRow>();

  if (me?.role !== "admin") {
    redirect("/");
  }

  const { data: users } = await supabase
    .from("profiles")
    .select("id,name,role,email")
    .order("name", { ascending: true });

  return (
    <main className="space-y-6">
      <section className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
            Configuração
          </h1>
          <p className="mt-2 text-base text-slate-500">
            Gestão de utilizadores, perfis e PINs.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              Criar novo utilizador
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Define nome, email, tipo de utilizador e PIN de 4 números.
            </p>
          </div>

          <form action={createUserAction} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Nome
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="h-11 w-full rounded-2xl border border-slate-300 px-4 text-sm outline-none transition focus:border-slate-500"
                placeholder="Ex.: Maria Silva"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="h-11 w-full rounded-2xl border border-slate-300 px-4 text-sm outline-none transition focus:border-slate-500"
                placeholder="maria@loja.pt"
              />
            </div>

            <div>
              <label
                htmlFor="role"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Tipo de utilizador
              </label>
              <select
                id="role"
                name="role"
                required
                defaultValue="employee"
                className="h-11 w-full rounded-2xl border border-slate-300 px-4 text-sm outline-none transition focus:border-slate-500"
              >
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="pin"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                PIN (4 números)
              </label>
              <input
                id="pin"
                name="pin"
                type="password"
                inputMode="numeric"
                pattern="\d{4}"
                maxLength={4}
                required
                className="h-11 w-full rounded-2xl border border-slate-300 px-4 text-sm outline-none transition focus:border-slate-500"
                placeholder="0000"
              />
            </div>

            <button
              type="submit"
              className="inline-flex h-11 items-center rounded-full bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Criar utilizador
            </button>
          </form>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              Reset PIN
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Atualiza o PIN na tabela e no Supabase Auth.
            </p>
          </div>

          <form action={resetPinAction} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="user_id"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Utilizador
              </label>
              <select
                id="user_id"
                name="user_id"
                required
                className="h-11 w-full rounded-2xl border border-slate-300 px-4 text-sm outline-none transition focus:border-slate-500"
              >
                <option value="">Seleciona um utilizador</option>
                {(users ?? []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {(item.name || "Sem nome") + " — " + (item.email || "Sem email")}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="new_pin"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Novo PIN (4 números)
              </label>
              <input
                id="new_pin"
                name="new_pin"
                type="password"
                inputMode="numeric"
                pattern="\d{4}"
                maxLength={4}
                required
                className="h-11 w-full rounded-2xl border border-slate-300 px-4 text-sm outline-none transition focus:border-slate-500"
                placeholder="0000"
              />
            </div>

            <button
              type="submit"
              className="inline-flex h-11 items-center rounded-full bg-amber-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700"
            >
              Resetar PIN
            </button>
          </form>
        </article>
      </section>

      <section>
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              Utilizadores existentes
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Lista atual de perfis disponíveis no sistema.
            </p>
          </div>

          <div className="mt-6 space-y-3">
            {!users || users.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                Ainda não existem utilizadores.
              </div>
            ) : (
              users.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 p-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">
                      {item.name || "Sem nome"}
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {item.email || "Sem email"}
                    </p>
                  </div>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase text-slate-700">
                    {item.role || "employee"}
                  </span>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </main>
  );
}