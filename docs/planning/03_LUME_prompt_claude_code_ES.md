# Prompt para Claude Code, proyecto Lume

Pega este prompt en una sesión nueva de Claude Code, en la raíz donde quieras crear el proyecto. Asume que parte de cero. Ajusta las rutas y los valores según haga falta.

---

## Prompt principal

Hola Claude Code. Vamos a construir **Lume**, un software de acceso remoto premium que será el mejor del mundo. Esta es la fase 1 (cimientos), y el objetivo es tener una sesión remota funcional entre dos navegadores al final.

### Sobre el producto

Lume es un software de acceso remoto de la era de la IA, diseñado para profesionales. Diferenciales centrales: Copilot IA durante la sesión, modo Whisper (cursor fantasma), grabación indexada con búsqueda, conexión sin instalación vía navegador, multi-técnico nativo, privacy-first, marketplace de automatizaciones.

Posicionamiento: competimos con TeamViewer, AnyDesk, RustDesk, pero en otro nivel de producto y UX. Mercado objetivo inicial: España, Portugal, Latinoamérica, Europa.

### Convenciones del proyecto

- Idioma del código y los comentarios: inglés.
- Idioma de la documentación para usuarios: español, inglés, portugués (en este orden de prioridad).
- TypeScript strict en todo.
- ESLint + Prettier configurados.
- Conventional commits.
- **Importante**: nunca uses guiones largos en texto destinado a usuarios (em-dashes, en-dashes). Usa comas, puntos, paréntesis, dos puntos.

### Stack obligatorio

**Monorepo**

- Turborepo (preferido) o Nx
- pnpm como package manager
- Node.js 20+

**Backend (apps/api)**

- NestJS 10+ con TypeScript
- PostgreSQL 16 + Prisma como ORM
- Redis 7 (sesiones, caché, BullMQ para jobs)
- Auth: email + magic link, Google OAuth, Microsoft OAuth
- Validación: Zod (compartido con frontend vía package)
- WebSockets: Socket.io para señalización
- Observabilidad: pino para logs estructurados

**Frontend web (apps/web)**

- React 18 + TypeScript + Vite
- Tailwind CSS 3
- shadcn/ui (con componentes personalizados sobre Radix)
- Zustand para state global
- TanStack Query v5 para data fetching
- TanStack Router (preferido) o React Router v6
- React Hook Form + Zod para formularios

**Cliente del cliente final (apps/client-web)**

- Aplicación minimal, separada del panel
- Foco en claridad, privacidad visible, fricción cero
- Sin login obligatorio (solo código de sesión)

**Comunicación remota (packages/webrtc)**

- WebRTC nativo del navegador
- Wrapper propio con TypeScript types
- Soporte a ICE, STUN, TURN
- Códec preferido: VP9, fallback H.264
- Bitrate adaptativo

**Compartido (packages)**

- packages/protocol: contratos de mensajes (tipos Zod compartidos)
- packages/ui: design system (componentes base)
- packages/shared: utils, validators, types comunes
- packages/webrtc: SDK WebRTC

**Infraestructura local**

- Docker Compose para PostgreSQL, Redis, MinIO (futuro: almacenamiento de grabaciones), coturn (TURN server)

### Tareas de esta sesión (Fase 1)

Ejecuta en orden. Para a confirmar al final de cada bloque grande para que pueda revisar.

**Bloque 1: Setup del monorepo**

1. Inicializar pnpm workspace + Turborepo
2. Configurar TypeScript base (tsconfig en la raíz, heredado por las apps)
3. Configurar ESLint + Prettier compartido
4. Crear estructura de carpetas:
   ```
   apps/
     api/
     web/
     client-web/
   packages/
     protocol/
     ui/
     shared/
     webrtc/
   services/
     signaling/  (será el servidor Socket.io)
   infrastructure/
     docker/
   ```
5. Crear docker-compose.yml con PostgreSQL 16, Redis 7, coturn (puerto 3478)
6. Crear README.md raíz con instrucciones de setup
7. Configurar .gitignore robusto
8. Añadir scripts en el package.json raíz: dev, build, lint, test, db:migrate, db:seed

**Bloque 2: Backend NestJS (apps/api)**

1. Inicializar NestJS con TypeScript
2. Configurar Prisma con PostgreSQL
3. Schema inicial:

   ```prisma
   model User {
     id            String   @id @default(cuid())
     email         String   @unique
     name          String?
     avatarUrl     String?
     createdAt     DateTime @default(now())
     updatedAt     DateTime @updatedAt
     organizationId String?
     organization  Organization? @relation(fields: [organizationId], references: [id])
     sessions      Session[]
   }

   model Organization {
     id        String   @id @default(cuid())
     name      String
     slug      String   @unique
     plan      Plan     @default(FREE)
     createdAt DateTime @default(now())
     users     User[]
     sessions  Session[]
   }

   enum Plan {
     FREE
     PRO
     TEAM
     ENTERPRISE
   }

   model Session {
     id              String        @id @default(cuid())
     code            String        @unique  // el código corto, lume.io/k7m9p
     status          SessionStatus @default(PENDING)
     hostUserId      String
     hostUser        User          @relation(fields: [hostUserId], references: [id])
     organizationId  String?
     organization    Organization? @relation(fields: [organizationId], references: [id])
     clientName      String?       // nombre opcional del cliente final
     startedAt       DateTime?
     endedAt         DateTime?
     createdAt       DateTime      @default(now())
     metadata        Json?         // SO del cliente, resolución, etc.
   }

   enum SessionStatus {
     PENDING
     ACTIVE
     ENDED
     CANCELLED
   }
   ```

4. Módulos NestJS iniciales:
   - AuthModule: magic link vía email (usar Resend o Postmark, configurable), JWT
   - UsersModule: CRUD básico
   - OrganizationsModule: CRUD básico, multi-tenant
   - SessionsModule: crear sesión, generar código corto, listar
5. Endpoint para generar código de sesión:
   - `POST /sessions` (autenticado): crea sesión, devuelve código de 5 caracteres alfanuméricos no ambiguos (sin 0/O, 1/I/l)
   - `GET /sessions/:code/info` (público): devuelve info mínima de la sesión para el cliente final
   - `POST /sessions/:code/join` (público): el cliente final entra en la sesión
6. Validación: schemas Zod exportados vía package compartido
7. Tratamiento de errores consistente, devolviendo siempre JSON estructurado

**Bloque 3: Servidor de señalización (services/signaling)**

1. Aplicación Node.js separada con Socket.io
2. Endpoints WebSocket para:
   - el host conecta e identifica la sesión
   - el client conecta con código de sesión
   - intercambio de SDP (offer/answer)
   - intercambio de ICE candidates
   - eventos de control: ratón, teclado, etc.
3. Autenticación vía JWT del backend principal
4. Para el MVP, el señalizador puede ser standalone, después consolidamos

**Bloque 4: Frontend web panel (apps/web)**

1. Setup Vite + React 18 + TypeScript + Tailwind
2. Configurar shadcn/ui con tema personalizado:
   - Modo dark por defecto
   - Color primario: verde-lima vibrante (#b9ff66)
   - Background base: muy oscuro (#0a0e0d)
   - Tipografía: Geist (sans), Instrument Serif (display, italic), JetBrains Mono (mono)
3. Páginas iniciales:
   - /login (magic link)
   - /dashboard (lista de sesiones)
   - /session/new (crear sesión, mostrar código + QR)
   - /session/:code (vista del técnico durante la sesión)
4. Layout principal: sidebar a la izquierda, área central, panel derecho (Copilot, mock por ahora)
5. Implementar flujo de creación de sesión:
   - Botón "Nueva sesión"
   - El backend devuelve código
   - El frontend muestra modal con código grande, enlace copiable, código QR
   - Espera a que el cliente entre (vía WebSocket)

**Bloque 5: Frontend cliente final (apps/client-web)**

1. Aplicación separada, ruta única: `/:code`
2. Pantalla de bienvenida con:
   - Logo Lume grande, sereno
   - "Estás a punto de compartir tu pantalla con [nombre del técnico/empresa]"
   - Aviso claro de privacidad
   - Botón grande "Compartir pantalla"
3. Tras hacer clic, solicita permiso vía `getDisplayMedia()`
4. Conecta con el servidor de señalización
5. Negocia WebRTC con el host
6. Muestra estado simple y elegante: "Conectado", "Bruno está viendo tu pantalla"
7. Botón siempre visible: "Finalizar compartición"

**Bloque 6: Paquete WebRTC compartido (packages/webrtc)**

1. Wrapper TypeScript con clases:
   - `LumeHost`: lado del técnico (recibe stream)
   - `LumeClient`: lado del cliente (envía stream)
2. Eventos vía EventEmitter tipado
3. Manejo robusto de:
   - ICE failures
   - Reconexión automática
   - Bitrate adaptativo
4. Soporte a múltiples viewers (preparación para multi-técnico, pero MVP solo 1 host)

**Bloque 7: Smoke test end-to-end**

1. Levantar todo vía `pnpm dev` (Turborepo orquestando)
2. Documentar pasos de test manual:
   - Login en el panel
   - Crear sesión
   - Abrir cliente en otro navegador
   - Insertar código
   - Conceder permiso de pantalla
   - Comprobar que el host ve la pantalla en tiempo real
3. Latencia objetivo de esta fase: por debajo de 200ms en red local (sin optimización todavía)

### Decisiones importantes a tomar conmigo antes de empezar

1. **Email transaccional**: ¿Resend o Postmark? (Resend es más moderno, Postmark más maduro)
2. **Hosting previsto**: ¿AWS, Hetzner, Cloudflare, o combinación? (afecta a algunas decisiones de infra)
3. **TURN provider para producción**: ¿Twilio, Cloudflare Calls, o coturn self-hosted? (el MVP usa coturn local)
4. **Storage para grabaciones futuras**: ¿S3, R2, MinIO self-hosted?
5. **Dominio reservado**: ¿lume.io está disponible? ¿lume.app? ¿getlume.com?

Pregúntame cada una antes de seguir, y propónme defaults sensatos.

### Restricciones de calidad

- Nada de `any` en TypeScript. Usa `unknown` cuando haga falta y haz type narrowing.
- Toda función pública lleva JSDoc.
- Toda variable de entorno está documentada en `.env.example`.
- Toda migration de base de datos tiene nombre descriptivo.
- Todo mensaje de commit sigue Conventional Commits.
- El rendimiento es feature: bundles de menos de 200kb gzipped en el frontend inicial.
- Accesibilidad: contrast ratio mínimo AAA, navegación por teclado completa, aria-labels donde haga falta.

### Lo que NO hay que hacer en esta fase

- No implementar Copilot IA (viene en la fase 3)
- No implementar grabación (viene en la fase 3)
- No implementar pagos (viene en la fase 4)
- No implementar cliente desktop Tauri (viene en la fase 2)
- No optimizar códec ni bitrate (viene cuando esté funcional)
- No escribir tests E2E todavía (solo unit tests críticos)

### Output esperado al final de esta sesión

1. Repositorio con toda la estructura anterior funcional
2. README.md raíz claro, con setup en menos de 5 minutos
3. Documentación en `docs/architecture/01-overview.md` explicando decisiones
4. Smoke test pasando: dos navegadores, sesión remota funcionando
5. Lista de lo que falta para la Fase 2 (cliente Tauri, optimización de códec, multimonitor)

Confírmame que has entendido el alcance, hazme las 5 preguntas de decisión anteriores, propónme defaults, y empieza por el Bloque 1 cuando te dé luz verde.

---

## Prompts auxiliares para fases siguientes

Guarda estos para usarlos cuando llegue el momento.

### Fase 2 (cliente Tauri)

> Vamos a crear el cliente desktop Lume usando Tauri 2 con Rust. Reutilizar el frontend de apps/web cuando sea posible. Implementar captura de pantalla nativa (Windows: DirectX, macOS: ScreenCaptureKit, Linux: PipeWire), control de ratón y teclado, multimonitor. Empaquetar para Windows MSI, macOS DMG (notarized), Linux AppImage y DEB. Auto-update vía Tauri updater.

### Fase 3 (Copilot IA)

> Implementar Copilot IA de Lume. Backend: nuevo módulo CopilotModule en NestJS, integrando API de Anthropic (Claude). Pipeline: capturar screenshots de la sesión cada N segundos, enviar a análisis, devolver sugerencias estructuradas. Frontend: panel derecho del Copilot con mensajes en tiempo real, acciones ejecutables. Privacidad: el cliente recibe aviso cuando el Copilot está activo, opción de desactivar.

### Fase 3 (Modo Whisper)

> Implementar Modo Whisper. Cuando se activa, el técnico controla un cursor visible en el cliente, pero los clics son solo indicativos (el cliente todavía tiene que hacer clic manualmente). Implementar overlay en el client-web con cursor fantasma de color, etiqueta del técnico, pulse de "clic sugerido aquí". Toggle en el panel del técnico.

### Fase 4 (self-hosted)

> Empaquetar Lume como self-hosted vía docker-compose. Documentar instalación en servidor propio del cliente. Incluir backend, señalizador, TURN, base de datos, Redis. Sistema de licencias offline con claves firmadas. Admin panel para gestionar usuarios localmente.

---

Buen desarrollo. Construye con cuidado, código limpio, y foco en hacer brillar cada pieza.
