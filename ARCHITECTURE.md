# ViaMent Architecture

## Local Development

```
┌─────────────────────────────────────────┐
│         Developer Machine               │
│                                         │
│  ┌──────────────┐   ┌──────────────┐  │
│  │  Browser     │   │  Browser     │  │
│  │  :3000       │   │  :8000/docs  │  │
│  └──────┬───────┘   └──────┬───────┘  │
│         │                   │           │
│         ▼                   ▼           │
│  ┌──────────────┐   ┌──────────────┐  │
│  │  Frontend    │──►│  Backend     │  │
│  │  Next.js     │   │  FastAPI     │  │
│  │  Port 3000   │   │  Port 8000   │  │
│  └──────────────┘   └──────────────┘  │
│         Docker Network                 │
└─────────────────────────────────────────┘
```

**Access:**
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Production with Cloudflare Tunnel (viament.alwood.dev)

```
┌─────────────────────────────────────────────────────┐
│                    Internet                          │
└───────────────────────┬─────────────────────────────┘
                        │
                        │ HTTPS
                        ▼
┌─────────────────────────────────────────────────────┐
│              Cloudflare Edge Network                 │
│         (SSL/TLS, DDoS Protection, CDN)             │
└───────────────────────┬─────────────────────────────┘
                        │
                        │ Cloudflare Tunnel
                        │ (Encrypted)
                        ▼
┌─────────────────────────────────────────────────────┐
│              Your Server / Machine                   │
│                                                      │
│  ┌──────────────────────────────────────┐          │
│  │        Cloudflare Tunnel             │          │
│  │        cloudflared daemon            │          │
│  └───────────────┬──────────────────────┘          │
│                  │                                   │
│                  │ localhost:3000                    │
│                  ▼                                   │
│  ┌────────────────────────────────────┐            │
│  │      Docker Environment            │            │
│  │                                    │            │
│  │  ┌──────────────┐  Internal       │            │
│  │  │  Frontend    │  Docker         │            │
│  │  │  Next.js     │  Network        │            │
│  │  │  Port 3000   │◄────┐           │            │
│  │  └──────────────┘     │           │            │
│  │         │              │           │            │
│  │         │              │           │            │
│  │         ▼              │           │            │
│  │  ┌──────────────┐     │           │            │
│  │  │  Backend     │─────┘           │            │
│  │  │  FastAPI     │                 │            │
│  │  │  Port 8000   │                 │            │
│  │  │  (Internal)  │                 │            │
│  │  └──────────────┘                 │            │
│  │                                    │            │
│  └────────────────────────────────────┘            │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**Access:**
- Public: https://viament.alwood.dev (Frontend only)
- Backend: Internal only, accessed via Docker network

**Key Points:**
- ✅ Only frontend (port 3000) exposed through Cloudflare Tunnel
- ✅ Backend (port 8000) stays internal for security
- ✅ SSL/TLS automatically handled by Cloudflare
- ✅ DDoS protection and CDN included
- ✅ No port forwarding or firewall changes needed

## Request Flow

### User Visits Website
```
User Browser
    │
    │ GET https://viament.alwood.dev
    ▼
Cloudflare Edge
    │
    │ Cloudflare Tunnel (encrypted)
    ▼
Frontend Container (localhost:3000)
    │
    │ Returns HTML/JS/CSS
    ▼
User Browser
```

### API Call from Browser
```
User Browser (React App)
    │
    │ POST /api/mentor/chat
    ▼
Frontend Next.js API Route
    │
    │ Proxy request via Docker network
    ▼
Backend Container (backend:8000)
    │
    │ Process with OpenAI
    ▼
Backend Response
    │
    ▼
Frontend API Route
    │
    ▼
User Browser
```

## Component Communication

### Development
```
Browser → localhost:3000 (Frontend)
Frontend → localhost:8000 (Backend)
Backend → OpenAI API
```

### Production
```
Browser → https://viament.alwood.dev (Cloudflare → Frontend)
Frontend → backend:8000 (Internal Docker network)
Backend → OpenAI API
```

## Security Layers

```
┌─────────────────────────────────────┐
│  Cloudflare Security                │
│  - DDoS Protection                  │
│  - WAF (Web Application Firewall)   │
│  - Bot Protection                   │
│  - SSL/TLS Encryption               │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Application Layer                  │
│  - CORS Configuration               │
│  - API Rate Limiting (TODO)         │
│  - Input Validation                 │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Container Layer                    │
│  - Non-root users                   │
│  - Isolated networks                │
│  - Health checks                    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Infrastructure                     │
│  - Environment variables            │
│  - Secrets management               │
│  - Internal-only backend            │
└─────────────────────────────────────┘
```

## Data Flow

### User Profile & Progress
```
Browser (React State)
    │
    ├─► localStorage (Client-side persistence)
    │
    └─► Future: Backend Database
```

### AI Interactions
```
User Input
    │
    ▼
Frontend API Route
    │
    ▼
OpenAI API
    │
    ▼
Response to User
```

### Lesson Generation
```
User Profile
    │
    ▼
Frontend (roadmapBuilder)
    │
    ▼
Generated Lessons
    │
    ▼
localStorage
```

## Environment Variables Flow

### Build Time (Frontend)
```
.env file
    │
    └─► NEXT_PUBLIC_* variables
            │
            └─► Embedded in JavaScript bundle
```

### Runtime (Backend)
```
.env file
    │
    └─► docker-compose.yml
            │
            └─► Backend container
                    │
                    └─► Python os.getenv()
```

## Scaling Considerations

### Current (Single Server)
```
1 Frontend Container
1 Backend Container
```

### Future (Multi-Instance)
```
Load Balancer
    │
    ├─► Frontend 1
    ├─► Frontend 2
    └─► Frontend 3
        │
        └─► Backend Pool
            ├─► Backend 1
            ├─► Backend 2
            └─► Backend 3
                │
                └─► Shared Database
```

## Technology Stack

### Frontend
- **Framework**: Next.js 16 (React 19)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **AI Integration**: OpenAI API (GPT-4o-mini)

### Backend
- **Framework**: FastAPI
- **Language**: Python 3.11
- **Server**: Uvicorn

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Tunnel**: Cloudflare Tunnel
- **Domain**: viament.alwood.dev

### External Services
- **AI**: OpenAI API
- **CDN/Security**: Cloudflare
- **Storage**: localStorage (client-side)

---

**Last Updated**: 2025-01-09  
**Version**: 1.0  
**Status**: Production Ready
