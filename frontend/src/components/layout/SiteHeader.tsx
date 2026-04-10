"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { hasSession } from "@/lib/auth";

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  const isAuthenticated = !loading && Boolean(user) && hasSession();

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <header className="site-header">
      <div className="site-container site-header-inner">
        <Link href={isAuthenticated ? "/dashboard" : "/"} className="site-logo">
          HostMetricsPro
        </Link>

        <nav className="site-nav" aria-label="Primary">
          {isAuthenticated ? (
            <>
              <NavLink href="/dashboard" label="Dashboard" pathname={pathname} />
              <NavLink href="/pricing" label="Pricing" pathname={pathname} />
            </>
          ) : (
            <>
              <NavLink href="/" label="Home" pathname={pathname} />
              <NavLink href="/pricing" label="Pricing" pathname={pathname} />
              <NavLink href="/login" label="Login" pathname={pathname} />
            </>
          )}
        </nav>

        <div className="site-header-actions">
          {isAuthenticated ? (
            <>
              <Link href="/dashboard" className="site-mobile-auth-link">
                Dashboard
              </Link>

              <Link href="/pricing" className="site-mobile-auth-link">
                Pricing
              </Link>

              <Link href="/pricing" className="site-billing-link">
                Billing
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="site-logout-button"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="site-mobile-login">
                Login
              </Link>

              <Link href="/signup" className="site-start-button">
                Start Free
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function NavLink({
  href,
  label,
  pathname,
}: {
  href: string;
  label: string;
  pathname: string;
}) {
  const isActive =
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={isActive ? "site-nav-link site-nav-link-active" : "site-nav-link"}
    >
      {label}
    </Link>
  );
}