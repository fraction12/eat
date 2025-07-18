'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/utils/supabase-browser';

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

  return (
    <nav className="w-full bg-white shadow p-4 flex justify-between items-center">
      <Link href="/" className="text-xl font-bold">
        Eat AI
      </Link>
      <button
        onClick={handleSignOut}
        className="px-4 py-2 bg-red-500 text-white rounded"
      >
        Sign Out
      </button>
    </nav>
  );
}

export default Navbar;