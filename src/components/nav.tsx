"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Plan" },
  { href: "/collection", label: "Collection" },
  { href: "/globe", label: "Globe" },
  { href: "/profile", label: "Profile" },
];

// Colors follow the time of day: the button is the bar's main line color
// (--tod-line-1), hover its second line color (--tod-line-2). The current
// page is outlined instead of filled.
// Auth routes are plain <a> so the browser does a full navigation to Auth0.
function NavButton({
  href,
  label,
  active = false,
  external = false,
}: {
  href: string;
  label: string;
  active?: boolean;
  external?: boolean;
}) {
  const props = {
    href,
    "data-active": active || undefined,
    "aria-current": active ? ("page" as const) : undefined,
    className:
      "inline-flex items-center justify-center rounded-md px-4 py-1.5 text-sm font-semibold text-[#181818] [text-shadow:none] bg-(--tod-line-1) transition-colors duration-200 hover:bg-(--tod-line-2) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--tod-line-2) data-active:bg-transparent data-active:hover:bg-transparent data-active:text-(--tod-line-1) data-active:shadow-[inset_0_0_0_2px_var(--tod-line-1)]",
  };
  return external ? <a {...props}>{label}</a> : <Link {...props}>{label}</Link>;
}

// signedIn is null while the session is still being read: the bar renders
// with just the logo so the layout doesn't shift when the buttons arrive.
export default function Nav({ signedIn }: { signedIn: boolean | null }) {
  const pathname = usePathname();

  return (
    <header
      className="sticky top-0 z-30 overflow-hidden border-b border-white/10 text-white [text-shadow:0_1px_2px_rgb(0_0_0/0.45)] [transform:translateZ(0)] [-webkit-transform:translateZ(0)]"
      style={{ willChange: "transform" }}
    >
      {/* Moving lines, tinted by time of day (.nav-meteors in globals.css). */}
      <div aria-hidden="true" className="nav-meteors" />
      <nav className="relative mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-3">
        <Link href={signedIn ? "/dashboard" : "/"} className="font-semibold">
          GeospaceAI
        </Link>

        {signedIn === null ? (
          <div className="h-8" />
        ) : signedIn ? (
          <div className="flex flex-wrap justify-end gap-2">
            {links.map(({ href, label }) => (
              <NavButton key={href} href={href} label={label} active={pathname.startsWith(href)} />
            ))}
            <NavButton href="/auth/logout" label="Log out" external />
          </div>
        ) : (
          /* Logged out: only public routes — gated ones would bounce to Auth0. */
          <div className="flex items-center gap-2">
            <NavButton href="/globe" label="Globe" active={pathname.startsWith("/globe")} />
            <NavButton href="/auth/login" label="Log in" external />
            <NavButton href="/auth/login?screen_hint=signup" label="Start free" external />
          </div>
        )}
      </nav>
    </header>
  );
}
