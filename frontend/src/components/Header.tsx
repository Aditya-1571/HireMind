import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-lg font-semibold text-neutral-950">
          HireMind
        </Link>
        <nav className="flex items-center gap-3 text-sm text-neutral-600">
          <Link href="/dashboard" className="hover:text-neutral-950">
            Dashboard
          </Link>
          <Link
            href="/login"
            className="rounded-md border border-neutral-300 px-3 py-2 font-medium text-neutral-800 hover:bg-neutral-50"
          >
            Login
          </Link>
        </nav>
      </div>
    </header>
  );
}
