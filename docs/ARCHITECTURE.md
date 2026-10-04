# Vooxline: mapa de arquitectura (estado actual)

Frontend: React 19 + Vite + TypeScript + Tailwind 4 + zustand. **Todo el estado vive en el navegador (localStorage).** No hay backend, ni usuarios con sesión, ni permisos.

## 1. Rutas

| Ruta | Página | Estado |
|---|---|---|
| `/` | Overview | Funcional (local) |
| `/time-clock` | Time Clock + Motor de Aprobación | Funcional (local) |
| `/time-off` | Time Off | Funcional (local) |
| `/payroll` | Rentabilidad y Nómina | Funcional (local, exporta CSV) |
| `/users` | Users | Funcional (local) |
| `/groups` | Smart Groups | Funcional (local) |
| `/scheduling` | Job Scheduling | Funcional (local) |
| `/monitor` | Monitor en Vivo | **Simulado** (sin audio ni telefonía) |
| `/activity` | Activity | Funcional (local; no es auditoría real) |
| `/automations`, `/chat`, `/updates`, `/director`, `/forms`, `/helpdesk`, `/celebrations` | Placeholder "En construcción" | Pendiente |

## 2. Stores (un dominio por store, cada uno con su clave en localStorage)

| Store | Clave | Contiene | Depende de |
|---|---|---|---|
| `useWorkforceStore` | `vooxline-workforce` | agents, campaigns, timeEntries, timeOffRequests | (nadie) |
| `useDirectoryStore` | `vooxline-directory` | profiles (correo, rol, activo), groups | workforce |
| `useScheduleStore` | `vooxline-schedule` | shifts | workforce, directory |
| `useLiveStore` | `vooxline-live` | calls, monitoring, monitorLog, simulationEnabled | workforce |
| `useActivityStore` | `vooxline-activity` | events (máx. 300) | (los alimenta `lib/activityTracker.ts`, que observa los otros 4) |

Regla: **no hay dependencias circulares**. `useWorkforceStore` NO importa los demás; por eso `clockIn(agentId, scheduledMinutes?)` recibe los minutos del turno como parámetro.

## 3. Reglas de negocio y dónde viven

| Regla | Dónde |
|---|---|
| Desviación de horas > 15 min requiere confirmación del supervisor | `lib/metrics.ts` (`needsSupervisorReview`) + `approveEntry` |
| Entradas con bandera de puntualidad también requieren revisión | `lib/punctuality.ts` (`entryNeedsReview`). Las páginas deben usar esta función |
| No se aprueba una entrada con turno abierto | `approveEntry` |
| Vacaciones descuentan PTO; permiso médico/personal no; PTO insuficiente se rechaza | `approveTimeOff` |
| No se desactiva a un usuario con turno abierto | `useDirectoryStore.setUserActive` |
| Un turno no puede traslaparse, caer en un permiso aprobado ni asignarse a un usuario inactivo | `useScheduleStore` (`validate`) |
| Las llamadas solo entran a agentes con turno abierto y disponibles; si el agente se desconecta, la llamada termina | `useLiveStore` |
| Tolerancia de puntualidad 15 min; olvido de marcaje a los 30 min del fin del turno; ausencias: hoy y ayer | `lib/punctuality.ts` |

## 3.1 Deuda técnica conocida

- **Aprobar Lote** aplica la regla de puntualidad dentro de la página Time Clock, no en el store (el `approveBatch` del store solo conoce la regla de horas). Mover a una función compartida cuando haya backend.
- Los datos de ejemplo (turnos, entradas, llamadas) se generan **relativos a la fecha de carga**; después de unos días conviene el reinicio global.
- Las claves de localStorage tienen `version: 1` y no hay migraciones: si cambias un tipo persistido, sube la versión o pide un reinicio.
- El rol de cada usuario (agente/supervisor/admin) se guarda pero **no se hace cumplir**: cualquiera puede aprobar.
- Dos pestañas abiertas no se sincronizan entre sí.

## 4. Reinicio

Solo `resetApplicationState()` (`lib/globalReset.ts`). Reinicia los 4 stores de datos a la vez, sin generar eventos falsos, y deja UN evento de sistema en Activity. La interfaz no debe exponer los reinicios individuales de cada store.

## 5. Qué es local y qué necesitaría backend

| Módulo | Hoy | Con backend real |
|---|---|---|
| Time Clock, Time Off, Payroll, Scheduling, Users, Groups | Local | Tablas + autenticación + permisos por rol |
| Monitor en Vivo | Simulado | Telefonía (Twilio/Telnyx) + WebSockets |
| Activity | Local, borrable | Registro de auditoría en el servidor con el usuario real |
| Chat, Help Desk, Forms, Updates, Director | No existen | **Necesitan backend**: son multiusuario |
| Celebrations | No existe | Se puede derivar de fechas de ingreso (ya existen en los perfiles) |
