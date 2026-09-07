// Hayat GIS v3.3.39 - Unified Filter Dropdowns
// Fixes mixed native/custom dropdowns, dead arrow clicks, and inconsistent inner menus.
(function(){
  'use strict';
  if(window.__HAYAT_V3339_UNIFIED_FILTERS_LOADED) return;
  window.__HAYAT_V3339_UNIFIED_FILTERS_LOADED=true;
  var DEF=[['agent','All agents','Agent'],['color','All statuses','Status / Color'],['type','All types','Type'],['feature','All features','Features'],['phase','All phases','Phase'],['gfa','All GFA','GFA'],['priced','All pricing','Pricing']];
  var IDS=DEF.map(function(x){return x[0]}), timer=null, layTimer=null;
  function $(id){return document.getElementById(id)}
  function q(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
  function c(v){return String(v==null?'':v).replace(/\s+/g,' ').trim()}
  function k(v){return c(v).toLowerCase()}
  function h(v){return String(v==null?'':v).replace(/[&<>"']/g,function(x){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]})}
  function pts(){return Array.isArray(window.points)?window.points:(Array.isArray(window.HAYAT_PUBLISHED_POINTS)?window.HAYAT_PUBLISHED_POINTS:[])}
  function isAdmin(){return !!$('plotEditModal')||/admin\.html/i.test(location.pathname)}
  function store(){return isAdmin()?'HAYAT_V3339_FILTERS_ADMIN':'HAYAT_V3339_FILTERS_AGENT'}
  function state(){try{return JSON.parse(localStorage.getItem(store())||'{}')||{}}catch(e){return {}}}
  function save(st){try{localStorage.setItem(store(),JSON.stringify(st||{}))}catch(e){}}
  function sel(id){var a=state()[id];return Array.isArray(a)?a.map(c).filter(Boolean):[]}
  function set(id,a){var st=state();a=(a||[]).map(c).filter(Boolean); if(a.length)st[id]=a;else delete st[id];save(st)}
  function n(v){var x=String(v==null?'':v).replace(/,/g,'').trim(); if(!x)return null; x=Number(x); return isFinite(x)?x:null}
  function normColor(v){return (window.HayatDataNormalize&&window.HayatDataNormalize.normalizeColor)?window.HayatDataNormalize.normalizeColor(v):c(v)}
  function normType(v){return (window.HayatDataNormalize&&window.HayatDataNormalize.normalizeType)?window.HayatDataNormalize.normalizeType(v):c(v)}
  function normAgent(v){return (window.HayatDataNormalize&&window.HayatDataNormalize.normalizeAgent)?window.HayatDataNormalize.normalizeAgent(v):c(v)}
  function normGfa(v){return (window.HayatDataNormalize&&window.HayatDataNormalize.normalizeGfa)?window.HayatDataNormalize.normalizeGfa(v):c(v)}
  function normFeat(v){return c(v).replace(/\s*\/\s*/g,' / ')}
  function feats(v){return c(v).split(/[,;|]+/).map(normFeat).filter(Boolean)}
  function add(arr,seen,v,t){v=c(v);t=c(t)||v;if(!v||seen[k(v)])return;seen[k(v)]=1;arr.push({v:v,t:t})}
  function options(id){
    var a=[],seen={};
    if($(id)) q('option',$(id)).forEach(function(o){if(c(o.value))add(a,seen,o.value,o.textContent)});
    pts().forEach(function(p){
      if(id==='agent'){add(a,seen,normAgent(p.agent));add(a,seen,normAgent(p.secondAgent))}
      if(id==='color'){add(a,seen,normColor(p.color));add(a,seen,normColor(p.secondColor))}
      if(id==='type')add(a,seen,normType(p.type));
      if(id==='feature')feats(p.features).forEach(function(f){add(a,seen,f)});
      if(id==='phase')add(a,seen,p.phase);
      if(id==='gfa')add(a,seen,normGfa(p.gfa));
    });
    if(id==='priced')a=[{v:'priced',t:'Priced only'},{v:'unpriced',t:'Unpriced only'}];
    return a.sort(function(x,y){
      if(id==='phase'){var nx=Number(x.v),ny=Number(y.v);if(isFinite(nx)&&isFinite(ny))return nx-ny}
      return x.t.localeCompare(y.t,undefined,{numeric:true,sensitivity:'base'});
    });
  }
  function style(){if($('hayat-v3339-style'))return;var s=document.createElement('style');s.id='hayat-v3339-style';s.textContent=[
    'html.hayat-v3339 .hayat-v3339-source-row{display:none!important;height:0!important;overflow:hidden!important;margin:0!important;padding:0!important;visibility:hidden!important}',
    'html.hayat-v3339 #agent,html.hayat-v3339 #color,html.hayat-v3339 #type,html.hayat-v3339 #feature,html.hayat-v3339 #phase,html.hayat-v3339 #gfa,html.hayat-v3339 #priced{position:absolute!important;left:-99999px!important;width:1px!important;height:1px!important;opacity:0!important;pointer-events:none!important}',
    'html.hayat-v3339 .v3335-multi-filter{display:none!important;visibility:hidden!important;pointer-events:none!important}',
    '.hayat-v3339-stack{width:100%;margin:6px 0;position:relative;z-index:1200}.hayat-v3339-row{display:flex;gap:8px;margin:6px 0;width:100%}.hayat-v3339-control{position:relative;flex:1 1 0;min-width:0}',
    '.hayat-v3339-btn{width:100%;height:45px;box-sizing:border-box;border:1px solid rgba(206,163,80,.85);border-radius:9px;background:#10211D;color:#CEA350;font-size:19px;font-weight:900;text-align:left;padding:9px 36px 9px 12px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;box-shadow:0 1px 3px rgba(16,33,29,.22)}',
    '.hayat-v3339-btn:hover{background:#1F3F37}.hayat-v3339-lab{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;pointer-events:none}.hayat-v3339-arr{pointer-events:none;color:#CEA350;font-size:12px}.hayat-v3339-control.open .hayat-v3339-arr{transform:rotate(180deg)}',
    '.hayat-v3339-panel{display:none;position:absolute;left:0;top:calc(100% + 5px);z-index:999999;width:335px;max-width:calc(100vw - 24px);background:#fffdfa;color:#10211D;border:1px solid rgba(16,33,29,.25);border-radius:12px;box-shadow:0 12px 28px rgba(0,0,0,.26);padding:8px}.hayat-v3339-control:nth-child(2) .hayat-v3339-panel{left:auto;right:0}.hayat-v3339-control.open .hayat-v3339-panel{display:block}',
    '.hayat-v3339-head{display:flex;justify-content:space-between;font-size:13px;font-weight:900;margin:2px 0 7px}.hayat-v3339-count{color:#8A6C2E}.hayat-v3339-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:6px 0 8px}.hayat-v3339-actions button{height:29px;border-radius:7px;border:1px solid rgba(206,163,80,.65);background:#10211D;color:#CEA350;font-weight:900;cursor:pointer}',
    '.hayat-v3339-options{max-height:235px;overflow:auto;display:grid;gap:1px;padding-right:4px}.hayat-v3339-opt{display:flex;align-items:center;gap:8px;min-height:28px;padding:4px 5px;border-radius:7px;color:#1f2933;font-size:13px;font-weight:500;cursor:pointer}.hayat-v3339-opt:hover{background:rgba(206,163,80,.12)}.hayat-v3339-opt input{width:auto!important;height:auto!important;margin:0!important;accent-color:#CEA350}',
    '@media(max-width:700px){.hayat-v3339-row{gap:6px}.hayat-v3339-btn{height:42px;font-size:16px}.hayat-v3339-panel{position:fixed;left:8px!important;right:8px!important;top:72px!important;width:auto;max-height:62vh;overflow:auto}.hayat-v3339-options{max-height:46vh}}'
  ].join('\n');document.head.appendChild(s)}
  function text(def){var a=sel(def[0]);if(!a.length)return def[1];if(a.length<=2)return a.join(', ');return a.length+' selected'}
  function control(def){var id=def[0],a=sel(id).map(k),op=options(id),body='';op.forEach(function(o){body+='<label class="hayat-v3339-opt"><input type="checkbox" data-v="'+h(o.v)+'" '+(a.indexOf(k(o.v))>-1?'checked':'')+'> <span>'+h(o.t)+'</span></label>'}); if(!body)body='<div style="font-size:12px;color:#756b5f;padding:8px 4px">No choices found</div>';return '<div class="hayat-v3339-control" data-id="'+h(id)+'"><button type="button" class="hayat-v3339-btn"><span class="hayat-v3339-lab">'+h(text(def))+'</span><span class="hayat-v3339-arr">▾</span></button><div class="hayat-v3339-panel"><div class="hayat-v3339-head"><span>'+h(def[2])+'</span><span class="hayat-v3339-count">'+(a.length||'All')+'</span></div><div class="hayat-v3339-actions"><button type="button" data-act="all">All</button><button type="button" data-act="clear">Clear</button></div><div class="hayat-v3339-options">'+body+'</div></div></div>'}
  function build(){style();document.documentElement.classList.add('hayat-v3339');IDS.forEach(function(id){var e=$(id),r=e&&e.closest&&e.closest('.row');if(r)r.classList.add('hayat-v3339-source-row')});var search=$('search'),anchor=search&&search.closest&&search.closest('.row');if(!anchor)return;var st=$('hayat-v3339-stack');if(!st){st=document.createElement('div');st.id='hayat-v3339-stack';st.className='hayat-v3339-stack';anchor.insertAdjacentElement('afterend',st)}st.innerHTML='<div class="hayat-v3339-row">'+control(DEF[0])+'</div><div class="hayat-v3339-row">'+control(DEF[1])+control(DEF[2])+'</div><div class="hayat-v3339-row">'+control(DEF[3])+'</div><div class="hayat-v3339-row">'+control(DEF[4])+control(DEF[5])+'</div><div class="hayat-v3339-row">'+control(DEF[6])+'</div>';bind(st)}
  function upd(w){var id=w.getAttribute('data-id'),d=DEF.filter(function(x){return x[0]===id})[0],lab=w.querySelector('.hayat-v3339-lab'),cnt=w.querySelector('.hayat-v3339-count');if(lab)lab.textContent=text(d);if(cnt)cnt.textContent=sel(id).length||'All'}
  function bind(st){q('.hayat-v3339-btn',st).forEach(function(b){b.onclick=function(e){e.preventDefault();e.stopPropagation();var w=b.closest('.hayat-v3339-control');q('.hayat-v3339-control.open',st).forEach(function(x){if(x!==w)x.classList.remove('open')});w.classList.toggle('open')}});q('[data-v]',st).forEach(function(cb){cb.onchange=function(){var w=cb.closest('.hayat-v3339-control'),id=w.getAttribute('data-id'),a=[];q('[data-v]:checked',w).forEach(function(x){a.push(x.getAttribute('data-v'))});set(id,a);if($(id))$(id).value='';upd(w);apply()}});q('[data-act]',st).forEach(function(b){b.onclick=function(e){e.preventDefault();e.stopPropagation();var w=b.closest('.hayat-v3339-control'),id=w.getAttribute('data-id');set(id,[]);q('[data-v]',w).forEach(function(x){x.checked=false});if($(id))$(id).value='';upd(w);apply()}})}
  function visibleColor(v){var x=k(normColor(v)),grp=(x==='red'?'Red':x==='blue'?'Blue':(x==='pink'||x==='hold'||x==='on hold')?'Pink':'Other'),cb=$(grp==='Red'?'showRedInventory':grp==='Blue'?'showBlueInventory':grp==='Pink'?'showPinkInventory':'showOtherInventory');return !cb||cb.checked!==false}
  function has(list,v,fn){return !list.length||list.indexOf(k(fn?fn(v):v))>-1}
  function match(p){try{if(window.HayatDataNormalize&&window.HayatDataNormalize.normalizePoint)window.HayatDataNormalize.normalizePoint(p)}catch(e){}var se=k(($('search')||{}).value),minS=n(($('minSize')||{}).value),maxS=n(($('maxSize')||{}).value),minP=n(($('minPrice')||{}).value),maxP=n(($('maxPrice')||{}).value),price=n(p.price),price2=n(p.secondPrice),size=n(p.size),ag=sel('agent').map(function(x){return k(normAgent(x))}),co=sel('color').map(function(x){return k(normColor(x))}),ty=sel('type').map(function(x){return k(normType(x))}),fe=sel('feature').map(function(x){return k(normFeat(x))}),ph=sel('phase').map(k),gf=sel('gfa').map(function(x){return k(normGfa(x))}),pr=sel('priced').map(k);if(!visibleColor(p.color))return false;if(se&&[p.gisPlot,p.masterPlot,p.agent,p.mobile,p.secondAgent,p.secondMobile,p.type,p.phase,p.gfa,p.features,p.color,p.secondColor,p.lastUpdated,p.lastDateUpdated,p.comment].map(k).join(' | ').indexOf(se)<0)return false;if(ag.length&&ag.indexOf(k(normAgent(p.agent)))<0&&ag.indexOf(k(normAgent(p.secondAgent)))<0)return false;if(co.length&&co.indexOf(k(normColor(p.color)))<0&&co.indexOf(k(normColor(p.secondColor)))<0)return false;if(!has(ty,p.type,normType)||!has(ph,p.phase)||!has(gf,p.gfa,normGfa))return false;if(fe.length){var pf=feats(p.features).map(k);if(!fe.some(function(x){return pf.indexOf(x)>-1}))return false}if(minS!==null&&(size===null||size<minS))return false;if(maxS!==null&&(size===null||size>maxS))return false;if(minP!==null&&((price===null||price<minP)&&(price2===null||price2<minP)))return false;if(maxP!==null&&((price===null||price>maxP)&&(price2===null||price2>maxP)))return false;if(pr.length===1&&pr[0]==='priced'&&price===null&&price2===null)return false;if(pr.length===1&&pr[0]==='unpriced'&&(price!==null||price2!==null))return false;return true}
  function render(){var f=pts().filter(match);window.baseFilteredList=f;try{baseFilteredList=f}catch(e){}if(typeof window.addMarkers==='function')window.addMarkers(f,false);else if(typeof addMarkers==='function')addMarkers(f,false);var ct=$('count');if(ct&&ct.innerHTML.indexOf('Unified filters')<0)ct.innerHTML+='<br><span style="font-size:11px;color:#6b6047">Unified filters: v3.3.39</span>'}
  function apply(){clearTimeout(timer);timer=setTimeout(render,10)}
  function patch(){window.applyFilters=function(){apply();return false};window.hayatApplyFiltersNow=function(e){if(e&&e.preventDefault)e.preventDefault();apply();return false};window.resetFilters=function(){['search','minSize','maxSize','minPrice','maxPrice'].forEach(function(id){if($(id))$(id).value=''});IDS.forEach(function(id){if($(id))$(id).value=''});save({});try{localStorage.removeItem(isAdmin()?'HAYAT_V3335_MULTI_FILTERS_ADMIN':'HAYAT_V3335_MULTI_FILTERS_AGENT')}catch(e){};['showRedInventory','showBlueInventory','showPinkInventory','showOtherInventory'].forEach(function(id){if($(id))$(id).checked=true});build();apply();return false};['search','minSize','maxSize','minPrice','maxPrice'].forEach(function(id){var e=$(id);if(e&&!e.__v3339){e.__v3339=1;e.addEventListener('input',apply);e.addEventListener('change',apply)}})}
  function schedule(){clearTimeout(layTimer);layTimer=setTimeout(function(){build();patch()},80)}
  function boot(){schedule();setTimeout(schedule,500);setTimeout(schedule,1500);setTimeout(schedule,2600);document.addEventListener('click',function(e){if(e.target&&e.target.closest&&e.target.closest('.hayat-v3339-control'))return;q('.hayat-v3339-control.open').forEach(function(x){x.classList.remove('open')})},true);if(window.MutationObserver){new MutationObserver(schedule).observe(document.querySelector('.panel')||document.body,{childList:true,subtree:true})}console.log('v3.3.39 unified filters loaded')}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
