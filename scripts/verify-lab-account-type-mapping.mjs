import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const code=readFileSync(path.join(root,'supabase/functions/workforce-ctpa-lab-services/index.ts'),'utf8');
const begin=code.indexOf('account_numbers:(()=>{');
const end=code.indexOf('})()',begin);
assert.ok(begin!==-1&&end>begin,'lab number mapping is present');
const section=code.slice(begin,end);
for(const [label,valid] of [
 ['reads configured account type',section.includes('config.account_type')],
 ['supports DOT and NON-DOT',section.includes('"dot","non_dot","hair","oral"')],
 ['uses explicit account type for single-number records',section.includes('numbers[accountType]=String(x.account_code)')],
 ['does not always populate DOT from account_code',!section.includes('dot:String(x.config?.account_numbers?.dot||x.account_code')],
 ['preserves existing per-type number assignments',section.includes('numbers[key]=String(configured[key]||"")')],
 ['limits untyped fallback to legacy records',section.includes('!accountType&&!allowed.some(key=>numbers[key])')],
 ['requires purchased Lab Account entitlement',code.includes('.eq("entitlement_code","lab_account").eq("status","active")')],
 ['limits records to selected C/TPA',code.includes('.eq("ctpa_id",ctpaId)')],
 ['does not create or alter customer records',!code.includes('.insert(')&&!code.includes('.update(')]
]){console.log(`${valid?'PASS':'FAIL'} ${label}`);assert.ok(valid,label)}
console.log('9/9 C/TPA lab account source mapping checks passed');
