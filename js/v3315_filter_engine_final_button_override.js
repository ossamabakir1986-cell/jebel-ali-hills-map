/* Hayat GIS v3.3.15 - Filter Engine FINAL Button Override
   Fix target: filters visually change but Apply/Reset does not update the map.
   This file is loaded last and directly owns the filter buttons/events.
   It does not change Add Inventory, Move Plot, Move PA Point, exports, or Excel workflow. */
(function(){
  'use strict';

  var VERSION = 'v3.3.15 Filter Engine Final Button Override';
  window.HAYAT_FILTER_ENGINE_VERSION = VERSION;

  function $(id){ return document.getElementById(id); }
  function clean(v){ return String(v == null ? '' : v).replace(/\s+/g,' ').trim(); }
  function key(v){ return clean(v).toLowerCase(); }
  function val(id){ var e=$(id); return e ? clean(e.value) : ''; }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function num(id){
    var v = val(id);
    if(!v) return null;
    var n = Number(String(v).replace(/,/g,''));
    return isFinite(n) ? n : null;
  }
  function numOf(v){
    if(v === null || v === undefined || v === '') return null;
    var n = Number(String(v).replace(/,/g,'').trim());
    return isFinite(n) ? n : null;
  }

  function getPoints(){
    var pts = [];
    try{ if(Array.isArray(window.points)) pts = window.points; }catch(e){}
    if(!pts.length){ try{ if(typeof points !== 'undefined' && Array.isArray(points)) pts = points; }catch(e){} }
    if(!pts.length){ try{ if(Array.isArray(window.HAYAT_PUBLISHED_POINTS)) pts = window.HAYAT_PUBLISHED_POINTS; }catch(e){} }
    if(Array.isArray(pts)){
      try{ window.points = pts; points = pts; }catch(e){ window.points = pts; }
      return pts;
    }
    return [];
  }

  function normalizeAgent(v){
    try{ if(window.HayatDataNormalize && window.HayatDataNormalize.normalizeAgent) return window.HayatDataNormalize.normalizeAgent(v); }catch(e){}
    return clean(v).split(' ').map(function(w){return w ? w.charAt(0).toUpperCase()+w.slice(1).toLowerCase() : '';}).join(' ');
  }
  function agentKey(v){ return key(normalizeAgent(v)); }

  function normalizeType(v){
    try{ if(window.HayatDataNormalize && window.HayatDataNormalize.normalizeType) return window.HayatDataNormalize.normalizeType(v); }catch(e){}
    var k = key(v).replace(/\s*\/\s*/g,' / ');
    var map = {
      'plot':'Plot',
      'building':'Building',
      'ready villa':'Ready Villa',
      'ready building':'Ready Building',
      'twin villa':'Twin Villa',
      'twin villa (ready)':'Twin Villa (Ready)',
      'retail / hotel apartments':'Retail / Hotel Apartments',
      'retail/hotel apartments':'Retail / Hotel Apartments'
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
    var k = key(v);
    if(k === 'red' || k === 'direct') return 'Red';
    if(k === 'blue' || k === 'agent' || k === 'broker' || k === 'through broker') return 'Blue';
    if(k === 'pink' || k === 'hold' || k === 'on hold') return 'Pink';
    return k ? 'Other' : '';
  }
  function colorKey(v){ return key(normalizeColor(v)); }

  var FEATURE_LIST = window.HAYAT_STANDARD_FEATURES || ['Corner','Single Row','Back to Back','Park Facing','Green Belt Facing','Vastu / Plot Facing Direction','Vastu','End Unit','Irregular Shape'];
  function featureKey(v){ return key(v).replace(/[\s_\-/]+/g,' '); }
  function canonicalFeature(v){
    var k = featureKey(v);
    var aliases = {
      'corner':'Corner',
      'single':'Single Row', 'single row':'Single Row',
      'back to back':'Back to Back', 'backtoback':'Back to Back',
      'park':'Park Facing', 'park facing':'Park Facing',
      'green belt':'Green Belt Facing', 'green belt facing':'Green Belt Facing', 'greenbelt':'Green Belt Facing',
      'vastu':'Vastu', 'vatsu':'Vastu', 'plot facing direction':'Vastu / Plot Facing Direction', 'vastu plot facing direction':'Vastu / Plot Facing Direction',
      'end':'End Unit', 'end plot':'End Unit', 'end unit':'End Unit',
      'irregular':'Irregular Shape', 'irregular shape':'Irregular Shape'
    };
    return aliases[k] || FEATURE_LIST.find(function(f){return featureKey(f) === k;}) || clean(v);
  }
  function parseFeatures(v){
    if(Array.isArray(v)) v = v.join(',');
    var out = [], seen = Object.create(null);
    String(v || '').split(/[;,|]+/).forEach(function(part){
      var f = canonicalFeature(part);
      var fk = featureKey(f);
      if(!fk || seen[fk]) return;
      seen[fk] = true; out.push(f);
    });
    return out;
  }
  function hasFeature(p, selected){
    var sf = featureKey(canonicalFeature(selected));
    if(!sf) return true;
    return parseFeatures(p && p.features).some(function(f){
      var fk = featureKey(f);
      return fk === sf || (sf === 'vastu plot facing direction' && fk === 'vastu') || (sf === 'vastu' && fk === 'vastu plot facing direction');
    });
  }

  function ensureFeatureFilter(){
    var existing = $('v331FeatureFilter');
    if(existing) return existing;
    var type = $('type');
    var targetRow = type && type.parentNode;
    if(!targetRow || !targetRow.parentNode) return null;
    var row = document.createElement('div');
    row.className = 'row hayat-feature-filter-row';
    row.innerHTML = '<select id="v331FeatureFilter"><option value="">All features</option></select>';
    targetRow.parentNode.insertBefore(row, targetRow.nextSibling);
    return $('v331FeatureFilter');
  }

  function uniqueSorted(list){
    var seen = Object.create(null), out = [];
    list.forEach(function(v){
      v = clean(v); if(!v) return;
      var k = key(v); if(seen[k]) return;
      seen[k] = true; out.push(v);
    });
    return out.sort(function(a,b){return String(a).localeCompare(String(b), undefined, {numeric:true, sensitivity:'base'});});
  }
  function setOptions(id, values, firstLabel){
    var sel = $(id); if(!sel) return;
    var current = clean(sel.value), ck = key(current);
    var vals = uniqueSorted(values);
    sel.innerHTML = '<option value="">'+esc(firstLabel)+'</option>' + vals.map(function(v){return '<option value="'+esc(v)+'">'+esc(v)+'</option>';}).join('');
    if(ck){
      var keep = vals.find(function(v){ return key(v) === ck; });
      if(keep) sel.value = keep;
    }
  }

  function normalizeOnePoint(p){
    if(!p) return p;
    try{ if(window.HayatDataNormalize && window.HayatDataNormalize.normalizePoint) window.HayatDataNormalize.normalizePoint(p); }catch(e){}
    if(p.agent !== undefined) p.agent = normalizeAgent(p.agent);
    if(p.secondAgent !== undefined) p.secondAgent = normalizeAgent(p.secondAgent);
    if(p.type !== undefined) p.type = normalizeType(p.type);
    if(p.gfa !== undefined) p.gfa = normalizeGfa(p.gfa);
    if(p.color !== undefined) p.color = normalizeColor(p.color) || p.color;
    if(p.secondColor !== undefined) p.secondColor = normalizeColor(p.secondColor);
    if(p.features !== undefined) p.features = parseFeatures(p.features).join(', ');
    return p;
  }
  function normalizeAll(){ getPoints().forEach(normalizeOnePoint); }

  function refreshFilterOptions(){
    ensureFeatureFilter();
    normalizeAll();
    var agents=[], colors=[], types=[], phases=[], gfas=[];
    getPoints().forEach(function(p){
      if(!p) return;
      if(p.agent) agents.push(normalizeAgent(p.agent));
      if(p.secondAgent) agents.push(normalizeAgent(p.secondAgent));
      if(p.color) colors.push(normalizeColor(p.color));
      if(p.secondColor) colors.push(normalizeColor(p.secondColor));
      if(p.type) types.push(normalizeType(p.type));
      if(clean(p.phase)) phases.push(clean(p.phase));
      if(p.gfa) gfas.push(normalizeGfa(p.gfa));
    });
    setOptions('agent', agents, 'All agents');
    setOptions('color', colors, 'All statuses');
    setOptions('type', types, 'All types');
    setOptions('phase', phases, 'All phases');
    setOptions('gfa', gfas, 'All GFA');
    setOptions('v331FeatureFilter', FEATURE_LIST, 'All features');
  }

  function selectedFeature(){ var e = $('v331FeatureFilter'); return e ? clean(e.value) : ''; }
  function withinPriceRange(p, minPrice, maxPrice){
    var prices = [numOf(p.price), numOf(p.secondPrice)].filter(function(n){ return n !== null && n > 0; });
    if(minPrice === null && maxPrice === null) return true;
    if(!prices.length) return false;
    return prices.some(function(n){
      if(minPrice !== null && n < minPrice) return false;
      if(maxPrice !== null && n > maxPrice) return false;
      return true;
    });
  }
  function matchesFilters(p){
    if(!p) return false;
    var search = key(val('search'));
    var selectedAgent = agentKey(val('agent'));
    var selectedColor = colorKey(val('color'));
    var selectedType = typeKey(val('type'));
    var feature = selectedFeature();
    var selectedPhase = key(val('phase'));
    var selectedGfa = gfaKey(val('gfa'));
    var minSize = num('minSize'), maxSize = num('maxSize');
    var minPrice = num('minPrice'), maxPrice = num('maxPrice');
    var pricing = key(val('priced'));

    if(search){
      var hay = [p.gisPlot,p.masterPlot,p.agent,p.mobile,p.secondAgent,p.secondMobile,p.color,p.secondColor,p.type,p.phase,p.gfa,p.features,p.comment,p.priceText,p.totalText,p.sizeText].join(' ').toLowerCase();
      if(hay.indexOf(search) === -1) return false;
    }
    if(selectedAgent && agentKey(p.agent) !== selectedAgent && agentKey(p.secondAgent) !== selectedAgent) return false;
    if(selectedColor && colorKey(p.color) !== selectedColor && colorKey(p.secondColor) !== selectedColor) return false;
    if(selectedType && typeKey(p.type) !== selectedType) return false;
    if(feature && !hasFeature(p, feature)) return false;
    if(selectedPhase && key(p.phase) !== selectedPhase) return false;
    if(selectedGfa && gfaKey(p.gfa) !== selectedGfa) return false;

    var size = numOf(p.size);
    if(minSize !== null && (size === null || size < minSize)) return false;
    if(maxSize !== null && (size === null || size > maxSize)) return false;
    if(!withinPriceRange(p, minPrice, maxPrice)) return false;

    var hasPrice = [numOf(p.price), numOf(p.secondPrice)].some(function(n){ return n !== null && n > 0; });
    if(pricing === 'priced' && !hasPrice) return false;
    if(pricing === 'unpriced' && hasPrice) return false;
    return true;
  }

  function countVisibleAfterColor(list){
    return (list || []).filter(function(p){
      try{ return typeof window.isInventoryColorVisible === 'function' ? window.isInventoryColorVisible(p.color) : true; }catch(e){ return true; }
    });
  }
  function updateCount(list){
    var c = $('count'); if(!c) return;
    var visible = countVisibleAfterColor(list || []);
    var priced = visible.filter(function(p){ return numOf(p.price) > 0 || numOf(p.secondPrice) > 0; }).length;
    var totalValue = visible.reduce(function(sum,p){ return sum + (numOf(p.total) || 0) + (numOf(p.secondTotal) || 0); }, 0);
    var txt = '<b>'+visible.length+'</b> plots shown<br>Priced: <b>'+priced+'</b> | Unpriced: <b>'+(visible.length-priced)+'</b>';
    if(totalValue > 0) txt += '<br>Total priced value: <b>'+Math.round(totalValue).toLocaleString()+' AED</b>';
    txt += '<br><span style="font-size:11px;opacity:.75">Filters: '+esc(VERSION)+'</span>';
    c.innerHTML = txt;
  }

  function renderFiltered(list, doFit){
    window.baseFilteredList = list;
    window.currentList = list;
    try{ baseFilteredList = list; currentList = list; }catch(e){}
    if(window.showSelectedOnly && typeof window.setShowSelectedOnly === 'function'){
      try{ window.setShowSelectedOnly(false); }catch(e){}
    }
    var rendered = false;
    if(typeof window.addMarkers === 'function'){
      try{ window.addMarkers(list, doFit === true); rendered = true; }catch(e){ console.error('Hayat filter addMarkers failed', e); }
    }
    if(!rendered){ updateCount(list); }
    setTimeout(function(){
      try{ if(typeof window.updateLabels === 'function') window.updateLabels(); }catch(e){}
      try{ if(typeof window.refreshUnifiedPALabels === 'function') window.refreshUnifiedPALabels(); }catch(e){}
      try{ if(typeof window.refreshMasterPlanPALabels === 'function') window.refreshMasterPlanPALabels(); }catch(e){}
      updateCount(list);
    }, 120);
    return list;
  }

  function applyNow(evt){
    if(evt && evt.preventDefault) evt.preventDefault();
    if(evt && evt.stopPropagation) evt.stopPropagation();
    if(evt && evt.stopImmediatePropagation) evt.stopImmediatePropagation();
    normalizeAll();
    var filtered = getPoints().filter(matchesFilters);
    return renderFiltered(filtered, false);
  }
  function resetNow(evt){
    if(evt && evt.preventDefault) evt.preventDefault();
    if(evt && evt.stopPropagation) evt.stopPropagation();
    if(evt && evt.stopImmediatePropagation) evt.stopImmediatePropagation();
    ['search','agent','color','type','v331FeatureFilter','phase','gfa','minSize','maxSize','minPrice','maxPrice','priced'].forEach(function(id){ var e=$(id); if(e) e.value=''; });
    return applyNow();
  }

  window.hayatApplyFiltersNow = applyNow;
  window.hayatResetFiltersNow = resetNow;
  window.applyFiltersImmediate = applyNow;
  window.applyFilters = applyNow;
  window.resetFilters = resetNow;
  window.refreshFilterOptionsFromPoints = refreshFilterOptions;
  window.refreshHayatFilters = refreshFilterOptions;

  window.setInventoryColorVisible = function(bucket, show){
    var b = normalizeColor(bucket) || 'Other';
    window.inventoryVisibility = window.inventoryVisibility || {Red:true, Blue:true, Pink:true, Other:true};
    window.inventoryVisibility[b] = !!show;
    try{ localStorage.setItem('JAH_inventory_visibility', JSON.stringify(window.inventoryVisibility)); }catch(e){}
    return applyNow();
  };
  window.isInventoryColorVisible = function(color){
    var b = normalizeColor(color) || 'Other';
    var vis = window.inventoryVisibility || {Red:true, Blue:true, Pink:true, Other:true};
    return vis[b] !== false;
  };

  function bind(id, type){
    var e = $(id); if(!e || e.__hayat3315Bound) return;
    e.__hayat3315Bound = true;
    var eventType = type || (e.tagName === 'INPUT' ? 'input' : 'change');
    e.addEventListener(eventType, function(){
      clearTimeout(window.__hayat3315Timer);
      window.__hayat3315Timer = setTimeout(applyNow, eventType === 'input' ? 120 : 20);
    }, true);
  }
  function buttonText(btn){ return clean(btn && btn.textContent).toLowerCase(); }
  function hijackButtons(){
    Array.prototype.forEach.call(document.querySelectorAll('button'), function(btn){
      var txt = buttonText(btn);
      if(txt === 'apply'){
        btn.onclick = function(ev){ return applyNow(ev), false; };
        btn.setAttribute('data-hayat-filter-button','apply');
      } else if(txt === 'reset'){
        btn.onclick = function(ev){ return resetNow(ev), false; };
        btn.setAttribute('data-hayat-filter-button','reset');
      }
    });
  }

  document.addEventListener('click', function(ev){
    var btn = ev.target && ev.target.closest ? ev.target.closest('button') : null;
    if(!btn) return;
    var action = btn.getAttribute('data-hayat-filter-button') || buttonText(btn);
    if(action === 'apply') applyNow(ev);
    if(action === 'reset') resetNow(ev);
  }, true);

  function patchMutator(name){
    var fn = window[name];
    if(typeof fn !== 'function' || fn.__hayat3315Wrapped) return;
    var wrapped = function(){
      var result = fn.apply(this, arguments);
      setTimeout(function(){ refreshFilterOptions(); applyNow(); }, 250);
      return result;
    };
    wrapped.__hayat3315Wrapped = true;
    window[name] = wrapped;
  }
  function install(){
    refreshFilterOptions();
    ['agent','color','type','v331FeatureFilter','phase','gfa','priced'].forEach(function(id){ bind(id, 'change'); });
    ['search','minSize','maxSize','minPrice','maxPrice'].forEach(function(id){ bind(id, 'input'); });
    ['showRedInventory','showBlueInventory','showPinkInventory','showOtherInventory'].forEach(function(id){ bind(id, 'change'); });
    var labelMode = $('labelMode');
    if(labelMode && !labelMode.__hayat3315Label){
      labelMode.__hayat3315Label = true;
      labelMode.addEventListener('change', function(){ try{ if(typeof window.updateLabels === 'function') window.updateLabels(); }catch(e){} }, true);
    }
    hijackButtons();
    ['publishCurrentPoints','importPublishedDataFile','importAgentWorkbook','savePlotEdit','deletePlotFromEditor','commitMovePlotPosition','uploadExcelFile'].forEach(patchMutator);
    setTimeout(function(){ applyNow(); }, 80);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ setTimeout(install, 400); });
  else setTimeout(install, 400);
  setTimeout(install, 1400);
  setTimeout(install, 3000);
})();
