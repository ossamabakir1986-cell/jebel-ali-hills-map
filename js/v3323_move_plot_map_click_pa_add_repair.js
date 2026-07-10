// Hayat GIS v3.3.23 - Move Plot map-click + PA add repair
// Loaded last. Keeps v3.3.20/21 filters/features, keeps v3.3.22 PA alignment,
// and makes Move Plot usable by both dragging the side handle and clicking the target map location.
(function(){
  'use strict';
  var VERSION = 'v3.3.23 Move Plot Map Click + PA Add Repair';
  function byId(id){ return document.getElementById(id); }
  function isAdmin(){ return !!document.querySelector('[data-admin="true"]') || /admin\.html/i.test(location.pathname); }
  function clean(v){ return String(v == null ? '' : v).replace(/\s+/g,' ').trim(); }
  function esc(v){ return clean(v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function points(){ return Array.isArray(window.points) ? window.points : []; }
  function num(v){ var n = Number(String(v == null ? '' : v).replace(/,/g,'').trim()); return isFinite(n) ? n : null; }
  function normPA(v){
    var s = clean(v).toUpperCase().replace(/\s+/g,'').replace(/-/g,'_');
    var m = s.match(/^PA(\d+)_?0*(\d+)$/);
    return m ? ('PA' + Number(m[1]) + '_' + String(Number(m[2])).padStart(3,'0')) : s;
  }
  function colorGroup(c){
    c = clean(c).toLowerCase();
    if(c.indexOf('blue') !== -1) return 'Blue';
    if(c.indexOf('pink') !== -1 || c.indexOf('hold') !== -1) return 'Pink';
    if(c.indexOf('red') !== -1) return 'Red';
    return 'Other';
  }
  function phaseFromPA(label){ var m = clean(label).match(/^PA(\d+)_/i); return m ? String(Number(m[1])) : ''; }
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
  function labelOn(){ var cb = byId('showNonInventoryPA'); return !!(cb && cb.checked); }
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
    try{ return map.getBounds().pad(0.28).contains([lat,lng]); }catch(e){ return true; }
  }
  function removeSafe(x){ try{ if(x && window.map) map.removeLayer(x); }catch(e){} }
  function clearPALabelLayer(){
    removeSafe(window.__paMasterLabelLayer);
    try{ if(window.addablePALayer && window.addablePALayer !== window.__paMasterLabelLayer) map.removeLayer(window.addablePALayer); }catch(e){}
    window.__paMasterLabelLayer = null;
    window.addablePALayer = null;
  }
  function addStyles(){
    if(byId('v3323MovePaCss')) return;
    var st = document.createElement('style');
    st.id = 'v3323MovePaCss';
    st.textContent = [
      '.pa-master-label-icon{background:transparent!important;border:0!important;box-shadow:none!important;overflow:visible!important;}',
      '.pa-master-label-icon .pa-label-visible{position:absolute!important;left:0!important;top:0!important;display:inline-block!important;background:transparent!important;border:0!important;box-shadow:none!important;font-weight:900!important;font-size:13px!important;line-height:1!important;white-space:nowrap!important;text-shadow:0 1px 2px rgba(255,255,255,.94),0 -1px 2px rgba(255,255,255,.80),0 0 3px rgba(255,255,255,.74)!important;}',
      '.pa-master-label-icon .pa-click-target{position:absolute!important;left:-8px!important;top:-8px!important;width:74px!important;height:28px!important;background:rgba(255,255,255,0)!important;border:0!important;border-radius:8px!important;}',
      '.pa-master-label-icon.pa-clickable{pointer-events:auto!important;cursor:pointer!important;}',
      '.pa-master-label-icon.pa-clickable:hover .pa-click-target{outline:1px dashed rgba(206,163,80,.65)!important;background:rgba(255,255,255,.10)!important;}',
      '.pa-master-label-icon.pa-passive{pointer-events:none!important;}',
      '.move-plot-side-handle{background:transparent!important;border:0!important;}',
      '.move-plot-side-handle span{position:relative;display:flex!important;align-items:center!important;justify-content:center!important;width:40px!important;height:40px!important;border-radius:999px!important;background:#0b2b21!important;color:#d4af37!important;border:2px solid #fff!important;font-weight:900!important;font-size:19px!important;box-shadow:0 2px 12px rgba(0,0,0,.42)!important;}',
      '.move-plot-side-handle span:after{content:"Drag / click map";position:absolute;left:43px;top:9px;background:rgba(11,43,33,.90);color:#fff;border-radius:6px;padding:3px 6px;font-size:10px;font-weight:700;white-space:nowrap;}',
      '.move-plot-help{position:absolute;z-index:1200;left:50%;transform:translateX(-50%);bottom:22px;background:rgba(11,43,33,.94);color:#fff;border:1px solid rgba(212,175,55,.55);border-radius:12px;padding:10px 14px;font-size:12px;box-shadow:0 5px 20px rgba(0,0,0,.32);max-width:520px;text-align:center;pointer-events:auto;}',
      '.move-plot-help b{color:#d4af37;}',
      '.move-plot-help button{margin-left:8px;border:0;border-radius:7px;background:#d4af37;color:#08251c;font-weight:800;padding:5px 9px;cursor:pointer;}'
    ].join('\n');
    document.head.appendChild(st);
  }

  // ---------- PA label click repair ----------
  var paToken = 0;
  function buildPALabel(pa, invMap){
    var raw = pa.t || pa.label || pa.masterPlot || '';
    var label = normPA(raw);
    if(!label) return null;
    var lat = Number(pa.lat), lng = Number(pa.lng);
    if(!isFinite(lat) || !isFinite(lng) || !window.L) return null;
    var inv = invMap[label];
    var clickable = isAdmin() && !inv;
    var cls = 'pa-master-label-icon ' + (clickable ? 'pa-clickable' : 'pa-passive');
    // iconAnchor [0,0] preserves the original top-left PA text alignment.
    // The invisible click target is offset around the text without moving the visible number.
    var icon = L.divIcon({
      className: cls,
      html: '<span class="pa-click-target"></span><span class="pa-label-visible" style="color:' + esc(paColor(label, inv)) + '">' + esc(label) + '</span>',
      iconSize: [82, 30],
      iconAnchor: [0, 0]
    });
    var marker = L.marker([lat,lng], {icon:icon, pane:'paLabelPane', interactive:clickable, keyboard:false, zIndexOffset:clickable ? 60 : 0});
    if(clickable){
      marker.on('click', function(e){
        if(e && e.originalEvent){ try{ e.originalEvent.preventDefault(); e.originalEvent.stopPropagation(); }catch(_e){} }
        if(typeof window.openAddPlotByPA === 'function') window.openAddPlotByPA(label, lat, lng);
      });
      marker.bindPopup('<div class="popup-title">' + esc(label) + '</div><div class="small-note">This master-plan plot is not in inventory.</div><div class="admin-actions"><button onclick="openAddPlotByPA(\'' + esc(label) + '\',' + lat + ',' + lng + ')">+ Add to Inventory</button></div>');
    }
    return marker;
  }
  window.refreshPALabelsFast = function(){
    if(!window.L || !window.map || !Array.isArray(window.JAH_PA_LABELS)) return;
    addStyles();
    paToken++;
    var token = paToken;
    if(!labelOn()){ clearPALabelLayer(); return; }
    ensurePane();
    clearPALabelLayer();
    var layer = L.layerGroup().addTo(map);
    window.__paMasterLabelLayer = layer;
    window.addablePALayer = layer;
    var invMap = inventoryMap();
    var labels = window.JAH_PA_LABELS.filter(inBounds);
    var i = 0;
    function chunk(){
      if(token !== paToken || !window.__paMasterLabelLayer) return;
      var end = Math.min(i + 180, labels.length);
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
    var cb = byId('showNonInventoryPA');
    if(cb) cb.checked = !!show;
    window.showNonInventoryPALabels = !!show;
    try{ localStorage.setItem('JAH_show_non_inventory_pa', show ? '1' : '0'); }catch(e){}
    window.refreshPALabelsFast();
    return false;
  };

  // ---------- Move Plot repair ----------
  function findPoint(row){ return points().find(function(p){ return String(p.row) === String(row); }); }
  function offsetLatLng(latlng, eastMeters, northMeters){
    var lat = Number(latlng.lat != null ? latlng.lat : latlng[0]);
    var lng = Number(latlng.lng != null ? latlng.lng : latlng[1]);
    return L.latLng(lat + (northMeters || 0) / 111320, lng + (eastMeters || 0) / (111320 * Math.cos(lat * Math.PI / 180)));
  }
  function setPointCoords(p, lat, lng){
    p.lat = Number(lat);
    p.lon = Number(lng);
    p.lng = Number(lng);
    p.coords = Number(lat).toFixed(7) + ', ' + Number(lng).toFixed(7);
    p.mapsUrl = 'https://www.google.com/maps?q=' + Number(lat) + ',' + Number(lng);
  }
  function findPAForPoint(p){
    if(!p || !Array.isArray(window.JAH_PA_LABELS)) return null;
    var a = normPA(p.masterPlot || ''), b = normPA(p.gisPlot || '');
    return window.JAH_PA_LABELS.find(function(pa){
      var n = normPA(pa.t || pa.label || pa.masterPlot || '');
      return n && (n === a || n === b);
    }) || null;
  }
  function updatePAForPoint(p, lat, lng){ var pa = findPAForPoint(p); if(pa){ pa.lat = Number(lat); pa.lng = Number(lng); return true; } return false; }
  function removeMoveHelp(){ var el = byId('movePlotHelp'); if(el && el.parentNode) el.parentNode.removeChild(el); }
  function showMoveHelp(){
    removeMoveHelp();
    var box = document.createElement('div');
    box.id = 'movePlotHelp';
    box.className = 'move-plot-help';
    box.innerHTML = '<b>Move Plot active:</b> click the exact new location on the map, or drag the green side handle. The gold dot is the coordinate that will be saved. <button onclick="commitMovePlotPosition()">Save Position</button><button onclick="cancelMovePlotPosition()">Cancel</button>';
    document.body.appendChild(box);
  }
  function cleanupMove(){
    try{ if(window.__moveClickHandler && window.map) map.off('click', window.__moveClickHandler); }catch(e){}
    window.__moveClickHandler = null;
    removeSafe(window.__moveMarker);
    removeSafe(window.__moveAnchor);
    removeSafe(window.__moveLine);
    window.__moveMarker = null;
    window.__moveAnchor = null;
    window.__moveLine = null;
    window.__moveRow = null;
    window.__moveOffsetMeters = null;
    window.__moveOriginalPA = null;
    removeMoveHelp();
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
      var row = byId('editRowId') ? byId('editRowId').value : '';
      if(!row){ alert('No plot selected.'); return; }
      if(String(row).indexOf('__') === 0){ alert('Save the new plot first, then move it if needed.'); return; }
      if(typeof window.closePlotEditor === 'function') window.closePlotEditor();
      setTimeout(function(){ window.startMovePlotByRow(row); }, 60);
    };
    window.startMovePlotByRow = function(row){
      var p = findPoint(row);
      if(!p){ alert('Plot not found.'); return; }
      var lat = num(p.lat), lng = num(p.lon != null ? p.lon : p.lng);
      if(lat === null || lng === null){ alert('This plot has no valid coordinates to move.'); return; }
      cleanupMove();
      addStyles();
      try{ map.closePopup(); }catch(e){}
      var exact = L.latLng(lat, lng);
      var offset = {east: 18, north: 0};
      var handlePos = offsetLatLng(exact, offset.east, offset.north);
      var handleIcon = L.divIcon({className:'move-plot-side-handle', html:'<span>↔</span>', iconSize:[40,40], iconAnchor:[20,20]});
      var handle = L.marker(handlePos, {draggable:true, title:'Drag this side handle to move plot', icon:handleIcon, zIndexOffset:7000}).addTo(map);
      var anchor = L.circleMarker(exact, {radius:7, color:'#08251c', weight:2, fillColor:'#d4af37', fillOpacity:1, interactive:false, pane:'markerPane'}).addTo(map);
      var line = L.polyline([exact, handlePos], {weight:2, opacity:.8, dashArray:'4,4', interactive:false}).addTo(map);
      window.__moveMarker = handle;
      window.__moveAnchor = anchor;
      window.__moveLine = line;
      window.__moveRow = row;
      window.__moveOffsetMeters = offset;
      var pa = findPAForPoint(p);
      window.__moveOriginalPA = pa ? {pa:pa, lat:Number(pa.lat), lng:Number(pa.lng)} : null;
      function setExact(newExact){
        if(!newExact) return;
        var e = L.latLng(newExact.lat, newExact.lng);
        var hp = offsetLatLng(e, offset.east, offset.north);
        anchor.setLatLng(e);
        handle.setLatLng(hp);
        line.setLatLngs([e, hp]);
      }
      function syncFromHandle(){
        var e = offsetLatLng(handle.getLatLng(), -offset.east, -offset.north);
        anchor.setLatLng(e);
        line.setLatLngs([e, handle.getLatLng()]);
      }
      handle.on('drag dragend', syncFromHandle);
      window.__moveClickHandler = function(ev){
        if(!window.__moveMarker || !window.__moveAnchor) return;
        setExact(ev.latlng);
      };
      // Slight delay prevents the original click that opened the editor from being treated as a move click.
      setTimeout(function(){ try{ map.on('click', window.__moveClickHandler); }catch(e){} }, 120);
      handle.bindPopup('<div class="popup-title">Move Plot ' + esc(p.gisPlot || p.masterPlot || '') + '</div><div class="small-note">Either click the exact new location on the map, or drag the green side handle. The gold dot is the coordinate that will be saved.</div><label style="display:flex;gap:6px;align-items:center;margin:8px 0;font-size:12px;"><input id="moveUnderlyingPA" type="checkbox" checked style="width:auto;">Move underlying master-plan / empty PA point also</label><div class="admin-actions"><button onclick="commitMovePlotPosition()">Save Position</button><button class="danger" onclick="cancelMovePlotPosition()">Cancel</button></div>').openPopup();
      showMoveHelp();
      try{ map.panTo(exact, {animate:true}); }catch(e){}
    };
    window.commitMovePlotPosition = function(){
      var p = findPoint(window.__moveRow);
      if(!p || !window.__moveAnchor){ alert('Move operation not available.'); return; }
      var real = window.__moveAnchor.getLatLng();
      setPointCoords(p, real.lat, real.lng);
      var cb = byId('moveUnderlyingPA');
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
    var cb = byId('showNonInventoryPA');
    if(cb && !cb.__v3323Hooked){
      if(cb.checked) window.refreshPALabelsFast(); else clearPALabelLayer();
      cb.addEventListener('change', function(){ window.setNonPinnedPALabelsVisible(cb.checked); });
      cb.__v3323Hooked = true;
    }
    if(window.map && !window.__v3323MapHooks){
      window.__v3323MapHooks = true;
      map.on('moveend zoomend', function(){ if(labelOn()) window.refreshPALabelsFast(); });
    }
    installMoveTool();
    window.HAYAT_FILTER_VERSION = VERSION;
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  window.addEventListener('load', function(){ setTimeout(boot, 160); });
  window.HAYAT_V3323_VERSION = VERSION;
})();
