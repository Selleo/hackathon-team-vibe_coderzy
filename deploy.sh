#!/bin/bash
# ViaMent Docker Deployment Script

set -e

echo "🚀 ViaMent Docker Deployment"
echo "=============================="

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found!"
    echo "Creating from .env.example..."
    cp .env.example .env
    echo ""
    echo "⚠️  IMPORTANT: Edit .env and add your OPENAI_API_KEY before continuing!"
    echo "Run: nano .env"
    exit 1
fi

# Check if OPENAI_API_KEY is set
if ! grep -q "OPENAI_API_KEY=sk-" .env; then
    echo "⚠️  OPENAI_API_KEY not configured in .env file"
    echo "Please add your OpenAI API key to the .env file"
    echo "Run: nano .env"
    exit 1
fi

# Check Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Parse command
COMMAND=${1:-up}

case $COMMAND in
    up)
        echo "📦 Building and starting containers..."
        docker-compose up --build -d
        echo ""
        echo "✅ Application started successfully!"
        echo ""
        echo "Access the application:"
        echo "  Frontend:  http://localhost:3000"
        echo "  Backend:   http://localhost:8000"
        echo "  API Docs:  http://localhost:8000/docs"
        echo ""
        echo "View logs with: ./deploy.sh logs"
        ;;
    
    down)
        echo "🛑 Stopping containers..."
        docker-compose down
        echo "✅ Containers stopped"
        ;;
    
    restart)
        echo "🔄 Restarting containers..."
        docker-compose down
        docker-compose up --build -d
        echo "✅ Containers restarted"
        ;;
    
    logs)
        SERVICE=${2:-}
        if [ -z "$SERVICE" ]; then
            echo "📋 Showing logs for all services..."
            docker-compose logs -f
        else
            echo "📋 Showing logs for $SERVICE..."
            docker-compose logs -f $SERVICE
        fi
        ;;
    
    status)
        echo "📊 Container status:"
        docker-compose ps
        ;;
    
    clean)
        echo "🧹 Cleaning up containers and volumes..."
        docker-compose down -v
        echo "✅ Cleanup complete"
        ;;
    
    build)
        echo "🔨 Building containers..."
        docker-compose build
        echo "✅ Build complete"
        ;;
    
    *)
        echo "Usage: ./deploy.sh [command]"
        echo ""
        echo "Commands:"
        echo "  up       - Build and start containers (default)"
        echo "  down     - Stop containers"
        echo "  restart  - Restart all containers"
        echo "  logs     - View logs (optional: specify service name)"
        echo "  status   - Show container status"
        echo "  clean    - Stop containers and remove volumes"
        echo "  build    - Build containers without starting"
        echo ""
        echo "Examples:"
        echo "  ./deploy.sh up"
        echo "  ./deploy.sh logs frontend"
        echo "  ./deploy.sh restart"
        ;;
esac
