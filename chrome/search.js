/* Pure search/aggregation helpers shared by the popup and tests. */
globalThis.MoeSearch = {
 rows(ledger, query='', account='') {
  const normalize=s=>s.normalize('NFKC').toLowerCase().replace(/\s/g,'');
  const result=[];
  for(const a of ledger.accounts){
   if(account&&a.name!==account)continue;
   const names=new Map();
   for(const [page,snapshot] of Object.entries(a.pages)){
    for(const item of snapshot.items){
     if(!normalize(item.name).includes(normalize(query)))continue;
     let row=names.get(item.name);
     if(!row){row={name:item.name,account:a,quantity:0,pageDates:new Map(),updatedAt:null};names.set(item.name,row);}
     row.quantity+=item.quantity;
     const stamp=Date.parse(snapshot.capturedAt);
     row.pageDates.set(Number(page),Number.isFinite(stamp)?stamp:null);
    }
   }
   for(const row of names.values()){
    const stamps=[...row.pageDates.values()];
    row.updatedAt=stamps.includes(null)?null:Math.min(...stamps);
    result.push(row);
   }
  }
  return result;
 },
 sort(rows,key='name',direction=1){
  const text=(a,b)=>a.localeCompare(b,'ja',{numeric:true});
  return rows.sort((a,b)=>{
   let cmp=0;
   if(key==='updatedAt'){
    // Unknown dates stay at the bottom in both directions.
    if(a.updatedAt===null&&b.updatedAt!==null)return 1;
    if(b.updatedAt===null&&a.updatedAt!==null)return -1;
    cmp=(a.updatedAt??0)-(b.updatedAt??0);
   }else if(key==='quantity')cmp=a.quantity-b.quantity;
   else if(key==='account')cmp=text(a.account.name,b.account.name);
   else if(key==='loginId')cmp=text(a.account.loginId||'',b.account.loginId||'');
   else cmp=text(a.name,b.name);
   return cmp*direction||text(a.name,b.name)||text(a.account.name,b.account.name);
  });
 }
};
