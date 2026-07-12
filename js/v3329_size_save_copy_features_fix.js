// Hayat GIS v3.3.29 - Size Save + Copy Description Feature Text
// Final compatibility layer on top of v3.3.28 stable baseline.
(function(){
  'use strict';
  var VERSION = 'v3.3.29 Size Save + Copy Text Fix';

  function clean(v){ return String(v == null ? '' : v).replace(/\s+/g,' ').trim(); }
  function lower(v){ return clean(v).toLowerCase(); }
  function isAdmin(){ return /admin/i.test(location.pathname) || !!document.getElementById('plotEditModal'); }
  function numberFrom(v){ var s=String(v == null ? '' : v).replace(/,/g,'').trim(); if(!s) return null; var n=Number(s); return isFinite(n) ? n : null; }
  function fmtNum(x){ return (x===null || x===undefined || isNaN(x)) ? '' : Number(x).toLocaleString(undefined,{minimumFractionDigits:0,maximumFractionDigits:2}); }
  function fmtMoney(x){ return (x===null || x===undefined || isNaN(x)) ? '' : 'AED ' + Number(x).toLocaleString(undefined,{maximumFractionDigits:0}); }
  function getPoints(){ return Array.isArray(window.points) ? window.points : []; }
  function getByRow(row){ return getPoints().find(function(p){ return String(p.row) === String(row); }); }
  function getByGis(gis){ return getPoints().find(function(p){ return String(p.gisPlot) === String(gis); }); }
  function isVisible(field){ return !window.detailFields || window.detailFields[field] !== false; }
  function featureText(p){ return clean(p && p.features); }
  function splitFeatureText(v){ return clean(v).split(/[,;|]+/).map(clean).filter(Boolean); }
  function unique(arr, v){ v=clean(v); if(v && arr.indexOf(v) === -1) arr.push(v); }

  function recalcSizeFinancials(p){
    if(!p) return p;
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
    var g = clean(p.gfa).toUpperCase().replace(/\s/g,'');
    var pct = null;
    if(g.indexOf('G+4') !== -1) pct = 2.20;
    else if(g.indexOf('G+1') !== -1) pct = 0.65;
    p.gfaPct = pct !== null ? Math.round(pct * 100) : null;
    p.gfaAllowed = (p.size !== null && pct !== null) ? p.size * pct : null;
    p.gfaAllowedText = p.gfaAllowed !== null ? fmtNum(p.gfaAllowed) : '';
    if(window.HayatDataNormalize && window.HayatDataNormalize.normalizePoint){ try{ window.HayatDataNormalize.normalizePoint(p); }catch(e){} }
    return p;
  }

  function refreshQuietly(){
    try{ if(window.HayatDataNormalize && window.HayatDataNormalize.normalizeAllPoints) window.HayatDataNormalize.normalizeAllPoints(); }catch(e){}
    try{ if(typeof window.refreshFilterOptionsFromPoints === 'function') window.refreshFilterOptionsFromPoints(); }catch(e){}
    try{ if(typeof window.applyFilters === 'function') window.applyFilters(); else if(typeof window.addMarkers === 'function') window.addMarkers(getPoints(), false); }catch(e){}
    try{ if(typeof window.updateSelectionPanel === 'function') window.updateSelectionPanel(); }catch(e){}
    try{ if(typeof window.publishCurrentPoints === 'function') window.publishCurrentPoints(); }catch(e){}
  }

  function patchAdminSizeSave(){
    if(!isAdmin() || typeof window.savePlotEdit !== 'function' || window.savePlotEdit.__v3329SizeSave) return;
    var oldSave = window.savePlotEdit;
    var wrapped = function(){
      var rowEl = document.getElementById('editRowId');
      var gisEl = document.getElementById('editGisPlot');
      var masterEl = document.getElementById('editMasterPlot');
      var sizeEl = document.getElementById('editSize');
      var beforeRows = {};
      getPoints().forEach(function(p){ beforeRows[String(p.row)] = true; });
      var row = rowEl ? clean(rowEl.value) : '';
      var gis = gisEl ? clean(gisEl.value) : '';
      var master = masterEl ? clean(masterEl.value) : '';
      var sizeValue = sizeEl ? sizeEl.value : '';
      var parsedSize = numberFrom(sizeValue);
      var result = oldSave.apply(this, arguments);

      // The older move/add override saved all fields except size for newly added plots.
      // Patch the record immediately after the original save finishes.
      setTimeout(function(){
        var p = null;
        if(row && row.indexOf('__') !== 0) p = getByRow(row);
        if(!p && master) p = getPoints().slice().reverse().find(function(x){ return clean(x.masterPlot) === master; });
        if(!p && gis) p = getPoints().slice().reverse().find(function(x){ return clean(x.gisPlot) === gis; });
        if(!p){
          p = getPoints().slice().reverse().find(function(x){ return !beforeRows[String(x.row)]; });
        }
        if(p){
          p.size = parsedSize;
          recalcSizeFinancials(p);
          refreshQuietly();
          console.log(VERSION + ': size saved for', p.gisPlot || p.masterPlot || p.row, p.size);
        }
      }, 0);
      return result;
    };
    wrapped.__v3329SizeSave = true;
    window.savePlotEdit = wrapped;
  }

  function copyText(text, label){
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).catch(function(){ prompt(label || 'Copy:', text); });
    } else {
      prompt(label || 'Copy:', text);
    }
  }

  window.plotDetailsText = function(p){
    p = p || {};
    var lines = [];
    lines.push('Jebel Ali Hills');
    lines.push('Plot: ' + (p.gisPlot || ''));
    if(isVisible('masterPlot') && p.masterPlot) lines.push('PA Plot: ' + p.masterPlot);
    if(isVisible('type') && p.type) lines.push('Type: ' + p.type);
    if(featureText(p)) lines.push('Features: ' + featureText(p));
    if(isVisible('gfa') && p.gfa) lines.push('GFA: ' + p.gfa);
    if(isVisible('size') && p.sizeText) lines.push('Area: ' + p.sizeText + ' sqft');
    if(isVisible('pricing') && p.priceText) lines.push('Price/sqft: AED ' + p.priceText);
    if(isVisible('pricing') && p.total) lines.push('Total Price: ' + fmtMoney(p.total));
    if(isVisible('phase') && p.phase) lines.push('Phase: ' + p.phase);
    if(isVisible('comment') && p.comment) lines.push('Note: ' + p.comment);
    lines.push('');
    lines.push('Source: Hayat Luxury GIS');
    return lines.join('\n');
  };

  window.plotDescriptionText = function(p){
    p = p || {};
    var type = p.type ? p.type : 'residential plot';
    var area = (isVisible('size') && p.sizeText) ? ' with approximately ' + p.sizeText + ' sqft of land' : '';
    var gfa = (isVisible('gfa') && p.gfa) ? ' and ' + p.gfa + ' permission' : '';
    var priceSqft = (isVisible('pricing') && p.priceText) ? ' The plot is offered at AED ' + p.priceText + ' per sqft' : '';
    var total = (isVisible('pricing') && p.total) ? ', with a total asking price of ' + fmtMoney(p.total) + '.' : '.';
    var pa = (isVisible('masterPlot') && p.masterPlot) ? ' Master plan reference: ' + p.masterPlot + '.' : '';
    var phase = (isVisible('phase') && p.phase) ? ' Located in Phase ' + p.phase + '.' : '';
    var features = featureText(p) ? ' Key plot features: ' + featureText(p) + '.' : '';
    var lines = [];
    lines.push('Premium ' + type + ' opportunity in Jebel Ali Hills' + area + gfa + '. This plot is suitable for buyers looking to secure land in one of Dubai’s developing villa communities.' + priceSqft + total);
    lines.push(pa + phase + features);
    lines.push('For more information, contact Hayat Luxury Properties.');
    return lines.filter(function(x){ return clean(x); }).join('\n\n');
  };

  window.copyPlotDetails = function(gisPlot){ var p=getByGis(gisPlot); if(p) copyText(window.plotDetailsText(p),'Copy details:'); };
  window.copyPlotDescription = function(gisPlot){ var p=getByGis(gisPlot); if(p) copyText(window.plotDescriptionText(p),'Copy description:'); };
  window.copyPlotDetailsByRow = function(row){ var p=getByRow(row); if(p) copyText(window.plotDetailsText(p),'Copy details:'); };
  window.copyPlotDescriptionByRow = function(row){ var p=getByRow(row); if(p) copyText(window.plotDescriptionText(p),'Copy description:'); };

  function selectedList(){
    var selected = window.selectedPlots || {};
    return getPoints().filter(function(p){ return selected[String(p.gisPlot)]; });
  }
  window.copySelectedDetails = function(){
    var list = selectedList();
    if(!list.length){ alert('No plots selected'); return; }
    var lines = ['Jebel Ali Hills - Selected Plots', ''];
    list.forEach(function(p, i){
      lines.push((i+1) + '. Plot ' + (p.gisPlot || ''));
      if(p.masterPlot && isVisible('masterPlot')) lines.push('   PA: ' + p.masterPlot);
      if(p.type && isVisible('type')) lines.push('   Type: ' + p.type);
      if(featureText(p)) lines.push('   Features: ' + featureText(p));
      if(p.sizeText && isVisible('size')) lines.push('   Area: ' + p.sizeText + ' sqft');
      if(p.priceText && isVisible('pricing')) lines.push('   Price/sqft: AED ' + p.priceText);
      if(p.total && isVisible('pricing')) lines.push('   Total: ' + fmtMoney(p.total));
      lines.push('');
    });
    lines.push('Source: Hayat Luxury GIS');
    copyText(lines.join('\n'), 'Copy selected plots:');
  };
  window.copySelectedDescription = function(){
    var list = selectedList();
    if(!list.length){ alert('No plots selected'); return; }
    var count = list.length;
    var area = list.reduce(function(s,p){ return s + (Number(p.size)||0); },0);
    var value = list.reduce(function(s,p){ return s + (Number(p.total)||0); },0);
    var types = [];
    var features = [];
    list.forEach(function(p){ unique(types, p.type); splitFeatureText(p.features).forEach(function(f){ unique(features, f); }); });
    var lines = [];
    lines.push('A curated selection of ' + count + ' Jebel Ali Hills plot' + (count > 1 ? 's' : '') + (types.length ? ' including ' + types.slice(0,3).join(', ') : '') + (area ? ', with a combined land area of approximately ' + Math.round(area).toLocaleString() + ' sqft' : '') + '.');
    if(features.length) lines.push('Available plot features include: ' + features.slice(0,8).join(', ') + '.');
    if(value && isVisible('pricing')) lines.push('Combined asking value: ' + fmtMoney(value) + '.');
    var pricedArea = list.reduce(function(s,p){ return s + ((p.total && p.size) ? Number(p.size) : 0); },0);
    if(value && pricedArea && isVisible('pricing')) lines.push('Average price per sqft: AED ' + Math.round(value / pricedArea).toLocaleString() + '.');
    var gfas = [];
    list.forEach(function(p){ unique(gfas, p.gfa); });
    if(gfas.length && isVisible('gfa')) lines.push('GFA: ' + gfas.join(', ') + '.');
    lines.push('This selection is suitable for buyers looking for land opportunities in one of Dubai’s developing villa communities.');
    lines.push('For more information, contact Hayat Luxury Properties.');
    copyText(lines.join('\n\n'), 'Copy selected description:');
  };

  function init(){ patchAdminSizeSave(); console.log(VERSION + ' loaded'); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  setTimeout(init, 500);
})();
