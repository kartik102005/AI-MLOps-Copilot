# Authentication Flow Diagram

## Overview

This document describes the authentication flow for AI MLOps Copilot.

## Flow Diagrams

### 1. Registration Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│   Server    │────▶│  Database   │
└─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │
      │ POST /auth/register                  │
      │──────────────────▶│                   │
      │                   │ Validate Input    │
      │                   │──────────────────▶│
      │                   │                   │
      │                   │ Normalize Email   │
      │                   │ Hash Password     │
      │                   │──────────────────▶│
      │                   │                   │
      │                   │ Create User       │
      │                   │──────────────────▶│
      │                   │                   │
      │ 201 Created       │◀──────────────────│
      │◀──────────────────│                   │
      │                   │                   │
```

### 2. Login Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│   Server    │────▶│  Database   │
└─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │
      │ POST /auth/login  │                   │
      │──────────────────▶│                   │
      │                   │ Find User by Email│
      │                   │──────────────────▶│
      │                   │                   │
      │                   │ Verify Password   │
      │                   │◀──────────────────│
      │                   │                   │
      │                   │ Generate Tokens   │
      │                   │ Update Last Login │
      │                   │──────────────────▶│
      │                   │                   │
      │ 200 OK            │◀──────────────────│
      │ {tokens, user}    │                   │
      │◀──────────────────│                   │
      │                   │                   │
```

### 3. Access Protected Route

```
┌─────────────┐     ┌─────────────┐
│   Client    │────▶│   Server    │
└─────────────┘     └─────────────┘
      │                   │
      │ GET /auth/profile │
      │ + Bearer Token    │
      │──────────────────▶│
      │                   │ Extract Token
      │                   │ Verify JWT
      │                   │ Get User from DB
      │                   │
      │ 200 OK            │
      │ {user profile}    │
      │◀──────────────────│
      │                   │
```

### 4. Token Refresh Flow

```
┌─────────────┐     ┌─────────────┐
│   Client    │────▶│   Server    │
└─────────────┘     └─────────────┘
      │                   │
      │ POST /auth/refresh│
      │ {refresh_token}   │
      │──────────────────▶│
      │                   │ Verify Refresh Token
      │                   │ Generate New Access Token
      │                   │
      │ 200 OK            │
      │ {access_token}    │
      │◀──────────────────│
      │                   │
```

### 5. Logout Flow

```
┌─────────────┐     ┌─────────────┐
│   Client    │────▶│   Server    │
└─────────────┘     └─────────────┘
      │                   │
      │ POST /auth/logout │
      │ {refresh_token}   │
      │──────────────────▶│
      │                   │ Invalidate Token
      │                   │ (Blacklist/Remove)
      │                   │
      │ 200 OK            │
      │ {message}         │
      │◀──────────────────│
      │                   │
```

### 6. Password Reset Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│   Server    │────▶│  Database   │
└─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │
      │ POST /auth/forgot-password            │
      │──────────────────▶│                   │
      │                   │ Find User         │
      │                   │──────────────────▶│
      │                   │                   │
      │                   │ Generate Token    │
      │                   │ Store Token       │
      │                   │──────────────────▶│
      │                   │                   │
      │ 200 OK            │◀──────────────────│
      │ {message}         │                   │
      │◀──────────────────│                   │
      │                   │                   │
      │ (User clicks link with token)        │
      │                   │                   │
      │ POST /auth/reset-password             │
      │ {token, new_password}                 │
      │──────────────────▶│                   │
      │                   │ Validate Token    │
      │                   │──────────────────▶│
      │                   │                   │
      │                   │ Hash New Password │
      │                   │ Update User       │
      │                   │ Mark Token Used   │
      │                   │──────────────────▶│
      │                   │                   │
      │ 200 OK            │◀──────────────────│
      │ {message}         │                   │
      │◀──────────────────│                   │
      │                   │                   │
```

## Token Structure

### Access Token (15 minutes)
```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "type": "access",
  "exp": 1234567890,
  "iat": 1234567890
}
```

### Refresh Token (7 days)
```json
{
  "sub": "user_id",
  "type": "refresh",
  "exp": 1234567890,
  "iat": 1234567890,
  "jti": "unique_token_id"
}
```

## Security Considerations

1. **Password Hashing**: All passwords are hashed using bcrypt before storage
2. **Token Expiration**: Access tokens expire in 15 minutes, refresh tokens in 7 days
3. **Email Normalization**: Emails are trimmed and converted to lowercase
4. **Rate Limiting**: Consider implementing rate limiting for authentication endpoints
5. **Token Blacklist**: For production, implement token blacklisting for logout
