// Hayat GIS v3.3.35 - Auto Last Updated + Multi-select Filters
// Builds on v3.3.34. Lightweight compatibility layer only.
(function(){
  'use strict';
  var VERSION = 'v3.3.35 Auto Last Updated + Multi-select Filters';
  var MULTI_IDS = ['agent','color','phase','feature'];
  var currentFilterTimer = null;

  function byId(id){ return document.getElementById(id); }
  function clean(v){ return String(v == null ? '' : v).replace(/\s+/g,' ').trim(); }
  function lower(v){ return clean(v).toLowerCase(); }
  function html(v){ return String(v == null ? '' : v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function numFromValue(v){ var s=String(v == null ? '' : v).replace(/,/g,'').trim(); if(!s) return null; var n=Number(s); return isFinite(n) ? n : null; }
  function val(id){ var el=byId(id); return el ? clean(el.value) : ''; }
  function num(id){ return numFromValue(val(id)); }
  function allPoints(){ return Array.isArray(window.points) ? window.points : (Array.isArray(window.HAYAT_PUBLISHED_POINTS) ? window.HAYAT_PUBLISHED_POINTS : []); }
  function isAdmin(){ return !!byId('plotEditModal') || /admin\.html/i.test(location.pathname); }
  function storageKey(){ return isAdmin() ? 'HAYAT_V3335_MULTI_FILTERS_ADMIN' : 'HAYAT_V3335_MULTI_FILTERS_AGENT'; }
  function normalizePoint(p){ try{ if(window.HayatDataNormalize && window.HayatDataNormalize.normalizePoint) window.HayatDataNormalize.normalizePoint(p); }catch(e){} return p; }
  function normAgent(v){ return (window.HayatDataNormalize && window.HayatDataNormalize.normalizeAgent) ? window.HayatDataNormalize.normalizeAgent(v) : clean(v); }
  function normColor(v){ return (window.HayatDataNormalize && window.HayatDataNormalize.normalizeColor) ? window.HayatDataNormalize.normalizeColor(v) : clean(v); }
  function normType(v){ return (window.HayatDataNormalize && window.HayatDataNormalize.normalizeType) ? window.HayatDataNormalize.normalizeType(v) : clean(v); }
  function normGfa(v){ return (window.HayatDataNormalize && window.HayatDataNormalize.normalizeGfa) ? window.HayatDataNormalize.normalizeGfa(v) : clean(v); }
  function normFeature(v){ return clean(v).replace(/\s*\/\s*/g,' / '); }
  function splitFeatures(v){ return clean(v).split(/[,;|]+/).map(normFeature).filter(Boolean); }
  function colorGroup(c){ c=lower(normColor(c)); if(c==='red') return 'Red'; if(c==='blue') return 'Blue'; if(c==='pink'||c==='hold'||c==='on hold') return 'Pink'; return 'Other'; }
  function colorVisible(c){ var group=colorGroup(c); var id=group==='Red'?'showRedInventory':group==='Blue'?'showBlueInventory':group==='Pink'?'showPinkInventory':'showOtherInventory'; var cb=byId(id); return !cb || cb.checked !== false; }

  function readState(){
    try{ var o=JSON.parse(localStorage.getItem(storageKey()) || '{}'); return (o && typeof o === 'object') ? o : {}; }catch(e){ return {}; }
  }
  function writeState(o){ try{ localStorage.setItem(storageKey(), JSON.stringify(o || {})); }catch(e){} }
  function selectedRaw(id){
    var s=readState()[id];
    return Array.isArray(s) ? s.filter(function(v){ return clean(v); }) : [];
  }
  function selectedNorm(id){
    var arr=selectedRaw(id);
    if(id==='agent') return arr.map(normAgent).map(lower);
    if(id==='color') return arr.map(normColor).map(lower);
    if(id==='feature') return arr.map(normFeature).map(lower);
    return arr.map(clean).map(lower);
  }
  function setSelectedRaw(id, arr){
    var st=readState();
    st[id]=(arr || []).filter(function(v){return clean(v);});
    if(!st[id].length) delete st[id];
    writeState(st);
  }

  function labelFor(id){
    return {agent:'agents', color:'statuses', phase:'phases', feature:'features'}[id] || id;
  }
  function titleFor(id){
    return {agent:'Agent', color:'Status / Color', phase:'Phase', feature:'Features'}[id] || id;
  }
  function allLabelFor(id){
    return {agent:'All agents', color:'All statuses', phase:'All phases', feature:'All features'}[id] || 'All';
  }
  function getSelectOptions(id){
    var sel=byId(id); if(!sel) return [];
    var opts=[];
    Array.prototype.slice.call(sel.options || []).forEach(function(o){
      var v=clean(o.value); if(!v) return;
      if(!opts.some(function(x){ return x.value === v; })) opts.push({value:v, text:clean(o.textContent) || v});
    });
    return opts;
  }
  function updateMultiSummary(id){
    var wrap=document.querySelector('[data-v3335-filter="'+id+'"]'); if(!wrap) return;
    var btn=wrap.querySelector('.v3335-multi-btn'); if(!btn) return;
    var selected=selectedRaw(id);
    if(!selected.length) btn.textContent=allLabelFor(id);
    else if(selected.length <= 2) btn.textContent=selected.join(', ');
    else btn.textContent=selected.length + ' ' + labelFor(id) + ' selected';
    var count=wrap.querySelector('.v3335-multi-count'); if(count) count.textContent = selected.length ? String(selected.length) : 'All';
  }
  function refreshMultiChecks(id){
    var wrap=document.querySelector('[data-v3335-filter="'+id+'"]'); if(!wrap) return;
    var raw=selectedRaw(id).map(String);
    wrap.querySelectorAll('input[type="checkbox"][data-v3335-value]').forEach(function(cb){ cb.checked = raw.indexOf(cb.getAttribute('data-v3335-value')) !== -1; });
    updateMultiSummary(id);
  }
  function buildOneMulti(id){
    var sel=byId(id); if(!sel) return;
    var opts=getSelectOptions(id);
    var parent=sel.parentElement || sel;
    var wrap=parent.querySelector('[data-v3335-filter="'+id+'"]');
    if(!wrap){
      wrap=document.createElement('div');
      wrap.className='v3335-multi-filter';
      wrap.setAttribute('data-v3335-filter', id);
      sel.insertAdjacentElement('afterend', wrap);
    }
    var selected=selectedRaw(id);
    var valid=opts.map(function(o){return o.value;});
    var cleaned=selected.filter(function(v){ return valid.indexOf(v) !== -1; });
    if(cleaned.length !== selected.length) setSelectedRaw(id, cleaned);
    wrap.innerHTML = '' +
      '<button type="button" class="v3335-multi-btn" title="Choose one or more '+html(labelFor(id))+'">'+html(allLabelFor(id))+'</button>' +
      '<div class="v3335-multi-panel">' +
        '<div class="v3335-multi-head"><b>'+html(titleFor(id))+'</b><span class="v3335-multi-count">All</span></div>' +
        '<div class="v3335-multi-actions"><button type="button" data-v3335-action="all">All</button><button type="button" data-v3335-action="clear">Clear</button></div>' +
        '<div class="v3335-multi-options">' + opts.map(function(o){
          return '<label><input type="checkbox" data-v3335-value="'+html(o.value)+'"> <span>'+html(o.text)+'</span></label>';
        }).join('') + '</div>' +
      '</div>';
    sel.style.display='none';
    sel.value='';
    wrap.querySelector('.v3335-multi-btn').addEventListener('click', function(e){
      e.preventDefault(); e.stopPropagation();
      document.querySelectorAll('.v3335-multi-filter.open').forEach(function(x){ if(x!==wrap) x.classList.remove('open'); });
      wrap.classList.toggle('open');
    });
    wrap.querySelectorAll('input[type="checkbox"][data-v3335-value]').forEach(function(cb){
      cb.addEventListener('change', function(){
        var arr=[];
        wrap.querySelectorAll('input[type="checkbox"][data-v3335-value]:checked').forEach(function(x){ arr.push(x.getAttribute('data-v3335-value')); });
        setSelectedRaw(id, arr);
        sel.value='';
        updateMultiSummary(id);
        applyMultiFiltersSoon(0);
      });
    });
    wrap.querySelectorAll('[data-v3335-action]').forEach(function(btn){
      btn.addEventListener('click', function(e){
        e.preventDefault(); e.stopPropagation();
        var action=btn.getAttribute('data-v3335-action');
        if(action === 'all' || action === 'clear') setSelectedRaw(id, []);
        refreshMultiChecks(id);
        sel.value='';
        applyMultiFiltersSoon(0);
      });
    });
    refreshMultiChecks(id);
  }
  function buildMultiFilterUI(){
    addStyles();
    MULTI_IDS.forEach(buildOneMulti);
    if(!document.__v3335CloseHook){
      document.__v3335CloseHook=true;
      document.addEventListener('click', function(e){
        if(e.target && e.target.closest && e.target.closest('.v3335-multi-filter')) return;
        document.querySelectorAll('.v3335-multi-filter.open').forEach(function(x){ x.classList.remove('open'); });
      }, true);
    }
  }

  function pointMatchesFeature(p, selected){
    if(!selected.length) return true;
    var feats=splitFeatures(p.features).map(lower);
    return selected.some(function(s){ return feats.indexOf(s) !== -1; });
  }
  function pointMatchesColor(p, selected){
    if(!selected.length) return true;
    var a=lower(normColor(p.color));
    var b=lower(normColor(p.secondColor));
    return selected.indexOf(a) !== -1 || selected.indexOf(b) !== -1;
  }
  function pointMatchesAgent(p, selected){
    if(!selected.length) return true;
    var a=lower(normAgent(p.agent));
    var b=lower(normAgent(p.secondAgent));
    return selected.indexOf(a) !== -1 || selected.indexOf(b) !== -1;
  }
  function pointMatchesPhase(p, selected){
    if(!selected.length) return true;
    return selected.indexOf(lower(p.phase)) !== -1;
  }
  function searchableText(p){
    return [p.gisPlot,p.masterPlot,p.agent,p.mobile,p.secondAgent,p.secondMobile,p.type,p.phase,p.gfa,p.features,p.color,p.secondColor,p.lastUpdated,p.lastDateUpdated,p.comment].map(lower).join(' | ');
  }
  function matchPoint(p){
    normalizePoint(p);
    var search=lower(val('search'));
    var type=normType(val('type'));
    var gfa=normGfa(val('gfa'));
    var minSize=num('minSize'), maxSize=num('maxSize'), minPrice=num('minPrice'), maxPrice=num('maxPrice');
    var priced=val('priced');
    var agents=selectedNorm('agent');
    var colors=selectedNorm('color');
    var phases=selectedNorm('phase');
    var features=selectedNorm('feature');

    if(!colorVisible(p.color)) return false;
    if(search && searchableText(p).indexOf(search) === -1) return false;
    if(!pointMatchesAgent(p, agents)) return false;
    if(!pointMatchesColor(p, colors)) return false;
    if(type && normType(p.type) !== type) return false;
    if(!pointMatchesFeature(p, features)) return false;
    if(!pointMatchesPhase(p, phases)) return false;
    if(gfa && normGfa(p.gfa) !== gfa) return false;
    var size=numFromValue(p.size);
    var price=numFromValue(p.price), secondPrice=numFromValue(p.secondPrice);
    if(minSize !== null && (size === null || size < minSize)) return false;
    if(maxSize !== null && (size === null || size > maxSize)) return false;
    if(minPrice !== null && ((price === null || price < minPrice) && (secondPrice === null || secondPrice < minPrice))) return false;
    if(maxPrice !== null && ((price === null || price > maxPrice) && (secondPrice === null || secondPrice > maxPrice))) return false;
    if(priced === 'priced' && price === null && secondPrice === null) return false;
    if(priced === 'unpriced' && (price !== null || secondPrice !== null)) return false;
    return true;
  }
  function renderFilteredNow(){
    var filtered=allPoints().filter(matchPoint);
    window.baseFilteredList=filtered;
    try{ baseFilteredList=filtered; }catch(e){}
    try{ if(window.showSelectedOnly && typeof window.setShowSelectedOnly === 'function') window.setShowSelectedOnly(false); }catch(e){}
    try{ if(typeof showSelectedOnly !== 'undefined' && showSelectedOnly && typeof setShowSelectedOnly === 'function') setShowSelectedOnly(false); }catch(e){}
    if(typeof window.addMarkers === 'function') window.addMarkers(filtered, false);
    else if(typeof addMarkers === 'function') addMarkers(filtered, false);
    var count=byId('count');
    if(count && count.innerHTML.indexOf('Multi-select filters') === -1){
      count.innerHTML += '<br><span style="font-size:11px;color:#6b6047">Multi-select filters: v3.3.35</span>';
    }
  }
  function applyMultiFiltersSoon(delay){
    if(currentFilterTimer) clearTimeout(currentFilterTimer);
    currentFilterTimer=setTimeout(renderFilteredNow, delay == null ? 10 : delay);
  }
  function patchFilters(){
    if(window.__v3335FiltersPatched) return;
    window.__v3335FiltersPatched=true;
    var oldRefresh=window.refreshFilterOptionsFromPoints;
    window.refreshFilterOptionsFromPoints=function(){
      var r = oldRefresh ? oldRefresh.apply(this, arguments) : undefined;
      setTimeout(buildMultiFilterUI, 0);
      return r;
    };
    window.applyFilters=function(){ applyMultiFiltersSoon(10); return false; };
    window.hayatApplyFiltersNow=function(e){ if(e && e.preventDefault) e.preventDefault(); applyMultiFiltersSoon(0); return false; };
    window.hayatResetFiltersNow=function(e){ if(e && e.preventDefault) e.preventDefault(); return window.resetFilters(); };
    window.resetFilters=function(){
      ['search','agent','color','type','feature','phase','gfa','minSize','maxSize','minPrice','maxPrice','priced'].forEach(function(id){ var el=byId(id); if(el) el.value=''; });
      writeState({});
      buildMultiFilterUI();
      MULTI_IDS.forEach(refreshMultiChecks);
      try{ if(window.loadDetailFields) window.loadDetailFields(); }catch(e){}
      try{ if(window.setShowSelectedOnly) window.setShowSelectedOnly(false); else if(typeof setShowSelectedOnly === 'function') setShowSelectedOnly(false); }catch(e){}
      try{
        window.inventoryVisibility = {Red:true, Blue:true, Pink:true, Other:true};
        inventoryVisibility = {Red:true, Blue:true, Pink:true, Other:true};
      }catch(e){}
      ['showRedInventory','showBlueInventory','showPinkInventory','showOtherInventory'].forEach(function(id){ var cb=byId(id); if(cb) cb.checked=true; });
      applyMultiFiltersSoon(0);
      return false;
    };
    ['type','gfa','priced','minSize','maxSize','minPrice','maxPrice'].forEach(function(id){
      var el=byId(id); if(el && !el.__v3335Hook){ el.__v3335Hook=true; el.addEventListener('change', function(){ applyMultiFiltersSoon(0); }); el.addEventListener('input', function(){ applyMultiFiltersSoon(160); }); }
    });
    var search=byId('search'); if(search && !search.__v3335Hook){ search.__v3335Hook=true; search.addEventListener('input', function(){ applyMultiFiltersSoon(180); }); }
    ['showRedInventory','showBlueInventory','showPinkInventory','showOtherInventory'].forEach(function(id){
      var cb=byId(id); if(cb && !cb.__v3335Hook){ cb.__v3335Hook=true; cb.addEventListener('change', function(){ applyMultiFiltersSoon(0); }); }
    });
  }

  function todayText(){
    var d=new Date();
    var dd=String(d.getDate()).padStart(2,'0');
    var mm=String(d.getMonth()+1).padStart(2,'0');
    var yy=d.getFullYear();
    return dd + '/' + mm + '/' + yy;
  }
  function markDateFieldReady(){
    var el=byId('editLastUpdated');
    if(!el) return;
    el.placeholder = 'Auto: today unless changed';
    if(!el.__v3335DateManualHook){
      el.__v3335DateManualHook=true;
      el.addEventListener('input', function(){ el.__v3335ManualChanged=true; });
      el.addEventListener('change', function(){ el.__v3335ManualChanged=true; });
    }
  }
  function defaultDateForCurrentEdit(){
    if(!isAdmin()) return;
    var el=byId('editLastUpdated');
    if(!el) return;
    markDateFieldReady();
    el.__v3335ManualChanged=false;
    el.value = todayText();
    try{ if(typeof window.HAYAT_V3333_REFRESH_OPEN_POPUP === 'function') window.HAYAT_V3333_REFRESH_OPEN_POPUP(); }catch(e){}
    try{ el.dispatchEvent(new Event('input', {bubbles:true})); }catch(e){}
  }
  function ensureDateBeforeSave(){
    var el=byId('editLastUpdated');
    if(!el) return;
    markDateFieldReady();
    if(!clean(el.value)) el.value=todayText();
  }
  function patchAutoLastUpdated(){
    if(!isAdmin() || window.__v3335DatePatched) return;
    window.__v3335DatePatched=true;
    markDateFieldReady();
    var oldOpen=window.openPlotEditorByRow;
    if(typeof oldOpen === 'function'){
      window.openPlotEditorByRow=function(){
        var r=oldOpen.apply(this, arguments);
        setTimeout(defaultDateForCurrentEdit, 0);
        setTimeout(defaultDateForCurrentEdit, 80);
        return r;
      };
    }
    var oldAdd=window.openAddPlotByPA;
    if(typeof oldAdd === 'function'){
      window.openAddPlotByPA=function(){
        var r=oldAdd.apply(this, arguments);
        setTimeout(defaultDateForCurrentEdit, 0);
        setTimeout(defaultDateForCurrentEdit, 80);
        return r;
      };
    }
    var oldSave=window.savePlotEdit;
    if(typeof oldSave === 'function'){
      window.savePlotEdit=function(){
        ensureDateBeforeSave();
        return oldSave.apply(this, arguments);
      };
    }
    setTimeout(function(){ if(byId('editLastUpdated')) defaultDateForCurrentEdit(); }, 500);
  }

  function addStyles(){
    if(byId('hayat-v3335-style')) return;
    var st=document.createElement('style');
    st.id='hayat-v3335-style';
    st.textContent = [
      '.v3335-multi-filter{position:relative;flex:1 1 0;min-width:0;width:100%;}',
      '.v3335-multi-btn{width:100%;min-height:34px;text-align:left;padding:7px 28px 7px 8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;position:relative;}',
      '.v3335-multi-btn:after{content:"▾";position:absolute;right:9px;top:50%;transform:translateY(-50%);font-size:10px;}',
      '.v3335-multi-filter.open .v3335-multi-btn:after{content:"▴";}',
      '.v3335-multi-panel{display:none;position:absolute;left:0;top:calc(100% + 4px);z-index:1300;width:260px;max-width:calc(100vw - 34px);background:#fffdfa;border:1px solid rgba(16,33,29,.25);border-radius:10px;box-shadow:0 10px 26px rgba(0,0,0,.22);padding:8px;}',
      '.v3335-multi-filter.open .v3335-multi-panel{display:block;}',
      '.v3335-multi-head{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:11px;color:#10211d;margin-bottom:6px;}',
      '.v3335-multi-count{font-size:10px;color:#8a6c2e;font-weight:800;}',
      '.v3335-multi-actions{display:flex;gap:5px;margin-bottom:6px;}',
      '.v3335-multi-actions button{font-size:10px;padding:4px 6px;border-radius:6px;}',
      '.v3335-multi-options{max-height:210px;overflow:auto;display:grid;grid-template-columns:1fr;gap:3px;padding-right:2px;}',
      '.v3335-multi-options label{display:flex;align-items:center;gap:6px;font-size:11px;line-height:1.25;padding:4px 5px;border-radius:6px;color:#1f2933;}',
      '.v3335-multi-options label:hover{background:rgba(206,163,80,.10);}',
      '.v3335-multi-options input{width:auto!important;min-width:auto!important;margin:0;accent-color:#CEA350;}',
      '#v3333LastUpdatedLabel:after{content:"Auto-fills to today when you open/edit a plot unless you change it.";display:block;font-size:10.5px;color:#6b6250;margin-top:3px;line-height:1.25;}',
      '@media(max-width:700px){.v3335-multi-panel{position:fixed;left:10px;right:10px;top:70px;width:auto;max-height:55vh;overflow:auto}.v3335-multi-options{max-height:42vh}}'
    ].join('\n');
    document.head.appendChild(st);
  }

  function boot(){
    try{ patchFilters(); }catch(e){ console.warn('v3335 filter patch failed', e); }
    try{ buildMultiFilterUI(); }catch(e){ console.warn('v3335 UI build failed', e); }
    try{ patchAutoLastUpdated(); }catch(e){ console.warn('v3335 date patch failed', e); }
    try{ if(window.refreshFilterOptionsFromPoints) window.refreshFilterOptionsFromPoints(); }catch(e){}
    setTimeout(function(){ try{ buildMultiFilterUI(); }catch(e){} }, 450);
    setTimeout(function(){ try{ buildMultiFilterUI(); }catch(e){} }, 1400);
    console.log(VERSION + ' loaded');
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();