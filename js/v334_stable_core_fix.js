/* Hayat GIS v3.3.4 Stable Core Fix
   - Restores Master Plan PA labels
   - Fixes Red/Blue/Pink layer toggles with performance renderer
   - Stabilizes Display Labels
   - Keeps plot characteristics as separate standard choices while storing compatible comma text
*/
(function(){
  'use strict';
  var FEATURES = ['Corner','End Unit','Back to Back','Single Row','Park Facing','Green Belt Facing','Vastu','Irregular Shape'];
  window.HAYAT_STANDARD_FEATURES = FEATURES.slice();
  function $(id){ return document.getElementById(id); }
  function txt(v){ return String(v == null ? '' : v).replace(/\s+/g,' ').trim(); }
  function key(v){ return txt(v).toLowerCase().replace(/[\s_\-\/]+/g,' '); }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function canonicalFeature(v){
    var k = key(v);
    var aliases = {
      'corner':'Corner',
      'end':'End Unit','end unit':'End Unit','end plot':'End Unit','corner end':'End Unit',
      'back to back':'Back to Back','backtoback':'Back to Back','back-to-back':'Back to Back',
      'single row':'Single Row','single':'Single Row',
      'park':'Park Facing','park facing':'Park Facing',
      'green belt':'Green Belt Facing','green belt facing':'Green Belt Facing','greenbelt':'Green Belt Facing',
      'vastu':'Vastu','vatsu':'Vastu','north east':'Vastu','northeast':'Vastu',
      'irregular':'Irregular Shape','irregular shape':'Irregular Shape'
    };
    if(aliases[k]) return aliases[k];
    for(var i=0;i<FEATURES.length;i++){ if(key(FEATURES[i])===k) return FEATURES[i]; }
    return txt(v);
  }
  function parseFeatures(v){
    var raw = Array.isArray(v) ? v.join(',') : String(v||'');
    var out=[], seen={};
    raw.split(/[;,|]+/).forEach(function(part){
      var c = canonicalFeature(part); if(!c) return;
      var k = key(c); if(seen[k]) return;
      seen[k]=true; out.push(c);
    });
    return out;
  }
  function formatFeatures(v){ return parseFeatures(v).join(', '); }
  function hasFeature(p, f){
    var k = key(canonicalFeature(f));
    return parseFeatures(p && p.features).some(function(x){ return key(x)===k; });
  }
  window.HayatFeatureTools = {features:FEATURES.slice(), parse:parseFeatures, format:formatFeatures, has:hasFeature, canonical:canonicalFeature};

  function normalizePA(v){
    var s = String(v||'').trim().toUpperCase().replace(/\s+/g,'').replace('-', '_');
    var m = s.match(/^PA(\d+)_?0*(\d+)$/);
    return m ? ('PA'+Number(m[1])+'_'+String(Number(m[2])).padStart(3,'0')) : s;
  }
  function inventoryPASet(){
    var set={};
    (window.points||[]).forEach(function(p){
      [p.masterPlot,p.gisPlot].forEach(function(v){ var n=normalizePA(v); if(n) set[n]=true; });
    });
    return set;
  }
  function makePALabelText(pa){ return normalizePA(pa.t || pa.label || pa.masterPlot || ''); }

  function ensurePALayer(){
    if(!window.L || !window.map) return null;
    if(!map.getPane('hayatPALabelPane')){
      map.createPane('hayatPALabelPane');
      map.getPane('hayatPALabelPane').style.zIndex = 510;
      map.getPane('hayatPALabelPane').style.pointerEvents = 'none';
    }
    if(!window.hayatPALabelLayer) window.hayatPALabelLayer = L.layerGroup().addTo(map);
    return window.hayatPALabelLayer;
  }
  function renderPALabels(){
    var layer = ensurePALayer(); if(!layer) return;
    layer.clearLayers();
    var show = window.showNonInventoryPALabels !== false;
    var cb = $('showNonInventoryPA'); if(cb) { show = !!cb.checked; window.showNonInventoryPALabels = show; }
    if(!show || !window.JAH_PA_LABELS) return;
    var inv = inventoryPASet();
    (window.JAH_PA_LABELS||[]).forEach(function(pa){
      var label = makePALabelText(pa);
      if(!label || inv[label]) return;
      var lat = Number(pa.lat), lng = Number(pa.lng);
      if(!isFinite(lat) || !isFinite(lng)) return;
      var icon = L.divIcon({
        className: 'hayat-pa-label-only',
        html: '<span>'+esc(label)+'</span>',
        iconSize: [60,18],
        iconAnchor: [30,9]
      });
      L.marker([lat,lng], {icon:icon, pane:'hayatPALabelPane', interactive:false, keyboard:false}).addTo(layer);
    });
  }
  window.refreshMasterPlanPALabels = renderPALabels;
  window.updatePALabelZoomStyles = renderPALabels;
  window.setNonPinnedPALabelsVisible = function(show){
    window.showNonInventoryPALabels = !!show;
    try{ localStorage.setItem('JAH_show_non_inventory_pa', show ? '1':'0'); }catch(e){}
    renderPALabels();
    try{ if(!window.HAYAT_APPLYING_SETTINGS && typeof window.saveCurrentPublishSettings==='function') window.saveCurrentPublishSettings(); }catch(e){}
  };

  function colorBucket(color){
    var c = String(color||'').toLowerCase();
    if(c==='red') return 'Red'; if(c==='blue') return 'Blue'; if(c==='pink') return 'Pink'; return 'Other';
  }
  window.setInventoryColorVisible = function(bucket, show){
    try{
      if(typeof inventoryVisibility !== 'undefined') inventoryVisibility[bucket] = !!show;
      if(window.inventoryVisibility) window.inventoryVisibility[bucket] = !!show;
      localStorage.setItem('JAH_inventory_visibility', JSON.stringify(typeof inventoryVisibility !== 'undefined' ? inventoryVisibility : window.inventoryVisibility || {}));
    }catch(e){}
    try{ if(window.hayatResetRenderCaches) window.hayatResetRenderCaches(); }catch(e){}
    if(typeof window.applyFiltersImmediate === 'function') window.applyFiltersImmediate();
    else if(typeof window.applyFilters === 'function') window.applyFilters();
    else if(typeof window.addMarkers === 'function') window.addMarkers(window.baseFilteredList || window.points || [], false);
    try{ if(!window.HAYAT_APPLYING_SETTINGS && typeof window.saveCurrentPublishSettings === 'function') window.saveCurrentPublishSettings(); }catch(e){}
    setTimeout(renderPALabels, 100);
  };
  var oldVisible = window.isInventoryColorVisible || (typeof isInventoryColorVisible==='function' ? isInventoryColorVisible : null);
  window.isInventoryColorVisible = function(color){
    try{
      var vis = (typeof inventoryVisibility !== 'undefined') ? inventoryVisibility : (window.inventoryVisibility || {Red:true,Blue:true,Pink:true,Other:true});
      return vis[colorBucket(color)] !== false;
    }catch(e){ return oldVisible ? oldVisible(color) : true; }
  };

  function selectedFeatures(){
    var out=[];
    var sel=$('v331FeatureFilter'); if(sel && sel.value) out.push(sel.value);
    document.querySelectorAll('[data-v34-feature-filter]:checked').forEach(function(cb){ out.push(cb.value); });
    var seen={};
    return out.map(canonicalFeature).filter(function(f){ var k=key(f); if(!f || seen[k]) return false; seen[k]=true; return true; });
  }
  function baseFilterMatch(p){
    function val(id){var e=$(id); return e ? e.value : '';}
    function num(id){var v=val(id); if(v==='') return null; var n=Number(String(v).replace(/,/g,'')); return isNaN(n)?null:n;}
    function normType(v){ if(window.HayatNormalizeTypeV32) return window.HayatNormalizeTypeV32(v); if(window.HayatDataNormalize && window.HayatDataNormalize.normalizeType) return window.HayatDataNormalize.normalizeType(v); return key(v); }
    var search=val('search').toLowerCase(), agent=val('agent'), color=val('color'), type=val('type'), phase=val('phase'), gfa=val('gfa');
    var minSize=num('minSize'), maxSize=num('maxSize'), minPrice=num('minPrice'), maxPrice=num('maxPrice'), priced=val('priced');
    if(search && !([p.gisPlot,p.masterPlot,p.agent,p.mobile,p.secondAgent,p.secondMobile,p.type,p.gfa,p.features].join(' ').toLowerCase().includes(search))) return false;
    if(agent && p.agent!==agent && p.secondAgent!==agent) return false;
    if(color && colorBucket(p.color)!==color && colorBucket(p.secondColor)!==color) return false;
    if(type && normType(p.type)!==normType(type)) return false;
    if(phase && String(p.phase)!==String(phase)) return false;
    if(gfa && String(p.gfa)!==String(gfa)) return false;
    if(minSize!==null && (!p.size || p.size<minSize)) return false;
    if(maxSize!==null && (!p.size || p.size>maxSize)) return false;
    if(minPrice!==null && (!p.price || p.price<minPrice) && (!p.secondPrice || p.secondPrice<minPrice)) return false;
    if(maxPrice!==null && (!p.price || p.price>maxPrice) && (!p.secondPrice || p.secondPrice>maxPrice)) return false;
    if(priced==='priced' && !p.price && !p.secondPrice) return false;
    if(priced==='unpriced' && (p.price || p.secondPrice)) return false;
    var fs=selectedFeatures(); for(var i=0;i<fs.length;i++){ if(!hasFeature(p, fs[i])) return false; }
    return true;
  }
  window.applyFiltersImmediate = function(){
    var filtered=(window.points||[]).filter(baseFilterMatch);
    window.baseFilteredList=filtered;
    if(typeof window.addMarkers==='function') window.addMarkers(filtered, false);
    var c=$('count'); if(c) c.textContent=filtered.length+' plot(s)';
    setTimeout(renderPALabels,100);
    return filtered;
  };
  window.applyFilters = function(){
    clearTimeout(window.__hayat334FilterTimer);
    window.__hayat334FilterTimer=setTimeout(window.applyFiltersImmediate, 60);
  };

  function currentDisplay(){
    try{
      var k = document.getElementById('plotEditModal') ? 'HAYAT_V32_ADMIN_DISPLAY' : 'HAYAT_V32_AGENT_DISPLAY';
      return JSON.parse(localStorage.getItem(k) || '{}') || {};
    }catch(e){ return {}; }
  }
  function saveDisplayFromChecks(){
    var labels={};
    document.querySelectorAll('[data-v32-label]').forEach(function(cb){ labels[cb.getAttribute('data-v32-label')]=!!cb.checked; });
    var mode=$('v32OfferMode');
    var obj={labels:labels, offerMode:(mode && mode.value)||'cheapest'};
    try{ localStorage.setItem(document.getElementById('plotEditModal') ? 'HAYAT_V32_ADMIN_DISPLAY' : 'HAYAT_V32_AGENT_DISPLAY', JSON.stringify(obj)); }catch(e){}
    if($('labelMode')) $('labelMode').value = 'custom';
    if(window.hayatResetRenderCaches) window.hayatResetRenderCaches();
    if(typeof window.updateLabels==='function') window.updateLabels();
  }
  function wireDisplayLabels(){
    document.querySelectorAll('[data-v32-label]').forEach(function(cb){ if(!cb.__hayat334){ cb.__hayat334=true; cb.addEventListener('change', saveDisplayFromChecks); } });
    var offer=$('v32OfferMode'); if(offer && !offer.__hayat334){ offer.__hayat334=true; offer.addEventListener('change', saveDisplayFromChecks); }
    var sel=$('labelMode'); if(sel && !sel.__hayat334){
      sel.__hayat334=true;
      sel.addEventListener('change', function(){
        var labels={};
        var m=sel.value||'masterPlot';
        labels[m==='custom'?'masterPlot':m]=true;
        document.querySelectorAll('[data-v32-label]').forEach(function(cb){ cb.checked=!!labels[cb.getAttribute('data-v32-label')]; });
        saveDisplayFromChecks();
      });
    }
  }

  function rebuildFeatureEditor(){
    var input=$('editFeaturesV32'); if(!input) return;
    input.style.display='none';
    var old=$('v334FeatureGrid'); if(old) return;
    var html='<div id="v334FeatureGrid" class="v331-feature-grid">'+FEATURES.map(function(f){return '<label><input class="v334-feature-check" type="checkbox" value="'+esc(f)+'"> '+esc(f)+'</label>';}).join('')+'</div><input id="v334FeatureOther" class="v331-feature-other" placeholder="Other characteristic, optional">';
    input.insertAdjacentHTML('afterend', html);
    function sync(){
      var vals=[]; document.querySelectorAll('.v334-feature-check').forEach(function(cb){ if(cb.checked) vals.push(cb.value); });
      var other=$('v334FeatureOther'); if(other && txt(other.value)) vals.push(other.value);
      input.value=formatFeatures(vals.join(', '));
    }
    document.querySelectorAll('.v334-feature-check').forEach(function(cb){ cb.addEventListener('change', sync); });
    var other=$('v334FeatureOther'); if(other) other.addEventListener('input', sync);
  }
  function fillFeatureEditor(v){
    rebuildFeatureEditor();
    var vals=parseFeatures(v), map={}; vals.forEach(function(f){map[key(f)]=true;});
    var std={}; FEATURES.forEach(function(f){std[key(f)]=true;});
    document.querySelectorAll('.v334-feature-check').forEach(function(cb){ cb.checked=!!map[key(cb.value)]; });
    var otherVals=vals.filter(function(f){return !std[key(f)];});
    var other=$('v334FeatureOther'); if(other) other.value=otherVals.join(', ');
    var input=$('editFeaturesV32'); if(input) input.value=formatFeatures(v);
  }
  var oldOpen = window.openPlotEditorByRow;
  if(typeof oldOpen==='function'){
    window.openPlotEditorByRow=function(row){ oldOpen.apply(this, arguments); setTimeout(function(){
      var p=(window.points||[]).find(function(x){return String(x.row)===String(row);}); fillFeatureEditor(p ? p.features : '');
    },0); };
  }
  var oldSave = window.savePlotEdit;
  if(typeof oldSave==='function'){
    window.savePlotEdit=function(){
      var input=$('editFeaturesV32');
      if(input) input.value=formatFeatures(input.value);
      oldSave.apply(this, arguments);
      (window.points||[]).forEach(function(p){ if(p.features) p.features=formatFeatures(p.features); });
    };
  }

  function addCss(){
    if($('v334Css')) return;
    var st=document.createElement('style'); st.id='v334Css';
    st.textContent='.hayat-pa-label-only span{display:inline-block;background:rgba(245,245,245,.84);border:1px solid rgba(60,60,60,.30);border-radius:5px;padding:1px 5px;font:10px Arial;color:#333;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,.15);}.v331-feature-grid label{cursor:pointer}.v331-feature-grid input,.v334-feature-check{accent-color:#b9954d}';
    document.head.appendChild(st);
  }
  function init(){
    addCss(); wireDisplayLabels();
    // v3.3.18 owns Master Plan PA label rendering and checkbox events.
    ['showRedInventory','showBlueInventory','showPinkInventory','showOtherInventory'].forEach(function(id){ var el=$(id); if(el && !el.__hayat334){ el.__hayat334=true; var b=id.replace('show','').replace('Inventory',''); el.addEventListener('change', function(){ window.setInventoryColorVisible(b, this.checked); }); } });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', function(){setTimeout(init,300);}); else setTimeout(init,300);
  setTimeout(init,1200); setTimeout(init,2600);
})();
