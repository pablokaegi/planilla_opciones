# Inky Web Frontend

Professional Options Strategizer web application built with Next.js 14, TypeScript, and AG Grid.

## Features

- 🎯 **Real-time Greeks Calculation**: Delta, Gamma, Theta, Vega, IV
- 📊 **High-Performance Grid**: AG Grid Community with custom renderers
- ⚡ **Smart Caching**: TanStack Query for efficient data management
- 🎨 **Dark Mode UI**: Modern, professional design with Tailwind CSS
- 📱 **Type-Safe**: Full TypeScript support
- 🔄 **Auto-refresh**: Configurable data refresh intervals

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend API running on http://localhost:8000

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.local.example .env.local
```

3. Update `.env.local` with your backend URL:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Running the Application

Development mode:
```bash
npm run dev
```

The app will be available at http://localhost:3000

Production build:
```bash
npm run build
npm start
```

## Project Structure

```
frontend/
├── app/
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Main page
│   └── globals.css         # Global styles
├── components/
│   └── OptionChainGrid.tsx # AG Grid component
├── lib/
│   ├── api_client.ts       # Axios API client
│   ├── query_client.tsx    # TanStack Query setup
│   └── types.ts            # TypeScript types
└── package.json
```

## Key Technologies

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type safety
- **AG Grid**: High-performance data grid
- **TanStack Query**: Server state management and caching
- **Tailwind CSS**: Utility-first styling
- **Axios**: HTTP client

## How TanStack Query Helps

TanStack Query provides:

1. **Automatic Caching**: Data is cached for 1 minute by default
2. **Background Refetching**: Stale data is refetched automatically
3. **Loading States**: Built-in loading/error states
4. **Request Deduplication**: Multiple requests to the same endpoint are deduplicated
5. **Optimistic Updates**: UI updates before server confirms

## API Integration

The frontend connects to the FastAPI backend at `http://localhost:8000/api/v1`

Endpoints used:
- `GET /chain/{ticker}?days_to_expiry=30` - Fetch option chain data

## Environment Variables

- `NEXT_PUBLIC_API_URL`: Backend API base URL (default: http://localhost:8000)

## Customization

### Modify Cache Time
Edit `lib/query_client.tsx`:
```typescript
staleTime: 60 * 1000, // 1 minute
gcTime: 5 * 60 * 1000, // 5 minutes
```

### Change Grid Theme
Edit `components/OptionChainGrid.tsx`:
```typescript
className="ag-theme-alpine-dark" // or ag-theme-alpine for light mode
```

## Troubleshooting

**Cannot connect to backend:**
- Ensure backend is running on http://localhost:8000
- Check CORS settings in backend
- Verify `.env.local` has correct API URL

**Grid not displaying:**
- Check browser console for errors
- Verify AG Grid CSS is imported
- Ensure data structure matches TypeScript types
