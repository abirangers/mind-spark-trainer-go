import { describe, it, expect } from 'vitest';
import { cn } from './utils'; // Assuming utils.ts is in the same directory

describe('cn utility function', () => {
  it('should merge class names correctly', () => {
    expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    const isHidden = false;
    expect(cn('base', isActive && 'active', isHidden && 'hidden', null, undefined && 'invisible'))
      .toBe('base active');
  });

  it('should override classes with tailwind-merge', () => {
    // This tests the twMerge part of cn
    expect(cn('p-4', 'p-2')).toBe('p-2'); // p-2 should override p-4
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
  });

  it('should handle mixed array and string inputs', () => {
    expect(cn(['p-4', 'm-2'], 'text-lg', { 'font-bold': true, 'italic': false })).toBe('p-4 m-2 text-lg font-bold');
  });

  it('should return an empty string for all falsy inputs', () => {
    expect(cn(null, undefined, false, '')).toBe('');
  });
});
