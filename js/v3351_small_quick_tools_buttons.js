// Hayat GIS v3.3.51 - smaller Quick tools buttons
// Makes Arabic / Guide / What changed buttons closer to the normal filter button size.
(function(){
  'use strict';
  if(window.__HAYAT_V3351_SMALL_QUICK_TOOLS_BUTTONS_LOADED) return;
  window.__HAYAT_V3351_SMALL_QUICK_TOOLS_BUTTONS_LOADED = true;

  function q(sel, root){ return (root || document).querySelector(sel); }

  function addStyle(){
    var old = q('#hayat-v3351-small-tools-style');
    if(old) old.remove();
    var s = document.createElement('style');
    s.id = 'hayat-v3351-small-tools-style';
    s.textContent = [
      '#hayat-v3350-toolbar{margin:6px 0 8px!important;padding:5px 6px!important;border-radius:10px!important;border-width:1px!important;background:rgba(16,33,29,.94)!important}',
      '#hayat-v3350-toolbar .hayat-v3350-title{font-size:10px!important;margin:0 0 4px!important;line-height:1.1!important}',
      '#hayat-v3350-toolbar .hayat-v3350-buttons{gap:6px!important;display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important}',
      '#hayat-v3350-toolbar button,#hayat-v3350-toolbar a{height:32px!important;min-height:32px!important;padding:4px 6px!important;border-radius:8px!important;font-size:12px!important;font-weight:800!important;line-height:1!important;border-width:1px!important;white-space:nowrap!important}',
      '#hayat-v3350-toolbar button:active,#hayat-v3350-toolbar a:active{transform:scale(.98)!important}',
      '@media(max-width:820px){#hayat-v3350-toolbar{margin:5px 0 7px!important;padding:4px 5px!important;border-radius:9px!important}#hayat-v3350-toolbar .hayat-v3350-title{font-size:9.5px!important;margin:0 0 3px!important}#hayat-v3350-toolbar .hayat-v3350-buttons{gap:5px!important}#hayat-v3350-toolbar button,#hayat-v3350-toolbar a{height:30px!important;min-height:30px!important;padding:3px 5px!important;border-radius:7px!important;font-size:11px!important;font-weight:800!important}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function tune(){
    addStyle();
    var toolbar = q('#hayat-v3350-toolbar');
    if(toolbar){
      toolbar.setAttribute('data-size','compact');
      var title = q('.hayat-v3350-title', toolbar);
      if(title && !title.textContent.trim()) title.style.display = 'none';
    }
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tune, {once:true});
  else tune();
  setTimeout(tune, 800);
  setTimeout(tune, 1800);
})();