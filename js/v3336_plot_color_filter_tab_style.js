// Hayat GIS v3.3.36 - Plot Color Filter Placement + Unified Filter Tab Styling
// Builds on v3.3.35. Lightweight UI compatibility layer only.
(function(){
  'use strict';
  if(window.__HAYAT_V3336_COLOR_TAB_STYLE_LOADED) return;
  window.__HAYAT_V3336_COLOR_TAB_STYLE_LOADED = true;

  var VERSION = 'v3.3.36 Plot Color Filter + Unified Filter Tab Styling';

  function byId(id){ return document.getElementById(id); }
  function clean(v){ return String(v == null ? '' : v).replace(/\s+/g,' ').trim(); }
  function allPoints(){ return Array.isArray(window.points) ? window.points : (Array.isArray(window.HAYAT_PUBLISHED_POINTS) ? window.HAYAT_PUBLISHED_POINTS : []); }

  function addStyles(){
    if(byId('hayat-v3336-style')) return;
    var st=document.createElement('style');
    st.id='hayat-v3336-style';
    st.textContent = [
      '/* v3.3.36: make all main filter dropdown tabs match All agents */',
      '#agent,#type,#feature,#phase,#gfa,#priced,.v3335-multi-btn{background:#10211D!important;color:#CEA350!important;border:1px solid rgba(206,163,80,.70)!important;border-radius:8px!important;font-weight:800!important;box-shadow:0 1px 3px rgba(16,33,29,.18)!important;}',
      '#agent:hover,#type:hover,#feature:hover,#phase:hover,#gfa:hover,#priced:hover,.v3335-multi-btn:hover{background:#1F3F37!important;color:#CEA350!important;}',
      '#agent:focus,#type:focus,#feature:focus,#phase:focus,#gfa:focus,#priced:focus,.v3335-multi-btn:focus{outline:2px solid rgba(206,163,80,.40)!important;border-color:#CEA350!important;}',
      '#agent option,#type option,#feature option,#phase option,#gfa option,#priced option{background:#fffdfa!important;color:#10211D!important;font-weight:600!important;}',
      '#gfa.hayat-v3336-filter-hidden{display:none!important;}',
      '#color.hayat-v3336-source-hidden{display:none!important;}',
      '.v3335-multi-filter[data-v3335-filter="color"] .v3335-multi-btn{background:#10211D!important;color:#CEA350!important;border-color:rgba(206,163,80,.70)!important;}',
      '.v3335-multi-filter[data-v3335-filter="color"]{flex:1 1 0;min-width:0;width:100%;}',
      '.v3335-multi-filter[data-v3335-filter="phase"]{flex:1 1 0;min-width:0;width:100%;}',
      '.hayat-v3336-gfa-note{font-size:10.5px;color:#6b6047;margin:-1px 0 4px 2px;line-height:1.25;}'
    ].join('\n');
    document.head.appendChild(st);
  }

  function normalizeColorValue(v){
    var x=clean(v);
    if(!x) return '';
    if(window.HayatDataNormalize && window.HayatDataNormalize.normalizeColor){
      try{ x=window.HayatDataNormalize.normalizeColor(x); }catch(e){}
    }
    return clean(x);
  }

  function refreshColorSelectOptions(){
    var color=byId('color');
    if(!color) return;
    var current=clean(color.value);
    var found=[];
    allPoints().forEach(function(p){
      [p.color, p.secondColor].forEach(function(c){
        c=normalizeColorValue(c);
        if(c && found.map(function(x){return x.toLowerCase();}).indexOf(c.toLowerCase()) === -1) found.push(c);
      });
    });
    found.sort(function(a,b){
      var order={red:1, blue:2, pink:3, black:4, green:5, yellow:6, orange:7, other:99};
      var aa=order[String(a).toLowerCase()] || 50;
      var bb=order[String(b).toLowerCase()] || 50;
      return aa-bb || String(a).localeCompare(String(b));
    });
    if(!found.length){ found=['Red','Blue','Pink']; }
    color.innerHTML = '<option value="">All plot colors</option>' + found.map(function(c){
      return '<option value="'+c.replace(/[&<>"]/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch];})+'">'+c.replace(/[&<>]/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[ch];})+'</option>';
    }).join('');
    if(current){
      Array.prototype.some.call(color.options, function(o){ if(o.value === current){ color.value=current; return true; } return false; });
    }
  }

  function updateColorButtonCopy(){
    var wrap=document.querySelector('[data-v3335-filter="color"]');
    if(!wrap) return;
    var btn=wrap.querySelector('.v3335-multi-btn');
    if(btn && (/^All statuses$/i.test(clean(btn.textContent)) || !clean(btn.textContent))){
      btn.textContent='All plot colors';
      btn.title='Choose one or more plot colors';
    }
    var head=wrap.querySelector('.v3335-multi-head b');
    if(head && /^Status\s*\/\s*Color$/i.test(clean(head.textContent))){ head.textContent='Plot colors'; }
  }

  function placeColorWhereGfaWas(){
    addStyles();
    refreshColorSelectOptions();

    var color=byId('color');
    var gfa=byId('gfa');
    var phase=byId('phase');
    if(color){ color.classList.add('hayat-v3336-source-hidden'); }
    if(gfa){
      gfa.value='';
      gfa.classList.add('hayat-v3336-filter-hidden');
      try{ gfa.dispatchEvent(new Event('change', {bubbles:true})); }catch(e){}
    }

    var colorWrap=document.querySelector('[data-v3335-filter="color"]');
    // Ask the v3.3.35 layer to build once if the color multi-select is not ready yet.
    if(!colorWrap){
      try{ if(window.refreshFilterOptionsFromPoints) window.refreshFilterOptionsFromPoints(); }catch(e){}
      colorWrap=document.querySelector('[data-v3335-filter="color"]');
    }
    var phaseWrap=document.querySelector('[data-v3335-filter="phase"]');
    gfa=byId('gfa');
    phase=byId('phase');

    if(colorWrap){
      var targetRow = gfa ? gfa.closest('.row') : (phaseWrap ? phaseWrap.closest('.row') : (phase ? phase.closest('.row') : null));
      if(targetRow){
        // Put the plot color filter where the GFA dropdown used to be.
        if(gfa && gfa.parentNode === targetRow){
          targetRow.insertBefore(colorWrap, gfa.nextSibling);
        }else{
          targetRow.appendChild(colorWrap);
        }
      }
      colorWrap.style.display='';
    }
    if(phaseWrap) phaseWrap.style.display='';
    if(gfa){ gfa.classList.add('hayat-v3336-filter-hidden'); }
    updateColorButtonCopy();
  }

  function installPersistentFix(){
    if(window.__HAYAT_V3336_PERSISTENT_FIX) return;
    window.__HAYAT_V3336_PERSISTENT_FIX=true;
    var count=0;
    var timer=setInterval(function(){
      count++;
      try{ placeColorWhereGfaWas(); }catch(e){ console.warn('v3336 placement refresh failed', e); }
      if(count >= 12) clearInterval(timer);
    }, 450);

    var obsTarget=document.querySelector('.panel') || document.body;
    if(obsTarget && window.MutationObserver){
      var obs=new MutationObserver(function(){
        clearTimeout(window.__HAYAT_V3336_MUT_TIMER);
        window.__HAYAT_V3336_MUT_TIMER=setTimeout(function(){
          try{ placeColorWhereGfaWas(); }catch(e){}
        }, 120);
      });
      obs.observe(obsTarget, {childList:true, subtree:true});
    }
  }

  function boot(){
    try{ placeColorWhereGfaWas(); }catch(e){ console.warn('v3336 initial fix failed', e); }
    installPersistentFix();
    console.log(VERSION + ' loaded');
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
