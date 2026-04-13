import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getUidFromSessionToken } from "./db";
import "./globals.css";

export const metadata: Metadata = {
  title: "Medical Portal",
  description: "Medical portal application",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('sessionToken')?.value;
  let loggedIn = false;
  if (sessionToken) {
    const uid = await getUidFromSessionToken(sessionToken);
    loggedIn = !!uid;
  }

  return (
    <html lang="en">
      <body>
        <nav className="site-nav">
          <div className="nav-inner">
            <a className="brand" href="/">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
              Medical Portal
            </a>
            {loggedIn ? (
              <a className="nav-link" href="/logout">Log Out</a>
            ) : (
              <a className="nav-link" href="/login">Log In</a>
            )}
          </div>
        </nav>
        <div className="page-container">
          {children}
        </div>
      </body>
    </html>
  );
}
