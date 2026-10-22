/* ShamirSharing CipherLab - MIT (c) 2026 ipusiron. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const stored = key => { try { return localStorage.getItem('shamir-sharing-cipherlab.' + key); } catch (_) { return null; } };
  let language = stored('language') === 'en' ? 'en' : 'ja';
  let theme = stored('theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const t = key => ShamirMessages[language][key] || key;
  const tabs = ['linear', 'hand', 'bytes', 'pitfalls'];
  let active = 'linear';
  function save() { try { localStorage.setItem('shamir-sharing-cipherlab.language', language); localStorage.setItem('shamir-sharing-cipherlab.theme', theme); } catch (_) { /* storage can be unavailable */ } }
  function render() {
    document.documentElement.lang = language;
    document.documentElement.dataset.theme = theme;
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-label]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.label)); });
    $('language').textContent = language === 'ja' ? 'EN' : '日';
    for (const name of tabs) {
      const selected = name === active;
      $('tab-' + name).setAttribute('aria-selected', String(selected));
      $('tab-' + name).tabIndex = selected ? 0 : -1;
      $('panel-' + name).hidden = !selected;
    }
    window.renderShamirIntro?.();
    window.renderShamirHand?.();
    window.renderShamirExtra?.();
  }
  tabs.forEach((name, index) => {
    const tab = $('tab-' + name);
    tab.addEventListener('click', () => { active = name; render(); });
    tab.addEventListener('keydown', event => {
      const move = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
      if (!move && event.key !== 'Home' && event.key !== 'End') return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + move + tabs.length) % tabs.length;
      active = tabs[next]; render(); $('tab-' + active).focus();
    });
  });
  $('theme').addEventListener('click', () => { theme = theme === 'dark' ? 'light' : 'dark'; save(); render(); });
  $('language').addEventListener('click', () => { language = language === 'ja' ? 'en' : 'ja'; save(); render(); });
  $('help').addEventListener('click', () => { $('help-dialog').showModal(); document.querySelector('.help-body').scrollTop=0; });
  $('close-help').addEventListener('click', () => $('help-dialog').close());
  render();
}());

/* The hand tab shares one field model across both recovery stages and the optional experiments. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id), G = ShamirGF;
  const s = { p:13, k:3, n:5, c:[5,4,2], fewer:[1,2], selected:[1,2,3], candidate:5, all:false, leading:false,
    activeX:null, moved:'', realY:{1:11,2:8,3:9}, realZero:5 };
  const t = key => ShamirMessages[document.documentElement.lang][key] || key;
  const E = (tag, value, cls) => { const el=document.createElement(tag); if(value!==undefined) el.textContent=String(value); if(cls) el.className=cls; return el; };
  const S = (tag, attrs) => { const el=document.createElementNS('http://www.w3.org/2000/svg',tag); for(const [k,v] of Object.entries(attrs)) el.setAttribute(k,String(v)); return el; };
  const shares = () => G.splitP(s.c,s.n,s.p), points = () => s.selected.map(x=>shares()[x-1]), fewPoints = () => s.fewer.map(x=>shares()[x-1]);
  const format = (key,values) => t(key).replace(/\{([a-z]+)\}/gi,(_,name)=>String(values[name]));
  const initialEnough = () => [...s.fewer,...Array.from({length:s.n},(_,i)=>i+1).filter(x=>!s.fewer.includes(x)).slice(0,Math.max(0,s.k-s.fewer.length))].sort((a,b)=>a-b);
  const resetSelections = () => { s.fewer=Array.from({length:Math.max(0,s.k-1)},(_,i)=>i+1);s.selected=initialEnough();s.candidate=s.c[0];s.all=false;s.leading=false; };
  function choices(id, from, to, value) { const el=$(id); el.replaceChildren(...Array.from({length:to-from+1},(_,i)=>{const o=E('option',from+i);o.value=String(from+i);o.selected=from+i===value;return o;})); }
  function controls() {
    $('prime').value=String(s.p); choices('threshold',1,s.n,s.k); choices('share-count',s.k,Math.min(s.p-1,8),s.n);
    $('secret').max=String(s.p-1); $('secret').value=String(s.c[0]); $('coefficient-inputs').replaceChildren();
    for(let i=1;i<s.k;i++){const label=E('label'),input=E('input'); input.type='number';input.min='0';input.max=String(s.p-1);input.value=String(s.c[i]);input.dataset.coefficient=String(i);label.append(E('span',`a${'₀₁₂₃₄₅₆₇₈₉'[i]}`),input);$('coefficient-inputs').append(label);}
  }
  function resetReal(){ s.realY={};for(let x=1;x<=s.n;x++)s.realY[x]=s.c.reduce((sum,c,i)=>sum+c*x**i,0);s.realZero=s.c[0]; }
  function table(id, rows) { const body=$(id);body.replaceChildren();for(const cells of rows){const row=E('tr');for(const value of cells)row.append(E('td',value));body.append(row);} }
  function renderTables(){
    $('polynomial').textContent=`f(x) = ${s.c.map((c,i)=>i?` + ${c}x${i>1?`^${i}`:''}`:String(c)).join('')} (mod ${s.p})`;
    table('distribution-table',shares().map(([x,y])=>{const terms=s.c.map((c,i)=>c*x**i);return [x,terms.join(' + '),terms.reduce((a,b)=>a+b,0),y];}));
    $('share-data').replaceChildren(...shares().map(([x,y])=>{
      const expression=s.c.map((c,i)=>i?`${c}×${x}${i>1?`^${i}`:''}`:String(c)).join(' + ');
      const vi=`v${'₀₁₂₃₄₅₆₇₈₉'[x]}`;
      const line=E('p');
      line.append(E('strong',t('shareData').replace('{i}',x)),E('span',` ${vi} = f(${x}) = ${y}`),E('br'),
        E('span',`${t('sharePair')} (${x},${vi}) = (${x},f(${x})) = (${x},(${expression}) mod ${s.p}) = (${x},${y})`));
      return line;
    }));
    table('integer-table',Array.from({length:s.n},(_,i)=>{const x=i+1,y=s.c.reduce((a,c,j)=>a+c*x**j,0);return [x,y,y%x];}));
    const x2=s.c.reduce((a,c,i)=>a+c*2**i,0),x3=s.c.reduce((a,c,i)=>a+c*3**i,0);
    $('integer-result').textContent=`${t('integerExample')} x=2: ${x2} mod 2=${x2%2}; x=3: ${x3} mod 3=${x3%3}.`;
    const pick=(x,y,pressed,attribute)=>{const b=E('button',pressed?`#${x} (${x},${y})`:`#${x}`);b.type='button';b.dataset[attribute]=String(x);b.setAttribute('aria-pressed',String(pressed));return b;};
    $('hand-few-picks').replaceChildren(...shares().map(([x,y])=>pick(x,y,s.fewer.includes(x),'fewPick')));
    $('share-picks').replaceChildren(...shares().map(([x,y])=>pick(x,y,s.selected.includes(x),'pick')));
    const picked=xs=>xs.length?xs.map(x=>`#${x} (${x},${shares()[x-1][1]})`).join('、'):'なし';
    $('hand-few-selected').textContent=format('handFewSelected',{shares:picked(s.fewer),count:s.fewer.length});
    $('hand-enough-selected').textContent=format('handEnoughSelected',{shares:picked(s.selected),count:s.selected.length});
    $('hand-few-intro').textContent=format('handFewIntro',{k:s.k});
    $('hand-enough-intro').textContent=format('handEnoughIntro',{k:s.k});
    const enough=s.selected.length===s.k;
    $('reconstruction-section').hidden=!enough;$('candidate-section').hidden=s.k===1||s.fewer.length!==s.k-1;
    if(enough){const result=G.lagrangeP(points(),s.k,s.p);table('reconstruction-table',result.terms.map(r=>[r.x,r.y,r.numerator,r.denominator,r.inverse,r.lambda,r.term]));
      $('reconstruction-result').textContent=`${result.terms.map(r=>r.term).join(' + ')} ≡ ${result.secret} (mod ${s.p})`;
    }
    if(!$('candidate-section').hidden){const visible=G.candidatesP(fewPoints(),s.k,s.p).filter(r=>!s.leading||!r.leadingZero);
      if(!visible.some(r=>r.secret===s.candidate))s.candidate=visible[0].secret;
      $('candidate-result').textContent=`${visible.length}/${s.p} ${t('candidateCount')} · ${t('candidateSecret')}=${s.candidate}`;
      $('all-candidates').setAttribute('aria-pressed',String(s.all));$('leading-only').checked=s.leading;
    }
    const fewShares=s.selected.length>0&&s.selected.length<s.k-1;
    $('tweak-result').textContent=s.k===1?t('kOne'):[s.moved,fewShares?t('fewSharesExample'):''].filter(Boolean).join(' ');
  }
  function recoveryGraph(id,selected,candidates,activeSecret){
    const svg=$(id),left=54,right=490,top=24,bottom=270,scaleX=(right-left)/s.n,scaleY=(bottom-top)/(s.p-1);
    const X=x=>left+x*scaleX,Y=y=>bottom-y*scaleY;
    svg.replaceChildren(S('line',{x1:left,y1:top,x2:left,y2:bottom,class:'hand-graph-axis'}),
      S('line',{x1:left,y1:bottom,x2:right,y2:bottom,class:'hand-graph-axis'}));
    for(const [x,label] of [[0,'x=0'],[s.n,`x=${s.n}`]]){
      const text=S('text',{x:X(x),y:295,'text-anchor':'middle',class:'hand-graph-label'});text.textContent=label;svg.append(text);
    }
    for(const item of candidates){
      const values=Array.from({length:s.n+1},(_,x)=>G.evalP(item.coefficients,x,s.p));
      const data=values.map((y,x)=>`${x?'L':'M'}${X(x).toFixed(2)},${Y(y).toFixed(2)}`).join(' ');
      svg.append(S('path',{d:data,class:`hand-graph-curve${item.secret===activeSecret?' hand-graph-active':''}`}));
    }
    for(const x of selected){
      const y=shares()[x-1][1];
      svg.append(S('circle',{cx:X(x),cy:Y(y),r:5,class:'hand-graph-share'}));
      const label=S('text',{x:Math.min(right-35,X(x)+8),y:Math.max(top+12,Y(y)-8),class:'hand-graph-label hand-graph-point-label'});
      label.textContent=`(${x},${y})`;svg.append(label);
    }
    if(activeSecret!==null){
      svg.append(S('circle',{cx:X(0),cy:Y(activeSecret),r:6,class:'hand-graph-secret'}));
      const label=S('text',{x:5,y:Y(activeSecret)+4,class:'hand-graph-label hand-graph-secret-label'});
      label.textContent=`s=${activeSecret}`;svg.append(label);
    }
  }
  function renderRecoveryGraphs(){
    if(s.fewer.length===s.k-1){
      const all=(s.k===1?Array.from({length:s.p},(_,secret)=>({secret,coefficients:[secret],leadingZero:false})):G.candidatesP(fewPoints(),s.k,s.p)).filter(r=>!s.leading||!r.leadingZero);
      const sample=[0,Math.floor(s.p/2),s.p-1,s.candidate];
      const shown=s.all?all:all.filter(r=>sample.includes(r.secret));
      recoveryGraph('hand-few-graph',s.fewer,shown,s.candidate);
      $('hand-few-graph-caption').textContent=format('handFewGraphCaption',{count:s.fewer.length});
    }else{
      recoveryGraph('hand-few-graph',s.fewer,[],null);
      $('hand-few-graph-caption').textContent=format('handFewPending',{missing:s.k-1-s.fewer.length});
    }
    if(s.selected.length===s.k){
      const coefficients=G.polynomialP(points(),s.p),secret=coefficients[0];
      recoveryGraph('hand-enough-graph',s.selected,[{coefficients,secret}],secret);
      $('hand-enough-graph-caption').textContent=format('handEnoughGraphCaption',{max:s.n,secret});
    }else{
      recoveryGraph('hand-enough-graph',s.selected,[],null);
      $('hand-enough-graph-caption').textContent=format('handEnoughPending',{missing:s.k-s.selected.length});
    }
  }
  function grid(){
    const p=s.p,d=20,svg=$('field-grid'),side=p*d;svg.replaceChildren();svg.setAttribute('width',side);svg.setAttribute('height',side);svg.setAttribute('viewBox',`0 0 ${side} ${side}`);
    $('grid-range').textContent=`x, y = 0…${p-1} (mod ${p}); 1 ${t('cell')} = 20 px`;
    for(let x=0;x<p;x++)for(let y=0;y<p;y++)svg.append(S('rect',{x:d*x,y:d*(p-1-y),width:d,height:d,class:'field-cell','data-cell-x':x,'data-cell-y':y}));
    let curves=[];
    const example=s.selected.length>0&&s.selected.length<s.k-1;
    if(s.selected.length===s.k){const c=G.polynomialP(points(),p);curves=[{secret:c[0],values:Array.from({length:p},(_,x)=>G.evalP(c,x,p))}];}
    else if(s.k>1&&s.selected.length===s.k-1){const all=G.candidatesP(points(),s.k,p).filter(r=>!s.leading||!r.leadingZero);curves=s.all?all:all.filter(r=>r.secret===s.candidate);}
    else if(example)curves=[{secret:s.c[0],values:Array.from({length:p},(_,x)=>G.evalP(s.c,x,p))}];
    for(const curve of curves)for(let x=0;x<p;x++)svg.append(S('circle',{cx:d*(x+.5),cy:d*(p-curve.values[x]-.5),r:example?2.5:curve.secret===s.candidate||s.selected.length===s.k?4:2.5,class:example?'field-ghost':curve.secret===s.candidate||s.selected.length===s.k?'field-value':'field-ghost'}));
    for(const x of s.selected){const y=shares()[x-1][1];svg.append(S('circle',{cx:d*(x+.5),cy:d*(p-y-.5),r:8,class:'field-share','data-share-x':x,tabindex:0,role:'button','aria-label':`${t('sharePoint')} ${x}, ${y}`}));}
    if(s.k>1&&s.selected.length===s.k-1)svg.append(S('circle',{cx:d*.5,cy:d*(p-s.candidate-.5),r:8,class:'field-secret','data-share-x':0,tabindex:0,role:'button','aria-label':`${t('candidateSecret')} ${s.candidate}`}));
  }
  function realAt(pts,x){return pts.reduce((sum,[xi,yi],i)=>sum+yi*pts.reduce((v,[xj],j)=>i===j?v:v*(x-xj)/(xi-xj),1),0);}
  function realRange(){return Math.max(40,...s.selected.map(x=>s.realY[x]+5),s.realZero+5);}
  function real(){const svg=$('real-graph');svg.replaceChildren();const range=realRange(),X=x=>28+x*550/(s.n+1),Y=y=>280-y*250/range,chosen=s.selected.map(x=>[x,s.realY[x]]);
    const pts=chosen.length===s.k?chosen:[[0,s.realZero],...chosen];
    if(pts.length>=2){const data=Array.from({length:181},(_,i)=>{const x=i*(s.n+1)/180;return `${i?'L':'M'}${X(x).toFixed(1)},${Y(realAt(pts,x)).toFixed(1)}`;}).join(' ');svg.append(S('path',{d:data,class:'real-curve'}));}
    svg.append(S('line',{x1:X(0),y1:20,x2:X(0),y2:280,class:'real-axis'}),S('line',{x1:X(0),y1:Y(0),x2:X(s.n),y2:Y(0),class:'real-axis'}));
    for(const [x,y] of chosen)svg.append(S('circle',{cx:X(x),cy:Y(y),r:10,class:'real-point','data-real-x':x,tabindex:0,role:'button','aria-label':`${t('sharePoint')} ${x}, ${y}`}));
    const intercept=pts.length>=2?realAt(pts,0):s.realZero;
    svg.append(S('circle',{cx:X(0),cy:Y(intercept),r:9,class:'real-secret','data-real-x':0,tabindex:chosen.length===s.k?-1:0,role:'button','aria-label':`${t('candidateSecret')} ${intercept.toFixed(2)}`}));
    $('real-result').textContent=`${t('realIntercept')}: ${intercept.toFixed(2)}. ${t('realPoints')}: ${chosen.map(([x,y])=>`(${x},${y})`).join(' ')}`;
    $('real-picks').replaceChildren(...chosen.map(([x,y])=>E('span',`(${x}, ${y})`,'point-chip')));
  }
  function render(){renderTables();renderRecoveryGraphs();grid();real();}
  function move(x,y){if(x===0){s.candidate=y;render();return;}
    const selected=points(),before=shares()[x-1][1],chosen=selected.map(pt=>pt[0]===x?[x,y]:pt);
    if(s.selected.length===s.k){const lambda=G.lagrangeP(selected,s.k,s.p).terms.find(r=>r.x===x).lambda,old=s.c[0],delta=G.mod(y-before,s.p);
      s.c=G.polynomialP(chosen,s.p);s.candidate=s.c[0];s.moved=`Δ=${delta}, λ${x}(0)=${lambda}, Δs=${G.mod(lambda*delta,s.p)}; ${old}→${s.c[0]} (mod ${s.p})`;
    }else{
      const base=s.candidate===s.c[0]?s.c:G.polynomialP([[0,s.candidate],...selected],s.p);
      const delta=G.mod(y-before,s.p);
      const correction=G.polynomialP([[0,0],...selected.map(([xi])=>[xi,xi===x?delta:0])],s.p);
      s.c=Array.from({length:s.k},(_,i)=>G.mod((base[i]||0)+(correction[i]||0),s.p));
      s.moved=`${t('candidateSecret')}: ${s.candidate}`;
    }
    resetReal();controls();render();
  }
  window.renderShamirHand=render;
  $('prime').addEventListener('change',()=>{s.p=Number($('prime').value);s.n=Math.min(s.n,s.p-1);s.k=Math.min(s.k,s.n);s.c=s.c.slice(0,s.k).map(v=>G.mod(v,s.p));resetSelections();s.moved='';resetReal();controls();render();});
  $('threshold').addEventListener('change',()=>{s.k=Number($('threshold').value);s.c=Array.from({length:s.k},(_,i)=>s.c[i]||0);resetSelections();s.moved='';resetReal();controls();render();});
  $('share-count').addEventListener('change',()=>{s.n=Number($('share-count').value);resetSelections();resetReal();controls();render();});
  $('secret').addEventListener('change',()=>{const v=Number($('secret').value);if(!Number.isInteger(v)||v<0||v>=s.p){$('hand-status').textContent=t('invalidInput');$('secret').value=String(s.c[0]);return;}s.c[0]=v;$('hand-status').textContent='';resetReal();render();});
  $('coefficient-inputs').addEventListener('change',e=>{const i=Number(e.target.dataset.coefficient),v=Number(e.target.value);if(!i)return;if(!Number.isInteger(v)||v<0||v>=s.p){$('hand-status').textContent=t('invalidInput');e.target.value=String(s.c[i]);return;}s.c[i]=v;$('hand-status').textContent='';resetReal();render();});
  $('random-coefficients').addEventListener('click',()=>{const limit=256-256%s.p;
    for(let i=1;i<s.k;i++){let value;do{const b=new Uint8Array(1);crypto.getRandomValues(b);value=b[0];}while(value>=limit);s.c[i]=value%s.p;}
    s.moved='';resetReal();controls();render();});
  $('reset-hand').addEventListener('click',()=>{Object.assign(s,{p:13,k:3,n:5,c:[5,4,2],fewer:[1,2],selected:[1,2,3],candidate:5,all:false,leading:false,moved:''});resetReal();controls();render();});
  $('hand-few-picks').addEventListener('click',e=>{const b=e.target.closest('[data-few-pick]');if(!b)return;const x=Number(b.dataset.fewPick);s.fewer=s.fewer.includes(x)?s.fewer.filter(v=>v!==x):s.fewer.length<s.k-1?[...s.fewer,x].sort((a,b)=>a-b):s.fewer;s.selected=initialEnough();s.candidate=s.c[0];s.all=false;s.moved='';render();});
  $('share-picks').addEventListener('click',e=>{const b=e.target.closest('[data-pick]');if(!b)return;const x=Number(b.dataset.pick);s.selected=s.selected.includes(x)?s.selected.filter(v=>v!==x):s.selected.length<s.k?[...s.selected,x].sort((a,b)=>a-b):s.selected;if(s.selected.length<s.k)s.candidate=s.c[0];s.moved='';render();});
  $('select-k').addEventListener('click',()=>{s.selected=Array.from({length:s.k},(_,i)=>i+1);render();});
  $('select-kminus').addEventListener('click',()=>{s.selected=Array.from({length:Math.max(0,s.k-1)},(_,i)=>i+1);s.candidate=s.c[0];render();});
  function nextCandidate(direction){if(s.fewer.length!==s.k-1)return;const list=G.candidatesP(fewPoints(),s.k,s.p).filter(r=>!s.leading||!r.leadingZero).map(r=>r.secret);s.candidate=list[(list.indexOf(s.candidate)+direction+list.length)%list.length];render();}
  $('previous-candidate').addEventListener('click',()=>nextCandidate(-1));$('next-candidate').addEventListener('click',()=>nextCandidate(1));
  $('all-candidates').addEventListener('click',()=>{s.all=!s.all;render();});$('leading-only').addEventListener('change',()=>{s.leading=$('leading-only').checked;render();});
  const field=$('field-grid');
  const coordinateTooltip=$('grid-coordinate-tooltip');
  const hideCoordinates=()=>{coordinateTooltip.hidden=true;};
  for(const svg of [field]){
    svg.addEventListener('pointermove',event=>{
      if(event.pointerType==='touch'){hideCoordinates();return;}
      const box=svg.getBoundingClientRect(),size=svg===field?s.p:13;
      const x=Math.floor((event.clientX-box.left)*size/box.width);
      const y=size-1-Math.floor((event.clientY-box.top)*size/box.height);
      if(x<0||x>=size||y<0||y>=size){hideCoordinates();return;}
      coordinateTooltip.textContent=`(${x}, ${y})`;
      coordinateTooltip.hidden=false;
      coordinateTooltip.style.left=`${Math.max(8,Math.min(event.clientX+12,innerWidth-coordinateTooltip.offsetWidth-8))}px`;
      coordinateTooltip.style.top=`${event.clientY+14+coordinateTooltip.offsetHeight<innerHeight?event.clientY+14:event.clientY-coordinateTooltip.offsetHeight-14}px`;
    });
    svg.addEventListener('pointerleave',hideCoordinates);
    svg.addEventListener('pointercancel',hideCoordinates);
  }
  window.addEventListener('wheel',hideCoordinates,{passive:true});
  field.addEventListener('click',e=>{const point=e.target.closest('[data-share-x]'),cell=e.target.closest('[data-cell-x]');if(point){s.activeX=Number(point.dataset.shareX);return;}if(cell&&s.activeX!==null&&Number(cell.dataset.cellX)===s.activeX)move(s.activeX,Number(cell.dataset.cellY));});
  field.addEventListener('pointerdown',e=>{const point=e.target.closest('[data-share-x]');if(point){s.gridDrag=Number(point.dataset.shareX);s.activeX=s.gridDrag;point.focus();field.setPointerCapture(e.pointerId);}});
  field.addEventListener('pointerup',e=>{if(s.gridDrag===undefined)return;const x=s.gridDrag;s.gridDrag=undefined;const r=field.getBoundingClientRect(),d=r.width/s.p,col=Math.floor((e.clientX-r.left)/d),y=s.p-1-Math.floor((e.clientY-r.top)/d);
    const old=x===0?s.candidate:shares()[x-1][1];
    if(col===x&&y>=0&&y<s.p&&y!==old)move(x,y);
    field.querySelector(`[data-share-x="${x}"]`)?.focus();
  });
  field.addEventListener('pointercancel',()=>{s.gridDrag=undefined;});
  field.addEventListener('keydown',e=>{const point=e.target.closest('[data-share-x]');if(!point||!['ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const x=Number(point.dataset.shareX),old=x===0?s.candidate:shares()[x-1][1];move(x,G.mod(old+(e.key==='ArrowUp'?1:-1),s.p));field.querySelector(`[data-share-x="${x}"]`)?.focus();});
  const realSvg=$('real-graph');
  realSvg.addEventListener('pointerdown',e=>{const point=e.target.closest('[data-real-x]');if(point&&point.getAttribute('tabindex')!=='-1'){s.realDrag=Number(point.dataset.realX);s.realActive=s.realDrag;realSvg.setPointerCapture(e.pointerId);}});
  realSvg.addEventListener('pointerup',e=>{if(s.realDrag===undefined)return;const x=s.realDrag;s.realDrag=undefined;const r=realSvg.getBoundingClientRect(),range=realRange(),y=Math.max(0,Math.min(range,Math.round((280-(e.clientY-r.top)*300/r.height)*range/250)));if(x===0)s.realZero=y;else s.realY[x]=y;real();});
  realSvg.addEventListener('click',e=>{const point=e.target.closest('[data-real-x]');
    if(point){s.realActive=Number(point.dataset.realX);return;}
    if(s.realActive===undefined)return;
    const r=realSvg.getBoundingClientRect(),expectedX=r.left+(28+s.realActive*550/(s.n+1))*r.width/600;
    if(Math.abs(e.clientX-expectedX)>24*r.width/600)return;
    const y=Math.max(0,Math.min(realRange(),Math.round((280-(e.clientY-r.top)*300/r.height)*realRange()/250)));
    if(s.realActive===0)s.realZero=y;else s.realY[s.realActive]=y;real();
  });
  realSvg.addEventListener('keydown',e=>{const point=e.target.closest('[data-real-x]');if(!point||!['ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const x=Number(point.dataset.realX),delta=e.key==='ArrowUp'?1:-1;if(x===0)s.realZero=Math.max(0,Math.min(realRange(),s.realZero+delta));else s.realY[x]=Math.max(0,Math.min(realRange(),s.realY[x]+delta));real();realSvg.querySelector(`[data-real-x="${x}"]`)?.focus();});
  resetReal();controls();render();
}());

/* Bytes, fixed pitfall demos, and the reading section. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id), G = ShamirGF, P = ShamirPitfalls;
  const t = key => ShamirMessages[document.documentElement.lang][key] || key;
  const E = (tag, value, cls) => { const el=document.createElement(tag);if(value!==undefined)el.textContent=String(value);if(cls)el.className=cls;return el; };
  const state = { message:'MEET AT DAWN', k:3, n:5, shares:[], coefficients:[], column:0, selected:[1,2,3], error:'', composing:false };
  const toHex = value => value.toString(16).toUpperCase().padStart(2,'0');
  const format = (key,values) => t(key).replace(/\{([a-z]+)\}/gi,(_,name)=>String(values[name]));
  function choices(id, from, to, value) { $(id).replaceChildren(...Array.from({length:to-from+1},(_,i)=>{const o=E('option',from+i);o.value=String(from+i);o.selected=from+i===value;return o;})); }
  function table(parent, headings, rows) { const el=E('table'),head=E('thead'),top=E('tr'),body=E('tbody');
    headings.forEach(value=>top.append(E('th',value)));head.append(top);
    rows.forEach(cells=>{const row=E('tr');cells.forEach(value=>row.append(E('td',value)));body.append(row);});el.append(head,body);parent.replaceChildren(el); }
  function split() {
    state.message=$('byte-message').value;
    const bytes=new TextEncoder().encode(state.message);
    state.error=!bytes.length?'byteEmpty':bytes.length>32?'byteTooLong':'';
    if(state.error){state.shares=[];state.coefficients=[];renderBytes();return;}
    state.coefficients=[];
    try { state.shares=G.split256(bytes,state.k,state.n,count=>{const out=new Uint8Array(count);crypto.getRandomValues(out);state.coefficients.push(out);return out;}); }
    catch (_) { state.error='byteRandomError';state.shares=[];state.coefficients=[]; }
    state.selected=Array.from({length:state.k},(_,i)=>i+1);renderBytes();
  }
  function readable(bytes) {
    try { const decoded=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
      return decoded.replace(/[\u0000-\u001f\u007f-\u009f]/g,char=>`\\x${char.charCodeAt(0).toString(16).toUpperCase().padStart(2,'0')}`);
    } catch (_) { return t('byteInvalidUtf8'); }
  }
  function renderBytes(){
    $('byte-error').textContent=state.error?t(state.error):'';
    $('byte-calculation-intro').textContent=format('byteCalculationIntro',{k:state.k,n:state.n});
    if(!state.shares.length){$('byte-table').replaceChildren();$('byte-secret-hex').textContent='';$('byte-column').replaceChildren();$('byte-formula').textContent='';$('byte-calculation').replaceChildren();$('byte-picks').replaceChildren();$('byte-weights').replaceChildren();$('byte-restored-hex').textContent='';$('byte-restored-text').textContent='';return;}
    const secret=new TextEncoder().encode(state.message),head=['x',...Array.from({length:secret.length},(_,i)=>String(i))];
    const rows=[[t('byteSecret'),...Array.from(secret,toHex)],...state.shares.map(share=>[`#${share.x}`,...Array.from(share.y,toHex)])];
    table($('byte-table'),head,rows);
    $('byte-secret-hex').textContent=`${t('byteSecret')}: ${P.hex(secret)} (${secret.length} bytes)`;
    state.column=Math.min(state.column,secret.length-1);
    $('byte-column').replaceChildren(...Array.from(secret,(_,index)=>{const option=E('option',`${index}: ${toHex(secret[index])}`);option.value=String(index);option.selected=index===state.column;return option;}));
    renderByteCalculation(secret);
    $('byte-picks').replaceChildren(...state.shares.map(share=>{const button=E('button',`#${share.x}`);button.type='button';button.dataset.bytePick=String(share.x);button.setAttribute('aria-pressed',String(state.selected.includes(share.x)));return button;}));
    if(state.selected.length<state.k){$('byte-weights').replaceChildren();$('byte-restored-hex').textContent=`${t('needShares')}: ${state.k-state.selected.length}`;$('byte-restored-text').textContent='';return;}
    const chosen=state.selected.map(x=>state.shares[x-1]),result=G.combine256(chosen,state.k);
    table($('byte-weights'),[t('byteShare'),t('byteWeight')],result.terms.map(row=>[`#${row.x}`,toHex(row.lambda)]));
    $('byte-restored-hex').textContent=`${t('restoredHex')}: ${P.hex(result.out)}`;
    $('byte-restored-text').textContent=`${t('restoredText')}: ${readable(result.out)}`;
  }
  function renderByteCalculation(secret){
    const index=state.column,sub=String(index).replace(/[0-9]/g,d=>'₀₁₂₃₄₅₆₇₈₉'[Number(d)]),sup='⁰¹²³⁴⁵⁶⁷⁸⁹';
    const coefficients=[secret[index],...state.coefficients[index]];
    $('byte-formula').textContent=`F${sub}(X) = ${coefficients.map((value,degree)=>`{${toHex(value)}}${degree?`·X${degree===1?'':sup[degree]}`:''}`).join(' ⊕ ')}  (GF(2⁸))`;
    const headings=[t('byteCalcShare'),'X',t('byteCalcResult'),t('byteCalcSecret'),...coefficients.slice(1).map((_,degree)=>`a${'₀₁₂₃₄₅₆₇₈₉'[degree+1]}·X${degree?'⁰¹²³⁴⁵⁶⁷⁸⁹'[degree+1]:''}`)];
    const rows=state.shares.map(share=>{
      let power=1,value=coefficients[0];
      const terms=coefficients.slice(1).map(coefficient=>{power=G.mul256(power,share.x);const product=G.mul256(coefficient,power);value^=product;return `${toHex(coefficient)}×${toHex(power)}=${toHex(product)}`;});
      return [`#${share.x}`,toHex(share.x),toHex(value),toHex(coefficients[0]),...terms];
    });
    table($('byte-calculation'),headings,rows);
  }
  function multiplication(){let a=0x57,b=0x13,result=0;const rows=[];
    for(let step=0;step<8;step++){const added=b&1?a:0;result^=added;const carry=a>>>7;
      const next=((a<<1)&255)^(carry?0x1b:0);rows.push([step+1,toHex(a),toHex(b),toHex(added),toHex(next)]);a=next;b>>>=1;}
    table($('multiply-steps'),[t('multiplyStep'),t('multiplyA'),t('multiplyB'),t('multiplyAdd'),t('multiplyReduce')],rows);
    $('multiply-log').textContent=`${t('multiplyLog')} log₀₃(57)=${G.LOG[0x57]}, log₀₃(13)=${G.LOG[0x13]}, exp₀₃[${G.LOG[0x57]+G.LOG[0x13]}]={${toHex(G.mul256Table(0x57,0x13))}}. ${t('sum')}: {${toHex(result)}}.`;
  }
  const demo=P.demo();
  function demoCard(id, entries){const holder=$(id);holder.replaceChildren();
    for(const [label,value] of entries){const item=E('div',undefined,'demo-step');item.append(E('strong',t(label)),E('p',value));holder.append(item);}
  }
  function renderPitfalls(){const layer=$('tamper-layer').value;
    const original=demo.originalCrcs[1].toString(16).toUpperCase().padStart(8,'0'),changed=demo.changedCrc.toString(16).toUpperCase().padStart(8,'0');
    const guarded=layer==='none'?t('tamperNone'):layer==='crc'?`${t('tamperCrc')} ${original} → ${changed}`:`${t('tamperDigest')} ${P.hex(demo.reconstructed.slice(-4))} ≠ ${P.hex(P.fingerprint(demo.reconstructed.slice(0,-4)))}`;
    demoCard('tamper-output',[['what',`${t('tamperWhat')} E=${P.hex(demo.error)}; λ₂=${toHex(G.combine256(demo.shares.slice(0,3),3).terms[1].lambda)}`],
      ['unsafe',`${t('tamperUnsafe')} ${P.hex(demo.changed.y)}; {2,4,5} → ${P.hex(demo.reconstructed245.slice(0,12))}`],['guarded',guarded],['lesson',t('tamperLesson')]]);
    demoCard('zero-output',[['what',t('zeroWhat')],['unsafe',t('zeroUnsafe')],['guarded',t('zeroGuard')],['lesson',t('zeroLesson')]]);
    demoCard('short-output',[['what',t('shortWhat')],['unsafe',`${t('shortUnsafe')} ${P.hex(demo.missing)}`],['guarded',t('shortGuard')],['lesson',t('shortLesson')]]);
  }
  const sources=[
    [['primary','https://web.mit.edu/6.857/OldStuff/Fall03/ref/Shamir-HowToShareASecret.pdf'],['primary','https://pages.cs.wisc.edu/~cs812-1/Blakley1979.pdf']],
    [['secondary','https://cacr.uwaterloo.ca/hac/about/chap12.pdf']],
    [['primary','https://web.mit.edu/6.857/OldStuff/Fall03/ref/Shamir-HowToShareASecret.pdf'],['secondary','https://cacr.uwaterloo.ca/hac/about/chap12.pdf']],
    [['primary','https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.197-upd1.pdf'],['primary','https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.197.pdf']],
    [['primary','https://research.ibm.com/publications/how-to-share-a-secret-with-cheaters'],['primary','https://www.cs.umd.edu/~gasarch/TOPICS/secretsharing/feldmanVSS.pdf'],['primary','https://www.cs.cornell.edu/courses/cs754/2001fa/129.PDF']],
    [['primary','https://osv.dev/vulnerability/GO-2023-1709'],['primary','https://www.ledger.com/blog/extracting-seeds'],['secondary','https://en.bitcoin.it/wiki/Shamir_Secret_Snakeoil'],['primary','https://github.com/bitcoin/bips/blob/master/bip-0093.mediawiki']],
    [['primary','https://github.com/satoshilabs/slips/blob/master/slip-0039.md'],['primary','https://github.com/bitcoin/bips/blob/master/bip-0093.mediawiki']],
    [['primary','https://github.com/ipusiron/visual-cryptography-cipherlab'],['primary','https://github.com/ipusiron/sha256-byte-inspector'],['primary','https://github.com/ipusiron/otp-animation']]
  ];
  function lessons(){const holder=$('lessons');holder.replaceChildren();for(let i=1;i<=8;i++){
    const section=E('section',undefined,'lesson-card');section.append(E('h3',t(`lesson${i}`)));
    for(const paragraph of t(`lesson${i}Text`).split('\n\n'))section.append(E('p',paragraph));
    const links=E('p',undefined,'source-links');for(const [type,url] of sources[i-1]){const a=E('a',`${t(type)}: ${new URL(url).hostname}`);a.href=url;a.target='_blank';a.rel='noopener noreferrer';links.append(a,E('span',' · '));}section.append(links);holder.append(section);
  }}
  window.renderShamirExtra=()=>{renderBytes();multiplication();renderPitfalls();lessons();};
  choices('byte-k',2,8,state.k);choices('byte-n',state.k,8,state.n);
  $('byte-message').addEventListener('compositionstart',()=>{state.composing=true;});
  $('byte-message').addEventListener('compositionend',()=>{state.composing=false;split();});
  $('byte-message').addEventListener('input',()=>{if(!state.composing)split();});
  $('byte-k').addEventListener('change',()=>{state.k=Number($('byte-k').value);state.n=Math.max(state.k,state.n);choices('byte-n',state.k,8,state.n);split();});
  $('byte-n').addEventListener('change',()=>{state.n=Number($('byte-n').value);split();});
  $('byte-column').addEventListener('change',()=>{state.column=Number($('byte-column').value);renderBytes();});
  $('byte-picks').addEventListener('click',event=>{const button=event.target.closest('[data-byte-pick]');if(!button)return;const x=Number(button.dataset.bytePick);
    state.selected=state.selected.includes(x)?state.selected.filter(value=>value!==x):state.selected.length<state.k?[...state.selected,x].sort((a,b)=>a-b):state.selected;renderBytes();});
  $('tamper-layer').addEventListener('change',renderPitfalls);
  split();multiplication();renderPitfalls();lessons();
}());
