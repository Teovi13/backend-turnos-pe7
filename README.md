# Backend de Turnos y Reservas - Pre-entrega 7

API REST de servicios y reservas con MongoDB, a la que se suman **vistas con Handlebars** y **actualizaciones en tiempo real con Socket.io**. La API REST y la arquitectura en capas se mantienen.

## Instalación y ejecución

1. Tener un cluster de [MongoDB Atlas](https://www.mongodb.com/atlas) con un usuario y tu IP habilitada, y copiar la cadena de conexión.
2. Instalar, configurar y ejecutar:

```bash
git clone https://github.com/Teovi13/backend-turnos-pe7.git
cd backend-turnos-pe7
npm install
cp .env.example .env
npm run seed
npm start
```

`npm run seed` carga servicios de ejemplo si la colección está vacía.

## Variables de entorno

| Variable    | Ejemplo                                                                  |
| ----------- | ------------------------------------------------------------------------ |
| `PORT`      | `8080`                                                                   |
| `NODE_ENV`  | `development`                                                            |
| `MONGO_URI` | `mongodb+srv://usuario:clave@cluster0.xxxxx.mongodb.net/turnos_reservas` |

## Vistas

| Ruta                  | Contenido                                                                                       |
| --------------------- | ----------------------------------------------------------------------------------------------- |
| `/views/services`     | Listado de servicios (nombre, descripción, duración, precio, categoría y disponibilidad), formulario para crear y botones para activar, desactivar o eliminar |
| `/views/availability` | Servicios disponibles agrupados por categoría, contadores y lista de no disponibles             |

Los datos vienen de MongoDB a través de las mismas capas que la API:

```
views.router → views.controller → service → repository → DAO → model → MongoDB
```

## Tiempo real

Socket.io se configura en `src/sockets/socket.js`. Cuando la API crea, modifica o elimina un servicio, el controller emite un evento y `public/js/socket.js` actualiza la página sin recargar:

| Evento                 | Acción que lo dispara                     |
| ---------------------- | ----------------------------------------- |
| `service:created`      | `POST /api/services`                      |
| `service:updated`      | `PUT /api/services/:sid`                  |
| `service:deleted`      | `DELETE /api/services/:sid`               |
| `availability:updated` | Cualquiera de las tres acciones anteriores |

### Cómo verificarlo

1. Abrir `http://localhost:8080/views/services` en dos pestañas y `http://localhost:8080/views/availability` en una tercera.
2. Crear un servicio desde el formulario: aparece en las otras pestañas sin recargar.
3. Tocar **Desactivar** en un servicio: cambia su estado y pasa a "No disponibles" en la vista de disponibilidad.
4. Un cambio hecho desde la API (Postman o curl) también actualiza las vistas.

## Endpoints de la API

| Método | Ruta                               | Descripción                         |
| ------ | ---------------------------------- | ----------------------------------- |
| GET    | `/api/services`                    | Lista servicios (`?category=`, `?available=`) |
| GET    | `/api/services/:sid`               | Obtiene un servicio                 |
| POST   | `/api/services`                    | Crea un servicio                    |
| PUT    | `/api/services/:sid`               | Actualiza un servicio               |
| DELETE | `/api/services/:sid`               | Elimina un servicio                 |
| POST   | `/api/bookings`                    | Crea una reserva                    |
| GET    | `/api/bookings/:bid`               | Obtiene una reserva                 |
| POST   | `/api/bookings/:bid/services/:sid` | Agrega un servicio a una reserva    |
