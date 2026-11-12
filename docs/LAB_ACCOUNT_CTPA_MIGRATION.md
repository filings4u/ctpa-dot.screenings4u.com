# Lab Account → C/TPA migration

Scope: preserve C/TPA program, pools, selections, testing, results, documents, and billing. Add laboratory-specific tools only behind company purchases.

## System ownership
- app.screenings4u.com: central Workforce management and entitlements.
- testing-portal.screenings4u.com: screenings4u testing operations feeding app.
- ctpa.screenings4u.com: Workforce C/TPA customer portal and entitled Lab Account tools.
- employer.screenings4u.com: future consolidated Employer portal, also eligible for Lab Account add-on.
- customers.screenings4u.com: retail testing purchases, unchanged.
- Training, LMS and training-portal repositories are excluded.

## Stage 1 changes (migration-workforce-consolidation-20261111 branch only)
- New lab-services.html uses C/TPA existing portal shell.
- New assets/js/lab-services.js displays account numbers, setup records and physical shipments read-only.
- C/TPA app.js loads these pages through its existing router and shows navigation only after backend access verification.
- Supabase workforce-ctpa-lab-services: secure API using selected C/TPA ID and subscription ID; verifies session context, active organization membership, active portal/subscription, and purchased company Lab Account entitlement.
- Backend reads existing records and only exposes matching purchase-linked setup/shipment records. No customer data copied.
- New company entitlement table uses RLS, revoked browser access, and service-role authorization.
- Review of three paid Lab Account intakes found two uniquely matched C/TPA organizations and one unresolved record.
- The two uniquely matched customer records are PENDING grants. Zero active migration grants; no legacy access changes.

## Cutover gates
1. Review purchase/order ownership and unresolved legacy customer before activating any entitlement.
2. Connect verified one-time Stripe Lab Account add-on checkout and management provisioning.
3. Integrate Lab-only testing orders, donor passes, scheduling, supplies, CCFs, results, secure PDF documents and billing without duplicating C/TPA features.
4. Verify role-and-company permission boundaries and test unauthorized access at API and page level.
5. Complete authenticated mobile/desktop customer testing and staff testing in app.
6. Only then migrate users and retire Lab Account's standalone portal. Keep a rollback route.

Not complete: checkout/entitlement activation, full laboratory workflows, Employer add-on, authenticated end-to-end QA, or production cutover.
