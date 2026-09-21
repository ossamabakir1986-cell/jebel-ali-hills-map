(function(){
  'use strict';
  if(window.__HAYAT_CAPTURE_LINK_LOADED) return;
  window.__HAYAT_CAPTURE_LINK_LOADED = true;

  function listSelectedIds(){
    try {
      if(typeof window.selectedList === 'function') {
        return window.selectedList().map(function(p){ return String(p.gisPlot || ''); }).filter(Boolean);
      }
    } catch(e) {}
    try {
      return Object.keys(window.selectedPlots || {}).filter(function(k){ return window.selectedPlots[k]; });
    } catch(e) {}
    return [];
  }

  function currentBounds(){
    try {
      if(!window.map || typeof window.map.getBounds !== 'function') return null;
      var b = window.map.getBounds();
      return {
        north:Number(b.getNorth()), south:Number(b.getSouth()),
        east:Number(b.getEast()), west:Number(b.getWest())
      };
    } catch(e) { return null; }
  }

  function openCaptureStudio(){
    var selected = listSelectedIds();
    var bounds = currentBounds();
    var context = {
      version:1,
      source:location.pathname.indexOf('admin') !== -1 ? 'admin' : 'agent',
      selected:selected,
      bounds:bounds,
      createdAt:new Date().toISOString()
    };
    try { sessionStorage.setItem('JAH_CAPTURE_CONTEXT_V1', JSON.stringify(context)); } catch(e) {}
    var handoff='capture-'+Date.now()+'-'+Math.random().toString(36).slice(2,8);
    try {
      localStorage.setItem('JAH_CAPTURE_HANDOFF_V1', JSON.stringify({token:handoff,context:context}));
    } catch(e) {}
    var mode = selected.length ? 'selected' : 'current';
    var url='capture.html?mode='+mode+'&handoff='+encodeURIComponent(handoff);
    if(selected.length && selected.length<=120) url+='&plots='+encodeURIComponent(selected.join(','));
    if(bounds) url+='&bounds='+encodeURIComponent([bounds.north,bounds.south,bounds.east,bounds.west].join(','));
    window.open(url, '_blank', 'noopener');
  }

  function mount(){
    if(!document.getElementById('map')) return;
    if(document.getElementById('hayatCaptureStudioLink')) return;
    var button = document.createElement('button');
    button.id = 'hayatCaptureStudioLink';
    button.type = 'button';
    button.className = 'hayat-capture-link';
    button.title = 'Create a professional client-ready map';
    button.innerHTML = '<span aria-hidden="true">&#128247;</span><span>Client Map</span>';
    button.addEventListener('click', openCaptureStudio);
    document.body.appendChild(button);

    var style = document.createElement('style');
    style.id = 'hayatCaptureStudioLinkStyle';
    style.textContent =
      '.hayat-capture-link{position:fixed;right:14px;top:14px;z-index:1100;width:auto!important;display:flex;align-items:center;gap:7px;padding:9px 12px!important;border-radius:999px!important;box-shadow:0 8px 22px rgba(3,28,23,.24);font:700 12px/1 Arial,sans-serif;white-space:nowrap}' +
      '.hayat-capture-link span:first-child{font-size:15px}' +
      '@media(max-width:620px){.hayat-capture-link{right:8px;top:8px;padding:8px 10px!important}.hayat-capture-link span:last-child{display:none}}';
    document.head.appendChild(style);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
  window.openCaptureStudio = openCaptureStudio;
})();
