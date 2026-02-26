'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const authCookie = document.cookie.split(';').find(c => c.trim().startsWith('mc_auth='));
    
    if (!authCookie) {
      // Not authenticated, redirect to login
      router.push('/login?from=/system');
      return;
    }

    // Authenticated, redirect to system dashboard
    router.push('/system');
    setLoading(false);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600 text-lg">正在跳转...</p>
      </div>
    </div>
  );
}
