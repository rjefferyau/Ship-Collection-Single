# Component Architecture

This guide provides a comprehensive overview of the frontend component architecture used in the Starship Collection Manager. The application is built with Next.js and React, using a modular component structure.

## Table of Contents
- [Overview](#overview)
- [Component Structure](#component-structure)
- [Core Components](#core-components)
- [Feature Components](#feature-components)
- [Layout Components](#layout-components)
- [State Management](#state-management)

## Overview

### Directory Structure
```
src/
├── components/
│   ├── core/
│   ├── features/
│   ├── layout/
│   └── shared/
├── pages/
├── styles/
├── utils/
└── hooks/
```

### Technology Stack
- Next.js
- React
- Tailwind CSS
- Font Awesome
- React Query
- Zustand

## Component Structure

### Core Components
```
components/core/
├── Button/
├── Input/
├── Select/
├── Modal/
├── Card/
└── Table/
```

### Feature Components
```
components/features/
├── StarshipList/
├── StarshipCard/
├── ManufacturerList/
├── GalleryView/
├── Statistics/
└── Wishlist/
```

### Layout Components
```
components/layout/
├── Header/
├── Sidebar/
├── Footer/
├── Navigation/
└── Container/
```

## Core Components

### Button Component
```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger';
  size: 'sm' | 'md' | 'lg';
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant,
  size,
  onClick,
  disabled,
  children
}) => {
  // Component implementation
};
```

### Input Component
```typescript
interface InputProps {
  type: 'text' | 'number' | 'email' | 'password';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  label?: string;
}

const Input: React.FC<InputProps> = ({
  type,
  value,
  onChange,
  placeholder,
  error,
  label
}) => {
  // Component implementation
};
```

## Feature Components

### StarshipList Component
```typescript
interface StarshipListProps {
  starships: Starship[];
  onStarshipClick: (starship: Starship) => void;
  onStatusChange: (id: string, status: Status) => void;
  filters: FilterOptions;
  sortOptions: SortOptions;
}

const StarshipList: React.FC<StarshipListProps> = ({
  starships,
  onStarshipClick,
  onStatusChange,
  filters,
  sortOptions
}) => {
  // Component implementation
};
```

### GalleryView Component
```typescript
interface GalleryViewProps {
  items: GalleryItem[];
  onItemClick: (item: GalleryItem) => void;
  viewOptions: ViewOptions;
  onViewChange: (options: ViewOptions) => void;
}

const GalleryView: React.FC<GalleryViewProps> = ({
  items,
  onItemClick,
  viewOptions,
  onViewChange
}) => {
  // Component implementation
};
```

## Layout Components

### Header Component
```typescript
interface HeaderProps {
  user: User;
  onLogout: () => void;
  onThemeChange: (theme: Theme) => void;
}

const Header: React.FC<HeaderProps> = ({
  user,
  onLogout,
  onThemeChange
}) => {
  // Component implementation
};
```

### Navigation Component
```typescript
interface NavigationProps {
  items: NavItem[];
  activeItem: string;
  onItemClick: (item: NavItem) => void;
}

const Navigation: React.FC<NavigationProps> = ({
  items,
  activeItem,
  onItemClick
}) => {
  // Component implementation
};
```

## State Management

### Store Structure
```typescript
interface AppState {
  starships: StarshipState;
  manufacturers: ManufacturerState;
  ui: UIState;
  user: UserState;
}

interface StarshipState {
  items: Starship[];
  loading: boolean;
  error: string | null;
  filters: FilterOptions;
  sortOptions: SortOptions;
}
```

### Actions
```typescript
const useStarshipStore = create<StarshipState>((set) => ({
  items: [],
  loading: false,
  error: null,
  filters: defaultFilters,
  sortOptions: defaultSortOptions,
  
  setStarships: (starships: Starship[]) => 
    set({ items: starships }),
    
  setLoading: (loading: boolean) => 
    set({ loading }),
    
  setError: (error: string | null) => 
    set({ error }),
    
  updateFilters: (filters: FilterOptions) => 
    set({ filters }),
    
  updateSortOptions: (options: SortOptions) => 
    set({ sortOptions })
}));
```

## Component Communication

### Props
- Parent to child communication
- Type safety with TypeScript
- Default values
- Prop validation

### Events
- Child to parent communication
- Event handlers
- Callback functions
- Event bubbling

### Context
- Global state
- Theme context
- User context
- Settings context

## Styling

### Tailwind CSS
```typescript
// Example component with Tailwind classes
const Card: React.FC<CardProps> = ({ title, children }) => (
  <div className="bg-white rounded-lg shadow-md p-4">
    <h2 className="text-xl font-bold mb-4">{title}</h2>
    <div className="text-gray-700">{children}</div>
  </div>
);
```

### Custom Styles
```typescript
// Custom styles with CSS modules
import styles from './Card.module.css';

const Card: React.FC<CardProps> = ({ title, children }) => (
  <div className={styles.card}>
    <h2 className={styles.title}>{title}</h2>
    <div className={styles.content}>{children}</div>
  </div>
);
```

## Performance Optimization

### Code Splitting
- Dynamic imports
- Lazy loading
- Route-based splitting
- Component-based splitting

### Memoization
```typescript
const MemoizedComponent = React.memo(({ data }) => {
  // Component implementation
});

const useMemoizedValue = useMemo(() => {
  // Expensive calculation
}, [dependencies]);
```

## Related Documentation
- [API Reference](api-reference.md)
- [Database Schema](database-schema.md)
- [State Management](state-management.md)
- [Troubleshooting Guide](../troubleshooting/common-issues.md) 