import { cn } from '../../lib/utils';

describe('Utils', () => {
  describe('cn function', () => {
    it('should merge basic class names', () => {
      const result = cn('px-4', 'py-2', 'bg-blue-500');
      expect(result).toBe('px-4 py-2 bg-blue-500');
    });

    it('should handle conditional classes', () => {
      const isActive = true;
      const isDisabled = false;
      
      const result = cn(
        'base-class',
        isActive && 'active-class',
        isDisabled && 'disabled-class'
      );
      
      expect(result).toBe('base-class active-class');
    });

    it('should merge conflicting Tailwind classes correctly', () => {
      // tailwind-merge should resolve conflicts by keeping the last class
      const result = cn('p-4', 'p-6');
      expect(result).toBe('p-6');
    });

    it('should handle complex Tailwind class conflicts', () => {
      const result = cn(
        'bg-red-500',
        'bg-blue-500',
        'text-white',
        'text-black'
      );
      // tailwind-merge should keep the last conflicting classes
      expect(result).toBe('bg-blue-500 text-black');
    });

    it('should handle arrays of classes', () => {
      const result = cn(['px-4', 'py-2'], ['bg-blue-500', 'text-white']);
      expect(result).toBe('px-4 py-2 bg-blue-500 text-white');
    });

    it('should handle objects with conditional classes', () => {
      const result = cn({
        'px-4': true,
        'py-2': true,
        'bg-red-500': false,
        'bg-blue-500': true,
      });
      expect(result).toBe('px-4 py-2 bg-blue-500');
    });

    it('should handle mixed input types', () => {
      const result = cn(
        'base-class',
        ['array-class-1', 'array-class-2'],
        {
          'object-class-1': true,
          'object-class-2': false,
        },
        'final-class'
      );
      expect(result).toBe('base-class array-class-1 array-class-2 object-class-1 final-class');
    });

    it('should handle empty inputs', () => {
      expect(cn()).toBe('');
      expect(cn('')).toBe('');
      expect(cn(null)).toBe('');
      expect(cn(undefined)).toBe('');
    });

    it('should handle whitespace in class names', () => {
      const result = cn('  px-4  ', '  py-2  ');
      expect(result).toBe('px-4 py-2');
    });

    it('should resolve responsive class conflicts', () => {
      const result = cn(
        'w-full',
        'md:w-1/2',
        'lg:w-1/3',
        'w-auto' // This should not conflict with responsive variants
      );
      expect(result).toBe('md:w-1/2 lg:w-1/3 w-auto');
    });

    it('should handle state variant conflicts', () => {
      const result = cn(
        'hover:bg-red-500',
        'hover:bg-blue-500',
        'focus:bg-green-500'
      );
      expect(result).toBe('hover:bg-blue-500 focus:bg-green-500');
    });

    it('should handle size variant conflicts', () => {
      const result = cn(
        'text-sm',
        'text-base',
        'text-lg',
        'text-xl'
      );
      expect(result).toBe('text-xl');
    });

    it('should handle color variant conflicts', () => {
      const result = cn(
        'text-red-500',
        'text-blue-600',
        'bg-yellow-300',
        'bg-green-400'
      );
      expect(result).toBe('text-blue-600 bg-green-400');
    });

    it('should preserve non-conflicting classes with similar prefixes', () => {
      const result = cn(
        'p-4',      // padding
        'pt-6',     // padding-top (should not conflict with p-4)
        'px-8'      // padding-x (should override p-4 for left/right)
      );
      // tailwind-merge should intelligently handle these
      expect(result).toContain('pt-6');
    });

    it('should handle complex real-world component scenarios', () => {
      const isLoading = true;
      const variant = 'primary';
      const size = 'lg';
      
      const result = cn(
        // Base button classes
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        
        // Size variants
        {
          'h-9 px-3 text-sm': size === 'sm',
          'h-10 px-4 text-sm': size === 'md',
          'h-11 px-8 text-base': size === 'lg',
        },
        
        // Color variants
        {
          'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'primary',
          'bg-secondary text-secondary-foreground hover:bg-secondary/80': variant === 'secondary',
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground': variant === 'outline',
        },
        
        // State modifiers
        isLoading && 'opacity-50 cursor-not-allowed',
        
        // Override classes
        'custom-button-class'
      );

      expect(result).toContain('inline-flex');
      expect(result).toContain('h-11 px-8 text-base'); // size lg
      expect(result).toContain('bg-primary'); // primary variant
      expect(result).toContain('opacity-50'); // loading state
      expect(result).toContain('custom-button-class');
      expect(result).not.toContain('h-9 px-3 text-sm'); // other sizes should be filtered out
    });
  });
});
