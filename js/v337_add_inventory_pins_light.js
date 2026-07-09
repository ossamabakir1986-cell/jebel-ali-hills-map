/* Hayat GIS v3.3.7 - Add Inventory Pins Light
   - Adds a checkbox to show/hide Add Inventory pins.
   - Makes the master-plan PA number part of the clickable Add Inventory pin.
   - Renders Add Inventory pins only inside the current map view for smoother performance.
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
    if(!isAdmin() || $('showAddInventoryPins')) return;
    var grid=document.querySelector('#mapLayerControls .layer-grid');
    if(!grid) return;
    var label=document.createElement('label');
    label.innerHTML='<input id="showAddInventoryPins" type="checkbox"> Add Inventory pins';
    grid.appendChild(label);
    var cb=$('showAddInventoryPins');
    try{ cb.checked = localStorage.getItem('JAH_show_add_inventory_pins')==='1'; }catch(e){ cb.checked=false; }
    cb.addEventListener('change', function(){
      try{localStorage.setItem('JAH_show_add_inventory_pins', this.checked?'1':'0');}catch(e){}
      if(typeof window.refreshAddInventoryHotspots==='function') window.refreshAddInventoryHotspots();
    });
  }
  function ensurePane(){
    if(!window.map || !window.L) return;
    if(!map.getPane('hayatAddInventoryPane')){
      map.createPane('hayatAddInventoryPane');
      map.getPane('hayatAddInventoryPane').style.zIndex=620;
      map.getPane('hayatAddInventoryPane').style.pointerEvents='auto';
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
    try{ b=map.getBounds().pad(0.15); }catch(e){}
    var count=0;
    (window.JAH_PA_LABELS||[]).forEach(function(pa){
      var label=normPA(pa.t||pa.label||pa.masterPlot); if(!label || existing[label]) return;
      var lat=Number(pa.lat), lng=Number(pa.lng); if(!isFinite(lat)||!isFinite(lng)) return;
      if(b && !b.contains([lat,lng])) return;
      var icon=L.divIcon({
        className:'hayat-add-inventory-pill',
        html:'<span class="pa-code">'+esc(label)+'</span><span class="pa-plus">+</span>',
        iconSize:[78,26],
        iconAnchor:[39,13]
      });
      var mk=L.marker([lat,lng],{icon:icon,pane:'hayatAddInventoryPane',interactive:true,keyboard:false,zIndexOffset:9000});
      mk.bindPopup('<div class="popup-title">'+esc(label)+'</div><div class="small-note">This master-plan plot is not in active inventory.</div><div class="admin-actions"><button onclick="hayatAddInventoryFromPA(\''+esc(label)+'\','+lat+','+lng+')">+ Add Inventory</button></div>');
      mk.addTo(layer);
      count++;
    });
    layer.addTo(map);
    window.hayatAddInventoryHotspotLayer=layer;
    window.hayatVisibleAddInventoryPins=count;
  }
  window.refreshAddInventoryHotspots = refresh;
  var t=null;
  function debounced(){ clearTimeout(t); t=setTimeout(refresh,120); }
  function init(){
    ensureControl();
    refresh();
    if(window.map && !window.__hayat337AddPinEvents){
      window.__hayat337AddPinEvents=true;
      map.on('moveend zoomend', debounced);
    }
  }
  var css=document.createElement('style');
  css.textContent='\
  .hayat-add-inventory-pill{pointer-events:auto!important;}\
  .hayat-add-inventory-pill .pa-code{display:inline-flex;align-items:center;justify-content:center;min-width:48px;height:22px;padding:0 6px;border-radius:12px 0 0 12px;background:rgba(255,255,255,.92);color:#27312d;border:2px solid rgba(15,118,110,.9);border-right:0;font:bold 11px Arial;box-shadow:0 2px 8px rgba(0,0,0,.25);}\
  .hayat-add-inventory-pill .pa-plus{display:inline-flex;align-items:center;justify-content:center;width:24px;height:22px;border-radius:0 12px 12px 0;background:#0f766e;color:white;border:2px solid white;font:bold 18px Arial;box-shadow:0 2px 8px rgba(0,0,0,.25);}\
  .hayat-add-inventory-pill:hover .pa-code,.hayat-add-inventory-pill:hover .pa-plus{transform:translateY(-1px);}\
  ';
  document.head.appendChild(css);
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){setTimeout(init,700);}); else setTimeout(init,700);
})();
