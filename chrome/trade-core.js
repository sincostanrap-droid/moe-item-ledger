/* Standalone tweet template helpers. No account identifiers enter the output. */
globalThis.MoeTrade = {
 limit:280,
 // Conservative estimate: ASCII=1, all other code points=2. Emoji sequences
 // may be overcounted. URLs are never counted as fewer than 23 characters.
 weight(text){
  const normalized=String(text).normalize('NFC').replace(/\r\n?/g,'\n');
  const raw=s=>Array.from(s).reduce((n,c)=>n+(c.codePointAt(0)<=0x7f?1:2),0);
  let n=0,last=0;
  const urls=/(?:https?:\/\/|www\.)[^\s]+|(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s]*)?/gi;
  for(const m of normalized.matchAll(urls)){n+=raw(normalized.slice(last,m.index))+Math.max(23,raw(m[0]));last=m.index+m[0].length;}
  return n+raw(normalized.slice(last));
 },
 validate(items){
  if(!items.length)throw Error('アイテムを選択してください。');
  for(const item of items){
   if(!item.name.trim())throw Error('アイテム名が空です。');
   if(!Number.isSafeInteger(item.quantity)||item.quantity<1||item.quantity>item.available)throw Error(`${item.name}：販売個数は1〜${item.available}個で入力してください。`);
  }
 },
 text(items,comment=''){
  this.validate(items);
  return ['【売り】',...items.map(i=>`${i.name} ×${i.quantity}：${i.price.trim()||'価格未入力'}`),comment.trim(),'#masterofepic'].filter(Boolean).join('\n');
 },
 caption(comment=''){return ['【売り】品名・個数・価格は画像をご覧ください。',comment.trim(),'#masterofepic'].filter(Boolean).join('\n');},
 wrap(text,measure,width){
  const out=[];
  for(const paragraph of String(text).split(/\r\n?|\n/)){
   let line='';
   const parts=typeof Intl.Segmenter==='function'?[...new Intl.Segmenter('ja',{granularity:'grapheme'}).segment(paragraph)].map(s=>s.segment):Array.from(paragraph);
   for(const c of parts){if(line&&measure(line+c)>width){out.push(line);line=c;}else line+=c;}
   out.push(line);
  }
  return out.length?out:[''];
 },
 layout(items,measure){
  const widths=[660,120,360],padding=18,lineHeight=36;
  const rows=items.map(item=>{
   const cells=[item.name,String(item.quantity),item.price.trim()||'価格未入力'].map((v,i)=>this.wrap(v,measure,widths[i]-padding*2));
   return {cells,height:Math.max(...cells.map(c=>c.length))*lineHeight+padding*2};
  });
  // Repeat the table header for each block to retain legibility in one PNG.
  const blocks=[[]];let height=0;
  for(const row of rows){
   if(row.height>14000)throw Error('入力が長すぎて画像に収まりません。価格欄を短くしてください。');
   if(height+row.height>14000){blocks.push([]);height=0;}
   blocks.at(-1).push(row);height+=row.height;
  }
  const blockWidth=widths.reduce((a,b)=>a+b,0),width=blocks.length*(blockWidth+24)+24;
  const imageHeight=Math.max(...blocks.map(b=>b.reduce((n,r)=>n+r.height,0)))+200;
  if(width>16000||width*imageHeight>64000000)throw Error('画像が大きすぎます。選択する品数を減らしてください。');
  return {widths,padding,lineHeight,blocks,blockWidth,width,height:imageHeight};
 }
};
