"use server";

import { randomBytes, scryptSync } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type AllowedRole = "admin" | "employee";

function hashPin(pin: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pin, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function authPasswordFromPin(pin: string): string {
  const pepper = process.env.PIN_AUTH_PEPPER;

  if (!pepper) {
    throw new Error("PIN_AUTH_PEPPER não está definida.");
  }

  return `${pin}-${pepper}`;
}

async function requireAdmin() {
  const supabase = await getSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: AllowedRole | null }>();

  if (me?.role !== "admin") {
    throw new Error("Sem permissão para executar esta ação.");
  }

  return { supabase, user };
}

export async function createUserAction(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "").trim() as AllowedRole;
  const pin = String(formData.get("pin") ?? "").trim();

  if (!name || name.length < 2) {
    throw new Error("O nome deve ter pelo menos 2 caracteres.");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("Email inválido.");
  }

  if (!["admin", "employee"].includes(role)) {
    throw new Error("Tipo de utilizador inválido.");
  }

  if (!/^\d{4}$/.test(pin)) {
    throw new Error("O PIN deve ter exatamente 4 números.");
  }

  const supabaseAdmin = getSupabaseAdmin();
  const authPassword = authPasswordFromPin(pin);

  const { data: createdUser, error: createUserError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password: authPassword,
      email_confirm: true,
      user_metadata: {
        name,
        role,
      },
    });

  if (createUserError || !createdUser.user) {
    throw new Error(
      createUserError?.message || "Não foi possível criar o utilizador."
    );
  }

  const pinHash = hashPin(pin);

  const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
    id: createdUser.user.id,
    name,
    role,
    email,
    pin_hash: pinHash,
  });

  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(createdUser.user.id);
    throw new Error(profileError.message);
  }

  revalidatePath("/settings");
}

export async function resetPinAction(formData: FormData) {
  await requireAdmin();

  const userId = String(formData.get("user_id") ?? "").trim();
  const newPin = String(formData.get("new_pin") ?? "").trim();

  if (!userId) {
    throw new Error("Utilizador inválido.");
  }

  if (!/^\d{4}$/.test(newPin)) {
    throw new Error("O novo PIN deve ter exatamente 4 números.");
  }

  const supabaseAdmin = getSupabaseAdmin();
  const authPassword = authPasswordFromPin(newPin);

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id,name,email")
    .eq("id", userId)
    .single<{ id: string; name: string | null; email: string | null }>();

  if (profileError || !profile) {
    throw new Error("Utilizador não encontrado.");
  }

  const { error: authUpdateError } =
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: authPassword,
      email_confirm: true,
    });

  if (authUpdateError) {
    throw new Error(
      authUpdateError.message || "Não foi possível atualizar o PIN no Auth."
    );
  }

  const pinHash = hashPin(newPin);

  const { error: updateProfileError } = await supabaseAdmin
    .from("profiles")
    .update({
      pin_hash: pinHash,
    })
    .eq("id", userId);

  if (updateProfileError) {
    throw new Error(
      updateProfileError.message ||
        "PIN atualizado no Auth, mas falhou a atualização do perfil."
    );
  }

  revalidatePath("/settings");
}