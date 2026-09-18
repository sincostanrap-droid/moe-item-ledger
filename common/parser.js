/* Reads displayed DOM only. Never executes page links or submits forms. */
globalThis.MoeParser = {
 parse(doc) {
  const account = doc.querySelector('#login .playernote .txt1')?.textContent.trim();
  if (!account) throw Error('アカウント名を取得できません。ログイン状態を確認してください。');
  const tables = [...doc.querySelectorAll('table.gridlayout')];
  const table = tables.find(t=>t.querySelector('thead')?.textContent.includes('アイテム名') && t.querySelector('thead')?.textContent.includes('個数'));
  if (!table) throw Error('アイテムボックスの一覧が見つかりません。');
  const pageText = doc.querySelector('input[name="PAGE_CURRENT"]')?.value;
  if (!/^[1-4]$/.test(pageText || '')) throw Error('ページ番号を確認できないため保存を中止しました。');
  const rows = [...table.querySelectorAll('tbody > tr')];
  if (rows.length !== 128) throw Error(`128枠中${rows.length}枠しか読み取れません。保存を中止しました。`);
  const items=[]; const slots=new Set();
  for (const row of rows) {
   const cells=[...row.children];
   if(cells.length!==6) throw Error('一覧の列構造が変わっています。');
   const number=cells[1].textContent.trim();
   if(!/^\d+$/.test(number)||slots.has(number)) throw Error('枠番号が不正です。');
   slots.add(number);
   const a=cells[2].querySelector('a[title]');
   if(!a && cells[2].textContent.trim()==='空き') continue;
   const name=a?.getAttribute('title')?.trim();
   const q=cells[5].textContent.trim().replace(/,/g,'');
   if(!name || !/^\d+$/.test(q)||!Number.isSafeInteger(Number(q))) throw Error('アイテム名または個数を取得できません。');
   items.push({slot:Number(number),name,quantity:Number(q),category:cells[3].textContent.trim(),transfer:cells[4].textContent.trim(),rental:cells[0].textContent.trim()});
  }
  return {account,page:Number(pageText),items,capacity:128,capturedAt:new Date().toISOString()};
 }
};
