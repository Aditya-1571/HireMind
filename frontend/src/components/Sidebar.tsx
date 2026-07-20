import Link from "next/link";

const navigationItems = [
  { href: "/dashboard", label: "Overview" },
  { href: "/interviews/start", label: "Start Interview" },
  { href: "/interviews/history", label: "History" },
  { href: "/", label: "Home" },
];

export function Sidebar() {
  return (
    <aside className="border-b border-neutral-200 bg-white md:min-h-screen md:w-64 md:border-b-0 md:border-r">
      <div className="px-4 py-5 sm:px-6">
        <Link href="/" className="text-lg font-semibold text-neutral-950">
          HireMind
        </Link>
      </div>
      <nav className="flex gap-2 overflow-x-auto px-4 pb-4 text-sm md:flex-col md:px-3">
        {navigationItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-md px-3 py-2 font-medium text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
