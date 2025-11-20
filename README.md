# SS ERP Frontend

Enterprise-grade ERP frontend built with Next.js, TypeScript, Tailwind CSS, and shadcn/ui.

## Architecture

This frontend follows a **Domain-Driven Design (DDD)** architecture with strict separation of concerns:

```
src/
  app/                    # Next.js App Router pages
    (public)/             # Public routes (login, etc.)
    (private)/            # Protected routes (dashboard, etc.)
  modules/                # Feature modules (DDD structure)
    <ModuleName>/
      domain/            # Domain layer (types, schemas, logic)
      application/       # Application layer (services)
      ui/                # UI layer (components, pages)
  components/            # Reusable components
    ui/                  # shadcn/ui components
    layout/              # Layout primitives
    form/                # Form components
    table/               # Data table components
    nav/                 # Navigation components
  lib/                   # Core libraries
    api/                 # API client with interceptors
    auth/                # Authentication system
    cache/               # React Query configuration
    event-bus/           # Event system
    hooks/               # Shared hooks
    i18n/                # Internationalization
    logger/              # Logging system
    utils/               # Utilities
  config/                # Configuration files
  styles/                # Global styles and theme
```

## Features

- ✅ **Next.js 15** with App Router
- ✅ **TypeScript** (strict mode)
- ✅ **Tailwind CSS** with custom theme system
- ✅ **shadcn/ui** components
- ✅ **Domain-Driven Design** architecture
- ✅ **RBAC Permissions** system
- ✅ **Authentication** with access + refresh tokens
- ✅ **React Query** for data fetching and caching
- ✅ **Event Bus** for cross-module communication
- ✅ **i18n** support (ready for expansion)
- ✅ **Error Boundaries** and global error handling
- ✅ **Responsive** design (mobile, tablet, desktop)
- ✅ **Accessible** (WCAG AA compliant)

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended package manager)
- Backend API running (see backend README)

### Installation

1. **Install pnpm (if not already installed):**

```bash
npm install -g pnpm
```

2. **Install dependencies:**

```bash
pnpm install
```

3. **Set up environment variables:**

Create a `.env.local` file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and set your API URL:

```env
NEXT_PUBLIC_API_URL=http://localhost:3131/api
```

4. **Run the development server:**

```bash
pnpm dev
# or
pnpm start:dev
```

Open [http://localhost:3132](http://localhost:3132) in your browser.

### Build for Production

```bash
pnpm build
pnpm start
```

## Project Structure

### Modules (DDD)

Each module follows Domain-Driven Design:

- **domain/types.ts**: TypeScript interfaces
- **domain/schema.ts**: Zod validation schemas
- **domain/logic.ts**: Business logic (if needed)
- **application/service.ts**: API integration layer
- **ui/**: React components and pages

Example: `src/modules/profile/`

### Components

- **UI Components** (`components/ui/`): Reusable shadcn/ui-based components
- **Layout Components** (`components/layout/`): PageContainer, PageHeader, Sidebar, Topbar
- **Form Components** (`components/form/`): Form builders and inputs
- **Table Components** (`components/table/`): Data tables with sorting/filtering

### API Client

The API client (`lib/api/api-client.ts`) provides:

- Automatic token refresh on 401 errors
- Retry logic for failed requests
- Request/response logging
- Error handling
- Timeout management

### Authentication

Authentication is handled via:

- **Auth Store** (`lib/auth/auth-store.ts`): Zustand store with persistence
- **API Client**: Automatic token injection and refresh
- **Middleware** (`middleware.ts`): Route protection
- **Protected Layout**: Automatic redirect to login

### Permissions

RBAC permissions are checked using:

```typescript
import { usePermissions } from '@/lib/hooks/use-permissions';

function MyComponent() {
  const { hasPermission, hasAllAccess } = usePermissions();
  
  if (!hasPermission('module.submodule.feature.read')) {
    return <div>Access denied</div>;
  }
  
  return <div>Content</div>;
}
```

Permission format: `module.submodule.feature.operation`

Example: `human_resources.attendance.attendance_records.read`

### Theme System

The theme system uses CSS variables defined in `styles/theme.css`:

- Light/dark mode support
- Customizable colors
- Consistent design tokens

## Development Guidelines

### Adding a New Module

1. Create module directory: `src/modules/<ModuleName>/`
2. Add domain layer: `domain/types.ts`, `domain/schema.ts`
3. Add application layer: `application/service.ts`
4. Add UI layer: `ui/components/`, `ui/pages/`
5. Create route: `app/(private)/<module>/page.tsx`

### API Integration

All API calls go through service files:

```typescript
// src/modules/users/application/service.ts
import { apiClient } from '@/lib/api/api-client';
import { API_ENDPOINTS } from '@/config/api';

export class UsersService {
  async getList() {
    const response = await apiClient.get(API_ENDPOINTS.users.list);
    return response.data;
  }
}
```

### Using React Query

```typescript
import { useQuery } from '@tanstack/react-query';
import { usersService } from '@/modules/users/application/service';

function UsersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersService.getList(),
  });
  
  // ...
}
```

### Event Bus

For cross-module communication:

```typescript
import { eventBus, EVENTS } from '@/lib/event-bus/event-bus';

// Emit event
eventBus.emit(EVENTS.DATA_REFRESH, { module: 'users' });

// Listen to event
useEffect(() => {
  const unsubscribe = eventBus.on(EVENTS.DATA_REFRESH, (data) => {
    // Handle event
  });
  return unsubscribe;
}, []);
```

## Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run Biome linter
- `pnpm lint:fix` - Run Biome linter and fix issues
- `pnpm format` - Format code with Biome
- `pnpm format:check` - Check code formatting
- `pnpm check` - Run Biome check (lint + format)
- `pnpm check:fix` - Run Biome check and fix issues
- `pnpm type-check` - TypeScript type checking

## Backend Integration

This frontend integrates with the SS ERP Backend API:

- **Base URL**: Configured via `NEXT_PUBLIC_API_URL`
- **Authentication**: Access tokens in headers, refresh tokens in HTTP-only cookies
- **Endpoints**: See `src/config/api.ts` for all available endpoints

## Contributing

1. Follow the DDD architecture
2. Use TypeScript strictly
3. Follow SOLID principles
4. Write reusable components
5. Use the permission system for access control
6. Follow the naming conventions (PascalCase for modules, camelCase for functions)

## License

ISC
