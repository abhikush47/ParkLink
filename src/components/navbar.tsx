"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Menu, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-border bg-background">
      <div className="container flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-extrabold text-sm">
            P
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">
            Park<span className="text-emerald-500">Link</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-7 text-sm font-medium text-muted-foreground">
          <Link href="#how-it-works" className="hover:text-foreground transition-colors duration-150">
            How it works
          </Link>
          <Link href="#features" className="hover:text-foreground transition-colors duration-150">
            Features
          </Link>
          <Link href="#institutions" className="hover:text-foreground transition-colors duration-150">
            Institutions
          </Link>
          <Link href="#faq" className="hover:text-foreground transition-colors duration-150">
            Questions
          </Link>
        </div>

        {/* Right CTA & Theme Toggle */}
        <div className="hidden md:flex items-center space-x-3">
          <ThemeToggle />
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-xs transition-colors duration-150">
              Sign in
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-md transition-colors duration-150">
              Get started <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex md:hidden items-center space-x-2">
          <ThemeToggle />
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-muted-foreground hover:text-foreground rounded-md transition-colors duration-150"
            aria-label="Toggle Menu"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {isOpen && (
        <div className="md:hidden border-b border-border bg-card p-4 space-y-3">
          <Link
            href="#how-it-works"
            onClick={() => setIsOpen(false)}
            className="block text-sm font-medium text-foreground py-2 transition-colors duration-150"
          >
            How it works
          </Link>
          <Link
            href="#features"
            onClick={() => setIsOpen(false)}
            className="block text-sm font-medium text-foreground py-2 transition-colors duration-150"
          >
            Features
          </Link>
          <Link
            href="#institutions"
            onClick={() => setIsOpen(false)}
            className="block text-sm font-medium text-foreground py-2 transition-colors duration-150"
          >
            Institutions
          </Link>
          <Link
            href="#faq"
            onClick={() => setIsOpen(false)}
            className="block text-sm font-medium text-foreground py-2 transition-colors duration-150"
          >
            Questions
          </Link>
          <div className="pt-3 border-t border-border flex flex-col gap-2">
            <Link href="/login" onClick={() => setIsOpen(false)}>
              <Button variant="outline" className="w-full text-xs">
                Sign in
              </Button>
            </Link>
            <Link href="/register" onClick={() => setIsOpen(false)}>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold">
                Get started
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
