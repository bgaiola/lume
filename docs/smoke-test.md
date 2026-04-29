# Smoke test, Fase 1: sesión remota navegador a navegador

Esta guía cierra la Fase 1: arrancar todo el monorepo localmente y comprobar
que un técnico ve la pantalla de un cliente en tiempo real, en dos navegadores
separados, con latencia inferior a 200 ms en red local.

## 0. Requisitos

- **Node.js 20 o superior** (`nvm use` respeta `.nvmrc`).
- **pnpm 9 o superior** (`corepack enable` o `npm i -g pnpm`).
- **Docker Desktop** corriendo (para Postgres, Redis, MinIO y coturn locales).
- Dos navegadores distintos o dos perfiles del mismo navegador. El cliente
  necesita Chrome o Edge para `getDisplayMedia` con `displaySurface: monitor`.
- Cuenta de **Resend** opcional. Si no configuras `RESEND_API_KEY`, los enlaces
  mágicos se imprimen en la consola de la API (modo dev, suficiente para el
  smoke test).

## 1. Setup, una sola vez

```bash
# Instalar dependencias del workspace
pnpm install

# Generar el .env local con secretos JWT y magic-link aleatorios
pnpm env:bootstrap

# Levantar la infraestructura local (Postgres 16, Redis 7, MinIO, coturn)
pnpm infra:up

# Aplicar migraciones de Prisma (crea User, Organization, Session)
pnpm db:migrate

# Sembrar datos de demo (usuario demo@lume.app dentro de "Lume Demo")
pnpm db:seed
```

Si quieres usar emails reales, edita `.env` y pon tu `RESEND_API_KEY`. Para el
smoke test no hace falta.

## 2. Arrancar todo en paralelo

```bash
pnpm dev
```

Turborepo construye primero los paquetes compartidos (`@lume/protocol`,
`@lume/shared`, `@lume/webrtc`) y luego lanza:

| Servicio              | URL                                                     |
| --------------------- | ------------------------------------------------------- |
| Panel del técnico     | <http://localhost:5173>                                 |
| Cliente final público | <http://localhost:5174>                                 |
| API NestJS            | <http://localhost:3000> (ruta base `/v1`, `/health`)    |
| Signaling Socket.io   | `ws://localhost:3001` (también responde a `/health`)    |
| MinIO console         | <http://localhost:9001> (usuario `lume_minio`)          |

## 3. Camino feliz, paso a paso

1. **Abre el panel** en <http://localhost:5173>. Te redirige a `/login`.
2. **Pide un magic link**: introduce `tu@empresa.com` (cualquier email vale en
   dev). Sin `RESEND_API_KEY`, busca en la consola de la API la línea:

   ```
   [dev] would have sent magic link email { to: '...', url: 'http://localhost:5173/auth/callback?token=...' }
   ```

   Copia esa URL en la barra de direcciones del mismo navegador.
3. La app intercambia el token por una sesión y aterriza en `/dashboard`.
4. **Crea una sesión**: pulsa "Nueva sesión", deja vacío "Nombre del cliente"
   (o pon uno), envía. Aparece un modal con:
   - Código de 5 caracteres en grande, tipografía mono.
   - Enlace `http://localhost:5174/<CODE>`, copiable.
   - QR del enlace.
5. Pulsa "Entrar a la sesión". El panel se queda en `/session/<CODE>`,
   estado "Esperando al cliente", punto verde pulsando.
6. **Abre el cliente final** en otro navegador o perfil distinto, en la URL
   `http://localhost:5174/<CODE>`. El navegador valida el código contra el
   API, dibuja la pantalla de bienvenida con el nombre del técnico y el aviso
   de privacidad.
7. Pulsa "Compartir pantalla". El navegador muestra el diálogo nativo de
   `getDisplayMedia`: elige una pantalla, ventana o pestaña.
8. Tras conceder permiso:
   - El cliente entra en estado "Esperando al técnico" → "Estableciendo
     conexión cifrada" → "Bruno está viendo tu pantalla", con punto verde.
   - El panel del técnico cambia a "En vivo" (pill arriba a la derecha) y
     muestra el `<video>` con tu pantalla en tiempo real.
9. **Comprueba la latencia** abriendo un cronómetro o el reloj de macOS en la
   pantalla del cliente y mirándolo desde el panel. La diferencia visible
   debería estar por debajo de 200 ms en LAN, sin optimización todavía.
10. **Cierra desde cualquier lado**:
    - "Finalizar compartición" en el cliente → el panel pasa a estado cerrado.
    - "Finalizar sesión" en el panel → el cliente muestra "El técnico ha salido".
    - Cierra la pestaña del cliente → el panel detecta `peer:left`.

## 4. Comprobaciones rápidas

```bash
# El API responde
curl -s http://localhost:3000/health | jq

# El signaling responde
curl -s http://localhost:3001/health | jq

# Sesiones activas (necesita Authorization, sustituye TOKEN)
curl -s -H "Authorization: Bearer TOKEN" http://localhost:3000/v1/sessions | jq
```

Logs en vivo:

```bash
pnpm infra:logs            # Postgres, Redis, MinIO, coturn
# Las apps usan pino-pretty, salen en la consola donde lanzaste pnpm dev.
```

## 5. Casos límite a probar

| Caso                                     | Esperado                                                          |
| ---------------------------------------- | ----------------------------------------------------------------- |
| Código inválido en la URL del cliente    | Pantalla "Sesión no encontrada"                                    |
| Cancelar el diálogo de compartir         | Mensaje "Has cancelado la compartición. Pulsa de nuevo..."        |
| Cerrar la pestaña del técnico            | Cliente muestra "El técnico ha salido"                             |
| Pulsar "Stop sharing" en el navegador    | Cliente pasa a "Has revocado el permiso"                          |
| Token JWT manipulado                     | Handshake del signaling se rechaza con `INVALID_TOKEN`            |

## 6. Apagar todo

```bash
# Detener pnpm dev: Ctrl+C en la terminal
pnpm infra:down            # Para los contenedores y conserva los volúmenes
```

Si quieres empezar de cero (incluyendo borrar la base de datos):

```bash
pnpm db:reset
docker compose -f infrastructure/docker/docker-compose.yml down -v
```

## 7. Si algo falla

- **`pnpm dev` no arranca el panel o el cliente**: probablemente los paquetes
  compartidos no se construyeron. Ejecuta `pnpm build` una vez y vuelve a
  intentar.
- **API se cae con `Invalid environment configuration`**: faltan secretos en
  `.env`. Re-ejecuta `pnpm env:bootstrap`, o edítalo a mano.
- **El cliente entra pero el panel no recibe vídeo**: revisa la consola de
  ambos. Si ves `INVALID_TOKEN` en el signaling, los relojes están
  desincronizados o se reusó un token caducado.
- **No conecta entre máquinas distintas en la misma red**: STUN no basta,
  necesitas TURN. coturn está en `infrastructure/coturn/turnserver.conf`,
  comprueba que el puerto 3478 UDP llega entre las máquinas.
- **API muere con `P1010 User 'lume' was denied access`**: tienes otro
  Postgres ocupando el puerto 5432. Para usar el de Lume, edita `.env` y
  cambia `POSTGRES_PORT=5433` (y `DATABASE_URL` para apuntar a 5433),
  luego `pnpm infra:down && pnpm infra:up`. Alternativa: detener tu
  Postgres local mientras trabajas en Lume.
