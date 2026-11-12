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
- `supplies.html`, `supply-request.html`, `tracking.html` → `lab-services.html?lab=supplies` — supply catalog/request, tracked orders, cancellation, shipment confirmation, and staff/customer notifications
- `documents.html`, `ccf-archive.html` → `lab-services.html?lab=documents` — secure published account documents, released owner-scoped CCFs, original intake forms with PDF export, completed service documents, customer-owned files and intake attachments
- `client-directory.html` → `lab-services.html?lab=clients` — purchaser-owned legacy contacts editable and archivable; existing C/TPA Employers remain the primary company-management module
- `supply-alerts.html` → `lab-services.html?lab=alerts` — existing alerts editable with reorder thresholds and branded notifications
- `result-delivery.html` → `lab-services.html?lab=deliveries` — historical requests and new released-case delivery requests pending staff review
- `billing.html`, `invoice-view.html`, `order-view.html` → `lab-services.html?lab=billing` — verified Lab Account purchase, associated issued invoices and line details, plus link to existing C/TPA billing; secure payments reuse existing invoice-checkout-actions and Stripe via C/TPA pay-invoice.html
- `support.html`, `support-ticket.html` → `lab-services.html?lab=support` and `support.html` — existing Workforce C/TPA support module

## Reuse existing C/TPA functionality; do not clone
- `analytics.html` → `lab-services.html?lab=analytics` for Lab Account metrics and existing `reports.html` for full C/TPA reporting
- `compliance-center.html` → `compliance.html`
- `consortium.html`, `consortium-form.html`, `consortium-detail.html` → `lab-services.html?lab=consortium` for original saved rosters and `pools.html`, `programs.html` for active C/TPA consortium operations
- `schedule-demo.html`, `attend-demo.html` → existing C/TPA demo pages
- `benefits.html` → `lab-services.html?lab=benefits` for original calendar, Clearinghouse and generated files; existing C/TPA compliance and subscription modules for new actions
- `store.html` → existing C/TPA `order-services.html`, `price-list.html`, and `subscription.html`; do not retain a separate Lab Account checkout catalog
- `global-checkout.html` → existing Workforce checkout
- `index.html`, `login.html`, `portal-login.html`, `selector.html`, `auth-handoff.html`, `forgot-password.html`, `reset-password.html` → existing WorkforceApps login and handoff; no separate Lab Account authentication

## Remaining Lab-specific gaps before repository retirement
- `testing-order-edit.html` → now staged in `lab-services.html?lab=tracking`; authenticated end-to-end behavior remains to be verified
- `specimen-shipment.html` → now staged in `lab-services.html?lab=tracking`; collected case and existing shipment RPC used, with management receipt still separate
- `result-detail.html`, `result-view.html`, `results-detail.html`, `results.html`: verify laboratory result release scopes and only show released cases; existing C/TPA Results may cover many fields already
- `pay-invoice.html` has been moved with its existing Stripe Payment Element to the C/TPA repo; staged invoice emails now link there. Original issued email links require a domain-level redirect before source-host retirement.
- `lab-account-intake.html`, `onboarding.html`: purchased intake status and user-owned original forms are available in C/TPA; remaining account-creation/onboarding edit operations require consolidation
- Published Lab Account documents, original intake uploads, completed service documents and legacy account files now have purchaser-scoped listing and secure file URLs. Original intake form details also support PDF export
- `supply-alerts.html`, `result-delivery.html`, `client-directory.html`: previous records and required actions now exist in the C/TPA Lab Account section; the C/TPA Employers and Results workflows remain authoritative for wider company operations
- Legacy consortium creation, roster edits, new paid plan-service requests, and new advanced benefit-document generation should use existing C/TPA Programs, Pools, Selections, Compliance and Add Features modules rather than duplicating customer workflows. Original user-owned rosters, submissions, schedules, and generated files remain accessible under Lab Account.
- Company grant activation and legacy unlinked testing/supply records still require a controlled data reconciliation and cutover. The original Lab Account source repository must not be deleted before the redirect and customer migration are verified.

The migration branch now also implements awaiting-schedule edits, released CCF archive and secure URLs, and review-queued result-delivery requests. The current build additionally includes Lab Account billing records, historical intake files and PDF exports. These are code changes, not deployed features. No production cutover or repository deletion is authorized by this file.


## Routing and retirement
The 46 original Lab Account HTML page destinations are enumerated in `data/lab-account-cutover-redirects.json`. Domain redirects must be installed before retiring the former host. Retain original invoice query tokens on `pay-invoice.html`; strip or ignore query strings for login/selector routes. The original source repository remains the rollback source until cutover.
