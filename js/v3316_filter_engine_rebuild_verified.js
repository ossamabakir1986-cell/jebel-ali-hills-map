/* Hayat GIS v3.3.16 - Filter Engine Rebuild Verified
   Purpose: replace the previous layered filter patches with one final owner.
   - Owns Apply / Reset and live filter events.
   - Uses a direct renderer instead of relying on older addMarkers wrappers.
   - Preserves Add Inventory, PA label click, Move Plot / Move PA Point, exports, and Agent Excel workflow.
*/
(function(){
  'use strict';

  var VERSION = 'v3.3.18 Smooth Filter Core';
  window.HAYAT_FILTER_ENGINE_VERSION = VERSION;

  function $(id){ return document.getElementById(id); }
  function clean(v){ return String(v == null ? '' : v).replace(/\s+/g,' ').trim(); }
  function lower(v){ return clean(v).toLowerCase(); }
  function compactKey(v){ return lower(v).replace(/[\s_\-\/]+/g,' '); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function val(id){ var e=$(id); return e ? clean(e.value) : ''; }
  function readNumber(id){ var v=val(id); if(!v) return null; var n=Number(v.replace(/,/g,'')); return isFinite(n) ? n : null; }
  function numberOf(v){ if(v == null || v === '') return null; var n=Number(String(v).replace(/,/g,'').trim()); return isFinite(n) ? n : null; }

  function safeGlobal(name){ try{ return window[name]; }catch(e){ return undefined; } }
  function getMap(){ return safeGlobal('map') || null; }
  function getAllPoints(){
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
    return clean(v).split(' ').map(function(w){ return w ? w.charAt(0).toUpperCase()+w.slice(1).toLowerCase() : ''; }).join(' ');
  }
  function agentKey(v){ return lower(normalizeAgent(v)); }

  function normalizeColor(v){
    try{ if(window.HayatDataNormalize && window.HayatDataNormalize.normalizeColor) return window.HayatDataNormalize.normalizeColor(v); }catch(e){}
    var k=lower(v);
    if(!k) return '';
    if(k==='red' || k==='direct') return 'Red';
    if(k==='blue' || k==='agent' || k==='broker' || k==='through broker') return 'Blue';
    if(k==='pink' || k==='hold' || k==='on hold') return 'Pink';
    return 'Other';
  }
  function colorKey(v){ return lower(normalizeColor(v)); }

  function normalizeType(v){
    try{ if(window.HayatDataNormalize && window.HayatDataNormalize.normalizeType) return window.HayatDataNormalize.normalizeType(v); }catch(e){}
    var k=lower(v).replace(/\s*\/\s*/g,' / ');
    var map={
      'plot':'Plot', 'building':'Building', 'ready building':'Ready Building', 'ready villa':'Ready Villa',
      'twin villa':'Twin Villa', 'twin villa (ready)':'Twin Villa (Ready)',
      'retail / hotel apartments':'Retail / Hotel Apartments', 'retail/hotel apartments':'Retail / Hotel Apartments'
    };
    return map[k] || clean(v);
  }
  function typeKey(v){ return lower(normalizeType(v)); }

  function normalizeGfa(v){
    try{ if(window.HayatDataNormalize && window.HayatDataNormalize.normalizeGfa) return window.HayatDataNormalize.normalizeGfa(v); }catch(e){}
    return clean(v).toUpperCase().replace(/\s+/g,'');
  }
  function gfaKey(v){ return lower(normalizeGfa(v)); }

  var FEATURE_LIST = window.HAYAT_STANDARD_FEATURES || ['Corner','Single Row','Back to Back','Park Facing','Green Belt Facing','Vastu / Plot Facing Direction','Vastu','End Unit','Irregular Shape'];
  function featureKey(v){ return compactKey(v); }
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
    if(aliases[k]) return aliases[k];
    for(var i=0;i<FEATURE_LIST.length;i++){ if(featureKey(FEATURE_LIST[i])===k) return FEATURE_LIST[i]; }
    return clean(v);
  }
  function parseFeatures(v){
    if(Array.isArray(v)) v=v.join(',');
    var out=[], seen=Object.create(null);
    String(v || '').split(/[;,|]+/).forEach(function(part){
      var f=canonicalFeature(part); var fk=featureKey(f);
      if(!fk || seen[fk]) return;
      seen[fk]=true; out.push(f);
    });
    return out;
  }
  function hasFeature(p, selected){
    var sk=featureKey(canonicalFeature(selected));
    if(!sk) return true;
    return parseFeatures(p && p.features).some(function(f){
      var fk=featureKey(f);
      return fk===sk || (sk==='vastu plot facing direction' && fk==='vastu') || (sk==='vastu' && fk==='vastu plot facing direction');
    });
  }

  window.HAYAT_STANDARD_FEATURES = FEATURE_LIST.slice();
  window.HayatFeatureTools = Object.assign({}, window.HayatFeatureTools || {}, {
    features: FEATURE_LIST.slice(), parse: parseFeatures, format: function(v){ return parseFeatures(v).join(', '); }, canonical: canonicalFeature, has: hasFeature
  });

  function normalizePoint(p){
    if(!p) return p;
    try{ if(window.HayatDataNormalize && window.HayatDataNormalize.normalizePoint) window.HayatDataNormalize.normalizePoint(p); }catch(e){}
    if(p.agent != null) p.agent = normalizeAgent(p.agent);
    if(p.secondAgent != null) p.secondAgent = normalizeAgent(p.secondAgent);
    if(p.color != null) p.color = normalizeColor(p.color) || p.color;
    if(p.secondColor != null) p.secondColor = normalizeColor(p.secondColor);
    if(p.type != null) p.type = normalizeType(p.type);
    if(p.gfa != null) p.gfa = normalizeGfa(p.gfa);
    if(p.features != null) p.features = parseFeatures(p.features).join(', ');
    return p;
  }
  function normalizeAll(){ getAllPoints().forEach(normalizePoint); }

  function uniqueSorted(values){
    var seen=Object.create(null), out=[];
    (values || []).forEach(function(v){ v=clean(v); if(!v) return; var k=lower(v); if(seen[k]) return; seen[k]=true; out.push(v); });
    out.sort(function(a,b){ return String(a).localeCompare(String(b), undefined, {numeric:true, sensitivity:'base'}); });
    return out;
  }
  function setOptions(id, values, first){
    var sel=$(id); if(!sel) return;
    var old=clean(sel.value), oldKey=lower(old);
    var vals=uniqueSorted(values);
    sel.innerHTML='<option value="">'+esc(first)+'</option>'+vals.map(function(v){ return '<option value="'+esc(v)+'">'+esc(v)+'</option>'; }).join('');
    if(oldKey){
      var keep=vals.find(function(v){ return lower(v)===oldKey; });
      if(keep) sel.value=keep;
    }
  }
  function ensureFeatureFilter(){
    var existing=$('v331FeatureFilter');
    if(existing) return existing;
    var type=$('type');
    var row = type && type.parentNode;
    if(!row || !row.parentNode) return null;
    var featureRow=document.createElement('div');
    featureRow.className='row hayat-feature-filter-row';
    featureRow.innerHTML='<select id="v331FeatureFilter"><option value="">All features</option></select>';
    row.parentNode.insertBefore(featureRow, row.nextSibling);
    return $('v331FeatureFilter');
  }
  function refreshOptions(){
    ensureFeatureFilter();
    normalizeAll();
    var agents=[], colors=[], types=[], phases=[], gfas=[];
    getAllPoints().forEach(function(p){
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

  function selectedFeature(){ var e=$('v331FeatureFilter'); return e ? clean(e.value) : ''; }
  function withinPriceRange(p, minPrice, maxPrice){
    var prices=[numberOf(p.price), numberOf(p.secondPrice)].filter(function(n){ return n !== null && n > 0; });
    if(minPrice === null && maxPrice === null) return true;
    if(!prices.length) return false;
    return prices.some(function(n){
      if(minPrice !== null && n < minPrice) return false;
      if(maxPrice !== null && n > maxPrice) return false;
      return true;
    });
  }
  function matches(p){
    if(!p) return false;
    var search=lower(val('search'));
    var agent=agentKey(val('agent'));
    var color=colorKey(val('color'));
    var type=typeKey(val('type'));
    var feature=selectedFeature();
    var phase=lower(val('phase'));
    var gfa=gfaKey(val('gfa'));
    var minSize=readNumber('minSize'), maxSize=readNumber('maxSize');
    var minPrice=readNumber('minPrice'), maxPrice=readNumber('maxPrice');
    var priced=lower(val('priced'));

    if(search){
      var hay=[p.gisPlot,p.masterPlot,p.agent,p.mobile,p.secondAgent,p.secondMobile,p.color,p.secondColor,p.type,p.phase,p.gfa,p.features,p.comment,p.priceText,p.totalText,p.sizeText].join(' ').toLowerCase();
      if(hay.indexOf(search) === -1) return false;
    }
    if(agent && agentKey(p.agent)!==agent && agentKey(p.secondAgent)!==agent) return false;
    if(color && colorKey(p.color)!==color && colorKey(p.secondColor)!==color) return false;
    if(type && typeKey(p.type)!==type) return false;
    if(feature && !hasFeature(p, feature)) return false;
    if(phase && lower(p.phase)!==phase) return false;
    if(gfa && gfaKey(p.gfa)!==gfa) return false;

    var size=numberOf(p.size);
    if(minSize !== null && (size === null || size < minSize)) return false;
    if(maxSize !== null && (size === null || size > maxSize)) return false;
    if(!withinPriceRange(p, minPrice, maxPrice)) return false;

    var hasPrice=[numberOf(p.price), numberOf(p.secondPrice)].some(function(n){ return n !== null && n > 0; });
    if(priced==='priced' && !hasPrice) return false;
    if(priced==='unpriced' && hasPrice) return false;
    return true;
  }

  var defaultVisibility={Red:true, Blue:true, Pink:true, Other:true};
  function readVisibility(){
    var vis=Object.assign({}, defaultVisibility);
    try{
      var raw=localStorage.getItem('JAH_inventory_visibility');
      if(raw) vis=Object.assign(vis, JSON.parse(raw));
    }catch(e){}
    try{ if(window.inventoryVisibility) vis=Object.assign(vis, window.inventoryVisibility); }catch(e){}
    return vis;
  }
  function colorBucket(c){ return normalizeColor(c) || 'Other'; }
  window.isInventoryColorVisible=function(color){ var vis=readVisibility(); return vis[colorBucket(color)] !== false; };
  window.setInventoryColorVisible=function(bucket, show){
    var vis=readVisibility();
    vis[colorBucket(bucket)] = !!show;
    window.inventoryVisibility = vis;
    try{ inventoryVisibility = vis; }catch(e){}
    try{ localStorage.setItem('JAH_inventory_visibility', JSON.stringify(vis)); }catch(e){}
    return applyNow(null, {reason:'color-toggle'});
  };
  function passesVisibility(p){ try{ return window.isInventoryColorVisible(p && p.color); }catch(e){ return true; } }

  function money(x){
    var n=numberOf(x);
    if(n === null) return '';
    if(Math.abs(n) >= 1000000) return 'AED ' + (n/1000000).toFixed(2).replace(/\.00$/,'') + 'M';
    return 'AED ' + Math.round(n).toLocaleString();
  }
  function updateCount(filtered, visible){
    var c=$('count'); if(!c) return;
    visible = visible || [];
    filtered = filtered || [];
    var priced=visible.filter(function(p){ return numberOf(p.price)>0 || numberOf(p.secondPrice)>0; }).length;
    var total=visible.reduce(function(sum,p){ return sum + (numberOf(p.total)||0) + (numberOf(p.secondTotal)||0); }, 0);
    var active = hasActiveFilters();
    var html='<b>'+visible.length+'</b> plots shown';
    if(filtered.length !== visible.length) html += ' <span style="opacity:.7">('+filtered.length+' matched before color toggles)</span>';
    html += '<br>Priced: <b>'+priced+'</b> | Unpriced: <b>'+(visible.length-priced)+'</b>';
    if(total>0) html += '<br>Total priced value: <b>'+money(total)+'</b>';
    html += '<br><span style="font-size:11px;opacity:.78">Filters: '+esc(VERSION)+(active?' · active':' · no filter')+'</span>';
    c.innerHTML=html;
  }
  function hasActiveFilters(){
    return ['search','agent','color','type','v331FeatureFilter','phase','gfa','minSize','maxSize','minPrice','maxPrice','priced'].some(function(id){ var e=$(id); return e && clean(e.value); });
  }

  function clearOldMarkers(){
    var m=getMap();
    var arr=[];
    try{ if(Array.isArray(window.markers)) arr=window.markers; }catch(e){}
    if(!arr.length){ try{ if(typeof markers !== 'undefined' && Array.isArray(markers)) arr=markers; }catch(e){} }
    arr.forEach(function(obj){
      var marker=obj && obj.marker ? obj.marker : obj;
      if(!marker) return;
      try{ if(typeof marker.remove === 'function') marker.remove(); }catch(e){}
      try{ if(m && typeof m.removeLayer === 'function') m.removeLayer(marker); }catch(e){}
    });
    try{ if(window.hayatInventoryMarkerLayer && window.hayatInventoryMarkerLayer.clearLayers) window.hayatInventoryMarkerLayer.clearLayers(); }catch(e){}
    try{ if(window.hayatV3316FilterLayer && window.hayatV3316FilterLayer.clearLayers) window.hayatV3316FilterLayer.clearLayers(); }catch(e){}
    window.markers=[];
    try{ markers=[]; }catch(e){}
  }
  function getLayer(){
    var m=getMap(); if(!m || !window.L) return null;
    if(!window.hayatV3316FilterLayer){
      try{ window.hayatV3316FilterLayer = L.layerGroup().addTo(m); }catch(e){ window.hayatV3316FilterLayer = null; }
    }
    return window.hayatV3316FilterLayer;
  }
  function ensurePane(){
    var m=getMap(); if(!m) return;
    try{
      if(!m.getPane('inventoryPane')){
        m.createPane('inventoryPane');
        m.getPane('inventoryPane').style.zIndex=620;
        m.getPane('inventoryPane').style.pointerEvents='auto';
      }
    }catch(e){}
  }
  function labelFor(p){
    try{ if(typeof window.labelText === 'function') return window.labelText(p); }catch(e){}
    try{ if(typeof labelText === 'function') return labelText(p); }catch(e){}
    return clean(p && (p.gisPlot || p.masterPlot));
  }
  function labelClassFor(p){
    try{ if(typeof window.labelClass === 'function') return window.labelClass(p.color); }catch(e){}
    try{ if(typeof labelClass === 'function') return labelClass(p.color); }catch(e){}
    return 'lbl lbl-default';
  }
  function popupFor(p){
    try{ if(typeof window.popupHtml === 'function') return window.popupHtml(p); }catch(e){}
    try{ if(typeof popupHtml === 'function') return popupHtml(p); }catch(e){}
    return '<b>'+esc(p && p.gisPlot)+'</b>';
  }
  function markerColor(p){
    var hex=null;
    try{ hex=window.colorHex && window.colorHex[p.color]; }catch(e){}
    if(hex) return hex;
    var b=colorBucket(p && p.color);
    if(b==='Red') return '#e53935';
    if(b==='Blue') return '#1e88e5';
    if(b==='Pink') return '#ff5da2';
    return '#666666';
  }
  function fitIfRequested(list, doFit){
    if(!doFit) return;
    var m=getMap(); if(!m || typeof m.fitBounds !== 'function') return;
    var bounds=[];
    list.forEach(function(p){ var lat=numberOf(p.lat), lon=numberOf(p.lon); if(lat!==null && lon!==null) bounds.push([lat, lon]); });
    if(bounds.length){ try{ m.fitBounds(bounds, {padding:[80,80], animate:false}); }catch(e){} }
  }
  function directRender(filtered, doFit){
    var visible=(filtered || []).filter(function(p){ return p && numberOf(p.lat)!==null && numberOf(p.lon)!==null && passesVisibility(p); });
    clearOldMarkers();
    ensurePane();
    var layer=getLayer();
    var output=[];
    if(layer && window.L){
      visible.forEach(function(p){
        try{
          var marker=L.circleMarker([Number(p.lat), Number(p.lon)], {
            radius:7, color:'#fff', weight:1.5, fillColor:markerColor(p), fillOpacity:.92, pane:'inventoryPane', bubblingMouseEvents:false
          }).addTo(layer);
          try{ marker.bindTooltip(labelFor(p), {permanent:true, direction:'top', className:labelClassFor(p), offset:[0,-8]}); }catch(e){}
          try{ marker.bindPopup(function(){ return popupFor(p); }); }catch(e){ try{ marker.bindPopup(popupFor(p)); }catch(ex){} }
          marker.on('click', function(ev){
            var sm=false;
            try{ sm = !!window.selectionMode; }catch(e){}
            try{ if(typeof selectionMode !== 'undefined') sm = !!selectionMode; }catch(e){}
            if(sm){
              try{ if(typeof window.togglePlotSelection === 'function') window.togglePlotSelection(p.gisPlot); else if(typeof togglePlotSelection === 'function') togglePlotSelection(p.gisPlot); }catch(e){}
              try{ marker.closePopup(); }catch(e){}
              try{ if(ev && ev.originalEvent && window.L && L.DomEvent) L.DomEvent.stop(ev.originalEvent); }catch(e){}
            }
          });
          output.push({marker:marker, point:p});
        }catch(e){}
      });
    }
    window.markers=output;
    try{ markers=output; }catch(e){}
    window.currentList=visible;
    window.baseFilteredList=filtered || [];
    try{ currentList=visible; baseFilteredList=filtered || []; }catch(e){}
    try{ if(typeof window.refreshSelectionStyles === 'function') window.refreshSelectionStyles(); }catch(e){}
    try{ if(typeof window.updateSelectionPanel === 'function') window.updateSelectionPanel(); }catch(e){}
    updateCount(filtered || [], visible);
    fitIfRequested(visible, doFit === true);
    setTimeout(function(){
      try{ if(typeof window.updateLabels === 'function') window.updateLabels(); }catch(e){}
      try{ if(typeof window.refreshUnifiedPALabels === 'function') window.refreshUnifiedPALabels(); }catch(e){}
      try{ if(typeof window.refreshMasterPlanPALabels === 'function') window.refreshMasterPlanPALabels(); }catch(e){}
      try{ if(typeof window.updatePALabelZoomStyles === 'function') window.updatePALabelZoomStyles(); }catch(e){}
    }, 80);
    return visible;
  }

  function applyNow(evt, opts){
    if(evt){
      try{ if(evt.preventDefault) evt.preventDefault(); }catch(e){}
      try{ if(evt.stopPropagation) evt.stopPropagation(); }catch(e){}
      try{ if(evt.stopImmediatePropagation) evt.stopImmediatePropagation(); }catch(e){}
    }
    normalizeAll();
    var filtered=getAllPoints().filter(matches);
    if(window.showSelectedOnly && typeof window.setShowSelectedOnly === 'function'){
      try{ window.setShowSelectedOnly(false); }catch(e){}
    }
    return directRender(filtered, opts && opts.fit);
  }
  function resetNow(evt){
    if(evt){
      try{ if(evt.preventDefault) evt.preventDefault(); }catch(e){}
      try{ if(evt.stopPropagation) evt.stopPropagation(); }catch(e){}
      try{ if(evt.stopImmediatePropagation) evt.stopImmediatePropagation(); }catch(e){}
    }
    ['search','agent','color','type','v331FeatureFilter','phase','gfa','minSize','maxSize','minPrice','maxPrice','priced'].forEach(function(id){ var e=$(id); if(e) e.value=''; });
    return applyNow(null, {reason:'reset'});
  }

  window.hayatApplyFiltersNow=applyNow;
  window.hayatResetFiltersNow=resetNow;
  window.applyFiltersImmediate=applyNow;
  window.applyFilters=function(){ return applyNow(); };
  window.resetFilters=resetNow;
  window.refreshFilterOptionsFromPoints=refreshOptions;
  window.refreshHayatFilters=refreshOptions;
  window.hayatFilterDirectRender=directRender;

  function bind(id, eventName){
    var e=$(id); if(!e || e.__hayat3316Bound) return;
    e.__hayat3316Bound=true;
    e.addEventListener(eventName, function(){
      clearTimeout(window.__hayat3316Timer);
      window.__hayat3316Timer=setTimeout(function(){ applyNow(null, {reason:'input'}); }, eventName==='input' ? 180 : 90);
    }, true);
  }
  function buttonText(btn){ return lower(btn && btn.textContent); }
  function installButtons(){
    Array.prototype.forEach.call(document.querySelectorAll('button'), function(btn){
      var txt=buttonText(btn);
      if(txt === 'apply'){
        btn.type='button';
        btn.setAttribute('data-hayat-filter-button','apply');
        btn.onclick=function(ev){ applyNow(ev, {reason:'button'}); return false; };
      }else if(txt === 'reset'){
        btn.type='button';
        btn.setAttribute('data-hayat-filter-button','reset');
        btn.onclick=function(ev){ resetNow(ev); return false; };
      }
    });
  }
  function syncVisibilityCheckboxes(){
    var vis=readVisibility();
    [['showRedInventory','Red'],['showBlueInventory','Blue'],['showPinkInventory','Pink'],['showOtherInventory','Other']].forEach(function(pair){
      var e=$(pair[0]); if(e) e.checked = vis[pair[1]] !== false;
    });
  }
  function patchMutator(name){
    var fn=window[name];
    if(typeof fn !== 'function' || fn.__hayat3316Wrapped) return;
    var wrapped=function(){
      var result=fn.apply(this, arguments);
      setTimeout(function(){ refreshOptions(); applyNow(null, {reason:'mutator'}); }, 250);
      return result;
    };
    wrapped.__hayat3316Wrapped=true;
    window[name]=wrapped;
  }
  function install(){
    refreshOptions();
    syncVisibilityCheckboxes();
    installButtons();
    ['agent','color','type','v331FeatureFilter','phase','gfa','priced'].forEach(function(id){ bind(id, 'change'); });
    ['search','minSize','maxSize','minPrice','maxPrice'].forEach(function(id){ bind(id, 'input'); });
    [['showRedInventory','Red'],['showBlueInventory','Blue'],['showPinkInventory','Pink'],['showOtherInventory','Other']].forEach(function(pair){
      var e=$(pair[0]); if(e && !e.__hayat3316Color){ e.__hayat3316Color=true; e.addEventListener('change', function(ev){ window.setInventoryColorVisible(pair[1], e.checked); try{ ev.stopImmediatePropagation(); }catch(x){} }, true); }
    });
    var labelMode=$('labelMode');
    if(labelMode && !labelMode.__hayat3316Label){ labelMode.__hayat3316Label=true; labelMode.addEventListener('change', function(){ try{ if(typeof window.updateLabels === 'function') window.updateLabels(); }catch(e){} }, true); }
    ['publishCurrentPoints','importPublishedDataFile','importAgentWorkbook','savePlotEdit','deletePlotFromEditor','commitMovePlotPosition','uploadExcelFile'].forEach(patchMutator);
    applyNow(null, {reason:'install'});
  }

  document.addEventListener('click', function(ev){
    var btn=ev.target && ev.target.closest ? ev.target.closest('button') : null;
    if(!btn) return;
    var action=btn.getAttribute('data-hayat-filter-button') || buttonText(btn);
    if(action === 'apply') applyNow(ev, {reason:'capture'});
    if(action === 'reset') resetNow(ev);
  }, true);

  var __hayat3318InstallDone=false;
  function installOnce(){
    if(__hayat3318InstallDone) return;
    __hayat3318InstallDone=true;
    install();
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ setTimeout(installOnce, 500); });
  else setTimeout(installOnce, 500);
  // One safety pass only; the old repeated late passes caused visible flicker with filters and labels.
  setTimeout(function(){ if(!__hayat3318InstallDone) installOnce(); }, 1800);
})();
