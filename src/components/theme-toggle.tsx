'use client';

import { useTheme } from '@/lib/theme-context';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className='flex items-center gap-3'>
        {/* <span className='text-sm font-medium text-gray-500'>Light</span> */}
        <div className='relative w-16 h-8 bg-gray-300 rounded-full cursor-pointer'>
          <div className='absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md'></div>
        </div>
        {/* <span className='text-sm font-medium text-gray-500'>Dark</span> */}
      </div>
    );
  }

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  return (
    <div className='flex items-center gap-3'>
      {/* <span
        className={`text-sm font-medium transition-colors duration-200 ${
          theme === 'light' ? 'text-gray-900 font-semibold' : 'text-gray-500'
        }`}
      >
        Light
      </span> */}

      <div
        className='relative w-16 h-8 rounded-full cursor-pointer transition-all duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
        onClick={toggleTheme}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleTheme();
          }
        }}
        role='switch'
        aria-checked={theme !== 'light'}
        aria-label={`Switch theme: ${
          theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'
        }`}
        tabIndex={0}
        style={{
          // backgroundColor: theme === 'light' ? '#3b82f6' : '#1f2937',
          backgroundColor: theme === 'light' ? '#1f2937' : '#1f2937',
        }}
      >
        {/* Toggle knob */}
        <div
          className='absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ease-in-out'
          style={{
            transform:
              theme === 'light'
                ? 'translateX(4px)'
                : theme === 'dark'
                ? 'translateX(24px)'
                : 'translateX(44px)',
          }}
        />

        {/* Light mode: sun on left side */}
        {theme === 'light' && (
          <div className='absolute inset-0 flex items-center justify-start pl-2'>
            <Sun className='w-3 h-3 text-yellow-400 fill-yellow-400' />
          </div>
        )}

        {/* Dark mode: moon in middle */}
        {theme === 'dark' && (
          <div className='absolute inset-0 flex items-center justify-center'>
            <Moon className='w-3 h-3 text-blue-300' />
          </div>
        )}

        {/* System mode: monitor on right side */}
        {theme === 'system' && (
          <div className='absolute inset-0 flex items-center justify-end pr-2'>
            <Monitor className='w-3 h-3 text-gray-300' />
          </div>
        )}
      </div>

      {/* <span
        className={`text-sm font-medium transition-colors duration-200 ${
          theme === 'dark' ? 'text-white font-semibold' : 'text-gray-500'
        }`}
      >
        Dark
      </span> */}
    </div>
  );
}
