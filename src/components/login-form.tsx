'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth-context';
import { LogIn, Mail, User } from 'lucide-react';
import { useState } from 'react';

export function LoginForm() {
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(name, email);
    } catch (error) {
      setError('Login failed. Please try again.');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className='w-full max-w-md mx-auto p-6'>
      <div className='text-center mb-6'>
        <div className='flex justify-center mb-4'>
          <div className='p-3 bg-blue-100 rounded-full'>
            <LogIn className='w-6 h-6 text-blue-600' />
          </div>
        </div>
        <h2 className='text-2xl font-bold text-gray-900_'>Welcome</h2>
        <p className='text-gray-600_'>Enter your details to continue</p>
      </div>

      <form onSubmit={handleSubmit} className='space-y-4'>
        <div>
          <label
            htmlFor='name'
            className='block text-sm font-medium text-gray-700 mb-1'
          >
            Name
          </label>
          <div className='relative'>
            <User className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400_' />
            <Input
              id='name'
              type='text'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Enter your name'
              className='pl-10'
              required
            />
          </div>
        </div>

        <div>
          <label
            htmlFor='email'
            className='block text-sm font-medium text-gray-700_ mb-1'
          >
            Email
          </label>
          <div className='relative'>
            <Mail className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400_' />
            <Input
              id='email'
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder='Enter your email'
              className='pl-10'
              required
            />
          </div>
        </div>

        {error && (
          <div className='text-red-600 text-sm text-center bg-red-50 p-3 rounded-md'>
            {error}
          </div>
        )}

        <Button type='submit' className='w-full' disabled={isLoading}>
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>
    </Card>
  );
}
