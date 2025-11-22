'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Package, ChefHat, LogOut, Menu, X } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (pathname?.startsWith('/auth')) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
  };

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path);
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <nav className="w-full bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            href="/inventory"
            className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-gray-900 hover:text-green-600 transition-colors"
            onClick={closeMobileMenu}
          >
            <span className="text-2xl sm:text-3xl">🍳</span>
            Eat
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-3 lg:gap-6">
            <Link
              href="/inventory"
              className={`flex items-center gap-2 px-3 lg:px-4 py-2 rounded-lg font-semibold transition-colors text-sm lg:text-base ${
                isActive('/inventory')
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Package className="h-5 w-5" />
              <span className="hidden lg:inline">Inventory</span>
            </Link>
            <Link
              href="/recipes"
              className={`flex items-center gap-2 px-3 lg:px-4 py-2 rounded-lg font-semibold transition-colors text-sm lg:text-base ${
                isActive('/recipes')
                  ? 'bg-orange-100 text-orange-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <ChefHat className="h-5 w-5" />
              <span className="hidden lg:inline">Recipes</span>
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-3 lg:px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold text-sm lg:text-base"
            >
              <LogOut className="h-5 w-5" />
              <span className="hidden lg:inline">Sign Out</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2 border-t border-gray-200">
            <Link
              href="/inventory"
              onClick={closeMobileMenu}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-colors ${
                isActive('/inventory')
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Package className="h-5 w-5" />
              Inventory
            </Link>
            <Link
              href="/recipes"
              onClick={closeMobileMenu}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-colors ${
                isActive('/recipes')
                  ? 'bg-orange-100 text-orange-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <ChefHat className="h-5 w-5" />
              Recipes
            </Link>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold"
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;