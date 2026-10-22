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
  const s = { p:13, k:3, n:5, c:[5,4,2], fewer:[1,2], selected:[1,2,3], candidate:5, all:false };
  const t = key => ShamirMessages[document.documentElement.lang][key] || key;
  const E = (tag, value, cls) => { const el=document.createElement(tag); if(value!==undefined) el.textContent=String(value); if(cls) el.className=cls; return el; };
  const S = (tag, attrs) => { const el=document.createElementNS('http://www.w3.org/2000/svg',tag); for(const [k,v] of Object.entries(attrs)) el.setAttribute(k,String(v)); return el; };
  const shares = () => G.splitP(s.c,s.n,s.p), points = () => s.selected.map(x=>shares()[x-1]), fewPoints = () => s.fewer.map(x=>shares()[x-1]);
  const format = (key,values) => t(key).replace(/\{([a-z]+)\}/gi,(_,name)=>String(values[name]));
  const initialEnough = () => [...s.fewer,...Array.from({length:s.n},(_,i)=>i+1).filter(x=>!s.fewer.includes(x)).slice(0,Math.max(0,s.k-s.fewer.length))].sort((a,b)=>a-b);
  const resetSelections = () => { s.fewer=Array.from({length:Math.max(0,s.k-1)},(_,i)=>i+1);s.selected=initialEnough();s.candidate=s.c[0];s.all=false; };
  function choices(id, from, to, value) { const el=$(id); el.replaceChildren(...Array.from({length:to-from+1},(_,i)=>{const o=E('option',from+i);o.value=String(from+i);o.selected=from+i===value;return o;})); }
  function controls() {
    $('prime').value=String(s.p); choices('threshold',1,s.n,s.k); choices('share-count',s.k,Math.min(s.p-1,8),s.n);
    $('secret').max=String(s.p-1); $('secret').value=String(s.c[0]); $('coefficient-inputs').replaceChildren();
    for(let i=1;i<s.k;i++){const label=E('label'),input=E('input'); input.type='number';input.min='0';input.max=String(s.p-1);input.value=String(s.c[i]);input.dataset.coefficient=String(i);label.append(E('span',`a${'₀₁₂₃₄₅₆₇₈₉'[i]}`),input);$('coefficient-inputs').append(label);}
  }
  function table(id, rows) { const body=$(id);body.replaceChildren();for(const cells of rows){const row=E('tr');for(const value of cells)row.append(E('td',value));body.append(row);} }
  function renderTables(){
    const exponent=i=>i>1?'⁰¹²³⁴⁵⁶⁷⁸⁹'[i]:'';
    $('polynomial').textContent=`f(x) = ${s.c.map((c,i)=>i?` + ${c}x${exponent(i)}`:String(c)).join('')} (mod ${s.p})`;
    table('distribution-table',shares().map(([x,y])=>{
      const terms=s.c.map((c,i)=>c*x**i);
      const substitution=s.c.map((c,i)=>i?`${c}×${x}${exponent(i)}`:String(c)).join('+');
      return [x,`f(${x})=${substitution}=${terms.join('+')}`,terms.reduce((a,b)=>a+b,0),y];
    }));
    $('share-data').replaceChildren(...shares().map(([x,y])=>
      E('p',`${t('shareData').replace('{i}',x)} (${x},${y})`)));
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
    if(!$('candidate-section').hidden){const visible=G.candidatesP(fewPoints(),s.k,s.p);
      if(!visible.some(r=>r.secret===s.candidate))s.candidate=visible[0].secret;
      $('candidate-result').textContent=`${visible.length}/${s.p} ${t('candidateCount')} · ${t('candidateSecret')}=${s.candidate}`;
      $('all-candidates').setAttribute('aria-pressed',String(s.all));
    }
  }
  function recoveryGraph(id,selected,candidates,activeSecret){
    const svg=$(id),left=54,right=490,top=24,bottom=270,scaleX=(right-left)/s.n,scaleY=(bottom-top)/(s.p-1);
    const X=x=>left+x*scaleX,Y=y=>bottom-y*scaleY;
    svg.replaceChildren(S('line',{x1:left,y1:top,x2:left,y2:bottom,class:'hand-graph-axis'}),
      S('line',{x1:left,y1:bottom,x2:right,y2:bottom,class:'hand-graph-axis'}));
    for(const [x,label] of [[0,'x=0'],[s.n,`x=${s.n}`]]){
      const text=S('text',{x:X(x),y:295,'text-anchor':'middle',class:'hand-graph-label'});text.textContent=label;svg.append(text);
    }
    // A real-valued drawing aid. Only integer x coordinates are field elements.
    // Break the path before each reduction from p-1 to 0 instead of joining it vertically.
    if(s.k===2||s.k===3){
      const ordered=[...candidates].sort((a,b)=>(a.secret===activeSecret)-(b.secret===activeSecret));
      for(const item of ordered){
        const raw=x=>item.coefficients.reduce((sum,c,i)=>sum+c*x**i,0);
        const maximum=raw(s.n),parts=[];
        const root=value=>{
          if(value<=raw(0))return 0;
          if(value>=maximum)return s.n;
          let low=0,high=s.n;
          for(let i=0;i<40;i++){const middle=(low+high)/2;if(raw(middle)<value)low=middle;else high=middle;}
          return (low+high)/2;
        };
        for(let band=Math.floor(raw(0)/s.p);band<=Math.floor(maximum/s.p);band++){
          const begin=root(band*s.p),end=root(band*s.p+s.p-1);
          if(end<begin)continue;
          const steps=Math.max(1,Math.ceil((end-begin)*20));
          const xs=Array.from({length:steps+1},(_,i)=>begin+(end-begin)*i/steps);
          for(let x=Math.ceil(begin);x<=Math.floor(end);x++)xs.push(x);
          xs.sort((a,b)=>a-b);
          parts.push(xs.map((x,i)=>`${i?'L':'M'}${X(x).toFixed(2)},${Y(Math.max(0,Math.min(s.p-1,raw(x)-band*s.p))).toFixed(2)}`).join(' '));
        }
        svg.append(S('path',{d:parts.join(' '),class:`hand-graph-guide${item.secret===activeSecret?' hand-graph-guide-active':''}`}));
      }
    }
    for(const item of candidates)for(let x=0;x<=s.n;x++){
      const y=G.evalP(item.coefficients,x,s.p);
      svg.append(S('circle',{cx:X(x),cy:Y(y),r:item.secret===activeSecret?4:2.8,
        class:`hand-graph-value${item.secret===activeSecret?' hand-graph-active':''}`}));
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
    const guideShape=coefficients=>t(coefficients[2]?'handQuadraticShape':coefficients[1]?'handLineShape':'handFlatShape');
    if(s.fewer.length===s.k-1){
      const all=s.k===1?Array.from({length:s.p},(_,secret)=>({secret,coefficients:[secret]})):G.candidatesP(fewPoints(),s.k,s.p);
      const sample=[0,Math.floor(s.p/2),s.p-1,s.candidate];
      const shown=s.all?all:all.filter(r=>sample.includes(r.secret));
      recoveryGraph('hand-few-graph',s.fewer,shown,s.candidate);
      $('hand-few-graph-caption').textContent=s.k<=3&&s.k>1
        ?format('handFewGuideCaption',{count:s.fewer.length,k:s.k,degree:s.k-1,
          shape:guideShape(all.find(item=>item.secret===s.candidate).coefficients)})
        :format('handFewGraphCaption',{count:s.fewer.length});
    }else{
      recoveryGraph('hand-few-graph',s.fewer,[],null);
      $('hand-few-graph-caption').textContent=format('handFewPending',{missing:s.k-1-s.fewer.length});
    }
    if(s.selected.length===s.k){
      const coefficients=G.polynomialP(points(),s.p),secret=coefficients[0];
      recoveryGraph('hand-enough-graph',s.selected,[{coefficients,secret}],secret);
      $('hand-enough-graph-caption').textContent=s.k<=3&&s.k>1
        ?format('handEnoughGuideCaption',{max:s.n,secret,k:s.k,degree:s.k-1,shape:guideShape(coefficients)})
        :format('handEnoughGraphCaption',{max:s.n,secret});
    }else{
      recoveryGraph('hand-enough-graph',s.selected,[],null);
      $('hand-enough-graph-caption').textContent=format('handEnoughPending',{missing:s.k-s.selected.length});
    }
  }
  function renderRealComparison(){
    const block=$('real-comparison'),visible=s.k>1&&s.fewer.length===s.k-1;
    block.hidden=!visible;
    if(!visible)return;
    const svg=$('real-comparison-graph'),left=54,right=490,top=24,bottom=270;
    const maxX=Math.min(s.n,Math.max(2,s.k-1)+.5);
    const coefficients=G.candidatesP(fewPoints(),s.k,s.p).find(item=>item.secret===s.candidate).coefficients;
    const raw=x=>coefficients.reduce((sum,coefficient,index)=>sum+coefficient*x**index,0);
    const maxY=Math.max(s.p-1,raw(maxX))*1.06;
    const X=x=>left+x*(right-left)/maxX,Y=y=>bottom-y*(bottom-top)/maxY;
    svg.replaceChildren(S('line',{x1:left,y1:top,x2:left,y2:bottom,class:'hand-graph-axis'}),
      S('line',{x1:left,y1:bottom,x2:right,y2:bottom,class:'hand-graph-axis'}));
    const curve=Array.from({length:161},(_,i)=>{
      const x=maxX*i/160;
      return `${i?'L':'M'}${X(x).toFixed(2)},${Y(raw(x)).toFixed(2)}`;
    }).join(' ');
    svg.append(S('path',{d:curve,class:'real-comparison-curve'}));
    for(let x=1;x<=Math.floor(maxX);x++){
      const y=raw(x);
      svg.append(S('circle',{cx:X(x),cy:Y(y),r:5,class:'hand-graph-share'}));
      const label=S('text',{x:Math.min(right-48,X(x)+8),y:Math.max(top+12,Y(y)-9),class:'hand-graph-label hand-graph-point-label'});
      label.textContent=`(${x},${y})`;svg.append(label);
    }
    svg.append(S('circle',{cx:X(0),cy:Y(s.candidate),r:6,class:'hand-graph-secret'}));
    const secretLabel=S('text',{x:5,y:Y(s.candidate)+4,class:'hand-graph-label hand-graph-secret-label'});
    secretLabel.textContent=`s=${s.candidate}`;svg.append(secretLabel);
    for(const [x,label] of [[0,'x=0'],[Math.floor(maxX),`x=${Math.floor(maxX)}`]]){
      const text=S('text',{x:X(x),y:295,'text-anchor':'middle',class:'hand-graph-label'});
      text.textContent=label;svg.append(text);
    }
    $('real-comparison-caption').textContent=format('realComparisonCaption',{
      degree:s.k-1,p:s.p,secret:s.candidate,raw:raw(2),reduced:G.mod(raw(2),s.p)
    });
  }
  function render(){renderTables();renderRecoveryGraphs();renderRealComparison();}
  window.renderShamirHand=render;
  $('prime').addEventListener('change',()=>{s.p=Number($('prime').value);s.n=Math.min(s.n,s.p-1);s.k=Math.min(s.k,s.n);s.c=s.c.slice(0,s.k).map(v=>G.mod(v,s.p));resetSelections();controls();render();});
  $('threshold').addEventListener('change',()=>{s.k=Number($('threshold').value);s.c=Array.from({length:s.k},(_,i)=>s.c[i]||0);resetSelections();controls();render();});
  $('share-count').addEventListener('change',()=>{s.n=Number($('share-count').value);resetSelections();controls();render();});
  $('secret').addEventListener('change',()=>{const v=Number($('secret').value);if(!Number.isInteger(v)||v<0||v>=s.p){$('hand-status').textContent=t('invalidInput');$('secret').value=String(s.c[0]);return;}s.c[0]=v;$('hand-status').textContent='';render();});
  $('coefficient-inputs').addEventListener('change',e=>{const i=Number(e.target.dataset.coefficient),v=Number(e.target.value);if(!i)return;if(!Number.isInteger(v)||v<0||v>=s.p){$('hand-status').textContent=t('invalidInput');e.target.value=String(s.c[i]);return;}s.c[i]=v;$('hand-status').textContent='';render();});
  $('random-coefficients').addEventListener('click',()=>{const limit=256-256%s.p;
    for(let i=1;i<s.k;i++){let value;do{const b=new Uint8Array(1);crypto.getRandomValues(b);value=b[0];}while(value>=limit);s.c[i]=value%s.p;}
    controls();render();});
  $('reset-hand').addEventListener('click',()=>{Object.assign(s,{p:13,k:3,n:5,c:[5,4,2],fewer:[1,2],selected:[1,2,3],candidate:5,all:false});controls();render();});
  $('hand-few-picks').addEventListener('click',e=>{const b=e.target.closest('[data-few-pick]');if(!b)return;const x=Number(b.dataset.fewPick);s.fewer=s.fewer.includes(x)?s.fewer.filter(v=>v!==x):s.fewer.length<s.k-1?[...s.fewer,x].sort((a,b)=>a-b):s.fewer;s.selected=initialEnough();s.candidate=s.c[0];s.all=false;render();});
  $('share-picks').addEventListener('click',e=>{const b=e.target.closest('[data-pick]');if(!b)return;const x=Number(b.dataset.pick);s.selected=s.selected.includes(x)?s.selected.filter(v=>v!==x):s.selected.length<s.k?[...s.selected,x].sort((a,b)=>a-b):s.selected;if(s.selected.length<s.k)s.candidate=s.c[0];render();});
  function nextCandidate(direction){if(s.fewer.length!==s.k-1)return;const list=G.candidatesP(fewPoints(),s.k,s.p).map(r=>r.secret);s.candidate=list[(list.indexOf(s.candidate)+direction+list.length)%list.length];render();}
  $('previous-candidate').addEventListener('click',()=>nextCandidate(-1));$('next-candidate').addEventListener('click',()=>nextCandidate(1));
  $('all-candidates').addEventListener('click',()=>{s.all=!s.all;render();});
  controls();render();
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
    if(!state.shares.length){$('byte-table').replaceChildren();$('byte-secret-hex').textContent='';$('byte-column').replaceChildren();$('byte-coefficient-source').textContent='';$('byte-formula').textContent='';$('byte-calculation').replaceChildren();$('byte-first-example').textContent='';$('byte-picks').replaceChildren();$('byte-weights').replaceChildren();$('byte-restored-hex').textContent='';$('byte-restored-text').textContent='';return;}
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
    const index=state.column,digits='₀₁₂₃₄₅₆₇₈₉',sub=String(index).replace(/[0-9]/g,d=>digits[Number(d)]),sup='⁰¹²³⁴⁵⁶⁷⁸⁹';
    const coefficients=[secret[index],...state.coefficients[index]];
    const name=degree=>`a${digits[degree]},${sub}`;
    const symbolic=coefficients.map((_,degree)=>degree?`${name(degree)}·X${degree===1?'':sup[degree]}`:`s${sub}`).join(' ⊕ ');
    const numeric=coefficients.map((value,degree)=>`{${toHex(value)}}${degree?`·X${degree===1?'':sup[degree]}`:''}`).join(' ⊕ ');
    $('byte-coefficient-source').textContent=format('byteCoefficientSource',{
      position:index,sub,secret:toHex(secret[index]),
      coefficients:coefficients.slice(1).map((value,degree)=>`${name(degree+1)}=${toHex(value)}`).join(document.documentElement.lang==='ja'?'、':', '),
      n:state.n,last:toHex(state.n)
    });
    $('byte-formula').textContent=`F${sub}(X) = ${symbolic} = ${numeric}  (GF(2⁸))`;
    const headings=[t('byteCalcShare'),'X',t('byteCalcResult'),t('byteCalcSecret'),...coefficients.slice(1).map((_,degree)=>`${name(degree+1)}·X${degree?sup[degree+1]:''}`)];
    const rows=state.shares.map(share=>{
      let power=1,value=coefficients[0];
      const terms=coefficients.slice(1).map(coefficient=>{power=G.mul256(power,share.x);const product=G.mul256(coefficient,power);value^=product;return `${toHex(coefficient)}×${toHex(power)}=${toHex(product)}`;});
      return [`#${share.x}`,toHex(share.x),toHex(value),toHex(coefficients[0]),...terms];
    });
    table($('byte-calculation'),headings,rows);
    const first=state.shares[0],terms=coefficients.slice(1).map((coefficient,degree)=>({
      input:`(${toHex(coefficient)}×${toHex(first.x)}${degree?sup[degree+1]:''})`,
      product:toHex(G.mul256(coefficient,G.pow256(first.x,degree+1)))
    }));
    $('byte-first-example').textContent=format('byteFirstExample',{
      expression:`F${sub}(${toHex(first.x)}) = ${toHex(coefficients[0])} ⊕ ${terms.map(term=>term.input).join(' ⊕ ')} = ${toHex(coefficients[0])} ⊕ ${terms.map(term=>term.product).join(' ⊕ ')} = ${toHex(first.y[index])}`
    });
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
    demoCard('tamper-output',[['what',t('tamperWhat')],['unsafe',t('tamperUnsafe')],['guarded',guarded],['lesson',t('tamperLesson')]]);
    demoCard('zero-output',[['what',t('zeroWhat')],['unsafe',t('zeroUnsafe')],['guardedSafe',t('zeroGuard')],['lesson',t('zeroLesson')]]);
    demoCard('short-output',[['what',t('shortWhat')],['unsafe',t('shortUnsafe')],['guardedSafe',t('shortGuard')],['lesson',t('shortLesson')]]);
    $('tamper-calculation').textContent=t('tamperMath').replace('{error}',P.hex(demo.error)).replace('{lambda}',toHex(G.combine256(demo.shares.slice(0,3),3).terms[1].lambda)).replace('{share}',P.hex(demo.changed.y)).replace('{other}',P.hex(demo.reconstructed245.slice(0,12)));
    $('short-calculation').textContent=t('shortMath').replace('{bytes}',P.hex(demo.missing));
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
