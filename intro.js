/* ShamirSharing CipherLab - MIT (c) 2026 ipusiron. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id), G = ShamirGF, p = 13;
  const state = { n:5, secret:5, slope:4, selected:[1], candidate:0 };
  const t = key => ShamirMessages[document.documentElement.lang][key] || key;
  const format = (key, values) => t(key).replace(/\{([a-z0-9]+)\}/gi, (_, name) => String(values[name]));
  const E = (tag, value) => { const el=document.createElement(tag);if(value!==undefined)el.textContent=String(value);return el; };
  const S = (tag, attrs) => { const el=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [key,value] of Object.entries(attrs))el.setAttribute(key,String(value));return el; };
  const shares = () => G.splitP([state.secret,state.slope],state.n,p);
  const points = () => state.selected.map(x => shares()[x-1]);
  function grid(values, secret) {
    const svg=$('linear-grid'), d=20;
    svg.replaceChildren();
    for(let x=0;x<p;x++)for(let y=0;y<p;y++)svg.append(S('rect',{x:d*x,y:d*(p-1-y),width:d,height:d,class:'field-cell'}));
    if(state.selected.length===1)for(let y=0;y<p;y++)svg.append(S('circle',{cx:d*.5,cy:d*(p-y-.5),r:6,class:'linear-possible'}));
    for(let x=0;x<p;x++)svg.append(S('circle',{cx:d*(x+.5),cy:d*(p-values[x]-.5),r:4,class:'linear-candidate-dot'}));
    svg.append(S('circle',{cx:d*.5,cy:d*(p-secret-.5),r:8,class:'linear-secret-dot'}));
    for(const [x,y] of points())svg.append(S('circle',{cx:d*(x+.5),cy:d*(p-y-.5),r:8,class:'linear-selected-dot'}));
  }
  function render() {
    $('linear-n').value=String(state.n);
    $('linear-secret').value=String(state.secret);
    $('linear-slope').value=String(state.slope);
    $('linear-picks').replaceChildren(...shares().map(([x,y])=>{
      const selected=state.selected.includes(x), button=E('button',selected?`#${x} (${x},${y})`:`#${x}`);
      button.type='button';button.dataset.linearPick=String(x);button.setAttribute('aria-pressed',String(selected));return button;
    }));
    const selected=points(),one=selected.length===1;
    $('linear-one').hidden=!one;$('linear-two').hidden=one;
    if(one){
      const [x,y]=selected[0],candidate=G.candidatesP(selected,2,p)[state.candidate];
      $('linear-selected').textContent=format('linearSelectedOne',{x,y});
      $('linear-one-result').textContent=format('linearOneResult',{x,y});
      $('linear-candidate').value=String(state.candidate);
      $('linear-candidate-result').textContent=format('linearCandidateResult',{secret:state.candidate,slope:candidate.coefficients[1]});
      grid(candidate.values,state.candidate);
    }else{
      const [[x1,y1],[x2,y2]]=selected,coefficients=G.polynomialP(selected,p),secret=G.lagrangeP(selected,2,p).secret;
      $('linear-selected').textContent=format('linearSelectedTwo',{x1,y1,x2,y2});
      $('linear-two-result').textContent=format('linearTwoResult',{x1,y1,x2,y2,secret,slope:coefficients[1]});
      grid(Array.from({length:p},(_,x)=>G.evalP(coefficients,x,p)),secret);
    }
  }
  $('linear-n').replaceChildren(...Array.from({length:7},(_,i)=>{const option=E('option',i+2);option.value=String(i+2);return option;}));
  $('linear-candidate').replaceChildren(...Array.from({length:p},(_,i)=>{const option=E('option',i);option.value=String(i);return option;}));
  $('linear-n').addEventListener('change',()=>{state.n=Number($('linear-n').value);state.selected=state.selected.filter(x=>x<=state.n);if(!state.selected.length)state.selected=[1];render();});
  for(const [id,key] of [['linear-secret','secret'],['linear-slope','slope']])$(id).addEventListener('change',()=>{
    const value=Number($(id).value);
    if(!Number.isInteger(value)||value<0||value>=p){$('linear-status').textContent=t('invalidInput');$(id).value=String(state[key]);return;}
    state[key]=value;state.selected=[1];state.candidate=0;$('linear-status').textContent='';render();
  });
  $('linear-reset').addEventListener('click',()=>{Object.assign(state,{n:5,secret:5,slope:4,selected:[1],candidate:0});$('linear-status').textContent='';render();});
  $('linear-picks').addEventListener('click',event=>{
    const button=event.target.closest('[data-linear-pick]');if(!button)return;
    const x=Number(button.dataset.linearPick),current=state.selected;
    if(current.includes(x)){if(current.length===2)state.selected=current.filter(value=>value!==x);}
    else state.selected=(current.length===1?[...current,x]:[current[0],x]).sort((a,b)=>a-b);
    render();
  });
  $('linear-candidate').addEventListener('change',()=>{state.candidate=Number($('linear-candidate').value);render();});
  for(const [id,delta] of [['linear-previous',-1],['linear-next',1]])$(id).addEventListener('click',()=>{state.candidate=G.mod(state.candidate+delta,p);render();});
  $('linear-to-hand').addEventListener('click',()=>{$('tab-hand').click();$('tab-hand').focus();});
  window.renderShamirIntro=render;
  render();
}());
