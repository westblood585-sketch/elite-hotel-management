# 🚀 Elite Hotel - Configuración Completada

## ✅ Estado Actual
- ✓ Archivos `.env` creados para todos los servicios
- ✓ Dependencias instaladas (Backend + Frontend)
- ✓ Proyecto listo para ejecutarse

## 📋 Servicios del Backend

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| API Gateway | 4000 | Puerta de entrada a todos los servicios |
| Auth Service | 4001 | Autenticación y tokens |
| User Service | 4002 | Gestión de usuarios |
| Room Service | 4003 | Gestión de habitaciones |
| Guest Service | 4004 | Gestión de huéspedes |
| Reservation Service | 4005 | Gestión de reservas |
| Billing Service | 4007 | Facturación |
| Payment Service | 4008 | Pagos |
| Communication Service | 4009 | Video chat |
| HouseKeeping Service | 4010 | Servicio de limpieza |
| Notification Service | 4006 | Notificaciones |

## 🎨 Frontend
- URL: http://localhost:5173
- Servidor: Vite

## 📦 Requisitos
- Node.js (v18+)
- npm
- MongoDB (para conectarse a las bases de datos locales)
- RabbitMQ (para mensajería entre servicios)

## 🔄 Orden Recomendado de Inicio

### 1. En Terminal 1 - API Gateway
```bash
cd backend/api-gateway
npm run dev
```

### 2. En Terminal 2 - Auth Service
```bash
cd backend/services/authService
npm run dev
```

### 3. En Terminal 3 - User Service
```bash
cd backend/services/userService
npm run dev
```

### 4. En Terminal 4 - Room Service
```bash
cd backend/services/roomService
npm run dev
```

### 5. En Terminal 5 - Otros Servicios (puedes iniciarlos según sea necesario)

### 6. En Terminal Final - Frontend
```bash
cd frontend
npm run dev
```

## 🔗 URLs Importantes
- Frontend: http://localhost:5173
- API Gateway: http://localhost:4000
- Auth Service: http://localhost:4001
- User Service: http://localhost:4002
- Room Service: http://localhost:4003
- Guest Service: http://localhost:4004
- Reservation Service: http://localhost:4005
- Billing Service: http://localhost:4007
- Payment Service: http://localhost:4008
- Communication Service: http://localhost:4009
- HouseKeeping Service: http://localhost:4010

## ⚙️ Próximos Pasos

### Para desarrollo local:
1. Asegúrate de que MongoDB esté corriendo
2. Asegúrate de que RabbitMQ esté corriendo
3. Inicia los servicios siguiendo el orden recomendado

### Con Docker (Alternativa):
```bash
docker-compose up
```

## 📝 Notas Importantes
- Los archivos `.env` contienen valores de demostración
- Para producción, actualiza las claves secretas y credenciales
- Algunos servicios requieren configuración externa (Cloudinary, Stripe, AWS S3, etc.)
- La comunicación entre servicios usa RabbitMQ

## 🐛 Troubleshooting

**Error de conexión a MongoDB:**
- Asegúrate de que MongoDB esté corriendo: `mongod`

**Error de conexión a RabbitMQ:**
- Asegúrate de que RabbitMQ esté corriendo
- En macOS: `brew services start rabbitmq`

**Puerto ya en uso:**
- Si un puerto está ocupado, puedes cambiar el número en el archivo `.env`

