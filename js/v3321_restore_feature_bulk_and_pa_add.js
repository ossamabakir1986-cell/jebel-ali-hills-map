// Hayat GIS v3.3.21 - Restore Feature Bulk Editing + PA Label Add Inventory
// Built on v3.3.20 clean fast filters. Keeps v3.3.20 performance and restores Admin editing tools.
(function(){
  'use strict';
  var VERSION = 'v3.3.21 Feature Bulk + PA Add Restore';
  var paRenderToken = 0;

  function $(id){ return document.getElementById(id); }
  function clean(v){ return String(v == null ? '' : v).replace(/\s+/g,' ').trim(); }
  function html(v){ return clean(v).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function key(v){ return clean(v).toLowerCase().replace(/[\s_\-\/]+/g,' '); }
  function isAdmin(){ return /admin\.html/i.test(location.pathname) || !!$('plotEditModal'); }
  function allPoints(){ return Array.isArray(window.points) ? window.points : []; }

  var STANDARD_FEATURES = [
    'Corner',
    'Single Row',
    'Back to Back',
    'Park Facing',
    'Green Belt Facing',
    'Vastu / Plot Facing Direction',
    'End Unit'
  ];

  function canonicalFeature(v){
    var k = key(v);
    var aliases = {
      'corner':'Corner',
      'single':'Single Row',
      'single row':'Single Row',
      'back to back':'Back to Back',
      'backtoback':'Back to Back',
      'back back':'Back to Back',
      'double row':'Back to Back',
      'park':'Park Facing',
      'park facing':'Park Facing',
      'green belt':'Green Belt Facing',
      'greenbelt':'Green Belt Facing',
      'green belt facing':'Green Belt Facing',
      'vastu':'Vastu / Plot Facing Direction',
      'vatsu':'Vastu / Plot Facing Direction',
      'plot facing direction':'Vastu / Plot Facing Direction',
      'facing direction':'Vastu / Plot Facing Direction',
      'direction':'Vastu / Plot Facing Direction',
      'end':'End Unit',
      'end unit':'End Unit',
      'end plot':'End Unit'
    };
    if(aliases[k]) return aliases[k];
    for(var i=0;i<STANDARD_FEATURES.length;i++){
      if(key(STANDARD_FEATURES[i]) === k) return STANDARD_FEATURES[i];
    }
    return clean(v);
  }

  function parseFeatures(v){
    var out = [], seen = {};
    clean(v).split(/[,;|]+/).forEach(function(part){
      var f = canonicalFeature(part);
      if(f && !seen[key(f)]){ seen[key(f)] = true; out.push(f); }
    });
    return out;
  }
  function formatFeatures(v){ return parseFeatures(v).join(', '); }
  function hasFeature(p, f){
    var k = key(canonicalFeature(f));
    return parseFeatures(p && p.features).some(function(x){ return key(x) === k; });
  }

  window.HAYAT_STANDARD_FEATURES = STANDARD_FEATURES.slice();
  window.HayatFeatureTools = Object.assign({}, window.HayatFeatureTools || {}, {
    features: STANDARD_FEATURES.slice(),
    parse: parseFeatures,
    format: formatFeatures,
    canonical: canonicalFeature,
    has: hasFeature
  });

  function addCss(){
    if($('v3321RestoreCss')) return;
    var st = document.createElement('style');
    st.id = 'v3321RestoreCss';
    st.textContent = [
      '.v3321-feature-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px 8px;margin-top:7px}',
      '.v3321-feature-grid label{display:flex!important;align-items:center;gap:6px;font-size:12px;background:rgba(255,255,255,.72);border:1px solid rgba(206,163,80,.25);border-radius:8px;padding:6px;color:#1f2933}',
      '.v3321-feature-grid input{width:auto!important;margin:0!important}',
      '.v3321-feature-other{margin-top:7px!important}',
      '.v3321-feature-note{font-size:11px;color:#6b6250;margin-top:5px;line-height:1.25}',
      '.v3321-bulk-box{margin-top:12px;padding-top:10px;border-top:1px solid rgba(206,163,80,.32)}',
      '.v3321-bulk-box .row{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:6px}',
      '.v3321-bulk-box select,.v3321-bulk-box input{min-width:0}',
      '.v3321-bulk-actions{display:grid;grid-template-columns:1fr;gap:6px;margin-top:6px}',
      '.v3321-mini-note{font-size:11px;color:#6b6250;margin-top:4px}',
      '.pa-master-label-icon{background:transparent!important;border:0!important;box-shadow:none!important;pointer-events:auto!important}',
      '.pa-master-label-icon .pa-label-hit{position:relative;display:inline-flex;align-items:center;justify-content:center;min-width:54px;min-height:24px;padding:2px 7px;margin:-4px -8px;background:transparent!important;border:0!important;box-shadow:none!important;font-weight:900;font-size:13px;line-height:1;white-space:nowrap;text-shadow:0 1px 2px rgba(255,255,255,.88),0 -1px 2px rgba(255,255,255,.72)}',
      '.pa-master-label-icon.pa-clickable .pa-label-hit{cursor:pointer}',
      '.pa-master-label-icon.pa-clickable .pa-label-hit:hover{outline:1px dashed rgba(206,163,80,.7);border-radius:7px;background:rgba(255,255,255,.10)!important}',
      '.pa-master-label-icon.pa-passive .pa-label-hit{pointer-events:none}'
    ].join('\n');
    document.head.appendChild(st);
  }

  function ensureFeatureEditor(){
    if(!isAdmin()) return;
    var input = $('editFeatures');
    if(!input || $('v3321FeatureGrid')) return;
    input.placeholder = 'Selected features appear here automatically';
    var grid = document.createElement('div');
    grid.id = 'v3321FeatureGrid';
    grid.className = 'v3321-feature-grid';
    grid.innerHTML = STANDARD_FEATURES.map(function(f){
      return '<label><input class="v3321-feature-check" type="checkbox" value="' + html(f) + '"> ' + html(f) + '</label>';
    }).join('');
    var other = document.createElement('input');
    other.id = 'v3321FeatureOther';
    other.className = 'v3321-feature-other';
    other.placeholder = 'Other feature notes, optional';
    var note = document.createElement('div');
    note.className = 'v3321-feature-note';
    note.textContent = 'Tick standard plot features or type custom notes. They will be saved into the Features field.';
    input.insertAdjacentElement('afterend', note);
    input.insertAdjacentElement('afterend', other);
    input.insertAdjacentElement('afterend', grid);
    Array.prototype.forEach.call(document.querySelectorAll('.v3321-feature-check'), function(cb){ cb.addEventListener('change', syncFeatureChecksToInput); });
    other.addEventListener('input', syncFeatureChecksToInput);
    input.addEventListener('input', function(){ fillFeatureChecks(input.value, true); });
  }

  function syncFeatureChecksToInput(){
    var input = $('editFeatures'); if(!input) return;
    var vals = [];
    Array.prototype.forEach.call(document.querySelectorAll('.v3321-feature-check'), function(cb){ if(cb.checked) vals.push(cb.value); });
    var other = $('v3321FeatureOther');
    if(other && clean(other.value)) vals.push(other.value);
    input.value = formatFeatures(vals.join(', '));
  }

  function fillFeatureChecks(value, fromManualInput){
    var input = $('editFeatures'); if(!input) return;
    ensureFeatureEditor();
    var vals = parseFeatures(value), flags = {}, standard = {};
    vals.forEach(function(v){ flags[key(v)] = true; });
    STANDARD_FEATURES.forEach(function(f){ standard[key(f)] = true; });
    Array.prototype.forEach.call(document.querySelectorAll('.v3321-feature-check'), function(cb){ cb.checked = !!flags[key(cb.value)]; });
    var otherVals = vals.filter(function(v){ return !standard[key(v)]; });
    var other = $('v3321FeatureOther'); if(other) other.value = otherVals.join(', ');
    if(!fromManualInput) input.value = formatFeatures(vals.join(', '));
  }

  function selectedList(){
    if(typeof window.selectedList === 'function') return window.selectedList();
    var sel = window.selectedPlots || {};
    return allPoints().filter(function(p){ return !!sel[String(p.gisPlot || '')]; });
  }
  function recalc(p){
    try{ if(typeof window.recalcPlotFinancials === 'function') window.recalcPlotFinancials(p); }catch(e){}
    try{ if(window.HayatDataNormalize && window.HayatDataNormalize.normalizePoint) window.HayatDataNormalize.normalizePoint(p); }catch(e){}
  }
  function refreshAfterBulk(){
    try{ if(window.HayatDataNormalize && window.HayatDataNormalize.normalizeAllPoints) window.HayatDataNormalize.normalizeAllPoints(); }catch(e){}
    try{ if(typeof window.refreshFilterOptionsFromPoints === 'function') window.refreshFilterOptionsFromPoints(); }catch(e){}
    try{ if(typeof window.applyFilters === 'function') window.applyFilters(); else if(typeof window.addMarkers === 'function') window.addMarkers(allPoints(), false); }catch(e){}
    try{ if(typeof window.updateSelectionPanel === 'function') window.updateSelectionPanel(); }catch(e){}
    try{ if(typeof window.publishCurrentPoints === 'function') window.publishCurrentPoints(); }catch(e){}
    try{ if(typeof window.refreshAddablePALayer === 'function') window.refreshAddablePALayer(); }catch(e){}
  }
  function ensureBulkEditor(){
    if(!isAdmin() || $('v3321BulkBox')) return;
    var selectionBox = $('selectionBox'); if(!selectionBox) return;
    var box = document.createElement('div');
    box.id = 'v3321BulkBox';
    box.className = 'v3321-bulk-box';
    box.innerHTML = '<div class="selection-title">Bulk edit selected</div>' +
      '<div class="row"><select id="v3321BulkField">' +
      '<option value="appendFeatures">Append feature</option>' +
      '<option value="features">Replace all features</option>' +
      '<option value="clearFeatures">Clear features</option>' +
      '<option value="gfa">Set GFA</option>' +
      '<option value="color">Set status</option>' +
      '<option value="type">Set type</option>' +
      '<option value="phase">Set phase</option>' +
      '<option value="agent">Set agent</option>' +
      '<option value="mobile">Set mobile</option>' +
      '<option value="price">Set AED/sqft</option>' +
      '</select><input id="v3321BulkValue" placeholder="Value"></div>' +
      '<div class="row"><select id="v3321BulkFeaturePreset"><option value="">Standard feature...</option>' + STANDARD_FEATURES.map(function(f){ return '<option value="' + html(f) + '">' + html(f) + '</option>'; }).join('') + '</select>' +
      '<button type="button" onclick="applyV3321BulkEditSelected()">Apply to Selected</button></div>' +
      '<div class="v3321-mini-note">Use Select Plots first, then apply features or other changes to all selected plots.</div>';
    selectionBox.appendChild(box);
    var preset = $('v3321BulkFeaturePreset'), value = $('v3321BulkValue');
    if(preset && value){ preset.addEventListener('change', function(){ if(preset.value) value.value = preset.value; }); }
  }

  window.applyV3321BulkEditSelected = function(){
    var list = selectedList();
    if(!list.length){ alert('No selected plots. Press Select Plots, choose plots, then apply bulk edit.'); return; }
    var field = $('v3321BulkField') ? $('v3321BulkField').value : '';
    var value = $('v3321BulkValue') ? clean($('v3321BulkValue').value) : '';
    if(field !== 'clearFeatures' && !value){ alert('Enter a value or choose a standard feature.'); return; }
    list.forEach(function(p){
      if(field === 'features') p.features = formatFeatures(value);
      else if(field === 'appendFeatures') p.features = formatFeatures([p.features, value].filter(Boolean).join(', '));
      else if(field === 'clearFeatures') p.features = '';
      else if(field === 'gfa') p.gfa = value;
      else if(field === 'color') p.color = value;
      else if(field === 'type') p.type = value;
      else if(field === 'phase') p.phase = value;
      else if(field === 'agent') p.agent = value;
      else if(field === 'mobile') p.mobile = value;
      else if(field === 'price') p.price = value === '' ? null : Number(String(value).replace(/,/g,''));
      recalc(p);
    });
    refreshAfterBulk();
    alert('Bulk update applied to ' + list.length + ' selected plot(s). Remember to export/upload updated map data.');
  };

  function patchEditor(){
    if(!isAdmin() || window.__v3321EditorPatched) return;
    window.__v3321EditorPatched = true;
    ensureFeatureEditor();
    var oldOpen = window.openPlotEditorByRow;
    if(typeof oldOpen === 'function'){
      window.openPlotEditorByRow = function(row){
        var result = oldOpen.apply(this, arguments);
        ensureFeatureEditor();
        var p = allPoints().find(function(x){ return String(x.row) === String(row); });
        fillFeatureChecks(p ? p.features : '');
        return result;
      };
    }
    var oldAdd = window.openAddPlotByPA;
    if(typeof oldAdd === 'function'){
      window.openAddPlotByPA = function(label, lat, lng){
        var result = oldAdd.apply(this, arguments);
        ensureFeatureEditor();
        fillFeatureChecks('');
        return result;
      };
    }
    var oldSave = window.savePlotEdit;
    if(typeof oldSave === 'function'){
      window.savePlotEdit = function(){
        syncFeatureChecksToInput();
        return oldSave.apply(this, arguments);
      };
    }
  }

  function normPA(v){
    var s = clean(v).toUpperCase().replace(/\s+/g,'').replace(/-/g,'_');
    var m = s.match(/^PA(\d+)_?0*(\d+)$/i);
    return m ? ('PA' + Number(m[1]) + '_' + String(Number(m[2])).padStart(3,'0')) : s;
  }
  function phaseFromPA(label){ var m = clean(label).match(/^PA(\d+)_/i); return m ? String(Number(m[1])) : ''; }
  function inventoryMapByPA(){
    var map = {};
    allPoints().forEach(function(p){
      var m = normPA(p.masterPlot || ''); if(m) map[m] = p;
      var g = normPA(p.gisPlot || ''); if(g) map[g] = p;
    });
    return map;
  }
  function colorGroup(c){
    c = key(c);
    if(c === 'red') return 'Red';
    if(c === 'blue') return 'Blue';
    if(c === 'pink' || c === 'hold' || c === 'on hold') return 'Pink';
    return 'Other';
  }
  function paColor(label, inv){
    if(inv && inv.color){
      var g = colorGroup(inv.color);
      if(g === 'Red') return '#c62828';
      if(g === 'Blue') return '#1565c0';
      if(g === 'Pink') return '#ad1457';
    }
    var ph = phaseFromPA(label);
    var colors = {'1':'#6d4c41','2':'#00695c','4':'#7b1fa2','5':'#ad6b00','6':'#2e7d32','7':'#455a64','8':'#5d4037','10':'#283593','11':'#00838f','12':'#8d6e63','14':'#b28704','15':'#00695c'};
    return colors[ph] || '#5f4b12';
  }
  function paLabelsOn(){ var cb = $('showNonInventoryPA'); return !!(cb && cb.checked); }
  function clearPALayer(){
    try{ if(window.__paMasterLabelLayer) window.map.removeLayer(window.__paMasterLabelLayer); }catch(e){}
    try{ if(window.addablePALayer && window.addablePALayer !== window.__paMasterLabelLayer) window.map.removeLayer(window.addablePALayer); }catch(e){}
    window.__paMasterLabelLayer = null;
    window.addablePALayer = null;
  }
  function ensurePAPane(){
    if(!window.map || !window.map.createPane) return;
    try{
      if(!map.getPane('paLabelPane')) map.createPane('paLabelPane');
      map.getPane('paLabelPane').style.zIndex = 540;
      map.getPane('paLabelPane').style.pointerEvents = 'auto';
    }catch(e){}
  }
  function inExpandedBounds(pa){
    try{
      var b = map.getBounds().pad(0.25);
      return b.contains([Number(pa.lat), Number(pa.lng)]);
    }catch(e){ return true; }
  }

  window.refreshPALabelsFast = function(){
    if(!window.L || !window.map || !Array.isArray(window.JAH_PA_LABELS)) return;
    paRenderToken++;
    var token = paRenderToken;
    if(!paLabelsOn()){ clearPALayer(); return; }
    ensurePAPane();
    clearPALayer();
    var layer = L.layerGroup().addTo(map);
    window.__paMasterLabelLayer = layer;
    window.addablePALayer = layer;
    var invMap = inventoryMapByPA();
    var labels = window.JAH_PA_LABELS.filter(inExpandedBounds);
    var i = 0, chunk = 120;
    function drawChunk(){
      if(token !== paRenderToken || !window.__paMasterLabelLayer) return;
      var end = Math.min(i + chunk, labels.length);
      for(; i<end; i++){
        var pa = labels[i];
        var label = normPA(pa.t || pa.label || pa.masterPlot || '');
        if(!label || !isFinite(Number(pa.lat)) || !isFinite(Number(pa.lng))) continue;
        var inv = invMap[label];
        var clickable = isAdmin() && !inv;
        var col = paColor(label, inv);
        var cls = 'pa-master-label-icon ' + (clickable ? 'pa-clickable' : 'pa-passive');
        var icon = L.divIcon({
          className: cls,
          html: '<span class="pa-label-hit" style="color:' + html(col) + '">' + html(label) + '</span>',
          iconSize: [76,28],
          iconAnchor: [38,14]
        });
        var mk = L.marker([Number(pa.lat), Number(pa.lng)], {icon:icon, pane:'paLabelPane', interactive:clickable, keyboard:false, zIndexOffset: clickable ? 20 : 0});
        if(clickable){
          (function(m,label,lat,lng){
            var popup = '<div class="popup-title">' + html(label) + '</div><div class="small-note">This master-plan plot is not in inventory.</div><div class="admin-actions"><button onclick="openAddPlotByPA(\'' + html(label) + '\',' + Number(lat) + ',' + Number(lng) + ')">+ Add to Inventory</button></div>';
            m.bindPopup(popup);
            m.on('click', function(){ if(typeof window.openAddPlotByPA === 'function') window.openAddPlotByPA(label, Number(lat), Number(lng)); });
          })(mk, label, pa.lat, pa.lng);
        }
        mk.addTo(layer);
      }
      if(i < labels.length) setTimeout(drawChunk, 0);
    }
    drawChunk();
  };

  window.refreshAddablePALayer = window.refreshPALabelsFast;
  window.setNonPinnedPALabelsVisible = function(show){
    var cb = $('showNonInventoryPA'); if(cb) cb.checked = !!show;
    window.showNonInventoryPALabels = !!show;
    try{ localStorage.setItem('JAH_show_non_inventory_pa', show ? '1':'0'); }catch(e){}
    window.refreshPALabelsFast();
    try{ if(!window.HAYAT_APPLYING_SETTINGS && typeof window.saveCurrentPublishSettings === 'function') window.saveCurrentPublishSettings(); }catch(e){}
  };

  function patchPAControl(){
    var cb = $('showNonInventoryPA');
    if(cb && !cb.__v3321Bound){
      cb.__v3321Bound = true;
      cb.addEventListener('change', function(){ window.setNonPinnedPALabelsVisible(cb.checked); });
    }
    if(window.map && !window.__v3321PAMapEvents){
      window.__v3321PAMapEvents = true;
      map.on('moveend zoomend', function(){ if(paLabelsOn()) window.refreshPALabelsFast(); });
    }
  }

  function updateVersionLine(){
    var count = $('count');
    if(count && count.innerHTML.indexOf('v3.3.21') === -1){
      count.innerHTML += '<br><small>Tools: ' + html(VERSION) + '</small>';
    }
  }

  function boot(){
    addCss();
    ensureFeatureEditor();
    ensureBulkEditor();
    patchEditor();
    patchPAControl();
    try{ allPoints().forEach(function(p){ if(p.features) p.features = formatFeatures(p.features); }); }catch(e){}
    updateVersionLine();
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ setTimeout(boot, 80); });
  else setTimeout(boot, 80);
  setTimeout(boot, 700);
  setTimeout(boot, 1600);
})();
