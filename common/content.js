(()=>{
 const api=globalThis.browser||chrome;
 async function capture(automatic=false){
  const snapshot=MoeParser.parse(document);
  const result=await api.runtime.sendMessage({type:'capture',snapshot,automatic});
  if(result.error)throw Error(result.error);
  if(result.fresh)registration(result.account);
  return result;
 }
 function registration(account){
  if(document.getElementById('moe-ledger-registration'))return;
  const host=document.createElement('div');host.id='moe-ledger-registration';const shadow=host.attachShadow({mode:'closed'});
  shadow.innerHTML='<style>:host{position:fixed;right:20px;top:20px;z-index:2147483647}section{font:14px/1.6 system-ui;width:310px;max-width:85vw;background:#fff;color:#25302e;border:1px solid #aabdb0;border-radius:12px;padding:20px;box-shadow:0 8px 30px #0003}h2{font-size:17px;margin:0 0 12px}input{box-sizing:border-box;width:100%;padding:8px;margin:8px 0 14px}button{padding:8px;margin:4px 4px 0 0;cursor:pointer}small{display:block;color:#59685f}</style><section role="dialog" aria-label="初回アカウント登録"><h2>台帳にアカウントを追加</h2><strong></strong><small>在庫は取得済みです。</small><label>ログインID（任意）<input autocomplete="off" maxlength="200" placeholder="後から登録できます"></label><button data-save>保存</button><button data-skip>ID未入力で続ける</button><small data-status></small></section>';
  shadow.querySelector('strong').textContent=account;
  const save=async skip=>{try{const r=await api.runtime.sendMessage({type:'register',account,loginId:skip?'':shadow.querySelector('input').value});if(r.error)throw Error(r.error);host.remove();}catch(e){shadow.querySelector('[data-status]').textContent=e.message;}};
  shadow.querySelector('[data-save]').onclick=()=>save(false);shadow.querySelector('[data-skip]').onclick=()=>save(true);document.documentElement.append(host);
 }
 api.runtime.onMessage.addListener((m,s,reply)=>{if(m.type!=='captureNow')return;capture(false).then(reply,e=>reply({error:e.message}));return true;});
 api.storage.local.get('ledger').then(({ledger})=>{if(ledger?.auto===false)return;return capture(true);}).catch(e=>console.warn('MoE台帳:',e.message));
})();
