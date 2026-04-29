import { LumeMark } from './lume-mark';

interface EndScreenProps {
  reason: 'user' | 'host-left' | 'media-revoked' | 'error';
  message?: string;
}

const REASON_COPY: Record<EndScreenProps['reason'], { title: string; subtitle: string }> = {
  user: {
    title: 'Sesión finalizada.',
    subtitle: 'Has detenido la compartición. Puedes cerrar esta pestaña.',
  },
  'host-left': {
    title: 'El técnico ha salido.',
    subtitle: 'La sesión ha terminado. Puedes cerrar esta pestaña.',
  },
  'media-revoked': {
    title: 'Has revocado el permiso.',
    subtitle: 'La compartición se ha detenido. Puedes cerrar esta pestaña.',
  },
  error: {
    title: 'La sesión se ha interrumpido.',
    subtitle: 'Ha habido un problema con la conexión. Puedes cerrar esta pestaña.',
  },
};

export function EndScreen({ reason, message }: EndScreenProps) {
  const copy = REASON_COPY[reason];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-10 px-6 py-12 text-center">
      <LumeMark size={96} />
      <div className="max-w-md space-y-2">
        <p className="font-display text-3xl italic">{copy.title}</p>
        <p className="text-sm text-muted-foreground">{message ?? copy.subtitle}</p>
      </div>
      <p className="font-display text-base italic text-muted-foreground">Gracias por usar Lume.</p>
    </div>
  );
}
