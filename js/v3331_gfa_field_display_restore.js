// Hayat GIS v3.3.31 - GFA Field + GFA Allowed Restore
// Builds on stable v3.3.29 and overlay-clean v3.3.30 without changing map/filter logic.
(function(){
  'use strict';
  var VERSION = 'v3.3.31 GFA Field + GFA Allowed Restore';

  function byId(id){ return document.getElementById(id); }
  function clean(v){ return String(v == null ? '' : v).replace(/\s+/g,' ').trim(); }
  function isAdmin(){ return !!byId('plotEditModal') || /admin/i.test(location.pathname); }
  function numberFrom(v){ var s=String(v == null ? '' : v).replace(/,/g,'').trim(); if(!s) return null; var n=Number(s); return isFinite(n) ? n : null; }
  function fmtNum(x){ return (x===null || x===undefined || isNaN(x)) ? '' : Number(x).toLocaleString(undefined,{minimumFractionDigits:0,maximumFractionDigits:2}); }
  function fmtMoney(x){ return (x===null || x===undefined || isNaN(x)) ? '' : 'AED ' + Number(x).toLocaleString(undefined,{maximumFractionDigits:0}); }
  function getPoints(){ return Array.isArray(window.points) ? window.points : []; }
  function normGfa(v){
    var s = clean(v).toUpperCase().replace(/\s+/g,'');
    if(s === 'G+1' || s === 'G1') return 'G+1';
    if(s === 'G+4' || s === 'G4') return 'G+4';
    return clean(v);
  }
  function gfaPct(v){
    var g = normGfa(v).toUpperCase().replace(/\s/g,'');
    if(g.indexOf('G+4') !== -1) return 2.20;
    if(g.indexOf('G+1') !== -1) return 0.65;
    return null;
  }
  function recalcAllFinancials(p){
    if(!p) return p;
    if(p.gfa !== undefined) p.gfa = normGfa(p.gfa);
    p.size = numberFrom(p.size);
    p.price = numberFrom(p.price);
    p.secondPrice = numberFrom(p.secondPrice);
    p.sizeText = p.size !== null ? fmtNum(p.size) : '';
    p.priceText = p.price !== null ? Number(p.price).toLocaleString(undefined,{maximumFractionDigits:0}) : '';
    p.secondPriceText = p.secondPrice !== null ? Number(p.secondPrice).toLocaleString(undefined,{maximumFractionDigits:0}) : '';
    p.total = (p.size !== null && p.price !== null) ? p.size * p.price : null;
    p.totalText = p.total !== null ? Number(p.total).toLocaleString(undefined,{maximumFractionDigits:0}) : '';
    p.deposit = p.total !== null ? p.total * 0.10 : null;
    p.depositText = p.deposit !== null ? fmtNum(p.deposit) : '';
    p.commission = p.total !== null ? p.total * 0.02 : null;
    p.commissionText = p.commission !== null ? fmtNum(p.commission) : '';
    p.secondTotal = (p.size !== null && p.secondPrice !== null) ? p.size * p.secondPrice : null;
    p.secondTotalText = p.secondTotal !== null ? Number(p.secondTotal).toLocaleString(undefined,{maximumFractionDigits:0}) : '';
    p.secondDeposit = p.secondTotal !== null ? p.secondTotal * 0.10 : null;
    p.secondDepositText = p.secondDeposit !== null ? fmtNum(p.secondDeposit) : '';
    p.secondCommission = p.secondTotal !== null ? p.secondTotal * 0.02 : null;
    p.secondCommissionText = p.secondCommission !== null ? fmtNum(p.secondCommission) : '';
    var pct = gfaPct(p.gfa);
    p.gfaPct = pct !== null ? Math.round(pct * 100) : null;
    p.gfaAllowed = (p.size !== null && pct !== null) ? p.size * pct : null;
    p.gfaAllowedText = p.gfaAllowed !== null ? fmtNum(p.gfaAllowed) : '';
    if(p.lat && p.lon) p.mapsUrl = 'https://www.google.com/maps?q=' + p.lat + ',' + p.lon;
    return p;
  }
  window.hayatV3331RecalcFinancials = recalcAllFinancials;
  if(typeof window.recalcPlotFinancials !== 'function') window.recalcPlotFinancials = recalcAllFinancials;

  function ensureGfaField(){
    if(!isAdmin()) return;
    if(byId('editGfa')) return;
    var phase = byId('editPhase');
    if(!phase || !phase.parentNode || !phase.parentNode.parentNode) return;
    var label = document.createElement('label');
    label.id = 'v3331GfaFieldLabel';
    label.innerHTML = 'GFA<select id="editGfa"><option value=""></option><option value="G+1">G+1</option><option value="G+4">G+4</option></select>';
    phase.parentNode.parentNode.insertBefore(label, phase.parentNode.nextSibling);
  }
  function setGfaField(v){ ensureGfaField(); var el=byId('editGfa'); if(el) el.value = normGfa(v || ''); }
  function getGfaField(){ ensureGfaField(); var el=byId('editGfa'); return el ? normGfa(el.value) : ''; }

  function refreshSummaryWithGfa(){
    if(!isAdmin()) return;
    var box = byId('plotEditSummary'); if(!box) return;
    var gfa = getGfaField();
    var sizeEl = byId('editSize');
    var tmp = {size: sizeEl ? numberFrom(sizeEl.value) : null, price: byId('editPrice') ? numberFrom(byId('editPrice').value) : null, secondPrice: byId('editSecondPrice') ? numberFrom(byId('editSecondPrice').value) : null, gfa:gfa};
    recalcAllFinancials(tmp);
    var old = box.innerHTML.replace(/<div class="v3331-gfa-summary"[\s\S]*?<\/div>/g, '');
    var line = '';
    if(gfa){
      line = '<div class="v3331-gfa-summary" style="margin-top:6px;color:#d6a94d">GFA: <b>' + gfa + '</b>' + (tmp.gfaAllowedText ? ' | GFA allowed: <b>' + tmp.gfaAllowedText + ' sqft' + (tmp.gfaPct ? ' (' + tmp.gfaPct + '%)' : '') + '</b>' : '') + '</div>';
    }
    box.innerHTML = old + line;
  }

  function pointByRow(row){ return getPoints().find(function(p){ return String(p.row) === String(row); }); }
  function findSavedPoint(row, gis, master, beforeRows){
    var p = null;
    if(row && row.indexOf('__') !== 0) p = pointByRow(row);
    if(!p && master) p = getPoints().slice().reverse().find(function(x){ return clean(x.masterPlot) === master; });
    if(!p && gis) p = getPoints().slice().reverse().find(function(x){ return clean(x.gisPlot) === gis; });
    if(!p) p = getPoints().slice().reverse().find(function(x){ return !beforeRows[String(x.row)]; });
    return p || null;
  }
  function refreshAfterGfa(){
    try{ getPoints().forEach(recalcAllFinancials); }catch(e){}
    try{ if(window.HayatDataNormalize && window.HayatDataNormalize.normalizeAllPoints) window.HayatDataNormalize.normalizeAllPoints(); }catch(e){}
    try{ if(typeof window.refreshFilterOptionsFromPoints === 'function') window.refreshFilterOptionsFromPoints(); }catch(e){}
    try{ if(typeof window.applyFilters === 'function') window.applyFilters(); else if(typeof window.addMarkers === 'function') window.addMarkers(getPoints(), false); }catch(e){}
    try{ if(typeof window.updateSelectionPanel === 'function') window.updateSelectionPanel(); }catch(e){}
    try{ if(typeof window.publishCurrentPoints === 'function') window.publishCurrentPoints(); }catch(e){}
  }

  function patchEditorOpeners(){
    if(!isAdmin()) return;
    ensureGfaField();
    if(typeof window.openPlotEditorByRow === 'function' && !window.openPlotEditorByRow.__v3331Gfa){
      var oldOpen = window.openPlotEditorByRow;
      var wrappedOpen = function(row){
        var result = oldOpen.apply(this, arguments);
        var p = pointByRow(row);
        setGfaField(p ? p.gfa : '');
        refreshSummaryWithGfa();
        return result;
      };
      wrappedOpen.__v3331Gfa = true;
      window.openPlotEditorByRow = wrappedOpen;
    }
    if(typeof window.openAddPlotByPA === 'function' && !window.openAddPlotByPA.__v3331Gfa){
      var oldAdd = window.openAddPlotByPA;
      var wrappedAdd = function(label, lat, lng){
        var result = oldAdd.apply(this, arguments);
        setGfaField('');
        refreshSummaryWithGfa();
        return result;
      };
      wrappedAdd.__v3331Gfa = true;
      window.openAddPlotByPA = wrappedAdd;
    }
  }
  function patchSave(){
    if(!isAdmin() || typeof window.savePlotEdit !== 'function' || window.savePlotEdit.__v3331GfaSave) return;
    var oldSave = window.savePlotEdit;
    var wrappedSave = function(){
      ensureGfaField();
      var rowEl = byId('editRowId'), gisEl = byId('editGisPlot'), masterEl = byId('editMasterPlot');
      var row = rowEl ? clean(rowEl.value) : '';
      var gis = gisEl ? clean(gisEl.value) : '';
      var master = masterEl ? clean(masterEl.value) : '';
      var gfaVal = getGfaField();
      var beforeRows = {};
      getPoints().forEach(function(p){ beforeRows[String(p.row)] = true; });
      var result = oldSave.apply(this, arguments);
      setTimeout(function(){
        var p = findSavedPoint(row, gis, master, beforeRows);
        if(p){
          p.gfa = gfaVal;
          recalcAllFinancials(p);
          refreshAfterGfa();
          console.log(VERSION + ': GFA saved for', p.gisPlot || p.masterPlot || p.row, p.gfa, p.gfaAllowedText);
        }
      }, 0);
      return result;
    };
    wrappedSave.__v3331GfaSave = true;
    window.savePlotEdit = wrappedSave;
  }
  function patchBulk(){
    if(!isAdmin() || typeof window.applyV3321BulkEditSelected !== 'function' || window.applyV3321BulkEditSelected.__v3331GfaBulk) return;
    var oldBulk = window.applyV3321BulkEditSelected;
    var wrappedBulk = function(){
      var result = oldBulk.apply(this, arguments);
      setTimeout(refreshAfterGfa, 0);
      return result;
    };
    wrappedBulk.__v3331GfaBulk = true;
    window.applyV3321BulkEditSelected = wrappedBulk;
  }
  function patchInputListeners(){
    if(!isAdmin()) return;
    ['editGfa','editSize','editPrice','editSecondPrice'].forEach(function(id){
      var el = byId(id);
      if(el && !el.__v3331GfaListener){ el.__v3331GfaListener = true; el.addEventListener('input', refreshSummaryWithGfa); el.addEventListener('change', refreshSummaryWithGfa); }
    });
  }
  function gfaAllowedLine(p){
    if(!p) return '';
    recalcAllFinancials(p);
    if(p.gfaAllowedText) return 'GFA allowed: ' + p.gfaAllowedText + ' sqft' + (p.gfaPct ? ' (' + p.gfaPct + '%)' : '');
    return '';
  }
  function patchCopyText(){
    if(!window.plotDetailsText || window.plotDetailsText.__v3331GfaCopy) return;
    var oldDetails = window.plotDetailsText;
    var wrappedDetails = function(p){
      p = p || {};
      recalcAllFinancials(p);
      var txt = oldDetails.apply(this, arguments);
      var line = gfaAllowedLine(p);
      if(line && txt.indexOf('GFA allowed:') === -1){
        txt = txt.replace(/(GFA:\s*[^\n]+\n?)/, '$1' + line + '\n');
        if(txt.indexOf(line) === -1) txt += '\n' + line;
      }
      return txt;
    };
    wrappedDetails.__v3331GfaCopy = true;
    window.plotDetailsText = wrappedDetails;
  }
  function forceGfaDetailVisibleOnce(){
    try{
      window.detailFields = window.detailFields || {};
      if(window.detailFields.gfa !== false) window.detailFields.gfa = true;
      var cb = document.querySelector('[data-field="gfa"]');
      if(cb && window.detailFields.gfa !== false) cb.checked = true;
    }catch(e){}
  }
  function init(){
    try{ getPoints().forEach(recalcAllFinancials); }catch(e){}
    forceGfaDetailVisibleOnce();
    ensureGfaField();
    patchEditorOpeners();
    patchSave();
    patchBulk();
    patchInputListeners();
    patchCopyText();
    if(isAdmin()) setTimeout(function(){ ensureGfaField(); patchInputListeners(); }, 500);
    console.log(VERSION + ' loaded');
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  setTimeout(init, 500);
  setTimeout(init, 1500);
})();
