// Hayat GIS v3.3.45 - Update panel close button fix
// Makes the What changed / Latest updates close button reliable on Admin and Agent maps.
(function(){
  'use strict';
  if(window.__HAYAT_V3345_UPDATE_PANEL_CLOSE_FIX_LOADED) return;
  window.__HAYAT_V3345_UPDATE_PANEL_CLOSE_FIX_LOADED = true;

  function getPanel(){ return document.getElementById('hayat-v3343-panel'); }
  function getClose(){ return document.getElementById('hayat-v3343-close'); }

  function closePanel(ev){
    if(ev){
      ev.preventDefault();
      ev.stopPropagation();
      if(typeof ev.stopImmediatePropagation === 'function') ev.stopImmediatePropagation();
    }
    var panel = getPanel();
    if(!panel) return false;
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden','true');
    panel.removeAttribute('data-open');
    return false;
  }

  function markPanelState(){
    var panel = getPanel();
    if(!panel) return;
    panel.setAttribute('role','dialog');
    panel.setAttribute('aria-live','polite');
    panel.setAttribute('aria-hidden', panel.classList.contains('open') ? 'false' : 'true');
  }

  function attachCloseButton(){
    var btn = getClose();
    if(!btn) return;
    btn.setAttribute('type','button');
    btn.setAttribute('aria-label', /إغلاق/.test(btn.textContent || '') ? 'إغلاق نافذة التحديثات' : 'Close update panel');
    btn.style.pointerEvents = 'auto';
    btn.style.cursor = 'pointer';
    // Use both onclick and addEventListener because the panel content is rebuilt dynamically.
    btn.onclick = closePanel;
    if(!btn.__HAYAT_V3345_CLOSE_ATTACHED){
      btn.__HAYAT_V3345_CLOSE_ATTACHED = true;
      btn.addEventListener('click', closePanel, true);
    }
  }

  function enhance(){
    markPanelState();
    attachCloseButton();
  }

  // Capture the click before any older script can swallow it or rebuild the panel.
  document.addEventListener('click', function(ev){
    var target = ev.target;
    if(!target || !target.closest) return;
    var close = target.closest('#hayat-v3343-close, .hayat-v3343-close, [data-hayat-close-updates]');
    if(close) closePanel(ev);
  }, true);

  // Keep the close handler attached after the update panel is re-rendered.
  var timer = null;
  function scheduleEnhance(){
    clearTimeout(timer);
    timer = setTimeout(enhance, 40);
  }

  if(document.body){
    try{
      var mo = new MutationObserver(scheduleEnhance);
      mo.observe(document.body, {childList:true, subtree:true});
    }catch(_){ }
  }

  // Escape closes the update panel too.
  document.addEventListener('keydown', function(ev){
    if(ev.key === 'Escape') closePanel(ev);
  }, true);

  // When What changed is opened, re-attach the close behavior after the panel HTML is rebuilt.
  function hookUpdateButton(){
    var btn = document.getElementById('hayat-v3343-updates');
    if(!btn || btn.__HAYAT_V3345_UPDATES_HOOKED) return;
    btn.__HAYAT_V3345_UPDATES_HOOKED = true;
    btn.addEventListener('click', function(){
      setTimeout(enhance, 30);
      setTimeout(enhance, 120);
    }, true);
  }

  function boot(n){
    hookUpdateButton();
    enhance();
    if(n < 30) setTimeout(function(){ boot(n+1); }, n < 8 ? 250 : 1000);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ boot(0); });
  else boot(0);
})();
