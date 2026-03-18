import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Outlet, useLocation } from 'react-router';
import { Sidebar } from '../components/sidebar';
import { motionTransitions, motionVariants } from '../lib/motion-presets';

export function MainLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7fbff_0%,#eef3f8_100%)] font-['Inter',sans-serif] text-slate-900 selection:bg-[color:var(--ayel-cyan-soft)] selection:text-[color:var(--ayel-ink)]">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col pb-24 md:ml-[100px] md:pb-0">
        <main className="flex-1 overflow-x-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`${location.pathname}${location.search}`}
              variants={motionVariants.fade}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={motionTransitions.enter}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
