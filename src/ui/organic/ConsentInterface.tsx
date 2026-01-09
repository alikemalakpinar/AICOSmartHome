/**
 * AICO - Consent Interface
 *
 * "The house only asks when it's unsure.
 *  And it asks in the gentlest way possible."
 *
 * This is not a modal dialog. It is a whisper.
 * The house suggests; you breathe an answer.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ConsentRequest, SilenceState } from '../../core/philosophy';

// ============================================================================
// Consent Request Component
// ============================================================================

interface ConsentInterfaceProps {
  request: ConsentRequest | null;
  onRespond: (requestId: string, approved: boolean) => void;
  className?: string;
}

export const ConsentInterface: React.FC<ConsentInterfaceProps> = ({
  request,
  onRespond,
  className,
}) => {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isHovered, setIsHovered] = useState(false);

  // Countdown to auto-resolve
  useEffect(() => {
    if (!request) return;

    setTimeRemaining(request.autoResolveIn);

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Auto-resolve
          onRespond(request.id, request.defaultAction === 'proceed');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [request, onRespond]);

  // Handle gesture/nod response
  const handleApprove = useCallback(() => {
    if (request) {
      onRespond(request.id, true);
    }
  }, [request, onRespond]);

  const handleDecline = useCallback(() => {
    if (request) {
      onRespond(request.id, false);
    }
  }, [request, onRespond]);

  if (!request) return null;

  const urgencyColor = request.proposedAction.urgency === 'now'
    ? 'rgba(239, 68, 68, 0.2)'
    : request.proposedAction.urgency === 'soon'
      ? 'rgba(245, 158, 11, 0.15)'
      : 'rgba(16, 185, 129, 0.1)';

  return (
    <AnimatePresence>
      <motion.div
        className={`consent-interface ${className ?? ''}`}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{
          position: 'fixed',
          bottom: 60,
          left: '50%',
          transform: 'translateX(-50%)',
          maxWidth: 400,
          zIndex: 1000,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* The Whisper Container */}
        <motion.div
          style={{
            background: 'rgba(10, 10, 18, 0.9)',
            backdropFilter: 'blur(40px)',
            borderRadius: 24,
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: `0 20px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)`,
            padding: '24px 32px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
          animate={{
            borderColor: isHovered ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)',
          }}
        >
          {/* Category Icon */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: getCategoryColor(request.proposedAction.category),
                boxShadow: `0 0 12px ${getCategoryColor(request.proposedAction.category)}`,
              }}
            />
            <span
              style={{
                fontSize: 10,
                color: 'rgba(255, 255, 255, 0.4)',
                fontFamily: 'monospace',
                letterSpacing: 2,
                textTransform: 'uppercase',
              }}
            >
              {request.proposedAction.category}
            </span>
          </div>

          {/* The Question */}
          <p
            style={{
              fontSize: 16,
              color: 'rgba(255, 255, 255, 0.85)',
              lineHeight: 1.5,
              margin: 0,
              fontWeight: 300,
            }}
          >
            {request.displayText}
          </p>

          {/* Confidence Indicator */}
          {request.confidence < 0.8 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <div
                style={{
                  flex: 1,
                  height: 2,
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: 1,
                }}
              >
                <div
                  style={{
                    width: `${request.confidence * 100}%`,
                    height: '100%',
                    background: 'rgba(255, 255, 255, 0.3)',
                    borderRadius: 1,
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: 9,
                  color: 'rgba(255, 255, 255, 0.3)',
                  fontFamily: 'monospace',
                }}
              >
                {Math.round(request.confidence * 100)}% sure
              </span>
            </div>
          )}

          {/* Response Area */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              marginTop: 8,
            }}
          >
            {/* Decline */}
            <motion.button
              onClick={handleDecline}
              style={{
                flex: 1,
                padding: '12px 20px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 12,
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: 13,
                cursor: 'pointer',
                fontWeight: 400,
              }}
              whileHover={{
                background: 'rgba(239, 68, 68, 0.1)',
                borderColor: 'rgba(239, 68, 68, 0.3)',
                color: 'rgba(239, 68, 68, 0.8)',
              }}
              whileTap={{ scale: 0.98 }}
            >
              Not now
            </motion.button>

            {/* Approve */}
            <motion.button
              onClick={handleApprove}
              style={{
                flex: 1,
                padding: '12px 20px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: 12,
                color: 'rgba(16, 185, 129, 0.9)',
                fontSize: 13,
                cursor: 'pointer',
                fontWeight: 500,
              }}
              whileHover={{
                background: 'rgba(16, 185, 129, 0.25)',
                borderColor: 'rgba(16, 185, 129, 0.5)',
              }}
              whileTap={{ scale: 0.98 }}
            >
              Yes, please
            </motion.button>
          </div>

          {/* Auto-dismiss indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              opacity: 0.3,
            }}
          >
            <span
              style={{
                fontSize: 9,
                color: 'rgba(255, 255, 255, 0.5)',
                fontFamily: 'monospace',
              }}
            >
              {request.defaultAction === 'proceed' ? 'Will proceed' : 'Will dismiss'} in {timeRemaining}s
            </span>
          </div>
        </motion.div>

        {/* Breath hint for response method */}
        {request.responseMethod === 'nod' && (
          <motion.p
            style={{
              textAlign: 'center',
              fontSize: 10,
              color: 'rgba(255, 255, 255, 0.25)',
              marginTop: 12,
              fontStyle: 'italic',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.25 }}
            transition={{ delay: 2 }}
          >
            or simply nod
          </motion.p>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

// ============================================================================
// Silence Switch - The Ultimate Luxury
// ============================================================================

interface SilenceSwitchProps {
  silenceState: SilenceState;
  onToggle: () => void;
  className?: string;
}

export const SilenceSwitch: React.FC<SilenceSwitchProps> = ({
  silenceState,
  onToggle,
  className,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className={`silence-switch ${className ?? ''}`}
      style={{
        position: 'fixed',
        bottom: 30,
        left: 30,
        zIndex: 100,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* The Physical Switch Representation */}
      <motion.button
        onClick={onToggle}
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: silenceState.active
            ? 'rgba(129, 140, 248, 0.2)'
            : 'rgba(255, 255, 255, 0.05)',
          border: silenceState.active
            ? '2px solid rgba(129, 140, 248, 0.5)'
            : '2px solid rgba(255, 255, 255, 0.1)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: silenceState.active
            ? '0 0 30px rgba(129, 140, 248, 0.3), inset 0 0 20px rgba(129, 140, 248, 0.1)'
            : '0 4px 20px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.3s ease',
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Silence Icon */}
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke={silenceState.active ? '#818cf8' : 'rgba(255, 255, 255, 0.4)'}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {silenceState.active ? (
            // Shield with check - protected
            <>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 12l2 2 4-4" />
            </>
          ) : (
            // Shield outline - unprotected
            <>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </>
          )}
        </svg>
      </motion.button>

      {/* Label on hover */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            style={{
              position: 'absolute',
              left: 80,
              top: '50%',
              transform: 'translateY(-50%)',
              whiteSpace: 'nowrap',
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: silenceState.active ? '#818cf8' : 'rgba(255, 255, 255, 0.5)',
                fontWeight: 500,
              }}
            >
              {silenceState.active ? 'Sanctuary Active' : 'Engage Silence'}
            </p>
            <p
              style={{
                margin: '4px 0 0 0',
                fontSize: 10,
                color: 'rgba(255, 255, 255, 0.3)',
              }}
            >
              {silenceState.active
                ? 'External world disconnected'
                : 'Sever external connections'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active indicator pulse */}
      {silenceState.active && (
        <motion.div
          style={{
            position: 'absolute',
            inset: -4,
            borderRadius: '50%',
            border: '1px solid rgba(129, 140, 248, 0.3)',
          }}
          animate={{
            scale: [1, 1.3, 1.3],
            opacity: [0.5, 0, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      )}
    </motion.div>
  );
};

// ============================================================================
// Silence Overlay - When Silence is Active
// ============================================================================

interface SilenceOverlayProps {
  silenceState: SilenceState;
}

export const SilenceOverlay: React.FC<SilenceOverlayProps> = ({ silenceState }) => {
  if (!silenceState.active) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 50,
      }}
    >
      {/* Subtle vignette overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 60%, rgba(129, 140, 248, 0.05) 100%)',
        }}
      />

      {/* Corner indicators */}
      {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((corner) => (
        <div
          key={corner}
          style={{
            position: 'absolute',
            width: 30,
            height: 30,
            borderColor: 'rgba(129, 140, 248, 0.2)',
            borderStyle: 'solid',
            borderWidth: 0,
            ...(corner === 'top-left' && { top: 15, left: 15, borderTopWidth: 1, borderLeftWidth: 1 }),
            ...(corner === 'top-right' && { top: 15, right: 15, borderTopWidth: 1, borderRightWidth: 1 }),
            ...(corner === 'bottom-left' && { bottom: 15, left: 15, borderBottomWidth: 1, borderLeftWidth: 1 }),
            ...(corner === 'bottom-right' && { bottom: 15, right: 15, borderBottomWidth: 1, borderRightWidth: 1 }),
          }}
        />
      ))}

      {/* Status text */}
      <motion.div
        style={{
          position: 'absolute',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
        animate={{ opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#818cf8',
          }}
        />
        <span
          style={{
            fontSize: 10,
            color: 'rgba(129, 140, 248, 0.6)',
            fontFamily: 'monospace',
            letterSpacing: 2,
          }}
        >
          {silenceState.atmosphere.toUpperCase()}
        </span>
      </motion.div>
    </motion.div>
  );
};

// ============================================================================
// Helper Functions
// ============================================================================

function getCategoryColor(category: ConsentRequest['proposedAction']['category']): string {
  const colors: Record<typeof category, string> = {
    comfort: '#10b981',
    social: '#f59e0b',
    security: '#ef4444',
    communication: '#3b82f6',
    purchase: '#a78bfa',
  };
  return colors[category] || '#6b7280';
}

// ============================================================================
// Exports
// ============================================================================

export default ConsentInterface;
