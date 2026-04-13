# Subscription System — Rollout Checklist

Status: backend + backoffice are wired up. The remaining work is split into
**iOS app**, **Apple Developer setup**, **server hardening**, and **business**.

---

## ✅ Already Done (in this session)

- [x] DB schema: `subscription_plans`, `user_subscriptions`, plus `users.generationsThisPeriod` / `users.periodResetAt`
- [x] Migration applied (`drizzle/0005_redundant_colleen_wing.sql`)
- [x] 4 default plans seeded (Starter, Pro, Premium, Annual)
- [x] API: `GET /api/subscription-plans` (public), `/all` (admin), `POST/PATCH/DELETE /api/subscription-plans`
- [x] API: `GET /api/subscriptions/me`, `POST /api/subscriptions/subscribe`, `POST /api/subscriptions/cancel`
- [x] Generation route now enforces `maxGenerationsPerPeriod` (returns HTTP 429 with structured payload)
- [x] Period counter auto-resets when `periodResetAt` passes
- [x] Free tier defaults to 30 generations/month
- [x] Backoffice: full CRUD page at `/subscription-plans` with revenue summary
- [x] New `transactions.subscriptionPlanId` column + `"subscription"` transaction type
- [x] `npm run db:seed:plans` script for production-safe upsert

---

## 🟦 iOS App

### 1. StoreKit 2 Integration (the big one)
- [ ] Add an `IAPManager.swift` using Apple's `StoreKit` framework
  - Load products via `Product.products(for: [...])`
  - Buy product → handle `Transaction.updates` async stream
  - Verify receipt and call backend `POST /api/subscriptions/subscribe` with `appleOriginalTransactionId` and `appleLatestReceipt`
  - Restore purchases on demand and on app launch
- [ ] Update `ShopView.swift` to add a **"Subscriptions"** section ABOVE the one-time coin packs
  - Tabs / segments: "Subscriptions" / "One-Time Coins"
  - Card per plan from `GET /api/subscription-plans`
  - Highlight "Most Popular" badge
  - Show price, coins/period, max generations
- [ ] Add a **"Manage Subscription"** screen accessible from Settings
  - Show current plan, period dates, days remaining, generations used / max
  - Cancel button → `POST /api/subscriptions/cancel`
  - Restore purchases button
- [ ] Show **subscription status** in the home view header (e.g., "Pro · 47/150 used this month")
- [ ] Handle the new HTTP **429** response from the generation endpoint:
  - Show "Generation limit reached" sheet with a CTA to upgrade
  - Differentiate "free tier limit" vs "subscription limit"
- [ ] Sync `coinBalance` from backend after successful purchase (already does via `getMe`)
- [ ] Update `APIService.swift` with new endpoints:
  ```swift
  func getSubscriptionPlans() async throws -> [APISubscriptionPlan]
  func getMySubscription() async throws -> APIUserSubscription?
  func subscribe(planId: String, appleOriginalTransactionId: String, appleLatestReceipt: String) async throws
  func cancelSubscription() async throws
  ```

### 2. UX Polish
- [ ] Onboarding screen showing 3-tier comparison (Free / Pro / Premium) before first use
- [ ] In-app message when free user hits 25/30 generations: "5 left this month"
- [ ] Upsell modal when user tries to use a video generation while on free tier
- [ ] Subscription expiration / grace period banner

---

## 🟪 Apple Developer Setup

### 3. App Store Connect Configuration
- [ ] Sign in to https://appstoreconnect.apple.com → My Apps → SpazeAI
- [ ] Go to **Features → In-App Purchases → Subscriptions**
- [ ] Create a **Subscription Group** named "SpazeAI Pro"
- [ ] Create the 4 subscription products with these EXACT IDs (must match `appleProductId` in DB):
  - `com.spazeai.app.starter.weekly` — Starter Weekly — ₺49
  - `com.spazeai.app.pro.monthly` — Pro Monthly — ₺149
  - `com.spazeai.app.premium.monthly` — Premium Monthly — ₺299
  - `com.spazeai.app.annual` — Annual — ₺2499
- [ ] For each product:
  - [ ] Set the **Subscription Duration** correctly
  - [ ] Add **Localized Display Name** (Turkish + English)
  - [ ] Add **Localized Description** describing what's included
  - [ ] Upload a **Promotional Image** (1024×1024)
  - [ ] Set **Pricing** for all storefronts (use the Turkish price as base)
  - [ ] Submit each for review (you can submit them with the next app build)
- [ ] Generate a **Subscription App Specific Shared Secret** (Apps → SpazeAI → App Information → App-Specific Shared Secret) — you'll need this for receipt verification
- [ ] Set up **App Store Server Notifications V2** webhook → point to your API at `https://api.spazeai.com/api/webhooks/apple` (you'll need to build this endpoint, see Server Hardening below)
- [ ] Add **"Auto-Renewable Subscription"** capability to your App ID (already done via Apple Sign In capability work, just enable subscription)

### 4. Required Legal Pages (Apple WILL reject without these)
- [ ] **Privacy Policy** URL — required by Apple for any subscription app
- [ ] **Terms of Service / EULA** — must include subscription terms
  - Length of subscription period
  - Auto-renewal policy
  - How to cancel (link to Apple settings)
  - Refund policy
- [ ] Add both URLs to App Store Connect → App Information

---

## 🟧 Server Hardening (do BEFORE going live)

### 5. Receipt Verification
- [ ] **CRITICAL**: Currently `POST /api/subscriptions/subscribe` trusts the client. You MUST verify the Apple receipt server-side before granting the subscription.
- [ ] Implement `verifyAppleReceipt(receiptData: string)` in `api/src/lib/apple.ts`:
  - POST to `https://buy.itunes.apple.com/verifyReceipt` (production)
  - Fall back to `https://sandbox.itunes.apple.com/verifyReceipt` for sandbox
  - Validate: bundleId matches, productId matches the requested plan, expiration is in the future
  - See: https://developer.apple.com/documentation/appstorereceipts/verifyreceipt
- [ ] Wire it into `subscribe` route — reject if receipt is invalid

### 6. App Store Server Notifications (auto-renewals, refunds, cancellations)
- [ ] Build `POST /api/webhooks/apple` endpoint that handles:
  - `DID_RENEW` → extend the user's `currentPeriodEnd`, grant new coins, reset counter
  - `DID_CHANGE_RENEWAL_STATUS` → flip `autoRenew`
  - `EXPIRED` → set status to `expired`
  - `REFUND` → revoke the subscription, optionally claw back coins
  - `GRACE_PERIOD_EXPIRED`, `DID_FAIL_TO_RENEW`
  - See: https://developer.apple.com/documentation/appstoreservernotifications

### 7. Cron / Scheduled Job
- [ ] Add a daily cron that:
  - Marks subscriptions as `expired` when `currentPeriodEnd < now()` AND `autoRenew = false`
  - Resets `generationsThisPeriod` for users whose `periodResetAt` has passed (currently done lazily on each generation request — fine but a sweep is safer)

### 8. Analytics & Observability
- [ ] Add a `/api/dashboard/subscription-stats` endpoint exposing:
  - MRR (Monthly Recurring Revenue)
  - Total active subscribers per plan
  - Conversion rate (free → paid)
  - Churn rate
  - LTV per plan
- [ ] Add a chart on the backoffice dashboard showing MRR over time
- [ ] Log all subscription events to your DB (already happens via `transactions` table)

---

## 🟩 Business Tasks

### 9. Pricing Validation
- [ ] **Cross-check the unit economics**:
  - Average FAL.ai cost per generation: ~₺3-15 depending on model
  - Pro plan: 150 gens × ₺5 avg cost = ₺750 cost vs ₺149 revenue → **YOU LOSE MONEY** at average usage
  - Most subscribers won't use all 150 gens (industry avg ~30-50% utilization), so real cost per Pro sub ≈ ₺225-375 → still losing
  - **Recommendation**: drop Pro to 75 gens/month at ₺149, or raise price to ₺249
- [ ] Decide rollover policy:
  - Current default: **NO rollover** (use it or lose it)
  - Pro: Drives engagement, simpler accounting
  - Con: Users feel cheated if they miss a month
- [ ] Set up **trial period** (e.g., 3-day free trial for first-time Pro subscribers)
  - Apple supports this natively in App Store Connect
- [ ] Decide on Google Play parity (when launching Android)

### 10. Marketing & Conversion
- [ ] Write subscription copy in Turkish for the iOS shop screen
- [ ] Design comparison table graphic for the App Store screenshots
- [ ] Build an "Upgrade" deep link that opens the shop on the Subscriptions tab
- [ ] Decide on a launch promo (e.g., 50% off first month for first 1000 subscribers)

### 11. Customer Support
- [ ] Document the cancellation flow for support
- [ ] Add a FAQ page or in-app help: "How do I cancel?" "What happens to my coins?" "Can I switch plans?"
- [ ] Set up a support email rule for subscription disputes

---

## 📋 Quick Reference

**Run the seed scripts:**
```bash
cd api
npm run db:seed:plans         # Subscription plans (production-safe)
npm run db:seed:gen-types     # Generation types (production-safe)
npm run db:seed               # Full dev seed (admin + everything)
```

**Endpoints:**
```
GET    /api/subscription-plans              public — list active plans
GET    /api/subscription-plans/all          admin  — list all plans
POST   /api/subscription-plans              admin  — create plan
PATCH  /api/subscription-plans/:id          admin  — update plan
DELETE /api/subscription-plans/:id          admin  — delete plan
GET    /api/subscriptions/me                auth   — current user's sub
POST   /api/subscriptions/subscribe         auth   — start a subscription (Apple receipt)
POST   /api/subscriptions/cancel            auth   — cancel auto-renew
```

**Generation limit response (HTTP 429):**
```json
{
  "error": "Generation limit reached",
  "message": "...",
  "limitType": "free_tier" | "subscription",
  "used": 30,
  "max": 30
}
```

**Plans (current seed values):**
| ID | Name | Period | Price | Coins | Max Gens |
|---|---|---|---|---|---|
| `starter_weekly` | Starter | weekly | ₺49 | 30 | 30 |
| `pro_monthly` | Pro | monthly | ₺149 | 150 | 150 |
| `premium_monthly` | Premium | monthly | ₺299 | 400 | 400 |
| `annual` | Annual | yearly | ₺2,499 | 4,800 | 400/mo |

---

## ⚠️ Critical Path Before Going Live

1. **Implement Apple receipt verification** (Server Hardening #5) — the current code TRUSTS the client, which is exploitable
2. **Set up the Apple webhook** (Server Hardening #6) — without it, renewals/refunds won't update your DB
3. **Validate unit economics** (Business #9) — current Pro pricing may be unprofitable
4. **Add Privacy Policy + EULA** (Apple Setup #4) — Apple will reject the binary without these
