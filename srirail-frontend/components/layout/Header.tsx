"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useApp } from "@/context/AppContext";
import Button, { ButtonLink } from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
const links = [
  { href: "/trains", label: "Book a journey" },
  { href: "/schedule", label: "Train schedules" },
  { href: "/notices", label: "Travel notices" },
];
export default function Header() {
  const [open, setOpen] = useState(false);
  const [language, setLanguage] = useState("English");
  const { user, logout, storageWarning } = useApp();
  const path = usePathname();
  const router = useRouter();
  return (
    <header className="site-header no-print">
      <div className="utility-bar">
        <div className="container flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2">
          <span>University project demo · Sample fares & schedules</span>
          <div className="flex items-center gap-4">
            <Link href="/admin">Admin demo</Link>
            <label className="sr-only" htmlFor="language">
              Language preview
            </label>
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="language-control"
              aria-describedby="language-note"
            >
              <option>English</option>
              <option>සිංහල</option>
              <option>தமிழ்</option>
            </select>
          </div>
        </div>
      </div>
      <div className="container header-main">
        <Link href="/" className="brand" aria-label="SriRail home">
          <Image src="/favicon.svg" width={43} height={43} alt="" />
          <span>
            Sri<span className="text-maroon">Rail</span>
            <small>SMART TICKETING</small>
          </span>
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={path.startsWith(link.href) ? "active" : ""}
              aria-current={path.startsWith(link.href) ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          {user ? (
            <>
              <ButtonLink href="/dashboard" variant="secondary">
                <Icon name="user" />
                My account
              </ButtonLink>
              <Button
                variant="ghost"
                aria-label="Sign out"
                onClick={() => {
                  logout();
                  router.push("/");
                }}
              >
                <Icon name="logout" />
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" className="font-semibold hidden sm:block">
                Sign in
              </Link>
              <ButtonLink href="/register">Create account</ButtonLink>
            </>
          )}
        </div>
        <Button
          variant="ghost"
          className="mobile-menu"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          onClick={() => setOpen(!open)}
        >
          <Icon name={open ? "close" : "menu"} />
        </Button>
      </div>
      {open && (
        <nav
          id="mobile-navigation"
          className="mobile-nav"
          aria-label="Mobile navigation"
        >
          {[
            ...links,
            { href: "/dashboard", label: "My dashboard" },
            { href: "/login", label: "Sign in" },
            { href: "/register", label: "Create account" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
      {language !== "English" && (
        <p id="language-note" role="status" className="container text-sm py-2">
          {language} selected for preview. Translation is not included in this
          demo.
        </p>
      )}
      {storageWarning && (
        <div className="notice-strip" role="status">
          {storageWarning}
        </div>
      )}
    </header>
  );
}
