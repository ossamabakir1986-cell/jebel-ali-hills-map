// Hayat GIS v3.3.46 - Mobile tools visibility fix
// Keeps Arabic / Guide / What changed buttons visible and clickable on mobile.
(function(){
  'use strict';
  if(window.__HAYAT_V3346_MOBILE_TOOLS_VISIBILITY_LOADED) return;
  window.__HAYAT_V3346_MOBILE_TOOLS_VISIBILITY_LOADED = true;
  var LANG_KEY='HAYAT_UI_LANGUAGE';
  function qs(s,r){return (r||document).querySelector(s)}
  function qsa(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
  function isAr(){return localStorage.getItem(LANG_KEY)==='ar'||document.documentElement.lang==='ar'||document.documentElement.dir==='rtl'}
  function addStyle(){
    if(document.getElementById('hayat-v3346-mobile-tools-style')) return;
    var s=document.createElement('style');
    s.id='hayat-v3346-mobile-tools-style';
    s.textContent=[
      '.hayat-v3343-tools{visibility:visible!important;opacity:1!important;pointer-events:auto!important}',
      '.hayat-v3343-tools button,.hayat-v3343-tools a{visibility:visible!important;opacity:1!important;pointer-events:auto!important}',
      '.hayat-v3346-fallback-panel{display:none;position:fixed;z-index:2147483646;top:74px;left:10px;right:10px;max-height:70vh;overflow:auto;background:#fffdfa;color:#10211d;border:2px solid #d3ab4e;border-radius:14px;box-shadow:0 14px 38px rgba(0,0,0,.34);padding:14px;font-family:Arial,Helvetica,sans-serif}',
      '.hayat-v3346-fallback-panel.open{display:block}',
      '.hayat-v3346-fallback-panel button{float:right;background:#10211d;color:#d3ab4e;border:0;border-radius:8px;padding:7px 10px;font-weight:900}',
      '@media(max-width:820px){.hayat-v3343-tools{position:fixed!important;top:calc(env(safe-area-inset-top,0px) + 8px)!important;bottom:auto!important;left:50%!important;right:auto!important;transform:translateX(-50%)!important;z-index:2147483647!important;display:flex!important;flex-direction:row!important;align-items:center!important;justify-content:center!important;gap:6px!important;width:auto!important;max-width:calc(100vw - 12px)!important;padding:6px!important;border-radius:16px!important;background:rgba(16,33,29,.96)!important;border:1.5px solid #d3ab4e!important;box-shadow:0 7px 24px rgba(0,0,0,.40)!important}.hayat-v3343-tools button,.hayat-v3343-tools a{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-width:auto!important;max-width:34vw!important;height:36px!important;padding:7px 9px!important;margin:0!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;font-size:12px!important;line-height:1!important;border-radius:10px!important;background:#10211d!important;color:#d3ab4e!important;border:1px solid #d3ab4e!important;box-shadow:none!important}#hayat-v3343-panel{top:62px!important;left:8px!important;right:8px!important;width:auto!important;max-width:none!important;max-height:calc(100dvh - 76px)!important;z-index:2147483646!important}html.hayat-ar #hayat-v3343-panel{left:8px!important;right:8px!important}}',
      '@media(min-width:821px){.hayat-v3343-tools{top:76px!important;right:12px!important;left:auto!important;bottom:auto!important;transform:none!important}}'
    ].join('\n');
    document.head.appendChild(s);
  }
  function btn(id,text,fn){var b=document.createElement('button');b.id=id;b.type='button';b.textContent=text;b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();fn()},true);return b}
  function fallbackPanel(){
    var p=document.getElementById('hayat-v3346-fallback-panel');
    if(p) return p;
    p=document.createElement('div');p.id='hayat-v3346-fallback-panel';p.className='hayat-v3346-fallback-panel';
    p.innerHTML='<button type="button" id="hayat-v3346-fallback-close">Close</button><h3>What changed</h3><p>The latest map update includes current plot data, stable filters, Arabic/English tools, guide links, and update notes.</p>';
    document.body.appendChild(p);
    var c=document.getElementById('hayat-v3346-fallback-close');if(c)c.addEventListener('click',function(){p.classList.remove('open');p.style.display='none'},true);
    return p;
  }
  function ensure(){
    addStyle();
    var tools=qs('.hayat-v3343-tools');
    if(!tools){tools=document.createElement('div');tools.className='hayat-v3343-tools hayat-v3346-created-tools';document.body.appendChild(tools)}
    tools.classList.add('hayat-v3346-visible-tools');
    if(tools.parentNode!==document.body) document.body.appendChild(tools);
    var lang=document.getElementById('hayat-v3343-lang');
    if(!lang){lang=btn('hayat-v3343-lang',isAr()?'English':'العربية',function(){localStorage.setItem(LANG_KEY,isAr()?'en':'ar');location.reload()});tools.appendChild(lang)} else if(lang.parentNode!==tools){tools.appendChild(lang)}
    var guide=document.getElementById('hayat-v3343-guide');
    if(!guide){guide=btn('hayat-v3343-guide',isAr()?'دليل التدريب':'Guide',function(){window.open(isAr()?'Hayat_GIS_Training_Guide_AR.html':'Hayat_GIS_Training_Guide_EN.html','_blank','noopener')});tools.appendChild(guide)} else if(guide.parentNode!==tools){tools.appendChild(guide)}
    var updates=document.getElementById('hayat-v3343-updates');
    if(!updates){updates=btn('hayat-v3343-updates',isAr()?'ما الذي تغير؟':'What changed',function(){var p=document.getElementById('hayat-v3343-panel')||fallbackPanel();if(p.classList.contains('open')){p.classList.remove('open');p.style.display='none'}else{p.style.display='block';p.classList.add('open')}});tools.appendChild(updates)} else if(updates.parentNode!==tools){tools.appendChild(updates)}
    qsa('.hayat-v3343-tools').forEach(function(el){if(el!==tools)el.style.display='none'});
  }
  [200,800,1600,2600,4200].forEach(function(ms){setTimeout(ensure,ms)});
  window.addEventListener('resize',ensure);
  window.addEventListener('orientationchange',function(){setTimeout(ensure,250)});
})();
