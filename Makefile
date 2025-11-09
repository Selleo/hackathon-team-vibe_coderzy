.PHONY: help up down restart logs logs-frontend logs-backend status clean build shell-frontend shell-backend

help: ## Show this help message
	@echo "ViaMent Docker Commands"
	@echo "======================="
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

up: ## Start all containers
	@echo "🚀 Starting containers..."
	@docker-compose up --build -d
	@echo "✅ Containers started"
	@echo ""
	@echo "Frontend:  http://localhost:3000"
	@echo "Backend:   http://localhost:8000"
	@echo "API Docs:  http://localhost:8000/docs"

down: ## Stop all containers
	@echo "🛑 Stopping containers..."
	@docker-compose down
	@echo "✅ Containers stopped"

restart: down up ## Restart all containers

logs: ## Show logs for all services
	@docker-compose logs -f

logs-frontend: ## Show logs for frontend only
	@docker-compose logs -f frontend

logs-backend: ## Show logs for backend only
	@docker-compose logs -f backend

status: ## Show container status
	@docker-compose ps

clean: ## Stop containers and remove volumes
	@echo "🧹 Cleaning up..."
	@docker-compose down -v
	@echo "✅ Cleanup complete"

build: ## Build containers without starting
	@echo "🔨 Building containers..."
	@docker-compose build
	@echo "✅ Build complete"

shell-frontend: ## Open shell in frontend container
	@docker-compose exec frontend sh

shell-backend: ## Open shell in backend container
	@docker-compose exec backend bash

dev-frontend: ## Run frontend in development mode (local)
	@cd frontend && pnpm dev

dev-backend: ## Run backend in development mode (local)
	@cd backend && uvicorn app.main:app --reload

install-frontend: ## Install frontend dependencies (local)
	@cd frontend && pnpm install

install-backend: ## Install backend dependencies (local)
	@cd backend && pip install -e .
