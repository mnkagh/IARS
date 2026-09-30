import React from 'react';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'; }
export const Button: React.FC<Props> = ({ children, variant='primary', className='', onClick, ...props }) => {
  // Pre-defined class strings per variant - no template literals
  const variantClasses: Record<string, string> = {
    primary: 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white hover:shadow-lg hover:scale-102',
    secondary: 'bg-slate-700 text-white hover:bg-slate-600',
    ghost: 'bg-transparent text-[#667eea] border border-[#667eea]/50 hover:text-[#764ba2]',
    danger: 'bg-red-600 text-white hover:scale-102',
    outline: 'bg-white text-[#667eea] border-2 hover:border-[#667eea]'
  };
  const variantClass = variantClasses[variant] || '';
  // Base classes
  const base = 'px-6 py-3 rounded-lg font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-offset-2';
  const fullClass = variantClass ? `${base} ${variantClass}` : base;
  return (
    <button
      className={fullClass}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};