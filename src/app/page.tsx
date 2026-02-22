'use client';

import { EnhancedLoginForm } from '@/components/enhanced-login-form';
import { TemperatureForm } from '@/components/temperature-form';
import { useAuth } from '@/lib/auth-context';

export default function Home() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <main className='min-h-screen gradient-bg flex items-center justify-center relative'>
        {/* Decorative gradient orbs */}
        <div className='gradient-orb-1' />
        <div className='gradient-orb-2' />
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Lädt...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className='min-h-screen gradient-bg flex items-center justify-center p-4 relative'>
        {/* Decorative gradient orbs */}
        <div className='gradient-orb-1' />
        <div className='gradient-orb-2' />
        <div className='w-full max-w-md relative z-10'>
          <div className='text-center mb-8'>
            <h1 className='text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent mb-2'>
              Temperatur Logger
            </h1>
            <p className='text-gray-600'>
              Verfolgen Sie Ihre Temperaturmessungen mit Screenshots
            </p>
          </div>
          <EnhancedLoginForm />
        </div>
      </main>
    );
  }

  return (
    <main className='min-h-screen gradient-bg relative'>
      {/* Decorative gradient orbs */}
      <div className='gradient-orb-1' />
      <div className='gradient-orb-2' />
      <TemperatureForm />
    </main>
  );
}
