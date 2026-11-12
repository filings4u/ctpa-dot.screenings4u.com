# Lab Account source pages → existing Workforce C/TPA portal
Source repository: `filings4u/lab-account.screenings4u.com`
Destination: `filings4u/ctpa.screenings4u.com` (branch `migration-workforce-consolidation-20261111`)
Goal: one customer portal and shared backend; do not delete legacy repo before all customer data and workflows are retained.

## Built in the C/TPA Lab Account section
- `dashboard.html` → `lab-services.html?lab=overview` — Lab Account summary, purchased setup and shipment history
- `lab-accounts.html` → `lab-services.html?lab=accounts` and existing `lab-accounts.html` — lab account numbers
- `create-testing-order.html` → `lab-services.html?lab=orders` — order form and C/TPA company-scoped request creation
- `testing-order.html`, `testing-order-view.html`, `order-history.html` → `lab-services.html?lab=tracking` — linked lab request status
- `donor-pass-view.html` → `lab-services.html?lab=tracking` — purchaser-owned issued passes with view/print
- `supplies.html`, `supply-request.html` → `lab-services.html?lab=supplies` — physical supply catalog/request and shipment tracking
- `documents.html` → `lab-services.html?lab=documents` — secure published account documents; other document sources still need migration
- `client-directory.html` → `lab-services.html?lab=clients` — legacy contacts preserved read-only; employer management reused separately
- `supply-alerts.html` → `lab-services.html?lab=alerts` — legacy alerts preserved read-only
- `result-delivery.html` → `lab-services.html?lab=deliveries` — legacy delivery history read-only, sending not yet migrated
- `billing.html` → `lab-services.html?lab=billing` and existing `billing.html` — shared billing link; lab-specific invoices not fully mapped
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

## Lab-specific gaps to migrate before repository retirement
- `ccf-archive.html`: validate lab-only CCF ownership and document download permissions before incorporating into the existing `testing-documents.html` view
- `specimen-shipment.html`: move collected specimen shipping/reporting actions into C/TPA testing workflow
- `testing-order-edit.html`: move the existing awaiting-schedule edit action for linked lab requests
- `result-detail.html`, `result-view.html`, `results-detail.html`, `results.html`: verify laboratory result release scopes and only show released cases; existing C/TPA Results may cover many fields already
- `invoice-view.html`, `pay-invoice.html`, `order-view.html`: preserve lab-specific invoice details/payment and verified purchase details, avoid showing other-service orders
- `lab-account-intake.html`, `onboarding.html`: preserve purchased lab setup forms/status/document downloads before retiring the standalone intake route
- Published Lab Account documents are available in the new section; intake uploads, completed service documents and legacy account documents still need secure listing and download migration
- `supply-alerts.html`, `result-delivery.html`, `client-directory.html`: old records are visible, but old advanced-feature edits and actions need policy decisions and integration with existing C/TPA tools
- Existing `lab-account-entitlement`, `lab-advanced-features`, `lab-plan-services`, `lab-portal-store`, `lab-customer-benefits`, `lab-customer-consortiums`, billing and support backend actions must be compared with their C/TPA equivalents and transferred only where unique

No production cutover or repository deletion is authorized by this file.
