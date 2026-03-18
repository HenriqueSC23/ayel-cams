import React, { useMemo, useState } from 'react';
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '../auth/auth-context';
import { PillBadge } from '../components/platform/pill-badge';
import { SurfacePanel } from '../components/platform/surface-panel';
import { motionTransitions, motionVariants } from '../lib/motion-presets';

export function Login() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isSignupMode = searchParams.get('mode') === 'signup';
  const returnTo = searchParams.get('returnTo');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [rememberSession, setRememberSession] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const modeLinks = useMemo(() => {
    const buildHref = (mode: 'signin' | 'signup') => {
      const params = new URLSearchParams();

      if (mode === 'signup') {
        params.set('mode', 'signup');
      }

      if (returnTo && returnTo.startsWith('/')) {
        params.set('returnTo', returnTo);
      }

      const query = params.toString();
      return query.length ? `/login?${query}` : '/login';
    };

    return {
      signin: buildHref('signin'),
      signup: buildHref('signup'),
    };
  }, [returnTo]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedName = fullName.trim();
    const normalizedEmail = email.trim();
    const normalizedPassword = password.trim();
    const normalizedConfirmPassword = confirmPassword.trim();

    if (isSignupMode && !normalizedName) {
      setErrorMessage('Informe seu nome completo para criar o cadastro.');
      return;
    }

    if (!normalizedEmail || !normalizedPassword) {
      setErrorMessage(isSignupMode ? 'Preencha e-mail e senha para criar o cadastro.' : 'Informe e-mail e senha para continuar.');
      return;
    }

    if (isSignupMode && normalizedPassword.length < 6) {
      setErrorMessage('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (isSignupMode && normalizedPassword !== normalizedConfirmPassword) {
      setErrorMessage('As senhas nao conferem.');
      return;
    }

    if (isSignupMode && !termsAccepted) {
      setErrorMessage('Voce precisa aceitar os termos para concluir o cadastro.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const role = isSignupMode
        ? await signUp({
            fullName: normalizedName,
            email: normalizedEmail,
            password: normalizedPassword,
          })
        : await signIn({
            email: normalizedEmail,
            password: normalizedPassword,
            rememberSession,
          });

      if (returnTo && returnTo.startsWith('/')) {
        navigate(returnTo, { replace: true });
        return;
      }

      navigate(role === 'administrador' ? '/admin' : '/area', { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao autenticar.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f5f9fd_0%,#edf3f8_100%)] px-4 py-6 md:px-8 md:py-8">
      <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:linear-gradient(rgba(151,167,186,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(151,167,186,0.16)_1px,transparent_1px)] [background-size:44px_44px]" />
      <div className="absolute left-[-8rem] top-[-6rem] h-72 w-72 rounded-full bg-[color:var(--ayel-cyan-soft)] blur-3xl" />
      <div className="absolute bottom-[-8rem] right-[-6rem] h-96 w-96 rounded-full bg-[color:var(--ayel-ink)]/10 blur-3xl" />

      <SurfacePanel className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-[1260px] overflow-hidden rounded-[34px] border-white/70 bg-white/90 p-0">
        <section className="relative hidden w-[46%] overflow-hidden border-r border-white/20 lg:flex">
          <img
            src="https://images.unsplash.com/photo-1706476746683-1222454323f7?auto=format&fit=crop&w=1400&q=80"
            alt="Monitoramento patrimonial Ayel"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(168deg,rgba(0,36,65,0.36)_0%,rgba(0,36,65,0.75)_64%,rgba(0,36,65,0.92)_100%)]" />
          <div className="absolute inset-0 flex flex-col justify-between p-8 xl:p-10">
            <div className="space-y-5">
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/15"
              >
                <ArrowLeft size={16} />
                Voltar para cameras publicas
              </Link>
            </div>

            <div className="space-y-6">
              <PillBadge className="border-white/20 bg-white/10 text-white" icon={<ShieldCheck size={11} />}>
                Acesso autorizado Ayel
              </PillBadge>
              <h1 className="max-w-md text-4xl font-semibold tracking-[-0.045em] text-white xl:text-[44px]">
                Controle de acesso para monitoramento corporativo
              </h1>
              <p className="max-w-lg text-[15px] leading-7 text-white/80">
                A plataforma da Ayel conecta visualizacao de cameras publicas e restritas em um ambiente unico, seguro e pronto para operacao real.
              </p>
              <div className="rounded-3xl border border-white/20 bg-white/10 p-5 backdrop-blur-md">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">Plataforma separada do site institucional</p>
                <p className="mt-2 text-sm leading-6 text-white/80">
                  O acesso logado e restrito permanece em subdominio proprio para garantir clareza operacional e evolucao segura do produto.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex w-full flex-1 items-start justify-center px-5 py-8 md:px-8 lg:px-10 xl:px-12">
          <div className="w-full max-w-[520px] space-y-6 pt-2 md:pt-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-[color:var(--ayel-border)] bg-white px-4 py-2 text-sm font-medium text-[color:var(--ayel-ink)] transition hover:border-[color:var(--ayel-cyan)]/40 hover:text-[color:var(--ayel-cyan-deep)] lg:hidden"
            >
              <ArrowLeft size={16} />
              Voltar para cameras publicas
            </Link>

            <div className="flex items-center justify-between">
              <PillBadge tone="ink" icon={<LockKeyhole size={11} />}>
                {isSignupMode ? 'Cadastro interno' : 'Autenticacao'}
              </PillBadge>

              <div className="inline-flex w-fit items-center rounded-full border border-[color:var(--ayel-border)] bg-[color:var(--ayel-surface)] p-1">
                <Link
                  to={modeLinks.signin}
                  className={`relative inline-flex h-9 items-center justify-center rounded-full px-4 text-center text-sm font-semibold transition-colors duration-300 ${
                    !isSignupMode ? 'text-white' : 'text-slate-500 hover:text-[color:var(--ayel-ink)]'
                  }`}
                >
                  {!isSignupMode ? (
                    <motion.span
                      layoutId="authModeIndicator"
                      className="absolute inset-0 rounded-full bg-[color:var(--ayel-cyan)] shadow-[0_6px_10px_rgba(0,159,227,0.28)]"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.45 }}
                    />
                  ) : null}
                  <span className="relative z-10">Login</span>
                </Link>

                <Link
                  to={modeLinks.signup}
                  className={`relative inline-flex h-9 items-center justify-center rounded-full px-4 text-center text-sm font-semibold transition-colors duration-300 ${
                    isSignupMode ? 'text-white' : 'text-slate-500 hover:text-[color:var(--ayel-ink)]'
                  }`}
                >
                  {isSignupMode ? (
                    <motion.span
                      layoutId="authModeIndicator"
                      className="absolute inset-0 rounded-full bg-[color:var(--ayel-cyan)] shadow-[0_6px_10px_rgba(0,159,227,0.28)]"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.45 }}
                    />
                  ) : null}
                  <span className="relative z-10">Cadastro</span>
                </Link>
              </div>
            </div>

            <motion.div key={isSignupMode ? 'signup-mode-head' : 'signin-mode-head'} className="space-y-2" variants={motionVariants.fadeUp} initial="initial" animate="animate" transition={motionTransitions.enter}>
              <h2 className="text-4xl font-semibold tracking-[-0.045em] text-[color:var(--ayel-ink)]">
                {isSignupMode ? 'Criar conta de acesso' : 'Bem-vindo de volta'}
              </h2>
              <p className="text-[15px] leading-7 text-slate-500">
                {isSignupMode
                  ? 'Cadastre sua conta para acessar as cameras restritas da plataforma.'
                  : 'Entre com suas credenciais para visualizar a area protegida da Ayel.'}
              </p>
            </motion.div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <AnimatePresence initial={false}>
                {isSignupMode ? (
                  <motion.div
                    key="signup-full-name"
                    variants={motionVariants.fadeUp}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={motionTransitions.enter}
                    className="space-y-2"
                  >
                    <label htmlFor="full-name" className="text-sm font-medium text-[color:var(--ayel-ink)]">
                      Nome completo
                    </label>
                    <div className="relative">
                      <UserRound className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
                      <input
                        id="full-name"
                        type="text"
                        placeholder="Seu nome completo"
                        value={fullName}
                        onChange={(event) => setFullName(event.target.value)}
                        className="h-12 w-full rounded-2xl border border-[color:var(--ayel-border)] bg-[color:var(--ayel-surface)] pl-12 pr-4 text-[15px] text-[color:var(--ayel-ink)] outline-none transition focus:border-[color:var(--ayel-cyan)] focus:bg-white focus:ring-4 focus:ring-[color:var(--ayel-cyan-soft)]"
                      />
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-[color:var(--ayel-ink)]">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    placeholder="voce@empresa.com.br"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-12 w-full rounded-2xl border border-[color:var(--ayel-border)] bg-[color:var(--ayel-surface)] pl-12 pr-4 text-[15px] text-[color:var(--ayel-ink)] outline-none transition focus:border-[color:var(--ayel-cyan)] focus:bg-white focus:ring-4 focus:ring-[color:var(--ayel-cyan-soft)]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="password" className="text-sm font-medium text-[color:var(--ayel-ink)]">
                    Senha
                  </label>
                  {!isSignupMode ? (
                    <button type="button" className="text-sm font-medium text-[color:var(--ayel-cyan-deep)] transition hover:text-[color:var(--ayel-cyan)]">
                      Esqueci minha senha
                    </button>
                  ) : null}
                </div>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
                  <input
                    id="password"
                    type={isPasswordVisible ? 'text' : 'password'}
                    placeholder={isSignupMode ? 'Crie uma senha' : 'Digite sua senha'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-12 w-full rounded-2xl border border-[color:var(--ayel-border)] bg-[color:var(--ayel-surface)] pl-12 pr-12 text-[15px] text-[color:var(--ayel-ink)] outline-none transition focus:border-[color:var(--ayel-cyan)] focus:bg-white focus:ring-4 focus:ring-[color:var(--ayel-cyan-soft)]"
                  />
                  <button
                    type="button"
                    onClick={() => setIsPasswordVisible((value) => !value)}
                    className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                    aria-label={isPasswordVisible ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {isPasswordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <AnimatePresence initial={false}>
                {isSignupMode ? (
                  <motion.div
                    key="signup-confirm-password"
                    variants={motionVariants.fadeUp}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={motionTransitions.enter}
                    className="space-y-2"
                  >
                    <label htmlFor="confirm-password" className="text-sm font-medium text-[color:var(--ayel-ink)]">
                      Confirmar senha
                    </label>
                    <div className="relative">
                      <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
                      <input
                        id="confirm-password"
                        type={isConfirmPasswordVisible ? 'text' : 'password'}
                        placeholder="Repita sua senha"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        className="h-12 w-full rounded-2xl border border-[color:var(--ayel-border)] bg-[color:var(--ayel-surface)] pl-12 pr-12 text-[15px] text-[color:var(--ayel-ink)] outline-none transition focus:border-[color:var(--ayel-cyan)] focus:bg-white focus:ring-4 focus:ring-[color:var(--ayel-cyan-soft)]"
                      />
                      <button
                        type="button"
                        onClick={() => setIsConfirmPasswordVisible((value) => !value)}
                        className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                        aria-label={isConfirmPasswordVisible ? 'Ocultar confirmacao de senha' : 'Mostrar confirmacao de senha'}
                      >
                        {isConfirmPasswordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <div className="flex items-start gap-3 rounded-2xl border border-[color:var(--ayel-border)] bg-[color:var(--ayel-surface)] px-4 py-3">
                <input
                  id="terms"
                  type="checkbox"
                  checked={isSignupMode ? termsAccepted : rememberSession}
                  onChange={(event) => {
                    if (isSignupMode) {
                      setTermsAccepted(event.target.checked);
                      return;
                    }

                    setRememberSession(event.target.checked);
                  }}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-[color:var(--ayel-cyan)] focus:ring-[color:var(--ayel-cyan-soft)]"
                />
                <label htmlFor="terms" className="text-sm leading-6 text-slate-500">
                  {isSignupMode
                    ? 'Aceito os termos de uso e autorizo o cadastro da minha conta na plataforma.'
                    : 'Manter sessao neste dispositivo corporativo.'}
                </label>
              </div>

              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileTap={{ scale: 0.98 }}
                transition={motionTransitions.pressSpring}
                className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[linear-gradient(120deg,#009FE3_0%,#0087C4_100%)] text-sm font-semibold text-white shadow-[0_6px_10px_rgba(0,159,227,0.25)] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? 'Processando...' : isSignupMode ? 'Cadastrar e entrar' : 'Entrar na plataforma'}
              </motion.button>

              <AnimatePresence initial={false}>
                {errorMessage ? (
                  <motion.div
                    key="auth-error"
                    variants={motionVariants.fadeUp}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={motionTransitions.quick}
                    className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600"
                  >
                    {errorMessage}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </form>

          </div>
        </section>
      </SurfacePanel>
    </main>
  );
}
