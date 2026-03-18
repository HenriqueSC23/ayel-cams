import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import { SurfacePanel } from '../components/platform/surface-panel';
import { motionTransitions, motionVariants } from '../lib/motion-presets';

export function NotFoundPage() {
  return (
    <section className="min-h-screen bg-[#f4f7fb] px-10 py-10">
      <motion.div variants={motionVariants.fadeUp} initial="initial" animate="animate" transition={motionTransitions.enter}>
        <SurfacePanel className="mx-auto max-w-2xl rounded-[30px] border-[#d8e2ec] p-8 text-center md:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0e93d8]">Erro 404</p>
        <h1 className="mt-3 text-[32px] font-semibold tracking-[-0.04em] text-[#002a52]">Pagina nao encontrada</h1>
        <p className="mt-3 text-[16px] leading-7 text-[#58708e]">A rota solicitada nao existe. Verifique o endereco e tente novamente.</p>

        <div className="mt-7 flex justify-center">
          <motion.div whileTap={{ scale: 0.98 }} transition={motionTransitions.pressSpring}>
            <Link
              to="/"
              className="inline-flex h-11 items-center justify-center rounded-full bg-[#159dde] px-6 text-sm font-semibold text-white shadow-[0_6px_10px_rgba(21,157,222,0.24)] transition hover:bg-[#0e93d8]"
            >
              Voltar para cameras
            </Link>
          </motion.div>
        </div>
        </SurfacePanel>
      </motion.div>
    </section>
  );
}
