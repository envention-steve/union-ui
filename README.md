# Union Benefits UI

A modern web application for managing union benefits, built with Next.js 15, TypeScript, and shadcn/ui components.

## Warp AI Guidelines

**For AI agents working on this project:**
- 🚫 DO NOT automatically run development servers (`npm run dev`)
- 👤 User manages server lifecycle manually
- ✅ Use build validation (`npm run build`) for testing changes only when requested
- 🎯 Focus on code implementation rather than server management

## Features

- 🔐 **Authentication System** - Secure login with JWT tokens
- 📱 **Responsive Design** - Mobile-first responsive interface
- 🎨 **Modern UI** - Built with shadcn/ui and Tailwind CSS
- 📊 **Dashboard** - Comprehensive overview of benefits and members
- 🏢 **Benefits Management** - Create, view, and manage benefit plans
- 👥 **Member Management** - Handle union member data and enrollments
- 🔄 **Real-time Data** - Powered by TanStack Query for optimal data fetching
- 🎯 **Type Safety** - Full TypeScript coverage for better development experience

## Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Modern component library built on Radix UI
- **Zustand** - Lightweight state management
- **TanStack Query** - Powerful data synchronization
- **React Hook Form** - Performant forms with easy validation
- **Zod** - TypeScript-first schema validation

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or pnpm
- FastAPI backend running on port 8000 (see `../union-api`)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## API Integration

The application is designed to work with the FastAPI backend located in `../union-api`. The API client is configured to communicate with endpoints at `http://localhost:8000`.

## Project Structure

```
union-ui/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages
│   └── (dashboard)/       # Protected dashboard pages
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── features/         # Feature-specific components
│   └── layout/           # Layout components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions
├── store/                # Zustand stores
├── types/                # TypeScript definitions
└── docs/                 # Documentation
```
