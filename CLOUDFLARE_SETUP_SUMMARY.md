# ☁️ Cloudflare Tunnel Setup - Szybki Start

## Dla viament.alwood.dev

### 🚀 Krok 1: Przygotuj środowisko

```bash
# Skopiuj szablon produkcyjny
cp .env.production.example .env

# Edytuj i dodaj swój klucz OpenAI
nano .env
```

Zawartość `.env`:
```bash
OPENAI_API_KEY=sk-twoj-prawdziwy-klucz
NEXT_PUBLIC_API_URL=https://viament.alwood.dev/api
CORS_ORIGIN=https://viament.alwood.dev
```

### 🐳 Krok 2: Uruchom kontenery Docker

```bash
# Opcja A: Użyj helper script
./setup-cloudflare.sh

# Opcja B: Ręcznie
docker-compose up -d
```

Sprawdź status:
```bash
docker-compose ps
# Oba kontenery powinny być "Up (healthy)"
```

### 🌐 Krok 3: Skonfiguruj Cloudflare Tunnel

**Przekieruj port 3000 na domenę viament.alwood.dev**

#### Opcja A: Cloudflare Dashboard
1. Zaloguj się do Cloudflare Zero Trust
2. Access → Tunnels → Create a tunnel
3. Nazwij tunnel (np. "viament")
4. Zainstaluj cloudflared na serwerze
5. Dodaj Public Hostname:
   - **Subdomain**: viament
   - **Domain**: alwood.dev
   - **Service Type**: HTTP
   - **URL**: localhost:3000

#### Opcja B: Komenda cloudflared
```bash
# Prosty sposób (rozwojowy)
cloudflared tunnel --url http://localhost:3000

# Lub z konfiguracją (produkcja)
cloudflared tunnel create viament
cloudflared tunnel route dns viament viament.alwood.dev
cloudflared tunnel run viament
```

### ✅ Krok 4: Testowanie

```bash
# Test lokalny
curl http://localhost:3000
curl http://localhost:8000/api/health

# Test przez Cloudflare
curl https://viament.alwood.dev
curl https://viament.alwood.dev/api/health

# Otwórz w przeglądarce
open https://viament.alwood.dev
```

## 🎯 Kluczowe punkty

✅ **Tylko port 3000** jest przekierowany przez Cloudflare Tunnel  
✅ **Backend (port 8000)** pozostaje wewnętrzny - bezpieczniejsze  
✅ **SSL/TLS** obsługiwany automatycznie przez Cloudflare  
✅ **CORS** już skonfigurowany dla viament.alwood.dev  
✅ **Żadne zmiany w routerze/firewall** nie są potrzebne

## 📊 Architektura

```
Internet (użytkownik)
    │
    │ https://viament.alwood.dev
    ▼
Cloudflare (SSL, CDN, DDoS)
    │
    │ Cloudflare Tunnel (szyfrowany)
    ▼
localhost:3000 (Frontend)
    │
    │ Sieć wewnętrzna Docker
    ▼
backend:8000 (Backend - wewnętrzny)
```

## 🔧 Zarządzanie

```bash
# Restart
docker-compose restart

# Logi
docker-compose logs -f

# Stop
docker-compose down

# Pełny restart
docker-compose down && docker-compose up -d --build
```

## 🆘 Troubleshooting

### Problem: CORS errors w przeglądarce
```bash
# Sprawdź .env
grep CORS_ORIGIN .env
# Powinno być: CORS_ORIGIN=https://viament.alwood.dev

# Restart kontenera backend
docker-compose restart backend
```

### Problem: 502 Bad Gateway
```bash
# Sprawdź czy kontenery działają
docker-compose ps

# Sprawdź logi
docker-compose logs backend
docker-compose logs frontend

# Sprawdź health
curl http://localhost:3000
curl http://localhost:8000/api/health
```

### Problem: Cloudflare Tunnel nie łączy się
```bash
# Sprawdź czy port 3000 jest dostępny
netstat -an | grep 3000

# Sprawdź czy frontend działa
docker-compose logs frontend | grep "Ready"

# Test lokalny
curl http://localhost:3000
```

## �� Dokumentacja

- **CLOUDFLARE_TUNNEL.md** - Pełny przewodnik
- **ARCHITECTURE.md** - Architektura systemu
- **QUICKSTART.md** - Szybkie komendy
- **DOCKER.md** - Docker deployment

## 💡 Wskazówki

- Zawsze testuj **lokalnie najpierw** (localhost:3000)
- Backend **nie musi** być dostępny publicznie
- Cloudflare zapewnia **darmowy SSL/TLS**
- Możesz mieć **wiele tunneli** na różne porty
- Logi są twoje przyjacielem: `docker-compose logs -f`

## ⚡ Szybkie komendy

```bash
# Wszystko w jednym
cp .env.production.example .env && \
  nano .env && \
  docker-compose up -d && \
  docker-compose logs -f
```

---

**Status**: ✅ Gotowe do użycia  
**Domena**: viament.alwood.dev  
**Port Cloudflare**: 3000  
**Backend**: Wewnętrzny (bezpieczny)
