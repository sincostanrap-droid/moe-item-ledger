const api=globalThis.browser||chrome;
let queue=Promise.resolve();
function valid(s){return s&&typeof s.account==='string'&&s.account.length>0&&s.account.length<200&&Number.isInteger(s.page)&&s.page>=1&&s.page<=4&&s.capacity===128&&Array.isArray(s.items)&&s.items.length<=128&&s.items.every(i=>typeof i.name==='string'&&Number.isSafeInteger(i.quantity)&&i.quantity>=0&&Number.isInteger(i.slot));}
async function handle(m,sender){
 const {ledger={accounts:[],auto:true}}=await api.storage.local.get('ledger');
 const extension=sender.url?.startsWith(api.runtime.getURL(''));
 const official=sender.url && /^https:\/\/(www\.)?moepic\.com\/mp_itembox\/mp_itembox\.php(?:[?#]|$)/.test(sender.url);
 if(!extension&&!official) throw Error('取得元が不正です。');
 if(m.type==='capture') {
  if(!valid(m.snapshot)) throw Error('在庫データが不正です。');
  if(m.automatic && !ledger.auto) return {disabled:true};
  const snap=m.snapshot;let a=ledger.accounts.find(a=>a.name===snap.account);
  const fresh=!a;
  if(!a){a={name:snap.account,loginId:'',registered:false,pages:{}};ledger.accounts.push(a);}
  const old=a.pages[snap.page];
  if(!old || old.capturedAt<=snap.capturedAt) a.pages[snap.page]=snap;
  await api.storage.local.set({ledger});
  return {fresh:fresh||!a.registered,account:a.name,count:snap.items.length};
 }
 if(m.type==='register') {
  const a=ledger.accounts.find(a=>a.name===m.account);if(!a)throw Error('アカウントが見つかりません。');
  a.loginId=String(m.loginId||'').trim().slice(0,200);a.registered=true;
 } else if(extension && m.type==='auto') ledger.auto=!!m.value;
 else if(extension && m.type==='restore') {
  const v=m.ledger;
  if(!v||!Array.isArray(v.accounts)||typeof v.auto!=='boolean'||new Set(v.accounts.map(a=>a.name)).size!==v.accounts.length||!v.accounts.every(a=>typeof a.name==='string'&&typeof a.loginId==='string'&&a.pages&&Object.entries(a.pages).every(([p,s])=>valid(s)&&s.account===a.name&&String(s.page)===p&&Number.isFinite(Date.parse(s.capturedAt))))) throw Error('バックアップ形式が不正です。');
  await api.storage.local.set({ledger:v});return {ok:true};
 } else if(m.type!=='register') throw Error('未対応の操作です。');
 await api.storage.local.set({ledger});return {ok:true};
}
api.runtime.onMessage.addListener((m,sender,reply)=>{
 queue=queue.then(()=>handle(m,sender)).then(reply,e=>reply({error:e.message}));
 return true;
});
