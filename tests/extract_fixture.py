from html.parser import HTMLParser
from pathlib import Path
import json,sys
class Parser(HTMLParser):
 def __init__(self):
  super().__init__();self.root={'tag':'root','attrs':{},'children':[]};self.stack=[self.root]
 def handle_starttag(self,t,a):
  n={'tag':t,'attrs':dict(a),'children':[]};self.stack[-1]['children'].append(n)
  if t not in ['meta','link','img','input','br','col','area','param','hr']:self.stack.append(n)
 def handle_endtag(self,t):
  for i in range(len(self.stack)-1,0,-1):
   if self.stack[i]['tag']==t:self.stack=self.stack[:i];break
 def handle_data(self,d):self.stack[-1]['children'].append(d)
p=Parser();p.feed(Path(sys.argv[1]).read_bytes().decode('utf-8'));print(json.dumps(p.root,ensure_ascii=False))
