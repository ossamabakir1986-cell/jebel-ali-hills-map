// Hayat GIS v3.3.55 - PA14_223 / PA14_224 master plan swap fix
// Only swaps the Master Plan Plot values for GIS 5130988 and GIS 5130989.
(function(){
  'use strict';
  if(window.__HAYAT_V3355_PA14_MASTER_SWAP_LOADED) return;
  window.__HAYAT_V3355_PA14_MASTER_SWAP_LOADED = true;

  var FIX = {
    '5130988': 'PA14_223',
    '5130989': 'PA14_224'
  };

  function clean(v){ return String(v == null ? '' : v).replace(/\s+/g, ' ').trim(); }
  function gisKey(p){ return clean(p && p.gisPlot).replace(/\D/g, ''); }

  function patchArray(arr){
    if(!Array.isArray(arr)) return false;
    var changed = false;
    arr.forEach(function(p){
      var g = gisKey(p);
      if(FIX[g] && clean(p.masterPlot) !== FIX[g]){
        p.masterPlot = FIX[g];
        p.phase = '14';
        changed = true;
      }
    });
    return changed;
  }

  function refreshMap(){
    try{ if(window.refreshFilterOptionsFromPoints) window.refreshFilterOptionsFromPoints(); }catch(e){}
    try{ if(window.hayatApplyFiltersNow) window.hayatApplyFiltersNow(); }catch(e){}
    try{ if(window.applyFilters) window.applyFilters(); }catch(e){}
    try{ if(window.addMarkers && Array.isArray(window.points)) window.addMarkers(window.points, false); }catch(e){}
    try{ if(window.addCrispMasterPlanLabels) window.addCrispMasterPlanLabels(); }catch(e){}
    try{ document.dispatchEvent(new CustomEvent('hayat:master-plan-fixed', {detail:{version:'3.3.55', fixed:FIX}})); }catch(e){}
  }

  function run(){
    var changed = false;
    changed = patchArray(window.points) || changed;
    changed = patchArray(window.HAYAT_PUBLISHED_POINTS) || changed;
    changed = patchArray(window.adminPoints) || changed;
    changed = patchArray(window.agentPoints) || changed;
    if(changed) refreshMap();
  }

  document.addEventListener('hayat:data-updated', run);
  run();
  setTimeout(run, 1000);
  setTimeout(run, 1600);
  setTimeout(run, 2600);
  setTimeout(run, 4200);
})();
