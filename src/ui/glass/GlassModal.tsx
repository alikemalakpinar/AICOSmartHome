/**
 * GlassModal Component
 *
 * A premium modal that feels like a heavy glass pane sliding in
 * with physics-based animations and depth effects.
 */

import React, { useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { X } from 'lucide-react';
import { GlassIconButton } from './GlassButton';

export interface GlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  position?: 'center' | 'right' | 'bottom';
  showClose?: boolean;
  closeOnOverlay?: boolean;
  closeOnEscape?: boolean;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[90vw] max-h-[90vh]',
};

const overlayVariants: Variants = {
  hidden: {
    opacity: 0,
    backdropFilter: 'blur(0px)',
  },
  visible: {
    opacity: 1,
    backdropFilter: 'blur(12px)',
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    backdropFilter: 'blur(0px)',
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
};

const getModalVariants = (position: GlassModalProps['position']): Variants => {
  const base = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      y: position === 'bottom' ? 100 : position === 'right' ? 0 : 30,
      x: position === 'right' ? 100 : 0,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      x: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
        mass: 0.8,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.98,
      y: position === 'bottom' ? 50 : position === 'right' ? 0 : 20,
      x: position === 'right' ? 50 : 0,
      transition: {
        duration: 0.2,
        ease: 'easeIn',
      },
    },
  };
  return base;
};

const positionClasses = {
  center: 'items-center justify-center',
  right: 'items-stretch justify-end',
  bottom: 'items-end justify-center',
};

export const GlassModal: React.FC<GlassModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  subtitle,
  size = 'md',
  position = 'center',
  showClose = true,
  closeOnOverlay = true,
  closeOnEscape = true,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle escape key
  useEffect(() => {
    if (!closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, closeOnEscape]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (closeOnOverlay && e.target === e.currentTarget) {
        onClose();
      }
    },
    [closeOnOverlay, onClose]
  );

  const modalVariants = getModalVariants(position);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={`fixed inset-0 z-50 flex ${positionClasses[position]}`}
          style={{
            background: 'rgba(0, 0, 0, 0.6)',
          }}
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={handleOverlayClick}
        >
          <motion.div
            ref={modalRef}
            className={`
              relative w-full ${position !== 'right' ? sizeClasses[size] : 'max-w-md'}
              ${position === 'right' ? 'h-full' : ''}
              ${position === 'bottom' ? 'max-h-[80vh]' : ''}
              ${position === 'center' ? 'mx-4 my-8 max-h-[85vh]' : ''}
            `}
            style={{
              background: 'linear-gradient(180deg, rgba(20, 20, 30, 0.95) 0%, rgba(15, 15, 25, 0.98) 100%)',
              backdropFilter: 'blur(40px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: position === 'right' ? '24px 0 0 24px' : position === 'bottom' ? '24px 24px 0 0' : '24px',
              boxShadow: `
                0 24px 80px rgba(0, 0, 0, 0.6),
                0 0 1px rgba(255, 255, 255, 0.1),
                inset 0 1px 1px rgba(255, 255, 255, 0.1)
              `,
            }}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Top highlight */}
            <div
              className="absolute top-0 left-0 right-0 h-px pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.2) 50%, transparent 100%)',
              }}
            />

            {/* Header */}
            {(title || showClose) && (
              <div className="flex items-start justify-between p-6 pb-0">
                <div className="flex-1">
                  {title && (
                    <h2 className="text-xl font-semibold text-white">{title}</h2>
                  )}
                  {subtitle && (
                    <p className="mt-1 text-sm text-white/60">{subtitle}</p>
                  )}
                </div>
                {showClose && (
                  <GlassIconButton
                    icon={<X size={20} />}
                    label="Close"
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="ml-4 -mr-2 -mt-2"
                  />
                )}
              </div>
            )}

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-100px)]">
              {children}
            </div>

            {/* Bottom edge effect */}
            <div
              className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
              style={{
                background: 'linear-gradient(180deg, transparent 0%, rgba(10, 10, 15, 0.5) 100%)',
                borderRadius: 'inherit',
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Convenience wrapper for confirmation dialogs
export interface GlassConfirmModalProps extends Omit<GlassModalProps, 'children'> {
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  variant?: 'default' | 'danger';
}

export const GlassConfirmModal: React.FC<GlassConfirmModalProps> = ({
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onClose,
  variant = 'default',
  ...props
}) => {
  return (
    <GlassModal {...props} onClose={onClose} size="sm">
      <p className="text-white/80 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <motion.button
          className="px-6 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-white transition-colors"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onClose}
        >
          {cancelText}
        </motion.button>
        <motion.button
          className="px-6 py-2.5 rounded-xl text-sm font-medium"
          style={{
            background: variant === 'danger'
              ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(239, 68, 68, 0.1) 100%)'
              : 'linear-gradient(135deg, rgba(0, 212, 170, 0.3) 0%, rgba(0, 212, 170, 0.1) 100%)',
            border: variant === 'danger'
              ? '1px solid rgba(239, 68, 68, 0.3)'
              : '1px solid rgba(0, 212, 170, 0.3)',
            color: variant === 'danger' ? '#ef4444' : '#00d4aa',
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmText}
        </motion.button>
      </div>
    </GlassModal>
  );
};

export default GlassModal;
