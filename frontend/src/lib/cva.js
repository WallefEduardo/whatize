/**
 * Simple Class Variance Authority (CVA) implementation
 * Alternative to the popular 'class-variance-authority' package
 */

export function cva(base, options = {}) {
  return (props = {}) => {
    let classes = [base];
    
    // Add variant classes
    if (options.variants) {
      Object.keys(options.variants).forEach(variantKey => {
        const variantValue = props[variantKey];
        if (variantValue && options.variants[variantKey][variantValue]) {
          classes.push(options.variants[variantKey][variantValue]);
        }
      });
    }
    
    // Apply default variants if no prop is provided
    if (options.defaultVariants) {
      Object.keys(options.defaultVariants).forEach(variantKey => {
        if (props[variantKey] === undefined) {
          const defaultValue = options.defaultVariants[variantKey];
          if (options.variants[variantKey] && options.variants[variantKey][defaultValue]) {
            classes.push(options.variants[variantKey][defaultValue]);
          }
        }
      });
    }
    
    // Filter out falsy values and join with spaces
    return classes
      .filter(Boolean)
      .join(' ')
      .trim();
  };
}

export default cva;