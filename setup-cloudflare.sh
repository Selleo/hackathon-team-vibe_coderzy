#!/bin/bash
# Cloudflare Tunnel Setup Helper for viament.alwood.dev

echo "🌐 ViaMent - Cloudflare Tunnel Setup"
echo "====================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  Creating .env file for production..."
    if [ -f .env.production.example ]; then
        cp .env.production.example .env
        echo "✅ .env created from .env.production.example"
    else
        cp .env.example .env
        echo "✅ .env created from .env.example"
    fi
    echo ""
    echo "⚠️  IMPORTANT: Edit .env and configure:"
    echo "   1. OPENAI_API_KEY=sk-your-key"
    echo "   2. NEXT_PUBLIC_API_URL=https://viament.alwood.dev/api"
    echo "   3. CORS_ORIGIN=https://viament.alwood.dev"
    echo ""
    echo "Run: nano .env"
    echo ""
    read -p "Press Enter after editing .env..."
fi

# Verify OPENAI_API_KEY
if ! grep -q "OPENAI_API_KEY=sk-" .env; then
    echo "⚠️  Warning: OPENAI_API_KEY not properly configured"
fi

# Verify production URLs
if ! grep -q "viament.alwood.dev" .env; then
    echo ""
    echo "📝 For production with Cloudflare Tunnel, add to .env:"
    echo ""
    echo "NEXT_PUBLIC_API_URL=https://viament.alwood.dev/api"
    echo "CORS_ORIGIN=https://viament.alwood.dev"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "🚀 Starting Docker containers..."
docker-compose up -d

echo ""
echo "⏳ Waiting for containers to be healthy..."
sleep 10

echo ""
echo "📊 Container Status:"
docker-compose ps

echo ""
echo "✅ Application started!"
echo ""
echo "📍 Next Steps:"
echo ""
echo "1. Verify containers are healthy above"
echo ""
echo "2. Test locally first:"
echo "   curl http://localhost:3000"
echo "   curl http://localhost:8000/api/health"
echo ""
echo "3. Configure Cloudflare Tunnel to point to:"
echo "   Service: HTTP"
echo "   URL: localhost:3000"
echo "   Domain: viament.alwood.dev"
echo ""
echo "4. Or use cloudflared command:"
echo "   cloudflared tunnel --url http://localhost:3000"
echo ""
echo "5. Test production URL:"
echo "   https://viament.alwood.dev"
echo ""
echo "📖 Full guide: See CLOUDFLARE_TUNNEL.md"
echo ""
echo "💡 View logs: docker-compose logs -f"
echo "💡 Stop: docker-compose down"
