/* Hayat GIS v3.3.8 - Add Inventory Click Fix
   - Keeps Add Inventory pins hidden by default.
   - Makes Add Inventory pins easier to click/tap.
   - Clicking the PA/Add Inventory pin opens the Add Inventory editor directly.
   - Renders only visible nearby Add Inventory pins.
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
  function isAdmin(){return /admin\.html/i.test(location.pathname) || !!document.querySelector('[data-admin="true"]') || !!$('plotEditModal');}
  function getShow(){
    var cb=$('showAddInventoryPins');
    if(cb) return !!cb.checked;
    try{return localStorage.getItem('JAH_show_add_inventory_pins')==='1';}catch(e){return false;}
  }
  function invSet(){
    var set={};
    (window.points||[]).forEach(function(p){
      [p.masterPlot,p.gisPlot].forEach(function(v){var n=normPA(v); if(n) set[n]=true;});
    });
    return set;
  }
  function ensureControl(){
    if(!isAdmin()) return;
    var existing=$('showAddInventoryPins');
    if(existing) return;
    var grid=document.querySelector('#mapLayerControls .layer-grid') || document.querySelector('.layer-grid') || document.querySelector('#mapLayerControls');
    if(!grid) return;
    var label=document.createElement('label');
    label.className='hayat-add-inventory-toggle';
    label.innerHTML='<input id="showAddInventoryPins" type="checkbox"> Add Inventory pins';
    grid.appendChild(label);
    var cb=$('showAddInventoryPins');
    try{ cb.checked = localStorage.getItem('JAH_show_add_inventory_pins')==='1'; }catch(e){ cb.checked=false; }
    cb.addEventListener('change', function(){
      try{localStorage.setItem('JAH_show_add_inventory_pins', this.checked?'1':'0');}catch(e){}
      refresh();
    });
  }
  function ensurePane(){
    if(!window.map || !window.L) return;
    if(!map.getPane('hayatAddInventoryPane')){
      map.createPane('hayatAddInventoryPane');
    }
    var pane=map.getPane('hayatAddInventoryPane');
    pane.style.zIndex=690;
    pane.style.pointerEvents='auto';
  }
  function openAddEditor(label,lat,lng){
    label=normPA(label);
    if(typeof window.hayatAddInventoryFromPA==='function'){
      window.hayatAddInventoryFromPA(label, lat, lng);
    }else{
      alert('Add Inventory editor is not available yet. Please refresh and try again.');
    }
  }
  function refresh(){
    if(!isAdmin() || !window.L || !window.map || !window.JAH_PA_LABELS) return;
    ensureControl();
    try{ if(window.hayatAddInventoryHotspotLayer) map.removeLayer(window.hayatAddInventoryHotspotLayer); }catch(e){}
    if(!getShow()) return;
    ensurePane();
    var layer=L.layerGroup();
    var existing=invSet();
    var b=null;
    try{ b=map.getBounds().pad(0.18); }catch(e){}
    var count=0;
    (window.JAH_PA_LABELS||[]).forEach(function(pa){
      var label=normPA(pa.t||pa.label||pa.masterPlot); if(!label || existing[label]) return;
      var lat=Number(pa.lat), lng=Number(pa.lng); if(!isFinite(lat)||!isFinite(lng)) return;
      if(b && !b.contains([lat,lng])) return;
      var icon=L.divIcon({
        className:'hayat-add-inventory-clickpin',
        html:'<span class="pa-code">'+esc(label)+'</span><span class="pa-plus">+</span>',
        iconSize:[96,34],
        iconAnchor:[48,17]
      });
      var mk=L.marker([lat,lng],{icon:icon,pane:'hayatAddInventoryPane',interactive:true,keyboard:false,zIndexOffset:12000,bubblingMouseEvents:false});
      mk.on('click', function(e){
        try{ L.DomEvent.stopPropagation(e); L.DomEvent.preventDefault(e); }catch(_e){}
        openAddEditor(label,lat,lng);
      });
      mk.on('mouseover', function(){ try{mk.setZIndexOffset(20000);}catch(e){} });
      mk.on('mouseout', function(){ try{mk.setZIndexOffset(12000);}catch(e){} });
      mk.bindTooltip('Add inventory for '+label, {direction:'top', opacity:0.9});
      mk.addTo(layer);
      count++;
    });
    layer.addTo(map);
    window.hayatAddInventoryHotspotLayer=layer;
    window.hayatVisibleAddInventoryPins=count;
  }
  window.refreshAddInventoryHotspots = refresh;
  window.refreshAddablePALayer = function(){ refresh(); };
  var t=null;
  function debounced(){ clearTimeout(t); t=setTimeout(refresh,140); }
  function init(){
    ensureControl();
    refresh();
    if(window.map && !window.__hayat338AddPinEvents){
      window.__hayat338AddPinEvents=true;
      map.on('moveend zoomend', debounced);
    }
  }
  var css=document.createElement('style');
  css.textContent='\
  .hayat-add-inventory-clickpin{pointer-events:auto!important;cursor:pointer!important;touch-action:manipulation;}\
  .hayat-add-inventory-clickpin *{pointer-events:auto!important;}\
  .hayat-add-inventory-clickpin .pa-code{display:inline-flex;align-items:center;justify-content:center;min-width:56px;height:28px;padding:0 8px;border-radius:15px 0 0 15px;background:rgba(255,255,255,.96);color:#24332f;border:2px solid rgba(15,118,110,.95);border-right:0;font:bold 12px Arial;box-shadow:0 2px 10px rgba(0,0,0,.28);}\
  .hayat-add-inventory-clickpin .pa-plus{display:inline-flex;align-items:center;justify-content:center;width:30px;height:28px;border-radius:0 15px 15px 0;background:#0f766e;color:white;border:2px solid white;font:bold 21px Arial;box-shadow:0 2px 10px rgba(0,0,0,.28);}\
  .hayat-add-inventory-clickpin:hover .pa-code,.hayat-add-inventory-clickpin:hover .pa-plus{transform:translateY(-1px) scale(1.03);}\
  ';
  document.head.appendChild(css);
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){setTimeout(init,800);}); else setTimeout(init,800);
})();
