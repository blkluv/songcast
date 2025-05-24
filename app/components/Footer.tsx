import React from 'react';
import Link from 'next/link';
import { Music, Twitter, Instagram, } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-border">
      <div className="container px-4 py-12 mx-auto">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Logo and Tagline */}
          <div className="col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-primary to-secondary">
                <Music className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold gradient-text">Jersey Club</span>
            </Link>
            <p className="mb-4 text-sm text-muted-foreground">
              A decentralized Jersey Club musik publishing platform built on the blockchain,
              empowering artists and fans.
            </p>
            <div className="flex space-x-4">
              <a 
                href="https://twitter.com/jerseyclubtv" 
                target="_blank" 
                rel="noopener noreferrer"
                className="transition-colors text-muted-foreground hover:text-primary"
              >
                <Twitter size={20} />
              </a>
              <a 
                href="https://instagram.com/jerseyclubfm" 
                target="_blank" 
                rel="noopener noreferrer"
                className="transition-colors text-muted-foreground hover:text-primary"
              >
                <Instagram size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-span-1">
            <h3 className="mb-4 text-lg font-medium">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  href="/marketplace" 
                  className="transition-colors text-muted-foreground hover:text-primary"
                >
                  Marketplace
                </Link>
              </li>
              <li>
                <Link 
                  href="/artists" 
                  className="transition-colors text-muted-foreground hover:text-primary"
                >
                  Artists
                </Link>
              </li>
              <li>
                <Link 
                  href="/marketplace/publish" 
                  className="transition-colors text-muted-foreground hover:text-primary"
                >
                  Publish Music
                </Link>
              </li>
            </ul>
          </div>

          {/* Help & Resources */}
          <div className="col-span-1">
            <h3 className="mb-4 text-lg font-medium">Help & Resources</h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  href="/faq" 
                  className="transition-colors text-muted-foreground hover:text-primary"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link 
                  href="/support" 
                  className="transition-colors text-muted-foreground hover:text-primary"
                >
                  Support
                </Link>
              </li>
              <li>
                <Link 
                  href="/terms" 
                  className="transition-colors text-muted-foreground hover:text-primary"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link 
                  href="/privacy" 
                  className="transition-colors text-muted-foreground hover:text-primary"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="col-span-1">
            <h3 className="mb-4 text-lg font-medium">Stay Updated</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Subscribe to our newsletter for the latest updates and releases.
            </p>
            <form className="flex flex-col space-y-2">
              <input 
                type="email" 
                placeholder="Your email address" 
                className="sonic-input"
                required
              />
              <button type="submit" className="sonic-button-primary">
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Credits */}
        <div className="flex flex-col items-center justify-between pt-6 mt-12 border-t border-border md:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Jersey Club. All rights reserved.
          </p>
          <p className="mt-2 text-sm text-muted-foreground md:mt-0">
            Built on <span className="text-primary">Base</span> blockchain
          </p>
        </div>
      </div>
    </footer>
  );
} 