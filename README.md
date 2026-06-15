Ledger
A personal finance management web application for tracking transactions, managing bank accounts, setting budgets, and gaining spending insights.Live Demo: https://ledger-v0.vercel.app
Features
User Authentication — Register and login with email/password
Dashboard — Overview of income, expenses, and balance with visual charts
Transactions — Add, edit, and delete income/expense transactions with categories
Bank Accounts — Link bank accounts (Checking, Savings, Credit Card, Investment) with simulated sync
Spend Scope (Budgets) — Set monthly budgets per category and track spending against them
Insights — Visual analytics with charts powered by Recharts
Newsletter — Email-based monthly financial snapshot with scheduling
Demo Data — New users are automatically seeded with sample transactions
Tech Stack
Layer	Technology
Frontend	React 18, React Router v6, Vite
UI	Lucide React (icons), Recharts (charts), custom CSS
Backend	Express.js (Node.js)
Database	Supabase (PostgreSQL)
HTTP Client	Axios
Hosting	Vercel (serverless API + static frontend)
Project Structure
ledger-deploy/
├── api/
│   └── index.js              # Vercel serverless entry point
├── client/
│   ├── src/
│   │   ├── components/       # Sidebar, Topbar, LedgerLogo
│   │   ├── context/          # AuthContext (auth state management)
│   │   ├── pages/            # Splash, Login, Register, Dashboard,
│   │   │                     # Transactions, SpendScope, BankAccounts, Insights
│   │   ├── App.jsx           # Route definitions
│   │   ├── main.jsx          # Entry point
│   │   └── index.css         # Global styles
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── server/
│   ├── server.js             # Express API server
│   ├── db.json               # Seed/demo transaction data
│   └── package.json
├── supabase-schema.sql       # Database schema for Supabase
├── vercel.json               # Vercel deployment config
├── .env.example              # Environment variable template
└── package.json              # Root dependencies
Getting Started
Prerequisites
Node.js 18+
A Supabase project (free tier works)
1. Clone the Repository
git clone https://github.com/adityabhambhani2502/ledger-v0.git
cd ledger-v0
2. Set Up Supabase
Create a new project at supabase.com
Go to SQL Editor and run the contents of supabase-schema.sql
Go to Project Settings → API and copy:
Project URL
service_role key (secret)
3. Configure Environment Variables
Create a .env file in the root directory:
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
4. Install Dependencies
# Root (for Vercel serverless)
npm install

# Server
cd server
npm install

# Client
cd ../client
npm install
5. Run Locally
Start the API server (port 4000):
cd server
npm run dev
Start the frontend (port 3000):
cd client
npm run dev
Visit http://localhost:3000
API Endpoints
Auth
Method	Endpoint	Description
POST	/api/auth/register	Register a new user
POST	/api/auth/login	Login with email & password
Transactions
Method	Endpoint	Description
GET	/api/transactions	Get all transactions for user
POST	/api/transactions	Create a transaction
PUT	/api/transactions/:id	Update a transaction
DELETE	/api/transactions/:id	Delete a transaction
Bank Accounts
Method	Endpoint	Description
GET	/api/bank-accounts	Get all linked accounts
POST	/api/bank-accounts	Link a new bank account
PATCH	/api/bank-accounts/:id	Update account balance
POST	/api/bank-accounts/:id/sync	Sync a single account
POST	/api/bank-accounts/sync-all	Sync all accounts
DELETE	/api/bank-accounts/:id	Unlink an account
Budgets
Method	Endpoint	Description
GET	/api/budgets	Get budgets (optionally by month)
POST	/api/budgets	Create/update a budget
PUT	/api/budgets/:id	Update budget amount
DELETE	/api/budgets/:id	Delete a budget
Newsletter
Method	Endpoint	Description
POST	/api/newsletter/send	Send monthly snapshot
POST	/api/newsletter/schedule	Enable/disable monthly schedule
GET	/api/newsletter/history	Get newsletter history
All endpoints except /api/auth/* require a Bearer <userId> token in the Authorization header.
Deployment
This project is configured for Vercel deployment:
Frontend builds via Vite and serves as static files
API routes are served serverlessly via api/index.js
URL rewrites handle SPA routing and API proxying
To deploy your own instance:
Fork this repo
Connect it to Vercel
Add environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) in Vercel project settings
Deploy
