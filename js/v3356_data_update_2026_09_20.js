// Hayat GIS v3.3.56 - Data Update 2026-09-20
// Applies the 20 Sep 2026 exported map-data delta on top of the current light-loader base.
(function(){
  'use strict';
  if(window.__HAYAT_V3356_DATA_UPDATE_20260920_LOADED) return;
  window.__HAYAT_V3356_DATA_UPDATE_20260920_LOADED = true;

  var PATCH = {"updatedAt":"2026-09-20T13:38:50+04:00","recordCount":497,"paCount":2963,"updated":{"5137682":{"gfaAllowedText":"33,691.04","gfaAllowedOverride":33691.04,"manualGfaAllowed":33691.04,"gfaAllowedManual":33691.04,"gfaAllowed":33691.04,"gfaAllowedIsManual":true},"5130988":{"masterPlot":"PA14_223"},"5131628":{"lastUpdated":"20/09/2026","total":4117680.0000000005,"commission":82353.6,"totalText":"4,117,680","price":400,"lastDateUpdated":"20/09/2026","priceText":"400","gfaAllowedIsManual":false,"commissionText":"82,353.6","deposit":411768.00000000006,"depositText":"411,768"},"5131629":{"lastUpdated":"20/09/2026","total":4058748.0000000005,"commission":81174.96,"totalText":"4,058,748","price":400,"lastDateUpdated":"20/09/2026","priceText":"400","gfaAllowedIsManual":false,"commissionText":"81,174.96","deposit":405874.80000000005,"depositText":"405,874.8"},"5130989":{"masterPlot":"PA14_224"},"5131630":{"lastUpdated":"20/09/2026","total":4285560,"commission":85711.2,"totalText":"4,285,560","price":400,"lastDateUpdated":"20/09/2026","priceText":"400","gfaAllowedIsManual":false,"commissionText":"85,711.2","deposit":428556,"depositText":"428,556"}},"added":[{"row":616,"coords":"24.8956789, 54.9906938","mapsUrl":"https://www.google.com/maps?q=24.8956789,54.9906938","gisPlot":"5131164","masterPlot":"PA14_23","agent":"Hayat Al Masri","mobile":"+971 58 517 6888","size":9594.43,"price":350,"color":"Red","type":"Plot","phase":"14","secondAgent":"","secondMobile":"","secondPrice":null,"secondColor":"","comment":"with all designs and extra charges might arise because owners are issuing 2 villas permit but still undergoing","lat":24.8956789,"lon":54.9906938,"sizeText":"9,594.43","priceText":"350","secondPriceText":"","total":3358050.5,"totalText":"3,358,051","deposit":335805.05000000005,"depositText":"335,805.05","commission":67161.01,"commissionText":"67,161.01","secondTotal":null,"secondTotalText":"","secondDeposit":null,"secondDepositText":"","secondCommission":null,"secondCommissionText":"","gfaPct":65,"gfaAllowed":6236.3795,"gfaAllowedText":"6,236.38","features":"Single Row","gfa":"G+1","gfaAllowedIsManual":false,"lastUpdated":"20/09/2026","lastDateUpdated":"20/09/2026"},{"row":617,"coords":"24.8950801, 54.9746099","mapsUrl":"https://www.google.com/maps?q=24.8950801,54.9746099","gisPlot":"5130824","masterPlot":"PA10_100","agent":"Abdullah Assani","mobile":"+971 56 644 7443","size":9687.57,"price":320,"color":"Blue","type":"Plot","phase":"10","secondAgent":"","secondMobile":"","secondPrice":null,"secondColor":"","comment":"","lat":24.8950801,"lon":54.9746099,"sizeText":"9,687.57","priceText":"320","secondPriceText":"","total":3100022.4,"totalText":"3,100,022","deposit":310002.24,"depositText":"310,002.24","commission":62000.448,"commissionText":"62,000.45","secondTotal":null,"secondTotalText":"","secondDeposit":null,"secondDepositText":"","secondCommission":null,"secondCommissionText":"","gfaPct":65,"gfaAllowed":6296.9205,"gfaAllowedText":"6,296.92","features":"Back to Back","gfa":"G+1","gfaAllowedIsManual":false,"lastUpdated":"20/09/2026","lastDateUpdated":"20/09/2026"}],"removed":[],"paUpdated":{},"paAdded":[],"paRemoved":[]};

  function clean(v){ return String(v == null ? '' : v).replace(/\s+/g,' ').trim(); }
  function keyOf(p){ return clean((p && (p.gisPlot || p.masterPlot)) || ''); }

  function patchArray(arr){
    if(!Array.isArray(arr)) return false;
    var byKey = {};
    for(var i=0;i<arr.length;i++) byKey[keyOf(arr[i])] = i;

    (PATCH.removed || []).forEach(function(k){
      k = clean(k);
      if(Object.prototype.hasOwnProperty.call(byKey,k)){
        arr.splice(byKey[k],1);
        byKey = {};
        for(var j=0;j<arr.length;j++) byKey[keyOf(arr[j])] = j;
      }
    });

    Object.keys(PATCH.updated || {}).forEach(function(k){
      var idx = byKey[clean(k)];
      if(idx == null) return;
      var d = PATCH.updated[k] || {};
      Object.keys(d).forEach(function(field){ arr[idx][field] = d[field]; });
    });

    (PATCH.added || []).forEach(function(rec){
      var k = keyOf(rec);
      if(!k) return;
      if(Object.prototype.hasOwnProperty.call(byKey,k)){
        var idx = byKey[k];
        Object.keys(rec).forEach(function(field){ arr[idx][field] = rec[field]; });
      } else {
        arr.push(rec);
        byKey[k] = arr.length - 1;
      }
    });

    return true;
  }

  function patchPALabels(){
    var labels = window.JAH_PA_LABELS;
    if(!Array.isArray(labels)) return false;
    var byT = {};
    labels.forEach(function(x,i){ byT[clean(x && x.t)] = i; });

    (PATCH.paRemoved || []).forEach(function(t){
      t=clean(t);
      if(Object.prototype.hasOwnProperty.call(byT,t)){
        labels.splice(byT[t],1);
        byT = {};
        labels.forEach(function(x,i){ byT[clean(x && x.t)] = i; });
      }
    });

    Object.keys(PATCH.paUpdated || {}).forEach(function(t){
      var rec = PATCH.paUpdated[t];
      var idx = byT[clean(t)];
      if(idx == null) return;
      Object.keys(rec).forEach(function(field){ labels[idx][field] = rec[field]; });
    });

    (PATCH.paAdded || []).forEach(function(rec){
      var t=clean(rec && rec.t);
      if(!t) return;
      if(Object.prototype.hasOwnProperty.call(byT,t)){
        var idx=byT[t];
        Object.keys(rec).forEach(function(field){ labels[idx][field] = rec[field]; });
      } else {
        labels.push(rec);
        byT[t]=labels.length-1;
      }
    });
    return true;
  }

  function refreshAfterPatch(){
    try { window.HAYAT_PUBLISHED_UPDATED = PATCH.updatedAt; } catch(_ ){}
    try { if(typeof window.refreshFilterOptionsFromPoints === 'function') window.refreshFilterOptionsFromPoints(); } catch(_ ){}
    try { if(typeof window.hayatApplyFiltersNow === 'function') window.hayatApplyFiltersNow(); } catch(_ ){}
    try { if(typeof window.applyFilters === 'function') window.applyFilters(); } catch(_ ){}
    try {
      if(Array.isArray(window.points) && typeof window.addMarkers === 'function') {
        window.addMarkers(window.points, false);
      }
    } catch(_ ){}
    try { if(typeof window.addCrispMasterPlanLabels === 'function') window.addCrispMasterPlanLabels(); } catch(_ ){}
    try {
      window.dispatchEvent(new CustomEvent('hayat:data-updated', {
        detail: {version:'v3.3.56', updatedAt:PATCH.updatedAt, records:PATCH.recordCount, paLabels:PATCH.paCount}
      }));
    } catch(_ ){}
  }

  var tries = 0;
  function apply(){
    tries++;
    var did = false;
    try {
      if(Array.isArray(window.points)) did = patchArray(window.points) || did;
      if(Array.isArray(window.HAYAT_PUBLISHED_POINTS)) did = patchArray(window.HAYAT_PUBLISHED_POINTS) || did;
      patchPALabels();
    } catch(e) {
      console.warn('Hayat v3.3.56 data patch error', e);
    }

    if(did){
      window.__HAYAT_V3356_DATA_UPDATE_20260920_APPLIED = true;
      refreshAfterPatch();
    } else if(tries < 30) {
      setTimeout(apply, 300);
    }
  }

  setTimeout(apply, 250);
})();
