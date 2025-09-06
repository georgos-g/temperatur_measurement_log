'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { LogOut, User } from 'lucide-react';

export function UserProfile() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className='text-left flex items-center gap-4'>
      <Button
        variant='outline'
        size='sm'
        onClick={logout}
        className='flex items-center gap-2'
      >
        <LogOut className='w-4 h-4' />
        {/* Logout */}
      </Button>
      <div className='flex items-center gap-2'>
        <div className='p-2 bg-blue-100 rounded-full'>
          <User className='w-4 h-4 text-blue-600' />
        </div>
        <div className='text-sm'>
          <div className='font-medium text-gray-900_'>{user.name}</div>
          <div className='text-gray-500_'>{user.email}</div>
        </div>
      </div>
    </div>
  );
}
