/* Hayat GIS v3.3.5 - Offset PA move handle
   Purpose: when the blue underlying PA point is directly under the inventory pin,
   show a temporary offset draggable handle so it can be grabbed easily. */
(function(){
  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function normPA(s){
    var raw=String(s||'').trim().toUpperCase().replace(/\s+/g,'');
    var m=raw.match(/^PA(\d+)_0*(\d+)$/);
    return m ? ('PA'+String(Number(m[1]))+'_'+String(Number(m[2])).padStart(3,'0')) : raw;
  }
  function findPointByRow(row){
    return (window.points||[]).find(function(p){ return String(p.row)===String(row); }) || null;
  }
  function findPAForPoint(p){
    if(!p || !window.JAH_PA_LABELS) return null;
    var targets=[p.masterPlot,p.gisPlot].map(normPA).filter(Boolean);
    return (window.JAH_PA_LABELS||[]).find(function(pa){ return targets.indexOf(normPA(pa.t||pa.label||pa.masterPlot))!==-1; }) || null;
  }
  function refreshAfterPAChange(msg){
    try{ if(typeof window.setNonPinnedPALabelsVisible==='function') window.setNonPinnedPALabelsVisible(!!($('showNonInventoryPA') && $('showNonInventoryPA').checked)); }catch(e){}
    try{ if(typeof window.refreshAddablePALayer==='function') window.refreshAddablePALayer(); }catch(e){}
    try{ if(typeof window.publishCurrentPoints==='function') window.publishCurrentPoints(); }catch(e){}
    try{ if(typeof window.applyFilters==='function') window.applyFilters(); }catch(e){}
    if(msg) alert(msg);
  }
  function getOffsetLatLng(latlng){
    try{
      var p = map.latLngToLayerPoint(latlng);
      p.x += 34; // temporary visual offset to the right so blue handle is reachable
      p.y -= 10;
      return map.layerPointToLatLng(p);
    }catch(e){
      return L.latLng(Number(latlng.lat)+0.00003, Number(latlng.lng)+0.00008);
    }
  }
  function cleanupMovePA(){
    try{ if(window.__v335PAMoveMarker) map.removeLayer(window.__v335PAMoveMarker); }catch(e){}
    try{ if(window.__v335PAGuide) map.removeLayer(window.__v335PAGuide); }catch(e){}
    window.__v335PAMoveMarker=null; window.__v335PAGuide=null; window.__v335PARef=null; window.__v335PAOriginal=null;
  }
  function startOffsetPAMove(row){
    if(!window.map || !window.L){ alert('Map not ready.'); return; }
    var p=findPointByRow(row); if(!p){ alert('Plot not found.'); return; }
    var pa=findPAForPoint(p); if(!pa){ alert('No linked PA point found for '+(p.masterPlot||p.gisPlot||'this plot')+'.'); return; }
    cleanupMovePA();
    var original=L.latLng(Number(pa.lat), Number(pa.lng));
    var start=getOffsetLatLng(original);
    var icon=L.divIcon({className:'', html:'<div class="v335-pa-offset-handle"></div>', iconSize:[30,30], iconAnchor:[15,15]});
    var mk=L.marker(start, {draggable:true, icon:icon, zIndexOffset:20000, title:'Drag blue PA handle to the correct plot position'}).addTo(map);
    var guide=L.polyline([original,start], {color:'#2563eb', weight:2, opacity:.75, dashArray:'5,5', interactive:false}).addTo(map);
    window.__v335PAMoveMarker=mk; window.__v335PAGuide=guide; window.__v335PARef=pa; window.__v335PAOriginal={lat:Number(pa.lat), lng:Number(pa.lng)};
    mk.on('drag', function(){ try{ guide.setLatLngs([original, mk.getLatLng()]); }catch(e){} });
    mk.bindPopup('<div class="popup-title">Move PA Point '+esc(pa.t||p.masterPlot||'')+'</div>'+
      '<div class="small-note">The blue handle is temporarily shifted so you can grab it. Drag it onto the real plot location, then save.</div>'+
      '<div class="admin-actions"><button onclick="commitOffsetPAMove()">Save PA Position</button><button class="danger" onclick="cancelOffsetPAMove()">Cancel</button></div>').openPopup();
  }
  window.startMoveUnderlyingPAFromEditor=function(){
    var row=$('editRowId') ? $('editRowId').value : '';
    if(!row || String(row).indexOf('__')===0){ alert('Save the plot first, then move its PA point.'); return; }
    try{ if(typeof closePlotEditor==='function') closePlotEditor(); }catch(e){}
    startOffsetPAMove(row);
  };
  window.startMoveUnderlyingPAByRow=function(row){ startOffsetPAMove(row); };
  window.commitOffsetPAMove=function(){
    if(!window.__v335PAMoveMarker || !window.__v335PARef){ alert('PA move operation not available.'); return; }
    var ll=window.__v335PAMoveMarker.getLatLng();
    window.__v335PARef.lat=Number(ll.lat); window.__v335PARef.lng=Number(ll.lng);
    cleanupMovePA();
    refreshAfterPAChange('Underlying PA point updated. Remember to export updated map data for GitHub.');
  };
  window.cancelOffsetPAMove=function(){
    try{ if(window.__v335PARef && window.__v335PAOriginal){ window.__v335PARef.lat=window.__v335PAOriginal.lat; window.__v335PARef.lng=window.__v335PAOriginal.lng; } }catch(e){}
    cleanupMovePA();
  };
  var css=document.createElement('style');
  css.textContent='.v335-pa-offset-handle{width:26px;height:26px;border-radius:50%;background:#2563eb;border:3px solid #fff;box-shadow:0 0 0 4px rgba(37,99,235,.25),0 4px 12px rgba(0,0,0,.35);cursor:grab}.v335-pa-offset-handle:active{cursor:grabbing;transform:scale(1.08)}';
  document.head.appendChild(css);
})();
