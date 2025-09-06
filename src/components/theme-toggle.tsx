'use client';

import { useTheme } from '@/lib/theme-context';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className='flex items-center gap-2'>
        <div className='relative w-12 h-6 bg-gray-200 rounded-full cursor-pointer'>
          <div className='absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm'></div>
        </div>
      </div>
    );
  }

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const isDark = theme === 'dark';

  return (
    <div className='flex items-center gap-2'>
      <div
        className='relative w-12 h-6 rounded-full cursor-pointer transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2'
        onClick={toggleTheme}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleTheme();
          }
        }}
        role='switch'
        aria-checked={isDark}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        tabIndex={0}
        style={{
          backgroundColor: isDark ? '#1f2937' : '#e5e7eb',
        }}
      >
        {/* Toggle knob */}
        <div
          className='absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ease-in-out'
          style={{
            transform: isDark ? 'translateX(24px)' : 'translateX(2px)',
          }}
        />

        {/* Icons */}
        <div className='absolute inset-0 flex items-center justify-between px-1.5'>
          <Sun
            className={`w-3 h-3 transition-colors duration-200 ${
              !isDark ? 'text-amber-500' : 'text-gray-400'
            }`}
          />
          <Moon
            className={`w-3 h-3 transition-colors duration-200 ${
              isDark ? 'text-blue-300' : 'text-gray-400'
            }`}
          />
        </div>
      </div>
    </div>
  );
}
