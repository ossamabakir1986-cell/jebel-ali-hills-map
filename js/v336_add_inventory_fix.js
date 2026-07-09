/* Hayat GIS v3.3.6 - Add Inventory / Map Add Fix
   - Keeps latest exported data.
   - Makes non-inventory PA points easier to add to inventory.
   - Ensures map-click added plots open with a normal detail popup after save.
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
  function invSet(){
    var set={};
    (window.points||[]).forEach(function(p){[p.masterPlot,p.gisPlot].forEach(function(v){var n=normPA(v); if(n) set[n]=true;});});
    return set;
  }
  function nextRow(){var max=0;(window.points||[]).forEach(function(p){var r=Number(p.row||0); if(r>max) max=r;}); return max+1;}
  function phaseFromPA(label){var m=String(label||'').match(/^PA(\d+)_/i); return m?m[1]:'';}
  function setVal(id,v){var e=$(id); if(e) e.value=(v==null?'':v);}
  function showEditorForPA(label,lat,lng){
    if(!isAdmin()) return;
    var modal=$('plotEditModal'); if(!modal){alert('Editor not available.'); return;}
    label=normPA(label);
    window.currentAddPALabel={label:label, lat:Number(lat), lng:Number(lng)};
    setVal('editRowId','__add__'+label+'_'+Date.now());
    var g=$('editGisPlot'), mp=$('editMasterPlot'); if(g){g.disabled=false; g.value=''; g.placeholder='Enter GIS Plot number';} if(mp){mp.disabled=false; mp.value=label;}
    setVal('editAgent',''); setVal('editMobile',''); setVal('editPrice',''); setVal('editColor','Red'); setVal('editType','Plot'); setVal('editPhase',phaseFromPA(label)); setVal('editGfaV32','G+1'); setVal('editGFA','G+1');
    setVal('editSecondAgent',''); setVal('editSecondMobile',''); setVal('editSecondPrice',''); setVal('editSecondColor',''); setVal('editComment','');
    setVal('editLat',Number(lat).toFixed(7)); setVal('editLon',Number(lng).toFixed(7));
    var title=$('plotEditTitle'); if(title) title.textContent='Add Inventory for '+label;
    var summary=$('plotEditSummary'); if(summary) summary.innerHTML='Fill the GIS plot number, agent and price. The master-plan plot and coordinates are already filled.';
    var danger=document.querySelector('#plotEditModal .plot-edit-actions .danger'); if(danger) danger.style.display='none';
    var save=document.querySelector('#plotEditModal .plot-edit-actions button:first-child'); if(save) save.textContent='Add Plot';
    modal.style.display='flex';
  }
  window.hayatAddInventoryFromPA = showEditorForPA;
  function refreshAddInventoryHotspots(){
    if(!isAdmin() || !window.L || !window.map || !window.JAH_PA_LABELS) return;
    try{ if(window.hayatAddInventoryHotspotLayer) map.removeLayer(window.hayatAddInventoryHotspotLayer); }catch(e){}
    if(!map.getPane('hayatAddInventoryPane')){ map.createPane('hayatAddInventoryPane'); map.getPane('hayatAddInventoryPane').style.zIndex=615; map.getPane('hayatAddInventoryPane').style.pointerEvents='auto'; }
    var layer=L.layerGroup(); var existing=invSet();
    (window.JAH_PA_LABELS||[]).forEach(function(pa){
      var label=normPA(pa.t||pa.label||pa.masterPlot); if(!label || existing[label]) return;
      var lat=Number(pa.lat), lng=Number(pa.lng); if(!isFinite(lat)||!isFinite(lng)) return;
      var icon=L.divIcon({className:'hayat-add-inventory-icon', html:'<span>+</span>', iconSize:[26,26], iconAnchor:[13,13]});
      var mk=L.marker([lat,lng],{icon:icon,pane:'hayatAddInventoryPane',interactive:true,keyboard:false,zIndexOffset:9000});
      mk.bindPopup('<div class="popup-title">'+esc(label)+'</div><div class="small-note">This master-plan plot is not in active inventory.</div><div class="admin-actions"><button onclick="hayatAddInventoryFromPA(\''+esc(label)+'\','+lat+','+lng+')">+ Add Inventory</button></div>');
      mk.addTo(layer);
    });
    layer.addTo(map); window.hayatAddInventoryHotspotLayer=layer;
  }
  window.refreshAddInventoryHotspots = refreshAddInventoryHotspots;
  var oldRefresh=window.refreshAddablePALayer;
  window.refreshAddablePALayer=function(){ try{ if(oldRefresh) oldRefresh(); }catch(e){} setTimeout(refreshAddInventoryHotspots,50); };
  var oldAfter=window.refreshAfterAdminEdit || window.afterEdit;
  function afterAnyEdit(){ setTimeout(refreshAddInventoryHotspots,120); }
  if(window.refreshAfterAdminEdit){ window.refreshAfterAdminEdit=function(){ var r=oldAfter.apply(this,arguments); afterAnyEdit(); return r; }; }
  if(window.afterEdit){ var oldAE=window.afterEdit; window.afterEdit=function(){ var r=oldAE.apply(this,arguments); afterAnyEdit(); return r; }; }
  // Patch save so new map-click records are immediately clickable and have normal details.
  var oldSave=window.savePlotEdit;
  if(typeof oldSave==='function'){
    window.savePlotEdit=function(){
      var before=(window.points||[]).length;
      var r=oldSave.apply(this,arguments);
      setTimeout(function(){
        try{
          var pts=window.points||[];
          var p=pts[pts.length-1];
          if(pts.length>=before && p){
            if(!p.row) p.row=nextRow();
            if(!p.mapsUrl && p.lat!=null && p.lon!=null) p.mapsUrl='https://www.google.com/maps?q='+Number(p.lat)+','+Number(p.lon);
            if(!p.coords && p.lat!=null && p.lon!=null) p.coords=Number(p.lat).toFixed(7)+', '+Number(p.lon).toFixed(7);
            if(typeof window.applyFiltersImmediate==='function') window.applyFiltersImmediate(); else if(typeof window.applyFilters==='function') window.applyFilters();
            refreshAddInventoryHotspots();
          }
        }catch(e){}
      },150);
      return r;
    };
  }
  var css=document.createElement('style');
  css.textContent='.hayat-add-inventory-icon span{display:flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:#0f766e;color:white;border:2px solid white;font:bold 18px Arial;box-shadow:0 2px 8px rgba(0,0,0,.28);opacity:.88}.hayat-add-inventory-icon span:hover{opacity:1;transform:scale(1.08)}';
  document.head.appendChild(css);
  function init(){ refreshAddInventoryHotspots(); setTimeout(refreshAddInventoryHotspots,800); setTimeout(refreshAddInventoryHotspots,2200); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){setTimeout(init,500);}); else setTimeout(init,500);
})();
