# Agentic Researcher - Next.js Frontend

This is the Next.js 16.0.3 frontend for the Agentic Researcher application, a modern research tool powered by AI agents.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Development Setup](#development-setup)
- [Environment Variables](#environment-variables)
- [Building for Production](#building-for-production)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Technology Stack](#technology-stack)

## Features

- **Next.js 16.0.3** with App Router and Server Components
- **React 19** with latest features
- **Turbopack** for fast development builds
- **Tailwind CSS 4** for modern styling
- **TypeScript** for type safety
- **shadcn/ui** components for beautiful UI
- **Recharts & D3.js** for data visualization
- Production-optimized with standalone output
- Security headers and best practices built-in

## Prerequisites

- **Node.js** 20.x or higher
- **npm** 10.x or higher
- **Python** 3.11+ (for backend)
- **uv** (Python package manager) - [Install uv](https://github.com/astral-sh/uv)
- **OpenAI API key** and **Tavily API key**

## Quick Start

가장 빠른 방법으로 백엔드와 프론트엔드를 한 번에 실행하세요:

### 1. 백엔드 환경 변수 설정

먼저 백엔드 API 키를 설정합니다:

```bash
# 백엔드 .env 파일 생성
cp ../agentic-researcher/backend/.env.example ../agentic-researcher/backend/.env

# .env 파일을 편집하여 API 키 입력
# OPENAI_API_KEY=your_openai_api_key_here
# TAVILY_API_KEY=your_tavily_api_key_here
```

### 2. 통합 스크립트로 실행

```bash
./start.sh
```

이 명령으로 다음이 자동으로 실행됩니다:
- 백엔드 의존성 설치 (필요한 경우)
- 프론트엔드 의존성 설치 (필요한 경우)
- 백엔드 서버 시작 (http://localhost:8080)
- Next.js 프론트엔드 시작 (http://localhost:3000)

### 3. 접속

브라우저에서 http://localhost:3000 을 열어 사용하세요.

### 서버 종료

```bash
./stop.sh
```

또는 터미널에서 `Ctrl+C`를 누르세요.

## Development Setup

1. **Navigate to the nextjs directory:**

   ```bash
   cd nextjs
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**

   Copy the example environment file:

   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local` with your configuration:

   ```env
   BACKEND_API_URL=http://localhost:8080
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Start the development server:**

   ```bash
   npm run dev
   ```

   The application will be available at [http://localhost:3000](http://localhost:3000)

5. **Start editing:**

   - Edit pages in `app/page.tsx`
   - Create new routes by adding folders in `app/`
   - Add components in `components/`
   - The page auto-updates as you edit files

## Environment Variables

### Development (.env.local)

```env
BACKEND_API_URL=http://localhost:8080
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Production (.env.production.local)

```env
BACKEND_API_URL=https://your-backend-url.run.app
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### Environment Variable Types

**SERVER-ONLY (no prefix):**
- Only available in server-side code
- NOT exposed to the browser
- Safe for API keys and secrets
- Example: `BACKEND_API_URL`

**PUBLIC (NEXT_PUBLIC_ prefix):**
- Available in both server and client code
- EXPOSED to the browser (visible in source)
- Should NOT contain secrets
- Example: `NEXT_PUBLIC_APP_URL`

## Building for Production

### Local Production Build

```bash
# Build the application
npm run build

# Start production server
npm start
```

The build creates a standalone output optimized for deployment.

### Build Output

- `.next/standalone/` - Minimal Node.js server
- `.next/static/` - Static assets
- `public/` - Public assets

## Deployment

### Deploying to Vercel (Recommended)

Vercel is the recommended platform for Next.js applications, providing automatic optimizations and zero-configuration deployment.

#### Option 1: Deploy via Vercel CLI

1. **Install Vercel CLI:**

   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**

   ```bash
   vercel login
   ```

3. **Deploy:**

   ```bash
   # From the nextjs directory
   vercel

   # For production
   vercel --prod
   ```

#### Option 2: Deploy via GitHub Integration

1. **Push your code to GitHub**

2. **Import project on Vercel:**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your repository
   - Select the `nextjs` directory as the root

3. **Configure environment variables:**
   - Add `BACKEND_API_URL` (your Cloud Run backend URL)
   - Add `NEXT_PUBLIC_APP_URL` (your Vercel domain)

4. **Deploy:**
   - Vercel will automatically deploy on every push to main

#### Environment Variables on Vercel

Set these in your Vercel project settings:

1. Go to Project Settings → Environment Variables
2. Add variables:
   - `BACKEND_API_URL` = `https://your-backend.run.app`
   - `NEXT_PUBLIC_APP_URL` = `https://your-app.vercel.app`
3. Select "Production" environment
4. Redeploy

### Backend CORS Configuration

Ensure your backend (Google Cloud Run) allows requests from your Vercel domain:

```env
# In backend/.env.production
CORS_ORIGINS=https://your-app.vercel.app,https://*.vercel.app
```

The wildcard `*.vercel.app` allows preview deployments to work.

### Deployment Checklist

- [ ] Backend is deployed to Google Cloud Run
- [ ] Backend CORS_ORIGINS includes Vercel domain
- [ ] Environment variables set on Vercel
- [ ] Production build succeeds (`npm run build`)
- [ ] Test the deployment URL
- [ ] Verify API calls work (check browser console)
- [ ] Test all pages and features
- [ ] Check security headers (use securityheaders.com)

## Project Structure

```
nextjs/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   ├── research/          # Research pages
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── research/         # Research-specific components
│   └── layout/           # Layout components
├── lib/                  # Utility functions
│   └── utils.ts         # Helper utilities
├── public/              # Static assets
├── next.config.ts       # Next.js configuration
├── tailwind.config.ts   # Tailwind CSS configuration
├── tsconfig.json        # TypeScript configuration
├── package.json         # Dependencies and scripts
├── vercel.json          # Vercel deployment config
└── .env.local           # Local environment variables
```

## Technology Stack

### Core Framework
- **Next.js 16.0.3** - React framework with App Router
- **React 19.2.0** - UI library with latest features
- **TypeScript 5** - Type-safe JavaScript

### Styling
- **Tailwind CSS 4** - Utility-first CSS framework
- **PostCSS** - CSS processing
- **class-variance-authority** - Component variants
- **tailwind-merge** - Merge Tailwind classes

### UI Components
- **shadcn/ui** - Accessible component library
- **Radix UI** - Headless UI primitives
- **Lucide React** - Icon library

### Data Visualization
- **Recharts 3.4.1** - React charting library
- **D3.js 7.9.0** - Data visualization primitives

### Development Tools
- **Turbopack** - Fast bundler (Next.js 16 default)
- **ESLint** - Code linting
- **TypeScript** - Type checking

## Available Scripts

```bash
# Development
npm run dev          # Start development server with Turbopack

# Production
npm run build        # Build for production
npm start            # Start production server

# Code Quality
npm run lint         # Run ESLint
```

## Performance Optimizations

The production build includes:

- **Standalone output** for minimal deployment size
- **Image optimization** with AVIF and WebP support
- **Security headers** (HSTS, CSP, etc.)
- **Automatic code splitting**
- **Server-side rendering** for faster initial loads
- **Static generation** where possible
- **ETags** for efficient caching
- **Compression** handled by Vercel

## Security Features

- Content Security Policy headers
- HTTPS enforcement (HSTS)
- XSS protection
- Clickjacking protection (X-Frame-Options)
- MIME type sniffing prevention
- Referrer policy configuration

## Learn More

### Next.js Resources
- [Next.js Documentation](https://nextjs.org/docs) - Learn about Next.js features
- [Next.js 16 Release Notes](https://nextjs.org/blog/next-16) - What's new
- [App Router Guide](https://nextjs.org/docs/app) - App Router documentation

### Deployment
- [Vercel Documentation](https://vercel.com/docs) - Deployment platform
- [Next.js Deployment](https://nextjs.org/docs/app/building-your-application/deploying) - Deployment guide

### Component Library
- [shadcn/ui](https://ui.shadcn.com/) - Component documentation
- [Radix UI](https://www.radix-ui.com/) - Primitive components

## Support

For issues or questions:
- Check the [Next.js GitHub repository](https://github.com/vercel/next.js)
- Review [Vercel documentation](https://vercel.com/docs)
- Consult the [project documentation](../docs/)

## License

See the root project LICENSE file.
