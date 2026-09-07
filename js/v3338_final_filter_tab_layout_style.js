// Hayat GIS v3.3.38 - Final Filter Tab Layout + Consistent Styling
// Builds on v3.3.37. Keeps the nice filled tab style, prevents duplicates, and restores the intended tab layout.
(function(){
  'use strict';
  if(window.__HAYAT_V3338_FINAL_FILTER_TABS_LOADED) return;
  window.__HAYAT_V3338_FINAL_FILTER_TABS_LOADED = true;

  var VERSION = 'v3.3.38 Final Filter Tab Layout + Consistent Styling';
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
  function qsa(sel, root){ return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function escapeHtml(v){ return String(v == null ? '' : v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }

  function addStyles(){
    if(byId('hayat-v3338-style')) return;
    var st=document.createElement('style');
    st.id='hayat-v3338-style';
    st.textContent = [
      '/* v3.3.38 final filter tabs */',
      'html.hayat-v3338-filter-tabs #agent,html.hayat-v3338-filter-tabs #color,html.hayat-v3338-filter-tabs #feature,html.hayat-v3338-filter-tabs #phase{display:none!important;visibility:hidden!important;position:absolute!important;left:-9999px!important;width:0!important;min-width:0!important;height:0!important;margin:0!important;padding:0!important;border:0!important;}',
      'html.hayat-v3338-filter-tabs #gfa{display:block!important;visibility:visible!important;position:relative!important;left:auto!important;height:auto!important;}',
      'html.hayat-v3338-filter-tabs .hayat-v3336-filter-hidden#gfa{display:block!important;}',
      'html.hayat-v3338-filter-tabs .hayat-v3336-source-hidden#color{display:none!important;}',
      'html.hayat-v3338-filter-tabs .v3335-multi-filter.hayat-v3338-remove{display:none!important;}',
      'html.hayat-v3338-filter-tabs .row{gap:8px;}',
      'html.hayat-v3338-filter-tabs .v3335-multi-filter{position:relative!important;display:block!important;flex:1 1 0!important;min-width:0!important;width:100%!important;margin:0!important;box-sizing:border-box!important;}',
      'html.hayat-v3338-filter-tabs .row .v3335-multi-filter,html.hayat-v3338-filter-tabs .row #type,html.hayat-v3338-filter-tabs .row #gfa,html.hayat-v3338-filter-tabs .row #priced{flex:1 1 0!important;min-width:0!important;width:100%!important;max-width:none!important;}',
      'html.hayat-v3338-filter-tabs .v3335-multi-btn,html.hayat-v3338-filter-tabs #type,html.hayat-v3338-filter-tabs #gfa,html.hayat-v3338-filter-tabs #priced{background:#10211D!important;background-color:#10211D!important;color:#CEA350!important;border:1px solid rgba(206,163,80,.72)!important;border-radius:8px!important;box-shadow:0 1px 3px rgba(16,33,29,.20)!important;font-weight:800!important;font-size:16px!important;line-height:1.2!important;min-height:39px!important;height:39px!important;box-sizing:border-box!important;}',
      'html.hayat-v3338-filter-tabs .v3335-multi-btn{padding:8px 30px 8px 10px!important;text-align:left!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;}',
      'html.hayat-v3338-filter-tabs #type,html.hayat-v3338-filter-tabs #gfa,html.hayat-v3338-filter-tabs #priced{padding:8px 30px 8px 10px!important;appearance:auto!important;-webkit-appearance:menulist!important;}',
      'html.hayat-v3338-filter-tabs .v3335-multi-btn:hover,html.hayat-v3338-filter-tabs #type:hover,html.hayat-v3338-filter-tabs #gfa:hover,html.hayat-v3338-filter-tabs #priced:hover{background:#1F3F37!important;color:#CEA350!important;}',
      'html.hayat-v3338-filter-tabs .v3335-multi-btn:focus,html.hayat-v3338-filter-tabs #type:focus,html.hayat-v3338-filter-tabs #gfa:focus,html.hayat-v3338-filter-tabs #priced:focus{outline:2px solid rgba(206,163,80,.45)!important;border-color:#CEA350!important;}',
      'html.hayat-v3338-filter-tabs #type option,html.hayat-v3338-filter-tabs #gfa option,html.hayat-v3338-filter-tabs #priced option{background:#fffdfa!important;color:#10211D!important;font-weight:600!important;}',
      'html.hayat-v3338-filter-tabs .v3335-multi-btn:after{right:10px!important;color:#CEA350!important;}',
      'html.hayat-v3338-filter-tabs .v3335-multi-panel{z-index:4000!important;}',
      '@media(max-width:700px){html.hayat-v3338-filter-tabs .v3335-multi-btn,html.hayat-v3338-filter-tabs #type,html.hayat-v3338-filter-tabs #gfa,html.hayat-v3338-filter-tabs #priced{font-size:14px!important;min-height:37px!important;height:37px!important;}}'
    ].join('\n');
    document.head.appendChild(st);
  }

  function setFirstOptionLabel(selectId, label){
    var el=byId(selectId);
    if(!el || !el.options || !el.options.length) return;
    var opt=el.options[0];
    if(opt && clean(opt.value) === '') opt.textContent=label;
  }

  function setVisibleSelectLabel(selectId, label){
    var el=byId(selectId);
    if(!el) return;
    setFirstOptionLabel(selectId, label);
    if(!clean(el.value)){
      try{ el.options[0].textContent=label; }catch(e){}
    }
  }

  function getRow(id){ var el=byId(id); return el && el.closest ? el.closest('.row') : null; }
  function multiWrap(id){ return document.querySelector('[data-v3335-filter="'+id+'"]'); }

  function removeDuplicates(id, keep){
    qsa('[data-v3335-filter="'+id+'"]').forEach(function(w){
      if(w !== keep){
        w.classList.add('hayat-v3338-remove');
        try{ w.parentNode && w.parentNode.removeChild(w); }catch(e){ w.style.display='none'; }
      }
    });
  }

  function ensureMulti(id){
    var sel=byId(id);
    if(!sel) return null;
    var row=getRow(id) || sel.parentNode;
    var wraps=qsa('[data-v3335-filter="'+id+'"]');
    var keep=wraps.find(function(w){ return row && w.parentNode === row; }) || wraps[0] || null;
    if(!keep){
      // Fallback: create a small placeholder until v3.3.35 rebuilds the real control.
      keep=document.createElement('div');
      keep.className='v3335-multi-filter';
      keep.setAttribute('data-v3335-filter', id);
      keep.innerHTML='<button type="button" class="v3335-multi-btn">'+escapeHtml(LABELS[id] || 'All')+'</button>';
      sel.insertAdjacentElement('afterend', keep);
    }
    removeDuplicates(id, keep);
    return keep;
  }

  function labelMulti(id, label, head){
    var wrap=multiWrap(id);
    if(!wrap) return;
    var btn=wrap.querySelector('.v3335-multi-btn');
    var checked=qsa('input[type="checkbox"][data-v3335-value]:checked', wrap).map(function(cb){return cb.getAttribute('data-v3335-value');}).filter(Boolean);
    if(btn){
      // Do not overwrite an active selection summary. Only correct the empty/all label or the old plot-color wording.
      var txt=clean(btn.textContent);
      if(!checked.length || /^All\s+/i.test(txt) || /plot\s*colors?/i.test(txt) || txt === 'All') btn.textContent=label;
      btn.title='Choose one or more '+label.replace(/^All\s+/i,'').toLowerCase();
    }
    var title=wrap.querySelector('.v3335-multi-head b');
    if(title) title.textContent=head || label.replace(/^All\s+/i,'');
  }

  function layoutRows(){
    document.documentElement.classList.add('hayat-v3338-filter-tabs');

    // Rebuild/refresh v3.3.35 controls once if available.
    try{ if(window.refreshFilterOptionsFromPoints) window.refreshFilterOptionsFromPoints(); }catch(e){}

    var agentSel=byId('agent'), colorSel=byId('color'), featureSel=byId('feature'), phaseSel=byId('phase');
    var typeSel=byId('type'), gfaSel=byId('gfa');
    var agentWrap=ensureMulti('agent');
    var colorWrap=ensureMulti('color');
    var featureWrap=ensureMulti('feature');
    var phaseWrap=ensureMulti('phase');

    // Restore the original, clean layout:
    // Row 1: All agents
    // Row 2: All statuses + All types
    // Row 3: All features
    // Row 4: All phases + All GFA
    var agentRow=getRow('agent') || (agentWrap && agentWrap.closest('.row'));
    var colorRow=getRow('color') || getRow('type') || (colorWrap && colorWrap.closest('.row'));
    var featureRow=getRow('feature') || (featureWrap && featureWrap.closest('.row'));
    var phaseRow=getRow('phase') || getRow('gfa') || (phaseWrap && phaseWrap.closest('.row'));

    if(agentRow && agentSel && agentWrap){
      if(agentWrap.parentNode !== agentRow) agentRow.appendChild(agentWrap);
    }
    if(colorRow){
      if(colorSel && colorSel.parentNode !== colorRow) colorRow.insertBefore(colorSel, colorRow.firstChild);
      if(colorWrap && colorWrap.parentNode !== colorRow) colorRow.appendChild(colorWrap);
      if(typeSel && typeSel.parentNode !== colorRow) colorRow.appendChild(typeSel);
      if(typeSel && colorWrap && typeSel.previousElementSibling !== colorWrap){
        try{ colorRow.insertBefore(colorWrap, typeSel); }catch(e){}
      }
    }
    if(featureRow && featureSel && featureWrap){
      if(featureWrap.parentNode !== featureRow) featureRow.appendChild(featureWrap);
    }
    if(phaseRow){
      if(phaseSel && phaseSel.parentNode !== phaseRow) phaseRow.insertBefore(phaseSel, phaseRow.firstChild);
      if(phaseWrap && phaseWrap.parentNode !== phaseRow) phaseRow.appendChild(phaseWrap);
      if(gfaSel && gfaSel.parentNode !== phaseRow) phaseRow.appendChild(gfaSel);
      if(gfaSel && phaseWrap && gfaSel.previousElementSibling !== phaseWrap){
        try{ phaseRow.insertBefore(phaseWrap, gfaSel); }catch(e){}
      }
    }

    // Remove any old v3.3.36 color widgets that were placed where GFA should be.
    qsa('[data-v3335-filter="color"]').forEach(function(w){
      if(colorRow && w.parentNode !== colorRow){
        w.classList.add('hayat-v3338-remove');
        try{ w.parentNode && w.parentNode.removeChild(w); }catch(e){ w.style.display='none'; }
      }
    });

    // Keep source selects hidden only where a multi-control exists. Type and GFA stay visible.
    [agentSel,colorSel,featureSel,phaseSel].forEach(function(sel){
      if(sel){ sel.style.display='none'; sel.style.visibility='hidden'; sel.value=''; }
    });
    if(typeSel){ typeSel.style.display=''; typeSel.style.visibility='visible'; }
    if(gfaSel){
      gfaSel.classList.remove('hayat-v3336-filter-hidden');
      gfaSel.style.display='';
      gfaSel.style.visibility='visible';
    }

    setVisibleSelectLabel('agent', LABELS.agent);
    setVisibleSelectLabel('color', LABELS.color);
    setVisibleSelectLabel('type', LABELS.type);
    setVisibleSelectLabel('feature', LABELS.feature);
    setVisibleSelectLabel('phase', LABELS.phase);
    setVisibleSelectLabel('gfa', LABELS.gfa);
    setVisibleSelectLabel('priced', LABELS.priced);

    labelMulti('agent', LABELS.agent, 'Agent');
    labelMulti('color', LABELS.color, 'Status / Color');
    labelMulti('feature', LABELS.feature, 'Features');
    labelMulti('phase', LABELS.phase, 'Phase');
  }

  function cleanupOrphans(){
    ['agent','color','feature','phase'].forEach(function(id){
      var row=getRow(id);
      var wraps=qsa('[data-v3335-filter="'+id+'"]');
      if(!wraps.length) return;
      var keep=(row && wraps.find(function(w){ return w.parentNode === row; })) || wraps[0];
      removeDuplicates(id, keep);
    });
  }

  function run(){
    addStyles();
    cleanupOrphans();
    layoutRows();
  }

  function boot(){
    var count=0;
    function tick(){
      count++;
      try{ run(); }catch(e){ console.warn('v3338 filter tab layout failed', e); }
      if(count < 24) setTimeout(tick, 350);
    }
    tick();

    if(window.MutationObserver && !window.__HAYAT_V3338_FILTER_TABS_OBSERVER){
      window.__HAYAT_V3338_FILTER_TABS_OBSERVER=true;
      var target=document.querySelector('.panel') || document.body;
      var obs=new MutationObserver(function(){
        clearTimeout(window.__HAYAT_V3338_FILTER_TABS_TIMER);
        window.__HAYAT_V3338_FILTER_TABS_TIMER=setTimeout(function(){ try{ run(); }catch(e){} }, 120);
      });
      if(target) obs.observe(target, {childList:true, subtree:true, attributes:true, attributeFilter:['class','style']});
    }

    document.addEventListener('change', function(e){
      var t=e.target;
      if(t && (t.id === 'type' || t.id === 'gfa' || t.id === 'priced' || (t.matches && t.matches('.v3335-multi-options input')))){
        setTimeout(function(){ try{ run(); }catch(x){} }, 60);
      }
    }, true);

    console.log(VERSION + ' loaded');
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
