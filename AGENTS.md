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
