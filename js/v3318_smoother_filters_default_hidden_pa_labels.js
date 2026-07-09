/* Hayat GIS v3.3.18 - Smoother filters + default hidden Master Plan PA labels
   Built on v3.3.16 working filters and v3.3.17 move handle/light labels.
   Purpose:
   - Keep filters working but reduce visible redraw/flicker.
   - Make Master Plan PA labels unchecked on first open for Admin and Agent.
   - Use one final PA label renderer, debounced and viewport-based, instead of multiple old renderers fighting each other.
*/
(function(){
  'use strict';
  var VERSION = 'v3.3.18 Smooth Labels + Default Hidden PA';
  window.HAYAT_LABEL_ENGINE_VERSION = VERSION;

  function $(id){ return document.getElementById(id); }
  function clean(v){ return String(v == null ? '' : v).replace(/\s+/g,' ').trim(); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function isAdmin(){ return /admin\.html/i.test(location.pathname) || !!$('plotEditModal') || !!document.querySelector('[data-admin="true"]'); }
  function normPA(s){
    var raw = clean(s).toUpperCase().replace(/\s+/g,'').replace(/-/g,'_');
    var m = raw.match(/^PA(\d+)_?0*(\d+)$/);
    return m ? ('PA' + Number(m[1]) + '_' + String(Number(m[2])).padStart(3,'0')) : raw;
  }
  function getPoints(){
    try{ if(Array.isArray(window.points)) return window.points; }catch(e){}
    try{ if(typeof points !== 'undefined' && Array.isArray(points)) return points; }catch(e){}
    try{ if(Array.isArray(window.HAYAT_PUBLISHED_POINTS)) return window.HAYAT_PUBLISHED_POINTS; }catch(e){}
    return [];
  }
  function existingInventorySet(){
    var set = Object.create(null);
    getPoints().forEach(function(p){
      [p && p.masterPlot, p && p.gisPlot].forEach(function(v){ var n=normPA(v); if(n) set[n]=true; });
    });
    return set;
  }
  function paLabel(pa){ return normPA(pa && (pa.t || pa.label || pa.masterPlot)); }
  function paShown(){
    var cb = $('showNonInventoryPA');
    if(cb) return !!cb.checked;
    return window.showNonInventoryPALabels === true;
  }
  function ensureStyle(){
    if($('v3318SmoothLabelsStyle')) return;
    var st = document.createElement('style');
    st.id = 'v3318SmoothLabelsStyle';
    st.textContent = [
      '.hayat-v3318-pa-label{background:transparent!important;border:0!important;box-shadow:none!important;pointer-events:auto!important;cursor:pointer!important;}',
      '.hayat-v3318-pa-label.agent-view{pointer-events:none!important;cursor:default!important;}',
      '.hayat-v3318-pa-label .pa-text{display:inline-flex;align-items:center;justify-content:center;min-width:42px;height:20px;padding:0 3px;background:transparent!important;border:0!important;box-shadow:none!important;color:rgba(15,118,110,.92)!important;font:900 10.5px Arial,sans-serif;line-height:20px;text-shadow:0 1px 2px rgba(255,255,255,.76),0 0 1px rgba(255,255,255,.90)!important;white-space:nowrap;}',
      '.hayat-v3318-pa-label.admin-view .pa-text:hover{background:rgba(255,255,255,.26)!important;border-radius:4px;}',
      '.hayat-v3318-pa-hidden-note{opacity:.72;font-size:11px;}',
      '.leaflet-pane.hayat-pa-label-pane{will-change:transform;}'
    ].join('\n');
    document.head.appendChild(st);
  }
  function getPALayer(){
    if(!window.L || !window.map) return null;
    try{
      if(!map.getPane('hayatPALabelPane')) map.createPane('hayatPALabelPane');
      var pane = map.getPane('hayatPALabelPane');
      pane.classList.add('hayat-pa-label-pane');
      pane.style.zIndex = isAdmin() ? 690 : 540;
      pane.style.pointerEvents = isAdmin() ? 'auto' : 'none';
    }catch(e){}
    if(!window.hayatV3318PALabelLayer){
      try{ window.hayatV3318PALabelLayer = L.layerGroup().addTo(map); }catch(e){ window.hayatV3318PALabelLayer = null; }
    }else{
      try{ if(!map.hasLayer(window.hayatV3318PALabelLayer)) window.hayatV3318PALabelLayer.addTo(map); }catch(e){}
    }
    return window.hayatV3318PALabelLayer;
  }
  function clearOldPALayers(){
    ['hayatPALabelLayerOld','addablePALayer','hayatAddInventoryHotspotLayer'].forEach(function(k){
      try{ if(window[k] && window.map && map.removeLayer) map.removeLayer(window[k]); }catch(e){}
      try{ window[k]=null; }catch(e){}
    });
    try{
      if(window.hayatPALabelLayer && window.hayatPALabelLayer !== window.hayatV3318PALabelLayer){
        if(window.map && map.removeLayer) map.removeLayer(window.hayatPALabelLayer);
        if(window.hayatPALabelLayer.clearLayers) window.hayatPALabelLayer.clearLayers();
      }
    }catch(e){}
    window.hayatPALabelLayer = window.hayatV3318PALabelLayer || null;
  }
  function openAddInventory(label, lat, lng){
    label = normPA(label);
    if(typeof window.hayatAddInventoryFromPA === 'function') return window.hayatAddInventoryFromPA(label, lat, lng);
    if(typeof window.openAddPlotByPA === 'function') return window.openAddPlotByPA(label, lat, lng);
    alert('Add Inventory editor is not available. Please refresh the page.');
  }
  var renderToken = 0;
  function renderPALabelsNow(){
    ensureStyle();
    var layer = getPALayer();
    if(!layer) return;
    clearOldPALayers();
    renderToken += 1;
    var token = renderToken;
    try{ layer.clearLayers(); }catch(e){}
    if(!paShown()) return;
    if(!Array.isArray(window.JAH_PA_LABELS) || !window.JAH_PA_LABELS.length) return;
    var bounds = null;
    try{ bounds = map.getBounds().pad(0.14); }catch(e){}
    var inv = existingInventorySet();
    var labels = [];
    (window.JAH_PA_LABELS || []).forEach(function(pa){
      var label = paLabel(pa); if(!label || inv[label]) return;
      var lat = Number(pa.lat), lng = Number(pa.lng); if(!isFinite(lat) || !isFinite(lng)) return;
      if(bounds && !bounds.contains([lat,lng])) return;
      labels.push({label:label, lat:lat, lng:lng});
    });
    var admin = isAdmin();
    var idx = 0, chunk = 180;
    function addChunk(){
      if(token !== renderToken) return;
      var end = Math.min(idx + chunk, labels.length);
      for(; idx < end; idx++){
        var item = labels[idx];
        try{
          var icon = L.divIcon({
            className:'hayat-v3318-pa-label ' + (admin ? 'admin-view' : 'agent-view'),
            html:'<span class="pa-text">' + esc(item.label) + '</span>',
            iconSize:[62,22],
            iconAnchor:[31,11]
          });
          var mk = L.marker([item.lat, item.lng], {
            icon:icon,
            pane:'hayatPALabelPane',
            interactive:admin,
            keyboard:false,
            bubblingMouseEvents:false,
            zIndexOffset:admin ? 3500 : 0
          });
          if(admin){
            (function(label,lat,lng,marker){
              marker.on('click mousedown dblclick contextmenu', function(e){ try{ if(e && e.originalEvent) L.DomEvent.stop(e.originalEvent); }catch(_){} });
              marker.on('click', function(){ openAddInventory(label, lat, lng); });
            })(item.label,item.lat,item.lng,mk);
          }
          mk.addTo(layer);
        }catch(e){}
      }
      if(idx < labels.length){
        if(window.requestAnimationFrame) requestAnimationFrame(addChunk);
        else setTimeout(addChunk, 0);
      }
    }
    addChunk();
  }
  function schedulePALabels(delay){
    clearTimeout(window.__hayat3318PALabelTimer);
    window.__hayat3318PALabelTimer = setTimeout(renderPALabelsNow, delay == null ? 120 : delay);
  }

  function setNonPinnedPALabelsVisible(show){
    show = !!show;
    window.showNonInventoryPALabels = show;
    var cb = $('showNonInventoryPA');
    if(cb) cb.checked = show;
    try{ localStorage.setItem('JAH_show_non_inventory_pa', show ? '1' : '0'); }catch(e){}
    schedulePALabels(20);
    try{ if(!window.HAYAT_APPLYING_SETTINGS && typeof window.saveCurrentPublishSettings === 'function') window.saveCurrentPublishSettings(); }catch(e){}
  }

  window.refreshMasterPlanPALabels = function(){ schedulePALabels(80); };
  window.refreshUnifiedPALabels = window.refreshMasterPlanPALabels;
  window.updatePALabelZoomStyles = window.refreshMasterPlanPALabels;
  window.refreshAddablePALayer = window.refreshMasterPlanPALabels;
  window.refreshAddInventoryHotspots = function(){ schedulePALabels(80); };
  window.setNonPinnedPALabelsVisible = setNonPinnedPALabelsVisible;

  function forceDefaultHidden(){
    window.showNonInventoryPALabels = false;
    try{ localStorage.setItem('JAH_show_non_inventory_pa', '0'); }catch(e){}
    var cb = $('showNonInventoryPA');
    if(cb) cb.checked = false;
    schedulePALabels(0);
  }
  function bindPALabelCheckbox(){
    var cb = $('showNonInventoryPA');
    if(!cb || cb.__hayat3318PALabelBound) return;
    cb.__hayat3318PALabelBound = true;
    cb.onchange = function(){ setNonPinnedPALabelsVisible(cb.checked); return false; };
    cb.addEventListener('change', function(ev){
      try{ ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation(); }catch(e){}
      setNonPinnedPALabelsVisible(cb.checked);
      return false;
    }, true);
  }
  function bindMapEvents(){
    if(!window.map || window.__hayat3318MapEventsBound) return;
    window.__hayat3318MapEventsBound = true;
    try{ map.on('moveend zoomend', function(){ if(paShown()) schedulePALabels(120); }); }catch(e){}
  }
  function patchFilterStatus(){
    // Keep the v3.3.16 filter logic, but make the visible status reflect this smoother build.
    window.HAYAT_FILTER_ENGINE_VERSION = 'v3.3.18 Smooth Filter Core';
    try{
      var c = $('count');
      if(c && c.innerHTML && c.innerHTML.indexOf('v3.3.16') !== -1){
        c.innerHTML = c.innerHTML.replace(/v3\.3\.16 Filter Engine Rebuild Verified/g, 'v3.3.18 Smooth Filter Core');
      }
    }catch(e){}
  }
  function init(){
    ensureStyle();
    bindPALabelCheckbox();
    bindMapEvents();
    forceDefaultHidden();
    patchFilterStatus();
    setTimeout(patchFilterStatus, 700);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  setTimeout(init, 700);
  setTimeout(function(){ forceDefaultHidden(); patchFilterStatus(); }, 1900);
})();
