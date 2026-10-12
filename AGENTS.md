# Vooxline
App de gestión de fuerza laboral para contact center B2B (tipo ConnectTeams).

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

## Forma de trabajo (regla de Carlos, obligatoria también para ayudantes en paralelo)
- Ponytail: el código más corto que funcione; revisar cambios con `/ponytail-review`.
- Agent Skills: cada módulo nuevo sigue `/spec` → `/plan` → `/build` → `/test` → `/review` → `/ship`.
- Claude Mem: consultar la memoria al empezar y guardar las decisiones importantes.
- Avisar del costo en tokens antes de lanzar varios ayudantes en paralelo.

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
