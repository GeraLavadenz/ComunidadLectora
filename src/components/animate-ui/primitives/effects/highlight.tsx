'use client';

import * as React from 'react';
import { motion, AnimatePresence, type Transition } from 'motion/react';
import { cn } from '@/lib/utils';

interface HighlightProps {
  children: React.ReactNode;
  className?: string;
  enabled?: boolean;
  hover?: boolean;
  controlledItems?: boolean;
  mode?: 'parent' | 'child';
  containerClassName?: string;
  transition?: Transition;
}

interface HighlightItemProps {
  children: React.ReactNode;
  className?: string;
  activeClassName?: string;
}

const HighlightContext = React.createContext<{
  enabled: boolean;
  hover: boolean;
  controlledItems: boolean;
  mode: 'parent' | 'child';
  transition: Transition;
}>({
  enabled: true,
  hover: false,
  controlledItems: false,
  mode: 'parent',
  transition: { type: 'spring', stiffness: 350, damping: 35 },
});

function Highlight({
  children,
  className,
  enabled = true,
  hover = false,
  controlledItems = false,
  mode = 'parent',
  containerClassName,
  transition = { type: 'spring', stiffness: 350, damping: 35 },
  ...props
}: HighlightProps) {
  const contextValue = React.useMemo(
    () => ({
      enabled,
      hover,
      controlledItems,
      mode,
      transition,
    }),
    [enabled, hover, controlledItems, mode, transition],
  );

  return (
    <HighlightContext.Provider value={contextValue}>
      <div
        className={cn('relative', containerClassName)}
        {...props}
      >
        {children}
      </div>
    </HighlightContext.Provider>
  );
}

function HighlightItem({
  children,
  className,
  activeClassName,
  ...props
}: HighlightItemProps) {
  const { enabled, hover, controlledItems, mode, transition } =
    React.useContext(HighlightContext);

  const [isHovered, setIsHovered] = React.useState(false);
  const [isActive, setIsActive] = React.useState(false);

  const handleMouseEnter = React.useCallback(() => {
    if (enabled && hover) {
      setIsHovered(true);
    }
  }, [enabled, hover]);

  const handleMouseLeave = React.useCallback(() => {
    if (enabled && hover) {
      setIsHovered(false);
    }
  }, [enabled, hover]);

  const handleFocus = React.useCallback(() => {
    if (enabled) {
      setIsActive(true);
    }
  }, [enabled]);

  const handleBlur = React.useCallback(() => {
    if (enabled) {
      setIsActive(false);
    }
  }, [enabled]);

  const isHighlighted = isHovered || isActive;

  return (
    <motion.div
      className={cn(
        'relative',
        isHighlighted && activeClassName,
        className,
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      data-highlight={isHighlighted ? 'true' : 'false'}
      animate={{
        scale: isHighlighted ? 1.02 : 1,
      }}
      transition={transition}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export { Highlight, HighlightItem };
