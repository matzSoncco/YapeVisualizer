# LectorYape - Web Visualizer

Panel de control web diseñado para visualizar en tiempo real las notificaciones de pago sincronizadas desde la aplicación móvil.

## Funcionalidades
- **Autenticación:** Login seguro con Google Firebase.
- **Real-time:** Actualización instantánea de la tabla sin recargar la página.
- **Estadísticas:** Cálculo automático de totales, promedios y cantidad de transacciones del día.
- **Privacidad:** Filtro estricto por `userEmail` (cada usuario solo ve sus propios datos).

## Requisitos Técnicos
- **Frontend:** Vue.js 3 (Vite)
- **Base de Datos:** Firebase Firestore
- **Estilos:** CSS3 Custom Properties (Diseño Responsivo)

## Configuración
1. Instalar dependencias: `npm install`
2. Configurar variables de entorno en un archivo `.env`:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_PROJECT_ID`
   - (etc...)
3. Ejecutar en desarrollo: `npm run dev`
4. Construir para producción: `npm run build`

> **Nota:** Este repositorio corresponde únicamente al Login y Dashboard Web para la visualización de datos. El servicio de captura de datos reside en el repositorio del agente Android