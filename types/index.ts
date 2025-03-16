export interface Starship {
  _id: string;
  issue: string;
  edition: string;
  editionInternalName?: string;
  shipName: string;
  faction: string;
  collectionType: string;
  franchise: string;
  manufacturer?: string;
  releaseDate?: Date;
  imageUrl?: string;
  magazinePdfUrl?: string;
  owned: boolean;
  wishlist: boolean;
  wishlistPriority?: number;
  onOrder: boolean;
  pricePaid?: number;
  orderDate?: Date;
  retailPrice?: number;
  purchasePrice?: number;
  marketValue?: number;
}

export interface Faction {
  _id: string;
  name: string;
  description?: string;
}

export interface Edition {
  _id: string;
  name: string;
  internalName?: string;
  description?: string;
}

export interface SortConfig {
  key: keyof Starship | '';
  direction: 'asc' | 'desc';
}

export interface Filters {
  search: string;
  faction: string[];
  edition: string[];
  collectionType: string[];
  franchise: string[];
  owned: 'all' | 'owned' | 'not-owned' | 'wishlist' | 'on-order';
} 