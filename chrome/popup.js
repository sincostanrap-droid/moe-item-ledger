const api=globalThis.browser||chrome;
const $=s=>document.querySelector(s);let ledger={accounts:[],auto:true};
if(location.search.includes('tab'))document.body.classList.add('expanded');
let sortKey='name',sortDirection=1;
const dateLabel=stamp=>stamp===null?'日時不明':new Date(stamp).toLocaleString('ja-JP',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});
const pageName=p=>Number(p)===1?'基本枠':`レンタル${Number(p)-1}`;
function node(tag,text){const n=document.createElement(tag);n.textContent=text;return n;}
async function send(m){const r=await api.runtime.sendMessage(m);if(r.error)throw Error(r.error);return r;}
function status(s){$('#status').textContent=s;}
async function load(){const data=await api.storage.local.get('ledger');ledger=data.ledger||{accounts:[],auto:true};const selected=$('#filter').value;$('#filter').replaceChildren(new Option('全アカウント',''),...ledger.accounts.map(a=>new Option(a.name,a.name)));$('#filter').value=selected;$('#auto').checked=ledger.auto;render();accounts();}
function render(){
 const result=MoeSearch.sort(MoeSearch.groupedRows(ledger,$('#query').value,$('#filter').value),sortKey,sortDirection);
 document.querySelectorAll('[data-sort]').forEach(button=>{
  const active=button.dataset.sort===sortKey;
  button.textContent=button.dataset.label+(active?(sortDirection===1?' ▲':' ▼'):' ↕');
  button.setAttribute('aria-pressed',String(active));
 });
 document.querySelectorAll('th').forEach(th=>{
  const selected=[...th.querySelectorAll('[data-sort]')].some(b=>b.dataset.sort===sortKey);
  th.setAttribute('aria-sort',selected?(sortDirection===1?'ascending':'descending'):'none');
 });
 $('#results').replaceChildren();
 for(const r of result){
  const tr=document.createElement('tr');
  const name=node('td',r.name);
  const owner=node('td','');
  for(const entry of r.owners){
   const line=node('div',`${entry.account.name}：${entry.quantity.toLocaleString()}個`);
   line.append(node('small',entry.account.loginId||'ID未登録'));
   owner.append(line);
  }
  const quantity=node('td',r.quantity.toLocaleString());quantity.className='quantity';
  const updated=node('td',dateLabel(r.updatedAt));updated.className='updated';
  const details=document.createElement('details');
  details.append(node('summary','アカウント・ページ別日時'));
  for(const entry of r.owners){
   for(const [p,stamp] of [...entry.pageDates.entries()].sort((a,b)=>a[0]-b[0])){
    details.append(node('small',`${entry.account.name} / ${pageName(p)}：${dateLabel(stamp)}`));
   }
  }
  updated.append(details);
  tr.append(name,owner,quantity,updated);$('#results').append(tr);
 }
 $('#count').textContent=`${result.length}件 / 合計${result.reduce((n,r)=>n+r.quantity,0).toLocaleString()}個`;
 if(!result.length){const td=node('td',ledger.accounts.length?'該当するアイテムはありません':'ゲームからアイテムボックスを開くと、ここに在庫が表示されます。');td.colSpan=4;const tr=document.createElement('tr');tr.append(td);$('#results').append(tr);}
}
function accounts(){
 $('#account-list').replaceChildren();for(const a of ledger.accounts){const box=node('div','');box.className='account';box.append(node('strong',a.name));for(let p=1;p<=4;p++){const s=a.pages[p];box.append(node('p',`${pageName(p)}：${s?`${s.items.length}/128枠 使用 · ${new Date(s.capturedAt).toLocaleString()}`:'未取得（未契約を含む）'}`));}const label=node('label','ログインID（任意） ');const input=document.createElement('input');input.type='text';input.maxLength=200;input.value=a.loginId;const save=node('button',a.registered?'変更を保存':'登録 / 未入力で続ける');save.onclick=async()=>{try{await send({type:'register',account:a.name,loginId:input.value});status('登録内容を保存しました。');await load();}catch(e){status(e.message);}};label.append(input);box.append(label,save);$('#account-list').append(box);}
}
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{document.querySelectorAll('main > section').forEach(s=>s.hidden=s.id!==b.dataset.tab);document.querySelectorAll('[data-tab]').forEach(t=>t.classList.toggle('active',t===b));});
document.querySelectorAll('[data-sort]').forEach(button=>button.onclick=()=>{
 const key=button.dataset.sort;sortDirection=key===sortKey?-sortDirection:1;sortKey=key;render();
});
$('#query').oninput=render;$('#filter').onchange=render;
$('#capture').onclick=async()=>{const b=$('#capture');b.disabled=true;try{const [tab]=await api.tabs.query({active:true,currentWindow:true});const r=await api.tabs.sendMessage(tab.id,{type:'captureNow'});if(r.error)throw Error(r.error);status(`${r.account}：${r.count}枠を取得しました。`);await load();}catch(e){status('取得できません。公式のアイテムボックスを開いて再読み込み後、拡張のボタンから取得してください。 '+e.message);}finally{b.disabled=false;}};
$('#auto').onchange=async e=>{try{await send({type:'auto',value:e.target.checked});status('自動取得設定を保存しました。');}catch(e){status(e.message);}};
$('#open').onclick=()=>api.tabs.create({url:api.runtime.getURL('popup.html?tab=1')});
$('#export').onclick=async()=>{await load();const a=document.createElement('a');const url=URL.createObjectURL(new Blob([JSON.stringify({format:'moe-ledger-1',ledger},null,2)],{type:'application/json'}));a.href=url;a.download='moe-ledger-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);status('バックアップをダウンロードしました。');};
$('#import').onchange=async e=>{try{const f=e.target.files[0];if(!f)return;if(f.size>20000000)throw Error('ファイルが大きすぎます。');const d=JSON.parse(await f.text());if(d.format!=='moe-ledger-1')throw Error('対応していない形式です。');if(!confirm('現在の台帳全体をバックアップの内容で置き換えますか？'))return;await send({type:'restore',ledger:d.ledger});await load();status('台帳を復元しました。');}catch(err){status(err.message);}finally{e.target.value='';}};
api.storage.onChanged.addListener((changes,area)=>{if(area==='local'&&changes.ledger)load();});
load().then(()=>status('取得済みの在庫を表示しています。列見出しで並べ替えできます。未取得ページは「アカウント」で確認できます。')).catch(e=>status(e.message));

async function exportCsv(all){
 try{
  await load();
  const rows=MoeSearch.sort(MoeSearch.groupedRows(ledger,all?'':$('#query').value,all?'':$('#filter').value),sortKey,sortDirection);
  if(!rows.length){status('CSVに出力するアイテムがありません。');return;}
  const url=URL.createObjectURL(new Blob([MoeCsv.serialize(rows)],{type:'text/csv;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download=`moe-ledger-${all?'all':'search'}-${new Date().toISOString().slice(0,10)}.csv`;
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
  status(`${all?'全件':'検索結果'}の${rows.length}件をCSVに書き出しました。`);
 }catch(e){status('CSVを書き出せませんでした。 '+e.message);}
}
$('#csv-results').onclick=()=>exportCsv(false);
$('#csv-all').onclick=()=>exportCsv(true);
