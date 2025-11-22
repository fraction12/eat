'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/utils/supabase-browser';
import { Package, ChefHat, LogOut } from 'lucide-react';

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  if (pathname?.startsWith('/auth')) {
    return null;
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/signin');
  };

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path);
  };

  return (
    <nav className="w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/inventory" className="flex items-center gap-2 text-2xl font-bold text-gray-900 hover:text-green-600 transition-colors">
            <span className="text-3xl">🍳</span>
            Eat AI
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            <Link
              href="/inventory"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
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
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
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
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold"
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;