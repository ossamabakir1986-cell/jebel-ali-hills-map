/* Hayat GIS v3.3.14 - Filter Engine HARD Restore
   Purpose:
   - Final guard loaded last on Admin and Agent pages.
   - Restores Search, Agent, Status/Color, Type, Feature, Phase, GFA, Size, AED/sqft and Pricing filters.
   - Keeps Add Inventory / PA label click / Move Plot / exports untouched.
   - Avoids auto zoom-out when applying filters.
*/
(function(){
  'use strict';

  var VERSION = 'v3.3.14 Filter Engine Hard Restore';
  window.HAYAT_FILTER_ENGINE_VERSION = VERSION;

  function $(id){ return document.getElementById(id); }
  function clean(v){ return String(v == null ? '' : v).replace(/\s+/g,' ').trim(); }
  function key(v){ return clean(v).toLowerCase(); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function val(id){ var e=$(id); return e ? clean(e.value) : ''; }
  function numberVal(id){ var v=val(id); if(!v) return null; var n=Number(String(v).replace(/,/g,'')); return isFinite(n) ? n : null; }
  function numberOf(v){
    if(v === null || v === undefined || v === '') return null;
    var n = Number(String(v).replace(/,/g,'').trim());
    return isFinite(n) ? n : null;
  }

  function normalizeAgent(v){
    try{ if(window.HayatDataNormalize && window.HayatDataNormalize.normalizeAgent) return window.HayatDataNormalize.normalizeAgent(v); }catch(e){}
    return clean(v).split(' ').map(function(w){ return w ? w.charAt(0).toUpperCase()+w.slice(1).toLowerCase() : ''; }).join(' ');
  }
  function agentKey(v){ return key(normalizeAgent(v)); }

  function normalizeType(v){
    try{ if(window.HayatDataNormalize && window.HayatDataNormalize.normalizeType) return window.HayatDataNormalize.normalizeType(v); }catch(e){}
    var k=key(v);
    var map={
      'plot':'Plot',
      'building':'Building',
      'ready villa':'Ready Villa',
      'ready building':'Ready Building',
      'twin villa':'Twin Villa',
      'twin villa (ready)':'Twin Villa (Ready)',
      'retail/hotel apartments':'Retail / Hotel Apartments',
      'retail / hotel apartments':'Retail / Hotel Apartments'
    };
    return map[k] || clean(v);
  }
  function typeKey(v){ return key(normalizeType(v)); }

  function normalizeGfa(v){
    try{ if(window.HayatDataNormalize && window.HayatDataNormalize.normalizeGfa) return window.HayatDataNormalize.normalizeGfa(v); }catch(e){}
    return clean(v).toUpperCase().replace(/\s+/g,'');
  }
  function gfaKey(v){ return key(normalizeGfa(v)); }

  function normalizeColor(v){
    try{ if(window.HayatDataNormalize && window.HayatDataNormalize.normalizeColor) return window.HayatDataNormalize.normalizeColor(v); }catch(e){}
    var k=key(v);
    if(k==='red' || k==='direct') return 'Red';
    if(k==='blue' || k==='through broker' || k==='agent') return 'Blue';
    if(k==='pink' || k==='hold' || k==='on hold') return 'Pink';
    return k ? 'Other' : '';
  }
  function colorKey(v){ return key(normalizeColor(v)); }

  var FEATURE_LIST = ['Corner','Single Row','Back to Back','Park Facing','Green Belt Facing','Vastu / Plot Facing Direction','Vastu','End Unit','Irregular Shape'];
  function featureKey(v){ return key(v).replace(/[\s_\-/]+/g,' '); }
  function canonicalFeature(v){
    var k=featureKey(v);
    var aliases={
      'corner':'Corner',
      'single':'Single Row', 'single row':'Single Row',
      'back to back':'Back to Back', 'backtoback':'Back to Back',
      'park':'Park Facing', 'park facing':'Park Facing',
      'green belt':'Green Belt Facing', 'green belt facing':'Green Belt Facing', 'greenbelt':'Green Belt Facing',
      'vastu':'Vastu', 'vatsu':'Vastu', 'vastu plot facing direction':'Vastu / Plot Facing Direction', 'plot facing direction':'Vastu / Plot Facing Direction',
      'end':'End Unit', 'end unit':'End Unit', 'end plot':'End Unit',
      'irregular':'Irregular Shape', 'irregular shape':'Irregular Shape'
    };
    return aliases[k] || FEATURE_LIST.find(function(f){ return featureKey(f)===k; }) || clean(v);
  }
  function parseFeatures(v){
    if(Array.isArray(v)) v=v.join(',');
    var out=[], seen={};
    String(v || '').split(/[;,|]+/).forEach(function(part){
      var f=canonicalFeature(part);
      if(!f) return;
      var fk=featureKey(f);
      if(seen[fk]) return;
      seen[fk]=true;
      out.push(f);
    });
    return out;
  }
  function hasFeature(p, selected){
    var selectedKey=featureKey(canonicalFeature(selected));
    return parseFeatures(p && p.features).some(function(f){
      var fk=featureKey(f);
      return fk===selectedKey || (selectedKey==='vastu plot facing direction' && fk==='vastu') || (selectedKey==='vastu' && fk==='vastu plot facing direction');
    });
  }

  window.HAYAT_STANDARD_FEATURES = FEATURE_LIST.slice();
  window.HayatFeatureTools = Object.assign({}, window.HayatFeatureTools || {}, {
    features: FEATURE_LIST.slice(),
    parse: parseFeatures,
    canonical: canonicalFeature,
    has: hasFeature,
    format: function(v){ return parseFeatures(v).join(', '); }
  });

  function setOptions(id, values, firstLabel){
    var sel=$(id); if(!sel) return;
    var current=clean(sel.value), currentK=key(current);
    var seen={}, vals=[];
    values.forEach(function(v){
      v=clean(v); if(!v) return;
      var k=key(v); if(seen[k]) return;
      seen[k]=true; vals.push(v);
    });
    vals.sort(function(a,b){ return String(a).localeCompare(String(b), undefined, {numeric:true, sensitivity:'base'}); });
    sel.innerHTML='<option value="">'+esc(firstLabel)+'</option>' + vals.map(function(v){ return '<option value="'+esc(v)+'">'+esc(v)+'</option>'; }).join('');
    if(currentK){
      var keep=vals.find(function(v){ return key(v)===currentK; });
      if(keep) sel.value=keep;
    }
  }

  function ensureFeatureFilter(){
    var existing=$('v331FeatureFilter');
    if(existing) return existing;
    var type=$('type');
    var targetRow=type && type.parentNode;
    if(!targetRow || !targetRow.parentNode) return null;
    var row=document.createElement('div');
    row.className='row hayat-feature-filter-row';
    row.innerHTML='<select id="v331FeatureFilter"><option value="">All features</option></select>';
    targetRow.parentNode.insertBefore(row, targetRow.nextSibling);
    return $('v331FeatureFilter');
  }

  function normalizeAllPoints(){
    var pts = Array.isArray(window.points) ? window.points : [];
    pts.forEach(function(p){
      if(!p) return;
      try{ if(window.HayatDataNormalize && window.HayatDataNormalize.normalizePoint) window.HayatDataNormalize.normalizePoint(p); }catch(e){}
      if(p.features) p.features = parseFeatures(p.features).join(', ');
      if(p.color !== undefined) p.color = normalizeColor(p.color) || p.color;
      if(p.secondColor !== undefined) p.secondColor = normalizeColor(p.secondColor);
      if(p.type !== undefined) p.type = normalizeType(p.type);
      if(p.agent !== undefined) p.agent = normalizeAgent(p.agent);
      if(p.secondAgent !== undefined) p.secondAgent = normalizeAgent(p.secondAgent);
      if(p.gfa !== undefined) p.gfa = normalizeGfa(p.gfa);
    });
  }

  function refreshFilterOptions(){
    ensureFeatureFilter();
    normalizeAllPoints();
    var agents=[], colors=[], types=[], phases=[], gfas=[];
    (Array.isArray(window.points) ? window.points : []).forEach(function(p){
      if(!p) return;
      if(p.agent) agents.push(normalizeAgent(p.agent));
      if(p.secondAgent) agents.push(normalizeAgent(p.secondAgent));
      if(p.color) colors.push(normalizeColor(p.color));
      if(p.secondColor) colors.push(normalizeColor(p.secondColor));
      if(p.type) types.push(normalizeType(p.type));
      if(p.phase !== undefined && clean(p.phase)) phases.push(clean(p.phase));
      if(p.gfa) gfas.push(normalizeGfa(p.gfa));
    });
    setOptions('agent', agents, 'All agents');
    setOptions('color', colors, 'All statuses');
    setOptions('type', types, 'All types');
    setOptions('phase', phases, 'All phases');
    setOptions('gfa', gfas, 'All GFA');
    setOptions('v331FeatureFilter', FEATURE_LIST, 'All features');
  }

  function selectedFeature(){ var e=$('v331FeatureFilter'); return e ? clean(e.value) : ''; }

  function matchesFilters(p){
    if(!p) return false;
    var search=key(val('search'));
    var selectedAgent=agentKey(val('agent'));
    var selectedColor=colorKey(val('color'));
    var selectedType=typeKey(val('type'));
    var selectedFeatureValue=selectedFeature();
    var selectedPhase=key(val('phase'));
    var selectedGfa=gfaKey(val('gfa'));
    var minSize=numberVal('minSize'), maxSize=numberVal('maxSize');
    var minPrice=numberVal('minPrice'), maxPrice=numberVal('maxPrice');
    var pricing=key(val('priced'));

    if(search){
      var hay=[p.gisPlot,p.masterPlot,p.agent,p.mobile,p.secondAgent,p.secondMobile,p.type,p.phase,p.gfa,p.features,p.comment,p.priceText,p.totalText,p.sizeText].join(' ').toLowerCase();
      if(hay.indexOf(search)===-1) return false;
    }
    if(selectedAgent && agentKey(p.agent)!==selectedAgent && agentKey(p.secondAgent)!==selectedAgent) return false;
    if(selectedColor && colorKey(p.color)!==selectedColor && colorKey(p.secondColor)!==selectedColor) return false;
    if(selectedType && typeKey(p.type)!==selectedType) return false;
    if(selectedFeatureValue && !hasFeature(p, selectedFeatureValue)) return false;
    if(selectedPhase && key(p.phase)!==selectedPhase) return false;
    if(selectedGfa && gfaKey(p.gfa)!==selectedGfa) return false;

    var size=numberOf(p.size);
    if(minSize!==null && (size===null || size<minSize)) return false;
    if(maxSize!==null && (size===null || size>maxSize)) return false;

    var prices=[numberOf(p.price), numberOf(p.secondPrice)].filter(function(n){return n!==null && n>0;});
    if(minPrice!==null && !prices.some(function(n){return n>=minPrice;})) return false;
    if(maxPrice!==null && !prices.some(function(n){return n<=maxPrice;})) return false;
    if(pricing==='priced' && !prices.length) return false;
    if(pricing==='unpriced' && prices.length) return false;

    return true;
  }

  function updateCountFallback(list){
    var c=$('count');
    if(!c) return;
    var priced=(list||[]).filter(function(p){ return numberOf(p.price)>0 || numberOf(p.secondPrice)>0; }).length;
    c.innerHTML='<b>'+list.length+'</b> plots shown<br>Priced: <b>'+priced+'</b> | Unpriced: <b>'+(list.length-priced)+'</b>';
  }

  function applyFiltersImmediate(){
    normalizeAllPoints();
    var pts = Array.isArray(window.points) ? window.points : [];
    var filtered = pts.filter(matchesFilters);
    window.baseFilteredList = filtered;
    window.currentList = filtered;
    if(window.showSelectedOnly && typeof window.setShowSelectedOnly === 'function'){
      try{ window.setShowSelectedOnly(false); }catch(e){}
    }
    if(typeof window.addMarkers === 'function'){
      try{ window.addMarkers(filtered, false); }catch(err){ console.error('Filter render failed:', err); }
    } else {
      updateCountFallback(filtered);
    }
    try{ if(typeof window.updateStats === 'function') window.updateStats(filtered); else updateCountFallback(filtered); }catch(e){ updateCountFallback(filtered); }
    try{ if(typeof window.updateLabels === 'function') setTimeout(window.updateLabels, 20); }catch(e){}
    try{ if(typeof window.refreshUnifiedPALabels === 'function') setTimeout(window.refreshUnifiedPALabels, 80); }catch(e){}
    try{ if(typeof window.refreshMasterPlanPALabels === 'function') setTimeout(window.refreshMasterPlanPALabels, 80); }catch(e){}
    return filtered;
  }

  window.hayatApplyFiltersNow = applyFiltersImmediate;
  window.applyFiltersImmediate = applyFiltersImmediate;
  window.applyFilters = applyFiltersImmediate;
  window.refreshFilterOptionsFromPoints = refreshFilterOptions;
  window.refreshHayatFilters = refreshFilterOptions;
  window.resetFilters = function(){
    ['search','agent','color','type','v331FeatureFilter','phase','gfa','minSize','maxSize','minPrice','maxPrice','priced'].forEach(function(id){ var e=$(id); if(e) e.value=''; });
    return applyFiltersImmediate();
  };

  window.setInventoryColorVisible = function(bucket, show){
    var b = normalizeColor(bucket) || 'Other';
    window.inventoryVisibility = window.inventoryVisibility || {Red:true,Blue:true,Pink:true,Other:true};
    window.inventoryVisibility[b] = !!show;
    try{ localStorage.setItem('JAH_inventory_visibility', JSON.stringify(window.inventoryVisibility)); }catch(e){}
    return applyFiltersImmediate();
  };
  window.isInventoryColorVisible = function(color){
    var b = normalizeColor(color) || 'Other';
    var vis = window.inventoryVisibility || {Red:true,Blue:true,Pink:true,Other:true};
    return vis[b] !== false;
  };

  function bindElement(id, evt){
    var e=$(id); if(!e || e.__hayat3314Bound) return;
    e.__hayat3314Bound=true;
    e.addEventListener(evt, function(){
      if(evt==='input'){
        clearTimeout(window.__hayat3314InputTimer);
        window.__hayat3314InputTimer=setTimeout(applyFiltersImmediate, 80);
      } else {
        applyFiltersImmediate();
      }
    }, true);
  }

  function bindColorToggle(id, bucket){
    var e=$(id); if(!e || e.__hayat3314Bound) return;
    e.__hayat3314Bound=true;
    e.addEventListener('change', function(){ window.setInventoryColorVisible(bucket, this.checked); }, true);
  }

  function patchKnownMutators(){
    if(!window.__hayat3314MutatorsPatched){
      window.__hayat3314MutatorsPatched=true;
      ['publishCurrentPoints','importPublishedDataFile','importAgentWorkbook','savePlotEdit','deletePlotFromEditor','commitMovePlotPosition'].forEach(function(name){
        var fn=window[name];
        if(typeof fn==='function' && !fn.__hayat3314Wrapped){
          var wrapped=function(){
            var result=fn.apply(this, arguments);
            setTimeout(function(){ refreshFilterOptions(); applyFiltersImmediate(); }, 180);
            return result;
          };
          wrapped.__hayat3314Wrapped=true;
          window[name]=wrapped;
        }
      });
    }
  }

  function install(){
    ensureFeatureFilter();
    refreshFilterOptions();
    ['agent','color','type','v331FeatureFilter','phase','gfa','priced'].forEach(function(id){ bindElement(id, 'change'); });
    ['search','minSize','maxSize','minPrice','maxPrice'].forEach(function(id){ bindElement(id, 'input'); });
    bindColorToggle('showRedInventory','Red');
    bindColorToggle('showBlueInventory','Blue');
    bindColorToggle('showPinkInventory','Pink');
    bindColorToggle('showOtherInventory','Other');
    var labelMode=$('labelMode');
    if(labelMode && !labelMode.__hayat3314Label){
      labelMode.__hayat3314Label=true;
      labelMode.addEventListener('change', function(){ try{ if(typeof window.updateLabels==='function') window.updateLabels(); }catch(e){} }, true);
    }
    patchKnownMutators();
    setTimeout(applyFiltersImmediate, 60);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ setTimeout(install, 600); });
  else setTimeout(install, 600);
  setTimeout(install, 1500);
  setTimeout(install, 3000);
})();
