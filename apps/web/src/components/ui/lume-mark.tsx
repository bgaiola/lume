import { cn } from '@/lib/utils';

interface LumeMarkProps {
  className?: string;
  size?: number;
}

/**
 * The Lume logo mark: a lime-green rounded square with an inner dark
 * notch and a glowing centre dot. Matches the mockup at
 * docs/planning/02_LUME_interface_mockup_ES.html.
 */
export function LumeMark({ className, size = 28 }: LumeMarkProps) {
  const inset1 = Math.round(size * 0.21);
  const inset2 = Math.round(size * 0.39);
  return (
    <div
      className={cn(
        'relative shrink-0 rounded-[28%] bg-lime shadow-glow-lime',
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <div
        className="absolute rounded-[16%] bg-surface-deep"
        style={{ inset: inset1 }}
      />
      <div
        className="absolute rounded-full bg-lime shadow-[0_0_12px_#b9ff66]"
        style={{ inset: inset2 }}
      />
    </div>
  );
}
