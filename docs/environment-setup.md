# Environment Setup Guide

## Overview

This document describes all environment variables required for AI MLOps Copilot.

## Environment Variables

### Application Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `APPLICATION_NAME` | Application name | `AI MLOps Copilot` | No |
| `DEBUG` | Enable debug mode | `False` | No |

### Database Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/ai_mlops_copilot` | Yes |

### JWT Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `JWT_SECRET` | Secret key for JWT signing | `change-this-secret-in-production` | Yes |
| `JWT_ALGORITHM` | JWT signing algorithm | `HS256` | No |
| `JWT_ACCESS_TOKEN_EXPIRATION_MINUTES` | Access token expiration (minutes) | `15` | No |
| `JWT_REFRESH_TOKEN_EXPIRATION_DAYS` | Refresh token expiration (days) | `7` | No |

### CORS Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) | `http://localhost:3000,http://localhost:5173` | No |

### Server Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `API_HOST` | API server host | `0.0.0.0` | No |
| `API_PORT` | API server port | `8000` | No |

## Setup Instructions

### 1. Create Environment File

```bash
cd backend
copy .env.example .env
```

### 2. Configure Variables

Edit `.env` file with your configuration:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/ai_mlops_copilot

# JWT (IMPORTANT: Change this in production!)
JWT_SECRET=your-super-secret-key-here

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Server
API_HOST=0.0.0.0
API_PORT=8000
```

### 3. Generate Secure JWT Secret

For production, generate a secure JWT secret:

```bash
# Python
python -c "import secrets; print(secrets.token_urlsafe(64))"

# Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

### 4. Database Setup

1. Create PostgreSQL database:
   ```sql
   CREATE DATABASE ai_mlops_copilot;
   ```

2. Run migrations:
   ```bash
   cd backend
   alembic upgrade head
   ```

## Production Checklist

- [ ] Change `JWT_SECRET` to a secure random string
- [ ] Set `DEBUG=False`
- [ ] Configure proper `DATABASE_URL` with credentials
- [ ] Set appropriate `CORS_ORIGINS`
- [ ] Configure SSL/TLS for database connection
- [ ] Set up database connection pooling
- [ ] Configure logging
- [ ] Set up monitoring and alerts

## Development Defaults

The following defaults are provided for local development:

```env
APPLICATION_NAME=AI MLOps Copilot
DEBUG=True
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_mlops_copilot
JWT_SECRET=change-this-secret-in-production
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRATION_MINUTES=15
JWT_REFRESH_TOKEN_EXPIRATION_DAYS=7
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
API_HOST=0.0.0.0
API_PORT=8000
```

## Troubleshooting

### Database Connection Issues

1. Verify PostgreSQL is running
2. Check `DATABASE_URL` format
3. Ensure database exists
4. Verify user permissions

### JWT Issues

1. Verify `JWT_SECRET` is set and secure
2. Check token expiration settings
3. Ensure `JWT_ALGORITHM` is `HS256`

### CORS Issues

1. Verify `CORS_ORIGINS` includes your frontend URL
2. Check for trailing slashes
3. Ensure protocol is included (http/https)
