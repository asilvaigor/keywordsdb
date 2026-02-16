# KeywordsDB

## Overview

This repository contains a keyword research platform that provides Google search keyword data with metrics like search volume, CPC, and competition index. The platform consists of a Next.js webapp, Python workers for data ingestion, and GCP infrastructure managed by Terraform.

## Key Features

- Landing page: SEO-focused content. A demo interactive table with sample keyword data. Free trial with 10 free queries is available after email sign-up.
- Dashboard: Authenticated area with a keyword research tool. Users can search for keywords and view metrics in a table with pagination and sorting. They can do custom filters on volume, cpc, competition etc.

## Architecture

### Webapp (`/webapp`)
Next.js 16 application with React 19 serving the public website and authenticated dashboard.

**Tech Stack:**
- **Framework**: Next.js 16 with App Router, React 19, TypeScript
- **Styling**: Tailwind CSS 4, shadcn/ui components, Radix UI primitives
- **Authentication**: better-auth with Google OAuth and magic link email sign-in
- **Database**: ClickHouse for keyword queries, Firestore for caching and user/auth data
- **Data Fetching**: SWR for client-side data fetching with streaming support
- **Analytics**: PostHog
- **Linting**: Biome (not ESLint)
- **Package Manager**: Bun

**Key Patterns:**
- Server components by default, use `"use client"` only when necessary
- Custom hooks prefixed with `use-` for table state management (`use-keywords-query`, `use-pagination`, etc.)
- Streaming responses from API routes for real-time progress updates
- Custom Firestore adapter for better-auth integration
- Dark theme by default with next-themes provider

**File Organization:**
- `/app/*` - Next.js pages and API routes
- `/components/*` - React components organized by feature
- `/lib/*` - Utility functions, database clients, type definitions
- `/public/*` - Static assets

**Deployment:**
- Deployed on Cloud Run with a custom domain
- CI/CD via GitHub Actions and Cloud Build
- Environment variables managed in Cloud Run

### Workers (`/workers`)
Python workers for ingesting keyword data from Google Ads and Bing Ads APIs.

**Tech Stack:**
- **Language**: Python 3.14+
- **Package Manager**: uv
- **Data Processing**: Polars with PyArrow
- **APIs**: Google Ads API, Bing Ads API
- **Cloud Services**: BigQuery, Cloud Storage, Firestore, Secret Manager
- **Database**: BigQuery as a write database, ClickHouse as a read database. Cloud storage for intermediate data files.
- **Logging**: structlog
- **Linting**: Ruff

**File Organization:**
- `/src/workers/*` - Worker implementations (bing, ingestion)
- `/src/services/*` - Shared services (ads, bigquery, clickhouse, storage, etc.)

**Worker Jobs**
- Scheduled via Cloud Scheduler
- Fetch data from Google Ads / Bing Ads APIs
- Process with Polars and store in BigQuery
- Periodically export to Cloud Storage and load into ClickHouse as a read-replica
- Use Secret Manager for API credentials
- Structured logging for observability

### Infrastructure (`/tf`)
Terraform configuration for GCP resources.

**Providers:**
- Google Cloud Platform (primary)
- GitHub (for CI/CD integration)
- Cloudflare (for CDN/DNS)

**Key Resources:**
- Cloud Run (webapp hosting)
- Cloud Build (CI/CD)
- ClickHouse Cloud (keyword database)
- Firestore (user/auth data)
- Cloud Storage (data files)
- Cloud Scheduler (worker jobs)
- BigQuery (data analytics)
- Secret Manager (credentials)

## Development Workflow

```bash
# Webapp
cd webapp
bun install
bun dev          # Start dev server
bun lint         # Run Biome checks
bun format       # Format and fix issues

# Workers
cd workers
uv venv          # Create virtual environment
uv sync          # Install dependencies
# Run notebooks for testing

# Infrastructure
cd tf
gcloud auth application-default login
gh auth login
terraform apply
```
