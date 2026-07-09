/* Hayat GIS v3.3.13 - Filter Engine Restore + Add Inventory Preservation
   - Restores search/agent/type/feature/phase/GFA/size/price/pricing filters.
   - Keeps v3.3.12 Master Plan label click -> Add Inventory workflow.
   - Keeps calculated details fix for newly added inventory.
   - Restores Red/Blue/Pink/Other visibility toggles and Display Labels refresh.
*/
(function(){
  'use strict';
  function $(id){ return document.getElementById(id); }
  function text(v){ return String(v == null ? '' : v).replace(/\s+/g,' ').trim(); }
  function lower(v){ return text(v).toLowerCase(); }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function val(id){ var e=$(id); return e ? text(e.value) : ''; }
  function num(id){ var v=val(id); if(v==='') return null; var n=Number(String(v).replace(/,/g,'')); return isFinite(n) ? n : null; }
  function canonicalColor(v){
    var c=lower(v);
    if(c==='red' || c==='direct') return 'Red';
    if(c==='blue' || c==='agent') return 'Blue';
    if(c==='pink' || c==='hold') return 'Pink';
    return c ? 'Other' : '';
  }
  function normalizeType(v){
    try{ if(window.HayatDataNormalize && window.HayatDataNormalize.normalizeType) return window.HayatDataNormalize.normalizeType(v); }catch(e){}
    return text(v).toLowerCase().replace(/\s*\/\s*/g,' / ').replace(/\s+/g,' ');
  }
  function normalizeGfa(v){
    try{ if(window.HayatDataNormalize && window.HayatDataNormalize.normalizeGfa) return window.HayatDataNormalize.normalizeGfa(v); }catch(e){}
    return text(v).toUpperCase().replace(/\s+/g,'');
  }
  function normalizeAgent(v){
    try{ if(window.HayatDataNormalize && window.HayatDataNormalize.normalizeAgent) return window.HayatDataNormalize.normalizeAgent(v); }catch(e){}
    return text(v);
  }
  var FEATURES=['Corner','End Unit','Back to Back','Single Row','Park Facing','Green Belt Facing','Vastu','Irregular Shape'];
  function featureKey(v){ return lower(v).replace(/[\s_\-\/]+/g,' '); }
  function featureCanonical(v){
    var k=featureKey(v);
    var aliases={
      'corner':'Corner',
      'end':'End Unit','end unit':'End Unit','end plot':'End Unit',
      'back to back':'Back to Back','backtoback':'Back to Back',
      'single row':'Single Row','single':'Single Row',
      'park':'Park Facing','park facing':'Park Facing',
      'green belt':'Green Belt Facing','green belt facing':'Green Belt Facing','greenbelt':'Green Belt Facing',
      'vastu':'Vastu','vatsu':'Vastu','north east':'Vastu','northeast':'Vastu',
      'irregular':'Irregular Shape','irregular shape':'Irregular Shape'
    };
    return aliases[k] || FEATURES.find(function(f){return featureKey(f)===k;}) || text(v);
  }
  function parseFeatures(v){
    var raw=Array.isArray(v)?v.join(','):String(v||'');
    var out=[], seen={};
    raw.split(/[;,|]+/).forEach(function(part){
      var f=featureCanonical(part); if(!f) return; var k=featureKey(f); if(seen[k]) return; seen[k]=true; out.push(f);
    });
    return out;
  }
  function hasFeature(p,f){
    var k=featureKey(featureCanonical(f));
    return parseFeatures(p && p.features).some(function(x){ return featureKey(x)===k; });
  }
  window.HAYAT_STANDARD_FEATURES=FEATURES.slice();
  window.HayatFeatureTools=Object.assign({}, window.HayatFeatureTools||{}, {features:FEATURES.slice(), parse:parseFeatures, format:function(v){return parseFeatures(v).join(', ');}, has:hasFeature, canonical:featureCanonical});

  function ensureFeatureFilter(){
    if($('v331FeatureFilter')) return;
    var type=$('type'); if(!type || !type.parentElement) return;
    var row=document.createElement('div'); row.className='row';
    row.innerHTML='<select id="v331FeatureFilter"><option value="">All features</option>'+FEATURES.map(function(f){return '<option value="'+esc(f)+'">'+esc(f)+'</option>';}).join('')+'</select>';
    var after=type.parentElement;
    after.parentNode.insertBefore(row, after.nextSibling);
  }
  function setSelectOptions(id, values, first, labelMap){
    var sel=$(id); if(!sel) return;
    var cur=sel.value;
    var seen={}, vals=[];
    values.forEach(function(v){ v=text(v); if(!v) return; var k=lower(v); if(seen[k]) return; seen[k]=true; vals.push(v); });
    vals.sort(function(a,b){return a.localeCompare(b, undefined, {numeric:true, sensitivity:'base'});});
    sel.innerHTML='<option value="">'+first+'</option>'+vals.map(function(v){return '<option value="'+esc(v)+'">'+esc(labelMap&&labelMap[v] || v)+'</option>';}).join('');
    if(vals.indexOf(cur)!==-1) sel.value=cur;
  }
  function refreshFilterOptions(){
    ensureFeatureFilter();
    var agents=[], colors=[], types=[], phases=[], gfas=[];
    (window.points||[]).forEach(function(p){
      agents.push(normalizeAgent(p.agent)); agents.push(normalizeAgent(p.secondAgent));
      if(canonicalColor(p.color)) colors.push(canonicalColor(p.color));
      if(canonicalColor(p.secondColor)) colors.push(canonicalColor(p.secondColor));
      if(p.type) types.push(text(p.type));
      if(p.phase!=null && text(p.phase)) phases.push(text(p.phase));
      if(p.gfa) gfas.push(text(p.gfa));
      if(p.features) p.features=parseFeatures(p.features).join(', ');
    });
    setSelectOptions('agent', agents, 'All agents');
    setSelectOptions('color', colors, 'All statuses', {Red:'Direct / Red', Blue:'Agent / Blue', Pink:'Hold / Pink', Other:'Other'});
    setSelectOptions('type', types, 'All types');
    setSelectOptions('phase', phases, 'All phases');
    setSelectOptions('gfa', gfas, 'All GFA');
  }
  function selectedFeature(){ var s=$('v331FeatureFilter'); return s ? text(s.value) : ''; }
  function matches(p){
    var search=lower(val('search'));
    var agent=normalizeAgent(val('agent'));
    var status=canonicalColor(val('color'));
    var type=normalizeType(val('type'));
    var feature=selectedFeature();
    var phase=val('phase'), gfa=normalizeGfa(val('gfa'));
    var minSize=num('minSize'), maxSize=num('maxSize'), minPrice=num('minPrice'), maxPrice=num('maxPrice');
    var priced=val('priced');
    if(search){
      var hay=[p.gisPlot,p.masterPlot,p.agent,p.mobile,p.secondAgent,p.secondMobile,p.type,p.phase,p.gfa,p.features,p.comment].join(' ').toLowerCase();
      if(hay.indexOf(search)===-1) return false;
    }
    if(agent && normalizeAgent(p.agent)!==agent && normalizeAgent(p.secondAgent)!==agent) return false;
    if(status && canonicalColor(p.color)!==status && canonicalColor(p.secondColor)!==status) return false;
    if(type && normalizeType(p.type)!==type) return false;
    if(feature && !hasFeature(p, feature)) return false;
    if(phase && text(p.phase)!==phase) return false;
    if(gfa && normalizeGfa(p.gfa)!==gfa) return false;
    if(minSize!==null && (!(Number(p.size)>0) || Number(p.size)<minSize)) return false;
    if(maxSize!==null && (!(Number(p.size)>0) || Number(p.size)>maxSize)) return false;
    var p1=Number(p.price), p2=Number(p.secondPrice);
    var hasP1=isFinite(p1)&&p1>0, hasP2=isFinite(p2)&&p2>0;
    if(minPrice!==null && (!hasP1 || p1<minPrice) && (!hasP2 || p2<minPrice)) return false;
    if(maxPrice!==null && (!hasP1 || p1>maxPrice) && (!hasP2 || p2>maxPrice)) return false;
    if(priced==='priced' && !hasP1 && !hasP2) return false;
    if(priced==='unpriced' && (hasP1 || hasP2)) return false;
    return true;
  }
  window.applyFiltersImmediate=function(){
    var all=(window.points||[]);
    try{ all.forEach(function(p){ if(window.HayatDataNormalize && window.HayatDataNormalize.normalizePoint) window.HayatDataNormalize.normalizePoint(p); if(p.features) p.features=parseFeatures(p.features).join(', '); }); }catch(e){}
    var filtered=all.filter(matches);
    window.baseFilteredList=filtered;
    if(window.showSelectedOnly && typeof window.setShowSelectedOnly==='function') window.setShowSelectedOnly(false);
    if(typeof window.addMarkers==='function') window.addMarkers(filtered, false);
    if(typeof window.updateStats==='function') window.updateStats(filtered);
    try{ if(typeof window.refreshUnifiedPALabels==='function') setTimeout(window.refreshUnifiedPALabels,80); }catch(e){}
    try{ if(typeof window.refreshMasterPlanPALabels==='function') setTimeout(window.refreshMasterPlanPALabels,80); }catch(e){}
    return filtered;
  };
  window.applyFilters=function(){ return window.applyFiltersImmediate(); };
  window.resetFilters=function(){
    ['search','agent','color','type','v331FeatureFilter','phase','gfa','minSize','maxSize','minPrice','maxPrice','priced'].forEach(function(id){ var e=$(id); if(e) e.value=''; });
    return window.applyFiltersImmediate();
  };
  window.setInventoryColorVisible=function(bucket, show){
    bucket=canonicalColor(bucket)||'Other';
    try{
      window.inventoryVisibility=window.inventoryVisibility || {Red:true,Blue:true,Pink:true,Other:true};
      window.inventoryVisibility[bucket]=!!show;
      if(typeof inventoryVisibility!=='undefined') inventoryVisibility[bucket]=!!show;
      localStorage.setItem('JAH_inventory_visibility', JSON.stringify(window.inventoryVisibility));
    }catch(e){}
    return window.applyFiltersImmediate();
  };
  window.isInventoryColorVisible=function(color){
    var b=canonicalColor(color)||'Other';
    try{ var vis=window.inventoryVisibility || (typeof inventoryVisibility!=='undefined'?inventoryVisibility:null) || {Red:true,Blue:true,Pink:true,Other:true}; return vis[b]!==false; }catch(e){return true;}
  };
  function wire(){
    ensureFeatureFilter(); refreshFilterOptions();
    ['agent','color','type','v331FeatureFilter','phase','gfa','priced'].forEach(function(id){ var e=$(id); if(e && !e.__hayat3313){ e.__hayat3313=true; e.addEventListener('change', window.applyFiltersImmediate, true); }});
    ['search','minSize','maxSize','minPrice','maxPrice'].forEach(function(id){ var e=$(id); if(e && !e.__hayat3313){ e.__hayat3313=true; e.addEventListener('input', function(){ clearTimeout(window.__hayat3313InputTimer); window.__hayat3313InputTimer=setTimeout(window.applyFiltersImmediate,120); }, true); }});
    ['showRedInventory','showBlueInventory','showPinkInventory','showOtherInventory'].forEach(function(id){ var e=$(id); if(e && !e.__hayat3313){ e.__hayat3313=true; var b=id.replace('show','').replace('Inventory',''); e.addEventListener('change', function(){ window.setInventoryColorVisible(b, this.checked); }, true); }});
    var pa=$('showNonInventoryPA'); if(pa && !pa.__hayat3313){ pa.__hayat3313=true; pa.addEventListener('change', function(){ if(typeof window.setNonPinnedPALabelsVisible==='function') window.setNonPinnedPALabelsVisible(this.checked); if(typeof window.refreshUnifiedPALabels==='function') setTimeout(window.refreshUnifiedPALabels,80); }, true); }
    var lm=$('labelMode'); if(lm && !lm.__hayat3313){ lm.__hayat3313=true; lm.addEventListener('change', function(){ if(typeof window.updateLabels==='function') setTimeout(window.updateLabels,20); }, true); }
    setTimeout(window.applyFiltersImmediate,80);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', function(){setTimeout(wire,1300);}); else setTimeout(wire,1300);
  setTimeout(wire,2300); setTimeout(wire,4300);
})();
