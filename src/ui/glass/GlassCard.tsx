/**
 * GlassCard Component
 *
 * A premium frosted glass card with multi-layered depth,
 * subtle gradients, and physics-based animations.
 */

import React from 'react';
import { motion, type HTMLMotionProps, type Variants } from 'framer-motion';

export interface GlassCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'floating' | 'subtle';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  glow?: 'none' | 'teal' | 'gold' | 'blue';
  interactive?: boolean;
  blur?: 'sm' | 'md' | 'lg' | 'xl';
  noPadding?: boolean;
}

const sizeClasses = {
  sm: 'rounded-xl',
  md: 'rounded-2xl',
  lg: 'rounded-3xl',
  xl: 'rounded-[2rem]',
};

const paddingClasses = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
  xl: 'p-10',
};

const blurClasses = {
  sm: 'backdrop-blur-md',
  md: 'backdrop-blur-xl',
  lg: 'backdrop-blur-2xl',
  xl: 'backdrop-blur-3xl',
};

const glowStyles = {
  none: '',
  teal: '0 0 40px rgba(0, 212, 170, 0.15)',
  gold: '0 0 40px rgba(201, 169, 98, 0.15)',
  blue: '0 0 40px rgba(0, 102, 255, 0.15)',
};

const cardVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    y: 10,
    scale: 0.98,
    transition: {
      duration: 0.2,
    },
  },
  hover: {
    y: -4,
    scale: 1.01,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
    },
  },
  tap: {
    scale: 0.99,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 30,
    },
  },
};

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  variant = 'default',
  size = 'md',
  glow = 'none',
  interactive = false,
  blur = 'lg',
  noPadding = false,
  className = '',
  style,
  ...props
}) => {
  const baseStyles: React.CSSProperties = {
    background: variant === 'subtle'
      ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)'
      : variant === 'elevated'
        ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.04) 100%)'
        : variant === 'floating'
          ? 'linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.02) 100%)'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: `
      0 8px 32px rgba(0, 0, 0, 0.4),
      inset 0 1px 1px rgba(255, 255, 255, 0.1)
      ${glow !== 'none' ? `, ${glowStyles[glow]}` : ''}
    `.trim(),
    ...style,
  };

  return (
    <motion.div
      className={`
        relative overflow-hidden
        ${sizeClasses[size]}
        ${!noPadding ? paddingClasses[size] : ''}
        ${blurClasses[blur]}
        ${className}
      `}
      style={baseStyles}
      variants={cardVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      whileHover={interactive ? 'hover' : undefined}
      whileTap={interactive ? 'tap' : undefined}
      {...props}
    >
      {/* Inner highlight gradient */}
      <div
        className="absolute inset-0 pointer-events-none opacity-50"
        style={{
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, transparent 40%)',
          borderRadius: 'inherit',
        }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>

      {/* Bottom edge highlight */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)',
        }}
      />
    </motion.div>
  );
};

export default GlassCard;
