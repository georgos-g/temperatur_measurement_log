'use client';

import { LoginForm } from '@/components/login-form';
import { TemperatureForm } from '@/components/temperature-form';
import { useAuth } from '@/lib/auth-context';

export default function Home() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <main className='min-h-screen bg-background flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Lädt...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className='min-h-screen bg-background flex items-center justify-center p-4'>
        <div className='w-full max-w-md'>
          <div className='text-center mb-8'>
            <h1 className='text-3xl font-bold text-gray-900 mb-2'>
              Temperature Logger
            </h1>
            <p className='text-gray-600'>
              Verfolgen Sie Ihre Temperaturmessungen mit Screenshots
            </p>
          </div>
          <LoginForm />
        </div>
      </main>
    );
  }

  return (
    <main className='min-h-screen bg-background'>
      <header className='bg-white_ shadow-sm border-b'>
        <div className='max-w-4xl mx-auto py-2px-4 sm:px-6 lg:px-8'>
          {/* <div className='flex justify-between items-center h-16'> */}
          {/* <div className='flex items-center'>
              <h1 className='text-xl font-semibold text-gray-900_'>
                Temperature Logger
              </h1>
            </div> */}
          {/* <div className='flex items-center gap-4'> */}
          {/* <ThemeToggle /> */}
          {/* </div> */}
          {/* </div> */}
        </div>
      </header>
      <TemperatureForm />
    </main>
  );
}
