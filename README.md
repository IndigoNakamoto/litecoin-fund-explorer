# Database Explorer

A Next.js application for exploring and browsing your PostgreSQL database from the Litecoin OpenSource Fund project.

## Features

- 📊 Browse all database tables
- 🔍 View table data with pagination
- 📋 See column types and metadata
- 🎨 Clean, modern UI
- ⚡ Fast and responsive
- 🔒 Read-only access (safe for production)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Database Connection

Create a `.env.local` file in the root directory:

```bash
DATABASE_URL="postgres://default:password@ep-morning-frog-a48gjgxz.us-east-1.aws.neon.tech/verceldb?sslmode=require"
```

You can get the connection URL from the `Litecoin-OpenSource-Fund/.env.local` file. Use either:
- `POSTGRES_URL_NON_POOLING` (preferred for better performance)
- `POSTGRES_PRISMA_URL`
- Or construct from individual components

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the database explorer.

## Usage

1. **Browse Tables**: The left sidebar shows all available tables with their row counts
2. **View Data**: Click on any table to view its data
3. **Navigate**: Use pagination controls at the bottom to browse through large datasets
4. **Column Info**: Column names, types, and nullability are displayed in the table header

## Project Structure

```
litecoin-fund-explorer/
├── app/
│   ├── api/
│   │   └── tables/        # API routes for fetching table data
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main explorer page
├── components/
│   ├── TableList.tsx      # Sidebar table list component
│   └── TableViewer.tsx    # Table data viewer component
└── lib/
    └── prisma.ts          # PostgreSQL connection pool
```

## Technology Stack

- **Next.js 15** - React framework
- **PostgreSQL** - Direct connection using `pg` library
- **Tailwind CSS** - Styling
- **TypeScript** - Type safety

## Notes

- This tool is **read-only** - it doesn't allow editing or deleting data
- Large tables are paginated (50 rows per page) to improve performance
- The connection uses the same database as the main Litecoin-OpenSource-Fund project
- Uses direct SQL queries for maximum flexibility

## Troubleshooting

### Connection Error

If you see a connection error:
1. Verify your `DATABASE_URL` is correct in `.env.local`
2. Check that the database server is accessible
3. Ensure SSL mode is set correctly (`sslmode=require` for Neon databases)

### No Tables Showing

If no tables appear:
1. Check database permissions
2. Verify you're connected to the correct database
3. Check the browser console for errors

## Development

To build for production:

```bash
npm run build
npm start
```
