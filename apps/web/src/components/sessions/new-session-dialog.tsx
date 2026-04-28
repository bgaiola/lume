import { type CreateSessionResponse } from '@lume/protocol';
import { Check, Copy } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface NewSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: CreateSessionResponse | null;
  onJoinAsHost: () => void;
}

export function NewSessionDialog({ open, onOpenChange, session, onJoinAsHost }: NewSessionDialogProps) {
  const [copied, setCopied] = useState<'url' | 'code' | null>(null);

  const handleCopy = (kind: 'url' | 'code', value: string) => {
    void navigator.clipboard.writeText(value).then(() => {
      setCopied(kind);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  if (!session) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sesión lista</DialogTitle>
          <DialogDescription>
            Comparte el código o el enlace con tu cliente. Esperaremos su conexión.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-4">
          <div className="rounded-md bg-white p-4">
            <QRCodeSVG value={session.joinUrl} size={160} bgColor="#ffffff" fgColor="#0a0e0d" />
          </div>

          <div className="text-center">
            <p className="font-mono text-5xl font-bold tracking-[0.4em] text-primary">
              {session.session.code}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">Código de acceso</p>
          </div>

          <div className="flex w-full flex-col gap-2">
            <Button
              variant="secondary"
              className="justify-between gap-2"
              onClick={() => handleCopy('url', session.joinUrl)}
              type="button"
            >
              <span className="truncate text-xs">{session.joinUrl}</span>
              {copied === 'url' ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
            </Button>
            <Button
              variant="secondary"
              className="justify-between"
              onClick={() => handleCopy('code', session.session.code)}
              type="button"
            >
              <span>Copiar solo el código</span>
              {copied === 'code' ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} type="button">
            Cerrar
          </Button>
          <Button onClick={onJoinAsHost} type="button">
            Entrar a la sesión
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
