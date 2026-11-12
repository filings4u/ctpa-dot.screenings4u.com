import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const code=readFileSync(path.join(root,'supabase/functions/workforce-ctpa-lab-services/index.ts'),'utf8');
const client=readFileSync(path.join(root,'assets/js/lab-services.js'),'utf8');
const begin=code.indexOf('account_numbers:(()=>{');
const end=code.indexOf('})()',begin);
assert.ok(begin!==-1&&end>begin,'lab number mapping is present');
const section=code.slice(begin,end);
for(const [label,valid] of [
 ['reads configured account type',section.includes('config.account_type')],
 ['supports DOT and NON-DOT',section.includes('"dot","non_dot","hair","oral"')],
 ['uses explicit account type for single-number records',section.includes('numbers[accountType]=single')],
 ['does not always populate DOT from account_code',!section.includes('dot:String(x.config?.account_numbers?.dot||x.account_code')],
 ['preserves existing per-type number assignments',section.includes('numbers[key]=String(configured[key]||"")')],
 ['limits unknown-category accounts from being assigned',section.includes('!allowed.some(key=>numbers[key]===single)')],
 ['untyped account is not labeled DOT',section.includes('numbers.unclassified=single')&&!section.includes('numbers.dot=single')],
 ['conflicting typed numbers are flagged',section.includes('numbers[accountType]!==single)numbers.unclassified=single')],
 ['unknown account types are not forced into DOT',section.includes('!allowed.some(key=>numbers[key]===single)')],
 ['unclassified numbers are visibly flagged',client.includes('Unclassified account · confirm with Workforce')],
 ['requires purchased Lab Account entitlement',code.includes('.eq("entitlement_code","lab_account").eq("status","active")')],
 ['limits records to selected C/TPA',code.includes('.eq("ctpa_id",ctpaId)')],
 ['does not create or alter customer records',!code.includes('.insert(')&&!code.includes('.update(')]
]){console.log(`${valid?'PASS':'FAIL'} ${label}`);assert.ok(valid,label)}
console.log('13/13 C/TPA lab account source mapping checks passed');
