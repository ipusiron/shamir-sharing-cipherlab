/* ShamirSharing CipherLab - MIT (c) 2026 ipusiron. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id), G = ShamirGF, p = 13;
  const state = { n:5, secret:5, slope:4, one:3, two:[3,1], candidate:0 };
  const t = key => ShamirMessages[document.documentElement.lang][key] || key;
  const format = (key, values) => t(key).replace(/\{([a-z0-9]+)\}/gi, (_, name) => String(values[name]));
  const E = (tag, value) => { const el=document.createElement(tag);if(value!==undefined)el.textContent=String(value);return el; };
  const S = (tag, attrs) => { const el=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [key,value] of Object.entries(attrs))el.setAttribute(key,String(value));return el; };
  const shares = () => G.splitP([state.secret,state.slope],state.n,p);
  const defaultPair = () => [state.one,state.one===1?2:1];
  const points = () => state.two.map(x => shares()[x-1]);
  const pickButton = ([x,y],selected) => {
    const button=E('button',selected?`#${x} (${x},${y})`:`#${x}`);
    button.type='button';button.dataset.linearPick=String(x);
    button.setAttribute('aria-pressed',String(selected));return button;
  };
  function analogy([x,y],candidateSecret){
    const svg=$('linear-analogy'),x0=54,x12=270,y0=252,unit=18;
    const X=value=>x0+value*unit,Y=value=>y0-value*unit;
    const lines=[];
    const segment=secret=>{
      const slope=(y-secret)/x;
      let left=0,right=12;
      if(slope>0){left=Math.max(left,-secret/slope);right=Math.min(right,(12-secret)/slope);}
      if(slope<0){left=Math.max(left,(12-secret)/slope);right=Math.min(right,-secret/slope);}
      return {x1:X(left),y1:Y(secret+slope*left),x2:X(right),y2:Y(secret+slope*right)};
    };
    svg.replaceChildren(S('line',{x1:x0,y1:26,x2:x0,y2:y0,class:'linear-analogy-axis'}),
      S('line',{x1:x0,y1:y0,x2:x12,y2:y0,class:'linear-analogy-axis'}));
    for(const [index,secret] of [0,5,12].entries()){
      const line=segment(secret);
      lines.push(line);
      svg.append(S('line',{...line,class:`linear-analogy-line linear-analogy-${index}`}));
      const label=S('text',{x:5,y:Y(secret)+4,class:`linear-analogy-label${secret===candidateSecret?' linear-analogy-active-label':''}`});
      label.textContent=`s=${secret}`;svg.append(label);
    }
    const active=segment(candidateSecret);
    lines.push(active);
    svg.append(S('line',{...active,class:'linear-analogy-line linear-analogy-active'}));
    if(![0,5,12].includes(candidateSecret)){
      const label=S('text',{x:5,y:Y(candidateSecret)+4,class:'linear-analogy-label linear-analogy-active-label'});
      label.textContent=`s=${candidateSecret}`;svg.append(label);
    }
    const pointX=X(x),pointY=Y(y);
    svg.append(S('circle',{cx:pointX,cy:pointY,r:6,class:'linear-analogy-point'}));
    for(const [labelX,label] of [[x0,'x=0'],[x12,'x=12']]){
      const text=S('text',{x:labelX,y:283,class:'linear-analogy-axis-label','text-anchor':'middle'});
      text.textContent=label;svg.append(text);
    }
    const pointLabel=S('text',{class:'linear-analogy-label linear-analogy-point-label'});
    pointLabel.textContent=`(${x},${y})`;svg.append(pointLabel);
    const crosses=(box,line)=>{
      const left=Math.max(box.x-3,line.x1),right=Math.min(box.x+box.width+3,line.x2);
      if(left>right)return false;
      const at=value=>line.y1+(value-line.x1)*(line.y2-line.y1)/(line.x2-line.x1);
      return Math.min(at(left),at(right))<=box.y+box.height+3 && Math.max(at(left),at(right))>=box.y-3;
    };
    const positions=[];
    for(const dx of [30,45,60,75,90,18])for(const dy of [-9,27,-23,41,-37,55,-51,69,-65,83,-79])positions.push([dx,dy]);
    let placed=false;
    for(const [dx,dy] of positions){
      pointLabel.setAttribute('x',String(pointX+dx));pointLabel.setAttribute('y',String(pointY+dy));
      const box=pointLabel.getBBox();
      if(box.x>=x0+8 && box.x+box.width<=318 && box.y>=2 && box.y+box.height<y0-4 && !lines.some(line=>crosses(box,line))){placed=true;break;}
    }
    if(!placed){
      pointLabel.setAttribute('x','275');
      pointLabel.setAttribute('y',String(Math.max(18,Math.min(240,pointY-10))));
    }
    $('linear-analogy-caption').textContent=format('linearAnalogyCaption',{x,y,secret:candidateSecret});
  }
  function twoGraph(selected,secret,slope){
    const svg=$('linear-two-graph'),x0=54,x12=270,y0=252,unit=18;
    const X=value=>x0+value*unit,Y=value=>y0-value*unit;
    const lines=[];
    svg.replaceChildren(S('line',{x1:x0,y1:26,x2:x0,y2:y0,class:'linear-analogy-axis'}),
      S('line',{x1:x0,y1:y0,x2:x12,y2:y0,class:'linear-analogy-axis'}));
    if(selected.length===2){
      if(slope===0){
        lines.push({x1:X(0),y1:Y(secret),x2:X(12),y2:Y(secret)});
      } else {
        const lastWrap=Math.floor((secret+slope*12)/p);
        for(let wrap=0;wrap<=lastWrap;wrap++){
          const left=Math.max(0,(p*wrap-secret)/slope);
          const right=Math.min(12,(p*wrap+12-secret)/slope);
          if(left<right)lines.push({
            x1:X(left),y1:Y(secret+slope*left-p*wrap),
            x2:X(right),y2:Y(secret+slope*right-p*wrap)
          });
        }
      }
      for(const line of lines)svg.append(S('line',{...line,class:'linear-two-branch'}));
      svg.append(S('circle',{cx:X(0),cy:Y(secret),r:6,class:'linear-two-secret'}));
      const secretLabel=S('text',{x:5,y:Y(secret)+4,class:'linear-analogy-label linear-analogy-active-label'});
      secretLabel.textContent=`s=${secret}`;svg.append(secretLabel);
      $('linear-two-graph-caption').textContent=format('linearTwoGraphCaption',{secret,slope});
    } else $('linear-two-graph-caption').textContent=t('linearTwoGraphPending');
    for(const [labelX,label] of [[x0,'x=0'],[x12,'x=12']]){
      const text=S('text',{x:labelX,y:283,class:'linear-analogy-axis-label','text-anchor':'middle'});
      text.textContent=label;svg.append(text);
    }
    const labelBoxes=[];
    const crosses=(box,line)=>{
      const left=Math.max(box.x-3,line.x1),right=Math.min(box.x+box.width+3,line.x2);
      if(left>right)return false;
      const at=value=>line.y1+(value-line.x1)*(line.y2-line.y1)/(line.x2-line.x1);
      return Math.min(at(left),at(right))<=box.y+box.height+3 && Math.max(at(left),at(right))>=box.y-3;
    };
    for(const [x,y] of selected){
      const pointX=X(x),pointY=Y(y);
      svg.append(S('circle',{cx:pointX,cy:pointY,r:6,class:'linear-two-share'}));
      const label=S('text',{class:'linear-analogy-label linear-two-point-label'});
      label.textContent=`(${x},${y})`;svg.append(label);
      let best=null;
      for(const dx of [10,20,35,-45,-60,50,-75])for(const dy of [-10,22,-22,34,-34,46,-46]){
        label.setAttribute('x',String(pointX+dx));label.setAttribute('y',String(pointY+dy));
        const box=label.getBBox();
        if(box.x<x0+7||box.x+box.width>318||box.y<2||box.y+box.height>=y0-4)continue;
        const overlap=labelBoxes.some(other=>box.x<other.x+other.width+5 && box.x+box.width+5>other.x && box.y<other.y+other.height+5 && box.y+box.height+5>other.y);
        const score=lines.filter(line=>crosses(box,line)).length+(overlap?100:0);
        if(!best||score<best.score)best={dx,dy,score,box};
        if(score===0)break;
      }
      if(best){
        label.setAttribute('x',String(pointX+best.dx));label.setAttribute('y',String(pointY+best.dy));
        labelBoxes.push(best.box);
      }
    }
  }
  function render() {
    const allShares=shares(), subscript='₀₁₂₃₄₅₆₇₈₉';
    $('linear-n').value=String(state.n);
    $('linear-threshold').textContent=format('linearThreshold',{n:state.n});
    $('linear-secret').value=String(state.secret);
    $('linear-slope').value=String(state.slope);
    $('linear-distribution').replaceChildren(...allShares.map(([i,y])=>E('p',format('linearDistributionRow',{
      i,sub:subscript[i],secret:state.secret,slope:state.slope,y
    }))));
    $('linear-one-picks').replaceChildren(...allShares.map(share=>pickButton(share,state.one===share[0])));
    $('linear-two-picks').replaceChildren(...allShares.map(share=>pickButton(share,state.two.includes(share[0]))));
    {
      const [x,y]=allShares[state.one-1],candidates=G.candidatesP([[x,y]],2,p),candidate=candidates[state.candidate];
      $('linear-one-selected').textContent=format('linearSelectedOne',{x,y});
      $('linear-one-result').textContent=format('linearOneResult',{x,y});
      $('linear-distinct').textContent=format('linearDistinct',{
        x,y,a0:candidates[0].coefficients[1],a5:candidates[5].coefficients[1]
      });
      $('linear-candidate').value=String(state.candidate);
      $('linear-candidate-result').textContent=format('linearCandidateResult',{
        x,y,secret:state.candidate,slope:candidate.coefficients[1],y0:candidate.values[0],y1:candidate.values[1],y2:candidate.values[2]
      });
      analogy([x,y],state.candidate);
    }
    const selected=points();
    if(selected.length===2){
      const [[x1,y1],[x2,y2]]=selected,coefficients=G.polynomialP(selected,p),secret=G.lagrangeP(selected,2,p).secret;
      $('linear-two-selected').textContent=format('linearSelectedTwo',{x1,y1,x2,y2});
      $('linear-two-result').textContent=format('linearTwoResult',{x1,y1,x2,y2,secret,slope:coefficients[1]});
      twoGraph(selected,secret,coefficients[1]);
    } else {
      const [x,y]=selected[0];
      $('linear-two-selected').textContent=format('linearSelectedOne',{x,y});
      $('linear-two-result').textContent=t('linearTwoPending');
      twoGraph(selected);
    }
  }
  $('linear-n').replaceChildren(...Array.from({length:7},(_,i)=>{const option=E('option',i+2);option.value=String(i+2);return option;}));
  $('linear-candidate').replaceChildren(...Array.from({length:p},(_,i)=>{const option=E('option',i);option.value=String(i);return option;}));
  $('linear-n').addEventListener('change',()=>{
    state.n=Number($('linear-n').value);
    if(state.one>state.n){state.one=1;state.two=defaultPair();}
    else {state.two=state.two.filter(x=>x<=state.n);if(state.two.length<2)state.two=defaultPair();}
    render();
  });
  for(const [id,key] of [['linear-secret','secret'],['linear-slope','slope']])$(id).addEventListener('change',()=>{
    const value=Number($(id).value);
    if(!Number.isInteger(value)||value<0||value>=p){$('linear-status').textContent=t('invalidInput');$(id).value=String(state[key]);return;}
    state[key]=value;state.one=Math.min(3,state.n);state.two=defaultPair();state.candidate=0;$('linear-status').textContent='';render();
  });
  $('linear-reset').addEventListener('click',()=>{Object.assign(state,{n:5,secret:5,slope:4,one:3,two:[3,1],candidate:0});$('linear-status').textContent='';render();});
  $('linear-one-picks').addEventListener('click',event=>{
    const button=event.target.closest('[data-linear-pick]');if(!button)return;
    state.one=Number(button.dataset.linearPick);
    state.two=defaultPair();state.candidate=0;
    render();
    $('linear-one-picks').querySelector(`[data-linear-pick="${state.one}"]`).focus({preventScroll:true});
  });
  $('linear-two-picks').addEventListener('click',event=>{
    const button=event.target.closest('[data-linear-pick]');if(!button)return;
    const x=Number(button.dataset.linearPick),current=state.two;
    if(current.includes(x)){if(current.length===2)state.two=current.filter(value=>value!==x);}
    else state.two=current.length===1?[...current,x]:[current[0],x];
    render();
    $('linear-two-picks').querySelector(`[data-linear-pick="${x}"]`).focus({preventScroll:true});
  });
  $('linear-candidate').addEventListener('change',()=>{state.candidate=Number($('linear-candidate').value);render();});
  for(const [id,delta] of [['linear-previous',-1],['linear-next',1]])$(id).addEventListener('click',()=>{state.candidate=G.mod(state.candidate+delta,p);render();});
  window.renderShamirIntro=render;
  render();
}());
