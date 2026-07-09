/* Hayat GIS v3.3.11 - Add Inventory calculated details fix
   - Ensures Add Inventory / Add Plot saves Size into the inventory record.
   - Recalculates Total, Deposit Cheque, Commission, GFA allowance immediately after save.
   - Keeps the new plot linked to the Details Checklist because it receives the same fields as normal inventory plots.
*/
(function(){
  'use strict';
  function $(id){return document.getElementById(id);} 
  function cleanNumber(v){var s=String(v==null?'':v).replace(/,/g,'').trim(); if(!s) return null; var n=Number(s); return isNaN(n)?null:n;}
  function fmtNum2(x){return (x===null||x===undefined||isNaN(x))?'':Number(x).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});}
  function fmtPrice(x){return (x===null||x===undefined||isNaN(x))?'':Number(x).toLocaleString(undefined,{maximumFractionDigits:2});}
  function normText(v){return String(v==null?'':v).replace(/\s+/g,' ').trim();}
  function normTitle(v){
    if(window.HayatDataNormalize && window.HayatDataNormalize.normalizeAgent) return window.HayatDataNormalize.normalizeAgent(v);
    return normText(v).toLowerCase().replace(/\b\w/g,function(c){return c.toUpperCase();});
  }
  function normType(v){return (window.HayatDataNormalize && window.HayatDataNormalize.normalizeType) ? window.HayatDataNormalize.normalizeType(v) : normText(v);}
  function normColor(v){return (window.HayatDataNormalize && window.HayatDataNormalize.normalizeColor) ? (window.HayatDataNormalize.normalizeColor(v)||'') : normText(v);}
  function normPA(s){
    var raw=String(s||'').trim().toUpperCase().replace(/\s+/g,'').replace('-', '_');
    var m=raw.match(/^PA(\d+)_?0*(\d+)$/);
    return m ? ('PA'+Number(m[1])+'_'+String(Number(m[2])).padStart(3,'0')) : raw;
  }
  function nextRow(){var max=0;(window.points||[]).forEach(function(p){var r=Number(p.row||0); if(r>max) max=r;}); return max+1;}
  function findByRow(row){return (window.points||[]).find(function(p){return String(p.row)===String(row);});}
  function findByIdentity(row,gis,mp){
    if(row && String(row).indexOf('__')!==0){ var p=findByRow(row); if(p) return p; }
    gis=normText(gis); mp=normPA(mp);
    var pts=window.points||[];
    for(var i=pts.length-1;i>=0;i--){
      var p=pts[i];
      if(gis && normText(p.gisPlot)===gis) return p;
      if(mp && normPA(p.masterPlot)===mp) return p;
    }
    return null;
  }
  function recalc(p){
    if(!p) return p;
    p.size=cleanNumber(p.size);
    p.price=cleanNumber(p.price);
    p.secondPrice=cleanNumber(p.secondPrice);
    p.sizeText=p.size!==null?fmtNum2(p.size):'';
    p.priceText=p.price!==null?fmtPrice(p.price):'';
    p.secondPriceText=p.secondPrice!==null?fmtPrice(p.secondPrice):'';
    p.total=(p.size!==null && p.price!==null)?p.size*p.price:null;
    p.totalText=p.total!==null?fmtPrice(p.total):'';
    p.deposit=p.total!==null?p.total*0.10:null;
    p.depositText=p.deposit!==null?fmtNum2(p.deposit):'';
    p.commission=p.total!==null?p.total*0.02:null;
    p.commissionText=p.commission!==null?fmtNum2(p.commission):'';
    p.secondTotal=(p.size!==null && p.secondPrice!==null)?p.size*p.secondPrice:null;
    p.secondTotalText=p.secondTotal!==null?fmtPrice(p.secondTotal):'';
    p.secondDeposit=p.secondTotal!==null?p.secondTotal*0.10:null;
    p.secondDepositText=p.secondDeposit!==null?fmtNum2(p.secondDeposit):'';
    p.secondCommission=p.secondTotal!==null?p.secondTotal*0.02:null;
    p.secondCommissionText=p.secondCommission!==null?fmtNum2(p.secondCommission):'';
    var g=String(p.gfa||'').toUpperCase().replace(/\s/g,''); var pct=null;
    if(g.indexOf('G+4')!==-1) pct=2.20; else if(g.indexOf('G+1')!==-1) pct=0.65;
    p.gfaPct=pct!==null?Math.round(pct*100):null;
    p.gfaAllowed=(p.size!==null && pct!==null)?p.size*pct:null;
    p.gfaAllowedText=p.gfaAllowed!==null?fmtNum2(p.gfaAllowed):'';
    if(p.lat!=null && p.lon!=null){var lat=Number(p.lat), lon=Number(p.lon); if(isFinite(lat)&&isFinite(lon)){p.coords=lat.toFixed(7)+', '+lon.toFixed(7); p.mapsUrl='https://www.google.com/maps?q='+lat+','+lon;}}
    try{ if(window.HayatFeatureTools && window.HayatFeatureTools.format) p.features=window.HayatFeatureTools.format(p.features||''); }catch(e){}
    try{ if(window.HayatDataNormalize && window.HayatDataNormalize.normalizePoint) window.HayatDataNormalize.normalizePoint(p); }catch(e){}
    return p;
  }
  function ensureSizeField(){
    if(!$('plotEditModal') || $('editSize')) return;
    var price=$('editPrice'); if(!price) return;
    var priceLabel=price.closest('label') || price.parentNode;
    var lab=document.createElement('label');
    lab.innerHTML='Size / Area sqft<input id="editSize" type="number" step="0.01" placeholder="Example: 10000">';
    priceLabel.parentNode.insertBefore(lab, priceLabel);
  }
  function setVal(id,v){var e=$(id); if(e) e.value=(v==null?'':v);} 
  function refreshAll(msg){
    try{ if(window.HayatDataNormalize && window.HayatDataNormalize.normalizeAllPoints) window.HayatDataNormalize.normalizeAllPoints(); }catch(e){}
    try{ if(typeof window.refreshFilterOptionsFromPoints==='function') window.refreshFilterOptionsFromPoints(); }catch(e){}
    try{ if(typeof window.applyFiltersImmediate==='function') window.applyFiltersImmediate(); else if(typeof window.applyFilters==='function') window.applyFilters(); else if(typeof window.addMarkers==='function') window.addMarkers(window.points||[], false); }catch(e){}
    try{ if(typeof window.updateSelectionPanel==='function') window.updateSelectionPanel(); }catch(e){}
    try{ if(typeof window.publishCurrentPoints==='function') window.publishCurrentPoints(); }catch(e){}
    try{ if(typeof window.refreshUnifiedPALabels==='function') window.refreshUnifiedPALabels(); else if(typeof window.refreshMasterPlanPALabels==='function') window.refreshMasterPlanPALabels(); }catch(e){}
    if(msg) alert(msg);
  }
  function patchOpeners(){
    ensureSizeField();
    if(!window.__hayat3311_open_patch && typeof window.openPlotEditorByRow==='function'){
      window.__hayat3311_open_patch=true;
      var oldOpen=window.openPlotEditorByRow;
      window.openPlotEditorByRow=function(row){
        var r=oldOpen.apply(this,arguments);
        setTimeout(function(){ensureSizeField(); var p=findByRow(row); if(p) setVal('editSize', p.size!=null?p.size:'');},0);
        return r;
      };
    }
    if(!window.__hayat3311_add_patch && typeof window.hayatAddInventoryFromPA==='function'){
      window.__hayat3311_add_patch=true;
      var oldAdd=window.hayatAddInventoryFromPA;
      window.hayatAddInventoryFromPA=function(label,lat,lng){
        var r=oldAdd.apply(this,arguments);
        setTimeout(function(){ensureSizeField(); setVal('editSize','');},0);
        return r;
      };
    }
  }
  function replaceSave(){
    window.savePlotEdit=function(){
      ensureSizeField();
      var row=$('editRowId')?$('editRowId').value:'';
      var isNew=String(row||'').indexOf('__add__')===0 || String(row||'').indexOf('__mapadd__')===0;
      var gis=normText($('editGisPlot')?$('editGisPlot').value:'');
      var mp=normText($('editMasterPlot')?$('editMasterPlot').value:'');
      var p=isNew?null:findByRow(row);
      if(isNew){
        p={row:nextRow(), gisPlot:gis, masterPlot:mp, coords:'', mapsUrl:''};
        var la=$('editLat'), lo=$('editLon');
        var lat=la?cleanNumber(la.value):null, lon=lo?cleanNumber(lo.value):null;
        if((lat===null || lon===null) && window.currentAddPALabel){lat=Number(window.currentAddPALabel.lat); lon=Number(window.currentAddPALabel.lng);} 
        p.lat=lat; p.lon=lon;
      }
      if(!p){alert('Plot not found.'); return;}
      if(!gis && !mp){alert('GIS Plot or Master Plan Plot is required.'); return;}
      p.gisPlot=gis || mp;
      p.masterPlot=mp;
      p.agent=normTitle($('editAgent')?$('editAgent').value:'');
      p.mobile=normText($('editMobile')?$('editMobile').value:'');
      p.size=cleanNumber($('editSize')?$('editSize').value:p.size);
      p.price=cleanNumber($('editPrice')?$('editPrice').value:p.price);
      p.color=normColor($('editColor')?$('editColor').value:p.color) || p.color || 'Red';
      p.type=normType($('editType')?$('editType').value:p.type) || 'Plot';
      p.phase=normText($('editPhase')?$('editPhase').value:p.phase);
      p.gfa=normText(($('editGfaV32')&&$('editGfaV32').value) || ($('editGFA')&&$('editGFA').value) || p.gfa || '');
      p.secondAgent=normTitle($('editSecondAgent')?$('editSecondAgent').value:'');
      p.secondMobile=normText($('editSecondMobile')?$('editSecondMobile').value:'');
      p.secondPrice=cleanNumber($('editSecondPrice')?$('editSecondPrice').value:p.secondPrice);
      p.secondColor=normColor($('editSecondColor')?$('editSecondColor').value:'');
      p.comment=normText($('editComment')?$('editComment').value:'');
      if($('editFeaturesV32')) p.features=normText($('editFeaturesV32').value);
      var lat=cleanNumber($('editLat')?$('editLat').value:p.lat), lon=cleanNumber($('editLon')?$('editLon').value:p.lon);
      if(lat!==null && lon!==null){p.lat=lat; p.lon=lon;}
      if(p.lat===null || p.lon===null || isNaN(Number(p.lat)) || isNaN(Number(p.lon))){alert('Latitude and longitude are required.'); return;}
      recalc(p);
      if(isNew){window.points=window.points||[]; window.points.push(p);} 
      try{ if(typeof window.closePlotEditor==='function') window.closePlotEditor(); else if($('plotEditModal')) $('plotEditModal').style.display='none'; }catch(e){}
      refreshAll(isNew ? 'Plot added with calculated details.' : 'Plot updated with calculated details.');
      setTimeout(function(){
        try{
          var saved=findByIdentity(row,p.gisPlot,p.masterPlot); if(saved) recalc(saved);
          if(typeof window.applyFiltersImmediate==='function') window.applyFiltersImmediate(); else if(typeof window.applyFilters==='function') window.applyFilters();
          if(typeof window.publishCurrentPoints==='function') window.publishCurrentPoints();
        }catch(e){}
      },100);
    };
  }
  function init(){patchOpeners(); replaceSave(); ensureSizeField(); (window.points||[]).forEach(recalc); try{ if(typeof window.publishCurrentPoints==='function') window.publishCurrentPoints(); }catch(e){} }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){setTimeout(init,1200);}); else setTimeout(init,1200);
  setTimeout(init,2200);
})();
