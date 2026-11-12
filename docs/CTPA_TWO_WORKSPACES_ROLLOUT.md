# C/TPA two-workspace and laboratory page rollout

This branch reorganizes the existing portal. It does **not** provision new subscription access, merge Supabase organizations, alter pricing, migrate user records, deploy the backend, or delete the legacy Lab Account repository.

## Workspace navigation
- DOT Workspace: existing /dashboard.html and its DOT pages
- NON-DOT Workspace: existing /nondot-workspace.html with separately verified access
- Common Support: existing /support.html, reachable from the NON-DOT surface
- No standalone Lab Account navigation item and no duplicate DOT/NON-DOT selector link in the sidebar.

## Dedicated laboratory pages
Existing assets/js/lab-services.js and its server-verified workforce-ctpa-lab-services API are reused, not copied. The 15 HTML routes each select a distinct page panel (rather than a tab on /lab-services.html):

- People & Programs: laboratory-clients.html, laboratory-consortiums.html
- Testing & Laboratory Services: laboratory-overview.html, laboratory-accounts.html, laboratory-orders.html, laboratory-tracking.html, laboratory-results.html, laboratory-delivery.html, laboratory-supplies.html, laboratory-alerts.html, laboratory-analytics.html
- Compliance & Documents: laboratory-documents.html, laboratory-benefits.html
- Services & Billing: laboratory-services.html, laboratory-billing.html

Existing C/TPA support, billing, testing, results, programs, pools and laboratory account assignment modules remain available and authoritative where appropriate.

## Safety and verification
- Customer entitlement and organization checks remain enforced by the backend.
- This is a page-and-navigation stage, not verified end-to-end completion.
- Verify navigation on desktop/mobile, two workspace options only, active selection, and each laboratory route.
- Verify purchasing company isolation, donor passes, result release, documents, invoices, supplies and service requests using authorized and unauthorized accounts.
- Check existing NON-DOT authorization and support session behavior.
- Measure initial render and API timing in Chrome DevTools with production account context.
- Keep legacy /lab-services.html and original Lab Account repo as fallback pending redirect/data cutover.

## Future work
Build and test complete Enterprise features in both workspaces, then finalize subscription/role entitlements without relaxing server-side authorization. Add unified profile/account settings once their existing identity APIs are verified.