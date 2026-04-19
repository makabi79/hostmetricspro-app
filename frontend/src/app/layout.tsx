import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { SiteHeader } from "@/components/layout/SiteHeader";

export const metadata: Metadata = {
  title: "HostMetricsPro",
  description: "Airbnb and short-term rental deal analysis SaaS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <div className="site-shell">
            <SiteHeader />

            <main className="site-main">{children}</main>

            <footer className="site-footer">
              <div className="site-container site-footer-inner">
                <div>© 2026 HostMetricsPro. Built for Airbnb and STR investors.</div>

                <div className="site-footer-links">
                  <a href="/" className="site-footer-link">
                    Home
                  </a>
                  <a href="/pricing" className="site-footer-link">
                    Pricing
                  </a>
                  <a href="/signup" className="site-footer-link">
                    Signup
                  </a>
                  <a href="/terms" className="site-footer-link">
                    Terms of Service
                  </a>
                  <a href="/privacy" className="site-footer-link">
                    Privacy Policy
                  </a>
                  <a
                    href="mailto:support.hostmetricpro@gmail.com"
                    className="site-footer-link"
                  >
                    Contact
                  </a>
                </div>
              </div>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}