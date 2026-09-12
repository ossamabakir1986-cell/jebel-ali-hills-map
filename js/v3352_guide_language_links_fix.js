// Hayat GIS v3.3.52 - Guide language/link fix
// Ensures Guide opens the updated bilingual HTML guide, not the old first PDF.
(function(){
  'use strict';
  if(window.__HAYAT_V3352_GUIDE_LANGUAGE_LINKS_FIX_LOADED) return;
  window.__HAYAT_V3352_GUIDE_LANGUAGE_LINKS_FIX_LOADED = true;

  var LANG_KEY = 'HAYAT_UI_LANGUAGE';
  var EN_GUIDE = 'Hayat_GIS_Training_Guide_EN.html?v=3352';
  var AR_GUIDE = 'Hayat_GIS_Training_Guide_AR.html?v=3352';

  function qsa(sel, root){ return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function isArabic(){
    return localStorage.getItem(LANG_KEY) === 'ar' ||
      document.documentElement.lang === 'ar' ||
      document.documentElement.dir === 'rtl' ||
      document.documentElement.classList.contains('hayat-ar');
  }
  function guideUrl(){ return isArabic() ? AR_GUIDE : EN_GUIDE; }
  function guideText(){ return isArabic() ? 'دليل التدريب' : 'Guide'; }

  function fixGuideLinks(){
    var links = qsa('#hayat-v3350-guide,#hayat-v3343-guide,a[href*="Hayat_GIS_Training_Guide"]');
    links.forEach(function(a){
      if(!a || a.tagName !== 'A') return;
      if(a.closest('#hayat-v3350-panel')) return;
      a.href = guideUrl();
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = guideText();
      a.setAttribute('aria-label', guideText());
      a.dataset.hayatGuideFixed = '3352';
    });
  }

  document.addEventListener('click', function(e){
    var a = e.target && e.target.closest ? e.target.closest('#hayat-v3350-guide,#hayat-v3343-guide,a[href*="Hayat_GIS_Training_Guide"]') : null;
    if(!a || a.closest('#hayat-v3350-panel')) return;
    var insideTools = a.closest('#hayat-v3350-toolbar,#hayat-v3347-toolbar,.hayat-v3343-tools,.hayat-v3346-mobile-tools');
    if(!insideTools) return;
    e.preventDefault();
    e.stopPropagation();
    window.open(guideUrl(), '_blank', 'noopener');
    return false;
  }, true);

  document.addEventListener('click', function(){ setTimeout(fixGuideLinks, 80); }, true);
  document.addEventListener('DOMContentLoaded', fixGuideLinks);
  window.addEventListener('load', fixGuideLinks);
  fixGuideLinks();
  setTimeout(fixGuideLinks, 500);
  setTimeout(fixGuideLinks, 1200);
  setTimeout(fixGuideLinks, 2400);
})();
