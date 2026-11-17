import type { Variants } from 'framer-motion';

/**
 * FaeQuest Motion Design System - AAA Dark Fantasy Animation Standards
 * Optimized for GPU execution (opacity, transform, scale, x, y)
 */

export const EASING_SPRING = [0.22, 1, 0.36, 1] as const;
export const EASING_SHARP = [0.16, 1, 0.3, 1] as const;
export const EASING_BOUNCE = [0.34, 1.56, 0.64, 1] as const;

export const TRANSITION_FAST = {
  duration: 0.2,
  ease: EASING_SPRING,
};

export const TRANSITION_NORMAL = {
  duration: 0.28,
  ease: EASING_SPRING,
};

export const TRANSITION_SPRING = {
  type: 'spring',
  stiffness: 380,
  damping: 30,
};

export const TRANSITION_BOUNCE = {
  type: 'spring',
  stiffness: 500,
  damping: 25,
};

// Page transition variants for AnimatePresence mode="wait"
export const PAGE_VARIANTS: Variants = {
  initial: {
    opacity: 0,
    y: 12,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.25,
      ease: EASING_SPRING,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.15,
      ease: EASING_SHARP,
    },
  },
};

// Modal dialog backdrop & panel variants
export const MODAL_BACKDROP_VARIANTS: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.15, ease: 'easeIn' } },
};

export const MODAL_PANEL_VARIANTS: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.94,
    y: 12,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.28,
      ease: EASING_SPRING,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 8,
    transition: {
      duration: 0.18,
      ease: EASING_SHARP,
    },
  },
};

// Staggered list container
export const STAGGER_CONTAINER = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.02,
    },
  },
};

// Item in staggered list
export const STAGGER_ITEM = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.25,
      ease: EASING_SPRING,
    },
  },
};

