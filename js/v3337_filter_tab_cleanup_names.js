// Hayat GIS v3.3.37 - Filter Tab Cleanup + Locked Tab Names
// Builds on v3.3.36. Removes duplicate plot-color widgets, restores normal GFA tab, and locks filter tab names.
(function(){
  'use strict';
  if(window.__HAYAT_V3337_FILTER_TAB_CLEANUP_LOADED) return;
  window.__HAYAT_V3337_FILTER_TAB_CLEANUP_LOADED = true;

  var VERSION = 'v3.3.37 Filter Tab Cleanup + Locked Tab Names';
  var LABELS = {
    agent: 'All agents',
    color: 'All statuses',
    type: 'All types',
    feature: 'All features',
    phase: 'All phases',
    gfa: 'All GFA',
    priced: 'All pricing'
  };

  function byId(id){ return document.getElementById(id); }
  function clean(v){ return String(v == null ? '' : v).replace(/\s+/g,' ').trim(); }
  function esc(v){ return String(v == null ? '' : v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function qsa(sel, root){ return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function addStyles(){
    if(byId('hayat-v3337-style')) return;
    var st=document.createElement('style');
    st.id='hayat-v3337-style';
    st.textContent = [
      '/* v3.3.37: prevent duplicate plot-color controls and make filter tabs visually consistent */',
      '#gfa.hayat-v3336-filter-hidden{display:block!important;}',
      '#color.hayat-v3336-source-hidden{display:none!important;}',
      '.v3335-multi-filter[data-v3335-filter="color"].hayat-v3337-duplicate{display:none!important;}',
      '#agent,#type,#feature,#phase,#gfa,#priced,.v3335-multi-btn{min-height:34px;border-radius:8px!important;font-weight:600!important;box-sizing:border-box!important;}',
      '.hayat-v3337-unified-tabs #agent,.hayat-v3337-unified-tabs #type,.hayat-v3337-unified-tabs #feature,.hayat-v3337-unified-tabs #phase,.hayat-v3337-unified-tabs #gfa,.hayat-v3337-unified-tabs #priced,.hayat-v3337-unified-tabs .v3335-multi-btn{background:var(--hayat-v3337-tab-bg,#fff)!important;color:var(--hayat-v3337-tab-color,#111827)!important;border:var(--hayat-v3337-tab-border,1px solid #d1d5db)!important;box-shadow:var(--hayat-v3337-tab-shadow,none)!important;}',
      '.hayat-v3337-unified-tabs select option{background:#fff!important;color:#111827!important;}',
      '.v3335-multi-filter{min-width:0!important;}',
      '.v3335-multi-filter[data-v3335-filter="color"] .v3335-multi-head b::after{content:"";}'
    ].join('\n');
    document.head.appendChild(st);
  }

  function setFirstOptionLabel(selectId, label){
    var el=byId(selectId);
    if(!el || !el.options || !el.options.length) return;
    var opt = el.options[0];
    if(opt && clean(opt.value) === '') opt.textContent = label;
  }

  function resetOptionLabels(){
    setFirstOptionLabel('agent', LABELS.agent);
    setFirstOptionLabel('color', LABELS.color);
    setFirstOptionLabel('type', LABELS.type);
    setFirstOptionLabel('feature', LABELS.feature);
    setFirstOptionLabel('phase', LABELS.phase);
    setFirstOptionLabel('gfa', LABELS.gfa);
    setFirstOptionLabel('priced', LABELS.priced);
  }

  function removeDuplicateMultiWidgets(){
    ['agent','color','feature','phase'].forEach(function(id){
      var wraps=qsa('[data-v3335-filter="'+id+'"]');
      if(!wraps.length) return;
      var sel=byId(id);
      var keep = null;
      if(sel && sel.parentNode){
        keep = wraps.find(function(w){ return w.parentNode === sel.parentNode; }) || null;
      }
      keep = keep || wraps[0];
      wraps.forEach(function(w){
        if(w !== keep){
          w.classList.add('hayat-v3337-duplicate');
          try{ w.parentNode && w.parentNode.removeChild(w); }catch(e){ w.style.display='none'; }
        }
      });
      if(sel && keep && sel.parentNode && keep.parentNode !== sel.parentNode){
        try{ sel.insertAdjacentElement('afterend', keep); }catch(e){}
      }
    });
  }

  function restoreGfaAndColorPositions(){
    var gfa=byId('gfa');
    if(gfa){
      gfa.classList.remove('hayat-v3336-filter-hidden');
      gfa.style.display='';
    }
    var color=byId('color');
    if(color){
      // Keep the original select hidden because v3.3.35 turns it into the multi-select "All statuses" control.
      color.classList.add('hayat-v3336-source-hidden');
      color.style.display='none';
    }
  }

  function setMultiLabel(id, allText, headText){
    var wrap=document.querySelector('[data-v3335-filter="'+id+'"]');
    if(!wrap) return;
    var btn=wrap.querySelector('.v3335-multi-btn');
    var checked=qsa('input[type="checkbox"][data-v3335-value]:checked', wrap).map(function(cb){ return cb.getAttribute('data-v3335-value'); }).filter(Boolean);
    if(btn){
      if(!checked.length || /^All\s+/i.test(clean(btn.textContent)) || /plot\s*colors?/i.test(clean(btn.textContent))){
        btn.textContent=allText;
      }
      btn.title='Choose one or more '+allText.replace(/^All\s+/i,'');
    }
    var head=wrap.querySelector('.v3335-multi-head b');
    if(head) head.textContent=headText || allText.replace(/^All\s+/i,'');
  }

  function lockTabNames(){
    resetOptionLabels();
    setMultiLabel('agent', LABELS.agent, 'Agent');
    setMultiLabel('color', LABELS.color, 'Status / Color');
    setMultiLabel('feature', LABELS.feature, 'Features');
    setMultiLabel('phase', LABELS.phase, 'Phase');
    var gfa=byId('gfa'); if(gfa && !clean(gfa.value)) { try{ gfa.options[0].textContent=LABELS.gfa; }catch(e){} }
  }

  function syncTabVisualStyle(){
    var ref = document.querySelector('[data-v3335-filter="agent"] .v3335-multi-btn') || byId('agent');
    if(!ref || !window.getComputedStyle) return;
    var cs=getComputedStyle(ref);
    document.documentElement.classList.add('hayat-v3337-unified-tabs');
    document.documentElement.style.setProperty('--hayat-v3337-tab-bg', cs.backgroundColor || '#fff');
    document.documentElement.style.setProperty('--hayat-v3337-tab-color', cs.color || '#111827');
    document.documentElement.style.setProperty('--hayat-v3337-tab-border', (cs.borderTopWidth || '1px')+' '+(cs.borderTopStyle || 'solid')+' '+(cs.borderTopColor || '#d1d5db'));
    document.documentElement.style.setProperty('--hayat-v3337-tab-shadow', cs.boxShadow || 'none');
  }

  function cleanup(){
    addStyles();
    removeDuplicateMultiWidgets();
    restoreGfaAndColorPositions();
    lockTabNames();
    syncTabVisualStyle();
  }

  function install(){
    cleanup();
    var runCount=0;
    var timer=setInterval(function(){
      runCount++;
      try{ cleanup(); }catch(e){ console.warn('v3337 cleanup failed', e); }
      if(runCount >= 18) clearInterval(timer);
    }, 500);
    if(window.MutationObserver && !window.__HAYAT_V3337_FILTER_TAB_OBSERVER){
      window.__HAYAT_V3337_FILTER_TAB_OBSERVER=true;
      var target=document.querySelector('.panel') || document.body;
      var obs=new MutationObserver(function(){
        clearTimeout(window.__HAYAT_V3337_FILTER_TAB_TIMER);
        window.__HAYAT_V3337_FILTER_TAB_TIMER=setTimeout(function(){ try{ cleanup(); }catch(e){} }, 80);
      });
      if(target) obs.observe(target, {childList:true, subtree:true, attributes:true, attributeFilter:['class','style']});
    }
    console.log(VERSION + ' loaded');
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install); else install();
})();
