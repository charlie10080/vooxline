# Vooxline - Plataforma B2B & Contact Center de Nueva Generación

Vooxline es una plataforma omnicanal de alto rendimiento para gestión de Contact Centers B2B, telefonía WebRTC SIP, telemetría en tiempo real y supervisión ejecutiva.

---

## 🚀 Módulos Principales

1. **Landing Page Pública (`/`)**
   - Presentación ejecutiva de servicios B2B, propuesta de valor, telemetría simulada en tiempo real y formulario para agendar demostraciones.

2. **Portal de Autenticación (`/login`)**
   - Acceso con credenciales corporativas, verificación de token SIP Vault y redirección al Centro de Mando.

3. **Portal del Agente (`/agente`)**
   - Reloj checador de jornada laboral, estado ACD (Disponible, En Llamada, After Call Work, Receso), telemetría remota de red/periféricos y cola omnicanal.

4. **Dashboard B2B Cliente Executivo (`/cliente`)**
   - Resumen de métricas operativas, SLA de voz, facturación por minuto, nivel de ocupación y supervisión de campañas.

5. **Centro de Mando Maestro / Super Admin (`/admin`)**
   - Visualización global del cluster, directorio de usuarios, historial de auditoría y monitor en vivo. Soporte multilingüe (ES / EN).

---

## 🛠️ Tecnologías Utilizadas

- **Core:** React 19 + TypeScript + Vite 8
- **Routing:** React Router v7
- **Styling:** Tailwind CSS v4 + Google Fonts (Plus Jakarta Sans, Sora, JetBrains Mono, Material Symbols)
- **Icons:** Lucide React & Google Material Symbols Outlined
- **Linting & Code Quality:** Oxlint
- **Testing:** Vitest + React Testing Library + JSDOM

---

## 💻 Desarrollo Local

### Requisitos
- Node.js >= 18
- npm

### Pasos para ejecutar

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Ejecutar el linter (Oxlint)
npm run lint

# Ejecutar pruebas unitarias (Vitest)
npm run test

# Compilar para producción
npm run build
```

---

## 🔒 Cifrado & Seguridad

- WebRTC SRTP & TLS 1.3
- Certificación HIPAA & SOC2 Type II (simulada)
- Cifrado Vault AES-256

---

## 📑 Licencia y Créditos

© 2025 Vooxline Inc. Todos los derechos reservados.
