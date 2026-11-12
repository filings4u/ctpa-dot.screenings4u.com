import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>readFileSync(path.join(root,file),'utf8');
const handoff=read('assets/js/auth-handoff.js');
const session=read('assets/js/session-security.js');
const app=read('assets/js/app.js');
const workspace=read('workspace.html');
const nondot=read('nondot-workspace.html');
const config=read('assets/js/config.js');
const checks=[
 ['One central Workforce selector',workspace.includes('https://workforceapps.screenings4u.com/selector.html')&&!workspace.includes('/assets/js/workspace.js')],
 ['Incomplete handoff returns to selector',handoff.includes('location.replace(HOME);')],
 ['Existing DOT transfer supported',handoff.includes("data.target_surface==='dot'&&data.target_portal==='ctpa_dot'")],
 ['NON-DOT transfer supported',handoff.includes("data.target_surface==='workforce'&&data.target_portal==='ctpa_workforce'")],
 ['One-time handoff token cleared from URL',handoff.includes("history.replaceState(null,'','/auth-handoff.html')")],
 ['NON-DOT receipt checks selected membership',handoff.includes('d.membership?.id!==membership')],
 ['NON-DOT receipt checks selected subscription',handoff.includes('String(actualSub)!==sub')],
 ['NON-DOT receipt checks plan audience',handoff.includes("startsWith('workforce_ctpa_')")],
 ['NON-DOT-only entry stays on limited workspace',handoff.includes("isNondot?'/nondot-workspace.html':'/dashboard.html'")],
 ['NON-DOT session never opens DOT page',session.includes("if(isNondot&&P!=='nondot-workspace.html')")],
 ['NON-DOT session never trusts saved authorization',session.includes("if(w?.surface==='nondot')return null")],
 ['Workspace storage retains independent context',config.includes("surface:x.surface==='nondot'?'nondot':'dot'")],
 ['NON-DOT-only pages exclude DOT feature access',app.includes("if(workspace()?.surface==='nondot'&&key!=='nondot_workspace')")],
 ['NON-DOT-only data API uses separate operating context',app.includes("operating_context:w.surface==='nondot'?'nondot':'dot'")],
 ['Protected NON-DOT route uses shared C/TPA app',nondot.includes('data-portal-page="nondot-workspace"')&&nondot.includes('/assets/js/session-security.js')]
];
let failed=0;
for(const [name,ok] of checks){
 console.log((ok?'PASS':'FAIL')+' '+name);
 if(!ok)failed++;
}
console.log(checks.length-failed+'/'+checks.length+' handoff regression checks passed');
if(failed)process.exitCode=1;
