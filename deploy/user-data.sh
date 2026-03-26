#!/bin/bash
set -e

# Update system
yum update -y
yum install -y docker git

# Start Docker
systemctl start docker
systemctl enable docker

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install Node.js 22
curl -fsSL https://rpm.nodesource.com/setup_22.x | bash -
yum install -y nodejs

# Install pnpm
npm install -g pnpm@9

# Clone repo
cd /home/ec2-user
git clone https://github.com/gs1231231/ecommerce-sathi.git
cd ecommerce-sathi

# Create .env
cat > .env << 'ENVEOF'
NODE_ENV=production
PORT=3001
WEB_PORT=3000
API_URL=http://localhost:3001
WEB_URL=http://localhost:3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ecommerce_sathi
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=ecommerce-sathi-prod-access-secret-k32
JWT_REFRESH_SECRET=ecommerce-sathi-prod-refresh-secret-k3
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
LOG_LEVEL=info
ENVEOF

# Start Postgres + Redis via Docker
docker run -d --name postgres \
  -p 5432:5432 \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=ecommerce_sathi \
  -v pgdata:/var/lib/postgresql/data \
  --restart unless-stopped \
  postgres:16-alpine

docker run -d --name redis \
  -p 6379:6379 \
  -v redisdata:/data \
  --restart unless-stopped \
  redis:7-alpine --appendonly yes

# Wait for Postgres
sleep 10

# Install deps and build
pnpm install --frozen-lockfile
pnpm build

# Run migrations
cd packages/db
npx drizzle-kit generate 2>/dev/null || true
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ecommerce_sathi npx drizzle-kit migrate
cd ../..

# Create systemd service for API
cat > /etc/systemd/system/ecommerce-api.service << 'SVCEOF'
[Unit]
Description=eCommerce Sathi API
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user/ecommerce-sathi
Environment=NODE_ENV=production
Environment=PORT=3001
Environment=DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ecommerce_sathi
Environment=REDIS_URL=redis://localhost:6379
Environment=JWT_ACCESS_SECRET=ecommerce-sathi-prod-access-secret-k32
Environment=JWT_REFRESH_SECRET=ecommerce-sathi-prod-refresh-secret-k3
ExecStart=/usr/bin/node apps/api/dist/main.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SVCEOF

# Create systemd service for Web
cat > /etc/systemd/system/ecommerce-web.service << 'SVCEOF'
[Unit]
Description=eCommerce Sathi Web
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user/ecommerce-sathi/apps/web
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=NEXT_PUBLIC_API_URL=http://localhost:3001/api
ExecStart=/usr/bin/node .next/standalone/apps/web/server.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SVCEOF

# Set ownership
chown -R ec2-user:ec2-user /home/ec2-user/ecommerce-sathi

# Start services
systemctl daemon-reload
systemctl enable ecommerce-api ecommerce-web
systemctl start ecommerce-api
systemctl start ecommerce-web

# Install and configure Nginx as reverse proxy
yum install -y nginx

cat > /etc/nginx/conf.d/ecommerce-sathi.conf << 'NGINXEOF'
server {
    listen 80;
    server_name _;

    # API
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }

    # Web
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINXEOF

# Remove default nginx config
rm -f /etc/nginx/conf.d/default.conf

systemctl enable nginx
systemctl start nginx

echo "Deployment complete!" > /home/ec2-user/deploy-status.txt
