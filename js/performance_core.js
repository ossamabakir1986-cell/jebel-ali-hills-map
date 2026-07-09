/* Hayat GIS v3.3 Performance Core
   Goal: smoother map interaction without reducing HD map quality.
   This file overrides marker rendering only; it does not change inventory data. */
(function(){
  'use strict';

  var renderToken = 0;
  var markerLayer = null;
  var canvasRenderer = null;
  var popupCache = Object.create(null);
  var labelCache = Object.create(null);

  function getMap(){ return window.map || (typeof map !== 'undefined' ? map : null); }
  function getMarkersArray(){
    if(!window.markers && typeof markers !== 'undefined') window.markers = markers;
    if(!window.markers) window.markers = [];
    return window.markers;
  }
  function setMarkersArray(arr){
    window.markers = arr;
    try { markers = arr; } catch(e) {}
  }
  function getMarkerLayer(){
    var m = getMap();
    if(!m) return null;
    if(!markerLayer){
      markerLayer = L.layerGroup().addTo(m);
      window.hayatInventoryMarkerLayer = markerLayer;
    }
    return markerLayer;
  }
  function getCanvasRenderer(){
    var m = getMap();
    if(!m) return undefined;
    if(!canvasRenderer){
      canvasRenderer = L.canvas({ padding: 0.35, tolerance: 8 });
      window.hayatCanvasRenderer = canvasRenderer;
    }
    return canvasRenderer;
  }
  function clearMarkerLayer(){
    var layer = getMarkerLayer();
    if(layer) layer.clearLayers();
    setMarkersArray([]);
  }
  function safeCall(name, args){
    try { if(typeof window[name] === 'function') return window[name].apply(window, args || []); } catch(e) {}
  }
  function callGlobal(fn, args){
    try { if(typeof window[fn] === 'function') return window[fn].apply(window, args || []); } catch(e) {}
    try { if(typeof eval(fn) === 'function') return eval(fn).apply(window, args || []); } catch(e) {}
  }
  function visibleColor(p){
    try { if(typeof isInventoryColorVisible === 'function') return isInventoryColorVisible(p.color); } catch(e) {}
    return true;
  }
  function labelFor(p){
    var key = (p.row || p.gisPlot || '') + '|' + (p.gisPlot||'') + '|' + (p.masterPlot||'') + '|' + (p.priceText||'') + '|' + (p.secondPriceText||'') + '|' + (p.color||'');
    if(labelCache[key]) return labelCache[key];
    try { labelCache[key] = labelText(p); return labelCache[key]; } catch(e) { return String(p.gisPlot || p.masterPlot || ''); }
  }
  function popupFor(p){
    // Popup HTML is generated lazily on click/open, not for every marker during rendering.
    var key = String(p.row || p.gisPlot || '') + '|' + String(p.priceText||'') + '|' + String(p.secondPriceText||'') + '|' + String(p.agent||'') + '|' + String(p.mobile||'') + '|' + String(p.comment||'');
    if(popupCache[key]) return popupCache[key];
    try { popupCache[key] = popupHtml(p); return popupCache[key]; } catch(e) { return '<b>' + String(p.gisPlot || '') + '</b>'; }
  }
  function resetCaches(){
    popupCache = Object.create(null);
    labelCache = Object.create(null);
  }
  window.hayatResetRenderCaches = resetCaches;

  function makeBounds(list){
    var bounds = [];
    (list || []).forEach(function(p){
      var lat = Number(p.lat), lon = Number(p.lon);
      if(isFinite(lat) && isFinite(lon)) bounds.push([lat, lon]);
    });
    return bounds;
  }

  function buildMarker(p){
    var c = (window.colorHex && window.colorHex[p.color]) || '#666';
    var marker = L.circleMarker([Number(p.lat), Number(p.lon)], {
      radius: 7,
      color: '#fff',
      weight: 1.5,
      fillColor: c,
      fillOpacity: 0.92,
      renderer: getCanvasRenderer(),
      bubblingMouseEvents: false
    });
    try { marker.bindTooltip(labelFor(p), {permanent:true, direction:'top', className:labelClass(p.color), offset:[0,-8]}); } catch(e) {}
    marker.bindPopup(function(){ return popupFor(p); });
    marker.on('click', function(e){
      try{
        if(window.selectionMode || (typeof selectionMode !== 'undefined' && selectionMode)){
          togglePlotSelection(p.gisPlot);
          marker.closePopup();
          if(e && e.originalEvent) L.DomEvent.stop(e.originalEvent);
        }
      }catch(ex){}
    });
    return marker;
  }

  window.addMarkers = function performantAddMarkers(list, doFit){
    if(doFit === undefined) doFit = true;
    var m = getMap();
    var layer = getMarkerLayer();
    if(!m || !layer) return;

    renderToken++;
    var token = renderToken;
    resetCaches();
    clearMarkerLayer();

    list = (list || []).filter(function(p){ return p && isFinite(Number(p.lat)) && isFinite(Number(p.lon)) && visibleColor(p); });
    try { currentList = list; window.currentList = list; } catch(e) {}

    var bounds = makeBounds(list);
    safeCall('updateStats', [list]);
    safeCall('updateSelectionPanel', []);
    if(doFit && bounds.length){
      try { m.fitBounds(bounds, {padding:[80,80], animate:false}); } catch(e) {}
    }

    var output = [];
    setMarkersArray(output);
    var i = 0;
    var batchSize = 90;

    function drawBatch(){
      if(token !== renderToken) return;
      var end = Math.min(i + batchSize, list.length);
      for(; i < end; i++){
        var p = list[i];
        var marker = buildMarker(p);
        marker.addTo(layer);
        output.push({marker: marker, point: p});
      }
      if(i < list.length){
        (window.requestAnimationFrame || window.setTimeout)(drawBatch, 0);
      } else {
        setMarkersArray(output);
        safeCall('refreshSelectionStyles', []);
        safeCall('updateSelectionPanel', []);
      }
    }
    drawBatch();
  };

  window.updateLabels = function performantUpdateLabels(){
    resetCaches();
    getMarkersArray().forEach(function(obj){
      try { obj.marker.setTooltipContent(labelFor(obj.point)); } catch(e) {}
    });
  };

  // Debounce expensive filter runs triggered by fast repeated UI changes.
  if(typeof window.applyFilters === 'function'){
    var originalApplyFilters = window.applyFilters;
    var filterTimer = null;
    window.applyFiltersImmediate = originalApplyFilters;
    window.applyFilters = function(){
      clearTimeout(filterTimer);
      filterTimer = setTimeout(function(){ originalApplyFilters(); }, 60);
    };
  }

  // Give Leaflet a little breathing room during fast touch panning/zooming.
  var m = getMap();
  if(m){
    try{
      m.options.updateWhenIdle = true;
      m.options.updateWhenZooming = false;
      m.options.wheelDebounceTime = 60;
    }catch(e){}
  }
})();
