import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=f=>readFileSync(path.join(root,f),'utf8');
const ui=read('assets/js/nondot-workspace.js');
const app=read('assets/js/app.js');
const html=read('nondot-workspace.html');
const checks=[
 ['Company creation UI only where authorized',ui.includes("d.can_manage===true&&d.read_only===false")],
 ['Primary form is employee/program scoped',ui.includes("['people','programs'].includes(section.id)")],
 ['Employee and program create operation names',ui.includes("'save_employee':'save_program'")],
 ['Existing C/TPA shell used',html.includes('data-portal-page="nondot-workspace"')&&html.includes('/assets/js/app.js')],
 ['Submission uses signed in NON-DOT account only',app.includes("w?.surface!=='nondot'||!w.ctpa_id||!w.subscription_id")],
 ['Submission allows only explicit creation actions',app.includes("['save_employee','save_program'].includes(payload?.action)")],
 ['Submission includes C/TPA and subscription',app.includes('subscription_id:w.subscription_id,operating_context:"nondot"')],
 ['Authorization cannot be reused across browser cache',app.includes("if(p==='nondot_workspace')return null;")],
 ['Backend success required before user sees saved',app.includes('data.ok!==true||data.saved!==true')]
];
let failures=0;
for(const [description,condition]of checks){console.log((condition?'PASS':'FAIL')+' '+description);if(!condition)failures++;}
console.log((checks.length-failures)+'/'+checks.length+' NON-DOT create migration checks passed');
if(failures)process.exitCode=1;
