// components/ui/Button.tsx
import React from "react";

export default function Button({
  children,
  variant = "primary",
  type = "button",
  onClick,
  className = "",
  disabled,
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}) {
  const base =
    "inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold transition active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100";

  const styles =
    variant === "primary"
      ? "bg-zinc-900 text-white shadow-sm hover:bg-zinc-800"
      : variant === "secondary"
      ? "bg-white text-zinc-900 ring-1 ring-zinc-200 hover:bg-zinc-50"
      : "text-zinc-700 hover:bg-zinc-100";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${styles} ${className}`}
    >
      {children}
    </button>
  );
}