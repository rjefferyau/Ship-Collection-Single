// Type definitions for the Starship Collection Manager

// Starship interface
interface Starship {
  _id: string;
  name: string;
  registry: string;
  class: string;
  faction: string;
  commissioned: string;
  status: string;
  role: string;
  owned: boolean;
  imageUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// API Response interfaces
interface ApiResponse {
  success: boolean;
  message?: string;
  error?: string;
}

interface StarshipsResponse extends ApiResponse {
  starships: Starship[];
}

interface StarshipResponse extends ApiResponse {
  starship: Starship;
}

// Statistics interfaces
interface StatisticsData {
  totalStarships: number;
  ownedStarships: number;
  factionBreakdown: { [key: string]: { total: number; owned: number } };
  classBreakdown: { [key: string]: { total: number; owned: number } };
}

// Form data interfaces
interface StarshipFormData {
  name: string;
  registry: string;
  class: string;
  faction: string;
  commissioned: string;
  status: string;
  role: string;
  owned: boolean;
}

// Filter interfaces
interface SortConfig {
  key: keyof Starship | '';
  direction: 'asc' | 'desc';
}

interface Filters {
  search: string;
  faction: string[];
  class: string[];
  owned: 'all' | 'owned' | 'not-owned';
}

// Declare modules for file types
declare module '*.csv' {
  const content: string;
  export default content;
}

// Extend the Window interface
interface Window {
  bootstrap: any;
} 