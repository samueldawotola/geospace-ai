"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Plan" },
  { href: "/collection", label: "Collection" },
  { href: "/globe", label: "Globe" },
  { href: "/profile", label: "Profile" },
];

// Button adapted from Uiverse.io by Mubashir222, scaled down for the bar.
// Colors follow the time of day: the button is the bar's main line color
// (--tod-line-1) and the hover circle its second line color (--tod-line-2).
// The current page gets the "lit" look: see-through, line-colored text, glow.
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
      "group relative inline-flex items-center justify-center overflow-hidden rounded-md px-4 py-1.5 tracking-tighter text-[#181818] [text-shadow:none] bg-(--tod-line-1) transition-[background-color,color,box-shadow] duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--tod-line-2) data-active:bg-transparent data-active:text-(--tod-line-1) data-active:shadow-[inset_0_0_0_2px_var(--tod-line-1),0_0_25px_color-mix(in_srgb,var(--tod-line-1)_55%,transparent)]",
  };
  const content = (
    <>
      <span className="absolute w-0 h-0 transition-all duration-500 ease-out bg-(--tod-line-2) rounded-full group-hover:w-56 group-hover:h-56 group-data-active:hidden motion-reduce:transition-none" />
      <span className="absolute bottom-0 left-0 h-full -ml-2" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-auto h-full opacity-100" viewBox="0 0 487 487">
          <path
            fillOpacity=".1"
            fillRule="nonzero"
            fill="#FFF"
            d="M0 .3c67 2.1 134.1 4.3 186.3 37 52.2 32.7 89.6 95.8 112.8 150.6 23.2 54.8 32.3 101.4 61.2 149.9 28.9 48.4 77.7 98.8 126.4 149.2H0V.3z"
          />
        </svg>
      </span>
      <span className="absolute top-0 right-0 w-12 h-full -mr-3" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" className="object-cover w-full h-full" viewBox="0 0 487 487">
          <path
            fillOpacity=".1"
            fillRule="nonzero"
            fill="#FFF"
            d="M487 486.7c-66.1-3.6-132.3-7.3-186.3-37s-95.9-85.3-126.2-137.2c-30.4-51.8-49.3-99.9-76.5-151.4C70.9 109.6 35.6 54.8.3 0H487v486.7z"
          />
        </svg>
      </span>
      <span className="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-linear-to-b from-transparent via-transparent to-gray-200" />
      <span className="relative text-sm font-semibold">{label}</span>
    </>
  );
  return external ? <a {...props}>{content}</a> : <Link {...props}>{content}</Link>;
}

export default function Nav({ signedIn }: { signedIn: boolean }) {
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

        {signedIn ? (
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
