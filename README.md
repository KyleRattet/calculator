# Spreadsheet Calculator

A spreadsheet-like application. Built with TypeScript, React, and Express.

## Features

- **Real-time Evaluation**: Formulas calculate automatically as you type - no manual evaluation needed
- **Dynamic Grid Management**: Add/remove rows and columns with custom headers and delete functionality
- **Formula Support**: Enter formulas using cell references (e.g., `=A1+B1`, `=C1*1.2`)
- **Dependency Resolution**: Automatically resolves cell dependencies in correct order
- **Circular Reference Detection**: Detects and prevents infinite loops in formulas
- **Smart Reference Updates**: When deleting rows/columns, formulas automatically update to new positions
- **Error Handling**: Comprehensive error messages for invalid formulas and deleted references
- **Professional Design**: Healthcare-focused color scheme with medical industry UI standards
- **Responsive Layout**: Centered content (75% width), full-width header, horizontal scrolling for large tables
- **Sticky Headers**: Row and column headers stay visible when scrolling

## Architecture

- **Frontend**: React + TypeScript + Vite (Port 3000)
- **Backend**: Express + TypeScript + Node.js (Port 3001)
- **Development**: Docker Compose for containerized development

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (if running without Docker)

### Run with Docker

1. Clone the repository:

```bash
git clone https://github.com/KyleRattet/calculator.git
```

2. Start the application:

```bash
docker-compose up --build
```

3. Open your browser:
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:3001

### Run Locally (Without Docker)

1. **Start the backend** (Terminal 1):

```bash
cd backend
npm install
npm run dev
```

Backend will run on http://localhost:3000

2. **Start the frontend** (Terminal 2):

```bash
cd frontend
npm install
npm run dev
```

Frontend will run on http://localhost:3001

## Port Configuration

- **Frontend (React)**: Port 3001
- **Backend (Express)**: Port 3000
- **API Base URL**: http://localhost:3000

## Usage

### Basic Operations

1. **Enter Values**: Click any cell and type a number or text
2. **Enter Formulas**: Start with `=` (e.g., `=A1+B1`, `=A1*1.2`)
3. **Auto-Evaluation**: Formulas calculate automatically when you finish editing
4. **Cell References**: Use A1, B2, etc. to reference other cells
5. **Add Rows/Columns**: Use the + buttons in headers or toolbar
6. **Delete Rows/Columns**: Click the × button on row/column headers
7. **Edit Headers**: Click on row/column headers to rename them

### Formula Examples

```
=A1+B1          # Add two cells
=A1*1.2         # Multiply by constant
=A1-B1          # Subtract
=A1/B1          # Divide
=(A1+B1)*C1     # Use parentheses for precedence
```

### Error Handling

The application detects and displays:

- **Syntax Errors**: Invalid formula syntax
- **Circular References**: When cells reference each other in a loop
- **Missing References**: When formulas reference empty or non-existent cells
- **Deleted References**: When formulas reference deleted rows/columns
- **Type Errors**: When formulas reference non-numeric values

## API Documentation

### Base URL

```
http://localhost:3000/api
```

### Endpoints

#### Get Grid State

```http
GET /grid
```

#### Update Cell

```http
PUT /grid/cell/:cellId
Content-Type: application/json

{
  "input": "=A1+B1"
}
```

#### Evaluate Grid

```http
POST /grid/evaluate
```

#### Add Row/Column

```http
POST /grid/row
POST /grid/column
Content-Type: application/json

{
  "title": "Optional title"
}
```

#### Delete Row/Column

```http
DELETE /grid/row/:index
DELETE /grid/column/:index
```

#### Update Headers

```http
PUT /grid/row/:index/header
PUT /grid/column/:index/header
Content-Type: application/json

{
  "title": "New header title"
}
```

## Development

### Project Structure

```
care-plan-calculator/
├── docker-compose.yml          # Docker development environment
├── frontend/                   # Frontend React app (Port 3000)
│   ├── src/
│   │   ├── App.tsx            # Main application component
│   │   ├── App.css            # Healthcare-focused styling
│   │   ├── components/        # React components
│   │   │   ├── Grid.tsx       # Main grid component
│   │   │   ├── Cell.tsx       # Individual cell component
│   │   │   └── ErrorDisplay.tsx # Error handling UI
│   │   ├── types/             # TypeScript definitions
│   │   │   └── index.ts
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
├── backend/                    # Backend Express server (Port 3001)
│   ├── src/
│   │   ├── index.ts           # Server entry point
│   │   ├── models/            # Data models
│   │   │   ├── Cell.ts        # Cell model and logic
│   │   │   └── Grid.ts        # Grid management with delete functionality
│   │   ├── services/          # Business logic and utilities
│   │   │   ├── FormulaParser.ts # Formula parsing and evaluation
│   │   │   └── EvaluationService.ts # Grid operations service
│   │   └── routes/            # API routes
│   │       └── grid.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
└── README.md
```

### Docker Configuration

The application uses the provided Docker setup:

#### Root docker-compose.yml

```yaml
services:
  frontend:
    build:
      dockerfile: Dockerfile
      context: ./frontend
    container_name: pc_frontend
    ports:
      - '3001:3001'
  backend:
    build:
      dockerfile: Dockerfile
      context: ./backend
    container_name: pc_backend
    ports:
      - '3000:3000'
```

### Architecture Overview

#### Models vs Services

- **Models** (`/models`): Data structures and entities
  - `Cell.ts` - Represents a spreadsheet cell entity with coordinates, values, and formulas
  - `Grid.ts` - Represents the spreadsheet grid entity with cell management and operations

- **Services** (`/services`): Business logic and utilities
  - `FormulaParser.ts` - Stateless utility for parsing and evaluating spreadsheet formulas
  - `EvaluationService.ts` - Business logic layer for grid operations and API interactions

## Testing

### Manual Testing Scenarios

1. **Real-time Evaluation**
   - Enter `10` in A1 → See value immediately
   - Enter `=A1*2` in B1 → See `20` immediately
   - Change A1 to `20` → Watch B1 update to `40` automatically

2. **Grid Management**
   - Add rows/columns and verify formulas update correctly
   - Delete rows/columns and verify references adjust properly
   - Try to delete last row/column (should be prevented)

3. **Error Conditions**
   - Create circular references (A1=B1, B1=A1)
   - Delete a row referenced in formulas
   - Enter invalid formulas

### Example Test Data

Try this progression to test real-time evaluation:

```
Step 1: Enter in A1: 10          → Shows: 10
Step 2: Enter in B1: 100         → Shows: 100
Step 3: Enter in C1: =A1*B1      → Shows: 1000
Step 4: Enter in A2: =C1/2       → Shows: 500
Step 5: Enter in B2: 150         → Shows: 150
Step 6: Enter in C2: =A2*B2      → Shows: 75000
Step 7: Change A1 to: 20         → Watch C1→2000, A2→1000, C2→150000
```

## Branding & Design

### Color Palette

- **Primary Teals**: `#2c7da0` to `#014f73` (headers, buttons)
- **Accent Green**: `#2a9d8f` (success states, add buttons)
- **Accent Coral**: `#e76f51` (errors, delete buttons)
- **Neutrals**: Light teals and clean whites for medical aesthetic

## Deployment

### Environment Variables

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)
- `VITE_API_URL`: Frontend API URL (default: http://localhost:3000)

## License

MIT License - see LICENSE file for details.
