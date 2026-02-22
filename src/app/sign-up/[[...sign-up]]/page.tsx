import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
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
            Erstellen Sie ein Konto für die Temperaturprotokollierung
          </p>
        </div>
        <SignUp
          appearance={{
            elements: {
              formButtonPrimary: 'bg-blue-600 hover:bg-blue-700',
              card: 'shadow-lg',
            },
          }}
          routing='path'
          path='/sign-up'
          signInUrl='/sign-in'
          afterSignUpUrl='/'
        />
      </div>
    </main>
  );
}
