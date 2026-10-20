# BRIZ (`briz.com.bo`) — INVENTARIO OFICIAL DE ARTES GRÁFICOS EN INGLÉS (PRIORIDAD 3)

> **Propósito:** Documentar todas las piezas gráficas con texto incrustado en el sitio web público de BRIZ (`HomePage.tsx` y `AboutPage.tsx`), distinguir cuáles ya tienen versión real en inglés, cuáles siguen en español dentro de las carpetas `/Ingles/` o no existen, y especificar las dimensiones y textos exactos en inglés natural para el equipo de diseño.

---

## 1. PROBLEMAS DETECTADOS EN LA AUDITORÍA GRÁFICA Y CORRECCIÓN APLICADA

1. **Error 404 en `AboutPage.tsx` al cambiar a inglés (`language === 'en'`):**
   - `AboutPage.tsx` construía las rutas `/Conocenos-web/Ingles/1.webp`, `2.webp`, `3.webp` y `/Conocenos-celular/Ingles/1.webp`, `2.webp`, `3.webp`.
   - Esos archivos `.webp` **NO EXISTEN** en `/Ingles/` (solo existen archivos `.png`, y además esos `.png` contienen el diseño en español sin traducir).
   - **Corrección aplicada:** Se creó el registro centralizado `src/lib/artworkRegistry.ts` que resuelve cada arte según su estado real de verificación (`hasVerifiedEnWeb` / `hasVerifiedEnMobile`). Si el arte en inglés aún no existe o sigue en español, sirve de forma segura el arte original optimizado (`.webp`) sin romper la página ni causar errores 404.
2. **Archivos en `/Ingles/` que aún contienen texto en español:**
   - `/menu-principal-web/Ingles/2.png` -> Muestra *"SERVICIO TÉCNICO"* en español.
   - `/menu-principal-celular/Ingles/2.png` -> Muestra *"SERVICIO TÉCNICO"* en español.
   - `/menu-principal-celular/Ingles/3.png` -> Muestra *"ACCESORIOS Y REPUESTOS"* en español.
   - `/menu-principal-celular/Ingles/4.png` -> Muestra *"PASEOS Y RUTAS"* en español.
   - `/Conocenos-web/Ingles/1.png`, `2.png`, `3.png`, `4.png` -> Todos están en español.
   - `/Conocenos-celular/Ingles/1.png`, `2.png`, `3.png`, `4.png` -> Todos están en español.

---

## 2. TABLA MAESTRA DE ARTES CON TEXTO INCRUSTADO

| # | Slot ID (`artworkRegistry.ts`) | Archivo Original (Español) | Versión Dispositivo | Dimensiones (px) | Texto Actual en Español | Traducción Natural Recomendada (Inglés) | Estado Actual | Ruta Final Esperada (Inglés) | Componente donde se usa |
| :- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `home_welcome_badge` | `/Bienvenidos.png` | Web + Móvil | `969 × 168` | *"BIENVENIDOS"* | **"WELCOME"** | **TRADUCIDO Y CONECTADO** | `/welcome.png` | `src/pages/public/HomePage.tsx` (Hero superior) |
| 2 | `home_hero_vive` | `/vive.webp` | Web + Móvil | `1159 × 250` | *"¡Vive Cochabamba en bicicleta! Alquila fácil, rápido y seguro"* | **"Experience Cochabamba by bike! Rent easily, fast, and safely"** | **FALTA DISEÑAR** (Fallback seguro a `/vive.webp`) | `/live-cochabamba.webp` | `src/pages/public/HomePage.tsx` (Hero principal) |
| 3 | `home_bento_1_rentals` | `/menu-principal-web/1.webp` | Web (PC) | `1467 × 959` | *"ALQUILA UNA BICI"* | **"RENT A BIKE"** | **TRADUCIDO Y CONECTADO** | `/menu-principal-web/Ingles/1.png` | `src/pages/public/HomePage.tsx` (Bento Grid #1) |
| 4 | `home_bento_1_rentals` | `/menu-principal-celular/1.webp` | Móvil | `1027 × 1018` | *"ALQUILA UNA BICI"* | **"RENT A BIKE"** | **TRADUCIDO Y CONECTADO** | `/menu-principal-celular/Ingles/1.png` | `src/pages/public/HomePage.tsx` (Bento Grid #1) |
| 5 | `home_bento_2_service` | `/menu-principal-web/2.webp` | Web (PC) | `1467 × 960` | *"SERVICIO TÉCNICO"* | **"BIKE REPAIR & SERVICE"** (o **"TECHNICAL SERVICE"**) | **EN ESPAÑOL DENTRO DE `/Ingles/`** (Fallback activo) | `/menu-principal-web/Ingles/2.png` | `src/pages/public/HomePage.tsx` (Bento Grid #2) |
| 6 | `home_bento_2_service` | `/menu-principal-celular/2.webp` | Móvil | `1028 × 1020` | *"SERVICIO TÉCNICO"* | **"BIKE REPAIR & SERVICE"** (o **"TECHNICAL SERVICE"**) | **EN ESPAÑOL DENTRO DE `/Ingles/`** (Fallback activo) | `/menu-principal-celular/Ingles/2.png` | `src/pages/public/HomePage.tsx` (Bento Grid #2) |
| 7 | `home_bento_3_shop` | `/menu-principal-web/3.webp` | Web (PC) | `1467 × 959` | *"ACCESORIOS Y REPUESTOS"* | **"ACCESSORIES & SPARE PARTS"** | **TRADUCIDO Y CONECTADO** | `/menu-principal-web/Ingles/3.png` | `src/pages/public/HomePage.tsx` (Bento Grid #3) |
| 8 | `home_bento_3_shop` | `/menu-principal-celular/3.webp` | Móvil | `1027 × 1021` | *"ACCESORIOS Y REPUESTOS"* | **"ACCESSORIES & SPARE PARTS"** | **EN ESPAÑOL DENTRO DE `/Ingles/`** (En móvil usa fallback a `Ingles/3.png` web o `3.webp`) | `/menu-principal-celular/Ingles/3.png` | `src/pages/public/HomePage.tsx` (Bento Grid #3) |
| 9 | `home_bento_4_routes` | `/menu-principal-web/4.webp` | Web (PC) | `1467 × 959` | *"PASEOS Y RUTAS"* | **"TOURS & ROUTES"** | **TRADUCIDO Y CONECTADO** | `/menu-principal-web/Ingles/4.png` | `src/pages/public/HomePage.tsx` (Bento Grid #4) |
| 10 | `home_bento_4_routes` | `/menu-principal-celular/4.webp` | Móvil | `1028 × 1020` | *"PASEOS Y RUTAS"* | **"TOURS & ROUTES"** | **EN ESPAÑOL DENTRO DE `/Ingles/`** (Fallback activo) | `/menu-principal-celular/Ingles/4.png` | `src/pages/public/HomePage.tsx` (Bento Grid #4) |
| 11 | `about_slide_1` | `/Conocenos-web/1.webp` | Web (PC) | `1920 × 647` | *"¡Pedalea con nosotros y siente la brisa! / Nuestra historia comenzó el 25 de mayo de 2021..."* | **"Ride with us and feel the breeze! / Our story began on May 25, 2021, driven by the dream of promoting cycling in Cochabamba and building a healthier, freer, and more sustainable city."** | **EN ESPAÑOL DENTRO DE `/Ingles/`** (Fallback a `1.webp`) | `/Conocenos-web/Ingles/1.webp` | `src/pages/public/AboutPage.tsx` (Slide 1) |
| 12 | `about_slide_1` | `/Conocenos-celular/1.webp` | Móvil | `1919 × 1141` | *"¡Pedalea con nosotros y siente la brisa! / Nuestra historia comenzó el 25 de mayo de 2021..."* | **"Ride with us and feel the breeze! / Our story began on May 25, 2021..."** | **EN ESPAÑOL DENTRO DE `/Ingles/`** (Fallback a `1.webp`) | `/Conocenos-celular/Ingles/1.webp` | `src/pages/public/AboutPage.tsx` (Slide 1) |
| 13 | `about_slide_2` | `/Conocenos-web/2.webp` | Web (PC) | `1920 × 647` | *"Misión y Visión: Impulsar la movilidad sostenible y experiencias inolvidables sobre dos ruedas..."* | **"Mission & Vision: Driving sustainable urban mobility and unforgettable two-wheel experiences in Bolivia."** | **EN ESPAÑOL DENTRO DE `/Ingles/`** (Fallback a `2.webp`) | `/Conocenos-web/Ingles/2.webp` | `src/pages/public/AboutPage.tsx` (Slide 2) |
| 14 | `about_slide_2` | `/Conocenos-celular/2.webp` | Móvil | `1919 × 1141` | *"Misión y Visión..."* | **"Mission & Vision..."** | **EN ESPAÑOL DENTRO DE `/Ingles/`** (Fallback a `2.webp`) | `/Conocenos-celular/Ingles/2.webp` | `src/pages/public/AboutPage.tsx` (Slide 2) |
| 15 | `about_slide_3` | `/Conocenos-web/3.webp` | Web (PC) | `1920 × 647` | *"Nuestros Valores: Pasión, Comunidad, Seguridad y Respeto por el Medio Ambiente."* | **"Our Values: Passion, Community, Safety, and Respect for the Environment."** | **EN ESPAÑOL DENTRO DE `/Ingles/`** (Fallback a `3.webp`) | `/Conocenos-web/Ingles/3.webp` | `src/pages/public/AboutPage.tsx` (Slide 3) |
| 16 | `about_slide_3` | `/Conocenos-celular/3.webp` | Móvil | `1919 × 1141` | *"Nuestros Valores..."* | **"Our Values..."** | **EN ESPAÑOL DENTRO DE `/Ingles/`** (Fallback a `3.webp`) | `/Conocenos-celular/Ingles/3.webp` | `src/pages/public/AboutPage.tsx` (Slide 3) |

---

## 3. CÓMO ACTIVAR UN ARTE NUEVO EN INGLÉS CUANDO EL DISEÑADOR LO ENTREGUE

1. Coloca el archivo exportado en la ruta indicada en la columna **"Ruta Final Esperada (Inglés)"** dentro de `public/`.
2. Abre [`src/lib/artworkRegistry.ts`](./src/lib/artworkRegistry.ts) y cambia `hasVerifiedEnWeb: true` o `hasVerifiedEnMobile: true` en el slot correspondiente.
3. No hace falta modificar `HomePage.tsx` ni `AboutPage.tsx`.
