$ErrorActionPreference = 'Stop'
$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')
$diagnosticSource = @'
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawnSync} from 'node:child_process';
const root=path.join(os.homedir(),'.ag-bridge');
const report={kind:'AG Bridge diagnostic metadata v1',git:[],agents:[]};
const knownReasons=[
  ['invalid path',/invalid path/i],['index lock',/index\.lock|unable to create.*lock/i],
  ['corrupt index',/index file.*(corrupt|smaller)|invalid index/i],
  ['dubious ownership',/dubious ownership/i],['not a repository',/not a git repository/i],
  ['untracked files would be overwritten',/untracked.*overwritten/i],
  ['local changes would be overwritten',/local changes.*overwritten/i],
  ['path too long',/filename too long|path.*too long/i],
  ['unborn or missing HEAD',/ambiguous argument.*HEAD|invalid.*HEAD|unable to resolve.*HEAD/i]
];
const names=fs.existsSync(root)?fs.readdirSync(root):[];
for(const name of names.filter(n=>/^(clone|sparse)-\d+\.log$/.test(n))){
 const content=fs.readFileSync(path.join(root,name),'utf8');
 report.git.push({file:name,reasons:knownReasons.filter(([,rx])=>rx.test(content)).map(([reason])=>reason),
  lines:content.split(/\r?\n/).length,invalidMemoryPath:/invalid path.*data\/memory\//i.test(content),
  errorCodes:[...new Set(content.match(/\b(?:fatal|error|warning)\b/gi)??[])]});
}
for(const name of names.filter(n=>/^agent-\d+-\d+\.log$/.test(n)).sort().slice(-8)){
 const content=fs.readFileSync(path.join(root,name),'utf8');let lastResult;const steps={};const textFields={};let jsonLines=0;
 for(const line of content.split(/\r?\n/)){
  let e;try{e=JSON.parse(line)}catch{continue}jsonLines++;
  if(e.event==='result')lastResult=e.result;
  if(e.event==='step_update'){
   const s=e.step_update??{};const kind=String(s.step_type??'unknown').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,60);
   steps[kind]=(steps[kind]??0)+1;
   for(const [k,v] of Object.entries(s))if(typeof v==='string'&&/text|content|response|delta|message/i.test(k))textFields[k]=(textFields[k]??0)+v.length;
  }
 }
 report.agents.push({file:name,jsonLines,terminalStatus:lastResult?.status??'absent',
  resultKeys:Object.keys(lastResult??{}),responseType:typeof lastResult?.response,
  responseLength:typeof lastResult?.response==='string'?lastResult.response.length:null,
  steps,textFieldLengths:textFields,permissionNotice:/soft.denied|requires approval|permission.*denied/i.test(content),
  authenticationNotice:/authentication required|not authenticated/i.test(content)});
}
const statePath=path.join(root,'state.json');
if(fs.existsSync(statePath)){
 const state=JSON.parse(fs.readFileSync(statePath,'utf8'));
 report.tasks=Object.entries(state).filter(([n])=>/^\d+$/.test(n)).map(([number,s])=>({number,site:s.site,status:s.status,recovery:s.recoveredFor??null}));
}
const body='AG Bridge diagnostics (metadata only; no log contents, credentials, customer data or model response text)\n\n```json\n'+JSON.stringify(report,null,2)+'\n```';
const posted=spawnSync('gh',['api','repos/erichroeseler123-bot/destinations-cc/issues/143/comments','--method','POST','--input','-'],{input:JSON.stringify({body}),encoding:'utf8',windowsHide:true});
if(posted.status!==0){console.error('Diagnostic upload failed. Check gh auth status. No raw logs were uploaded.');process.exitCode=1;}
else console.log('Diagnostic metadata sent. Return to ChatGPT and say: diagnostics sent.');
'@
$diagnosticPath = Join-Path $env:TEMP 'ag-bridge-diagnostics.mjs'
Set-Content -Path $diagnosticPath -Value $diagnosticSource -Encoding utf8
& node $diagnosticPath
if ($LASTEXITCODE -ne 0) { throw 'Diagnostics did not complete.' }
