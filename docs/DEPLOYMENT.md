# Deployment Guide

This guide covers deployment strategies and procedures for the Todo Platform application.

## Environment Overview

### Development

- Local development with hot reload
- Local PostgreSQL database
- Mock authentication for testing

### Staging

- Production-like environment
- Staging database
- Integration testing
- Performance testing

### Production

- Live application
- Production database
- Monitoring and logging
- Backup and recovery

## Prerequisites

### Infrastructure Requirements

- **Node.js**: 18+ LTS
- **PostgreSQL**: 14+
- **Redis** (optional, for caching)
- **Load Balancer**: Nginx or similar
- **SSL Certificate**: For HTTPS
- **Domain Name**: For application access

### Environment Variables

See `.env.example` files for required variables in both backend and frontend.

## Backend Deployment

### Option 1: Docker Deployment

1. **Build Docker Image**

   ```bash
   cd backend
   docker build -t todo-platform-backend .
   ```

2. **Dockerfile Example**

   ```dockerfile
   FROM node:18-alpine AS builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production

   FROM node:18-alpine AS runner
   WORKDIR /app
   COPY --from=builder /app/node_modules ./node_modules
   COPY . .
   RUN npm run build
   EXPOSE 3001
   CMD ["npm", "start"]
   ```

3. **Docker Compose Example**

   ```yaml
   version: '3.8'
   services:
     backend:
       build: ./backend
       environment:
         - NODE_ENV=production
         - DATABASE_URL=${DATABASE_URL}
         - JWT_SECRET=${JWT_SECRET}
       ports:
         - '3001:3001'
       depends_on:
         - postgres
         - redis

     postgres:
       image: postgres:14
       environment:
         - POSTGRES_DB=todo_platform
         - POSTGRES_USER=${DB_USER}
         - POSTGRES_PASSWORD=${DB_PASSWORD}
       volumes:
         - postgres_data:/var/lib/postgresql/data

     redis:
       image: redis:7-alpine
       ports:
         - '6379:6379'

   volumes:
     postgres_data:
   ```

### Option 2: Traditional Deployment

1. **Server Setup**

   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y

   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Install PostgreSQL
   sudo apt install postgresql postgresql-contrib

   # Install PM2 for process management
   sudo npm install -g pm2
   ```

2. **Application Deployment**

   ```bash
   # Clone repository
   git clone https://github.com/your-org/todo-platform.git
   cd todo-platform

   # Install dependencies
   npm run install:all

   # Build backend
   cd backend
   npm run build

   # Setup database
   npx prisma migrate deploy
   npx prisma generate

   # Start with PM2
   pm2 start ecosystem.config.js
   ```

3. **PM2 Configuration**
   ```javascript
   // ecosystem.config.js
   module.exports = {
     apps: [
       {
         name: 'todo-platform-backend',
         script: './dist/index.js',
         cwd: './backend',
         instances: 'max',
         exec_mode: 'cluster',
         env: {
           NODE_ENV: 'production',
           PORT: 3001,
         },
         error_file: './logs/err.log',
         out_file: './logs/out.log',
         log_file: './logs/combined.log',
         time: true,
       },
     ],
   };
   ```

## Frontend Deployment

### Option 1: Static Hosting (Vercel, Netlify, etc.)

1. **Build Application**

   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy to Vercel**

   ```bash
   npm install -g vercel
   vercel --prod
   ```

3. **Vercel Configuration**
   ```json
   // vercel.json
   {
     "buildCommand": "cd frontend && npm run build",
     "outputDirectory": "frontend/dist",
     "installCommand": "npm run install:all",
     "framework": "vite",
     "env": {
       "VITE_API_BASE_URL": "@api-base-url"
     }
   }
   ```

### Option 2: Nginx Static Serving

1. **Build Application**

   ```bash
   cd frontend
   npm run build
   ```

2. **Nginx Configuration**

   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       # Redirect to HTTPS
       return 301 https://$server_name$request_uri;
   }

   server {
       listen 443 ssl http2;
       server_name your-domain.com;

       ssl_certificate /path/to/certificate.crt;
       ssl_certificate_key /path/to/private.key;

       # Frontend static files
       location / {
           root /var/www/todo-platform/frontend/dist;
           try_files $uri $uri/ /index.html;

           # Cache static assets
           location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
               expires 1y;
               add_header Cache-Control "public, immutable";
           }
       }

       # API proxy
       location /api {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## Database Deployment

### PostgreSQL Setup

1. **Production Database**

   ```bash
   # Create database user
   sudo -u postgres createuser --interactive

   # Create database
   sudo -u postgres createdb todo_platform

   # Grant permissions
   sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE todo_platform TO todo_user;"
   ```

2. **Database Migration**

   ```bash
   cd backend
   DATABASE_URL="postgresql://user:password@localhost:5432/todo_platform" npx prisma migrate deploy
   ```

3. **Backup Strategy**

   ```bash
   # Daily backup script
   #!/bin/bash
   DATE=$(date +%Y%m%d_%H%M%S)
   BACKUP_DIR="/backups"
   DATABASE="todo_platform"

   pg_dump $DATABASE > $BACKUP_DIR/todo_platform_$DATE.sql
   gzip $BACKUP_DIR/todo_platform_$DATE.sql

   # Keep only last 7 days
   find $BACKUP_DIR -name "todo_platform_*.sql.gz" -mtime +7 -delete
   ```

## SSL/TLS Configuration

### Let's Encrypt with Certbot

1. **Install Certbot**

   ```bash
   sudo apt install certbot python3-certbot-nginx
   ```

2. **Generate Certificate**

   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

3. **Auto-renewal**
   ```bash
   sudo crontab -e
   # Add: 0 12 * * * /usr/bin/certbot renew --quiet
   ```

## Monitoring and Logging

### Application Monitoring

1. **Health Check Endpoint**

   ```javascript
   // Backend health check
   app.get('/health', async (req, res) => {
     try {
       await prisma.$queryRaw`SELECT 1`;
       res.json({ status: 'healthy', timestamp: new Date().toISOString() });
     } catch (error) {
       res.status(503).json({ status: 'unhealthy', error: error.message });
     }
   });
   ```

2. **Logging Configuration**

   ```javascript
   // Winston logger setup
   const winston = require('winston');

   const logger = winston.createLogger({
     level: process.env.LOG_LEVEL || 'info',
     format: winston.format.combine(
       winston.format.timestamp(),
       winston.format.errors({ stack: true }),
       winston.format.json()
     ),
     transports: [
       new winston.transports.File({
         filename: 'logs/error.log',
         level: 'error',
       }),
       new winston.transports.File({ filename: 'logs/combined.log' }),
     ],
   });

   if (process.env.NODE_ENV !== 'production') {
     logger.add(
       new winston.transports.Console({
         format: winston.format.simple(),
       })
     );
   }
   ```

### System Monitoring

1. **PM2 Monitoring**

   ```bash
   # Monitor applications
   pm2 monit

   # View logs
   pm2 logs

   # Restart applications
   pm2 restart all
   ```

2. **System Metrics**

   ```bash
   # Install monitoring tools
   sudo apt install htop iotop nethogs

   # Monitor system resources
   htop
   iotop
   nethogs
   ```

## CI/CD Pipeline

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm run install:all

      - name: Run tests
        run: npm run test

      - name: Run linting
        run: npm run lint

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to server
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /var/www/todo-platform
            git pull origin main
            npm run install:all
            cd backend && npm run build
            pm2 restart todo-platform-backend
            cd ../frontend && npm run build
```

## Security Considerations

### Environment Security

- Use environment variables for sensitive data
- Rotate secrets regularly
- Use read-only database users for application access
- Implement rate limiting on APIs

### Network Security

- Use HTTPS everywhere
- Implement proper CORS policies
- Use firewalls to restrict access
- Regular security updates

### Application Security

- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection
- Security headers

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Check connection string
   - Verify database is running
   - Check firewall rules
   - Review database logs

2. **Build Failures**
   - Clear node_modules and reinstall
   - Check Node.js version compatibility
   - Review error logs
   - Verify environment variables

3. **Performance Issues**
   - Monitor resource usage
   - Check database query performance
   - Review application logs
   - Analyze network traffic

### Debugging Commands

```bash
# Check application logs
pm2 logs todo-platform-backend

# Check database connections
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"

# Check network connections
netstat -tulpn | grep :3001

# Monitor system resources
top
htop
df -h
free -h
```

## Rollback Procedures

### Database Rollback

```bash
# Restore from backup
gunzip -c /backups/todo_platform_YYYYMMDD_HHMMSS.sql.gz | psql todo_platform

# Rollback migration
npx prisma migrate reset
```

### Application Rollback

```bash
# Git rollback
git checkout previous-commit-hash

# PM2 rollback
pm2 reload ecosystem.config.js
```

This deployment guide provides a comprehensive foundation for deploying the Todo Platform in various environments. Adjust configurations based on your specific infrastructure requirements.
