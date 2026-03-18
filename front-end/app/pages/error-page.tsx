import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { isRouteErrorResponse, Link, useRouteError } from 'react-router';
import { SurfacePanel } from '../components/platform/surface-panel';
import { motionTransitions, motionVariants } from '../lib/motion-presets';

function resolveErrorState(error: unknown) {
  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      return {
        title: 'Pagina nao encontrada',
        message: 'A rota solicitada nao existe ou foi movida.',
      };
    }

    return {
      title: `Erro ${error.status}`,
      message: typeof error.data === 'string' ? error.data : 'Nao foi possivel concluir a requisicao.',
    };
  }

  if (error instanceof Error) {
    return {
      title: 'Erro inesperado na aplicacao',
      message: error.message,
    };
  }

  return {
    title: 'Erro inesperado na aplicacao',
    message: 'Ocorreu uma falha nao mapeada. Tente novamente em instantes.',
  };
}

export function ErrorPage() {
  const routeError = useRouteError();
  const { title, message } = resolveErrorState(routeError);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7fbff_0%,#eef3f8_100%)] px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <motion.div variants={motionVariants.fadeUp} initial="initial" animate="animate" transition={motionTransitions.enter}>
          <SurfacePanel className="rounded-[30px] border-[#d8e2ec] p-8 md:p-10">
          <div className="space-y-6">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#e9f4fc] text-[#0e93d8]">
              <AlertTriangle size={22} />
            </div>

            <div>
              <h1 className="text-[30px] font-semibold tracking-[-0.04em] text-[#002a52]">{title}</h1>
              <p className="mt-3 text-[16px] leading-7 text-[#58708e]">{message}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <motion.div whileTap={{ scale: 0.98 }} transition={motionTransitions.pressSpring}>
                <Link
                  to="/"
                  className="inline-flex h-11 items-center justify-center rounded-full bg-[#159dde] px-6 text-sm font-semibold text-white shadow-[0_6px_10px_rgba(21,157,222,0.24)] transition hover:bg-[#0e93d8]"
                >
                  Voltar ao inicio
                </Link>
              </motion.div>
              <motion.div whileTap={{ scale: 0.98 }} transition={motionTransitions.pressSpring}>
                <Link
                  to="/login"
                  className="inline-flex h-11 items-center justify-center rounded-full border border-[#d7e0ea] bg-white px-6 text-sm font-semibold text-[#35506f] transition hover:border-[#bfd3e6]"
                >
                  Ir para login
                </Link>
              </motion.div>
            </div>
          </div>
          </SurfacePanel>
        </motion.div>
      </div>
    </main>
  );
}
