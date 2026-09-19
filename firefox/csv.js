/* CSV export is a listing, not a restorable backup. */
globalThis.MoeCsv = {
 serialize(rows) {
  const cell=value=>{
   let text=String(value??'');
   // Quoting alone does not stop spreadsheet formula evaluation.
   if(/^[\s\uFEFF]*[=+@-]/u.test(text)||/^[\t\r\n]/u.test(text))text="'"+text;
   return '"'+text.replace(/"/g,'""')+'"';
  };
  const lines=[['アイテム名','アカウント別個数','ログインID（アカウント別）','合計個数','更新日時']];
  for(const row of rows)lines.push([row.name,row.owners.map(o=>`${o.account.name}：${o.quantity}個`).join(' / '),row.owners.map(o=>`${o.account.name}：${o.account.loginId||'未登録'}`).join(' / '),row.quantity,row.updatedAt===null?'':new Date(row.updatedAt).toISOString()]);
  return '\uFEFF'+lines.map(line=>line.map(cell).join(',')).join('\r\n')+'\r\n';
 }
};
