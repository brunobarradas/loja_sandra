import Image from "next/image";
import { loginWithPinAction } from "./actions";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-md rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="relative h-24 w-24 overflow-hidden rounded-full border border-slate-200 bg-white">
            <Image
              src="/logo_redondo.png"
              alt="Sandra Cosméticos"
              fill
              className="object-cover"
              sizes="96px"
              priority
            />
          </div>

          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-900">
            Sandra Cosméticos
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Entrar com email e PIN
          </p>
        </div>

        <form action={loginWithPinAction} className="space-y-4">
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
              className="h-12 w-full rounded-2xl border border-slate-300 px-4 text-sm outline-none transition focus:border-slate-500"
              placeholder="utilizador@loja.pt"
            />
          </div>

          <div>
            <label
              htmlFor="pin"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              PIN
            </label>
            <input
              id="pin"
              name="pin"
              type="password"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              required
              className="h-12 w-full rounded-2xl border border-slate-300 px-4 text-sm outline-none transition focus:border-slate-500"
              placeholder="0000"
            />
          </div>

          <button
            type="submit"
            className="inline-flex h-12 w-full items-center justify-center rounded-full bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            Entrar
          </button>
        </form>
      </div>
    </main>
  );
}