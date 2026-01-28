# EU Procurement Tracker

A web application that visualizes European public procurement data from TED (Tenders Electronic Daily) to make government spending transparent and accessible to citizens.

## Overview

EU Procurement Tracker provides an interactive map-based interface where users can explore procurement contracts by country, region, and city. The application displays contract values, awarding authorities, contractors, and procurement categories across EU member states.

### Features

- **Interactive Map**: Explore procurement spending across Europe with a Leaflet-powered map showing country-level aggregate bubbles sized by contract count and colored by total spending
- **Contract Browser**: Search and filter contracts by country, date range, amount, and keyword with paginated results
- **Statistics Dashboard**: Summary cards, bar charts (spending by country), and pie charts (spending by category)
- **Contract Details**: Full contract information including financial details, parties, classification, and a location mini-map
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Tailwind CSS |
| Mapping | Leaflet + react-leaflet |
| Charts | Recharts |
| Routing | React Router v6 |
| UI Icons | Lucide React |
| Backend | Node.js, Express, TypeScript |
| Dev Server | Vite (frontend), tsx (backend) |

## Project Structure

```
EU_spending/
├── frontend/           # React application
│   ├── src/
│   │   ├── api/        # API client and request functions
│   │   ├── components/ # Reusable components (Layout, Map, StatCard, etc.)
│   │   ├── pages/      # Route pages (Dashboard, Contracts, About)
│   │   ├── types/      # TypeScript type definitions
│   │   └── utils/      # Formatting utilities
│   └── ...
├── backend/            # Express API server
│   ├── src/
│   │   ├── data/       # Mock data generation and country coordinates
│   │   └── routes/     # API route handlers
│   └── ...
├── scripts/            # Data fetching and processing scripts
└── docs/               # Documentation
```

## Getting Started

### Prerequisites

- Node.js 18+ (developed with Node 22)
- npm 9+

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd EU_spending

# Install backend dependencies
cd backend
npm install
cp .env.example .env

# Install frontend dependencies
cd ../frontend
npm install
```

### Running Locally

Start both the backend and frontend development servers:

```bash
# Terminal 1: Start backend (port 3001)
cd backend
npm run dev

# Terminal 2: Start frontend (port 5173)
cd frontend
npm run dev
```

Open http://localhost:5173 in your browser.

The frontend Vite dev server proxies `/api/*` requests to the backend at `localhost:3001`.

### Building for Production

```bash
# Build frontend
cd frontend
npm run build

# Build backend
cd ../backend
npm run build
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/contracts` | List contracts (supports filtering, sorting, pagination) |
| GET | `/api/contracts/:id` | Single contract details |
| GET | `/api/stats/summary` | Overall summary statistics |
| GET | `/api/stats/by-country` | Spending aggregated by country |
| GET | `/api/stats/by-category` | Spending aggregated by CPV category |
| GET | `/api/stats/top-contractors` | Top contractors by total value |
| GET | `/api/map-data` | GeoJSON FeatureCollection for map |
| GET | `/api/map-data/countries` | Country-level summary for choropleth |

### Query Parameters (GET /api/contracts)

| Parameter | Type | Description |
|-----------|------|-------------|
| country | string | Country code (e.g., "DE") or comma-separated list |
| dateFrom | string | Start date (ISO format) |
| dateTo | string | End date (ISO format) |
| minAmount | number | Minimum contract value |
| maxAmount | number | Maximum contract value |
| category | string | CPV category keyword |
| search | string | Full-text search across title, buyer, contractor |
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 20, max: 100) |
| sortBy | string | Sort field: amount, publishDate, title, country |
| sortOrder | string | Sort direction: asc, desc |

## Data Source

This application uses data from **TED (Tenders Electronic Daily)**, the online journal for European public procurement.

- **Website**: https://ted.europa.eu
- **API Docs**: https://docs.ted.europa.eu/api/latest/index.html
- **Open Data**: https://data.europa.eu

The current version uses realistic mock data generated to mirror actual TED data structures. The mock dataset includes 200+ contracts across 20 EU member states with realistic amounts, dates, CPV categories, buyer names, and contractor names.

## License

This project is for educational and transparency purposes. TED data is published under EU open data policies.
