# POSVirtual (no definido el nombre aún) - SaaS Web Visualizer & POS Admin

**Este proyecto** es una plataforma SaaS (Software as a Service) orientada a negocios locales y comerciales que necesitan centralizar, auditar y verificar sus ingresos digitales y físicos en tiempo real. 

El sistema actúa como un panel de control maestro que recibe notificaciones de pago sincronizadas desde una aplicación móvil (agente Android) y ofrece herramientas de gestión multicaja, cierres diarios (cuadres) y administración de sucursales.

## El Ecosistema y Caso de Uso
El flujo principal resuelve el problema de la verificación de pagos a distancia:
1. **Captura:** Un dispositivo Android en la tienda física intercepta las notificaciones de pago (ej. Yape, Plin).
2. **Sincronización:** Los datos se envían a Firebase de manera instantánea.
3. **Visualización y Auditoría:** El dueño del negocio, mediante este panel web, verifica las transacciones, revisa los cierres de caja y gestiona el rendimiento de todas sus sedes desde un solo lugar.
4. **Módulo de caja:** El usuario (normalmente cajero), mediante este panel web, verifica las transacciones, realiza acciones normales de apertura y cierre de caja y venta de productos.

## Funcionalidades Principales

### Gestión de Sucursales (Multitenant)
- **Control Multi-Sede:** Capacidad de crear y gestionar múltiples tiendas bajo una misma cuenta principal, limitado según el plan de suscripción del usuario (en desarrollo).
- **Selector de Entorno:** Interfaz que permite al usuario alternar entre la vista de cajero que permite solo lectura, ventas de una sede, etc., y el "Panel Administrador".

### Dashboard Administrativo (AdminView)
- **Resumen y KPIs:** Cálculo automático de métricas clave (totales, promedios, volumen de transacciones, etc).
- **Auditoría de Cierres (Cuadres):** Tabla histórica detallada para verificar los reportes de fin de turno de cada sucursal.
- **Filtros Avanzados:** Búsqueda dinámica de transacciones y cierres por rangos de fecha y sede específica.
- **Análisis Gráfico:** Visualización de tendencias de ventas y rendimiento comparativo entre sucursales (en desarrollo).

### Seguridad y Autorización (Grado Producción)
- **Autenticación Base:** Login seguro gestionado a través de Google Firebase Auth.
- **Bóveda de PIN Admin:** Sistema de autorización asíncrono para acciones sensibles (acceso al panel, modificaciones legales, etc).
- **Criptografía SHA-256:** Los PINs de seguridad se procesan mediante Web Crypto API, almacenando únicamente *hashes* irreversibles en la base de datos.

## Stack Tecnológico
- **Frontend:** [Vue.js 3](https://vuejs.org/) (Composition API) optimizado con [Vite](https://vitejs.dev/).
- **UI & Componentes:** [PrimeVue 4](https://primevue.org/) para interfaces modulares y [PrimeIcons](https://primevue.org/icons/) para iconografía.
- **Estilos:** CSS3 Custom Properties para un diseño moderno y amigable con el usuario.
- **Base de Datos & Backend:** [Firebase Firestore](https://firebase.google.com/docs/firestore) (Real-time updates) y Firebase Auth.

## Entorno de Producción
El proyecto se encuentra desplegado y escalando con negocios reales en fase de pruebas: **[Acceder a la Plataforma (Render)](https://yapevisualizer.onrender.com/)**

## Propiedad Intelectual
Este repositorio contiene software comercial y privativo. Queda estrictamente prohibida su copia, distribución o modificación sin autorización expresa.

> **Nota Arquitéctonica:** Este repositorio abarca exclusivamente el cliente web (Dashboard de Administración). El servicio encargado de la interceptación de notificaciones bancarias opera de manera independiente en el repositorio del agente Android.