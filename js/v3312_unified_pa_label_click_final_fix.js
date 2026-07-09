/* Hayat GIS v3.3.12 - Unified PA Label Click FINAL Fix
   - Removes remaining separate Add Inventory + pins/hotspots from the active workflow.
   - Makes the Master Plan PA label itself the only Add Inventory click target.
   - Forces PA labels to be interactive even after checkbox/filter refreshes.
   - Keeps Add/Edit form calculated detail behavior from v3.3.11.
*/
(function(){
  'use strict';
  function $(id){return document.getElementById(id);} 
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function normPA(s){
    var raw=String(s||'').trim().toUpperCase().replace(/\s+/g,'').replace('-', '_');
    var m=raw.match(/^PA(\d+)_?0*(\d+)$/);
    return m ? ('PA'+Number(m[1])+'_'+String(Number(m[2])).padStart(3,'0')) : raw;
  }
  function paLabel(pa){return normPA(pa && (pa.t||pa.label||pa.masterPlot));}
  function isAdmin(){return /admin\.html/i.test(location.pathname) || !!$('plotEditModal');}
  function invSet(){
    var set={};
    (window.points||[]).forEach(function(p){
      [p.masterPlot,p.gisPlot].forEach(function(v){var n=normPA(v); if(n) set[n]=true;});
    });
    return set;
  }
  function showPA(){
    var cb=$('showNonInventoryPA');
    if(cb) return !!cb.checked;
    return window.showNonInventoryPALabels !== false;
  }
  function disableOldAddPins(){
    ['hayatAddInventoryHotspotLayer','addablePALayer','hayatPALabelLayerOld'].forEach(function(k){
      try{ if(window[k] && window.map) map.removeLayer(window[k]); }catch(e){}
      if(k!=='hayatPALabelLayerOld') window[k]=null;
    });
    var cb=$('showAddInventoryPins');
    if(cb){ cb.checked=false; var lab=cb.closest('label'); if(lab) lab.style.display='none'; }
    document.querySelectorAll('.hayat-add-inventory-icon,.hayat-add-inventory-direct-icon,.hayat-add-inventory-light-icon').forEach(function(el){
      try{ el.style.display='none'; el.style.pointerEvents='none'; }catch(e){}
    });
  }
  function ensureLayer(){
    if(!window.L || !window.map) return null;
    if(!map.getPane('hayatPALabelPane')) map.createPane('hayatPALabelPane');
    var pane=map.getPane('hayatPALabelPane');
    pane.style.zIndex=690;
    pane.style.pointerEvents='auto';
    if(!window.hayatPALabelLayer) window.hayatPALabelLayer=L.layerGroup().addTo(map);
    return window.hayatPALabelLayer;
  }
  function openAdd(label,lat,lng){
    label=normPA(label);
    if(typeof window.hayatAddInventoryFromPA==='function') window.hayatAddInventoryFromPA(label,lat,lng);
    else if(typeof window.openAddPlotByPA==='function') window.openAddPlotByPA(label,lat,lng);
    else alert('Add Inventory editor is not available. Please refresh the page.');
  }
  function render(){
    if(!isAdmin() || !window.L || !window.map || !window.JAH_PA_LABELS) return;
    disableOldAddPins();
    var layer=ensureLayer(); if(!layer) return;
    layer.clearLayers();
    if(!showPA()) return;
    var existing=invSet();
    var b=null; try{b=map.getBounds().pad(0.20);}catch(e){}
    (window.JAH_PA_LABELS||[]).forEach(function(pa){
      var label=paLabel(pa); if(!label || existing[label]) return;
      var lat=Number(pa.lat), lng=Number(pa.lng); if(!isFinite(lat)||!isFinite(lng)) return;
      if(b && !b.contains([lat,lng])) return;
      var html='<button type="button" class="hayat-pa-label-click" data-pa="'+esc(label)+'">'+esc(label)+'</button>';
      var icon=L.divIcon({className:'hayat-pa-label-click-wrap', html:html, iconSize:[74,28], iconAnchor:[37,14]});
      var mk=L.marker([lat,lng],{icon:icon,pane:'hayatPALabelPane',interactive:true,keyboard:false,bubblingMouseEvents:false,zIndexOffset:10000});
      mk.on('click mousedown dblclick contextmenu',function(e){try{ if(e && e.originalEvent) L.DomEvent.stop(e.originalEvent); }catch(_){} });
      mk.on('click',function(e){openAdd(label,lat,lng);});
      mk.addTo(layer);
    });
  }
  function rerenderSoon(){
    clearTimeout(window.__hayat3312_timer);
    window.__hayat3312_timer=setTimeout(render,80);
    setTimeout(render,220);
  }
  function install(){
    if(!isAdmin()) return;
    disableOldAddPins();
    // v3.3.18 owns Master Plan PA labels and Add Inventory click target.
  }
  var css=document.createElement('style');
  css.textContent='\
    .hayat-pa-label-click-wrap{pointer-events:auto!important;cursor:pointer!important;background:transparent!important;border:0!important;}\
    .hayat-pa-label-click-wrap *{pointer-events:auto!important;}\
    .hayat-pa-label-click{min-width:58px;height:24px;padding:0 8px;border-radius:5px;border:1px solid rgba(0,0,0,.28);background:rgba(255,255,255,.94);color:#1f2d2a;font:bold 11px Arial;line-height:22px;box-shadow:0 1px 4px rgba(0,0,0,.20);cursor:pointer!important;}\
    .hayat-pa-label-click:hover{background:#fff;border-color:#0f766e;transform:translateY(-1px);}\
    .hayat-add-inventory-icon,.hayat-add-inventory-direct-icon,.hayat-add-inventory-light-icon{display:none!important;pointer-events:none!important;}\
  ';
  document.head.appendChild(css);
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){setTimeout(install,1700);}); else setTimeout(install,1700);
  setTimeout(install,2600);
  setTimeout(install,4200);
})();
