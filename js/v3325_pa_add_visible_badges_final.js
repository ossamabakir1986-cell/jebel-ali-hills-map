// Hayat GIS v3.3.25 - Visible PA Add Badges Final
// Purpose: make Admin Add Inventory from empty Master Plan PA labels obvious and clickable.
// This file is loaded last and does not change filters, bulk features, Move Plot, or Agent view-only behavior.
(function(){
  'use strict';
  var VERSION = 'v3.3.25 Visible PA Add Badges Final';
  var renderTimer = null;

  function $(id){ return document.getElementById(id); }
  function clean(v){ return String(v == null ? '' : v).replace(/\s+/g,' ').trim(); }
  function esc(v){ return clean(v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function isAdmin(){ return /admin\.html/i.test(location.pathname) || !!$('plotEditModal'); }
  function labelsOn(){ var cb = $('showNonInventoryPA'); return !!(cb && cb.checked); }
  function allPoints(){ return Array.isArray(window.points) ? window.points : []; }

  function normPA(v){
    var s = clean(v).toUpperCase().replace(/\s+/g,'').replace(/-/g,'_');
    var m = s.match(/^PA\s*(\d+)\s*_?\s*0*(\d+)$/i) || s.match(/^PA(\d+)_?0*(\d+)$/i);
    return m ? ('PA' + Number(m[1]) + '_' + String(Number(m[2])).padStart(3,'0')) : s;
  }

  function buildInventoryIndex(){
    var idx = Object.create(null);
    allPoints().forEach(function(p){
      ['masterPlot','Master Plan Plot','gisPlot','GIS plot number','plot','plotNumber'].forEach(function(k){
        var v = p && p[k];
        var n = normPA(v);
        if(n) idx[n] = true;
      });
    });
    return idx;
  }

  function inVisibleBounds(pa){
    if(!window.map || !map.getBounds) return true;
    var lat = Number(pa.lat), lng = Number(pa.lng);
    if(!isFinite(lat) || !isFinite(lng)) return false;
    try { return map.getBounds().pad(0.22).contains([lat, lng]); } catch(e){ return true; }
  }

  function clearBadges(){
    try{ if(window.__paAddBadgeLayer && window.map) map.removeLayer(window.__paAddBadgeLayer); }catch(e){}
    window.__paAddBadgeLayer = null;
  }

  function ensurePane(){
    if(!window.map || !map.createPane) return;
    try{
      if(!map.getPane('paAddBadgePane')) map.createPane('paAddBadgePane');
      var pane = map.getPane('paAddBadgePane');
      pane.style.zIndex = 735;
      pane.style.pointerEvents = 'auto';
    }catch(e){}
  }

  function addCss(){
    if($('v3325PaAddBadgeCss')) return;
    var st = document.createElement('style');
    st.id = 'v3325PaAddBadgeCss';
    st.textContent = [
      '.pa-add-badge-v3325{background:transparent!important;border:0!important;box-shadow:none!important;pointer-events:auto!important;}',
      '.pa-add-badge-v3325 button{display:inline-flex;align-items:center;justify-content:center;height:22px;min-width:42px;padding:0 7px;border-radius:999px;border:1px solid #0b2b21;background:#d4af37;color:#0b2b21;font:900 11px Arial,sans-serif;box-shadow:0 1px 5px rgba(0,0,0,.25);cursor:pointer;pointer-events:auto;white-space:nowrap;}',
      '.pa-add-badge-v3325 button:hover{background:#f3d36b;transform:scale(1.08);}',
      '.pa-add-badge-v3325 button:active{transform:scale(.96);}',
      '.v3325-pa-add-guide{position:absolute;left:50%;top:14px;transform:translateX(-50%);z-index:900;background:rgba(11,43,33,.92);color:#f5d36a;border:1px solid rgba(212,175,55,.85);border-radius:999px;padding:7px 11px;font:800 12px Arial,sans-serif;box-shadow:0 3px 13px rgba(0,0,0,.20);pointer-events:none;}',
      '@media(max-width:700px){.v3325-pa-add-guide{top:52px;font-size:11px;padding:6px 9px}}'
    ].join('\n');
    document.head.appendChild(st);
  }

  function openAdd(label, lat, lng){
    if(typeof window.openAddPlotByPA === 'function'){
      try{ window.openAddPlotByPA(label, Number(lat), Number(lng)); return; }catch(e){ console.error('openAddPlotByPA failed', e); }
    }
    alert('Add Inventory editor is not ready. Please reload Admin map, turn on Master Plan PA labels, and try again.');
  }

  function showGuide(){
    if(!isAdmin()) return;
    var mapEl = $('map'); if(!mapEl) return;
    var old = $('v3325PaAddGuide'); if(old) old.remove();
    if(!labelsOn()) return;
    var div = document.createElement('div');
    div.id = 'v3325PaAddGuide';
    div.className = 'v3325-pa-add-guide';
    div.textContent = 'Gold + Add badges = empty master-plan plots';
    mapEl.appendChild(div);
    setTimeout(function(){ try{ div.remove(); }catch(e){} }, 5000);
  }

  function renderBadgesNow(){
    if(!isAdmin() || !window.L || !window.map || !Array.isArray(window.JAH_PA_LABELS) || !labelsOn()){
      clearBadges();
      return;
    }
    addCss();
    ensurePane();
    clearBadges();

    var inv = buildInventoryIndex();
    var layer = L.layerGroup().addTo(map);
    window.__paAddBadgeLayer = layer;

    var count = 0;
    window.JAH_PA_LABELS.forEach(function(pa){
      if(!inVisibleBounds(pa)) return;
      var label = normPA(pa.t || pa.label || pa.masterPlot || '');
      if(!label || inv[label]) return;
      var lat = Number(pa.lat), lng = Number(pa.lng);
      if(!isFinite(lat) || !isFinite(lng)) return;

      var icon = L.divIcon({
        className: 'pa-add-badge-v3325',
        html: '<button type="button" title="Add ' + esc(label) + ' to inventory">+ Add</button>',
        iconSize: [54, 24],
        // Negative X anchor intentionally places the badge to the right of the PA number instead of hiding it behind the label.
        iconAnchor: [-18, 12]
      });
      var marker = L.marker([lat, lng], {
        icon: icon,
        pane: 'paAddBadgePane',
        interactive: true,
        keyboard: false,
        zIndexOffset: 12000
      });
      marker.on('click', function(e){
        if(e && e.originalEvent){
          try{ L.DomEvent.stop(e.originalEvent); }catch(_e){}
          try{ e.originalEvent.preventDefault(); e.originalEvent.stopPropagation(); }catch(_e2){}
        }
        openAdd(label, lat, lng);
      });
      marker.bindTooltip('Add ' + label + ' to inventory', {direction:'top', opacity:0.95});
      layer.addLayer(marker);
      count++;
    });
    window.HAYAT_PA_ADD_BADGE_COUNT = count;
  }

  function scheduleRender(delay){
    clearTimeout(renderTimer);
    renderTimer = setTimeout(renderBadgesNow, delay == null ? 60 : delay);
  }

  function wrapRefreshes(){
    if(window.__v3325PaAddWrapped) return;
    window.__v3325PaAddWrapped = true;

    var oldRefresh = window.refreshPALabelsFast;
    window.refreshPALabelsFast = function(){
      var result;
      try{ result = oldRefresh && oldRefresh.apply(this, arguments); }catch(e){ console.warn('PA label refresh failed before v3325:', e); }
      scheduleRender(90);
      scheduleRender(520);
      return result;
    };
    window.refreshAddablePALayer = window.refreshPALabelsFast;

    var oldSet = window.setNonPinnedPALabelsVisible;
    window.setNonPinnedPALabelsVisible = function(show){
      var result;
      try{ result = oldSet ? oldSet.apply(this, arguments) : undefined; }catch(e){ console.warn('PA label visibility failed before v3325:', e); }
      if(show){ showGuide(); scheduleRender(120); scheduleRender(650); }
      else clearBadges();
      return result;
    };
  }

  function hookControls(){
    var cb = $('showNonInventoryPA');
    if(cb && !cb.__v3325AddBadgeHooked){
      cb.__v3325AddBadgeHooked = true;
      cb.addEventListener('change', function(){
        if(cb.checked){ showGuide(); scheduleRender(140); scheduleRender(750); }
        else clearBadges();
      });
    }
    if(window.map && !window.__v3325AddBadgeMapHooked){
      window.__v3325AddBadgeMapHooked = true;
      map.on('moveend zoomend', function(){ if(labelsOn()) scheduleRender(90); });
    }
  }

  function addLayerPanelHint(){
    var box = $('mapLayerControls');
    if(!box || $('v3325PaAddPanelHint') || !isAdmin()) return;
    var div = document.createElement('div');
    div.id = 'v3325PaAddPanelHint';
    div.className = 'layer-note';
    div.innerHTML = 'To add a missing plot: turn on <b>Master Plan PA labels</b>, then click the gold <b>+ Add</b> beside the empty PA number.';
    box.appendChild(div);
  }

  function boot(){
    addCss();
    addLayerPanelHint();
    wrapRefreshes();
    hookControls();
    if(labelsOn()){ scheduleRender(200); scheduleRender(900); }
    else clearBadges();
    window.HAYAT_PA_ADD_VERSION = VERSION;
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  window.addEventListener('load', function(){ setTimeout(boot, 200); setTimeout(boot, 1100); });
})();
