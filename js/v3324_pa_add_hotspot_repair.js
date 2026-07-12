// Hayat GIS v3.3.24 - PA Add Inventory Hotspot Repair
// Loaded last. Purpose: make clicking empty Master Plan PA labels reliable without moving label alignment.
// It adds a separate invisible clickable hotspot layer above the light PA labels.
(function(){
  'use strict';
  var VERSION = 'v3.3.24 PA Add Inventory Hotspot Repair';
  function $(id){ return document.getElementById(id); }
  function isAdmin(){ return !!document.querySelector('[data-admin="true"]') || /admin\.html/i.test(location.pathname); }
  function clean(v){ return String(v == null ? '' : v).replace(/\s+/g,' ').trim(); }
  function esc(v){ return clean(v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function normPA(v){
    var s = clean(v).toUpperCase().replace(/\s+/g,'').replace(/-/g,'_');
    var m = s.match(/^PA(\d+)_?0*(\d+)$/i);
    return m ? ('PA' + Number(m[1]) + '_' + String(Number(m[2])).padStart(3,'0')) : s;
  }
  function labelOn(){ var cb = $('showNonInventoryPA'); return !!(cb && cb.checked); }
  function points(){ return Array.isArray(window.points) ? window.points : []; }
  function inventoryByPA(){
    var out = {};
    points().forEach(function(p){
      var m = normPA(p.masterPlot || ''); if(m) out[m] = p;
      var g = normPA(p.gisPlot || ''); if(g) out[g] = p;
    });
    return out;
  }
  function inBounds(pa){
    if(!window.map || !map.getBounds) return true;
    var lat = Number(pa.lat), lng = Number(pa.lng);
    if(!isFinite(lat) || !isFinite(lng)) return false;
    try{ return map.getBounds().pad(0.32).contains([lat,lng]); }catch(e){ return true; }
  }
  function removeLayer(layer){ try{ if(layer && window.map) map.removeLayer(layer); }catch(e){} }
  function clearHotspots(){ removeLayer(window.__paAddHotspotLayer); window.__paAddHotspotLayer = null; }
  function ensurePane(){
    if(!window.map || !map.createPane) return;
    try{
      if(!map.getPane('paAddHotspotPane')) map.createPane('paAddHotspotPane');
      var pane = map.getPane('paAddHotspotPane');
      // Above the PA label text and ordinary markers so empty PA labels are easy to click.
      pane.style.zIndex = 690;
      pane.style.pointerEvents = 'auto';
    }catch(e){}
  }
  function addStyles(){
    if($('v3324PaAddHotspotCss')) return;
    var st = document.createElement('style');
    st.id = 'v3324PaAddHotspotCss';
    st.textContent = [
      '.pa-add-hotspot-v3324{background:transparent!important;border:0!important;box-shadow:none!important;pointer-events:auto!important;cursor:copy!important;}',
      '.pa-add-hotspot-v3324 span{display:block!important;width:98px!important;height:34px!important;margin:-8px 0 0 -8px!important;background:rgba(255,255,255,0)!important;border:0!important;border-radius:9px!important;pointer-events:auto!important;}',
      '.pa-add-hotspot-v3324:hover span{outline:2px dashed rgba(212,175,55,.9)!important;background:rgba(255,255,255,.16)!important;}',
      '.pa-add-hotspot-v3324 span:after{content:"+ Add";display:none;position:absolute;left:4px;top:-18px;background:#0b2b21;color:#d4af37;border:1px solid #d4af37;border-radius:6px;padding:2px 5px;font:800 10px Arial,sans-serif;white-space:nowrap;}',
      '.pa-add-hotspot-v3324:hover span:after{display:block;}'
    ].join('\n');
    document.head.appendChild(st);
  }
  function openAdd(label, lat, lng){
    if(typeof window.openAddPlotByPA === 'function'){
      window.openAddPlotByPA(label, Number(lat), Number(lng));
      return;
    }
    alert('Add Inventory editor is not available. Reload the Admin map and try again.');
  }
  function refreshPAAddHotspots(){
    if(!isAdmin() || !window.L || !window.map || !Array.isArray(window.JAH_PA_LABELS)){ clearHotspots(); return; }
    if(!labelOn()){ clearHotspots(); return; }
    addStyles();
    ensurePane();
    clearHotspots();
    var inv = inventoryByPA();
    var layer = L.layerGroup().addTo(map);
    window.__paAddHotspotLayer = layer;
    window.JAH_PA_LABELS.forEach(function(pa){
      if(!inBounds(pa)) return;
      var label = normPA(pa.t || pa.label || pa.masterPlot || '');
      if(!label || inv[label]) return; // only empty master-plan labels are addable
      var lat = Number(pa.lat), lng = Number(pa.lng);
      if(!isFinite(lat) || !isFinite(lng)) return;
      var icon = L.divIcon({
        className:'pa-add-hotspot-v3324',
        html:'<span title="Click to add ' + esc(label) + ' to inventory"></span>',
        iconSize:[98,34],
        iconAnchor:[0,0]
      });
      var marker = L.marker([lat,lng], {icon:icon, pane:'paAddHotspotPane', interactive:true, keyboard:false, zIndexOffset:9000});
      marker.on('click', function(e){
        if(e && e.originalEvent){
          try{ L.DomEvent.stop(e.originalEvent); }catch(_e){}
          try{ e.originalEvent.preventDefault(); e.originalEvent.stopPropagation(); }catch(_e2){}
        }
        openAdd(label, lat, lng);
      });
      marker.bindTooltip('Add ' + label + ' to inventory', {direction:'top', opacity:0.94});
      layer.addLayer(marker);
    });
  }
  function wrapPALabelRefresh(){
    if(window.__v3324RefreshWrapped) return;
    window.__v3324RefreshWrapped = true;
    var oldRefresh = window.refreshPALabelsFast;
    window.refreshPALabelsFast = function(){
      var result;
      try{ result = oldRefresh && oldRefresh.apply(this, arguments); }catch(e){ console.warn('Old PA label refresh failed:', e); }
      // PA labels render in chunks; hotspots can be immediate, and then refreshed once more after chunking.
      setTimeout(refreshPAAddHotspots, 30);
      setTimeout(refreshPAAddHotspots, 420);
      return result;
    };
    window.refreshAddablePALayer = window.refreshPALabelsFast;
    var oldSet = window.setNonPinnedPALabelsVisible;
    window.setNonPinnedPALabelsVisible = function(show){
      var result;
      try{ result = oldSet ? oldSet.apply(this, arguments) : undefined; }catch(e){ console.warn('Old PA visibility failed:', e); }
      setTimeout(refreshPAAddHotspots, 60);
      setTimeout(refreshPAAddHotspots, 450);
      return result;
    };
  }
  function hookControls(){
    var cb = $('showNonInventoryPA');
    if(cb && !cb.__v3324HotspotHooked){
      cb.__v3324HotspotHooked = true;
      cb.addEventListener('change', function(){ setTimeout(refreshPAAddHotspots, 80); });
    }
    if(window.map && !window.__v3324HotspotMapHooked){
      window.__v3324HotspotMapHooked = true;
      map.on('moveend zoomend', function(){ if(labelOn()) refreshPAAddHotspots(); });
    }
  }
  function boot(){
    wrapPALabelRefresh();
    hookControls();
    if(labelOn()) refreshPAAddHotspots(); else clearHotspots();
    window.HAYAT_PA_ADD_VERSION = VERSION;
    window.HAYAT_FILTER_VERSION = window.HAYAT_FILTER_VERSION || VERSION;
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  window.addEventListener('load', function(){ setTimeout(boot, 180); setTimeout(boot, 900); });
})();
