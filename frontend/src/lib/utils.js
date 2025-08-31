// Simple class name utility without external dependency
function clsx(...classes) {
  return classes
    .filter(Boolean)
    .join(' ')
    .trim();
}

/**
 * Utility function to merge class names
 * Similar to the popular cn() utility from shadcn/ui
 */
export function cn(...inputs) {
  return clsx(inputs);
}

/**
 * Format date to Brazilian format
 */
export function formatDateBR(date) {
  if (!date) return '';
  
  try {
    return new Date(date).toLocaleDateString('pt-BR');
  } catch (error) {
    return '';
  }
}

/**
 * Format currency to Brazilian Real
 */
export function formatCurrency(value) {
  if (!value && value !== 0) return '';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

/**
 * Generate user initials from name
 */
export function getUserInitials(name) {
  if (!name) return 'U';
  
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/**
 * Debounce function for search inputs
 */
export function debounce(func, wait) {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Format file size
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Validate email format
 */
export function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Validate phone number (Brazilian format)
 */
export function isValidPhone(phone) {
  const re = /^\(?[1-9]{2}\)?\s?[0-9]{4,5}-?[0-9]{4}$/;
  return re.test(phone.replace(/\s/g, ''));
}

/**
 * Generate random ID
 */
export function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

/**
 * Truncate text
 */
export function truncate(text, length = 50) {
  if (!text) return '';
  
  if (text.length <= length) return text;
  
  return text.substring(0, length) + '...';
}

export default {
  cn,
  formatDateBR,
  formatCurrency,
  getUserInitials,
  debounce,
  formatFileSize,
  isValidEmail,
  isValidPhone,
  generateId,
  truncate
};