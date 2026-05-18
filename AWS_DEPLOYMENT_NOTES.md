# AWS Deployment Notes

## Live URLs
- **Frontend**: https://property-construction-agent-web.vercel.app
- **Backend API**: https://18.225.185.73.nip.io
- **EC2 IP**: 18.225.185.73

## Login Credentials
- **Email**: owner@pca.dev
- **Password**: password123

---

## How We Deployed

### Backend (EC2 + Docker)

1. Launched EC2 t3.micro (Ubuntu 24.04) on AWS
   - Ports open: 22 (SSH), 80 (HTTP), 443 (HTTPS), 8000 (API)

2. Connected via AWS EC2 Instance Connect (browser terminal)

3. Installed Docker:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh
sudo usermod -aG docker ubuntu && newgrp docker
sudo apt-get install -y docker-compose-plugin
```

4. Cloned the repo:
```bash
git clone https://github.com/ancica1234/property-construction-agent.git
cd property-construction-agent
```

5. Created environment file:
```bash
cp .env.production.example .env.production
nano .env.production
```
Values used:
```
POSTGRES_USER=pca_user
POSTGRES_PASSWORD=Property2026!
POSTGRES_DB=pca_db
JWT_SECRET=pca-jwt-secret-32nd-street-triplex-2026
OPENAI_API_KEY=sk-your-key-here
CORS_ORIGINS=["https://property-construction-agent-web.vercel.app","https://18.225.185.73.nip.io"]
ENVIRONMENT=production
```

6. Started backend with Docker Compose:
```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

7. Seeded the database:
```bash
docker exec pca_api python seed.py
```

8. Installed Nginx + free SSL certificate:
```bash
sudo apt-get install -y nginx certbot python3-certbot-nginx
sudo certbot --nginx -d 18.225.185.73.nip.io --non-interactive --agree-tos -m admin@pca.dev
```

9. Configured Nginx to proxy to FastAPI:
```bash
sudo tee /etc/nginx/sites-enabled/default << EOF
server {
    listen 80;
    server_name 18.225.185.73.nip.io;
    return 301 https://$host$request_uri;
}
server {
    listen 443 ssl;
    server_name 18.225.185.73.nip.io;
    ssl_certificate /etc/letsencrypt/live/18.225.185.73.nip.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/18.225.185.73.nip.io/privkey.pem;
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF
sudo nginx -t && sudo systemctl restart nginx
```

### Frontend (Vercel)

1. Go to vercel.com → New Project → Import from GitHub
2. Set Root Directory: `apps/web`
3. Add Environment Variable:
   - `NEXT_PUBLIC_API_URL` = `https://18.225.185.73.nip.io`
4. Deploy → auto-deploys on every git push

---

## Updating the App

### Update frontend (auto):
```bash
# On your local machine
git add -A && git commit -m "your update" && git push
# Vercel automatically redeploys the frontend
```

### Update backend (manual):
```bash
# SSH into EC2
ssh -i pca-key.pem ubuntu@18.225.185.73

# Pull latest code and rebuild
cd property-construction-agent
git pull
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

---

## Useful Commands on EC2

```bash
# Check if API is running
curl http://localhost:8000/health

# View API logs
docker compose -f docker-compose.prod.yml logs api

# View all running containers
docker ps

# Restart API only
docker compose -f docker-compose.prod.yml restart api

# Connect to database
docker exec -it pca_postgres psql -U pca_user -d pca_db

# Check Nginx status
sudo systemctl status nginx
```

---

## Monthly Cost

| Service | Cost |
|---------|------|
| EC2 t3.micro | ~$8/mo (free first 12 months) |
| EBS Storage 20GB | ~$2/mo |
| Vercel Frontend | Free |
| SSL Certificate | Free (Let`s Encrypt) |
| Domain (nip.io) | Free |
| **Total** | **~$10/mo** |
