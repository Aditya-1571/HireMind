"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigationItems = [
  { href: "/dashboard", label: "Overview" },
  { href: "/interviews/start", label: "Start Interview" },
  { href: "/interviews/history", label: "History" },
  { href: "/settings/profile", label: "Settings" },
  { href: "/", label: "Home" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="border-b border-neutral-200 bg-white md:min-h-screen md:w-64 md:border-b-0 md:border-r">
      <div className="px-4 py-5 sm:px-6">
        <Link href="/" className="text-lg font-semibold text-neutral-950">
          HireMind
        </Link>
      </div>
      <nav className="flex gap-2 overflow-x-auto px-4 pb-4 text-sm md:flex-col md:px-3">
        {navigationItems.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={
                active
                  ? "rounded-md bg-neutral-950 px-3 py-2 font-medium text-white"
                  : "rounded-md px-3 py-2 font-medium text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950"
              }
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
