/**
 * GlassSidebar Component
 *
 * A floating glass sidebar with premium animations,
 * smooth transitions, and nested navigation support.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  Home,
  Thermometer,
  Lightbulb,
  Shield,
  Zap,
  Music,
  Settings,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: string | number;
  children?: NavItem[];
}

export interface GlassSidebarProps {
  items?: NavItem[];
  activeId?: string;
  onSelect?: (id: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

const defaultItems: NavItem[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'climate', label: 'Climate', icon: Thermometer },
  { id: 'lighting', label: 'Lighting', icon: Lightbulb },
  { id: 'security', label: 'Security', icon: Shield, badge: 2 },
  { id: 'energy', label: 'Energy', icon: Zap },
  { id: 'media', label: 'Media', icon: Music },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const sidebarVariants: Variants = {
  expanded: {
    width: 280,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
  collapsed: {
    width: 80,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.05,
      type: 'spring',
      stiffness: 300,
      damping: 25,
    },
  }),
};

const NavItemComponent: React.FC<{
  item: NavItem;
  isActive: boolean;
  isCollapsed: boolean;
  index: number;
  onSelect: (id: string) => void;
  depth?: number;
}> = ({ item, isActive, isCollapsed, index, onSelect, depth = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const Icon = item.icon;
  const hasChildren = item.children && item.children.length > 0;

  const handleClick = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    } else {
      onSelect(item.id);
    }
  };

  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      custom={index}
    >
      <motion.button
        className={`
          w-full flex items-center gap-3
          ${isCollapsed ? 'justify-center px-3' : 'px-4'}
          py-3 rounded-xl
          text-left font-medium text-sm
          transition-colors duration-200
          ${isActive
            ? 'text-teal-glow'
            : 'text-white/60 hover:text-white/90'
          }
        `}
        style={{
          background: isActive
            ? 'linear-gradient(135deg, rgba(0, 212, 170, 0.15) 0%, rgba(0, 212, 170, 0.05) 100%)'
            : 'transparent',
          boxShadow: isActive
            ? '0 0 20px rgba(0, 212, 170, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.05)'
            : 'none',
          marginLeft: depth * 12,
        }}
        onClick={handleClick}
        whileHover={{
          backgroundColor: isActive ? undefined : 'rgba(255, 255, 255, 0.05)',
        }}
        whileTap={{ scale: 0.98 }}
      >
        <motion.span
          className="flex-shrink-0"
          animate={isActive ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          <Icon
            size={20}
            className={isActive ? 'drop-shadow-[0_0_8px_rgba(0,212,170,0.5)]' : ''}
          />
        </motion.span>

        <AnimatePresence>
          {!isCollapsed && (
            <motion.span
              className="flex-1 truncate"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Badge */}
        {item.badge && !isCollapsed && (
          <motion.span
            className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold bg-error-red/20 text-error-red"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500 }}
          >
            {item.badge}
          </motion.span>
        )}

        {/* Expand indicator */}
        {hasChildren && !isCollapsed && (
          <motion.span
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight size={16} className="text-white/40" />
          </motion.span>
        )}
      </motion.button>

      {/* Children */}
      <AnimatePresence>
        {hasChildren && isExpanded && !isCollapsed && (
          <motion.div
            className="ml-2 mt-1 space-y-1"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {item.children!.map((child, childIndex) => (
              <NavItemComponent
                key={child.id}
                item={child}
                isActive={false}
                isCollapsed={isCollapsed}
                index={childIndex}
                onSelect={onSelect}
                depth={depth + 1}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const GlassSidebar: React.FC<GlassSidebarProps> = ({
  items = defaultItems,
  activeId = 'home',
  onSelect,
  collapsed = false,
  className = '',
}) => {
  const handleSelect = (id: string) => {
    onSelect?.(id);
  };

  return (
    <motion.aside
      className={`
        h-full flex flex-col
        ${className}
      `}
      style={{
        background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 100%)',
        backdropFilter: 'blur(40px) saturate(180%)',
        borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.3)',
      }}
      variants={sidebarVariants}
      initial={collapsed ? 'collapsed' : 'expanded'}
      animate={collapsed ? 'collapsed' : 'expanded'}
    >
      {/* Logo area */}
      <div className={`flex items-center ${collapsed ? 'justify-center' : 'px-6'} py-6`}>
        <motion.div
          className="flex items-center gap-3"
          layout
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(0, 212, 170, 0.3) 0%, rgba(0, 102, 255, 0.3) 100%)',
              boxShadow: '0 4px 12px rgba(0, 212, 170, 0.2)',
            }}
          >
            <motion.svg
              viewBox="0 0 24 24"
              className="w-5 h-5 text-white"
              fill="currentColor"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </motion.svg>
          </div>

          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <span className="text-lg font-semibold tracking-wider text-gradient-teal">
                  AICO
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Navigation */}
      <nav className={`flex-1 ${collapsed ? 'px-3' : 'px-4'} py-4 space-y-1 overflow-y-auto no-scrollbar`}>
        {items.map((item, index) => (
          <NavItemComponent
            key={item.id}
            item={item}
            isActive={activeId === item.id}
            isCollapsed={collapsed}
            index={index}
            onSelect={handleSelect}
          />
        ))}
      </nav>

      {/* Bottom section */}
      <div className={`${collapsed ? 'px-3' : 'px-4'} py-4`}>
        <div className="mx-auto h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-4" />

        {/* Status indicator */}
        <div
          className={`
            flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-xl
          `}
          style={{
            background: 'rgba(16, 185, 129, 0.1)',
          }}
        >
          <span className="w-2 h-2 rounded-full bg-success-green shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                className="text-sm text-success-green/80"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                All systems online
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
};

export default GlassSidebar;
