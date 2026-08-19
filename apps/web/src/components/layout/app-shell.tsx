import { Link, useNavigate } from '@tanstack/react-router';
import {
  BarChart3,
  History,
  LogOut,
  type LucideIcon,
  Plus,
  Search,
  Settings,
  Sparkles,
  Target,
  Users,
  Zap,
} from 'lucide-react';
import { type ReactNode } from 'react';

import { LumeMark } from '@/components/ui/lume-mark';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';

interface AppShellProps {
  children: ReactNode;
  showCopilot?: boolean;
  copilotSlot?: ReactNode;
}

interface NavItem {
  label: string;
  icon: LucideIcon;
  to?: string;
  badge?: string;
  comingSoon?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Sesiones',
    items: [
      { label: 'Sesiones', icon: Target, to: '/dashboard' },
      { label: 'Historial', icon: History, comingSoon: true },
      { label: 'Nueva sesión', icon: Plus, to: '/session/new' },
    ],
  },
  {
    label: 'Espacio de trabajo',
    items: [
      { label: 'Equipo', icon: Users, comingSoon: true },
      { label: 'Automatizaciones', icon: Zap, comingSoon: true, badge: 'Pronto' },
      { label: 'Marketplace', icon: Search, comingSoon: true },
      { label: 'Estadísticas', icon: BarChart3, comingSoon: true },
    ],
  },
  {
    label: 'Cuenta',
    items: [{ label: 'Ajustes', icon: Settings, comingSoon: true }],
  },
];

function getInitials(nameOrEmail: string): string {
  const trimmed = nameOrEmail.trim();
  if (!trimmed) {return '?';}
  if (trimmed.includes('@')) {
    return trimmed[0]!.toUpperCase();
  }
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

function orgSlugFromEmail(email: string): string {
  const domain = email.split('@')[1] ?? '';
  return domain.replace(/\.[^.]+$/, '') || 'lume';
}

const navLabelClass =
  'px-2 pb-2 font-mono text-[10px] uppercase tracking-[0.15em] text-ink-tertiary';

const navItemBaseClass =
  'group relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] text-ink-secondary transition-colors hover:bg-surface-hover hover:text-ink-primary';

const navItemActiveClass =
  'bg-surface-hover text-lime before:absolute before:-left-4 before:top-1/2 before:h-4 before:w-[3px] before:-translate-y-1/2 before:rounded-r-sm before:bg-lime before:content-[""]';

const navItemDisabledClass = 'cursor-default opacity-60 hover:bg-transparent hover:text-ink-secondary';

export function AppShell({ children, showCopilot = true, copilotSlot }: AppShellProps) {
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);
  const navigate = useNavigate();

  const handleLogout = () => {
    clear();
    void navigate({ to: '/login' });
  };

  const displayName = user?.name ?? user?.email?.split('@')[0] ?? 'Invitado';
  const initials = getInitials(user?.name ?? user?.email ?? '?');
  const orgSlug = user?.email ? `${orgSlugFromEmail(user.email)}.lumeapp.es` : '';

  return (
    <div className="grid h-screen grid-cols-[240px_1fr] xl:grid-cols-[240px_1fr_320px]">
      <aside className="flex flex-col gap-5 border-r border-line bg-surface-deep/60 p-5">
        <div className="flex items-center gap-2.5 px-1">
          <LumeMark size={28} />
          <span className="font-display text-2xl italic leading-none text-ink-primary">Lume</span>
        </div>

        <nav className="flex flex-1 flex-col gap-5" aria-label="Navegación principal">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="flex flex-col gap-0.5">
              <div className={navLabelClass}>{group.label}</div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const content = (
                  <>
                    <Icon className="h-3.5 w-3.5 opacity-80 group-hover:opacity-100" aria-hidden />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto rounded-[4px] bg-lime/10 px-1.5 py-[2px] font-mono text-[10px] tracking-wide text-lime">
                        {item.badge}
                      </span>
                    )}
                  </>
                );

                if (item.to && !item.comingSoon) {
                  return (
                    <Link
                      key={item.label}
                      to={item.to}
                      activeOptions={{ exact: false }}
                      className={navItemBaseClass}
                      activeProps={{ className: navItemActiveClass }}
                    >
                      {content}
                    </Link>
                  );
                }

                return (
                  <button
                    key={item.label}
                    type="button"
                    title="Próximamente"
                    aria-disabled
                    className={cn(navItemBaseClass, navItemDisabledClass, 'text-left')}
                    onClick={(e) => e.preventDefault()}
                  >
                    {content}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {user && (
          <div className="rounded-[10px] border border-line bg-surface-elev p-3">
            <div className="mb-2 flex items-center gap-2.5">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-pink to-warm text-[11px] font-semibold text-surface-deep"
                aria-hidden
              >
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium text-ink-primary">{displayName}</div>
                {orgSlug && (
                  <div className="truncate font-mono text-[10px] text-ink-tertiary">{orgSlug}</div>
                )}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
                className="rounded p-1 text-ink-tertiary transition-colors hover:bg-surface-hover hover:text-ink-primary"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
            <div className="rounded-[4px] bg-lime/10 px-1.5 py-1 text-center font-mono text-[9px] uppercase tracking-[0.1em] text-lime">
              Plan Free
            </div>
          </div>
        )}
      </aside>

      <main className="overflow-y-auto p-8">{children}</main>

      {showCopilot && (
        <aside className="hidden flex-col border-l border-line bg-surface-base xl:flex">
          {copilotSlot ?? <CopilotPanel />}
        </aside>
      )}
    </div>
  );
}

function CopilotPanel() {
  return (
    <>
      <div className="flex items-center gap-2.5 border-b border-line p-4">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-lime to-blue text-sm font-semibold text-surface-deep shadow-glow-lime"
          aria-hidden
        >
          L
        </div>
        <div className="flex-1">
          <div className="font-display text-lg italic leading-tight text-ink-primary">Copilot</div>
          <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-tertiary">
            Próximamente
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
        <div className="rounded-[10px] border border-line bg-surface-elev p-3">
          <div className="mb-1.5 flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-lime" aria-hidden />
            <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-lime">
              Diagnóstico
            </span>
            <span className="ml-auto font-mono text-[9px] text-ink-tertiary">en breve</span>
          </div>
          <p className="text-[12px] leading-relaxed text-ink-primary">
            Aquí aparecerán <span className="font-medium text-lime">diagnósticos automáticos</span>{' '}
            cuando el Copilot detecte errores en la pantalla del cliente.
          </p>
        </div>

        <div className="rounded-[10px] border border-line bg-surface-elev p-3">
          <div className="mb-1.5 flex items-center gap-1.5">
            <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-blue">
              Transcripción
            </span>
            <span className="ml-auto font-mono text-[9px] text-ink-tertiary">en breve</span>
          </div>
          <p className="text-[12px] leading-relaxed text-ink-secondary">
            Transcripción en tiempo real de la conversación con el cliente, indexada y buscable.
          </p>
        </div>

        <div className="rounded-[10px] border border-line bg-surface-elev p-3">
          <div className="mb-1.5 flex items-center gap-1.5">
            <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-warm">
              Automatizaciones
            </span>
            <span className="ml-auto font-mono text-[9px] text-ink-tertiary">en breve</span>
          </div>
          <p className="text-[12px] leading-relaxed text-ink-secondary">
            El Copilot sugerirá flujos del marketplace en función del problema detectado.
          </p>
        </div>
      </div>

      <div className="border-t border-line px-4 py-3">
        <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-ink-tertiary">
          Equipo en la sesión
        </div>
        <div className="mt-2 flex items-center">
          <div className="-mr-1.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface-base bg-gradient-to-br from-pink to-warm font-mono text-[10px] font-semibold text-surface-deep">
            BA
          </div>
          <button
            type="button"
            title="Próximamente"
            className="ml-2 flex h-7 w-7 items-center justify-center rounded-full border-[1.5px] border-dashed border-line-bright text-ink-tertiary transition-colors hover:text-ink-primary"
          >
            <Plus className="h-3 w-3" aria-hidden />
          </button>
        </div>
      </div>

      <div className="px-4 pb-4">
        <div className="flex cursor-text items-center gap-2.5 rounded-lg border border-line bg-surface-elev px-3 py-2.5">
          <span className="rounded border border-line bg-surface-deep px-1.5 py-0.5 font-mono text-[10px] text-ink-secondary">
            ⌘K
          </span>
          <span className="flex-1 text-[12px] text-ink-tertiary">Pregunta al Copilot...</span>
        </div>
      </div>
    </>
  );
}
