'use client';

import { SignIn, useAuth } from '@clerk/nextjs';

export function EnhancedLoginForm() {
  const { isLoaded, isSignedIn } = useAuth();

  // If already signed in, this shouldn't show
  if (!isLoaded) {
    return (
      <div className='flex justify-center'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  if (isSignedIn) {
    return null;
  }

  return (
    <SignIn
      appearance={{
        elements: {
          rootBox: 'mx-auto',
          card: 'shadow-lg',
          formButtonPrimary: 'bg-blue-600 hover:bg-blue-700',
          socialButtonsBlockButton: 'border border-gray-300 hover:bg-gray-50',
          socialButtonsBlockButtonText: 'text-gray-700 font-medium',
          dividerLine: 'bg-gray-200',
          dividerText: 'text-gray-500',
        },
      }}
      routing='hash'
      afterSignInUrl='/'
      signUpUrl='/sign-up'
    />
  );
}
