# Todo Platform - Frontend

Modern, polished React frontend application built with Vite, TypeScript, and Tailwind CSS.

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 4
- **Routing**: React Router v6
- **State Management**:
  - Zustand for UI state (theme, etc.)
  - TanStack Query (React Query) for server state
- **HTTP Client**: Axios with interceptors
- **Styling**: Tailwind CSS with custom theme tokens
- **UI Components**: Headless UI for accessible components
- **Icons**: Heroicons + Lucide React
- **Forms**: React Hook Form + Zod validation
- **Animations**: Framer Motion
- **Notifications**: React Hot Toast
- **Testing**: Vitest + React Testing Library
- **SEO**: React Helmet Async

## Project Structure

```
src/
├── app/              # Application providers and configuration
│   └── providers.tsx # React Query, Toast, Helmet providers
├── components/       # Shared UI components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   ├── Layout.tsx
│   ├── Sidebar.tsx
│   ├── Topbar.tsx
│   ├── ThemeToggle.tsx
│   └── LoadingSpinner.tsx
├── features/         # Feature-based modules
│   ├── todos/        # Todo-specific components and logic
│   └── categories/   # Category-specific components and logic
├── hooks/            # Custom React hooks
│   ├── useMediaQuery.ts
│   └── useLocalStorage.ts
├── lib/              # External library configurations
│   └── api-client.ts # Axios instance with interceptors
├── pages/            # Route page components
│   ├── DashboardPage.tsx
│   ├── TodosPage.tsx
│   ├── CategoriesPage.tsx
│   ├── TagsPage.tsx
│   ├── CalendarPage.tsx
│   ├── SettingsPage.tsx
│   └── NotFoundPage.tsx
├── routes/           # Router configuration
│   └── index.tsx
├── stores/           # Zustand stores
│   └── theme-store.ts
├── styles/           # Global styles and Tailwind config
│   └── global.css
├── test/             # Test utilities and setup
│   └── setup.ts
├── types/            # TypeScript type definitions
│   └── index.ts
├── utils/            # Utility functions
│   └── cn.ts         # Class name merger utility
├── App.tsx           # Root app component
└── main.tsx          # Application entry point
```

## Key Features

### Theme System

- Support for light, dark, and system themes
- Persistent theme preference using localStorage
- Automatic system theme detection
- Theme toggle component with smooth transitions

### API Client

- Axios instance configured with base URL and interceptors
- Automatic authentication token injection
- Global error handling with user-friendly toasts
- Request/response interceptors for logging and error handling

### React Query Setup

- Configured Query Client with sensible defaults
- 5-minute stale time for queries
- Automatic retry logic
- React Query DevTools in development

### Routing

- React Router v6 with nested routes
- Protected route structure (ready for authentication)
- Layout component with sidebar and topbar
- 404 page for unmatched routes

### Responsive Design

- Mobile-first approach with Tailwind CSS
- Custom breakpoints and utilities
- Responsive sidebar navigation
- Optimized for desktop and mobile devices

## Styling Approach

### Tailwind Configuration

Custom theme tokens defined in `tailwind.config.js`:

- **Colors**: Primary (blue) and gray scales with dark mode support
- **Typography**: Inter font family with custom line heights
- **Animations**: Fade-in and slide-up animations
- **Spacing**: Extended spacing scale

### CSS Architecture

- Tailwind utility classes for most styling
- Custom CSS components in `@layer components`
- Global base styles in `@layer base`
- Utility helpers like `cn()` for dynamic class names

### Component Patterns

- Reusable UI components with variant support
- Consistent prop interfaces across components
- TypeScript types for component props
- Forward refs for input components

## Scripts

```bash
# Development
npm run dev              # Start development server (http://localhost:5173)

# Building
npm run build            # Type-check and build for production
npm run preview          # Preview production build locally

# Code Quality
npm run lint             # Lint code with ESLint
npm run lint:fix         # Auto-fix linting issues
npm run type-check       # Run TypeScript compiler checks

# Testing
npm test                 # Run tests in watch mode
npm run test:ui          # Run tests with UI
npm run test:coverage    # Generate test coverage report
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
VITE_API_BASE_URL=/api
```

## Development Workflow

1. **Start Development Server**

   ```bash
   npm run dev
   ```

2. **Code Style**
   - ESLint enforces code quality rules
   - Prettier formats code automatically
   - Pre-commit hooks run linting and formatting

3. **Type Safety**
   - Strict TypeScript mode enabled
   - Type definitions in `src/types/`
   - Path aliases configured for cleaner imports

4. **Testing**
   - Write tests alongside components
   - Use Vitest for unit and integration tests
   - React Testing Library for component testing

## Adding New Features

### Creating a New Page

1. Create page component in `src/pages/`
2. Add route in `src/routes/index.tsx`
3. Add navigation link in `src/components/Sidebar.tsx`

### Creating a New Feature Module

1. Create directory in `src/features/[feature-name]/`
2. Add components, hooks, and types specific to the feature
3. Export public API from `index.ts`

### Adding API Endpoints

1. Use the configured `apiClient` from `src/lib/api-client.ts`
2. Create service functions for API calls
3. Use React Query hooks for data fetching

Example:

```typescript
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export function useTodos() {
  return useQuery({
    queryKey: ['todos'],
    queryFn: async () => {
      const { data } = await apiClient.get('/todos');
      return data;
    },
  });
}
```

## Performance Optimization

- **Code Splitting**: Configured in Vite with manual chunks
- **Lazy Loading**: Use React.lazy() for route-based splitting
- **Tree Shaking**: Automatic with Vite and ES modules
- **Asset Optimization**: Vite automatically optimizes assets

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES2020+ features
- CSS Grid and Flexbox
- Native CSS custom properties (for theming)

## Troubleshooting

### Build Issues

- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf .vite`

### TypeScript Errors

- Run type-check: `npm run type-check`
- Check path aliases in `tsconfig.json`

### Styling Issues

- Verify Tailwind CSS is properly configured
- Check that `global.css` is imported in `main.tsx`
- Ensure dark mode classes are applied correctly

## Next Steps

1. Implement authentication flow
2. Add real API integrations
3. Create CRUD operations for todos
4. Implement drag-and-drop for todo reordering
5. Add calendar view with date-fns
6. Implement advanced filtering and search
7. Add real-time updates with WebSockets

## Contributing

Follow the established patterns:

- Use TypeScript for type safety
- Follow the component structure
- Write tests for new components
- Update this README for significant changes
