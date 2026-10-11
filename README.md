# RupeeWise — 30-Day Financial Decision Simulator

> A deterministic, interactive personal finance decision simulator built for managing a ₹10,000 monthly budget over a dynamic 30-day challenge.

---

## 📌 Project Purpose & Problem Statement

Most personal finance apps suffer from **passive tracking failure**: they record transactions retrospectively, notifying users of an overdraft only after money has already been spent. For young adults and students operating under strict budget constraints (such as ₹10,000/month), a single impulse purchase or unexpected expense can derail savings and leave essential bills unpaid.

**RupeeWise** transforms personal finance into an active **Decision Simulator**. Before spending, users test purchases inside the **Decision Lab** to forecast exact consequences on:
- Nominal liquid cash (**Available Balance**).
- Real discretionary runway (**Spendable Balance** after upcoming essential commitments and savings goals).
- Daily spending discipline (**Safe Daily Allowance**).
- Predictive cash position (**Projected Month-End Forecast**).
- Risk tier (`Low`, `Moderate`, `High`) and multi-factor **Financial Health Score** (0–100).

---

## 🌟 Key User-Facing Features

1. **Cinematic Ambient Hero**: Full-screen introductory hero (approx 100svh) with 3 selectable atmospheres (`01 / FLOW`, `02 / FOCUS`, `03 / CLARITY`), real-time challenge status pill, dynamic time-of-day greeting, and reduced-motion fallback.
2. **Interactive Financial Calendar**: Date-aware calendar view showing monthly grid, challenge boundaries, and daily expense totals. Users can inspect any day or log expenses prefilled to that date (with future-date restriction).
3. **Decision Lab Simulator**: Real-time slider and preset expense tester. Compares Before vs. After metrics side-by-side with delta indicators, shock warnings, and consequence summaries.
4. **Committed Obligations & Bill Tracking**: Track essential vs. discretionary bills (rent, WiFi, recharge). Marking bills paid logs the transaction exactly once; cancelling subscriptions frees spendable buffer without fabricating cash refunds.
5. **Earmarked Savings Goals**: Emergency fund and goal allocations that shield money from discretionary spending without skewing variable living costs.
6. **Local Profile Management**: Onboard with name, email, and avatar theme. Profile data operates decoupled from the budget state and supports fresh challenge resets.

---

## 🏗️ Architecture & Directory Overview

RupeeWise follows a modular, clean frontend architecture separating presentation components from custom domain state hooks and pure mathematical utilities:

```text
monthly_budget_tracker/
├── index.html                  # HTML entry with font preconnects & metadata
├── src/
│   ├── main.tsx                # React 19 application root mounting
│   ├── App.tsx                 # Viewport orchestration, layout, modal disclosure
│   ├── index.css               # Tailwind v4 theme tokens & baseline styles
│   ├── types/
│   │   └── finance.ts          # Domain interfaces (FinancialState, Transaction, Metrics, etc.)
│   ├── hooks/
│   │   ├── index.ts            # Hook barrel exports
│   │   ├── useFinancialState.ts# Domain state hook: financial calculations, persistence, mutations
│   │   └── useUserProfile.ts   # User profile hook: identity, avatars, onboarding lifecycle
│   ├── components/
│   │   ├── HeroSection.tsx     # Full-screen introductory atmosphere & challenge status
│   │   ├── Sidebar.tsx         # Responsive navigation bar with active indicators
│   │   ├── BalanceCard.tsx     # Available balance & visual progress card
│   │   ├── MetricCard.tsx      # Reusable financial metric presentation cards
│   │   ├── SpendingChart.tsx   # Category breakdown pie chart
│   │   ├── CommitmentList.tsx  # Unpaid and paid bill obligations
│   │   ├── SavingsGoalCard.tsx # Savings goal progress and contribution controls
│   │   ├── DecisionSimulator.tsx # Before vs. After purchase projection engine
│   │   ├── OnboardingModal.tsx # First-time user greeting modal with input validation
│   │   ├── ProfileModal.tsx    # User settings and challenge reset dialog
│   │   └── WorkspaceSkeleton.tsx # Layout-stable Suspense placeholder for lazy pages
│   ├── pages/                  # Lazy-loaded workspace views (React.lazy / Suspense)
│   │   ├── Overview.tsx        # Central financial dashboard & health scores
│   │   ├── CalendarPage.tsx    # Interactive 30-day calendar & day-level logger
│   │   ├── Transactions.tsx    # Transaction ledger, category filters & manual entry
│   │   ├── DecisionLab.tsx     # Decision simulation workspace
│   │   ├── SavingsGoals.tsx    # Savings target cards & goal creator
│   │   └── Commitments.tsx     # Bills and recurring commitments manager
│   ├── utils/
│   │   ├── index.ts            # Utility barrel exports
│   │   ├── finance.ts          # Pure deterministic financial formulas and scoring
│   │   ├── dateUtils.ts        # Timezone-safe local calendar arithmetic
│   │   ├── storage.ts          # Defensive localStorage schema parser and fallback
│   │   └── sanitize.ts         # XSS mitigation, amount bounds, string sanitization
│   └── data/
│       └── demoData.ts         # Initial ₹10,000 30-day budget seed state
├── test_scenarios.ts           # Automated test suite (Scenarios A through K)
├── tsconfig.app.json           # Strict TypeScript configuration
└── vite.config.ts              # Vite configuration with vendor chunk splitting
```

---

## 🔄 Data Flow Architecture

The application ensures unidirectional data flow where React components display computed derived values rather than executing ad-hoc financial formulas:

```mermaid
flowchart TD
    subgraph Storage [Browser Storage]
        LS_STATE[("rupeeWise_state_v1")]
        LS_PROF[("rupeeWise_profile_v1")]
    end

    subgraph Utilities [Pure Deterministic Utilities]
        SAN[sanitize.ts<br/>Input Validation & Tag Stripping]
        DATE[dateUtils.ts<br/>Local Calendar Arithmetic]
        FIN[finance.ts<br/>computeMetrics / simulatePurchase]
    end

    subgraph CustomHooks [Domain State Hooks]
        UFS["useFinancialState()<br/>Manages state, transactions, bills, goals"]
        UUP["useUserProfile()<br/>Manages profile identity & avatars"]
    end

    subgraph UI [React Presentation Layer]
        APP["App.tsx<br/>Viewport Orchestration"]
        HERO["HeroSection.tsx"]
        SKELETON["WorkspaceSkeleton.tsx"]
        PAGES["Lazy Pages<br/>Overview / Calendar / DecisionLab / etc."]
        MODALS["Accessible Modals<br/>Onboarding / Profile / Add Expense"]
    end

    LS_STATE -->|Defensive Parse| UFS
    LS_PROF -->|Defensive Parse| UUP
    SAN --> UFS
    DATE --> UFS
    FIN --> UFS

    UFS -->|State, Metrics, Actions| APP
    UUP -->|Profile, Handlers| APP

    APP --> HERO
    APP --> PAGES
    APP --> MODALS
    APP -.->|Suspense Fallback| SKELETON

    PAGES -->|User Actions| UFS
    MODALS -->|User Profile| UUP
    UFS -->|Auto Sync| LS_STATE
    UUP -->|Auto Sync| LS_PROF
```

---

## 🧮 Core Financial Formulas & Double-Counting Prevention

All financial metrics are computed deterministically in `src/utils/finance.ts`:

1. **Available Balance**:
   $$\text{Available Balance} = \text{Starting Budget} + \sum \text{Income} - \sum \text{Expenses}$$
   Nominal liquid cash currently held.
2. **Spendable Balance**:
   $$\text{Spendable Balance} = \text{Available Balance} - \text{Unpaid Commitments} - \text{Remaining Savings Target}$$
   Represents true discretionary runway. Earmarks upcoming mandatory bills and unmet savings goals so users do not spend money already allocated for commitments.
3. **Safe Daily Allowance**:
   $$\text{Safe Daily Allowance} = \max\left(0, \left\lfloor \frac{\text{Spendable Balance}}{\text{Days Remaining}} \right\rfloor\right)$$
   Smooths discretionary runway evenly across the remaining calendar days.
4. **Projected Month-End Balance**:
   $$\text{Burn Rate} = \frac{\text{Variable Expenses}}{\max(1, \text{Elapsed Days})}$$
   $$\text{Projected Month-End} = \text{Available} - \text{Unpaid Commitments} - (\text{Burn Rate} \times \text{Days Remaining})$$
5. **Double-Counting Prevention**:
   - **Commitments vs. Expenses**: Unpaid commitments reduce *Spendable Balance*, but do **not** reduce *Available Balance*. When a user clicks "Mark Paid", the commitment is marked `paid` and an expense transaction is logged. The obligation moves from "unpaid commitment" to "recorded expense" without double-reducing spendable cash.
   - **Savings Allocation**: Adding money to savings increases `savedAmount` and logs a dedicated `savings` transaction, reducing spendable buffer while keeping target feasibility intact.
   - **Subscription Cancellation**: Cancelling an unpaid subscription marks it `cancelled`, which frees the spendable buffer without fabricating a cash refund into Available Balance.

---

## 📅 Challenge Date Calculation Rules

To prevent timezone inconsistencies (e.g., UTC midnight causing day-shifts in IST), `src/utils/dateUtils.ts` operates strictly on local `YYYY-MM-DD` strings:
- **Challenge Period**: Fixed 30-day duration starting on the user's local date (`periodStart`).
- **Day Number**:
  $$\text{Current Day} = \min(30, \max(1, \text{difference in calendar days} + 1))$$
- **Days Remaining**:
  $$\text{Days Remaining} = \max(0, 30 - \text{Current Day} + 1)$$
- **Status Lifecycle**:
  - `active`: Current date is between `periodStart` and `endDate`.
  - `completed`: Current date is past `endDate` (Day 30, 0 days remaining).
  - `upcoming`: Current date is before `periodStart`.
- **Expense Validation**: Calendar expenses cannot be logged for future calendar dates.

---

## 🔒 Security, Input Validation & Local Storage Resilience

### Sanitization Pipeline (`src/utils/sanitize.ts`)
- **Text Inputs**: Strips HTML tags (`<[^>]*>`), removes non-printable ASCII control characters, collapses excessive whitespace, and caps length at 120 characters.
- **Email Validation**: Strict regex verification (`^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$`), lowercase normalization.
- **Financial Amounts**: Clamped to finite positive integer bounds ($\text{min: } 1, \text{max: } 1,000,000$). Non-numeric strings and `NaN` revert to configured fallbacks.
- **Date Verification**: Strict `YYYY-MM-DD` format verification and Gregorian calendar date validation (rejects invalid dates like Feb 31).

### Storage Resilience (`src/utils/storage.ts`)
`localStorage` parsing operates under defensive schemas. If storage contains corrupt JSON, negative budgets, invalid dates, or malicious payloads, the loader falls back to valid state structures (`createNewUserFinancialState()` or `DEMO_STATE`) without crashing.

### Privacy & Authentication Limitations
> **Security Notice**: Profile and financial records are stored purely on the client inside the user's browser `localStorage`.
> - **No Server-Side Authentication**: Entering a name and email creates a local session persona; it does **not** authenticate against an identity provider or database.
> - **No Plaintext Passwords**: RupeeWise does not prompt for or store passwords.
> - **Data Isolation**: Clearing browser data or opening incognito mode creates a fresh local sandbox.

---

## ♿ Accessibility & Keyboard Support

- **ARIA Dialog Semantics**: All modals (`OnboardingModal`, `ProfileModal`, Add Expense, Reset Confirmation) implement `role="dialog"`, `aria-modal="true"`, and semantic `aria-labelledby` headers.
- **Keyboard Dismissal**: Pressing the `Escape` (ESC) key cleanly closes any active modal.
- **Form Associations**: All inputs are programmatically bound to their labels using explicit `id` and `htmlFor` pairings.
- **Accessible Names**: All icon-only buttons (notifications, reset, calendar chevrons, close triggers) carry explicit `aria-label` attributes.
- **Focus Indicators**: Interactive elements feature high-contrast visible focus rings (`focus-visible:ring-2 focus-visible:ring-[#5138EC]`).
- **Reduced Motion**: Respects `prefers-reduced-motion: reduce` by replacing background video loops with lightweight static CSS gradients.

---

## ⚡ Runtime Performance & Bundle Optimization

- **Bundle Size Optimization**:
  - Initial entry JavaScript: **270.45 kB** (down from initial 861.46 kB monolithic chunk).
  - Initial transfer gzip: **81.28 kB**.
  - **Zero Vite chunk warnings**.
- **Route-Level Code Splitting**: All primary workspace pages are loaded on demand via `React.lazy` and `Suspense`.
- **Vendor Chunk Isolation**: Heavy dependencies (`recharts`, `framer-motion`, `lucide-react`) are isolated into distinct chunks, preventing charting code from blocking initial render.
- **Zero-Layout-Shift Skeleton**: `WorkspaceSkeleton` provides dimensional lavender shimmers during page load to prevent Cumulative Layout Shift (CLS).
- **Non-Blocking Font Delivery**: Google Fonts are loaded via `<link rel="preconnect">` and `<link rel="stylesheet">` with `display=swap` in `index.html`, eliminating render-blocking CSS `@import` chains.

---

## 🛠️ Technology Stack

- **Framework**: React 19 (`react`, `react-dom`)
- **Language**: TypeScript 5.8 (Strict mode enabled)
- **Bundler**: Vite 8 with `@vitejs/plugin-react`
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`)
- **Animation**: Framer Motion 14
- **Charts**: Recharts 3
- **Icons**: Lucide React
- **Linter**: Oxlint (fast Rust-based static analyzer)

---

## 💻 Commands & Development Guide

### Prerequisites
- Node.js 18+ (tested on Node 20+)
- npm or pnpm

### Installation
```bash
npm install
```

### Start Development Server
```bash
npm run dev
```

### Run Automated Scenario Tests
```bash
npm test
```
Runs 11 automated test suites in `test_scenarios.ts` covering onboarding, calendar arithmetic, metrics propagation, security sanitization, storage recovery, and financial boundary logic.

### Lint Codebase
```bash
npm run lint
```
Runs `oxlint` across all TypeScript and TSX files with 0 warnings and 0 errors.

### Build for Production
```bash
npm run build
```
Executes TypeScript type checking (`tsc -b`) followed by production minification and chunk generation via Vite (`vite build`). Emits output to `dist/`.

---

## 🚀 Deployment Instructions

RupeeWise is a pure, static Single Page Application (SPA). It requires zero backend infrastructure and can be deployed directly to any static host:

### Vercel / Netlify
1. Connect the GitHub repository `BLU-874/Rupee-Wise`.
2. Build command: `npm run build`
3. Output directory: `dist`

### GitHub Pages / Cloudflare Pages
- Ensure all static assets in `dist/` are served with root routing fallback (`index.html`).

---

## ⚠️ Current Limitations & Testing Notes

1. **Frontend-Only Persistence**: Data is scoped to the user's specific browser and device via `localStorage`. Syncing data across devices would require an external cloud database.
2. **Deterministic Simulation vs. Live Banking**: RupeeWise is an educational decision simulator for ₹10,000 monthly budgets; it does not connect to live banking aggregator APIs (such as Plaid or Account Aggregator).
3. **Calendar Bounds**: Financial tracking is scoped to a 30-day challenge window. Past challenge periods can be archived and restarted via the "Start New 30-Day Challenge" action in settings.
