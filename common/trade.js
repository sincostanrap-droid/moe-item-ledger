const api=globalThis.browser||chrome;
const $=s=>document.querySelector(s);
const id=new URLSearchParams(location.search).get('draft');
const key=id&&/^tradeDraft:[a-z0-9-]+$/i.test(id)?id:null;
let items=[],comment='',blob=null,imageUrl=null,ready=false,generation=0;
const status=s=>$('#trade-status').textContent=s;
const node=(tag,text)=>{const n=document.createElement(tag);n.textContent=text;return n;};
let saveQueue=Promise.resolve();
function save(){
 if(!ready||!key)return;
 const draft={items:items.map(i=>({...i})),comment:$('#trade-comment').value,createdAt:Date.now()};
 saveQueue=saveQueue.then(()=>api.storage.local.set({[key]:draft})).catch(e=>status('入力内容を保存できませんでした。 '+e.message));
}
function draw(canvas,layout){
 canvas.width=layout.width;canvas.height=layout.height;
 const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
 ctx.font='bold 38px system-ui,sans-serif';ctx.fillStyle='#244b38';ctx.fillText('MoE 売買リスト',24,52);
 ctx.font='24px system-ui,sans-serif';ctx.fillStyle='#47554e';ctx.fillText('【売り】  #masterofepic',24,92);
 let x=24;
 for(const block of layout.blocks){
  let y=112;ctx.fillStyle='#315743';ctx.fillRect(x,y,layout.blockWidth,64);
  ctx.font='bold 28px system-ui,sans-serif';ctx.fillStyle='#fff';let cx=x;
  ['アイテム名','個数','価格'].forEach((s,i)=>{ctx.fillText(s,cx+18,y+42);cx+=layout.widths[i];});y+=64;
  block.forEach((row,index)=>{
   ctx.fillStyle=index%2?'#f2f6f3':'#fff';ctx.fillRect(x,y,layout.blockWidth,row.height);
   ctx.strokeStyle='#b9c8bf';ctx.lineWidth=1;ctx.font='28px system-ui,sans-serif';ctx.fillStyle='#182c20';let cellX=x;
   row.cells.forEach((lines,i)=>{ctx.strokeRect(cellX,y,layout.widths[i],row.height);lines.forEach((s,j)=>ctx.fillText(s,cellX+layout.padding,y+layout.padding+28+j*layout.lineHeight));cellX+=layout.widths[i];});y+=row.height;
  });x+=layout.blockWidth+24;
 }
}
async function generate(){
 const ticket=++generation;blob=null;$('#trade-output').hidden=true;$('#trade-download').hidden=true;
 if(imageUrl){URL.revokeObjectURL(imageUrl);imageUrl=null;}$('#trade-preview').removeAttribute('src');
 try{
  const text=MoeTrade.text(items,$('#trade-comment').value),weight=MoeTrade.weight(text);
  $('#trade-count').textContent=`${items.length}品 / ${weight} / 280換算`;
  if(weight<=MoeTrade.limit){
   $('#trade-mode').textContent='テキストのtweetテンプレート';$('#trade-explanation').textContent='コピーして、tweet作成画面に貼り付けてください。';$('#trade-text').value=text;$('#trade-image').hidden=true;
  }else{
   const caption=MoeTrade.caption($('#trade-comment').value);
   if(MoeTrade.weight(caption)>MoeTrade.limit)throw Error('補足が長すぎます。画像に添えるtweetが280換算以内になるよう短くしてください。');
   await document.fonts.ready;if(ticket!==generation)return;
   const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');ctx.font='28px system-ui,sans-serif';
   const layout=MoeTrade.layout(items,s=>ctx.measureText(s).width);draw(canvas,layout);
   const result=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));canvas.width=1;canvas.height=1;
   if(ticket!==generation)return;if(!result)throw Error('画像を生成できませんでした。');
   blob=result;imageUrl=URL.createObjectURL(blob);$('#trade-preview').src=imageUrl;
   $('#trade-mode').textContent='画像のtweetテンプレート';$('#trade-explanation').textContent='一覧は1枚の画像にしました。PNGをダウンロードし、下のtweetテキストと一緒に添付してください。';$('#trade-text').value=caption;$('#trade-image').hidden=false;$('#trade-download').hidden=false;
  }
  $('#trade-output').hidden=false;status('テンプレートを作成しました。販売個数・価格・補足を確認してください。');
 }catch(e){if(ticket===generation){$('#trade-count').textContent='';status(e.message);}}
}
function render(){
 $('#trade-items').replaceChildren();
 items.forEach((item,index)=>{
  const row=document.createElement('tr');const name=node('td',item.name),qty=node('td',''),price=node('td',''),remove=node('td','');
  const q=document.createElement('input');q.type='number';q.min='1';q.max=String(item.available);q.step='1';q.value=item.quantity;q.setAttribute('aria-label',`${item.name}の販売個数`);
  q.oninput=()=>{item.quantity=Number(q.value);save();generate();};qty.append(q,node('small',`記録上 ${item.available}個`));
  const p=document.createElement('input');p.type='text';p.value=item.price;p.placeholder='例：500k／応相談';p.setAttribute('aria-label',`${item.name}の価格`);p.oninput=()=>{item.price=p.value;save();generate();};price.append(p);
  const b=node('button','削除');b.onclick=()=>{items.splice(index,1);save();render();generate();};remove.append(b);row.append(name,qty,price,remove);$('#trade-items').append(row);
 });
 $('#trade-generate').disabled=!items.length;
}
$('#trade-generate').onclick=generate;
$('#trade-comment').oninput=()=>{save();generate();};
$('#trade-copy').onclick=async()=>{
 try{await navigator.clipboard.writeText($('#trade-text').value);status('tweetテキストをコピーしました。');}
 catch(e){$('#trade-text').focus();$('#trade-text').select();status('コピーできませんでした。選択されたテキストを手動でコピーしてください。');}
};
$('#trade-download').onclick=()=>{if(!blob||!imageUrl)return;const a=document.createElement('a');a.href=imageUrl;a.download=`moe-trade-${new Date().toISOString().slice(0,10)}.png`;document.body.append(a);a.click();a.remove();status('PNG画像をダウンロードしました。');};
(async()=>{
 try{
  if(!key)throw Error('台帳でアイテムをチェックし、「売買tweet生成」から開いてください。');
  const data=await api.storage.local.get(key),draft=data[key];
  if(!draft||!Array.isArray(draft.items))throw Error('選択データが見つかりません。台帳から生成し直してください。');
  items=draft.items.map(i=>({name:String(i.name),available:Number(i.available),quantity:Number(i.quantity)||1,price:String(i.price||'')}));
  $('#trade-comment').value=String(draft.comment||'');ready=true;render();status('価格を入力してください。入力するとテンプレートが更新されます。');
 }catch(e){status(e.message);$('#trade-generate').disabled=true;}
})();
window.addEventListener('unload',()=>{if(imageUrl)URL.revokeObjectURL(imageUrl);});
