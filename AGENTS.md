# Vooxline
Plataforma web completa para contact center B2B. Conviven dos mundos en el mismo proyecto:
- Web pública y clientes: Landing (`/inicio`), Login, portal de Cliente y Admin. Son parte esencial del sitio; no se borran.
- Apartado interno de trabajadores tipo Connecteam: consola (`/`, `/time-clock`, …) y portal del agente (`/portal/...`). No reemplaza al resto de la web.

Stack: React 19, Vite, TypeScript, Tailwind 4, react-router-dom, zustand, lucide-react.

Reglas:
- Prohibido usar enum; usar uniones de strings.
- Usar `import type` para tipos.
- Alias @/ apunta a src/.
- Cada botón debe ejecutar una acción real sobre el store de zustand.
- Nada de links muertos: cada opción del menú tiene su ruta y su página.
- Datos mock en src/data/, modelos en src/types/, stores en src/store/.
- Tema oscuro, colores: fondo #0B0C10, acento #66FCF1.
- Trabajar un módulo a la vez. No tocar módulos que no se pidieron.

## Forma de trabajo (regla de Carlos: ahorrar tokens)
- Ponytail: el código más corto que funcione.
- Agent Skills: cada módulo nuevo sigue `/spec` → `/plan` → `/build` → `/test`. No usar `/ship` ni `/ponytail-review`.
- Revisión: `npm run build`, `npm run lint` y una mirada a mano solo a los puntos de riesgo.
- Sin ayudantes en paralelo; trabajar en secuencia.
- Memoria: la memoria local de Claude Code (no usar Claude Mem).
- No abrir el navegador salvo que Carlos lo pida.

## Arquitectura y convenciones

Lee docs/ARCHITECTURE.md antes de crear o cambiar nada.

### Datos
- Un dominio = un store. Las reglas de negocio viven en el store o en lib/, NUNCA duplicadas en las páginas.
- Las acciones de los stores devuelven `{ ok: true } | { ok: false; reason }`. Las páginas muestran un mensaje en español por cada `reason`.
- Sin dependencias circulares entre stores. useWorkforceStore no importa a los demás.
- Todos los reinicios pasan por `resetApplicationState()` de lib/globalReset.ts. No agregues botones que reinicien un solo store.
- Reglas de revisión del supervisor: usa `entryNeedsReview` de lib/punctuality.ts; no repitas la condición.

### Cambios
- No modifiques archivos existentes de types/, data/, lib/ ni store/ salvo que la tarea lo autorice de forma explícita. Si falta algo, dilo en vez de cambiarlo.
- Cambios quirúrgicos: no reemplaces archivos completos si solo hay que agregar o editar unas líneas.
- Antes de crear algo, revisa los tipos, stores y componentes (badges, modales, tablas, tarjetas) que ya existen y reutilízalos.

### Diseño
- Paleta: fondo #0B0C10, tarjetas #13151c, bordes #242E3B, acento #66FCF1. No uses las clases genéricas de color de Tailwind (slate, indigo, etc.).

### Calidad
- Sin enum (usa uniones de strings), `import type` para tipos, sin variables sin usar.
- `npm run build` y `npm run lint` deben pasar antes de dar por terminada una tarea.
- Los textos de la interfaz y los mensajes de error van en español.
