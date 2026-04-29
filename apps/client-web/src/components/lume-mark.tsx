import { cn } from '@/lib/utils';

interface LumeMarkProps {
  className?: string;
  size?: number;
}

export function LumeMark({ className, size = 96 }: LumeMarkProps) {
  return (
    <div className={cn('relative flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <div
        aria-hidden
        className="absolute inset-0 animate-breathe rounded-full bg-primary/30 blur-2xl"
      />
      <div
        aria-hidden
        className="relative flex items-center justify-center rounded-2xl bg-card"
        style={{ width: size * 0.7, height: size * 0.7 }}
      >
        <div className="rounded-full bg-primary" style={{ width: size * 0.32, height: size * 0.32 }} />
      </div>
    </div>
  );
}
