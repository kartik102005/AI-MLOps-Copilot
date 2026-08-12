# AI MLOps Copilot

# Database Design Document (DDD)

**Document Version:** 1.0  
**Document Type:** Database Design Document (DDD)  
**Project Status:** Approved  
**Prepared By:** Project Team  
**Department:** Artificial Intelligence and Data Science  
**Academic Year:** B.E. (AI & DS) – 2026–27

---

# Document Information

| Field | Value |
|--------|-------|
| Project Name | AI MLOps Copilot |
| Document Name | Database Design Document |
| Version | 1.0 |
| Status | Approved |
| Database | PostgreSQL |
| Intended Audience | Backend Developers, Database Engineers, Test Engineers |

---

# Version History

| Version | Date | Description | Author |
|----------|------|-------------|--------|
| 1.0 | DD/MM/YYYY | Initial Database Design Document | Project Team |

---

# Table of Contents

1. Introduction
2. Database Objectives
3. Database Technology
4. Database Architecture
5. Entity Relationship Overview
6. Table Design
7. Relationship Design
8. Constraints
9. Indexing Strategy
10. Normalization
11. Data Dictionary
12. Backup & Recovery
13. Security
14. Future Enhancements

---

# 1. Introduction

## Purpose

This document defines the database architecture and schema for AI MLOps Copilot. It describes the entities, relationships, constraints, and storage strategy required to support the application.

---

# 2. Database Objectives

The database is designed to:

- Store user information securely.
- Manage projects and deployment history.
- Store Dockerfile and CI/CD configurations.
- Store uploaded deployment logs.
- Store AI-generated troubleshooting recommendations.
- Maintain data integrity and scalability.

---

# 3. Database Technology

| Component | Technology |
|-----------|------------|
| Database | PostgreSQL |
| ORM | SQLAlchemy |
| Migration Tool | Alembic |

---

# 4. Database Architecture

```text
Frontend
     │
     ▼
FastAPI Backend
     │
SQLAlchemy ORM
     │
PostgreSQL Database
```

---

# 5. Entity Relationship Overview

The primary entities are:

- Users
- Projects
- Dockerfiles
- CI/CD Configurations
- Deployment Logs
- AI Recommendations
- Deployment History

---

## Entity Relationship Diagram (Conceptual)

```text
Users
   │
   │ 1:N
   ▼
Projects
   │
   ├──────────────┐
   ▼              ▼
Dockerfiles   CI/CD Configurations
   │              │
   └──────┬───────┘
          ▼
Deployment History
          │
          ▼
Deployment Logs
          │
          ▼
AI Recommendations
```

---

# 6. Table Design

## users

| Column | Type | Constraint |
|--------|------|------------|
| id | UUID | Primary Key |
| full_name | VARCHAR(100) | NOT NULL |
| email | VARCHAR(255) | UNIQUE |
| password_hash | TEXT | NOT NULL |
| role | VARCHAR(20) | DEFAULT 'developer' |
| created_at | TIMESTAMP | NOT NULL |
| updated_at | TIMESTAMP | NOT NULL |

---

## projects

| Column | Type | Constraint |
|--------|------|------------|
| id | UUID | Primary Key |
| user_id | UUID | Foreign Key |
| project_name | VARCHAR(150) | NOT NULL |
| description | TEXT | NULL |
| project_type | VARCHAR(50) | NOT NULL |
| repository_url | TEXT | NULL |
| created_at | TIMESTAMP | NOT NULL |
| updated_at | TIMESTAMP | NOT NULL |

---

## dockerfiles

| Column | Type | Constraint |
|--------|------|------------|
| id | UUID | Primary Key |
| project_id | UUID | Foreign Key |
| dockerfile_content | TEXT | NOT NULL |
| generated_at | TIMESTAMP | NOT NULL |

---

## cicd_configurations

| Column | Type | Constraint |
|--------|------|------------|
| id | UUID | Primary Key |
| project_id | UUID | Foreign Key |
| workflow_content | TEXT | NOT NULL |
| provider | VARCHAR(50) | DEFAULT 'GitHub Actions' |
| generated_at | TIMESTAMP | NOT NULL |

---

## deployment_history

| Column | Type | Constraint |
|--------|------|------------|
| id | UUID | Primary Key |
| project_id | UUID | Foreign Key |
| deployment_status | VARCHAR(30) | NOT NULL |
| deployed_at | TIMESTAMP | NOT NULL |

---

## deployment_logs

| Column | Type | Constraint |
|--------|------|------------|
| id | UUID | Primary Key |
| deployment_id | UUID | Foreign Key |
| log_content | TEXT | NOT NULL |
| uploaded_at | TIMESTAMP | NOT NULL |

---

## ai_recommendations

| Column | Type | Constraint |
|--------|------|------------|
| id | UUID | Primary Key |
| deployment_log_id | UUID | Foreign Key |
| recommendation | TEXT | NOT NULL |
| confidence_score | DECIMAL(4,2) | NULL |
| created_at | TIMESTAMP | NOT NULL |

---

# 7. Relationship Design

| Parent Table | Child Table | Relationship |
|--------------|-------------|--------------|
| users | projects | One-to-Many |
| projects | dockerfiles | One-to-One |
| projects | cicd_configurations | One-to-One |
| projects | deployment_history | One-to-Many |
| deployment_history | deployment_logs | One-to-One |
| deployment_logs | ai_recommendations | One-to-One |

---

# 8. Constraints

Primary Keys

- All tables use UUID primary keys.

Foreign Keys

- projects.user_id → users.id
- dockerfiles.project_id → projects.id
- cicd_configurations.project_id → projects.id
- deployment_history.project_id → projects.id
- deployment_logs.deployment_id → deployment_history.id
- ai_recommendations.deployment_log_id → deployment_logs.id

Additional Constraints

- Email must be unique.
- Passwords must be stored as hashes.
- Foreign key integrity must be enforced.

---

# 9. Indexing Strategy

Indexes will be created on:

- users.email
- projects.user_id
- deployment_history.project_id
- deployment_logs.deployment_id
- ai_recommendations.deployment_log_id

Purpose:

- Faster authentication
- Faster project lookup
- Improved query performance

---

# 10. Normalization

The database follows Third Normal Form (3NF).

Benefits:

- Reduced redundancy
- Improved consistency
- Easier maintenance
- Better scalability

---

# 11. Data Dictionary

| Entity | Description |
|--------|-------------|
| Users | Registered platform users |
| Projects | User-created ML projects |
| Dockerfiles | Generated Docker configuration files |
| CI/CD Configurations | Generated workflow files |
| Deployment History | Deployment records |
| Deployment Logs | Uploaded deployment logs |
| AI Recommendations | AI-generated troubleshooting suggestions |

---

# 12. Backup & Recovery

Recommended strategy:

- Daily automated database backup
- Weekly full backup
- Restore testing every month
- Secure off-site backup storage

---

# 13. Security

Database security measures include:

- Password hashing (bcrypt)
- Encrypted database connections
- Least-privilege database access
- Parameterized queries
- ORM-based SQL execution
- Regular backups

---

# 14. Future Enhancements

Potential database improvements:

- Audit logging tables
- Notification storage
- Team collaboration tables
- Role-Based Access Control (RBAC)
- API usage history
- AI prompt history
- Project versioning

---

# Database Summary

The AI MLOps Copilot database is designed as a normalized PostgreSQL schema using UUID primary keys, strong referential integrity, and modular entity relationships. The structure supports secure user management, project tracking, deployment workflows, log analysis, and AI-generated recommendations while remaining scalable for future enhancements.

---

# End of Document