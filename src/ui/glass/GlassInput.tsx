/**
 * GlassInput Component
 *
 * Premium glass-styled form inputs with focus states,
 * validation styling, and smooth animations.
 */

import React, { forwardRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Check, Eye, EyeOff, Search } from 'lucide-react';

export interface GlassInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  success?: boolean;
  hint?: string;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'search';
}

const sizeClasses = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-3 text-base',
  lg: 'px-5 py-4 text-lg',
};

const iconSizes = {
  sm: 16,
  md: 18,
  lg: 20,
};

export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  (
    {
      label,
      error,
      success,
      hint,
      icon,
      size = 'md',
      variant = 'default',
      type,
      className = '',
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const isPassword = type === 'password';
    const isSearch = variant === 'search';
    const actualType = isPassword && showPassword ? 'text' : type;

    const hasIcon = icon || isSearch;
    const hasRightIcon = isPassword || success || error;

    return (
      <div className={`relative ${className}`}>
        {/* Label */}
        {label && (
          <motion.label
            className="block mb-2 text-sm font-medium text-white/70"
            animate={{ color: isFocused ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.7)' }}
          >
            {label}
          </motion.label>
        )}

        {/* Input wrapper */}
        <div className="relative">
          {/* Left icon */}
          {hasIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none">
              {isSearch ? <Search size={iconSizes[size]} /> : icon}
            </div>
          )}

          {/* Input */}
          <motion.input
            ref={ref}
            type={actualType}
            className={`
              w-full
              ${sizeClasses[size]}
              ${hasIcon ? 'pl-11' : ''}
              ${hasRightIcon ? 'pr-11' : ''}
              rounded-xl
              text-white placeholder-white/40
              outline-none
              transition-colors duration-300
            `}
            style={{
              background: isFocused
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(12px)',
              border: error
                ? '1px solid rgba(239, 68, 68, 0.5)'
                : success
                  ? '1px solid rgba(16, 185, 129, 0.5)'
                  : isFocused
                    ? '1px solid rgba(0, 212, 170, 0.5)'
                    : '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: error
                ? '0 0 20px rgba(239, 68, 68, 0.1)'
                : success
                  ? '0 0 20px rgba(16, 185, 129, 0.1)'
                  : isFocused
                    ? '0 0 20px rgba(0, 212, 170, 0.15)'
                    : 'none',
            }}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            {...props}
          />

          {/* Right icons */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {/* Password toggle */}
            {isPassword && (
              <motion.button
                type="button"
                className="text-white/40 hover:text-white/70 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
                whileTap={{ scale: 0.9 }}
              >
                {showPassword ? (
                  <EyeOff size={iconSizes[size]} />
                ) : (
                  <Eye size={iconSizes[size]} />
                )}
              </motion.button>
            )}

            {/* Success indicator */}
            {success && !isPassword && (
              <motion.span
                className="text-success-green"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500 }}
              >
                <Check size={iconSizes[size]} />
              </motion.span>
            )}

            {/* Error indicator */}
            {error && !isPassword && (
              <motion.span
                className="text-error-red"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500 }}
              >
                <AlertCircle size={iconSizes[size]} />
              </motion.span>
            )}
          </div>
        </div>

        {/* Error/Hint message */}
        <AnimatePresence mode="wait">
          {(error || hint) && (
            <motion.p
              className={`mt-2 text-sm ${error ? 'text-error-red/80' : 'text-white/50'}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {error || hint}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

GlassInput.displayName = 'GlassInput';

// Textarea variant
export interface GlassTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const GlassTextarea = forwardRef<HTMLTextAreaElement, GlassTextareaProps>(
  ({ label, error, hint, className = '', ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
      <div className={`relative ${className}`}>
        {label && (
          <motion.label
            className="block mb-2 text-sm font-medium text-white/70"
            animate={{ color: isFocused ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.7)' }}
          >
            {label}
          </motion.label>
        )}

        <motion.textarea
          ref={ref}
          className="w-full px-4 py-3 rounded-xl text-white placeholder-white/40 outline-none resize-none transition-colors duration-300"
          style={{
            background: isFocused
              ? 'rgba(255, 255, 255, 0.08)'
              : 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(12px)',
            border: error
              ? '1px solid rgba(239, 68, 68, 0.5)'
              : isFocused
                ? '1px solid rgba(0, 212, 170, 0.5)'
                : '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: error
              ? '0 0 20px rgba(239, 68, 68, 0.1)'
              : isFocused
                ? '0 0 20px rgba(0, 212, 170, 0.15)'
                : 'none',
            minHeight: '120px',
          }}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />

        <AnimatePresence mode="wait">
          {(error || hint) && (
            <motion.p
              className={`mt-2 text-sm ${error ? 'text-error-red/80' : 'text-white/50'}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {error || hint}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

GlassTextarea.displayName = 'GlassTextarea';

export default GlassInput;
