// Hayat GIS v3.3.26 - Multiple Display Labels Restore
// Purpose: restore the old multi-label checkbox workflow (GIS + Master Plan + Price + Agent, etc.)
// without touching filters, PA + Add badges, Move Plot, bulk features, or Agent view-only mode.
(function(){
  var VERSION = 'v3.3.26 Multiple Display Labels Restore';
  function $(id){ return document.getElementById(id); }
  function clean(v){ return String(v == null ? '' : v).replace(/\s+/g,' ').trim(); }
  function esc(v){ return clean(v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function isAdmin(){ return !!$('plotEditModal') || /admin\.html/i.test(location.pathname); }
  var storageKey = isAdmin() ? 'HAYAT_V32_ADMIN_DISPLAY' : 'HAYAT_V32_AGENT_DISPLAY';

  var LABEL_DEFS = [
    ['gisPlot', 'GIS'],
    ['masterPlot', 'Master Plan'],
    ['price', 'Price/sqft'],
    ['total', 'Total'],
    ['size', 'Size'],
    ['status', 'Status'],
    ['agent', 'Agent'],
    ['gfa', 'GFA'],
    ['phase', 'Phase'],
    ['features', 'Features']
  ];

  function readSaved(){
    try{
      var raw = localStorage.getItem(storageKey);
      if(raw){
        var obj = JSON.parse(raw);
        if(obj && obj.labels) return obj;
      }
    }catch(e){}
    var mode = $('labelMode') ? $('labelMode').value : 'masterPlot';
    var labels = {};
    if(mode && mode !== 'custom') labels[mode] = true;
    if(!Object.keys(labels).length) labels.masterPlot = true;
    return { labels: labels, offerMode: 'cheapest' };
  }

  function saveDisplay(labels, offerMode){
    var obj = { labels: labels || {}, offerMode: offerMode || (($('v3326OfferMode')||{}).value) || 'cheapest' };
    try{ localStorage.setItem(storageKey, JSON.stringify(obj)); }catch(e){}
    return obj;
  }

  function currentDisplay(){
    var obj = readSaved();
    obj.labels = obj.labels || {};
    obj.offerMode = obj.offerMode || 'cheapest';
    return obj;
  }

  function ensureCustomOption(){
    var sel = $('labelMode'); if(!sel) return;
    var found = false;
    Array.prototype.forEach.call(sel.options, function(o){ if(o.value === 'custom') found = true; });
    if(!found){
      var opt = document.createElement('option');
      opt.value = 'custom';
      opt.textContent = 'Custom labels';
      sel.appendChild(opt);
    }
  }

  function addCss(){
    if($('v3326MultiLabelCss')) return;
    var st = document.createElement('style');
    st.id = 'v3326MultiLabelCss';
    st.textContent = [
      '.v3326-display-box{margin:8px 0 10px;padding:8px;border:1px solid rgba(206,163,80,.45);border-radius:10px;background:rgba(255,255,255,.74)}',
      '.v3326-display-title{font-size:12px;font-weight:900;color:#10211d;margin-bottom:6px;display:flex;justify-content:space-between;gap:8px;align-items:center}',
      '.v3326-label-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px 8px}',
      '.v3326-label-grid label{font-size:11px;display:flex;align-items:center;gap:5px;white-space:nowrap}',
      '.v3326-label-grid input{width:auto!important;min-width:auto!important}',
      '.v3326-offer-row{margin-top:7px}',
      '.v3326-offer-row select{width:100%;font-size:11px;padding:5px}',
      '.v3326-mini-note{font-size:10px;color:#6b6b6b;margin-top:5px;line-height:1.25}',
      '.leaflet-tooltip.lbl{white-space:pre-line!important;text-align:center!important;line-height:1.14!important}',
      '@media(max-width:700px){.v3326-label-grid{grid-template-columns:1fr 1fr}.v3326-display-box{padding:7px}.v3326-label-grid label{font-size:10.5px}}'
    ].join('\n');
    document.head.appendChild(st);
  }

  function injectControls(){
    var sel = $('labelMode');
    if(!sel || $('v3326DisplayBox')) return;
    addCss();
    ensureCustomOption();
    var s = currentDisplay();
    var labels = s.labels || {};
    var box = document.createElement('div');
    box.id = 'v3326DisplayBox';
    box.className = 'v3326-display-box';
    box.innerHTML = '<div class="v3326-display-title"><span>Display labels</span><span id="v3326ActiveCount"></span></div>' +
      '<div class="v3326-label-grid">' + LABEL_DEFS.map(function(d){
        return '<label><input type="checkbox" data-v3326-label="' + esc(d[0]) + '" ' + (labels[d[0]] ? 'checked' : '') + '> ' + esc(d[1]) + '</label>';
      }).join('') + '</div>' +
      '<div class="v3326-offer-row"><select id="v3326OfferMode">' +
      '<option value="cheapest">Two offers: show cheapest</option>' +
      '<option value="direct">Two offers: show direct</option>' +
      '<option value="both">Two offers: show both</option>' +
      '<option value="primary">Two offers: show primary</option>' +
      '</select></div>' +
      '<div class="v3326-mini-note">You can tick more than one label at the same time, for example Master Plan + Price + Agent.</div>';
    sel.parentElement.insertAdjacentElement('afterend', box);
    var offer = $('v3326OfferMode'); if(offer) offer.value = s.offerMode || 'cheapest';

    box.querySelectorAll('[data-v3326-label]').forEach(function(cb){
      cb.addEventListener('change', function(){
        var newLabels = labelsFromChecks();
        saveDisplay(newLabels, offer ? offer.value : 'cheapest');
        syncDropdownToChecks();
        refreshLabels();
      });
    });
    if(offer){
      offer.addEventListener('change', function(){
        saveDisplay(labelsFromChecks(), offer.value);
        refreshLabels();
      });
    }
    if(!sel.__v3326DropdownHooked){
      sel.__v3326DropdownHooked = true;
      sel.addEventListener('change', function(){
        if(sel.value === 'custom') return;
        var labels = {};
        labels[sel.value || 'masterPlot'] = true;
        setChecks(labels);
        saveDisplay(labels, offer ? offer.value : 'cheapest');
        refreshLabels();
      }, true);
    }
    syncDropdownToChecks();
    updateActiveCount();
  }

  function labelsFromChecks(){
    var labels = {};
    document.querySelectorAll('[data-v3326-label]').forEach(function(cb){ labels[cb.getAttribute('data-v3326-label')] = !!cb.checked; });
    return labels;
  }
  function setChecks(labels){
    document.querySelectorAll('[data-v3326-label]').forEach(function(cb){ cb.checked = !!labels[cb.getAttribute('data-v3326-label')]; });
    updateActiveCount();
  }
  function updateActiveCount(){
    var el = $('v3326ActiveCount'); if(!el) return;
    var labels = labelsFromChecks();
    var n = Object.keys(labels).filter(function(k){return labels[k];}).length;
    el.textContent = n ? (n + ' active') : 'default';
  }
  function syncDropdownToChecks(){
    updateActiveCount();
    var sel = $('labelMode'); if(!sel) return;
    var labels = labelsFromChecks();
    var active = Object.keys(labels).filter(function(k){ return labels[k]; });
    if(active.length === 1 && Array.prototype.some.call(sel.options, function(o){return o.value === active[0];})) sel.value = active[0];
    else sel.value = 'custom';
  }

  function moneyLocal(x){
    if(typeof window.money === 'function') return window.money(x);
    var n = Number(x); if(!isFinite(n)) return '';
    return 'AED ' + Math.round(n).toLocaleString();
  }
  function masterLabel(p){
    try{ if(typeof window.masterPlanLabel === 'function') return window.masterPlanLabel(p); }catch(e){}
    var raw = clean((p && (p.masterPlot || p['Master Plan Plot'])) || '');
    var m = raw.match(/^(PA\d+)[_\-]?(\d+)$/i);
    if(m) return m[1].toUpperCase() + '_' + m[2].padStart(3,'0');
    return raw.toUpperCase().replace(/-/g,'_');
  }
  function statusLabel(color){
    var c = clean(color);
    var low = c.toLowerCase();
    if(low === 'red') return 'Direct';
    if(low === 'blue') return 'Through broker';
    if(low === 'pink') return 'Hold';
    return c || '';
  }
  function offerMode(){ return (currentDisplay().offerMode || (($('v3326OfferMode')||{}).value) || 'cheapest'); }
  function primaryOffer(p){ return {agent:p.agent||'', price:p.price, priceText:p.priceText||'', total:p.total, color:p.color||'', label:statusLabel(p.color)}; }
  function secondOffer(p){ return {agent:p.secondAgent||'', price:p.secondPrice, priceText:p.secondPriceText||'', total:p.secondTotal, color:p.secondColor||'', label:statusLabel(p.secondColor || 'Blue')}; }
  function offerForMode(p){
    var mode = offerMode();
    var a = primaryOffer(p), b = secondOffer(p);
    var hasB = !!(p.secondAgent || p.secondPrice || p.secondPriceText || p.secondMobile);
    if(!hasB) return a;
    if(mode === 'primary') return a;
    if(mode === 'direct'){
      if(String(a.color).toLowerCase() === 'red') return a;
      if(String(b.color).toLowerCase() === 'red') return b;
      return a;
    }
    if(mode === 'both') return null;
    var ap = Number(a.price), bp = Number(b.price);
    if(isFinite(ap) && isFinite(bp)) return ap <= bp ? a : b;
    if(isFinite(ap)) return a;
    if(isFinite(bp)) return b;
    return a;
  }
  function priceForLabel(p){
    var mode = offerMode();
    if(mode === 'both' && (p.secondAgent || p.secondPrice || p.secondPriceText)){
      var parts = [];
      if(p.priceText) parts.push(statusLabel(p.color) + ': AED ' + p.priceText);
      if(p.secondPriceText) parts.push(statusLabel(p.secondColor || 'Blue') + ': AED ' + p.secondPriceText);
      return parts.join(' / ');
    }
    var o = offerForMode(p);
    return o && o.priceText ? 'AED ' + o.priceText : '';
  }
  function totalForLabel(p){
    var mode = offerMode();
    if(mode === 'both' && (p.secondAgent || p.secondPrice || p.secondPriceText)){
      var parts = [];
      if(p.total) parts.push(statusLabel(p.color) + ': ' + moneyLocal(p.total));
      if(p.secondTotal) parts.push(statusLabel(p.secondColor || 'Blue') + ': ' + moneyLocal(p.secondTotal));
      return parts.join(' / ');
    }
    var o = offerForMode(p);
    return o && o.total ? moneyLocal(o.total) : '';
  }

  function multiLabelText(p){
    p = p || {};
    var disp = currentDisplay();
    var labels = disp.labels || {};
    var parts = [];
    function add(v){ v = clean(v); if(v) parts.push(v); }
    if(labels.gisPlot) add(p.gisPlot);
    if(labels.masterPlot) add(masterLabel(p));
    if(labels.price) add(priceForLabel(p));
    if(labels.total) add(totalForLabel(p));
    if(labels.size) add(p.sizeText ? p.sizeText + ' sqft' : (p.size ? String(p.size) + ' sqft' : ''));
    if(labels.status) add((offerForMode(p) || {}).label || statusLabel(p.color));
    if(labels.agent) add((offerForMode(p) || {}).agent || p.agent || p.secondAgent);
    if(labels.gfa) add(p.gfa);
    if(labels.phase) add(p.phase);
    if(labels.features) add(p.features);

    if(!parts.length){
      var mode = $('labelMode') ? $('labelMode').value : 'masterPlot';
      if(mode === 'gisPlot') add(p.gisPlot);
      else if(mode === 'price') add(priceForLabel(p));
      else if(mode === 'total') add(totalForLabel(p));
      else if(mode === 'size') add(p.sizeText ? p.sizeText + ' sqft' : (p.size ? String(p.size) + ' sqft' : ''));
      else if(mode === 'agent') add(p.agent || p.secondAgent);
      else if(mode === 'gfa') add(p.gfa);
      else if(mode === 'phase') add(p.phase);
      else if(mode === 'features') add(p.features);
      else add(masterLabel(p) || p.gisPlot);
    }
    return parts.join('\n');
  }

  function refreshLabels(){
    updateActiveCount();
    try{
      if(Array.isArray(window.markers)){
        window.markers.forEach(function(obj){
          if(obj && obj.marker && obj.marker.setTooltipContent) obj.marker.setTooltipContent(multiLabelText(obj.point));
        });
      }
    }catch(e){ console.warn('v3326 label refresh failed', e); }
    try{
      var c = $('count');
      if(c && !/Labels: v3\.3\.26/.test(c.innerHTML || c.textContent || '')){
        c.innerHTML = (c.innerHTML || c.textContent || '') + '<br><span class="small-note">Labels: v3.3.26 multiple display labels</span>';
      }
    }catch(e){}
  }

  function installOverrides(){
    window.labelText = multiLabelText;
    window.updateLabels = refreshLabels;
    try{ labelText = multiLabelText; }catch(e){}
    try{ updateLabels = refreshLabels; }catch(e){}
    window.HAYAT_MULTI_LABEL_VERSION = VERSION;
  }

  function boot(){
    addCss();
    injectControls();
    installOverrides();
    setTimeout(refreshLabels, 50);
    setTimeout(refreshLabels, 350);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  window.addEventListener('load', function(){ setTimeout(boot, 200); setTimeout(boot, 1000); });
})();
