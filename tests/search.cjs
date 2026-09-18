const assert=require('assert'),vm=require('vm'),fs=require('fs');const ctx={};vm.createContext(ctx);vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../common/search.js'),'utf8'),ctx);const S=ctx.MoeSearch;
const page=(date,items)=>({capturedAt:date,items:items.map(([name,quantity])=>({name,quantity}))});
const ledger={accounts:[{name:'A',loginId:'id2',pages:{1:page('2026-09-17T04:00:00Z',[['ロッド',2],['ロッド',1]]),2:page('2026-09-17T06:00:00Z',[['ロッド',7]])}},{name:'B',loginId:'id10',pages:{1:page('2026-09-17T05:00:00Z',[['ロッド',2]])}}]};
const r=S.rows(ledger,'ロ ッ ド');assert.equal(r.length,2);assert.equal(r[0].quantity,10);assert.equal(r[0].updatedAt,Date.parse('2026-09-17T04:00:00Z'));assert.equal(r[0].pageDates.size,2);
assert.equal(S.sort([...r],'quantity',1)[0].quantity,2);assert.equal(S.sort([...r],'quantity',-1)[0].quantity,10);assert.equal(S.sort([...r],'updatedAt',1)[0].account.name,'A');assert.equal(S.sort([...r],'updatedAt',-1)[0].account.name,'B');assert.equal(S.sort([...r],'loginId',1)[0].account.name,'A');assert.equal(S.sort([...r],'account',-1)[0].account.name,'B');assert.equal(S.rows(ledger,'ロッド','B').length,1);
ledger.accounts[0].pages[1].capturedAt='2026-09-17T07:00:00Z';assert.equal(S.rows(ledger)[0].updatedAt,Date.parse('2026-09-17T06:00:00Z'));
ledger.accounts[0].pages[1].capturedAt='invalid';for(const direction of [1,-1])assert.equal(S.sort(S.rows(ledger),'updatedAt',direction)[1].updatedAt,null);
console.log('PASS aggregation, oldest timestamp, per-page dates, quantity/date/account/ID sorting, filters, refreshed date, unknown dates');
