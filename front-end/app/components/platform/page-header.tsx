import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Grid2X2, LayoutList, LogOut, RefreshCw, Search } from 'lucide-react';
import { Link } from 'react-router';
import { cn } from '../ui/utils';
import type { ViewMode } from '../../data/platform';
import { motionTransitions } from '../../lib/motion-presets';

interface HeaderAction {
  label: string;
  onClick?: () => void;
  href?: string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  actions?: HeaderAction[];
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  showViewToggle?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onLogout?: () => void;
  searchWidthClass?: string;
  className?: string;
  sticky?: boolean;
  showSystemActions?: boolean;
}

export function PageHeader({
  title,
  subtitle,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  actions = [],
  viewMode = 'grid',
  onViewModeChange,
  showViewToggle = false,
  onRefresh,
  isRefreshing = false,
  onLogout,
  searchWidthClass = 'max-w-[750px]',
  className,
  sticky = true,
  showSystemActions = true,
}: PageHeaderProps) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const shouldShowDivider = showSystemActions && (showViewToggle || actions.length > 0 || Boolean(onRefresh));

  return (
    <>
      {sticky ? <div className="h-[94px]" aria-hidden="true" /> : null}
      <header
        className={cn(
          'flex h-[94px] items-center gap-8 border-b border-[#dbe4ee] bg-white px-10',
          sticky && 'fixed left-0 right-0 top-0 z-40 md:left-[100px]',
          className,
        )}
      >
        <div className="min-w-[220px]">
          <h1 className="text-[28px] font-semibold tracking-[-0.04em] text-[#002a52]">{title}</h1>
          {subtitle ? <p className="mt-1 text-[15px] font-medium text-[#58708e]">{subtitle}</p> : null}
        </div>

        <div className="flex flex-1 justify-center">
          <motion.label
            className={cn('relative w-full', searchWidthClass)}
            animate={isSearchFocused ? { scale: 1.003, y: -1 } : { scale: 1, y: 0 }}
            transition={motionTransitions.quick}
          >
            <Search className="pointer-events-none absolute left-6 top-1/2 h-6 w-6 -translate-y-1/2 text-[#8ea3bc]" />
            <input
              type="search"
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="h-[54px] w-full rounded-full border border-[#d7e0ea] bg-[#f8fafc] pl-14 pr-6 text-[17px] font-medium text-[#35506f] outline-none transition focus:border-[#009fe3] focus:bg-white focus:ring-4 focus:ring-[#d8eefb]"
            />
          </motion.label>
        </div>

        <div className="ml-auto flex items-center gap-5">
          {showViewToggle ? (
            <div className="flex items-center rounded-full border border-[#d7e0ea] bg-[#f8fafc] p-1.5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
              <motion.button
                type="button"
                onClick={() => onViewModeChange?.('grid')}
                whileTap={{ scale: 0.96 }}
                transition={motionTransitions.pressSpring}
                className={cn(
                  'relative flex h-[46px] w-[46px] items-center justify-center rounded-full transition',
                  viewMode === 'grid' ? 'text-[#0e93d8]' : 'text-[#8ea3bc]',
                )}
                aria-label="Visualizacao em grade"
              >
                {viewMode === 'grid' ? (
                  <motion.span
                    layoutId="header-view-mode"
                    className="absolute inset-0 rounded-full bg-white shadow-[0_2px_8px_rgba(15,23,42,0.06)]"
                    transition={motionTransitions.gentleSpring}
                  />
                ) : null}
                <Grid2X2 size={20} className="relative z-10" />
              </motion.button>
              <motion.button
                type="button"
                onClick={() => onViewModeChange?.('list')}
                whileTap={{ scale: 0.96 }}
                transition={motionTransitions.pressSpring}
                className={cn(
                  'relative flex h-[46px] w-[46px] items-center justify-center rounded-full transition',
                  viewMode === 'list' ? 'text-[#0e93d8]' : 'text-[#8ea3bc]',
                )}
                aria-label="Visualizacao em lista"
              >
                {viewMode === 'list' ? (
                  <motion.span
                    layoutId="header-view-mode"
                    className="absolute inset-0 rounded-full bg-white shadow-[0_2px_8px_rgba(15,23,42,0.06)]"
                    transition={motionTransitions.gentleSpring}
                  />
                ) : null}
                <LayoutList size={20} className="relative z-10" />
              </motion.button>
            </div>
          ) : null}

        {actions.map((action) => {
          const classes = cn(
            'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition',
            action.variant === 'secondary'
              ? 'h-[54px] border border-[#d7e0ea] bg-[#f8fafc] px-6 text-[16px] text-[#35506f] hover:border-[#bfd3e6]'
              : 'h-[56px] bg-[#159dde] px-8 text-[16px] text-white shadow-[0_6px_10px_rgba(21,157,222,0.24)] hover:bg-[#0e93d8]',
          );

          return action.href ? (
            <motion.div key={action.label} whileTap={{ scale: 0.98 }} transition={motionTransitions.pressSpring}>
              <Link to={action.href} className={classes}>
                {action.icon}
                <span>{action.label}</span>
              </Link>
            </motion.div>
          ) : (
            <motion.button
              key={action.label}
              type="button"
              onClick={action.onClick}
              whileTap={{ scale: 0.98 }}
              transition={motionTransitions.pressSpring}
              className={classes}
            >
              {action.icon}
              <span>{action.label}</span>
            </motion.button>
          );
        })}

        {shouldShowDivider ? <div className="h-8 w-px bg-[#dbe4ee]" /> : null}

        {showSystemActions && onRefresh ? (
          <div className="flex items-center gap-2">
            <motion.button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              whileTap={{ scale: 0.95 }}
              transition={motionTransitions.pressSpring}
              className={cn(
                'inline-flex h-10 w-10 items-center justify-center rounded-full text-[#8ea3bc] transition hover:bg-[#f2f7fc] hover:text-[#0e93d8] disabled:cursor-not-allowed disabled:opacity-80',
                isRefreshing && 'bg-[#e9f4fc] text-[#0e93d8]',
              )}
              aria-label={isRefreshing ? 'Atualizando listagem' : 'Atualizar listagem'}
            >
              <RefreshCw size={22} className={cn(isRefreshing && 'motion-spin-soft')} />
            </motion.button>
            <AnimatePresence initial={false}>
              {isRefreshing ? (
                <motion.span
                  key="refresh-label"
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={motionTransitions.quick}
                  className="text-xs font-semibold text-[#0e93d8]"
                >
                  Atualizando...
                </motion.span>
              ) : null}
            </AnimatePresence>
          </div>
        ) : null}

        {showSystemActions && onLogout ? (
          <motion.button
            type="button"
            onClick={onLogout}
            whileTap={{ scale: 0.95 }}
            transition={motionTransitions.pressSpring}
            className="text-[#8ea3bc] transition hover:text-[#0e93d8]"
            aria-label="Encerrar sessao"
          >
            <LogOut size={22} />
          </motion.button>
        ) : null}

          {showSystemActions ? (
            <motion.img
              whileHover={{ scale: 1.03 }}
              transition={motionTransitions.pressSpring}
              src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=120&q=80"
              alt="Usuario"
              className="h-[46px] w-[46px] rounded-full border-2 border-white object-cover shadow-[0_4px_10px_rgba(15,23,42,0.12)]"
            />
          ) : null}
        </div>
      </header>
    </>
  );
}
