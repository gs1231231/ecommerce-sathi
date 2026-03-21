.PHONY: setup dev build test lint db-migrate db-seed docker-up docker-down clean

# Setup project (first time)
setup:
	pnpm install
	cp -n .env.example .env || true
	$(MAKE) docker-up
	sleep 3
	$(MAKE) db-migrate

# Start development servers
dev:
	pnpm dev

# Build all packages and apps
build:
	pnpm build

# Run all tests
test:
	pnpm test

# Run linting
lint:
	pnpm lint

# Run database migrations
db-migrate:
	pnpm db:migrate

# Seed database
db-seed:
	pnpm db:seed

# Start Docker services
docker-up:
	docker compose up -d

# Stop Docker services
docker-down:
	docker compose down

# Clean all build artifacts and node_modules
clean:
	rm -rf node_modules
	rm -rf apps/*/node_modules
	rm -rf packages/*/node_modules
	rm -rf apps/*/.next
	rm -rf apps/*/dist
	rm -rf packages/*/dist
