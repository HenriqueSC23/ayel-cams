import React from 'react';
import { AlertTriangle, CheckCircle2, LoaderCircle } from 'lucide-react';
import { SurfacePanel } from './surface-panel';

interface RequestStatePanelProps {
  title: string;
  description: string;
  isLoading?: boolean;
  state?: 'idle' | 'loading' | 'success' | 'warning' | 'error';
  onRetry?: () => void;
  className?: string;
}

export function RequestStatePanel({ title, description, isLoading = false, state, onRetry, className }: RequestStatePanelProps) {
  const resolvedState = state ?? (isLoading ? 'loading' : 'error');
  const isLoadingState = resolvedState === 'loading';
  const isSuccessState = resolvedState === 'success';
  const isWarningState = resolvedState === 'warning';

  return (
    <SurfacePanel className={className ?? 'motion-fade-up rounded-[24px] border-[#d8e2ec] p-6'}>
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-full ${
              isSuccessState
                ? 'bg-emerald-100 text-emerald-600'
                : isWarningState
                  ? 'bg-amber-100 text-amber-600'
                  : 'bg-[#eef5fc] text-[#0e93d8]'
            }`}
          >
            {isLoadingState ? <LoaderCircle size={17} className="motion-spin-soft" /> : null}
            {isSuccessState ? <CheckCircle2 size={17} /> : null}
            {!isLoadingState && !isSuccessState ? <AlertTriangle size={17} /> : null}
          </div>
          <div>
            <h3 className="text-[17px] font-semibold text-[#002a52]">{title}</h3>
            <p className="mt-1 text-sm text-[#58708e]">{description}</p>
          </div>
        </div>

        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex h-10 items-center justify-center rounded-full border border-[#d7e0ea] bg-white px-4 text-sm font-semibold text-[#35506f] transition hover:border-[#bfd3e6]"
          >
            Tentar novamente
          </button>
        ) : null}
      </div>
    </SurfacePanel>
  );
}
