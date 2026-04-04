import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-brand text-white hover:bg-brand-dark shadow-[0_0_0_1px_rgba(107,158,119,0.30),0_4px_24px_rgba(107,158,119,0.20)] border border-brand/20',
  secondary:
    'bg-surface text-text-1 hover:bg-elevated border border-border hover:border-border-strong shadow-sm',
  ghost:
    'bg-transparent text-text-2 hover:bg-elevated hover:text-text-1 border border-transparent',
  danger:
    'bg-danger text-white hover:bg-danger/85 shadow-[0_0_0_1px_rgba(192,90,82,0.28),0_4px_24px_rgba(192,90,82,0.16)] border border-danger/20',
  success:
    'bg-success text-white hover:bg-success/85 shadow-[0_0_0_1px_rgba(91,163,122,0.30),0_4px_24px_rgba(91,163,122,0.18)] border border-success/20',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-4 text-xs gap-1.5 rounded-full',
  md: 'h-10 px-5 text-sm gap-2 rounded-full',
  lg: 'h-12 px-7 text-base gap-2 rounded-full',
  xl: 'h-14 px-9 text-lg gap-2.5 rounded-full',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      children,
      className,
      disabled,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <motion.button
        ref={ref}
        whileHover={!isDisabled ? { scale: 1.02 } : undefined}
        whileTap={!isDisabled ? { scale: 0.97 } : undefined}
        transition={{ duration: 0.12, ease: 'easeOut' }}
        className={cn(
          'inline-flex items-center justify-center',
          'font-medium tracking-wide cursor-pointer select-none',
          'transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
          variantClasses[variant],
          sizeClasses[size],
          isDisabled && 'opacity-45 cursor-not-allowed pointer-events-none',
          fullWidth && 'w-full',
          className,
        )}
        disabled={isDisabled}
        {...(props as React.ComponentProps<typeof motion.button>)}
      >
        {isLoading ? (
          <>
            <LoadingSpinner size={size} />
            <span>{children}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </motion.button>
    );
  },
);

Button.displayName = 'Button';

function LoadingSpinner({ size }: { size: ButtonSize }) {
  const sz = size === 'sm' ? 12 : size === 'md' ? 14 : 16;
  return (
    <svg
      className="animate-spin shrink-0"
      width={sz}
      height={sz}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}
