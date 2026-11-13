(()=>{
'use strict';
// This is the retired C/TPA application runtime. Every legacy page that
// still references it must enter the independent unified application.
const old=new URL(location.href);
const target=new URL('/unified.html',location.origin);
const page=old.pathname.replace(/^\//,'').replace(/\.html$/,'').replace(/-/g,'_');
const supported=new Set(['dashboard','employers','owner_operators','people','programs','pools','selections','testing','results','compliance','documents','reports','occupational_health','notifications','billing','invoices','integrations','locations','support','price_list','orders','testing_orders','audit_history']);
const map={testing:'testing_orders',laboratory_overview:'dashboard','new_entrant_audits':'audits',employer_billing:'invoices',order_history:'orders',lab_services:'lab_accounts',users_roles:'staff'};
target.searchParams.set('page',map[page]|| (supported.has(page)?page:'dashboard'));
const context=old.searchParams.get('workspace');
if(context==='dot'||context==='nondot')target.searchParams.set('context',context);
location.replace(target.href);
})();
