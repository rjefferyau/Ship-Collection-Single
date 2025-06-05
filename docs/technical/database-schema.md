# Database Schema

This guide provides a comprehensive overview of the database schema used in the Starship Collection Manager. The application uses MongoDB with Mongoose for data modeling and management.

## Table of Contents
- [Overview](#overview)
- [Collections](#collections)
- [Models](#models)
- [Relationships](#relationships)
- [Indexes](#indexes)
- [Data Types](#data-types)

## Overview

### Database Structure
```
ship-collection/
├── starships/
├── manufacturers/
├── editions/
├── factions/
├── users/
└── system/
```

### Version Control
- Current version: v5
- Previous versions archived
- Migration tools available
- Backward compatibility maintained

## Collections

### Starships Collection
```javascript
{
  _id: ObjectId,
  name: String,
  faction: {
    type: ObjectId,
    ref: 'Faction'
  },
  edition: {
    type: ObjectId,
    ref: 'Edition'
  },
  manufacturer: {
    type: ObjectId,
    ref: 'Manufacturer'
  },
  details: {
    scale: String,
    releaseDate: Date,
    price: Number,
    condition: String,
    notes: String
  },
  status: {
    owned: Boolean,
    wishlist: Boolean,
    onOrder: Boolean,
    orderDate: Date,
    expectedArrival: Date
  },
  media: {
    images: [{
      url: String,
      caption: String,
      isPrimary: Boolean
    }],
    magazines: [{
      url: String,
      title: String,
      uploadDate: Date
    }]
  },
  priceHistory: [{
    price: Number,
    date: Date,
    type: String,
    notes: String
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### Manufacturers Collection
```javascript
{
  _id: ObjectId,
  name: String,
  website: String,
  contact: {
    email: String,
    phone: String,
    address: String
  },
  franchises: [{
    type: ObjectId,
    ref: 'Faction'
  }],
  products: [{
    type: ObjectId,
    ref: 'Starship'
  }],
  details: {
    founded: Date,
    location: String,
    specialties: [String],
    qualityRating: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Editions Collection
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  releaseDate: Date,
  endDate: Date,
  ships: [{
    type: ObjectId,
    ref: 'Starship'
  }],
  status: {
    active: Boolean,
    complete: Boolean
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Factions Collection
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  ships: [{
    type: ObjectId,
    ref: 'Starship'
  }],
  manufacturers: [{
    type: ObjectId,
    ref: 'Manufacturer'
  }],
  createdAt: Date,
  updatedAt: Date
}
```

## Models

### Starship Model
```javascript
const starshipSchema = new Schema({
  name: { type: String, required: true },
  faction: { type: Schema.Types.ObjectId, ref: 'Faction' },
  edition: { type: Schema.Types.ObjectId, ref: 'Edition' },
  manufacturer: { type: Schema.Types.ObjectId, ref: 'Manufacturer' },
  details: {
    scale: String,
    releaseDate: Date,
    price: Number,
    condition: String,
    notes: String
  },
  status: {
    owned: { type: Boolean, default: false },
    wishlist: { type: Boolean, default: false },
    onOrder: { type: Boolean, default: false },
    orderDate: Date,
    expectedArrival: Date
  },
  media: {
    images: [{
      url: String,
      caption: String,
      isPrimary: Boolean
    }],
    magazines: [{
      url: String,
      title: String,
      uploadDate: Date
    }]
  },
  priceHistory: [{
    price: Number,
    date: Date,
    type: String,
    notes: String
  }]
}, {
  timestamps: true
});
```

### Manufacturer Model
```javascript
const manufacturerSchema = new Schema({
  name: { type: String, required: true },
  website: String,
  contact: {
    email: String,
    phone: String,
    address: String
  },
  franchises: [{ type: Schema.Types.ObjectId, ref: 'Faction' }],
  products: [{ type: Schema.Types.ObjectId, ref: 'Starship' }],
  details: {
    founded: Date,
    location: String,
    specialties: [String],
    qualityRating: Number
  }
}, {
  timestamps: true
});
```

## Relationships

### One-to-Many
- Faction to Starships
- Edition to Starships
- Manufacturer to Starships

### Many-to-Many
- Manufacturers to Factions
- Starships to Images
- Starships to Magazines

### Referential Integrity
- Cascading deletes
- Update propagation
- Validation rules
- Error handling

## Indexes

### Primary Indexes
```javascript
// Starships
db.starships.createIndex({ name: 1 });
db.starships.createIndex({ faction: 1 });
db.starships.createIndex({ edition: 1 });
db.starships.createIndex({ manufacturer: 1 });

// Manufacturers
db.manufacturers.createIndex({ name: 1 });
db.manufacturers.createIndex({ franchises: 1 });

// Editions
db.editions.createIndex({ name: 1 });
db.editions.createIndex({ status: 1 });

// Factions
db.factions.createIndex({ name: 1 });
```

### Compound Indexes
```javascript
// Starships
db.starships.createIndex({ 
  faction: 1, 
  edition: 1, 
  status: 1 
});

// Manufacturers
db.manufacturers.createIndex({ 
  name: 1, 
  franchises: 1 
});
```

## Data Types

### Basic Types
- String
- Number
- Boolean
- Date
- ObjectId
- Array

### Custom Types
- Price (Number with validation)
- URL (String with validation)
- Email (String with validation)
- Phone (String with validation)

### Validation Rules
```javascript
// Price validation
price: {
  type: Number,
  min: 0,
  required: true
}

// URL validation
url: {
  type: String,
  match: /^https?:\/\/.+/,
  required: true
}

// Email validation
email: {
  type: String,
  match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  required: true
}
```

## Related Documentation
- [API Reference](api-reference.md)
- [Component Architecture](component-architecture.md)
- [State Management](state-management.md)
- [Database Maintenance](../data-management/database-maintenance.md) 