// Utility function para combinação de classes CSS
// Funciona similar ao clsx/classnames mas sem dependências externas
export function cn(...inputs) {
  return inputs
    .flat()
    .filter(Boolean)
    .join(' ');
}

export default cn;