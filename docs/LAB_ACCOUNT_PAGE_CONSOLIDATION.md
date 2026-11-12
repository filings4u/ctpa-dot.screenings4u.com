# Lab Account source pages → existing Workforce C/TPA portal
Source repository: `filings4u/lab-account.screenings4u.com`
Destination: `filings4u/ctpa.screenings4u.com` (branch `migration-workforce-consolidation-20261111`)
Goal: one customer portal and shared backend; do not delete legacy repo before all customer data and workflows are retained.

## Built in the C/TPA Lab Account section
- `dashboard.html` → `lab-services.html?lab=overview` — Lab Account summary, purchased setup and shipment history
- `lab-accounts.html` → `lab-services.html?lab=accounts` and existing `lab-accounts.html` — lab account numbers
- `create-testing-order.html` → `lab-services.html?lab=orders` — order form and C/TPA company-scoped request creation
- `testing-order.html`, `testing-order-view.html`, `order-history.html` → `lab-services.html?lab=tracking` — linked lab request status and owner-scoped detail
- `donor-pass-view.html` → `lab-services.html?lab=tracking` — purchaser-owned issued passes with view/print
- `supplies.html`, `supply-request.html` → `lab-services.html?lab=supplies` — physical supply catalog/request and shipment tracking
- `documents.html`, `ccf-archive.html` → `lab-services.html?lab=documents` — secure published account documents, released owner-scoped CCFs, original intake forms with PDF export, completed service documents, customer-owned files and intake attachments
- `client-directory.html` → `lab-services.html?lab=clients` — legacy contacts preserved read-only; employer management reused separately
- `supply-alerts.html` → `lab-services.html?lab=alerts` — legacy alerts preserved read-only
- `result-delivery.html` → `lab-services.html?lab=deliveries` — historical requests and new released-case delivery requests pending staff review
- `billing.html`, `invoice-view.html`, `order-view.html` → `lab-services.html?lab=billing` — verified Lab Account purchase, associated issued invoices and line details, plus link to existing C/TPA billing; invoice payments still need a safe handoff
- `support.html`, `support-ticket.html` → `lab-services.html?lab=support` and `support.html` — existing Workforce C/TPA support module

## Reuse existing C/TPA functionality; do not clone
- `analytics.html` → `reports.html`
- `compliance-center.html` → `compliance.html`
- `consortium.html`, `consortium-form.html`, `consortium-detail.html` → `pools.html`, `programs.html` (legacy consortium account/roster data still require reconciliation)
- `schedule-demo.html`, `attend-demo.html` → existing C/TPA demo pages
- `benefits.html` → `subscription.html`, `workforce-context.html` (plan entitlements need final mapping)
- `store.html` → `order-services.html`, `price-list.html` (catalog/purchase mapping remains)
- `global-checkout.html` → existing Workforce checkout
- `index.html`, `login.html`, `portal-login.html`, `selector.html`, `auth-handoff.html`, `forgot-password.html`, `reset-password.html` → existing WorkforceApps login and handoff; no separate Lab Account authentication

## Remaining Lab-specific gaps before repository retirement
- `testing-order-edit.html` → now staged in `lab-services.html?lab=tracking`; authenticated end-to-end behavior remains to be verified
- `specimen-shipment.html` → now staged in `lab-services.html?lab=tracking`; collected case and existing shipment RPC used, with management receipt still separate
- `result-detail.html`, `result-view.html`, `results-detail.html`, `results.html`: verify laboratory result release scopes and only show released cases; existing C/TPA Results may cover many fields already
- `pay-invoice.html`: finish the secure Lab Account invoice payment handoff through the existing Workforce billing/Stripe process; no new payment URLs should be created in the C/TPA UI
- `lab-account-intake.html`, `onboarding.html`: purchased intake status and user-owned original forms are available in C/TPA; remaining account-creation/onboarding edit operations require consolidation
- Published Lab Account documents, original intake uploads, completed service documents and legacy account files now have purchaser-scoped listing and secure file URLs. Original intake form details also support PDF export
- `supply-alerts.html`, `result-delivery.html`, `client-directory.html`: old records are visible, but old advanced-feature edits and actions need policy decisions and integration with existing C/TPA tools
- Existing `lab-account-entitlement`, `lab-advanced-features`, `lab-plan-services`, `lab-portal-store`, `lab-customer-benefits`, `lab-customer-consortiums`, billing and support backend actions must be compared with their C/TPA equivalents and transferred only where unique

The migration branch now also implements awaiting-schedule edits, released CCF archive and secure URLs, and review-queued result-delivery requests. The current build additionally includes Lab Account billing records, historical intake files and PDF exports. These are code changes, not deployed features. No production cutover or repository deletion is authorized by this file.
