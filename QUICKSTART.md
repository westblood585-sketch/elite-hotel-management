# 🏨 Elite Hotel - Setup Tamamlandı! ✅

## 🚀 Çalışan Servisleri

| Servis | Port | Durum |
|--------|------|-------|
| **API Gateway** | 4000 | ✅ Çalışıyor |
| **Auth Service** | 4001 | ✅ Çalışıyor |
| **User Service** | 4002 | ✅ Çalışıyor |
| **Room Service** | 4003 | ⏳ Beklemede |
| **Guest Service** | 4004 | ⏳ Beklemede |
| **Reservation Service** | 4005 | ⏳ Beklemede |
| **Billing Service** | 4007 | ⏳ Beklemede |
| **Payment Service** | 4008 | ⏳ Beklemede |
| **Communication Service** | 4009 | ⏳ Beklemede |
| **HouseKeeping Service** | 4010 | ⏳ Beklemede |
| **Frontend (Vite)** | 5175 | ✅ Çalışıyor |

## 🌐 Erişim URL'leri

```
Frontend:        http://localhost:5175
API Gateway:     http://localhost:4000
RabbitMQ Panel:  http://localhost:15672
MongoDB:         localhost:27017
```

## 📝 Yapılan İşlemler

✅ Tüm `.env` dosyaları oluşturuldu  
✅ npm bağımlılıkları kuruldu  
✅ MongoDB başlatıldı  
✅ RabbitMQ başlatıldı ve bağlantı sağlandı  
✅ API Gateway, Auth Service, User Service çalışmaya başladı  
✅ Frontend (Vite) başlatıldı  

## 🔧 Sonraki Adımlar

### 1. **Kalan Servisleri Başlatmak** (İsteğe bağlı)
```bash
# Terminal 1 - Room Service
cd backend/services/roomService
npm run dev

# Terminal 2 - Reservation Service
cd backend/services/reservationService
npm run dev

# vs...
```

### 2. **Kullanıcı Oluşturmak**
```bash
curl -X POST http://localhost:4001/signup \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Adınız Soyadınız",
    "email": "email@example.com",
    "password": "Password123!"
  }'
```

### 3. **Login Yapmak**
```bash
curl -X POST http://localhost:4001/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "email@example.com",
    "password": "Password123!"
  }'
```

Gelen `accessToken`'ı kaydet, diğer API çağrıları için kullanacaksın.

### 4. **Protected Endpoint'e Erişmek**
```bash
curl -X GET http://localhost:4000/api/users/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 📦 Sistem Gereksinimleri

- ✅ Node.js v18+
- ✅ npm 9+
- ✅ MongoDB (Homebrew)
- ✅ RabbitMQ (Homebrew)

## 🐛 Sıkça Karşılaşılan Sorunlar

### **Port Zaten Kullanımda**
```bash
# Çözüm: Portu boşalmak
lsof -i :PORT_NUMARASI | grep LISTEN | awk '{print $2}' | xargs kill -9
```

### **RabbitMQ Bağlantısı Yok**
```bash
# Çözüm: RabbitMQ'yı restart et
brew services restart rabbitmq
```

### **MongoDB Bağlantısı Yok**
```bash
# Çözüm: MongoDB'yi restart et
brew services restart mongodb-community
```

## 📚 Önemli Bilgiler

- Sunucu URL'leri `.env` dosyalarında tanımlanmıştır
- Tüm servisleri başlatmak zorunlu değildir
- Frontend bağımsız olarak çalışabilir (mock data ile)
- Credentials (API keys, secrets) `.env` dosyalarında değiştirilmeli

## 🎯 Test Etmek İçin

1. **Frontend'e git:** http://localhost:5175
2. **Sign up** butonuna tıkla
3. **Hesap oluştur**
4. **Login** yap
5. Hazır! 🎉

---

**Sorun mu var? Terminal output'unu kontrol et!**
