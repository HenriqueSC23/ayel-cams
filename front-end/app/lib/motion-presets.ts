import type { Transition, Variants } from 'motion/react';

export const motionTokens = {
  duration: {
    xs: 0.14,
    sm: 0.18,
    md: 0.24,
    lg: 0.34,
  },
  ease: {
    standard: [0.2, 0.82, 0.2, 1] as [number, number, number, number],
    exit: [0.32, 0, 0.67, 0] as [number, number, number, number],
  },
  spring: {
    gentle: { type: 'spring', stiffness: 260, damping: 26, mass: 0.9 } as const,
    modal: { type: 'spring', stiffness: 240, damping: 30, mass: 0.95 } as const,
    press: { type: 'spring', stiffness: 520, damping: 30, mass: 0.7 } as const,
  },
  stagger: {
    item: 0.04,
    group: 0.06,
  },
  offset: {
    sm: 8,
    md: 14,
    lg: 20,
  },
} as const;

export const motionTransitions = {
  quick: {
    duration: motionTokens.duration.sm,
    ease: motionTokens.ease.standard,
  } as Transition,
  enter: {
    duration: motionTokens.duration.md,
    ease: motionTokens.ease.standard,
  } as Transition,
  exit: {
    duration: motionTokens.duration.xs,
    ease: motionTokens.ease.exit,
  } as Transition,
  gentleSpring: motionTokens.spring.gentle as Transition,
  modalSpring: motionTokens.spring.modal as Transition,
  pressSpring: motionTokens.spring.press as Transition,
};

export const motionVariants = {
  page: {
    initial: { opacity: 0, y: motionTokens.offset.md },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -motionTokens.offset.sm },
  } as Variants,
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  } as Variants,
  fadeUp: {
    initial: { opacity: 0, y: motionTokens.offset.sm },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -motionTokens.offset.sm },
  } as Variants,
  listItem: {
    initial: { opacity: 0, y: motionTokens.offset.sm },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -motionTokens.offset.sm },
  } as Variants,
  overlay: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  } as Variants,
  drawer: {
    initial: { x: '100%' },
    animate: { x: 0 },
    exit: { x: '100%' },
  } as Variants,
};

export function createStaggerContainer(options?: { staggerChildren?: number; delayChildren?: number }): Variants {
  const staggerChildren = options?.staggerChildren ?? motionTokens.stagger.group;
  const delayChildren = options?.delayChildren ?? 0;

  return {
    initial: {},
    animate: {
      transition: {
        staggerChildren,
        delayChildren,
      },
    },
    exit: {
      transition: {
        staggerChildren: motionTokens.stagger.item,
        staggerDirection: -1,
      },
    },
  };
}
