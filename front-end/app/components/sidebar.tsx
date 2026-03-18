import React from 'react';
import { Lock, LogIn, LogOut, Shield, User, Video } from 'lucide-react';
import { motion } from 'motion/react';
import { NavLink } from 'react-router';
import { useAuth, type AuthRole } from '../auth/auth-context';
import { motionTransitions } from '../lib/motion-presets';

const navItems = [
  { icon: Video, label: 'Cameras', path: '/' },
  { icon: Lock, label: 'Restritas', path: '/area', requiresAuth: true },
  { icon: Shield, label: 'Administracao', path: '/admin', requiresAuth: true, roles: ['administrador'] as AuthRole[] },
  { icon: User, label: 'Perfil', path: '/perfil', requiresAuth: true },
];

export function Sidebar() {
  const { isAuthenticated, role, user, logout } = useAuth();

  const visibleNavItems = navItems.filter((item) => {
    if (!item.requiresAuth) {
      return true;
    }

    if (!isAuthenticated) {
      return false;
    }

    if (item.roles && !item.roles.includes(role)) {
      return false;
    }

    return true;
  });

  return (
    <aside className="fixed bottom-4 left-4 right-4 z-50 rounded-[28px] border border-white/80 bg-white/95 shadow-[0_6px_10px_rgba(15,23,42,0.14)] backdrop-blur-xl md:bottom-0 md:left-0 md:right-auto md:top-0 md:flex md:w-[100px] md:flex-col md:rounded-none md:border-r md:border-t-0">
      <div className="hidden items-center justify-center border-b border-[#dbe4ee] px-3 py-5 md:flex">
        <div className="flex h-[48px] w-[48px] items-center justify-center rounded-[16px] bg-[#d8eefb]">
          <div className="relative h-[28px] w-[28px] overflow-hidden rounded-full border-[3px] border-[#009fe3]">
            <div className="absolute inset-[20%] translate-x-[20%] translate-y-[16%] rounded-full bg-[#002441]" />
          </div>
        </div>
      </div>

      <nav className="flex items-center justify-between gap-1 p-2 md:flex-1 md:flex-col md:justify-start md:gap-7 md:px-0 md:py-8">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={item.label}
              className={({ isActive }) =>
                `relative flex min-w-0 flex-1 items-center justify-center rounded-[18px] px-2 py-2 transition-all duration-200 md:h-[60px] md:w-[60px] md:flex-none ${
                  isActive ? 'text-white' : 'text-[#93a6bc] hover:text-[#0e93d8]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive ? (
                    <motion.span
                      layoutId="sidebar-active-pill"
                      className="absolute inset-0 rounded-[18px] bg-[#159dde] shadow-[0_6px_10px_rgba(21,157,222,0.28)]"
                      transition={motionTransitions.gentleSpring}
                    />
                  ) : null}
                  <motion.div
                    whileHover={{ scale: 1.03, y: -1 }}
                    whileTap={{ scale: 0.96 }}
                    transition={motionTransitions.pressSpring}
                    className="relative z-10 flex flex-col items-center gap-1"
                  >
                    <Icon size={24} strokeWidth={isActive ? 2.4 : 2} />
                    <span className="text-[10px] font-medium md:hidden">{item.label}</span>
                  </motion.div>
                </>
              )}
            </NavLink>
          );
        })}

        {!isAuthenticated ? (
          <NavLink
            to="/login"
            title="Login"
            className={({ isActive }) =>
              `relative flex min-w-0 flex-1 items-center justify-center rounded-[18px] px-2 py-2 transition-all duration-200 md:hidden ${
                isActive ? 'bg-[#159dde] text-white shadow-[0_6px_10px_rgba(21,157,222,0.28)]' : 'text-[#93a6bc] hover:text-[#0e93d8]'
              }`
            }
          >
            {({ isActive }) => (
              <motion.div whileTap={{ scale: 0.94 }} transition={motionTransitions.pressSpring} className="relative z-10">
                <LogIn size={24} strokeWidth={isActive ? 2.4 : 2} />
              </motion.div>
            )}
          </NavLink>
        ) : (
          <motion.button
            type="button"
            onClick={logout}
            title="Sair"
            aria-label="Sair"
            whileTap={{ scale: 0.94 }}
            transition={motionTransitions.pressSpring}
            className="flex min-w-0 flex-1 items-center justify-center rounded-[18px] px-2 py-2 text-[#93a6bc] transition-all duration-200 hover:text-[#0e93d8] md:hidden"
          >
            <LogOut size={24} />
          </motion.button>
        )}
      </nav>

      <div className="hidden items-center gap-6 px-0 pb-7 md:flex md:flex-col">
        {!isAuthenticated ? (
          <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.96 }} transition={motionTransitions.pressSpring}>
            <NavLink to="/login" title="Login" className="text-[#93a6bc] transition hover:text-[#0e93d8]">
              <LogIn size={28} />
            </NavLink>
          </motion.div>
        ) : (
          <motion.button
            type="button"
            onClick={logout}
            title="Sair"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.96 }}
            transition={motionTransitions.pressSpring}
            className="text-[#93a6bc] transition hover:text-[#0e93d8]"
            aria-label="Sair"
          >
            <LogOut size={28} />
          </motion.button>
        )}

        {isAuthenticated ? (
          <motion.img
            whileHover={{ scale: 1.04 }}
            transition={motionTransitions.pressSpring}
            src={user?.avatar || 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=80&q=80'}
            alt={user?.name || 'Usuario'}
            className="h-[40px] w-[40px] rounded-full border-2 border-white object-cover shadow-[0_4px_10px_rgba(15,23,42,0.12)]"
          />
        ) : null}
      </div>
    </aside>
  );
}
