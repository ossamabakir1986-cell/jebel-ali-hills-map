// Hayat GIS v3.3.22 - PA label alignment + Move Plot restore
// Loaded last. Purpose: keep v3.3.21 feature/bulk tools, but restore the original PA label anchoring
// and a reliable side-handle Move Plot tool.
(function(){
  'use strict';
  var VERSION = 'v3.3.22 PA Alignment + Move Plot Restore';
  function $(id){ return document.getElementById(id); }
  function isAdmin(){ return !!document.querySelector('[data-admin="true"]') || /admin\.html/i.test(location.pathname); }
  function clean(v){ return String(v == null ? '' : v).replace(/\s+/g,' ').trim(); }
  function html(v){ return clean(v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function points(){ return Array.isArray(window.points) ? window.points : []; }
  function toNum(v){ var n = Number(String(v == null ? '' : v).replace(/,/g,'').trim()); return isFinite(n) ? n : null; }
  function normPA(v){
    var s = clean(v).toUpperCase().replace(/\s+/g,'').replace(/-/g,'_');
    var m = s.match(/^PA(\d+)_?0*(\d+)$/);
    return m ? ('PA' + Number(m[1]) + '_' + String(Number(m[2])).padStart(3,'0')) : s;
  }
  function phaseFromPA(label){ var m = clean(label).match(/^PA(\d+)_/i); return m ? String(Number(m[1])) : ''; }
  function colorGroup(c){
    c = clean(c).toLowerCase();
    if(c.indexOf('blue') !== -1) return 'Blue';
    if(c.indexOf('pink') !== -1 || c.indexOf('hold') !== -1) return 'Pink';
    if(c.indexOf('red') !== -1) return 'Red';
    return 'Other';
  }
  function paColor(label, inv){
    if(inv && inv.color){
      var g = colorGroup(inv.color);
      if(g === 'Red') return '#c62828';
      if(g === 'Blue') return '#1565c0';
      if(g === 'Pink') return '#ad1457';
      return '#5f4b12';
    }
    var ph = phaseFromPA(label);
    var colors = {'1':'#6d4c41','2':'#00695c','4':'#7b1fa2','5':'#ad6b00','6':'#2e7d32','7':'#455a64','8':'#5d4037','10':'#283593','11':'#00838f','12':'#8d6e63','14':'#b28704','15':'#00695c'};
    return colors[ph] || '#5f4b12';
  }
  function labelOn(){ var cb = $('showNonInventoryPA'); return !!(cb && cb.checked); }
  function ensurePane(){
    if(!window.map || !map.createPane) return;
    try{
      if(!map.getPane('paLabelPane')) map.createPane('paLabelPane');
      var pane = map.getPane('paLabelPane');
      pane.style.zIndex = 505;
      pane.style.pointerEvents = 'auto';
    }catch(e){}
  }
  function inventoryMap(){
    var m = {};
    points().forEach(function(p){
      var a = normPA(p.masterPlot || ''); if(a) m[a] = p;
      var b = normPA(p.gisPlot || ''); if(b) m[b] = p;
    });
    return m;
  }
  function inBounds(pa){
    if(!window.map) return true;
    var lat = Number(pa.lat), lng = Number(pa.lng);
    if(!isFinite(lat) || !isFinite(lng)) return false;
    try{ return map.getBounds().pad(0.25).contains([lat,lng]); }catch(e){ return true; }
  }
  function clearPALayer(){
    try{ if(window.__paMasterLabelLayer) map.removeLayer(window.__paMasterLabelLayer); }catch(e){}
    try{ if(window.addablePALayer && window.addablePALayer !== window.__paMasterLabelLayer) map.removeLayer(window.addablePALayer); }catch(e){}
    window.__paMasterLabelLayer = null;
    window.addablePALayer = null;
  }
  var paToken = 0;
  function addStyles(){
    if($('v3322PaMoveCss')) return;
    var st = document.createElement('style');
    st.id = 'v3322PaMoveCss';
    st.textContent = [
      '.pa-master-label-icon{background:transparent!important;border:0!important;box-shadow:none!important;overflow:visible!important;width:1px!important;height:1px!important;}',
      '.pa-master-label-icon .pa-label-hit{position:relative!important;left:0!important;top:0!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;min-width:0!important;min-height:0!important;padding:0!important;margin:0!important;background:transparent!important;border:0!important;box-shadow:none!important;font-weight:900!important;font-size:13px!important;line-height:1!important;white-space:nowrap!important;text-shadow:0 1px 2px rgba(255,255,255,.92),0 -1px 2px rgba(255,255,255,.75),0 0 3px rgba(255,255,255,.7)!important;}',
      '.pa-master-label-icon.pa-clickable{pointer-events:auto!important;cursor:pointer!important;}',
      '.pa-master-label-icon.pa-clickable .pa-label-hit{cursor:pointer!important;padding:3px 7px!important;margin:-3px 0 0 -2px!important;}',
      '.pa-master-label-icon.pa-clickable .pa-label-hit:hover{outline:1px dashed rgba(206,163,80,.75)!important;border-radius:7px!important;background:rgba(255,255,255,.14)!important;}',
      '.pa-master-label-icon.pa-passive{pointer-events:none!important;}',
      '.move-plot-side-handle{background:transparent!important;border:0!important;}',
      '.move-plot-side-handle span{display:flex!important;align-items:center!important;justify-content:center!important;width:36px!important;height:36px!important;border-radius:999px!important;background:#0b2b21!important;color:#d4af37!important;border:2px solid #fff!important;font-weight:900!important;font-size:18px!important;box-shadow:0 2px 10px rgba(0,0,0,.38)!important;}',
      '.move-plot-side-handle span:after{content:"Move";position:absolute;left:40px;top:8px;background:rgba(11,43,33,.88);color:#fff;border-radius:6px;padding:3px 6px;font-size:10px;font-weight:700;white-space:nowrap;}'
    ].join('\n');
    document.head.appendChild(st);
  }

  function buildPALabel(pa, invMap){
    var rawLabel = pa.t || pa.label || pa.masterPlot || '';
    var label = normPA(rawLabel);
    if(!label) return null;
    var lat = Number(pa.lat), lng = Number(pa.lng);
    if(!isFinite(lat) || !isFinite(lng)) return null;
    var inv = invMap[label];
    var clickable = isAdmin() && !inv;
    var cls = 'pa-master-label-icon ' + (clickable ? 'pa-clickable' : 'pa-passive');
    // Important for alignment: the PA coordinates were generated for the original top-left text anchor.
    // Do not center the icon around the coordinate, otherwise all PA labels shift out of alignment.
    var icon = L.divIcon({
      className: cls,
      html: '<span class="pa-label-hit" style="color:' + html(paColor(label, inv)) + '">' + html(label) + '</span>',
      iconSize: [1,1],
      iconAnchor: [0,0]
    });
    var mk = L.marker([lat,lng], {icon:icon, pane:'paLabelPane', interactive:clickable, keyboard:false, zIndexOffset: clickable ? 50 : 0});
    if(clickable){
      mk.on('click', function(e){
        if(e && e.originalEvent){ try{ e.originalEvent.preventDefault(); e.originalEvent.stopPropagation(); }catch(_e){} }
        if(typeof window.openAddPlotByPA === 'function') window.openAddPlotByPA(label, lat, lng);
        else mk.openPopup();
      });
      mk.bindPopup('<div class="popup-title">' + html(label) + '</div><div class="small-note">This master-plan plot is not in inventory.</div><div class="admin-actions"><button onclick="openAddPlotByPA(\'' + html(label) + '\',' + lat + ',' + lng + ')">+ Add to Inventory</button></div>');
    }
    return mk;
  }
  window.refreshPALabelsFast = function(){
    if(!window.L || !window.map || !Array.isArray(window.JAH_PA_LABELS)) return;
    addStyles();
    paToken++;
    var token = paToken;
    if(!labelOn()){ clearPALayer(); return; }
    ensurePane();
    clearPALayer();
    var layer = L.layerGroup().addTo(map);
    window.__paMasterLabelLayer = layer;
    window.addablePALayer = layer;
    var invMap = inventoryMap();
    var labels = window.JAH_PA_LABELS.filter(inBounds);
    var i = 0;
    function chunk(){
      if(token !== paToken || !window.__paMasterLabelLayer) return;
      var end = Math.min(i + 160, labels.length);
      for(; i < end; i++){
        var mk = buildPALabel(labels[i], invMap);
        if(mk) layer.addLayer(mk);
      }
      if(i < labels.length) setTimeout(chunk, 0);
    }
    chunk();
  };
  window.refreshAddablePALayer = window.refreshPALabelsFast;
  window.addCrispMasterPlanLabels = window.refreshPALabelsFast;
  window.setNonPinnedPALabelsVisible = function(show){
    var cb = $('showNonInventoryPA');
    if(cb) cb.checked = !!show;
    window.showNonInventoryPALabels = !!show;
    try{ localStorage.setItem('JAH_show_non_inventory_pa', show ? '1' : '0'); }catch(e){}
    window.refreshPALabelsFast();
    return false;
  };

  // Reliable Move Plot side handle
  function findPoint(row){ return points().find(function(p){ return String(p.row) === String(row); }); }
  function offsetLatLng(latlng, eastMeters, northMeters){
    var lat = Number(latlng.lat != null ? latlng.lat : latlng[0]);
    var lng = Number(latlng.lng != null ? latlng.lng : latlng[1]);
    return L.latLng(lat + northMeters / 111320, lng + eastMeters / (111320 * Math.cos(lat * Math.PI / 180)));
  }
  function setPointCoords(p, lat, lng){
    p.lat = Number(lat); p.lon = Number(lng);
    p.coords = Number(lat).toFixed(7) + ', ' + Number(lng).toFixed(7);
    p.mapsUrl = 'https://www.google.com/maps?q=' + Number(lat) + ',' + Number(lng);
  }
  function findPAForPoint(p){
    if(!p || !Array.isArray(window.JAH_PA_LABELS)) return null;
    var a = normPA(p.masterPlot || ''), b = normPA(p.gisPlot || '');
    return window.JAH_PA_LABELS.find(function(pa){ var n = normPA(pa.t || pa.label || pa.masterPlot || ''); return n && (n === a || n === b); }) || null;
  }
  function updatePAForPoint(p, lat, lng){ var pa = findPAForPoint(p); if(pa){ pa.lat = Number(lat); pa.lng = Number(lng); return true; } return false; }
  function removeLayerSafe(x){ try{ if(x && window.map) map.removeLayer(x); }catch(e){} }
  function cleanupMove(){
    removeLayerSafe(window.__moveMarker); removeLayerSafe(window.__moveAnchor); removeLayerSafe(window.__moveLine);
    window.__moveMarker = null; window.__moveAnchor = null; window.__moveLine = null; window.__moveRow = null; window.__moveOffsetMeters = null; window.__moveOriginalPA = null;
  }
  function refreshAfterMove(){
    try{ if(window.HayatDataNormalize && window.HayatDataNormalize.normalizeAllPoints) window.HayatDataNormalize.normalizeAllPoints(); }catch(e){}
    try{ if(typeof window.refreshFilterOptionsFromPoints === 'function') window.refreshFilterOptionsFromPoints(); }catch(e){}
    try{ if(typeof window.applyFilters === 'function') window.applyFilters(); else if(typeof window.addMarkers === 'function') window.addMarkers(points(), false); }catch(e){}
    try{ if(typeof window.updateSelectionPanel === 'function') window.updateSelectionPanel(); }catch(e){}
    try{ if(typeof window.publishCurrentPoints === 'function') window.publishCurrentPoints(); }catch(e){}
    try{ if(typeof window.refreshPALabelsFast === 'function') window.refreshPALabelsFast(); }catch(e){}
  }
  function installMoveTool(){
    if(!isAdmin() || !window.L || !window.map) return;
    window.startMovePlotFromEditor = function(){
      var row = $('editRowId') ? $('editRowId').value : '';
      if(!row){ alert('No plot selected.'); return; }
      if(String(row).indexOf('__') === 0){ alert('Save the new plot first, then move it if needed.'); return; }
      if(typeof window.closePlotEditor === 'function') window.closePlotEditor();
      setTimeout(function(){ window.startMovePlotByRow(row); }, 30);
    };
    window.startMovePlotByRow = function(row){
      var p = findPoint(row);
      if(!p){ alert('Plot not found.'); return; }
      var lat = toNum(p.lat), lng = toNum(p.lon);
      if(lat === null || lng === null){ alert('This plot has no valid coordinates to move.'); return; }
      cleanupMove();
      var exact = L.latLng(lat, lng);
      var offset = {east: 14, north: 0};
      var handlePos = offsetLatLng(exact, offset.east, offset.north);
      var handleIcon = L.divIcon({className:'move-plot-side-handle', html:'<span>↔</span>', iconSize:[36,36], iconAnchor:[18,18]});
      var handle = L.marker(handlePos, {draggable:true, title:'Drag this side handle to move plot', icon:handleIcon, zIndexOffset:5000}).addTo(map);
      var anchor = L.circleMarker(exact, {radius:5, color:'#fff', weight:2, fillColor:'#d4af37', fillOpacity:1, interactive:false, pane:'markerPane'}).addTo(map);
      var line = L.polyline([exact, handlePos], {weight:2, opacity:.65, dashArray:'4,4', interactive:false}).addTo(map);
      window.__moveMarker = handle;
      window.__moveAnchor = anchor;
      window.__moveLine = line;
      window.__moveRow = row;
      window.__moveOffsetMeters = offset;
      var pa = findPAForPoint(p);
      window.__moveOriginalPA = pa ? {pa:pa, lat:Number(pa.lat), lng:Number(pa.lng)} : null;
      function sync(){
        var real = offsetLatLng(handle.getLatLng(), -offset.east, -offset.north);
        anchor.setLatLng(real);
        line.setLatLngs([real, handle.getLatLng()]);
      }
      handle.on('drag', sync);
      handle.on('dragend', sync);
      handle.bindPopup('<div class="popup-title">Move Plot ' + html(p.gisPlot || p.masterPlot || '') + '</div><div class="small-note">Drag the green side handle. The gold dot is the exact plot coordinate that will be saved.</div><label style="display:flex;gap:6px;align-items:center;margin:8px 0;font-size:12px;"><input id="moveUnderlyingPA" type="checkbox" checked style="width:auto;">Move underlying master-plan / empty PA point also</label><div class="admin-actions"><button onclick="commitMovePlotPosition()">Save Position</button><button class="danger" onclick="cancelMovePlotPosition()">Cancel</button></div>').openPopup();
      try{ map.panTo(exact, {animate:true}); }catch(e){}
    };
    window.commitMovePlotPosition = function(){
      var p = findPoint(window.__moveRow);
      if(!p || !window.__moveMarker){ alert('Move operation not available.'); return; }
      var off = window.__moveOffsetMeters || {east:0,north:0};
      var real = offsetLatLng(window.__moveMarker.getLatLng(), -off.east, -off.north);
      setPointCoords(p, real.lat, real.lng);
      var cb = $('moveUnderlyingPA');
      if(!cb || cb.checked) updatePAForPoint(p, real.lat, real.lng);
      cleanupMove();
      refreshAfterMove();
      alert('Plot position updated. Export the updated data/full website package and upload it to GitHub.');
    };
    window.cancelMovePlotPosition = function(){
      try{ if(window.__moveOriginalPA && window.__moveOriginalPA.pa){ window.__moveOriginalPA.pa.lat = window.__moveOriginalPA.lat; window.__moveOriginalPA.pa.lng = window.__moveOriginalPA.lng; } }catch(e){}
      cleanupMove();
    };
  }

  function boot(){
    addStyles();
    var cb = $('showNonInventoryPA');
    if(cb && !cb.__v3322Hook){
      // keep unchecked by default, but preserve current state during use
      if(cb.checked) window.refreshPALabelsFast(); else clearPALayer();
      cb.addEventListener('change', function(){ window.setNonPinnedPALabelsVisible(cb.checked); });
      cb.__v3322Hook = true;
    }
    if(window.map && !window.__v3322PAMoveHooks){
      window.__v3322PAMoveHooks = true;
      map.on('moveend zoomend', function(){ if(labelOn()) window.refreshPALabelsFast(); });
    }
    installMoveTool();
    if(window.HAYAT_FILTER_VERSION){ window.HAYAT_FILTER_VERSION = VERSION; }
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  window.addEventListener('load', function(){ setTimeout(boot, 120); });
  window.HAYAT_V3322_VERSION = VERSION;
})();
