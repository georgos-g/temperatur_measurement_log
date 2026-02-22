import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
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
        <SignIn
          appearance={{
            elements: {
              formButtonPrimary: 'bg-blue-600 hover:bg-blue-700',
              card: 'shadow-lg',
            },
          }}
          routing='path'
          path='/sign-in'
          signUpUrl='/sign-up'
          afterSignInUrl='/'
        />
      </div>
    </main>
  );
}
