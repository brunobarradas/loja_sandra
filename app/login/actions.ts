"use server";

import { scryptSync, timingSafeEqual } from "node:crypto";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type LoginProfileRow = {
  id: string;
  email: string | null;
  pin_hash: string | null;
  role: "admin" | "employee" | null;
};

function verifyPin(pin: string, stored: string | null): boolean {
  if (!stored) return false;

  const parts = stored.split(":");
  if (parts.length !== 2) return false;

  const [salt, originalHash] = parts;

  const candidateHash = scryptSync(pin, salt, 64).toString("hex");

  const a = Buffer.from(candidateHash, "hex");
  const b = Buffer.from(originalHash, "hex");

  if (a.length !== b.length) return false;

  return timingSafeEqual(a, b);
}

function authPasswordFromPin(pin: string): string {
  const pepper = process.env.PIN_AUTH_PEPPER;

  if (!pepper) {
    throw new Error("PIN_AUTH_PEPPER não está definida.");
  }

  return `${pin}-${pepper}`;
}

export async function loginWithPinAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const pin = String(formData.get("pin") ?? "").trim();

  if (!email) {
    throw new Error("Indica o email.");
  }

  if (!/^\d{4}$/.test(pin)) {
    throw new Error("Indica um PIN válido de 4 números.");
  }

  const supabaseAdmin = getSupabaseAdmin();

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id,email,pin_hash,role")
    .ilike("email", email)
    .single<LoginProfileRow>();

  if (profileError || !profile) {
    throw new Error("Utilizador não encontrado.");
  }

  const pinOk = verifyPin(pin, profile.pin_hash);

  if (!pinOk) {
    throw new Error("PIN inválido.");
  }

  const authEmail = profile.email ?? email;
  const authPassword = authPasswordFromPin(pin);
  const supabase = await getSupabaseServer();

  let { error: signInError } = await supabase.auth.signInWithPassword({
    email: authEmail,
    password: authPassword,
  });

  if (signInError) {
    const { error: syncError } = await supabaseAdmin.auth.admin.updateUserById(
      profile.id,
      {
        password: authPassword,
        email_confirm: true,
      }
    );

    if (syncError) {
      throw new Error(
        `Falha ao sincronizar o PIN com o sistema de autenticação: ${syncError.message}`
      );
    }

    const retry = await supabase.auth.signInWithPassword({
      email: authEmail,
      password: authPassword,
    });

    signInError = retry.error ?? null;
  }

  if (signInError) {
    throw new Error(`Não foi possível iniciar sessão: ${signInError.message}`);
  }

  redirect("/");
}