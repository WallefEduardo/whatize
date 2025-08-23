import clsx from 'clsx';

/**
 * Utility function to merge classes with clsx
 * Useful for conditional classes and Tailwind + MUI integration
 */
export function cn(...inputs) {
  return clsx(inputs);
}