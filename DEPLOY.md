# Deployment Guide — AWS + Vercel

This guide deploys:
- **Frontend** (Next.js) → Vercel (free)
- **Backend** (FastAPI + PostgreSQL) → AWS EC2

---

## Part 1: Deploy Frontend to Vercel

### 1. Go to vercel.com and sign up with GitHub

### 2. Click "New Project" → Import `property-construction-agent`

### 3. Configure:
- **Root Directory**: `apps/web`
- **Framework**: Next.js (auto-detected)
- **Build Command**: `npm run build`

### 4. Add Environment Variable:
```
NEXT_PUBLIC_API_URL = http://YOUR_EC2_IP:8000
```
(You will fill in the EC2 IP after Step 2)

### 5. Click Deploy
Vercel gives you a URL like: `https://property-construction-agent.vercel.app`

---

## Part 2: Deploy Backend to AWS EC2

### Step 1: Launch EC2 Instance

1. Go to **AWS Console** → EC2 → Launch Instance
2. Choose:
   - **AMI**: Ubuntu 24.04 LTS
   - **Instance type**: t3.micro (free tier eligible)
   - **Key pair**: Create new → download `.pem` file
3. **Security Group** — Add inbound rules:
   | Port | Protocol | Source |
   |------|----------|--------|
   | 22 | TCP | My IP |
   | 8000 | TCP | Anywhere (0.0.0.0/0) |
   | 443 | TCP | Anywhere |
4. Click **Launch Instance**
5. Note your **Public IP address**

### Step 2: Connect to EC2

```bash
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
```

### Step 3: Install Docker on EC2

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu
newgrp docker

# Install Docker Compose
sudo apt-get install -y docker-compose-plugin
docker compose version
```

### Step 4: Clone the repo on EC2

```bash
git clone https://github.com/ancica1234/property-construction-agent.git
cd property-construction-agent
```

### Step 5: Create production .env file

```bash
cp .env.production.example .env.production
nano .env.production
```

Fill in your values:
```env
POSTGRES_USER=pca_user
POSTGRES_PASSWORD=YourStrongPassword123!
POSTGRES_DB=pca_db
JWT_SECRET=your-very-long-random-secret-key-here
OPENAI_API_KEY=sk-your-key-here
CORS_ORIGINS=["https://your-app.vercel.app"]
ENVIRONMENT=production
```

### Step 6: Start the backend

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

### Step 7: Seed the database

```bash
docker exec pca_api python seed.py
```

### Step 8: Verify it works

```bash
curl http://YOUR_EC2_IP:8000/health
# Should return: {"status": "ok", "version": "0.1.0"}
```

### Step 9: Update Vercel environment variable

1. Go to Vercel → your project → Settings → Environment Variables
2. Update `NEXT_PUBLIC_API_URL` to `http://YOUR_EC2_IP:8000`
3. Redeploy

---

## Part 3: Updating the App

### Update frontend:
```bash
# Push to GitHub → Vercel auto-deploys
git add -A && git commit -m "update" && git push
```

### Update backend on EC2:
```bash
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
cd property-construction-agent
git pull
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

---

## Estimated Monthly Cost

| Service | Cost |
|---------|------|
| EC2 t3.micro | ~$8/mo |
| EBS Storage (20GB) | ~$2/mo |
| Vercel (frontend) | Free |
| Data transfer | ~$1/mo |
| **Total** | **~$11/mo** |

> Free tier: EC2 t3.micro is free for the first 12 months on new AWS accounts

---

## Troubleshooting

### Check logs:
```bash
docker compose -f docker-compose.prod.yml logs api
docker compose -f docker-compose.prod.yml logs postgres
```

### Restart services:
```bash
docker compose -f docker-compose.prod.yml restart api
```

### Connect to database:
```bash
docker exec -it pca_postgres psql -U pca_user -d pca_db
```
