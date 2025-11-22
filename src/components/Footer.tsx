'use client';

import { Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <p className="text-sm text-gray-600">
              © {new Date().getFullYear()} Eat. All rights reserved.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Created by</span>
            <a
              href="mailto:dushyantgarg3@gmail.com"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-600 hover:text-green-700 transition-colors"
            >
              <Mail className="h-4 w-4" />
              Dushyant
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
