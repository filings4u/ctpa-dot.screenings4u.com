import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const server=readFileSync(path.join(root,'supabase/functions/workforce-ctpa-lab-services/index.ts'),'utf8');
const client=readFileSync(path.join(root,'assets/js/lab-services.js'),'utf8');
const start=server.indexOf('let testingRequests:any[]=[];');
const end=server.indexOf('return out({',start);
assert.ok(start!==-1&&end>start,'read-only testing request inventory exists');
const scoped=server.slice(start,end);
const checks=[
 ['requires verified company lab entitlement',server.includes('.eq("entitlement_code","lab_account").eq("status","active")')],
 ['requires selected C/TPA and subscription',server.includes('p_ctpa_id:ctpaId,p_subscription_id:subscriptionId')],
 ['requires verified linked purchaser and intake',scoped.includes('grant.data.linked_customer_user_id&&intakeIds.length')],
 ['filters by exact purchaser ID',scoped.includes('.eq("customer_user_id",grant.data.linked_customer_user_id)')],
 ['filters by exact company ID',scoped.includes('.contains("metadata",{source:"lab_account_portal",ctpa_id:ctpaId})')],
 ['returns limited testing status fields',scoped.includes('status:x.status,test_type:x.test_type')],
 ['does not return donor details',!scoped.includes('donor_name')&&!scoped.includes('donor_email')],
 ['does not return medical or MRO results',!scoped.includes('result_details')&&!scoped.includes('mro_report')],
 ['does not write test cases',!scoped.includes('.insert(')&&!scoped.includes('.update(')&&!scoped.includes('.delete(')],
 ['limits results',scoped.includes('.limit(100)')],
 ['UI displays explicitly linked requests',client.includes('requests=d.testing_requests||[]')&&client.includes('Lab Account testing requests')],
 ['UI explains missing legacy mappings',client.includes('without verified company linkage')],
 ['donor passes scoped to verified purchaser',scoped.includes('.eq("customer_user_id",grant.data.linked_customer_user_id)')],
 ['donor passes restricted to verified C/TPA cases',scoped.includes('.in("testing_case_id",caseIds)')],
 ['pass response excludes pass numbers and links',!scoped.includes('.select("pass_number')&&!scoped.includes('donor_pass_url')],
 ['pass data is status-only',scoped.includes('donor_pass_status:passByCase.get(x.id)?.status||"not_issued"')],
 ['client renders pass status without token',client.includes('Donor pass: ')&&!client.includes('pass_number')],
 ['existing Lab Account operations preserved',client.includes('original Lab Account portal')]
];
for(const [label,pass] of checks){console.log(`${pass?'PASS':'FAIL'} ${label}`);assert.ok(pass,label)}
console.log(`${checks.length}/${checks.length} source assertions passed (not live integration tests)`);
