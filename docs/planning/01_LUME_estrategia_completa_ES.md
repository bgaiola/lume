# Lume

## El mejor software de acceso remoto del mundo

### Documento estratégico completo

Versión 1.0, abril de 2026

---

## 1. Visión y posicionamiento

### El problema real

El mercado del acceso remoto está dominado por productos caros, lentos y desfasados. TeamViewer cobra cientos de euros al año y banea a usuarios domésticos bajo sospecha de uso comercial. AnyDesk es rápido pero burocrático y tiene una interfaz olvidable. Chrome Remote Desktop es gratis pero básico, sin recursos para profesionales. RustDesk tiene alma open source pero le falta pulido y soporte.

Ninguno de estos productos ha sido pensado para 2026. Ninguno integra IA de forma útil. Ninguno trata la privacidad como prioridad real. Ninguno permite colaboración nativa entre técnicos. Ninguno tiene una UX que respete tanto al técnico como al cliente final.

### La visión Lume

Redefinir el acceso remoto como una plataforma de resolución colaborativa de problemas, no solo control de pantalla. Un producto donde el técnico tenga superpoderes (IA, automatizaciones, time travel), el cliente tenga dignidad (privacidad clara, sin instalación, experiencia amable), y la empresa tenga confianza (auditoría, compliance, self-hosting).

### Posicionamiento

Lume es el software de acceso remoto de la era de la IA, diseñado para profesionales que valoran la velocidad, la colaboración, la privacidad y las herramientas modernas. No competimos con TeamViewer por el mismo cliente: capturamos al profesional que ha migrado de Photoshop a Figma, de Slack a Discord, de Zoom a Linear. El profesional que elige herramientas por calidad, no por inercia corporativa.

### Eslogan

**Lume. Mira lo que ven. Arregla lo que necesitan.**

Versiones adicionales para distintos contextos:

- "Acceso remoto que querrás usar."
- "El soporte remoto, por fin en 2026."
- "Conecta. Resuelve. Avanza."

---

## 2. Análisis competitivo

### TeamViewer

Líder histórico, en declive reputacional. Puntos débiles: precio elevado, política agresiva contra usuarios domésticos, interfaz anticuada, rendimiento inestable en redes malas, dependencia de servidores propios sin opción self-hosted clara para pymes. Puntos fuertes: marca, base instalada, integración corporativa.

Cómo gana Lume: precio justo y transparente, foco en el profesional moderno, IA integrada, multi-tenant verdadero, opción self-hosted desde el primer día.

### AnyDesk

Rápido, ligero, popular entre técnicos europeos. Puntos débiles: UX limitada, sin colaboración real entre técnicos, sin IA, grabación básica, interfaz aún parecida a 2017. Puntos fuertes: velocidad, códec propietario decente.

Cómo gana Lume: WebRTC moderno equilibrando latencia y calidad, IA, marketplace, colaboración nativa, grabación indexada por búsqueda.

### Chrome Remote Desktop

Gratis, limitado. Puntos débiles: básico al extremo, sin recursos profesionales, sin soporte, sin multimonitor decente, sin grabación. Puntos fuertes: gratuidad, integración Google.

Cómo gana Lume: profesionalización total. No competimos en el mismo segmento, capturamos a quien ha crecido más allá de Chrome Remote Desktop.

### RustDesk

Open source, en crecimiento. Puntos débiles: experiencia inconsistente, falta de pulido, soporte comunitario limitado, sin recursos avanzados. Puntos fuertes: gratis, self-hosted nativo.

Cómo gana Lume: producto pulido con versión self-hosted comercial, soporte profesional, IA propietaria, marketplace y UX diseñada por diseñadores reales.

### Splashtop, LogMeIn, GoToMyPC

Productos legacy, centrados en el mercado corporativo americano. Caros, anticuados, sin innovación relevante desde hace años. Lume captura nichos específicos (MSP, agencias, freelancers, despachos de TI) que estos productos atienden mal.

---

## 3. Los siete diferenciales únicos

### 3.1 Copilot IA durante la sesión

Un asistente que observa la pantalla junto al técnico y aporta valor en tiempo real:

- Identifica mensajes de error del sistema operativo y sugiere causas probables
- Reconoce comandos de terminal y ofrece autocompletado contextual
- Transcribe la voz del cliente automáticamente, identificando jerga técnica
- Genera resumen ejecutivo al final de la sesión (problema, diagnóstico, solución, tiempo invertido)
- Sugiere artículos de la base de conocimiento interna según el contexto
- Detecta patrones: "este es el tercer cliente esta semana con el mismo problema de DNS"

Implementación: API de Anthropic u OpenAI en backend, con preprocesado vía OCR y captura de eventos del sistema. Privacidad: el cliente recibe aviso claro cuando el copilot está activo.

### 3.2 Modo Whisper (Show, don't tell)

El técnico controla un cursor "fantasma" visible en la pantalla del cliente, pero quien hace clic es el cliente. Casos de uso:

- Formación real: el cliente aprende haciendo, no mirando
- Compliance: bancos, administración pública, jurídico necesitan que las acciones las ejecute el titular
- Soporte sénior: el cliente final tiene permisos que el técnico no debería tener
- Auditoría: la grabación demuestra que la acción la ejecutó el cliente, no el técnico

Diferencial enorme frente a todos los competidores. Patentable como feature.

### 3.3 Time Travel y búsqueda en sesiones

Grabación automática (con consentimiento) indexada por:

- OCR continuo: todo el texto que aparezca en pantalla se vuelve buscable
- Eventos del sistema: instalaciones, cambios de registro, comandos ejecutados
- Transcripción de audio: lo que se ha hablado durante la sesión
- Marcadores automáticos: "momento de instalación", "primer error", "solución aplicada"

Replay con timeline interactiva, búsqueda en texto libre, exportación en vídeo o informe PDF. Para empresas, esto es oro: auditoría, formación, evidencia legal.

### 3.4 Conexión sin instalación

El cliente recibe un enlace corto: lume.io/k7m9p o un código QR vía WhatsApp. Lo abre en el navegador, da permiso de pantalla, está conectado. WebRTC peer-to-peer puro cuando es posible, con fallback a TURN.

Para acceso desatendido (servidores, máquinas remotas), agente ligero en segundo plano con huella mínima de memoria y CPU. Actualizaciones silenciosas. Inicio en menos de dos segundos.

### 3.5 Colaboración multi-técnico

Dos, tres o más técnicos en la misma sesión, con:

- Chat lateral entre técnicos, invisible para el cliente
- Handoff fluido: "te paso a ti que eres el especialista de red"
- Cursores nombrados de cada técnico (color por persona)
- Acciones coordinadas: uno escribe, otro lee documentación, un tercero toma notas
- Indicación clara al cliente de quién está hablando o actuando

Caso de uso: MSP con equipos, departamentos de TI corporativos, soporte jerárquico (N1, N2, N3).

### 3.6 Privacy-first como dogma

No es un checkbox de marketing, es arquitectura central:

- Cifrado E2E real entre técnico y cliente (los servidores Lume no ven el contenido)
- Opción self-hosted comercial: el cliente despliega Lume Server en su propia infraestructura
- Cumplimiento RGPD, LOPDGDD, HIPAA nativos, con documentación clara
- Audit logs inmutables, exportables, con hash en blockchain opcional
- Avisos visuales permanentes al cliente: "el técnico María está viendo tu pantalla, grabación activa"
- Permisos granulares: el cliente bloquea zonas de la pantalla (por ejemplo, contraseñas), carpeta de fotos, etc.
- Modo paranoia: el cliente cancela la sesión en cualquier momento con tecla de pánico (F12 largo)

Este posicionamiento atrae a mercados regulados: administración pública, sanidad, financiero, jurídico, educación.

### 3.7 Marketplace de automatizaciones

Cada técnico puede guardar una secuencia de acciones como "Lume Script". Ejemplos:

- Reiniciar la cola de impresión de Windows
- Limpiar carpeta Temp y caché del navegador
- Configurar la VPN corporativa estándar
- Diagnóstico de red completo
- Backup automático antes de tocar el registro

Los scripts se hacen públicos en el marketplace, con valoración, comentarios, fork. La comunidad crece y Lume se convierte en el GitHub del soporte técnico. Network effect difícil de copiar.

Modelo de ingresos adicional: scripts premium de pago, con revenue share para los autores.

---

## 4. Diferenciales bonus (roadmap post-MVP)

- **Traducción en tiempo real** de la pantalla y la voz (ideal para soporte internacional, mercado español, latino, europeo).
- **Cobro automático por sesión** (ideal para freelancers, MSP que cobran por hora).
- **Integración nativa** con Slack, Discord, Teams, WhatsApp Business.
- **Acceso a móviles** con calidad nativa (Android API, iOS vía WebRTC cuando sea posible).
- **Análisis de productividad**: paneles que muestran tiempo medio de resolución, problemas recurrentes, eficiencia por técnico.
- **Modo presentación inverso**: el cliente toma control parcial mientras el técnico explica, con handoff fluido.
- **Generación automática de tickets** al final de la sesión, integrada con Jira, Linear, Zendesk, etc.

---

## 5. Modelo de negocio

### Tiers

**Free (Hobby)**

- Uso personal, no comercial
- Hasta cinco sesiones al mes
- Recursos básicos (sin IA, sin grabación)
- Lume muestra branding al cliente
- Atrae a estudiantes, devs hobbyistas, primer contacto

**Pro (€19/mes por técnico)**

- Uso profesional ilimitado
- Copilot IA, grabación básica, marketplace
- Sin branding al cliente, white-label opcional
- Soporte por email
- Público: freelancers, técnicos autónomos

**Team (€49/mes por técnico, mínimo 3)**

- Todo lo del Pro y colaboración multi-técnico
- Panel de administración
- Time travel completo, automatizaciones ilimitadas
- Integraciones (Slack, Teams, etc.)
- SSO básico
- Público: MSP, departamentos de TI, agencias

**Enterprise (a medida)**

- Self-hosted disponible
- SSO avanzado (Okta, Azure AD, SAML)
- SLA, soporte dedicado, on-call
- Personalización, integraciones a medida
- Audit logs avanzados, compliance
- Público: corporativo, administración pública, sanidad, financiero

### Estrategia de pricing

TeamViewer Premium cuesta unos 700 € anuales. Lume Pro a 19 €/mes queda en 228 € anuales, tres veces más barato con el triple de recursos. Pero el pricing no va solo de ser barato, va de ser justo y transparente. Sin letra pequeña, sin "uso comercial detectado", sin upsell agresivo.

### Mercados objetivo iniciales

1. **España y Portugal** (ventaja geográfica, idioma, conocimiento de mercado)
2. **Latinoamérica** (mercado enorme mal atendido, dolor con TeamViewer caro en dólar/euro)
3. **Europa Occidental** (el foco en privacidad resuena fuerte)
4. **Mercados regulados globales** (sanidad, jurídico, administración pública)

---

## 6. Arquitectura técnica

### Stack recomendado

**Backend (ya lo dominas)**

- NestJS + TypeScript
- PostgreSQL + Prisma
- Redis (sesiones, caché, colas)
- BullMQ para jobs asíncronos

**Comunicación en tiempo real**

- WebSockets (Socket.io o nativo) para señalización
- WebRTC para conexión peer-to-peer entre técnico y cliente
- mediasoup o Pion (Go) para SFU en sesiones multi-técnico
- Servidores TURN propios (coturn) para NAT traversal

**Frontend web**

- React 18 + TypeScript + Vite (mismo stack que Roomly)
- Tailwind CSS + shadcn/ui
- Zustand para state, TanStack Query para data fetching
- React Router

**Cliente desktop**

- Tauri (Rust + Web), multiplataforma, ligero, seguro
- Reutiliza gran parte del frontend web
- Captura de pantalla nativa vía APIs del sistema operativo
- Tamaño del binario: objetivo de menos de 15 MB

**Móvil**

- React Native para iOS/Android (técnico)
- PWA para clientes (recibe sesión sin instalar app)

**Infraestructura**

- Cloudflare para edge (CDN, DDoS, Workers para señalización ligera)
- AWS, Hetzner o ambos para servidores core
- Servidores TURN distribuidos geográficamente
- Observabilidad: Grafana + Prometheus + Loki

**IA**

- API Anthropic (Claude) para Copilot, con fallback OpenAI
- OCR vía Tesseract local + visión por ordenador vía APIs cloud cuando sea necesario
- Pipeline de privacidad: los datos sensibles no salen nunca de la infra del cliente en planes Enterprise

### Estructura de monorepo

```
lume/
├── apps/
│   ├── web/                    # Panel web (técnicos y admins)
│   ├── desktop/                # Cliente Tauri (técnico y/o agente)
│   ├── mobile/                 # App React Native
│   ├── client-web/             # Página de sesión para el cliente final
│   └── api/                    # Backend NestJS
├── packages/
│   ├── ui/                     # Design system compartido
│   ├── protocol/               # Contratos de comunicación (shared types)
│   ├── webrtc/                 # Wrapper WebRTC con fallback
│   ├── copilot/                # SDK del Copilot IA
│   └── shared/                 # Utils, types, validators (Zod)
├── services/
│   ├── signaling/              # Servidor de señalización WebSocket
│   ├── turn/                   # Configuración coturn
│   ├── relay/                  # Servidor de relay para casos extremos
│   └── recording/              # Pipeline de grabación e indexado
├── infrastructure/
│   ├── terraform/              # IaC para AWS/Hetzner
│   ├── docker/                 # Dockerfiles y compose
│   └── kubernetes/             # Manifiestos K8s para escala
└── docs/
    ├── architecture/
    ├── api/
    └── runbooks/
```

### Flujo de una sesión típica

1. El técnico abre el panel web, hace clic en "Nueva sesión"
2. El backend genera un código corto (lume.io/k7m9p) y lo envía al cliente vía WhatsApp/email
3. El cliente abre el enlace, ve la pantalla de bienvenida con aviso claro de privacidad
4. El cliente hace clic en "Compartir pantalla", concede permiso vía API del navegador
5. WebRTC negocia conexión peer-to-peer (ICE, STUN, TURN si hace falta)
6. La sesión arranca con cifrado E2E
7. El Copilot IA se activa (con aviso al cliente) y empieza a observar
8. La grabación arranca (con consentimiento explícito)
9. El técnico resuelve el problema, con ayuda de la IA, automatizaciones y compañeros si hace falta
10. La sesión termina, la IA genera un resumen, se crea un ticket, el cliente recibe el informe

---

## 7. Roadmap de desarrollo

### Fase 1: Cimientos (semanas 1 a 6)

- Monorepo configurado (Turborepo o Nx)
- Backend NestJS con auth (email + magic link, Google, Microsoft)
- Schema de la base de datos (users, organizations, sessions, recordings)
- Panel web básico (login, dashboard, crear sesión)
- Servidor de señalización WebSocket
- Conexión WebRTC funcional (el técnico ve la pantalla del cliente, control del ratón)

**Hito**: primera sesión remota funcional entre dos navegadores.

### Fase 2: Cliente nativo (semanas 7 a 12)

- Cliente Tauri para Windows, macOS, Linux
- Captura de pantalla y control nativo en cada SO
- Empaquetado y auto-update
- Rendimiento optimizado (códec, bitrate adaptativo)
- Multimonitor

**Hito**: cliente desktop estable en todos los SO principales.

### Fase 3: Diferenciales (semanas 13 a 20)

- Copilot IA integrado
- Grabación de sesiones con transcripción
- Modo Whisper
- Multi-técnico (sin handoff todavía)
- Marketplace de automatizaciones (versión básica)

**Hito**: producto listo para early access de pago.

### Fase 4: Escala y enterprise (semanas 21 a 30)

- Self-hosted (Docker compose + documentación)
- SSO (SAML, Okta, Azure AD)
- Audit logs completos
- Time travel completo (búsqueda por OCR)
- App móvil (React Native)
- Integraciones (Slack, Teams, Jira)

**Hito**: listo para ventas enterprise.

### Fase 5: Crecimiento (mes 8 en adelante)

- Localización completa (10 idiomas)
- Marketplace público con revenue share
- API pública, webhooks
- Cobro por sesión (para freelancers)
- Integraciones verticales (sanidad, jurídico)

---

## 8. Métricas de éxito

**Técnicas**

- Latencia mediana por debajo de 80ms en buenas conexiones
- Frame rate mínimo de 30fps en conexiones medias
- Tiempo de conexión inicial por debajo de 5 segundos
- Uptime del 99,9%

**Producto**

- NPS por encima de 50
- Tiempo medio hasta la primera sesión (TTFV) por debajo de 3 minutos
- Tasa de conversión de Free a Pro por encima del 8%
- Churn mensual por debajo del 3%

**Negocio**

- MRR objetivo: 100.000 € en 12 meses
- CAC payback por debajo de 6 meses
- LTV/CAC por encima de 3

---

## 9. Riesgos y mitigaciones

**Riesgo**: TeamViewer reacciona con precio.
**Mitigación**: nuestro foso no es el precio, es IA, colaboración, privacidad. Difícil de copiar.

**Riesgo**: incidente de seguridad (el acceso remoto es un objetivo).
**Mitigación**: bug bounty desde el primer día, auditorías externas, transparencia total ante incidentes.

**Riesgo**: WebRTC no escala en corner cases.
**Mitigación**: arquitectura híbrida P2P + SFU + relay, con fallbacks claros.

**Riesgo**: dependencia de APIs de IA caras.
**Mitigación**: modelos open source (Llama, Qwen) como fallback, procesamiento local cuando sea posible.

**Riesgo**: mercado conservador (TI corporativa) tarda en adoptar.
**Mitigación**: empezar por SMB y MSP, subir de mercado más adelante con Enterprise.

---

## 10. Próximos pasos inmediatos

1. Reservar dominio: lume.io, lume.app, getlume.com (comprobar disponibilidad)
2. Reservar handles en redes sociales
3. Crear landing page de "coming soon" con captura de email
4. Configurar monorepo, CI/CD básico
5. Empezar por la Fase 1 del roadmap usando el prompt de Claude Code adjunto
6. Entrevistar a 20 clientes potenciales (técnicos, MSP, despachos de TI) para validar dolores
7. Definir identidad visual con un diseñador (logo, paleta, tipografía)

---

Este documento es vivo. Las actualizaciones de versión deben registrarse en CHANGELOG.md del repositorio principal.
