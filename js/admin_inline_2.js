  // Current light-base cleanup: permanently remove retired Arabic / Guide / What Changed UI.
  (function(){
    try {
      var selectors = [
        '#hayat-v3343-tools','.hayat-v3343-tools',
        '#hayat-v3347-toolbar',
        '#hayat-v3349-fixed-tools',
        '#hayat-v3350-toolbar',
        '#hayat-v3353-toolbar',
        '#hayat-v3354-toolbar',
        '#hayat-v3343-panel','#hayat-v3344-panel',
        '#hayat-v3346-fallback-panel',
        '#hayat-v3349-overlay','#hayat-v3349-box',
        '#hayat-v3350-panel','#hayat-v3353-panel','#hayat-v3354-panel'
      ];
      selectors.forEach(function(sel){
        Array.prototype.slice.call(document.querySelectorAll(sel)).forEach(function(el){
          try { el.remove(); } catch(e) { if(el.parentNode) el.parentNode.removeChild(el); }
        });
      });
      [
        'hayat-v3343-style','hayat-v3344-style','hayat-v3346-mobile-tools-style',
        'hayat-v3347-style','hayat-v3349-style','hayat-v3350-style',
        'hayat-v3351-small-tools-style','hayat-v3353-style','hayat-v3354-css'
      ].forEach(function(id){
        var el=document.getElementById(id); if(el) el.remove();
      });
      document.documentElement.classList.remove('hayat-ar');
      document.documentElement.lang='en';
      document.documentElement.dir='ltr';
      try { localStorage.removeItem('HAYAT_UI_LANGUAGE'); } catch(e) {}
    } catch(e) {}
  })();

  setTimeout(function(){
    if(window.addCrispMasterPlanLabels) addCrispMasterPlanLabels();
  }, 500);

  setTimeout(function(){
    if(document.querySelector('script[src*="v3342_data_update_2026_09_10.js"]')) return;
    var s=document.createElement('script');
    s.src='js/v3342_data_update_2026_09_10.js?v=3342';
    s.async=false;
    document.body.appendChild(s);
  }, 900);

  setTimeout(function(){
    if(document.querySelector('script[src*="v3355_pa14_223_224_master_swap_fix.js"]')) return;
    var s=document.createElement('script');
    s.src='js/v3355_pa14_223_224_master_swap_fix.js?v=3355';
    s.async=false;
    document.body.appendChild(s);
  }, 1200);

  setTimeout(function(){
    if(document.querySelector('script[src*="v3356_data_update_2026_09_20.js"]')) return;
    var s=document.createElement('script');
    s.src='js/v3356_data_update_2026_09_20.js?v=3356';
    s.async=false;
    document.body.appendChild(s);
  }, 1450);

  setTimeout(function(){
    if(document.querySelector('script[src*="v3341_stable_filter_tabs_all_button_fix.js"]')) return;
    var s=document.createElement('script');
    s.src='js/v3341_stable_filter_tabs_all_button_fix.js?v=3341';
    s.async=false;
    document.body.appendChild(s);
  }, 1800);
