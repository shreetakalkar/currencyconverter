# CurrCon - Real-Time Currency Utility & Travel Planner

A clean, fast, full-stack currency conversion utility with 30-day historical trend visualization, SQLite-backed caching & persistence, intelligent market timing advice, and an advanced Travel Budgeting engine.

Built in **JavaScript** with a **Node.js Express** backend following the **MVC (Model-View-Controller)** pattern.

---

## Key Features

### 1. Dual Converter
* **Side-by-Side Currency Dropdowns**: Instant selection across 27+ global currencies with national flags and currency codes.
* **Instant Calculation**: Real-time debounced conversion with formatted currency outputs.
* **Quick Amount Chips**: Pre-set buttons for \$50, \$100, \$500, \$1,000, and \$5,000.
* **Interactive Swap Action**: Smooth animated rotation swapping source and target currencies.
* **Live Unit Breakdown**: Direct rate (`1 USD = 0.8603 EUR`), inverse rate (`1 EUR = 1.1624 USD`), and live timestamps.
* **Favorites Star**: One-click bookmarking of active currency pairs.

### 2. 30-Day Historical Trend Charts
* **Responsive Line Graph**: Rendered via Chart.js with smooth curves, gradient fill, and dark-theme tooltips.
* **Statistical Metrics**: Real-time calculation of **30-Day High**, **30-Day Low**, **30-Day Average**, and **Percentage Change (%)**.
* **Automatic Synchronization**: Dynamic redraws whenever currencies are swapped or favorites are clicked.

### 3. Quick-Access Favorites
* **SQLite Persistence**: Stored locally in SQLite (`favorites` table) with pre-seeded pairs (`USD/EUR`, `USD/GBP`, `USD/JPY`, `EUR/GBP`, `USD/CAD`).
* **Live Rate Badges**: Real-time unit rates displayed directly on each favorite card.
* **1-Click Load**: Clicking any card instantly populates the converter and refreshes the chart.
* **Direct Deletion**: Dedicated trash button to remove saved pairs.

### 4. Travel Budgeting & TravelSpend IQ
* **Simultaneous 5-Currency Translation**: Converts a single base budget into 5 major global currencies (`EUR`, `GBP`, `JPY`, `CHF`, `CAD`/`AUD`) simultaneously.
* **Trip Duration Controls**: Select between **3 Days (Weekend)**, **7 Days (1 Week)**, **14 Days (2 Weeks)**, or **30 Days (1 Month)**.
* **Daily Spending Allowance**: Automatically computes `Total Budget ÷ Days` for every destination.
* **Category Breakdown**:
  * Lodging Allowance (~45%)
  * Food & Dining (~35%)
  * Activities & Transit (~20%)
* **Export & Sharing**:
  * **Export CSV**: Download a structured spreadsheet itinerary file.
  * **Copy Summary**: Formatted multi-currency clipboard summary.

### 5. RateRadar™ Market Timing Advisor
* **Algorithmic Timing Score**: Analyzes where the current live rate sits within the 30-day statistical boundary.
* **Actionable Advice**:
  * **Favorable (Score >= 70%)**: *"Near 30-day peak. Highly favorable time to convert"*
  * **Neutral (30% to 70%)**: *"Holding steady near 30-day average"*
  * **Unfavorable (Score <= 30%)**: *"Near 30-day low. Consider waiting for a rebound"*
* **Volatility Gauge**: Displays market dispersion as Low, Moderate, or High.

### 6. Deep Linking & Shareable URLs
* Synchronizes conversion and travel parameters directly to browser URL query strings (`?src=USD&tgt=EUR&amt=2500&travel=1&days=14`).
* **Share Link** button copies the exact link to clipboard for instant sharing or bookmarking.

### 7. SQLite Cache & Resilience
* **Rates Cache**: 30-minute TTL SQLite cache prevents external API rate limits and provides sub-millisecond responses.
* **Conversion History**: Automatically persists past conversions with full details and a one-click "Clear History" option.

---

## Architecture & Project Structure

The project is structured under an MVC (Model-View-Controller) architecture:

```
currcon/
├── .gitignore                         # Ignores node_modules, logs, and database files
├── package.json                       # Project configuration and npm scripts
├── server.js                          # Express application entry point
├── README.md                          # Documentation
├── src/
│   ├── server.js                      # Root runner for flexible CWD execution
│   ├── config/
│   │   └── database.js                # SQLite database connection and schemas
│   ├── constants/
│   │   └── currencies.js              # Currency metadata dictionary and flags
│   ├── utils/
│   │   ├── dateUtils.js               # ISO/YMD formatters and date delta helpers
│   │   └── mathUtils.js               # Rounding, stats, and market signal algorithms
│   ├── middleware/
│   │   ├── validator.js               # Input validation middleware
│   │   └── errorHandler.js            # Centralized Express error handler
│   ├── models/
│   │   ├── cacheModel.js              # SQLite exchange rates cache
│   │   ├── favoriteModel.js           # SQLite user favorites persistence
│   │   └── historyModel.js            # SQLite conversion history persistence
│   ├── services/
│   │   └── exchangeService.js         # Core exchange, trends, and budget logic
│   ├── controllers/
│   │   ├── currencyController.js      # Conversion, trends, and travel endpoints
│   │   ├── favoriteController.js      # Favorites CRUD controller
│   │   └── historyController.js       # History listing and clearing controller
│   └── routes/
│       ├── apiRoutes.js               # Main API aggregator router
│       ├── currencyRoutes.js          # Currency, rates, conversion, and travel routes
│       ├── favoriteRoutes.js          # Favorites routes
│       └── historyRoutes.js           # History routes
├── public/
│   ├── index.html                     # Responsive UI shell with ES module entry
│   ├── css/
│   │   └── style.css                  # Modern dark-mode fintech styles
│   └── js/
│       ├── app.js                     # Main client orchestrator
│       └── modules/
│           ├── api.js                 # Network abstraction layer
│           ├── utils.js               # Formatters and debouncing utility
│           ├── chartManager.js        # Chart.js line graph lifecycle
│           ├── favoritesManager.js    # Favorites rendering and star button
│           ├── historyManager.js      # History list rendering
│           └── travelManager.js       # Travel budgeting comparison and exports
└── test/
    └── verify.js                      # Automated endpoint and zero-comment verification
```

---

## Tech Stack

* **Backend**: Node.js, Express.js, CORS
* **Database**: SQLite3 via `better-sqlite3` (WAL mode enabled)
* **Frontend**: Vanilla JavaScript (ES Modules), HTML5, CSS3 Custom Properties
* **Data Visualization**: Chart.js
* **External APIs**: Open Exchange Rates API (`open.er-api.com`) with automated fallback to Frankfurter API (`api.frankfurter.dev`)

---

## Getting Started

### Prerequisites
* Node.js v18+ (tested on Node.js v20)
* npm

### Installation
Clone the repository and install dependencies:
```bash
git clone <repository-url>
cd currcon
npm install
```

### Running the Application
Start the server:
```bash
npm start
```
Or run in development mode:
```bash
npm run dev
```

Open your browser and navigate to:
```
http://localhost:3000
```
*(or `http://127.0.0.1:3000`)*

---

## Testing & Verification

CurrCon includes an automated test suite verifying all 11 API endpoints, database operations, and zero-comment compliance across all 28 source files:

```bash
npm test
```

### Test Suite Output:
```text
Running test suite...
PASS: GET /api/currencies
PASS: GET /api/rates
PASS: POST /api/convert
PASS: GET /api/history/trends (with Timing Signal USP)
PASS: GET /api/travel-budget (with 14-day Daily Allowance USP)
PASS: GET /api/favorites
PASS: POST /api/favorites
PASS: DELETE /api/favorites/:id
PASS: GET /api/history (SQLite persistence)
PASS: DELETE /api/history
PASS: All 28 files verified with zero comments

All test assertions passed successfully!
```

---

## REST API Reference

| Method | Endpoint | Query / Body Params | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/currencies` | None | Returns list of supported currency codes, names, symbols, and flags |
| `GET` | `/api/rates` | `?base=USD` | Returns live exchange rates for a given base currency |
| `POST` | `/api/convert` | `{ "source": "USD", "target": "EUR", "amount": 100 }` | Converts amount and records entry in SQLite history |
| `GET` | `/api/history/trends` | `?source=USD&target=EUR` | Returns 30-day time-series data, stats, and RateRadar™ signal |
| `GET` | `/api/travel-budget` | `?base=USD&amount=2500&days=14` | Returns 5-currency comparison with daily allowance and breakdowns |
| `GET` | `/api/favorites` | None | Returns all saved favorite currency pairs with live rates |
| `POST` | `/api/favorites` | `{ "source": "GBP", "target": "JPY" }` | Saves a new favorite pair to SQLite |
| `DELETE`| `/api/favorites/:id`| URL parameter `id` | Removes a favorite pair by ID |
| `GET` | `/api/history` | `?limit=10` | Returns recent conversions from SQLite |
| `DELETE`| `/api/history` | None | Clears conversion history |

---

## License

ISC License
