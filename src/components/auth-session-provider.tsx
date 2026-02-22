'use client';

import { deDE } from '@clerk/localizations';
import { ClerkProvider } from '@clerk/nextjs';

export function AuthSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      localization={deDE}
      appearance={{
        variables: {
          colorPrimary: '#2563eb',
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}
