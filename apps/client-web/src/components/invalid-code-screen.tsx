import { LumeMark } from './lume-mark';

interface InvalidCodeScreenProps {
  message?: string;
}

export function InvalidCodeScreen({ message }: InvalidCodeScreenProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-12 text-center">
      <LumeMark size={96} />
      <div className="max-w-md space-y-2">
        <p className="font-display text-3xl italic">Sesión no encontrada.</p>
        <p className="text-sm text-muted-foreground">
          {message ?? 'Comprueba con tu técnico que el código es correcto y vuelve a intentarlo.'}
        </p>
      </div>
    </div>
  );
}
