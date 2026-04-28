import { Link, useNavigate } from '@tanstack/react-router';
import { LayoutDashboard, LogOut, Sparkles, Video } from 'lucide-react';
import { type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';

interface AppShellProps {
  children: ReactNode;
  showCopilot?: boolean;
}

const navItems = [
  { to: '/dashboard', label: 'Sesiones', icon: LayoutDashboard },
  { to: '/session/new', label: 'Nueva sesión', icon: Video },
] as const;

export function AppShell({ children, showCopilot = true }: AppShellProps) {
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);
  const navigate = useNavigate();

  const handleLogout = () => {
    clear();
    void navigate({ to: '/login' });
  };

  return (
    <div className="grid h-screen grid-cols-[240px_1fr] xl:grid-cols-[240px_1fr_320px]">
      <aside className="flex flex-col gap-6 border-r border-border bg-card/40 p-6">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-primary" aria-hidden />
          <span className="font-display text-2xl italic">Lume</span>
        </div>

        <nav className="flex flex-col gap-1" aria-label="Navegación principal">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: false }}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors',
                'hover:bg-accent hover:text-foreground',
              )}
              activeProps={{
                className: 'bg-accent text-foreground',
              }}
            >
              <item.icon className="h-4 w-4" aria-hidden />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-3">
          {user && (
            <div className="rounded-md border border-border bg-card p-3">
              <p className="truncate text-sm font-medium">{user.name ?? user.email}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={handleLogout} className="justify-start">
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      <main className="overflow-y-auto p-8">{children}</main>

      {showCopilot && (
        <aside className="hidden flex-col gap-4 border-l border-border bg-card/30 p-6 xl:flex">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden />
            <span className="font-medium">Copilot</span>
            <span className="ml-auto rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
              Próximamente
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            El asistente IA aparecerá aquí durante las sesiones para sugerir acciones,
            resumir lo que ocurre y ejecutar automatizaciones del marketplace.
          </p>
          <div className="flex-1 rounded-md border border-dashed border-border" aria-hidden />
        </aside>
      )}
    </div>
  );
}
