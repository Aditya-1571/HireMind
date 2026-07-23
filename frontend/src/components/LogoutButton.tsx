"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
    });
    router.push("/login");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 text-sm font-medium text-slate-800 hover:border-blue-200 hover:bg-blue-50 dark:border-slate-700/70 dark:bg-slate-900/55 dark:text-slate-100 dark:hover:border-cyan-400/50 dark:hover:bg-slate-800/75"
    >
      Logout
    </button>
  );
}
