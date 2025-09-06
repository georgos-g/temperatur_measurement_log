import { NextRequest } from 'next/server';

export interface AuthenticatedUser {
  id: string;
  email: string;
}

export function getAuthenticatedUser(
  request: NextRequest
): AuthenticatedUser | null {
  try {
    const userId = request.headers.get('x-user-id');
    const userEmail = request.headers.get('x-user-email');

    if (!userId || !userEmail) {
      return null;
    }

    return {
      id: userId,
      email: userEmail,
    };
  } catch (error) {
    console.error('Error getting authenticated user:', error);
    return null;
  }
}

export function requireAuthentication(request: NextRequest): AuthenticatedUser {
  const user = getAuthenticatedUser(request);

  if (!user) {
    throw new Error('Authentication required');
  }

  return user;
}
