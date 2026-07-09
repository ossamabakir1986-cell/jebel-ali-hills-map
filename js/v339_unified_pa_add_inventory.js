/* Hayat GIS v3.3.10 - Unified PA Label Add Inventory + Size Field
   - Removes the separate green Add Inventory pin layer.
   - Makes the Master Plan PA label itself clickable for empty plots.
   - No plus badge/button: the PA label is the clickable add-inventory target.
   - Empty PA label click opens the same Add/Edit inventory form.
   - Adds Size to the Admin Add/Edit form and recalculates totals after save.
*/
(function(){
  'use strict';
  function $(id){return document.getElementById(id);} 
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function isAdmin(){return /admin\.html/i.test(location.pathname) || !!document.querySelector('[data-admin="true"]') || !!$('plotEditModal');}
  function normPA(s){
    var raw=String(s||'').trim().toUpperCase().replace(/\s+/g,'').replace('-', '_');
    var m=raw.match(/^PA(\d+)_?0*(\d+)$/);
    return m ? ('PA'+Number(m[1])+'_'+String(Number(m[2])).padStart(3,'0')) : raw;
  }
  function labelOf(pa){return normPA(pa && (pa.t||pa.label||pa.masterPlot));}
  function invSet(){
    var set={};
    (window.points||[]).forEach(function(p){
      [p.masterPlot,p.gisPlot].forEach(function(v){var n=normPA(v); if(n) set[n]=true;});
    });
    return set;
  }
  function cleanNumber(v){var s=String(v==null?'':v).replace(/,/g,'').trim(); if(!s) return null; var n=Number(s); return isNaN(n)?null:n;}
  function fmtNum2(x){return (x===null||x===undefined||isNaN(x))?'':Number(x).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});}
  function fmtPrice(x){return (x===null||x===undefined||isNaN(x))?'':Number(x).toLocaleString(undefined,{maximumFractionDigits:2});}
  function recalc(p){
    if(!p) return;
    p.size=cleanNumber(p.size); p.price=cleanNumber(p.price); p.secondPrice=cleanNumber(p.secondPrice);
    p.sizeText=p.size!==null?fmtNum2(p.size):'';
    p.priceText=p.price!==null?fmtPrice(p.price):'';
    p.secondPriceText=p.secondPrice!==null?fmtPrice(p.secondPrice):'';
    p.total=(p.size!==null && p.price!==null)?p.size*p.price:null; p.totalText=p.total!==null?fmtPrice(p.total):'';
    p.deposit=p.total!==null?p.total*0.10:null; p.depositText=p.deposit!==null?fmtNum2(p.deposit):'';
    p.commission=p.total!==null?p.total*0.02:null; p.commissionText=p.commission!==null?fmtNum2(p.commission):'';
    p.secondTotal=(p.size!==null && p.secondPrice!==null)?p.size*p.secondPrice:null; p.secondTotalText=p.secondTotal!==null?fmtPrice(p.secondTotal):'';
    p.secondDeposit=p.secondTotal!==null?p.secondTotal*0.10:null; p.secondDepositText=p.secondDeposit!==null?fmtNum2(p.secondDeposit):'';
    p.secondCommission=p.secondTotal!==null?p.secondTotal*0.02:null; p.secondCommissionText=p.secondCommission!==null?fmtNum2(p.secondCommission):'';
    var g=String(p.gfa||'').toUpperCase().replace(/\s/g,''); var pct=null;
    if(g.indexOf('G+4')!==-1) pct=2.20; else if(g.indexOf('G+1')!==-1) pct=0.65;
    p.gfaPct=pct!==null?Math.round(pct*100):null;
    p.gfaAllowed=(p.size!==null && pct!==null)?p.size*pct:null; p.gfaAllowedText=p.gfaAllowed!==null?fmtNum2(p.gfaAllowed):'';
    if(p.lat!=null && p.lon!=null){ var lat=Number(p.lat), lon=Number(p.lon); if(isFinite(lat)&&isFinite(lon)){p.coords=lat.toFixed(7)+', '+lon.toFixed(7); p.mapsUrl='https://www.google.com/maps?q='+lat+','+lon;}}
    try{ if(window.HayatDataNormalize && window.HayatDataNormalize.normalizePoint) window.HayatDataNormalize.normalizePoint(p); }catch(e){}
  }
  function ensureSizeField(){
    if(!$('plotEditModal') || $('editSize')) return;
    var priceLabel=$('editPrice') && $('editPrice').closest('label');
    if(!priceLabel) return;
    var lab=document.createElement('label');
    lab.innerHTML='Size / Area sqft<input id="editSize" type="number" step="0.01">';
    priceLabel.parentNode.insertBefore(lab, priceLabel);
  }
  function setSizeInForm(p){ensureSizeField(); var e=$('editSize'); if(e) e.value=(p && p.size!=null)?p.size:'';}
  function findPointByIdentity(row,gis,mp){
    var pts=window.points||[];
    if(row && String(row).indexOf('__add__')!==0){ var byRow=pts.find(function(p){return String(p.row)===String(row);}); if(byRow) return byRow; }
    gis=String(gis||'').trim(); mp=normPA(mp||'');
    for(var i=pts.length-1;i>=0;i--){
      var p=pts[i];
      if(gis && String(p.gisPlot||'').trim()===gis) return p;
      if(mp && normPA(p.masterPlot||'')===mp) return p;
    }
    return null;
  }
  function patchEditor(){
    ensureSizeField();
    if(!window.__hayat339OpenPatch && typeof window.openPlotEditorByRow==='function'){
      window.__hayat339OpenPatch=true;
      var oldOpen=window.openPlotEditorByRow;
      window.openPlotEditorByRow=function(row){ var r=oldOpen.apply(this,arguments); try{ var p=(window.points||[]).find(function(x){return String(x.row)===String(row);}); setSizeInForm(p); }catch(e){} return r; };
    }
    if(!window.__hayat339AddPatch && typeof window.hayatAddInventoryFromPA==='function'){
      window.__hayat339AddPatch=true;
      var oldAdd=window.hayatAddInventoryFromPA;
      window.hayatAddInventoryFromPA=function(label,lat,lng){ var r=oldAdd.apply(this,arguments); setTimeout(function(){ensureSizeField(); var e=$('editSize'); if(e) e.value='';},0); return r; };
    }
    if(!window.__hayat339SavePatch && typeof window.savePlotEdit==='function'){
      window.__hayat339SavePatch=true;
      var oldSave=window.savePlotEdit;
      window.savePlotEdit=function(){
        ensureSizeField();
        var row=$('editRowId')?$('editRowId').value:'';
        var gis=$('editGisPlot')?$('editGisPlot').value:'';
        var mp=$('editMasterPlot')?$('editMasterPlot').value:'';
        var sizeVal=$('editSize')?$('editSize').value:'';
        var r=oldSave.apply(this,arguments);
        setTimeout(function(){
          try{
            var p=findPointByIdentity(row,gis,mp);
            if(p){
              p.size=cleanNumber(sizeVal);
              recalc(p);
              if(typeof window.applyFiltersImmediate==='function') window.applyFiltersImmediate(); else if(typeof window.applyFilters==='function') window.applyFilters();
              if(typeof window.publishCurrentPoints==='function') window.publishCurrentPoints();
              renderUnifiedPALabels();
            }
          }catch(e){}
        },120);
        return r;
      };
    }
  }
  function disableSeparateAddPins(){
    try{ if(window.hayatAddInventoryHotspotLayer && window.map) map.removeLayer(window.hayatAddInventoryHotspotLayer); }catch(e){}
    try{ if(window.addablePALayer && window.map) map.removeLayer(window.addablePALayer); }catch(e){}
    window.hayatAddInventoryHotspotLayer=null;
    window.addablePALayer=null;
    var cb=$('showAddInventoryPins');
    if(cb){
      cb.checked=false;
      var lab=cb.closest('label'); if(lab) lab.style.display='none';
    }
  }
  function openAdd(label,lat,lng){
    label=normPA(label);
    if(typeof window.hayatAddInventoryFromPA==='function') window.hayatAddInventoryFromPA(label,lat,lng);
    else if(typeof window.openAddPlotByPA==='function') window.openAddPlotByPA(label,lat,lng);
  }
  function showPAEnabled(){
    var cb=$('showNonInventoryPA');
    if(cb) return !!cb.checked;
    return window.showNonInventoryPALabels !== false;
  }
  function ensurePane(){
    if(!window.map || !window.L) return null;
    if(!map.getPane('hayatPALabelPane')) map.createPane('hayatPALabelPane');
    var pane=map.getPane('hayatPALabelPane');
    pane.style.zIndex=565;
    pane.style.pointerEvents='auto';
    if(!window.hayatPALabelLayer) window.hayatPALabelLayer=L.layerGroup().addTo(map);
    return window.hayatPALabelLayer;
  }
  function renderUnifiedPALabels(){
    if(!isAdmin() || !window.L || !window.map || !window.JAH_PA_LABELS) return;
    disableSeparateAddPins();
    var layer=ensurePane(); if(!layer) return;
    layer.clearLayers();
    if(!showPAEnabled()) return;
    var existing=invSet();
    var b=null; try{b=map.getBounds().pad(0.12);}catch(e){}
    (window.JAH_PA_LABELS||[]).forEach(function(pa){
      var label=labelOf(pa); if(!label || existing[label]) return;
      var lat=Number(pa.lat), lng=Number(pa.lng); if(!isFinite(lat)||!isFinite(lng)) return;
      if(b && !b.contains([lat,lng])) return;
      var icon=L.divIcon({
        className:'hayat-unified-pa-add-label',
        html:'<span class="pa-text">'+esc(label)+'</span>',
        iconSize:[82,28],
        iconAnchor:[41,14]
      });
      var mk=L.marker([lat,lng],{icon:icon,pane:'hayatPALabelPane',interactive:true,keyboard:false,bubblingMouseEvents:false,zIndexOffset:2500});
      mk.on('click',function(e){try{ if(e && e.originalEvent) L.DomEvent.stop(e.originalEvent); }catch(_){} openAdd(label,lat,lng);});
      mk.bindTooltip('Add '+label+' to inventory',{direction:'top',opacity:.9});
      mk.addTo(layer);
    });
  }
  window.refreshUnifiedPALabels = renderUnifiedPALabels;
  window.refreshMasterPlanPALabels = renderUnifiedPALabels;
  window.updatePALabelZoomStyles = renderUnifiedPALabels;
  window.refreshAddablePALayer = renderUnifiedPALabels;
  window.refreshAddInventoryHotspots = renderUnifiedPALabels;
  var css=document.createElement('style');
  css.textContent='\
  .hayat-unified-pa-add-label{pointer-events:auto!important;cursor:pointer!important;touch-action:manipulation;}\
  .hayat-unified-pa-add-label *{pointer-events:auto!important;cursor:pointer!important;}\
  .hayat-unified-pa-add-label .pa-text{display:inline-flex;align-items:center;justify-content:center;height:24px;min-width:58px;padding:0 9px;border-radius:5px;background:rgba(255,255,255,.92);color:#1f2d2a;border:1px solid rgba(0,0,0,.28);font:bold 11px Arial;box-shadow:0 1px 4px rgba(0,0,0,.20);line-height:24px;}\
  .hayat-unified-pa-add-label:hover .pa-text{transform:translateY(-1px);background:rgba(255,255,255,.98);border-color:#0f766e;}\
  ';  document.head.appendChild(css);
  var t=null; function debounced(){clearTimeout(t); t=setTimeout(renderUnifiedPALabels,120);} 
  function init(){patchEditor(); disableSeparateAddPins(); /* v3.3.18 owns PA label rendering/events. */ }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){setTimeout(init,900);}); else setTimeout(init,900);
  setTimeout(init,1800);
})();
