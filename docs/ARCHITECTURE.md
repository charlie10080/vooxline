# Vooxline: mapa de arquitectura (estado actual)

Frontend: React 19 + Vite + TypeScript + Tailwind 4 + zustand. **Todo el estado vive en el navegador (localStorage).** No hay backend todavía: el código está ordenado para que cada store se cambie por llamadas a un API sin rehacer las pantallas (ver sección 6).

## 1. Una plataforma web completa, un mismo código

Vooxline es una plataforma web completa. La web pública, el login y los portales de cliente y admin son parte esencial del sitio. El módulo tipo Connecteam (consola + portal de trabajadores) es solo el apartado interno para los trabajadores de la empresa y convive con el resto; no lo reemplaza.

| Área | Quién la usa | Layout |
|---|---|---|
| Web pública (`/inicio`), login (`/login`) | Visitantes y clientes | Propio de cada página |
| Portal de cliente (`/cliente`), panel del agente clásico (`/agente`) | Clientes / agentes | Propio de cada página |
| `/admin` redirige a la consola `/` | Administradores | El admin usa la consola (un solo diseño, datos reales). `layouts/AdminLayout.tsx` y `pages/admin/` quedan sin ruta como referencia de diseño |
| Consola (`/`, `/time-clock`, …) | Supervisores y administradores | `components/layout/AppLayout.tsx` (redirige a `/portal` si el usuario es agente) |
| Portal del agente (`/portal/...`) | Agentes (y supervisores para su propio turno) | `components/layout/PortalLayout.tsx` |

El usuario actual sale de `useSessionStore` (`useCurrentUser()` devuelve agente, perfil, rol e `isManager`). El menú "Entrar como" permite probar con cualquier usuario. **No hay contraseñas**: con backend esto lo reemplaza el inicio de sesión real.

## 2. Rutas

| Ruta consola | Ruta portal | Página | Estado |
|---|---|---|---|
| `/` | | Resumen (Overview) | Funcional (local) |
| `/activity` | | Actividad | Funcional (local; no es auditoría real) |
| `/monitor` | | Monitor en vivo | **Simulado** (sin audio ni telefonía) |
| `/users`, `/groups`, `/director` | | Usuarios, Grupos inteligentes, Directorio | Funcional (local) |
| `/automations` | | Automatizaciones | Funcional (local) |
| `/chat` | `/portal/chat` | Chat | Funcional (local, sin tiempo real) |
| `/updates` | `/portal/avisos` | Avisos con confirmación de lectura | Funcional (local) |
| `/forms` | `/portal/formularios` | Formularios | Funcional (local) |
| `/helpdesk` | `/portal/soporte` | Help Desk | Funcional (local) |
| `/time-clock` | `/portal` | Time Clock / Mi turno (GPS, descansos) | Funcional (local) |
| `/scheduling` | `/portal/horario` | Horarios, turnos abiertos e intercambios | Funcional (local) |
| | `/portal/horas` | Hoja de horas del agente | Funcional (local) |
| `/time-off` | `/portal/permisos` | Vacaciones y permisos | Funcional (local) |
| `/payroll` | | Rentabilidad y nómina | Funcional (local, exporta CSV) |
| `/celebrations` | `/portal/reconocimientos` | Celebraciones, puntos y premios | Funcional (local) |

Las páginas compartidas se adaptan al rol con `useCurrentUser()`: los supervisores gestionan y los agentes participan.

## 3. Stores (un dominio por store, cada uno con su clave en localStorage, `version: 1`)

| Store | Clave | Contiene | Depende de |
|---|---|---|---|
| `useWorkforceStore` | `vooxline-workforce` | agents (con ubicación autorizada), campaigns, timeEntries (GPS, descansos), timeOffRequests | (nadie) |
| `useDirectoryStore` | `vooxline-directory` | profiles (correo, rol, activo), groups | workforce |
| `useSessionStore` | `vooxline-session` | usuario actual | workforce, directory (solo lectura) |
| `useScheduleStore` | `vooxline-schedule` | shifts, openShifts, claims, swaps | workforce, directory |
| `useLiveStore` | `vooxline-live` | calls, monitoring, monitorLog | workforce |
| `useChatStore` | `vooxline-chat` | conversaciones, mensajes, lecturas | sesión, directorio |
| `useUpdatesStore` | `vooxline-updates` | avisos, lecturas, confirmaciones, comentarios | sesión, directorio |
| `useFormsStore` | `vooxline-forms` | plantillas y respuestas | sesión, directorio |
| `useHelpdeskStore` | `vooxline-helpdesk` | tickets, conversación, historial | sesión, directorio |
| `useCelebrationsStore` | `vooxline-celebrations` | cumpleaños, reconocimientos, premios, canjes | sesión, directorio, workforce |
| `useActivityStore` | `vooxline-activity` | events (máx. 300) | (los alimenta `lib/activityTracker.ts`) |

Regla: **no hay dependencias circulares**. `useWorkforceStore` NO importa a los demás.

## 4. Reglas de negocio y dónde viven

| Regla | Dónde |
|---|---|
| Desviación de horas > 15 min requiere confirmación del supervisor | `lib/metrics.ts` + `approveEntry` |
| Banderas de puntualidad y de ubicación también requieren revisión | `lib/punctuality.ts` (`entryNeedsReview`) |
| Ubicación al marcar: dentro/fuera del radio, permiso negado o sin ubicación | `lib/geo.ts` + `clockIn`/`clockOut` |
| Descansos: no se inicia dos veces; salir en descanso cierra el descanso | `startBreak`/`endBreak`/`clockOut` |
| Vacaciones descuentan PTO; solicitudes se validan y el agente puede retirar las pendientes | `createTimeOff`, `approveTimeOff`, `cancelTimeOff` |
| Turnos: sin traslapes, sin permisos aprobados, sin usuarios inactivos (también al tomar turnos abiertos e intercambiar) | `useScheduleStore` (`validate`) |
| Chat: solo miembros leen y escriben; canales de anuncios solo para supervisores | `lib/chat.ts`, `useChatStore` |
| Avisos: solo la audiencia los ve; confirmaciones y recordatorios | `lib/updates.ts`, `useUpdatesStore` |
| Formularios: respuestas obligatorias, rangos, una por día, puntaje QA, CSV | `lib/forms.ts` |
| Help Desk: SLA por prioridad, transiciones de estado, reapertura 72 h | `lib/helpdesk.ts` |
| Puntos: reconocimiento de compañero 50, de supervisor 100; canje según saldo y stock | `lib/celebrations.ts` |
| Tolerancia de puntualidad 15 min; olvido de marcaje a los 30 min | `lib/punctuality.ts` |

## 5. Reinicio

Solo `resetApplicationState()` (`lib/globalReset.ts`). Reinicia todos los stores de datos a la vez, sin generar eventos falsos, y deja UN evento de sistema en Actividad.

## 6. Paso a backend

Cada store es la frontera con los datos: las páginas solo llaman acciones que devuelven `{ ok } | { ok: false, reason }`. Para pasar a backend:

1. Crear las tablas a partir de `src/types/*` (cada tipo es una tabla o documento).
2. Cambiar cada acción del store por una llamada al API que devuelva el mismo resultado; las reglas de `src/lib/*` se ejecutan en el servidor (y se pueden seguir usando en el navegador para validar antes de enviar).
3. Reemplazar `useSessionStore` por el inicio de sesión real y aplicar los permisos por rol en el servidor (hoy se revisan solo en el navegador).
4. Chat, avisos y notificaciones necesitan tiempo real (WebSockets o similar).
5. La ubicación y las alertas deben guardarse en el servidor para que el agente no pueda borrarlas.

**Estado actual (Supabase):**
- `src/lib/supabase.ts`: cliente solo si hay `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. `isRemote(dominio)` se enciende por `.env` con `VITE_REMOTE_DOMAINS` (ej. `identity`). Sin eso, todo sigue local.
- `src/api/<dominio>.ts`: llamadas al backend con el mismo contrato `{ ok } | { ok: false, reason }`.
- Fase A (`identity`): el Login entra con Supabase Auth y sincroniza los perfiles al directorio. En modo remoto se ocultan los accesos demo y "Entrar como".
- SQL en `supabase/migrations/` (en orden) y datos demo en `supabase/seed.sql`. La seguridad real está en las políticas RLS; las guardias del frontend son solo navegación.

## 7. Deuda técnica conocida

- **Aprobar lote** aplica la regla de puntualidad dentro de la página Time Clock, no en el store.
- Los datos de ejemplo se generan **relativos a la fecha de carga**; después de unos días conviene el reinicio global.
- Las claves de localStorage tienen `version: 1` y no hay migraciones: si cambias un tipo persistido, sube la versión o pide un reinicio.
- Los permisos por rol se revisan en los stores del navegador, que cualquiera puede manipular. Con backend deben vivir en el servidor.
- Dos pestañas abiertas no se sincronizan entre sí.
- Sin ruta y guardadas como referencia de diseño: `ClientDashboardPage`, `AdminCommandCenterPage`, `AgentPortalPage`, `layouts/AdminLayout.tsx` y `pages/admin/*`. `LandingPage` y `LoginPage` sí están en uso.
