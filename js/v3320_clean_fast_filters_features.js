// Hayat GIS v3.3.20 - Clean Fast Filters + Features + No Missing Script Dependencies
// Built as the single final compatibility layer for Admin and Agent pages.
(function(){
  'use strict';
  var VERSION = 'v3.3.20 Clean Fast Filters + Features';
  var filterTimer = null;
  var paRenderToken = 0;
  var bootDone = false;

  function byId(id){ return document.getElementById(id); }
  function clean(v){ return String(v == null ? '' : v).replace(/\s+/g,' ').trim(); }
  function lower(v){ return clean(v).toLowerCase(); }
  function html(v){ return clean(v).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function val(id){ var el = byId(id); return el ? clean(el.value) : ''; }
  function num(id){ var v = val(id); if(!v) return null; var n = Number(String(v).replace(/,/g,'')); return isFinite(n) ? n : null; }
  function isAdmin(){ return /admin/i.test(location.pathname) || !!byId('plotEditModal'); }

  function normType(v){ return (window.HayatDataNormalize && window.HayatDataNormalize.normalizeType) ? window.HayatDataNormalize.normalizeType(v) : clean(v); }
  function normColor(v){ return (window.HayatDataNormalize && window.HayatDataNormalize.normalizeColor) ? window.HayatDataNormalize.normalizeColor(v) : clean(v); }
  function normAgent(v){ return (window.HayatDataNormalize && window.HayatDataNormalize.normalizeAgent) ? window.HayatDataNormalize.normalizeAgent(v) : clean(v); }
  function normGfa(v){ return (window.HayatDataNormalize && window.HayatDataNormalize.normalizeGfa) ? window.HayatDataNormalize.normalizeGfa(v) : clean(v); }
  function normFeature(v){ return clean(v).replace(/\s*\/\s*/g,' / ').replace(/\s*,\s*/g, ', '); }
  function normPA(v){
    var s = clean(v).toUpperCase().replace(/\s+/g,'').replace(/-/g,'_');
    var m = s.match(/^PA(\d+)_?0*(\d+)$/i);
    return m ? ('PA' + m[1] + '_' + String(m[2]).padStart(3,'0')) : s;
  }
  function phaseFromPA(v){ var m = clean(v).match(/^PA(\d+)_/i); return m ? m[1] : ''; }
  function allPoints(){
    if((!Array.isArray(window.points) || !window.points.length) && Array.isArray(window.HAYAT_PUBLISHED_POINTS)) window.points = window.HAYAT_PUBLISHED_POINTS;
    return Array.isArray(window.points) ? window.points : [];
  }
  function normalizePoint(p){ if(window.HayatDataNormalize && window.HayatDataNormalize.normalizePoint) window.HayatDataNormalize.normalizePoint(p); return p; }

  function splitFeatures(v){
    return clean(v).split(/[,;|]+/).map(normFeature).filter(Boolean);
  }
  function hasFeature(p, selected){
    if(!selected) return true;
    var sel = lower(normFeature(selected));
    return splitFeatures(p.features).some(function(f){ return lower(f) === sel; });
  }

  function uniquePush(arr, v){ v = clean(v); if(v && arr.indexOf(v) === -1) arr.push(v); }
  function fillSelect(id, values, first){
    var sel = byId(id); if(!sel) return;
    var current = clean(sel.value);
    values = values.filter(Boolean).sort(function(a,b){ return String(a).localeCompare(String(b), undefined, {numeric:true, sensitivity:'base'}); });
    sel.innerHTML = '<option value="">' + html(first) + '</option>' + values.map(function(v){ return '<option value="' + html(v) + '">' + html(v) + '</option>'; }).join('');
    if(values.indexOf(current) !== -1) sel.value = current;
  }

  window.refreshFilterOptionsFromPoints = function(){
    var agents=[], colors=[], types=[], phases=[], gfas=[], features=[];
    allPoints().forEach(function(p){
      normalizePoint(p);
      uniquePush(agents, normAgent(p.agent));
      uniquePush(agents, normAgent(p.secondAgent));
      uniquePush(colors, normColor(p.color));
      uniquePush(colors, normColor(p.secondColor));
      uniquePush(types, normType(p.type));
      uniquePush(phases, clean(p.phase));
      uniquePush(gfas, normGfa(p.gfa));
      splitFeatures(p.features).forEach(function(f){ uniquePush(features, f); });
    });
    fillSelect('agent', agents, 'All agents');
    fillSelect('color', colors, 'All statuses');
    fillSelect('type', types, 'All types');
    fillSelect('phase', phases, 'All phases');
    fillSelect('gfa', gfas, 'All GFA');
    fillSelect('feature', features, 'All features');
  };

  function colorGroup(c){
    c = lower(normColor(c));
    if(c === 'red') return 'Red';
    if(c === 'blue') return 'Blue';
    if(c === 'pink' || c === 'hold' || c === 'on hold') return 'Pink';
    return 'Other';
  }
  function colorVisible(c){
    var group = colorGroup(c);
    var id = group === 'Red' ? 'showRedInventory' : group === 'Blue' ? 'showBlueInventory' : group === 'Pink' ? 'showPinkInventory' : 'showOtherInventory';
    var cb = byId(id);
    return !cb || cb.checked;
  }
  function forceSafeLayerDefaults(){
    // The exported file had Other=false in published settings. This made some agent stock disappear.
    window.inventoryVisibility = {Red:true, Blue:true, Pink:true, Other:true};
    ['showRedInventory','showBlueInventory','showPinkInventory','showOtherInventory'].forEach(function(id){ var cb = byId(id); if(cb) cb.checked = true; });
    var pa = byId('showNonInventoryPA'); if(pa) pa.checked = false;
    window.showNonInventoryPALabels = false;
    try{
      localStorage.setItem('JAH_inventory_visibility', JSON.stringify(window.inventoryVisibility));
      localStorage.setItem('JAH_show_non_inventory_pa', '0');
    }catch(e){}
  }

  function matchPoint(p){
    normalizePoint(p);
    var search = lower(val('search'));
    var agent = normAgent(val('agent'));
    var color = normColor(val('color'));
    var type = normType(val('type'));
    var feature = normFeature(val('feature'));
    var phase = clean(val('phase'));
    var gfa = normGfa(val('gfa'));
    var minSize = num('minSize'), maxSize = num('maxSize'), minPrice = num('minPrice'), maxPrice = num('maxPrice');
    var priced = val('priced');

    if(!colorVisible(p.color)) return false;
    if(search){
      var hay = [p.gisPlot,p.masterPlot,p.agent,p.mobile,p.secondAgent,p.secondMobile,p.type,p.phase,p.gfa,p.features,p.comment].map(lower).join(' | ');
      if(hay.indexOf(search) === -1) return false;
    }
    if(agent && normAgent(p.agent) !== agent && normAgent(p.secondAgent) !== agent) return false;
    if(color && normColor(p.color) !== color && normColor(p.secondColor) !== color) return false;
    if(type && normType(p.type) !== type) return false;
    if(feature && !hasFeature(p, feature)) return false;
    if(phase && clean(p.phase) !== phase) return false;
    if(gfa && normGfa(p.gfa) !== gfa) return false;
    if(minSize !== null && (!p.size || Number(p.size) < minSize)) return false;
    if(maxSize !== null && (!p.size || Number(p.size) > maxSize)) return false;
    if(minPrice !== null && (!p.price || Number(p.price) < minPrice) && (!p.secondPrice || Number(p.secondPrice) < minPrice)) return false;
    if(maxPrice !== null && (!p.price || Number(p.price) > maxPrice) && (!p.secondPrice || Number(p.secondPrice) > maxPrice)) return false;
    if(priced === 'priced' && !p.price && !p.secondPrice) return false;
    if(priced === 'unpriced' && (p.price || p.secondPrice)) return false;
    return true;
  }

  function renderFilteredNow(){
    var filtered = allPoints().filter(matchPoint);
    window.baseFilteredList = filtered;
    if(window.showSelectedOnly && typeof window.setShowSelectedOnly === 'function') window.setShowSelectedOnly(false);
    if(typeof window.addMarkers === 'function') window.addMarkers(filtered, false);
    var count = byId('count');
    if(count){
      var base = count.innerHTML || ('<b>' + filtered.length + '</b> plots shown');
      if(base.indexOf(VERSION) === -1) count.innerHTML = base + '<br><span style="font-size:11px;color:#6b6047">Filters: ' + VERSION + '</span>';
    }
  }
  window.applyFilters = function(){
    if(filterTimer) clearTimeout(filterTimer);
    filterTimer = setTimeout(renderFilteredNow, 10);
    return false;
  };
  window.hayatApplyFiltersNow = function(e){ if(e && e.preventDefault) e.preventDefault(); window.applyFilters(); return false; };
  window.resetFilters = function(){
    ['search','agent','color','type','feature','phase','gfa','minSize','maxSize','minPrice','maxPrice','priced'].forEach(function(id){ var el = byId(id); if(el) el.value = ''; });
    if(window.loadDetailFields) window.loadDetailFields();
    forceSafeLayerDefaults();
    if(window.setShowSelectedOnly) window.setShowSelectedOnly(false);
    window.baseFilteredList = allPoints();
    window.applyFilters();
    return false;
  };
  window.hayatResetFiltersNow = function(e){ if(e && e.preventDefault) e.preventDefault(); return window.resetFilters(); };

  function hookFilters(){
    ['agent','color','type','feature','phase','gfa','priced','minSize','maxSize','minPrice','maxPrice'].forEach(function(id){
      var el = byId(id); if(el && !el.__hayatV3320Hook){ el.addEventListener('change', function(){ window.applyFilters(); }); el.__hayatV3320Hook = true; }
    });
    var search = byId('search');
    if(search && !search.__hayatV3320Hook){
      search.addEventListener('input', function(){ if(filterTimer) clearTimeout(filterTimer); filterTimer = setTimeout(renderFilteredNow, 180); });
      search.__hayatV3320Hook = true;
    }
    ['showRedInventory','showBlueInventory','showPinkInventory','showOtherInventory'].forEach(function(id){
      var cb = byId(id); if(cb && !cb.__hayatV3320Hook){ cb.addEventListener('change', function(){ try{ window.inventoryVisibility[colorGroup(id.replace('show','').replace('Inventory',''))] = cb.checked; }catch(e){} window.applyFilters(); }); cb.__hayatV3320Hook = true; }
    });
    var labelMode = byId('labelMode');
    if(labelMode && !labelMode.__hayatV3320Hook){ labelMode.addEventListener('change', function(){ if(window.updateLabels) window.updateLabels(); }); labelMode.__hayatV3320Hook = true; }
  }

  // ---------------- PA labels: hidden by default, light text only, visible-area rendering ----------------
  function addLightStyles(){
    if(byId('hayat-v3320-style')) return;
    var st = document.createElement('style');
    st.id = 'hayat-v3320-style';
    st.textContent = [
      '.pa-master-label-icon{background:transparent!important;border:0!important;box-shadow:none!important;pointer-events:none;}',
      '.pa-master-label-icon span{background:transparent!important;border:0!important;box-shadow:none!important;text-shadow:0 1px 2px rgba(255,255,255,.9),0 0 2px rgba(255,255,255,.9)!important;font-weight:900!important;}',
      '.pa-master-label-icon span:before,.pa-master-label-icon span::before{display:none!important;background:transparent!important;box-shadow:none!important;}',
      '.pa-master-label-icon.pa-clickable{pointer-events:auto!important;cursor:pointer;}',
      '.move-plot-side-handle span{display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:999px;background:#0b2b21;color:#d4af37;border:2px solid #fff;font-weight:900;box-shadow:0 2px 10px rgba(0,0,0,.35);}',
      '.map-click-add-mode #map{cursor:crosshair!important;}'
    ].join('\n');
    document.head.appendChild(st);
  }
  function clearPALayers(){
    try{ if(window.__paMasterLabelLayer) window.map.removeLayer(window.__paMasterLabelLayer); }catch(e){}
    try{ if(window.addablePALayer && window.addablePALayer !== window.__paMasterLabelLayer) window.map.removeLayer(window.addablePALayer); }catch(e){}
    window.__paMasterLabelLayer = null;
    window.addablePALayer = null;
  }
  function paLabelsOn(){ var cb = byId('showNonInventoryPA'); return !!(cb && cb.checked); }
  function paInventoryMap(){
    var m = {};
    allPoints().forEach(function(p){ var a=normPA(p.masterPlot); if(a) m[a]=p; var b=normPA(p.gisPlot); if(b) m[b]=p; });
    return m;
  }
  function paColor(label, inv){
    if(inv && inv.color){ var g=colorGroup(inv.color); if(g==='Red') return '#c62828'; if(g==='Blue') return '#1565c0'; if(g==='Pink') return '#ad1457'; }
    var ph = phaseFromPA(label);
    var colors = {'1':'#6d4c41','2':'#00695c','4':'#7b1fa2','5':'#ad6b00','6':'#2e7d32','7':'#455a64','8':'#5d4037','10':'#283593','11':'#00838f','12':'#8d6e63','14':'#b28704','15':'#00695c'};
    return colors[ph] || '#5f4b12';
  }
  function ensurePAPane(){
    if(!window.map || !map.createPane) return;
    try{ if(!map.getPane('paLabelPane')) map.createPane('paLabelPane'); map.getPane('paLabelPane').style.zIndex = 505; map.getPane('paLabelPane').style.pointerEvents = 'auto'; }catch(e){}
  }
  function buildPALabelMarker(pa, invMap){
    var label = normPA(pa.t || pa.label || pa.masterPlot);
    var inv = invMap[label];
    var clickable = isAdmin() && !inv;
    var icon = L.divIcon({
      className: 'pa-master-label-icon ' + (clickable ? 'pa-clickable' : 'pa-passive'),
      html: '<span style="color:' + paColor(label, inv) + '">' + html(label) + '</span>',
      iconSize: [1,1], iconAnchor: [0,0]
    });
    var mk = L.marker([Number(pa.lat), Number(pa.lng)], {icon:icon, pane:'paLabelPane', interactive:clickable, keyboard:false});
    if(clickable){
      mk.bindPopup('<div class="popup-title">' + html(label) + '</div><div class="small-note">This master-plan plot is not in inventory.</div><div class="admin-actions"><button onclick="openAddPlotByPA(\'' + html(label) + '\',' + Number(pa.lat) + ',' + Number(pa.lng) + ')">+ Add to Inventory</button></div>');
    }
    return mk;
  }
  window.refreshPALabelsFast = function(){
    if(!window.L || !window.map || !Array.isArray(window.JAH_PA_LABELS)) return;
    paRenderToken++;
    var token = paRenderToken;
    if(!paLabelsOn()){ clearPALayers(); return; }
    ensurePAPane(); clearPALayers();
    var layer = L.layerGroup().addTo(map);
    window.__paMasterLabelLayer = layer;
    window.addablePALayer = layer;
    var invMap = paInventoryMap();
    var bounds = null;
    try{ bounds = map.getBounds().pad(0.12); }catch(e){}
    var labels = window.JAH_PA_LABELS.filter(function(pa){
      if(!pa || !isFinite(Number(pa.lat)) || !isFinite(Number(pa.lng))) return false;
      try{ return !bounds || bounds.contains([Number(pa.lat), Number(pa.lng)]); }catch(e){ return true; }
    });
    var i = 0;
    function chunk(){
      if(token !== paRenderToken || !window.__paMasterLabelLayer) return;
      var end = Math.min(i + 120, labels.length);
      for(; i < end; i++) layer.addLayer(buildPALabelMarker(labels[i], invMap));
      if(i < labels.length) setTimeout(chunk, 0);
    }
    chunk();
  };
  window.addCrispMasterPlanLabels = window.refreshPALabelsFast;
  window.refreshAddablePALayer = window.refreshPALabelsFast;
  window.setNonPinnedPALabelsVisible = function(show){
    var cb = byId('showNonInventoryPA'); if(cb) cb.checked = !!show;
    window.showNonInventoryPALabels = !!show;
    try{ localStorage.setItem('JAH_show_non_inventory_pa', show ? '1' : '0'); }catch(e){}
    window.refreshPALabelsFast();
    return false;
  };
  function hookPALabels(){
    var cb = byId('showNonInventoryPA');
    if(cb){ cb.checked = false; if(!cb.__hayatV3320PA){ cb.addEventListener('change', function(){ window.setNonPinnedPALabelsVisible(cb.checked); }); cb.__hayatV3320PA = true; } }
    clearPALayers();
    if(window.map && !window.__hayatV3320MapMove){ map.on('moveend zoomend', function(){ if(paLabelsOn()) window.refreshPALabelsFast(); }); window.__hayatV3320MapMove = true; }
  }

  // ---------------- Admin move handle offset ----------------
  function offsetLatLng(latlng, eastMeters, northMeters){
    var lat = Number(latlng.lat != null ? latlng.lat : latlng[0]);
    var lng = Number(latlng.lng != null ? latlng.lng : latlng[1]);
    return L.latLng(lat + northMeters / 111320, lng + eastMeters / (111320 * Math.cos(lat * Math.PI / 180)));
  }
  function findPointByRowFast(row){ return allPoints().find(function(x){ return String(x.row) === String(row); }); }
  function setPointCoords(p, lat, lng){ p.lat=Number(lat); p.lon=Number(lng); p.coords=Number(lat).toFixed(7)+', '+Number(lng).toFixed(7); p.mapsUrl='https://www.google.com/maps?q='+Number(lat)+','+Number(lng); }
  function findPALabelForPointFast(p){
    if(!Array.isArray(window.JAH_PA_LABELS) || !p) return null;
    var a=normPA(p.masterPlot), b=normPA(p.gisPlot);
    return window.JAH_PA_LABELS.find(function(pa){ var n=normPA(pa.t || pa.label); return n && (n===a || n===b); }) || null;
  }
  function updateUnderlyingPAFast(p, lat, lng){ var pa=findPALabelForPointFast(p); if(pa){ pa.lat=Number(lat); pa.lng=Number(lng); return true; } return false; }
  function cleanupMove(){
    try{ if(window.__moveMarker) map.removeLayer(window.__moveMarker); }catch(e){}
    try{ if(window.__moveAnchor) map.removeLayer(window.__moveAnchor); }catch(e){}
    window.__moveMarker=null; window.__moveAnchor=null; window.__moveRow=null; window.__moveOriginalPA=null; window.__moveOffsetMeters=null;
  }
  function patchMoveHandle(){
    if(!isAdmin() || !window.L || !window.map) return;
    window.startMovePlotByRow = function(row){
      var p = findPointByRowFast(row); if(!p){ alert('Plot not found.'); return; }
      cleanupMove();
      var target = L.latLng(Number(p.lat), Number(p.lon));
      var offset = {east: 11, north: 0};
      var handlePos = offsetLatLng(target, offset.east, offset.north);
      var handleIcon = L.divIcon({className:'move-plot-side-handle', html:'<span>↔</span>', iconSize:[34,34], iconAnchor:[17,17]});
      var mk = L.marker(handlePos, {draggable:true, title:'Drag side handle to move plot', icon:handleIcon, zIndexOffset:3000}).addTo(map);
      var anchor = L.circleMarker(target, {radius:4, color:'#fff', weight:2, fillColor:'#d4af37', fillOpacity:1, interactive:false}).addTo(map);
      window.__moveMarker=mk; window.__moveAnchor=anchor; window.__moveRow=row; window.__moveOffsetMeters=offset;
      var pa = findPALabelForPointFast(p);
      window.__moveOriginalPA = pa ? {pa:pa, lat:Number(pa.lat), lng:Number(pa.lng)} : null;
      function syncAnchor(){ var ll=mk.getLatLng(); var real=offsetLatLng(ll, -offset.east, -offset.north); anchor.setLatLng(real); }
      mk.on('drag', syncAnchor);
      mk.bindPopup('<div class="popup-title">Move Plot '+html(p.gisPlot||'')+'</div><div class="small-note">Drag the side handle. The gold dot is the exact coordinate that will be saved.</div><label style="display:flex;gap:6px;align-items:center;margin:8px 0;font-size:12px;"><input id="moveUnderlyingPA" type="checkbox" checked style="width:auto;">Move underlying master-plan / empty PA point also</label><div class="admin-actions"><button onclick="commitMovePlotPosition()">Save Position</button><button class="danger" onclick="cancelMovePlotPosition()">Cancel</button></div>').openPopup();
    };
    window.commitMovePlotPosition = function(){
      var p=findPointByRowFast(window.__moveRow); if(!p || !window.__moveMarker){ alert('Move operation not available.'); return; }
      var off=window.__moveOffsetMeters || {east:0,north:0};
      var real=offsetLatLng(window.__moveMarker.getLatLng(), -off.east, -off.north);
      setPointCoords(p, real.lat, real.lng);
      var cb=byId('moveUnderlyingPA'); if(!cb || cb.checked) updateUnderlyingPAFast(p, real.lat, real.lng);
      cleanupMove();
      if(window.publishCurrentPoints) window.publishCurrentPoints();
      window.applyFilters(); window.refreshPALabelsFast();
      alert('Plot position updated. Export the updated data/full website package and upload it to GitHub.');
    };
    window.cancelMovePlotPosition = function(){
      try{ if(window.__moveOriginalPA && window.__moveOriginalPA.pa){ window.__moveOriginalPA.pa.lat=window.__moveOriginalPA.lat; window.__moveOriginalPA.pa.lng=window.__moveOriginalPA.lng; } }catch(e){}
      cleanupMove();
    };
  }

  // ---------------- Features in popup/editor ----------------
  function featureVisible(){
    var cb = document.querySelector('#detailsChecklist input[data-field="features"]');
    if(cb) return cb.checked !== false;
    return !(window.detailFields && window.detailFields.features === false);
  }
  function patchFeaturePopupAndEditor(){
    if(window.__hayatV3320FeaturePatch) return;
    window.__hayatV3320FeaturePatch = true;
    if(typeof window.popupHtml === 'function'){
      var oldPopup = window.popupHtml;
      window.popupHtml = function(p){
        var out = oldPopup(p);
        if(p && p.features && featureVisible() && out.indexOf('<td>Features</td>') === -1){
          out = out.replace('</table>', '<tr><td>Features</td><td>' + html(p.features) + '</td></tr></table>');
        }
        return out;
      };
    }
    if(isAdmin()){
      var oldOpen = window.openPlotEditorByRow;
      if(typeof oldOpen === 'function'){
        window.openPlotEditorByRow = function(row){
          oldOpen.apply(this, arguments);
          var p = findPointByRowFast(row); var f = byId('editFeatures'); if(p && f) f.value = p.features || '';
        };
      }
      var oldAddPA = window.openAddPlotByPA;
      if(typeof oldAddPA === 'function'){
        window.openAddPlotByPA = function(label, lat, lng){
          oldAddPA.apply(this, arguments);
          var f = byId('editFeatures'); if(f) f.value = '';
        };
      }
      var oldSave = window.savePlotEdit;
      if(typeof oldSave === 'function'){
        window.savePlotEdit = function(){
          var row = byId('editRowId') ? byId('editRowId').value : '';
          var gis = byId('editGisPlot') ? clean(byId('editGisPlot').value) : '';
          var master = byId('editMasterPlot') ? clean(byId('editMasterPlot').value) : '';
          var feat = byId('editFeatures') ? clean(byId('editFeatures').value) : '';
          var result = oldSave.apply(this, arguments);
          var p = null;
          if(row && row.indexOf('__') !== 0) p = findPointByRowFast(row);
          if(!p && (gis || master)) p = allPoints().slice().reverse().find(function(x){ return (gis && clean(x.gisPlot)===gis) || (master && clean(x.masterPlot)===master); });
          if(p){
            p.features = feat;
            if(window.publishCurrentPoints) window.publishCurrentPoints();
            window.refreshFilterOptionsFromPoints();
            window.applyFilters();
          }
          return result;
        };
      }
    }
  }

  function initFeatureCheckbox(){
    var cb = document.querySelector('#detailsChecklist input[data-field="features"]');
    if(cb){ cb.checked = true; cb.onchange = function(){ if(typeof window.applyDetailChecklist === 'function') window.applyDetailChecklist(); if(window.markers) window.markers.forEach(function(obj){ if(obj.marker && obj.point && window.popupHtml) obj.marker.bindPopup(window.popupHtml(obj.point)); }); }; }
    if(window.detailFields) window.detailFields.features = true;
  }

  function boot(){
    addLightStyles();
    forceSafeLayerDefaults();
    if(window.HayatDataNormalize && window.HayatDataNormalize.normalizeAllPoints) window.HayatDataNormalize.normalizeAllPoints();
    initFeatureCheckbox();
    window.refreshFilterOptionsFromPoints();
    hookFilters();
    hookPALabels();
    patchMoveHandle();
    patchFeaturePopupAndEditor();
    window.applyFilters();
    bootDone = true;
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  window.addEventListener('pageshow', function(){ if(!bootDone) setTimeout(boot, 30); });
  window.addEventListener('load', function(){ setTimeout(function(){ if(!bootDone) boot(); else { forceSafeLayerDefaults(); clearPALayers(); } }, 120); });
  window.HAYAT_FILTER_VERSION = VERSION;
})();
