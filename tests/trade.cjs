const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');
require('../common/trade-core.js');
const item=(name='アクア ロッド',quantity=1,price='500k')=>({name,quantity,price,available:10});
assert.equal(MoeTrade.weight('a'.repeat(280)),280);assert.equal(MoeTrade.weight('あ'.repeat(140)),280);assert.equal(MoeTrade.weight('あ'.repeat(141)),282);
assert.equal(MoeTrade.weight('https://t.co/a'),23);assert.ok(MoeTrade.weight('https://example.com/'+ 'a'.repeat(100))>23);
assert.ok(MoeTrade.weight('👨‍👩‍👧‍👦')>=2);
assert.equal(MoeTrade.text([item()]),'【売り】\nアクア ロッド ×1：500k\n#masterofepic');
assert.ok(MoeTrade.text([item('杖',2,'応相談')]).includes('×2：応相談'));assert.ok(MoeTrade.text([item('杖',1,'')]).includes('価格未入力'));
for(const q of [0,-1,1.5,11,NaN])assert.throws(()=>MoeTrade.text([item('杖',q)]));assert.throws(()=>MoeTrade.text([]));
const multiline=[item('非常に長いアイテム名'.repeat(10),2,'価格\n応相談')];
const layout=MoeTrade.layout(multiline,s=>Array.from(s).length*28);
assert.equal(layout.blocks.flat().length,1);assert.equal(layout.blocks[0][0].cells[0].join(''),multiline[0].name);assert.deepEqual(layout.blocks[0][0].cells[2],['価格','応相談']);
const many=Array.from({length:300},(_,i)=>item('品物'+i));const tiled=MoeTrade.layout(many,s=>s.length*28);assert.equal(tiled.blocks.flat().length,300);assert.ok(tiled.blocks.length>1);
assert.throws(()=>MoeTrade.layout([item('a'.repeat(1000000))],s=>s.length*28));
// Execute the real generation UI with DOM/Canvas/browser adapters.
class El{
 constructor(tag='div'){this.tag=tag;this.children=[];this.value='';this.hidden=false;this.attrs={};}
 append(...nodes){this.children.push(...nodes);}replaceChildren(...nodes){this.children=nodes;}setAttribute(k,v){this.attrs[k]=v;}removeAttribute(k){delete this.attrs[k];}remove(){}focus(){}select(){this.selected=true;}click(){this.clicked=true;}
 getContext(){return {font:'',measureText:s=>({width:Array.from(s).length*28}),fillRect(){},strokeRect(){},fillText(s){drawn.push(s);}};}
 toBlob(cb){cb(new Blob(['PNG-adapter'],{type:'image/png'}));}
}
const ids={};for(const id of [...fs.readFileSync('common/trade.html','utf8').matchAll(/id="([^"]+)"/g)].map(m=>m[1]))ids[id]=new El();
const drawn=[],written=[],copied=[];let revoked=[];
const draft={items:[item()],comment:''};
const doc={querySelector:s=>ids[s.slice(1)],createElement:t=>new El(t),fonts:{ready:Promise.resolve()},body:new El()};
const ctx=vm.createContext({console,Blob,Intl,URLSearchParams,Date,document:doc,location:{search:'?draft=tradeDraft:abc-123'},navigator:{clipboard:{writeText:async s=>copied.push(s)}},window:{addEventListener(){}},URL:{createObjectURL:()=> 'blob:preview',revokeObjectURL:u=>revoked.push(u)},browser:{storage:{local:{get:async()=>({'tradeDraft:abc-123':draft}),set:async d=>written.push(d)}}}});
vm.runInContext(fs.readFileSync('common/trade-core.js','utf8'),ctx);vm.runInContext(fs.readFileSync('common/trade.js','utf8'),ctx);
(async()=>{
 await new Promise(setImmediate);assert.equal(ids['trade-items'].children.length,1);
 await vm.runInContext('generate()',ctx);assert.equal(ids['trade-image'].hidden,true);assert.ok(ids['trade-text'].value.includes('500k'));
 await ids['trade-copy'].onclick();assert.equal(copied.length,1);
 ctx.longItems=Array.from({length:15},(_,i)=>item('長い品名'+i,2,'応相談'));vm.runInContext('items=longItems',ctx);
 await vm.runInContext('generate()',ctx);assert.equal(ids['trade-image'].hidden,false);assert.equal(ids['trade-download'].hidden,false);assert.equal(ids['trade-output'].hidden,false);assert.ok(drawn.includes('応相談'));assert.ok(!drawn.some(s=>/loginId|倉庫A/.test(s)));
 ids['trade-download'].onclick();assert.match(ids['trade-status'].textContent,/ダウンロード/);
 vm.runInContext('items=[{name:"品",quantity:0,available:1,price:"1k"}]',ctx);await vm.runInContext('generate()',ctx);assert.equal(ids['trade-output'].hidden,true);assert.ok(revoked.length);
 console.log('PASS weighted boundaries, prices, quantities, full image layout, huge-input guard, generation UI, copy and download');
})().catch(e=>{console.error(e);process.exitCode=1;});
