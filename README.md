# RupeeWise — 30-Day Financial Decision Simulator

> A deterministic, interactive personal finance decision simulator built for Gen Z managing a ₹10,000 monthly budget over 30 days.

---

## 🎯 Overview

**RupeeWise** transforms personal finance from passive expense tracking into a proactive **Decision Simulator**. Instead of discovering a budget deficit on day 28, users test real-world purchases and emergency expenses before spending, instantly seeing the before-and-after impact on:

1. **Available Balance** (Nominal liquid cash)
2. **Spendable Balance** (True discretionary runway after unpaid bills & protected savings)
3. **Safe Daily Allowance** (Daily limit for remaining days)
4. **Projected Month-End Balance** (Predictive cash flow forecast)
5. **Savings Feasibility** (Target reachability)
6. **Financial Risk Level** (`Low`, `Moderate`, `High`)
7. **Financial Health Score** (0–100 multi-factor metric)

---

## 🎬 Cinematic Hero & Visual Design System

RupeeWise greets users with a full-screen introductory hero (approx 100svh) featuring:
- **Ambient Abstract Video Background**: 3 selectable modes (`01 / FLOW`, `02 / FOCUS`, `03 / CLARITY`) with smooth crossfades and static CSS gradient fallbacks.
- **Dynamic Localized Greeting**: Adapts to user's time of day (*"GOOD AFTERNOON, ARJUN"*).
- **Synchronized 30-Day Budget Challenge Panel**: Real-time spending progress vs. challenge day timeline powered by shared state.
- **One-Click Workspace Transitions**: "Enter my workspace" and "Explore Decision Lab" smooth-scroll into the primary financial dashboard.

### Color Tokens
- **Hero Background**: Deep Indigo (`#201E37`) & Secondary (`#292641`)
- **Brand Accents**: Vibrant Violet (`#5138EC`), Soft Lavender (`#B6A8FF`)
- **Workspace Background**: Light Lavender-Gray (`#F7F6FC`)
- **Workspace Cards**: Pure White (`#FFFFFF`) with subtle border (`#E8E5F0`)
- **Financial Status Indicators**:
  - Positive: `#319A77` (Muted emerald)
  - Warning: `#C98B27` (Amber)
  - Negative / High Risk: `#D65D69` (Coral rose)
- **Typography**: Inter with strict `tabular-nums` for financial values.

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or pnpm

### Installation
```bash
git clone <repository-url>
cd monthly_budget_tracker
npm install
```

### Local Development
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) (or the port displayed in your terminal).

### Automated Scenario Test Suite
Verify all 8 core financial scenarios and model integrity:
```bash
npm test
```

### Linting
```bash
npm run lint
```

### Production Build
```bash
npm run build
```
Generates optimized static assets in the `dist/` directory ready for any CDN or static host.

---

## 🧮 Financial Model Integrity

RupeeWise uses a single, mathematically reconciled model across all views (`src/utils/finance.ts`):

- **Available Balance**: $\text{Starting Budget} + \text{Received Income} - \text{Paid Expenses}$
- **Spendable Balance**: $\text{Available Balance} - \text{Unpaid Commitments} - \text{Remaining Savings Requirements}$
- **Safe Daily Allowance**: $\lfloor\text{Spendable Balance} / \text{Days Remaining}\rfloor$
- **Projected Month-End Balance**: $\text{Available} - \text{Unpaid Commitments} - (\text{Variable Daily Burn Rate} \times \text{Days Remaining})$
- **Commitments Integrity**: Paying a bill converts an unpaid obligation into a recorded expense exactly once, preventing double deductions or distortion of the variable burn rate in forecasts.
- **Savings Allocation**: Earmarked savings shield cash from discretionary spend without polluting living expense categories.

---

## 📅 Financial Calendar & Date-Aware 30-Day Challenge

RupeeWise provides an interactive **Financial Calendar** directly integrated into the shared state:
- **Strict Local Calendar Date Math**: Eliminates UTC timezone shift errors (`src/utils/dateUtils.ts`).
- **Dynamic 30-Day Timeline**: Start date is anchored to the user's actual local start date (`YYYY-MM-DD`). Day 1 begins with 30 days remaining; Day 30 has 1 day remaining; past Day 30 marks the challenge completed.
- **Calendar Month View**: Monday-to-Sunday columns, active challenge period highlights, expense badges, and today markers.
- **Date Inspection Drawer & Expense Logging**: Click any date to inspect transactions or record new expenses prefilled to that date (with validation against future dates).
- **Personalized Onboarding & Profiles**: Local profile storage (`rupeeWise_profile_v1`) decoupled from financial state (`rupeeWise_state_v1`). Supports new user onboarding, avatar customization, and starting new challenges.
- **Demo State Switcher**: One-click toggle between a clean personal challenge and the fully populated demo state (Arjun Sharma, ₹7,162 balance, 11 transactions).

---

## 🧪 90-Second Judging Demonstration Walkthrough

1. **Cinematic Hero & Personalized Greeting (0:00 – 0:15)**
   - Open RupeeWise. Notice the full-screen cinematic hero with ambient video/gradient background.
   - Point out the dynamic greeting (e.g. *"GOOD AFTERNOON, ARJUN"* or *"GOOD AFTERNOON, ADITI"*).
   - Show the **30-Day Simulation Challenge Status panel** with real-time spending vs. challenge days elapsed.
   - Click **"Enter my workspace"** to smoothly scroll down into `#workspace`.

2. **Financial Calendar (0:15 – 0:35)**
   - Navigate to **Calendar** from the sidebar or hero navigation.
   - Point out the highlighted **30-day active challenge horizon**, today's marker, and recorded expense dots.
   - Click on a date (e.g., today or a past date) to open the **Day Breakdown** panel.
   - Click **Add Expense**, enter a ₹250 coffee run, and submit:
     - Notice the expense immediately appears on the calendar cell.
     - Observe the available balance and total spent update across all dashboard views.

3. **Decision Lab Simulation (0:35 – 0:55)**
   - Navigate to **Decision Lab**.
   - Propose buying a **Sneakers / Shopping** purchase of **₹1,200**.
   - Show the live before-and-after comparison matrix:
     - Safe Daily drops from **₹101/day** to **₹38/day** ($\Delta -₹63/\text{day}$).
     - Spendable runway shrinks to **₹734**.
     - Dynamic warning clarifies consequence and remaining discretionary runway.
   - Toggle to **⚡ Unexpected Emergency Expense** (e.g. Laptop Repair ₹2,400) to demonstrate honest high-risk escalation.
   - Cancel preview: show that real transactions remain untouched.

4. **Commitments & Savings Integrity (0:55 – 1:15)**
   - Head to **Commitments** and mark **Hostel Rent (₹2,800)** as paid.
   - Cash decreases once; unpaid commitments drop; month-end forecast remains steady without double-counting.
   - Check **Savings Goals**: Earmarked savings shield cash without polluting expense categories.

5. **Profile, New Challenge & Persistence (1:15 – 1:30)**
   - Click the profile avatar in the header to open **Profile & Challenge Settings**.
   - Show avatar theme customization and the option to **"Start a New 30-Day Challenge"** (resets to Day 1 with fresh ₹10,000 budget on today's date).
   - Refresh the page (`F5`) to verify full persistence via `localStorage`.

---

## 🌐 Deployment Guide

RupeeWise is a pure client-side SPA with zero external API dependencies or secrets.

### Deploying to Netlify
1. Connect repository or run:
   ```bash
   npx netlify-cli deploy --prod --dir=dist
   ```
2. Build command: `npm run build`
3. Publish directory: `dist`

### Deploying to Vercel
1. Run `vercel` or link repository on Vercel Dashboard.
2. Framework Preset: **Vite**
3. Output Directory: `dist`

---

## 📋 Technology Stack

- **Framework**: React 19 + TypeScript + Vite 8
- **Styling**: Tailwind CSS v4 + Custom Design Tokens
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Data Visualization**: Recharts (Responsive cash flow & category breakdown)
- **State & Storage**: React Hooks + LocalStorage
- **Testing**: Automated Scenario Suite via `tsx`
