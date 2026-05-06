import {
  ArrowRight,
  Bot,
  Check,
  ChevronDown,
  Download,
  Github,
  Globe,
  KeyRound,
  Lock,
  Monitor,
  ShieldCheck,
  Sparkles,
  Store,
  Video,
  Zap,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { env } from '@/lib/env';

import { LumeMark } from './lume-mark';

const PANEL_URL = 'https://app.lumeapp.es/login';
const GITHUB_URL = 'https://github.com/bgaiola/lume';

interface PricingPlan {
  name: string;
  price: string;
  priceSuffix?: string;
  tagline: string;
  highlight?: boolean;
  cta: string;
  features: { label: string; included: boolean; soon?: boolean }[];
}

const PLANS: PricingPlan[] = [
  {
    name: 'Free',
    price: '0€',
    priceSuffix: 'siempre',
    tagline: 'Para probarlo en serio antes de pagar.',
    cta: 'Empezar gratis',
    features: [
      { label: '1 técnico', included: true },
      { label: '5 sesiones / mes', included: true },
      { label: 'Sin instalación para tu cliente', included: true },
      { label: 'Apps de escritorio Mac, Windows, Linux', included: true },
      { label: 'Cifrado WebRTC + TURN', included: true },
      { label: 'Grabación de sesiones', included: false },
      { label: 'Copilot IA', included: false, soon: true },
    ],
  },
  {
    name: 'Pro',
    price: '9€',
    priceSuffix: '/usuario/mes',
    tagline: 'Para el técnico que vive en sesiones remotas.',
    highlight: true,
    cta: 'Probar 14 días gratis',
    features: [
      { label: 'Sesiones ilimitadas', included: true },
      { label: 'Grabación local + cloud', included: true },
      { label: 'Multimonitor + transferencia de archivos', included: true },
      { label: 'Anotaciones sobre la pantalla', included: true },
      { label: 'Historial e informe por sesión', included: true },
      { label: 'Soporte prioritario por email', included: true },
    ],
  },
  {
    name: 'Team',
    price: '19€',
    priceSuffix: '/usuario/mes',
    tagline: 'Para equipos que quieren delegar trabajo en la IA.',
    cta: 'Hablar con ventas',
    features: [
      { label: 'Todo lo de Pro', included: true },
      { label: 'Copilot IA durante la sesión', included: true, soon: true },
      { label: 'Marketplace de automatizaciones', included: true, soon: true },
      { label: 'Roles y permisos por equipo', included: true, soon: true },
      { label: 'SSO (Google, Microsoft)', included: true, soon: true },
      { label: 'SLA 99.9% + soporte 24/7', included: true, soon: true },
    ],
  },
];

interface FaqItem {
  q: string;
  a: ReactNode;
}

const FAQ: FaqItem[] = [
  {
    q: '¿Mi cliente tiene que instalar algo?',
    a: 'No. Le mandas un enlace tipo lumeapp.es/abc123, lo abre en su navegador y comparte la pantalla con un click. Funciona en Chrome, Edge, Firefox y Safari.',
  },
  {
    q: '¿En qué sistemas funciona la app del técnico?',
    a: 'macOS Apple Silicon (M1, M2, M3, M4), Windows 10 y 11 de 64 bits, y Linux como AppImage. macOS Intel llegará en una release próxima.',
  },
  {
    q: '¿Cómo se conecta? ¿Hay que abrir puertos?',
    a: 'No. Lume usa WebRTC sobre Cloudflare Calls TURN, así que el cliente y el técnico se conectan punto a punto cuando es posible y por TURN cuando no. Sin tocar firewall.',
  },
  {
    q: '¿Las sesiones están cifradas?',
    a: 'Sí, extremo a extremo con DTLS-SRTP, el mismo cifrado que usa Google Meet. La señalización va sobre HTTPS y los tokens son JWT cortos.',
  },
  {
    q: '¿Puedo ver el código?',
    a: (
      <>
        Sí, todo el monorepo es público en{' '}
        <a className="text-lime hover:underline" href={GITHUB_URL} target="_blank" rel="noreferrer">
          github.com/bgaiola/lume
        </a>
        .
      </>
    ),
  },
  {
    q: '¿Cómo cancelo?',
    a: 'Desde el panel, un click. Sin permanencia, sin penalizaciones. Si pagaste anual te devolvemos los meses no usados.',
  },
];

export function LandingPage(): JSX.Element {
  return (
    <main className="relative min-h-screen overflow-hidden bg-surface-deep text-ink-primary">
      <Header />
      <Hero />
      <TrustStrip />
      <Problem />
      <Features />
      <HowItWorks />
      <Pricing />
      <Faq />
      <FinalCta />
      <Footer />
    </main>
  );
}

function Header(): JSX.Element {
  return (
    <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
      <a href="/" className="flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-[28%] bg-lime shadow-glow-lime" aria-hidden />
        <span className="font-display text-2xl italic leading-none">Lume</span>
      </a>
      <nav className="hidden items-center gap-7 text-sm text-ink-secondary md:flex">
        <a className="transition-colors hover:text-ink-primary" href="#features">
          Producto
        </a>
        <a className="transition-colors hover:text-ink-primary" href="#precios">
          Precios
        </a>
        <a className="transition-colors hover:text-ink-primary" href="#faq">
          FAQ
        </a>
        <a
          className="flex items-center gap-1.5 transition-colors hover:text-ink-primary"
          href={GITHUB_URL}
          target="_blank"
          rel="noreferrer"
        >
          <Github className="h-3.5 w-3.5" aria-hidden />
          Código
        </a>
      </nav>
      <div className="flex items-center gap-3">
        <a
          className="hidden text-sm text-ink-secondary transition-colors hover:text-ink-primary sm:inline"
          href={PANEL_URL}
        >
          Iniciar sesión
        </a>
        <a
          href={PANEL_URL}
          className="inline-flex items-center gap-1.5 rounded-lg bg-lime px-3.5 py-2 text-sm font-semibold text-surface-deep shadow-glow-lime transition-transform hover:scale-[1.02] active:scale-[0.99]"
        >
          Probar gratis
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </a>
      </div>
    </header>
  );
}

function Hero(): JSX.Element {
  return (
    <section className="relative mx-auto w-full max-w-6xl px-6 pb-16 pt-12 lg:pb-28 lg:pt-20">
      <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col gap-7">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-line bg-surface-base px-3 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-lime">
            <span className="h-1.5 w-1.5 rounded-full bg-lime shadow-[0_0_8px_#b9ff66] animate-pulse-soft" aria-hidden />
            Lume v0.1 · ya disponible
          </span>
          <h1 className="font-display text-5xl italic leading-[1.05] sm:text-6xl lg:text-7xl">
            Acceso remoto premium,
            <br />
            <span className="text-lime">sin pedirle a tu cliente que instale nada.</span>
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-ink-secondary sm:text-lg">
            Lume es una alternativa moderna a TeamViewer y AnyDesk. Tu cliente abre un enlace en
            el navegador, comparte la pantalla, y tú entras desde una app nativa para Mac, Windows
            o Linux. WebRTC cifrado, TURN global de Cloudflare y un Copilot IA{' '}
            <span className="text-warm">en camino</span>.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href={PANEL_URL}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-lime px-6 py-3.5 text-sm font-semibold text-surface-deep shadow-glow-lime-strong transition-transform hover:scale-[1.02] active:scale-[0.99]"
            >
              Probar gratis
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
            <a
              href="#descargas"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-surface-base px-6 py-3.5 text-sm font-semibold text-ink-primary transition-colors hover:border-line-bright hover:bg-surface-hover"
            >
              <Download className="h-4 w-4" aria-hidden />
              Descargar la app
            </a>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink-tertiary">
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-lime" aria-hidden />
              Sin tarjeta para empezar
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-lime" aria-hidden />
              Cancela en un click
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-lime" aria-hidden />
              Código abierto en GitHub
            </span>
          </div>
        </div>
        <HeroPanel />
      </div>
    </section>
  );
}

function HeroPanel(): JSX.Element {
  return (
    <div className="relative">
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-lime/15 via-transparent to-blue/10 blur-2xl" aria-hidden />
      <div className="relative overflow-hidden rounded-2xl border border-line bg-surface-base shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-between border-b border-line bg-surface-elev px-4 py-2.5">
          <div className="flex items-center gap-2.5 text-xs text-ink-secondary">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" aria-hidden />
              <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" aria-hidden />
              <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" aria-hidden />
            </div>
            <span>María S. · Windows 11</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[10px] text-ink-tertiary">
            <span>1920×1080</span>
            <span className="flex items-center gap-1 text-lime">
              <Zap className="h-2.5 w-2.5" aria-hidden />
              42ms
            </span>
            <span>P2P</span>
          </div>
        </div>
        <div className="relative aspect-[16/10] bg-gradient-to-br from-[#1a1f1d] via-surface-base to-[#15211e] p-5">
          <div className="absolute left-6 top-6 right-32 rounded-lg bg-[#f5f3ee] shadow-2xl">
            <div className="flex items-center gap-2 border-b border-[#d4cec1] bg-[#e8e4dd] px-3 py-2">
              <div className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-[#ff5f56]" />
                <span className="h-2 w-2 rounded-full bg-[#ffbd2e]" />
                <span className="h-2 w-2 rounded-full bg-[#27c93f]" />
              </div>
              <span className="text-[10px] text-[#5a5550]">Panel de admin · error 500</span>
            </div>
            <div className="space-y-2 p-3">
              <p className="text-xs font-medium text-[#1a1815]">Error de conexión con la base de datos</p>
              <div className="rounded-md border border-[#f5c6c6] bg-[#fdeaea] p-2 text-[10px] text-[#b34040]">
                <div className="font-mono font-semibold text-[#8a2828]">SequelizeConnectionError</div>
                connect ECONNREFUSED 127.0.0.1:5432
              </div>
              <p className="text-[10px] text-[#5a5550]">El servicio PostgreSQL no responde.</p>
            </div>
          </div>
          <div className="absolute right-5 top-5 w-56 rounded-lg border border-lime/40 bg-surface-base/95 p-3 shadow-glow-lime backdrop-blur">
            <div className="mb-1.5 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-lime" aria-hidden />
              <span className="font-mono text-[9px] uppercase tracking-wide text-lime">
                Copilot detecta
              </span>
            </div>
            <p className="text-[11px] leading-snug text-ink-primary">
              PostgreSQL parado hace 12 min. Sugiero ejecutar la automatización{' '}
              <span className="font-medium text-lime">Reiniciar PG</span>.
            </p>
            <div className="mt-2 flex gap-1.5">
              <span className="flex-1 rounded bg-lime px-2 py-1 text-center text-[9px] font-semibold text-surface-deep">
                Ejecutar
              </span>
              <span className="flex-1 rounded border border-line px-2 py-1 text-center text-[9px] text-ink-secondary">
                Más tarde
              </span>
            </div>
          </div>
          <div className="absolute bottom-5 right-5 flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-2.5 py-1 font-mono text-[9px] text-danger">
            <span className="h-1.5 w-1.5 rounded-full bg-danger animate-pulse-soft" aria-hidden />
            REC 14:32
          </div>
        </div>
      </div>
    </div>
  );
}

function TrustStrip(): JSX.Element {
  const items = [
    { icon: Globe, label: 'Cliente sin instalación' },
    { icon: ShieldCheck, label: 'Cifrado extremo a extremo' },
    { icon: Github, label: 'Código abierto y auditable' },
  ];
  return (
    <section className="relative border-y border-line/60 bg-surface-base/40">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-6 py-6 sm:grid-cols-3">
        {items.map((it) => (
          <div key={it.label} className="flex items-center justify-center gap-2 text-sm text-ink-secondary">
            <it.icon className="h-4 w-4 text-lime" aria-hidden />
            <span>{it.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Problem(): JSX.Element {
  return (
    <section className="relative mx-auto max-w-6xl px-6 py-20 lg:py-28">
      <SectionHeading
        eyebrow="El problema"
        title="Pagas 30€ al mes y aún tienes que pedirle a tu cliente que instale algo."
      />
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        <ComparisonCard
          name="TeamViewer"
          price="≈30€/mes"
          pains={[
            'Tu cliente baja un instalador de 60MB.',
            'Sin IA. Tú lees los logs a mano.',
            'Cobra por cada técnico extra.',
          ]}
        />
        <ComparisonCard
          name="AnyDesk"
          price="≈16€/mes"
          pains={[
            'Mejor que TV pero igual de manual.',
            'No hay marketplace de automatizaciones.',
            'Soporte: tickets que tardan días.',
          ]}
        />
        <ComparisonCard
          name="RustDesk"
          price="0€"
          pains={[
            'Self-hosted: cuesta más configurarlo que el problema que vas a resolver.',
            'UX cliente final regular.',
            'Sin asistente IA.',
          ]}
        />
      </div>
      <div className="mt-12 rounded-2xl border border-lime/30 bg-gradient-to-br from-surface-elev to-surface-base p-8 lg:p-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <h3 className="font-display text-2xl italic leading-tight sm:text-3xl">
              Lume hace una cosa distinta.
            </h3>
            <p className="mt-2 text-sm text-ink-secondary sm:text-base">
              Tu cliente no instala nada. Tú entras desde una app nativa con Copilot IA que mira
              la pantalla contigo y sugiere automatizaciones que cualquier técnico del marketplace
              puede contribuir.
            </p>
          </div>
          <a
            href={PANEL_URL}
            className="inline-flex w-fit items-center justify-center gap-2 rounded-lg bg-lime px-5 py-3 text-sm font-semibold text-surface-deep shadow-glow-lime hover:scale-[1.02]"
          >
            Probar la diferencia
            <ArrowRight className="h-4 w-4" aria-hidden />
          </a>
        </div>
      </div>
    </section>
  );
}

function ComparisonCard({ name, price, pains }: { name: string; price: string; pains: string[] }): JSX.Element {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface-base p-5">
      <div className="flex items-baseline justify-between">
        <h3 className="font-medium text-ink-primary">{name}</h3>
        <span className="font-mono text-xs text-ink-tertiary">{price}</span>
      </div>
      <ul className="space-y-2 text-sm text-ink-secondary">
        {pains.map((p) => (
          <li key={p} className="flex gap-2">
            <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-danger" aria-hidden />
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Features(): JSX.Element {
  const items: { icon: typeof Globe; title: string; body: string; soon?: boolean }[] = [
    {
      icon: Globe,
      title: 'Cliente sin instalación',
      body: 'Tu cliente abre lumeapp.es/abc123 en cualquier navegador moderno y comparte la pantalla con un click. Cero descargas, cero permisos de admin.',
    },
    {
      icon: Monitor,
      title: 'Apps nativas para el técnico',
      body: 'macOS Apple Silicon, Windows 10 y 11 de 64 bits, y Linux AppImage. Built con Tauri, así que pesan ~3MB en lugar de 100.',
    },
    {
      icon: Lock,
      title: 'WebRTC cifrado, TURN global',
      body: 'DTLS-SRTP de extremo a extremo. P2P cuando es posible, Cloudflare Calls TURN cuando hace falta. Sin abrir puertos.',
    },
    {
      icon: Bot,
      title: 'Copilot IA',
      body: 'Mira la pantalla del cliente contigo, detecta patrones (PG parado, error de DNS, app crasheada) y sugiere la solución.',
      soon: true,
    },
    {
      icon: Store,
      title: 'Marketplace de automatizaciones',
      body: 'Reinicia servicios, recoge logs, aplica parches. Cualquier técnico publica scripts y los demás los reutilizan en un click.',
      soon: true,
    },
    {
      icon: Video,
      title: 'Multimonitor + grabación',
      body: 'Cambia entre monitores en una pestaña. Graba la sesión en local o en cloud para auditoría y formación.',
    },
  ];
  return (
    <section id="features" className="relative mx-auto max-w-6xl px-6 py-20 lg:py-28">
      <SectionHeading
        eyebrow="Producto"
        title="Lo que ya funciona, y lo que está en camino."
        subtitle="Honestidad antes que marketing: si una feature no está lista, te la marcamos como Pronto."
      />
      <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <FeatureCard key={it.title} icon={it.icon} title={it.title} body={it.body} soon={it.soon} />
        ))}
      </div>
    </section>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  body,
  soon,
}: {
  icon: typeof Globe;
  title: string;
  body: string;
  soon?: boolean;
}): JSX.Element {
  return (
    <div className="group relative flex flex-col gap-3 rounded-xl border border-line bg-surface-base p-5 transition-colors hover:border-line-bright">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-lime/10 text-lime">
        <Icon className="h-4 w-4" aria-hidden />
      </div>
      <div className="flex items-center gap-2">
        <h3 className="font-medium text-ink-primary">{title}</h3>
        {soon && (
          <span className="rounded-md bg-warm/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-warm">
            Pronto
          </span>
        )}
      </div>
      <p className="text-sm leading-relaxed text-ink-secondary">{body}</p>
    </div>
  );
}

function HowItWorks(): JSX.Element {
  const steps = [
    {
      num: '01',
      title: 'Tu cliente abre el enlace',
      body: 'Le mandas lumeapp.es/abc123 por WhatsApp, email o lo que prefieras. No instala nada.',
    },
    {
      num: '02',
      title: 'Comparte la pantalla con un click',
      body: 'El navegador le pide permiso una vez. Elige pantalla o ventana, dale a compartir.',
    },
    {
      num: '03',
      title: 'Tú entras desde la app',
      body: 'Abres Lume en tu Mac, Windows o Linux, ves la pantalla en vivo con baja latencia y multimonitor.',
    },
  ];
  return (
    <section className="relative mx-auto max-w-6xl px-6 py-20 lg:py-28">
      <SectionHeading eyebrow="Cómo funciona" title="Tres pasos. Treinta segundos." />
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {steps.map((s) => (
          <div key={s.num} className="relative rounded-xl border border-line bg-surface-base p-6">
            <span className="font-mono text-xs text-lime">{s.num}</span>
            <h3 className="mt-2 font-display text-xl italic">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-secondary">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Pricing(): JSX.Element {
  return (
    <section id="precios" className="relative mx-auto max-w-6xl px-6 py-20 lg:py-28">
      <SectionHeading
        eyebrow="Precios"
        title="La mitad que TeamViewer. Sin permanencia."
        subtitle="Precios por usuario. IVA no incluido. Cancela en un click cuando quieras."
      />
      <div className="mt-12 grid gap-5 lg:grid-cols-3">
        {PLANS.map((plan) => (
          <PlanCard key={plan.name} plan={plan} />
        ))}
      </div>
      <p className="mt-8 text-center text-xs text-ink-tertiary">
        ¿Más de 50 técnicos? Escríbenos a{' '}
        <a className="text-lime hover:underline" href="mailto:hello@lumeapp.es">
          hello@lumeapp.es
        </a>{' '}
        para un plan Enterprise.
      </p>
    </section>
  );
}

function PlanCard({ plan }: { plan: PricingPlan }): JSX.Element {
  return (
    <div
      className={cn(
        'relative flex flex-col gap-5 rounded-2xl border p-6 lg:p-8',
        plan.highlight
          ? 'border-lime bg-gradient-to-br from-surface-elev to-surface-base shadow-glow-lime'
          : 'border-line bg-surface-base',
      )}
    >
      {plan.highlight && (
        <span className="absolute -top-3 left-6 rounded-full bg-lime px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-surface-deep">
          Más popular
        </span>
      )}
      <div className="flex flex-col gap-1.5">
        <h3 className="font-display text-2xl italic">{plan.name}</h3>
        <p className="text-sm text-ink-secondary">{plan.tagline}</p>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="font-display text-5xl italic text-ink-primary">{plan.price}</span>
        {plan.priceSuffix && <span className="text-sm text-ink-tertiary">{plan.priceSuffix}</span>}
      </div>
      <a
        href={PANEL_URL}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-transform hover:scale-[1.01]',
          plan.highlight
            ? 'bg-lime text-surface-deep'
            : 'border border-line bg-surface-base text-ink-primary hover:border-line-bright hover:bg-surface-hover',
        )}
      >
        {plan.cta}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </a>
      <ul className="flex flex-col gap-2.5 text-sm">
        {plan.features.map((f) => (
          <li key={f.label} className="flex items-start gap-2">
            {f.included ? (
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-lime" aria-hidden />
            ) : (
              <span className="mt-1 h-3 w-3 shrink-0 rounded-full border border-line" aria-hidden />
            )}
            <span className={f.included ? 'text-ink-primary' : 'text-ink-tertiary line-through'}>
              {f.label}
            </span>
            {f.soon && f.included && (
              <span className="ml-auto rounded bg-warm/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-warm">
                Pronto
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Faq(): JSX.Element {
  return (
    <section id="faq" className="relative mx-auto max-w-3xl px-6 py-20 lg:py-28">
      <SectionHeading eyebrow="FAQ" title="Lo que la gente nos pregunta primero." />
      <div className="mt-10 flex flex-col gap-2.5">
        {FAQ.map((item, idx) => (
          <FaqRow key={idx} item={item} />
        ))}
      </div>
    </section>
  );
}

function FaqRow({ item }: { item: FaqItem }): JSX.Element {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-line bg-surface-base">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="text-sm font-medium text-ink-primary sm:text-base">{item.q}</span>
        <ChevronDown
          aria-hidden
          className={cn('h-4 w-4 shrink-0 text-ink-tertiary transition-transform', open && 'rotate-180')}
        />
      </button>
      {open && (
        <div className="border-t border-line px-5 py-4 text-sm leading-relaxed text-ink-secondary">
          {item.a}
        </div>
      )}
    </div>
  );
}

function FinalCta(): JSX.Element {
  const apiBase = env.apiUrl.replace(/\/$/, '');
  const downloads = [
    { platform: 'macos-arm64', label: 'macOS', sub: 'Apple Silicon · 2.5 MB · .dmg' },
    { platform: 'windows-x64', label: 'Windows', sub: '10 y 11 · 2.3 MB · .msi' },
    { platform: 'linux-x64', label: 'Linux', sub: 'AppImage · 74 MB' },
  ];
  return (
    <section id="descargas" className="relative mx-auto max-w-6xl px-6 py-20 lg:py-28">
      <div className="overflow-hidden rounded-3xl border border-line bg-surface-base p-8 sm:p-12 lg:p-16">
        <div className="flex flex-col items-center text-center">
          <LumeMark size={72} />
          <h2 className="mt-6 font-display text-4xl italic leading-tight sm:text-5xl">
            Empieza gratis hoy.
          </h2>
          <p className="mt-3 max-w-xl text-base text-ink-secondary">
            Crea tu cuenta de técnico en 30 segundos, o baja la app de escritorio si prefieres
            empezar por ahí.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={PANEL_URL}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-lime px-7 py-3.5 text-base font-semibold text-surface-deep shadow-glow-lime-strong transition-transform hover:scale-[1.02]"
            >
              Probar gratis
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
            <a
              href="#descargas"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('download-grid')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-surface-elev px-7 py-3.5 text-base font-semibold text-ink-primary transition-colors hover:border-line-bright hover:bg-surface-hover"
            >
              <Download className="h-4 w-4" aria-hidden />
              Bajar la app
            </a>
          </div>
        </div>
        <div id="download-grid" className="mt-12 grid gap-3 sm:grid-cols-3">
          {downloads.map((d) => (
            <a
              key={d.platform}
              href={`${apiBase}/v1/downloads/desktop/${d.platform}`}
              download
              className="flex flex-col gap-1 rounded-xl border border-line bg-surface-elev px-4 py-3 text-left transition-colors hover:border-line-bright hover:bg-surface-hover"
            >
              <span className="flex items-center gap-2 text-sm font-medium text-ink-primary">
                <Download className="h-3.5 w-3.5 text-lime" aria-hidden />
                {d.label}
              </span>
              <span className="font-mono text-[11px] text-ink-tertiary">{d.sub}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer(): JSX.Element {
  return (
    <footer className="relative border-t border-line bg-surface-deep">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-6 w-6 rounded-[28%] bg-lime" aria-hidden />
          <span className="font-display text-lg italic">Lume</span>
          <span className="font-mono text-[10px] text-ink-tertiary">v0.1.0</span>
        </div>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink-tertiary">
          <a className="hover:text-ink-primary" href="#features">
            Producto
          </a>
          <a className="hover:text-ink-primary" href="#precios">
            Precios
          </a>
          <a className="hover:text-ink-primary" href="#faq">
            FAQ
          </a>
          <a className="hover:text-ink-primary" href={GITHUB_URL} target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a className="hover:text-ink-primary" href="mailto:hello@lumeapp.es">
            Contacto
          </a>
          <a className="hover:text-ink-primary" href={PANEL_URL}>
            Iniciar sesión
          </a>
        </nav>
      </div>
      <div className="border-t border-line/60">
        <p className="mx-auto max-w-6xl px-6 py-5 text-center font-mono text-[10px] text-ink-tertiary">
          © 2026 Lume · hecho en España con cariño · cifrado WebRTC sobre Cloudflare Calls
        </p>
      </div>
    </footer>
  );
}

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
}

function SectionHeading({ eyebrow, title, subtitle }: SectionHeadingProps): JSX.Element {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 text-center">
      <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] text-lime">
        <KeyRound className="h-3 w-3" aria-hidden />
        {eyebrow}
      </span>
      <h2 className="font-display text-3xl italic leading-tight sm:text-4xl lg:text-5xl">{title}</h2>
      {subtitle && <p className="text-sm text-ink-secondary sm:text-base">{subtitle}</p>}
    </div>
  );
}
