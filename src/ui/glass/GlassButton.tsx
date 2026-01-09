/**
 * GlassButton Component
 *
 * Highly interactive button with subtle glow effects,
 * press animations, and magnetic hover states.
 */

import React, { useCallback, useRef, useState } from 'react';
import { motion, type HTMLMotionProps, useMotionValue, useSpring, useTransform } from 'framer-motion';

export interface GlassButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'gold' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  magnetic?: boolean;
}

const sizeClasses = {
  sm: 'px-4 py-2 text-xs rounded-lg gap-1.5',
  md: 'px-6 py-3 text-sm rounded-xl gap-2',
  lg: 'px-8 py-4 text-base rounded-xl gap-2.5',
  xl: 'px-10 py-5 text-lg rounded-2xl gap-3',
};

const variantStyles = {
  default: {
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.03) 100%)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: 'rgba(255, 255, 255, 0.9)',
    hoverGlow: '0 0 20px rgba(255, 255, 255, 0.1)',
  },
  primary: {
    background: 'linear-gradient(135deg, rgba(0, 212, 170, 0.3) 0%, rgba(0, 212, 170, 0.1) 100%)',
    border: '1px solid rgba(0, 212, 170, 0.3)',
    color: '#00d4aa',
    hoverGlow: '0 0 30px rgba(0, 212, 170, 0.3)',
  },
  gold: {
    background: 'linear-gradient(135deg, rgba(201, 169, 98, 0.25) 0%, rgba(201, 169, 98, 0.08) 100%)',
    border: '1px solid rgba(201, 169, 98, 0.3)',
    color: '#c9a962',
    hoverGlow: '0 0 30px rgba(201, 169, 98, 0.25)',
  },
  danger: {
    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(239, 68, 68, 0.08) 100%)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#ef4444',
    hoverGlow: '0 0 30px rgba(239, 68, 68, 0.25)',
  },
  ghost: {
    background: 'transparent',
    border: '1px solid transparent',
    color: 'rgba(255, 255, 255, 0.7)',
    hoverGlow: 'none',
  },
};

export const GlassButton: React.FC<GlassButtonProps> = ({
  children,
  variant = 'default',
  size = 'md',
  icon,
  iconPosition = 'left',
  fullWidth = false,
  loading = false,
  disabled = false,
  magnetic = true,
  className = '',
  style,
  onMouseMove,
  onMouseLeave,
  ...props
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Magnetic effect values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { stiffness: 400, damping: 30 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!magnetic || disabled) return;

      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;

      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const distanceX = (e.clientX - centerX) * 0.15;
      const distanceY = (e.clientY - centerY) * 0.15;

      mouseX.set(distanceX);
      mouseY.set(distanceY);

      onMouseMove?.(e);
    },
    [magnetic, disabled, mouseX, mouseY, onMouseMove]
  );

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      mouseX.set(0);
      mouseY.set(0);
      setIsHovered(false);
      onMouseLeave?.(e);
    },
    [mouseX, mouseY, onMouseLeave]
  );

  const styles = variantStyles[variant];
  const isDisabled = disabled || loading;

  return (
    <motion.button
      ref={buttonRef}
      className={`
        relative inline-flex items-center justify-center font-medium
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        transition-colors duration-300
        ${className}
      `}
      style={{
        ...styles,
        backdropFilter: variant !== 'ghost' ? 'blur(12px)' : undefined,
        boxShadow: `
          0 4px 16px rgba(0, 0, 0, 0.3),
          inset 0 1px 1px rgba(255, 255, 255, 0.1)
          ${isHovered && !isDisabled ? `, ${styles.hoverGlow}` : ''}
        `.trim(),
        x: magnetic && !isDisabled ? x : 0,
        y: magnetic && !isDisabled ? y : 0,
        ...style,
      }}
      disabled={isDisabled}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={() => setIsHovered(true)}
      whileHover={
        !isDisabled
          ? {
              scale: 1.02,
              transition: { type: 'spring', stiffness: 400, damping: 25 },
            }
          : undefined
      }
      whileTap={
        !isDisabled
          ? {
              scale: 0.98,
              transition: { type: 'spring', stiffness: 500, damping: 30 },
            }
          : undefined
      }
      {...props}
    >
      {/* Shimmer effect on hover */}
      {isHovered && !isDisabled && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
            backgroundSize: '200% 100%',
          }}
          initial={{ backgroundPosition: '-200% 0' }}
          animate={{ backgroundPosition: '200% 0' }}
          transition={{ duration: 1.5, ease: 'linear' }}
        />
      )}

      {/* Content */}
      <span className="relative z-10 flex items-center justify-center gap-inherit">
        {loading ? (
          <motion.span
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        ) : (
          <>
            {icon && iconPosition === 'left' && <span className="flex-shrink-0">{icon}</span>}
            <span>{children}</span>
            {icon && iconPosition === 'right' && <span className="flex-shrink-0">{icon}</span>}
          </>
        )}
      </span>

      {/* Press indicator */}
      <motion.div
        className="absolute inset-0 rounded-inherit pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, rgba(255, 255, 255, 0.1) 0%, transparent 70%)',
          borderRadius: 'inherit',
        }}
        initial={{ opacity: 0, scale: 0.8 }}
        whileTap={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.15 }}
      />
    </motion.button>
  );
};

// Icon-only button variant
export interface GlassIconButtonProps extends Omit<GlassButtonProps, 'children' | 'icon' | 'iconPosition'> {
  icon: React.ReactNode;
  label: string;
}

export const GlassIconButton: React.FC<GlassIconButtonProps> = ({
  icon,
  label,
  size = 'md',
  className = '',
  ...props
}) => {
  const iconSizeClasses = {
    sm: 'p-2 rounded-lg',
    md: 'p-3 rounded-xl',
    lg: 'p-4 rounded-xl',
    xl: 'p-5 rounded-2xl',
  };

  return (
    <GlassButton
      className={`${iconSizeClasses[size]} ${className}`}
      aria-label={label}
      size={size}
      {...props}
    >
      {icon}
    </GlassButton>
  );
};

export default GlassButton;
