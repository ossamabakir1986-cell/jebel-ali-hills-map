/* Hayat GIS v3.2 Admin + Agent usability enhancements
   - local display label builder
   - status business names Direct / Agent / Hold
   - price split visibility
   - admin agent directory + autofill
   - editable GFA and plot features
   - bulk edit selected plots
   - normalized type filtering
*/
(function(){
  'use strict';
  var isAdmin = !!document.getElementById('plotEditModal');
  var displayKey = isAdmin ? 'HAYAT_V32_ADMIN_DISPLAY' : 'HAYAT_V32_AGENT_DISPLAY';
  var contactsKey = 'HAYAT_V32_AGENT_CONTACTS';
  var statusMap = {Red:'Direct', Blue:'Agent', Pink:'Hold', Black:'Black', Green:'Green', Yellow:'Yellow', Orange:'Orange', '':'Other'};
  var colorByStatus = {direct:'Red', agent:'Blue', broker:'Blue', 'through broker':'Blue', hold:'Pink', 'on hold':'Pink', red:'Red', blue:'Blue', pink:'Pink'};
  var typeAliases = {
    'plot':'Plot',
    'ready villa':'Ready Villa',
    'ready building':'Ready Building',
    'building':'Building',
    'twin villa':'Twin Villa',
    'twin villa (ready)':'Twin Villa (Ready)',
    'retail/hotel apartments':'Retail / Hotel Apartments',
    'retail / hotel apartments':'Retail / Hotel Apartments',
    'retail hotel apartments':'Retail / Hotel Apartments'
  };
  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m];}); }
  function safeJson(key, fallback){ try{ var v=localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }catch(e){ return fallback; } }
  function saveJson(key, obj){ try{ localStorage.setItem(key, JSON.stringify(obj)); }catch(e){} }
  function money(x){ if(window.money) return window.money(x); if(x==null || isNaN(x)) return ''; return 'AED ' + Math.round(Number(x)).toLocaleString(); }
  function normText(s){ return String(s || '').replace(/\s+/g,' ').trim(); }
  function titleCase(s){ return normText(s).split(' ').map(function(w){ return w ? w.charAt(0).toUpperCase()+w.slice(1).toLowerCase() : ''; }).join(' '); }
  function normalizeTypeV32(v){
    if(window.HayatDataNormalize && window.HayatDataNormalize.normalizeType){ v = window.HayatDataNormalize.normalizeType(v); }
    var s = normText(v); if(!s) return '';
    var key = s.toLowerCase().replace(/\s*\/\s*/g,'/');
    return typeAliases[key] || typeAliases[s.toLowerCase()] || titleCase(s).replace(/G\+([14])/g,'G+$1');
  }
  window.HayatNormalizeTypeV32 = normalizeTypeV32;
  function normalizeColorV32(v){
    var s=normText(v).toLowerCase();
    return colorByStatus[s] || (s ? s.charAt(0).toUpperCase()+s.slice(1).toLowerCase() : '');
  }
  function statusLabel(color){ return statusMap[String(color || '')] || String(color || 'Other'); }
  window.HayatStatusLabel = statusLabel;
  function isVisible(k){ return (typeof window.isDetailVisible === 'function') ? window.isDetailVisible(k) : true; }
  function masterLabel(p){ return (typeof window.masterPlanLabel === 'function') ? window.masterPlanLabel(p) : (p.masterPlot || ''); }
  function currentDisplay(){
    var defaults = {labels:{masterPlot:true}, offerMode:'cheapest'};
    return Object.assign(defaults, safeJson(displayKey, {}));
  }
  function saveDisplayFromControls(){
    var labels={};
    document.querySelectorAll('[data-v32-label]').forEach(function(cb){ labels[cb.getAttribute('data-v32-label')] = !!cb.checked; });
    var modeEl=$('v32OfferMode');
    saveJson(displayKey, {labels:labels, offerMode: modeEl ? modeEl.value : 'cheapest'});
    if(typeof window.updateLabels === 'function') window.updateLabels();
  }
  function primaryOffer(p){ return {agent:p.agent||'', mobile:p.mobile||'', price:p.price, priceText:p.priceText||'', total:p.total, color:p.color||'', label:statusLabel(p.color)}; }
  function secondOffer(p){ return {agent:p.secondAgent||'', mobile:p.secondMobile||'', price:p.secondPrice, priceText:p.secondPriceText||'', total:p.secondTotal, color:p.secondColor||'', label:statusLabel(p.secondColor || 'Blue')}; }
  function offerForMode(p, mode){
    var a=primaryOffer(p), b=secondOffer(p), hasB=!!(p.secondAgent || p.secondPrice || p.secondPriceText || p.secondMobile);
    if(!hasB) return a;
    if(mode === 'direct') return String(a.color).toLowerCase()==='red' ? a : (String(b.color).toLowerCase()==='red' ? b : a);
    if(mode === 'primary') return a;
    if(mode === 'both') return null;
    var ap = Number(a.price), bp = Number(b.price);
    if(!isNaN(ap) && !isNaN(bp)) return ap <= bp ? a : b;
    if(!isNaN(ap)) return a; if(!isNaN(bp)) return b; return a;
  }
  function priceForLabel(p){
    var mode=(currentDisplay().offerMode || 'cheapest');
    if(mode==='both' && (p.secondAgent || p.secondPrice)){ var parts=[]; if(p.priceText) parts.push(statusLabel(p.color)+': '+p.priceText); if(p.secondPriceText) parts.push(statusLabel(p.secondColor||'Blue')+': '+p.secondPriceText); return parts.join(' / '); }
    var o=offerForMode(p, mode); return o && o.priceText ? 'AED ' + o.priceText : '';
  }
  function statusForLabel(p){ var o=offerForMode(p, currentDisplay().offerMode || 'cheapest'); return o ? o.label : ''; }
  function linePartsForLabel(p){
    var s=currentDisplay(); var labels=s.labels || {}; var parts=[];
    if(labels.gisPlot && p.gisPlot) parts.push(p.gisPlot);
    if(labels.masterPlot && masterLabel(p)) parts.push(masterLabel(p));
    if(labels.price){ var pr=priceForLabel(p); if(pr) parts.push(pr); }
    if(labels.status){ var st=statusForLabel(p); if(st) parts.push(st); }
    if(labels.agent){ var off=offerForMode(p, s.offerMode || 'cheapest'); var ag=(off && off.agent) || p.agent || p.secondAgent || ''; if(ag) parts.push(ag); }
    if(labels.gfa && p.gfa) parts.push(p.gfa);
    if(labels.features && p.features) parts.push(p.features);
    if(!parts.length){
      var mode = $('labelMode') ? $('labelMode').value : 'masterPlot';
      if(mode === 'gisPlot') return [p.gisPlot || ''];
      if(mode === 'price') return [priceForLabel(p) || ''];
      if(mode === 'agent') return [p.agent || p.secondAgent || ''];
      if(mode === 'gfa') return [p.gfa || ''];
      if(mode === 'phase') return [p.phase || ''];
      if(mode === 'size') return [p.sizeText ? p.sizeText + ' sqft' : ''];
      if(mode === 'total') return [p.total ? money(p.total) : ''];
      return [masterLabel(p) || p.gisPlot || ''];
    }
    return parts;
  }
  window.labelText = function(p){ return linePartsForLabel(p).filter(Boolean).join('\n'); };
  function injectDisplayControls(){
    var labelSelect=$('labelMode'); if(!labelSelect || $('v32DisplayBox')) return;
    var s=currentDisplay();
    var box=document.createElement('div'); box.id='v32DisplayBox'; box.className='v32-display-box';
    var defs=[['gisPlot','GIS'],['masterPlot','Master plan'],['price','Price'],['status','Status'],['agent','Agent'],['gfa','GFA'],['features','Features']];
    box.innerHTML='<div class="section-title">Display labels</div><div class="v32-label-grid">'+defs.map(function(d){ return '<label><input type="checkbox" data-v32-label="'+d[0]+'" '+((s.labels||{})[d[0]]?'checked':'')+'> '+d[1]+'</label>'; }).join('')+'</div><div class="row"><select id="v32OfferMode"><option value="cheapest">Two offers: show cheapest</option><option value="direct">Two offers: show direct</option><option value="both">Two offers: show both</option><option value="primary">Two offers: show primary</option></select></div>';
    labelSelect.parentElement.insertAdjacentElement('afterend', box);
    var mode=$('v32OfferMode'); if(mode) mode.value=s.offerMode || 'cheapest';
    box.querySelectorAll('input,select').forEach(function(el){ el.addEventListener('change', saveDisplayFromControls); });
  }
  function row(label, value){ if(value==null || value==='') return ''; return '<tr><td>'+esc(label)+'</td><td>'+value+'</td></tr>'; }
  window.priceBlock = function(prefix, priceText, total, deposit, commission){
    var any = priceText || (total!=null && !isNaN(total)) || (deposit!=null && !isNaN(deposit)) || (commission!=null && !isNaN(commission));
    if(!any) return '';
    var h = prefix ? '<tr><td colspan="2" style="background:#f6f6f6;font-weight:bold">'+esc(prefix)+'</td></tr>' : '';
    if(isVisible('pricing') === false) return '';
    if(isVisible('priceSqft')) h += row('Price/sqft', priceText ? 'AED '+esc(priceText) : '');
    if(isVisible('totalPrice')) h += row('Total', total!=null && !isNaN(total) ? money(total) : '');
    if(isVisible('deposit')) h += row('Deposit cheque 10%', deposit!=null && !isNaN(deposit) ? money(deposit) : '');
    if(isVisible('commission')) h += row('Company commission 2%', commission!=null && !isNaN(commission) ? money(commission) : '');
    return h;
  };
  window.popupHtml = function(p){
    var s='<div class="popup-title">GIS Plot '+esc(p.gisPlot)+'</div><table class="popup-table">';
    if(isVisible('masterPlot')) s += row('Master Plan Plot', esc(masterLabel(p)));
    if(isVisible('status')) s += row('Status', esc(statusLabel(p.color)));
    if(isVisible('agent')) s += row('Agent', esc(p.agent||''));
    if(isVisible('mobile')) s += row('Mobile', esc(p.mobile||''));
    if(isVisible('size')) s += row('Size', p.sizeText ? esc(p.sizeText)+' sqft' : '');
    s += window.priceBlock('', p.priceText, p.total, p.deposit, p.commission);
    if(isVisible('secondOffer') && (p.secondAgent || p.secondPriceText || p.secondMobile)){
      s += '<tr><td colspan="2" style="background:#f9f7ef;font-weight:bold">Additional agent / offer</td></tr>';
      if(isVisible('status')) s += row('Second status', esc(statusLabel(p.secondColor || 'Blue')));
      if(isVisible('agent')) s += row('Second agent', esc(p.secondAgent || ''));
      if(isVisible('mobile')) s += row('Second mobile', esc(p.secondMobile || ''));
      s += window.priceBlock('', p.secondPriceText, p.secondTotal, p.secondDeposit, p.secondCommission);
    }
    if(isVisible('type')) s += row('Type', esc(p.type || ''));
    if(isVisible('phase')) s += row('Phase', esc(p.phase || ''));
    if(isVisible('gfa')) s += row('GFA', esc(p.gfa || ''));
    if(isVisible('features') && p.features) s += row('Features', esc(p.features));
    if(isVisible('comment')) s += row('Comment', esc(p.comment || ''));
    if(isVisible('coordinates')) s += '<tr><td>Coordinates</td><td><a target="_blank" href="'+esc(p.mapsUrl || '')+'">'+esc(p.coords || '')+'</a></td></tr>';
    s += '</table><div class="copy-actions"><button onclick="copyPlotDetailsByRow('+Number(p.row||0)+')">Copy Details</button><button onclick="copyPlotDescriptionByRow('+Number(p.row||0)+')">Copy Description</button></div>';
    if(isAdmin && p && p.row){
      var rowId = Number(p.row || 0);
      s += '<div class="admin-actions"><button onclick="openPlotEditorByRow(' + rowId + ')">Edit Plot</button><button class="secondary" onclick="openPlotEditorByRow(' + rowId + '); setTimeout(function(){ if(typeof startMovePlotFromEditor===\'function\') startMovePlotFromEditor(); }, 80);">Move Plot</button><button class="danger" onclick="deletePlotByRow(' + rowId + ')">Delete Plot</button></div>';
    }
    return s;
  };
  window.plotDetailsText = function(p){
    var lines=['Jebel Ali Hills','Plot: '+(p.gisPlot||'')];
    if(isVisible('masterPlot') && p.masterPlot) lines.push('PA Plot: '+p.masterPlot);
    if(isVisible('status') && p.color) lines.push('Status: '+statusLabel(p.color));
    if(isVisible('type') && p.type) lines.push('Type: '+p.type);
    if(isVisible('features') && p.features) lines.push('Features: '+p.features);
    if(isVisible('gfa') && p.gfa) lines.push('GFA: '+p.gfa);
    if(isVisible('size') && p.sizeText) lines.push('Area: '+p.sizeText+' sqft');
    if(isVisible('pricing')){
      if(isVisible('priceSqft') && p.priceText) lines.push('Price/sqft: AED '+p.priceText);
      if(isVisible('totalPrice') && p.total) lines.push('Total Price: '+money(p.total));
      if(isVisible('deposit') && p.deposit) lines.push('Deposit cheque 10%: '+money(p.deposit));
      if(isVisible('commission') && p.commission) lines.push('Company commission 2%: '+money(p.commission));
    }
    if(isVisible('secondOffer') && (p.secondAgent || p.secondPriceText)){
      lines.push('Additional offer: '+[statusLabel(p.secondColor||'Blue'), p.secondAgent, p.secondPriceText ? 'AED '+p.secondPriceText+'/sqft' : ''].filter(Boolean).join(' - '));
    }
    if(isVisible('phase') && p.phase) lines.push('Phase: '+p.phase);
    if(isVisible('comment') && p.comment) lines.push('Note: '+p.comment);
    lines.push(''); lines.push('Source: Hayat Luxury GIS'); return lines.join('\n');
  };
  window.plotDescriptionText = function(p){
    var parts=[]; var type=(isVisible('type') && p.type) ? p.type : 'plot';
    var first='Premium '+type+' opportunity in Jebel Ali Hills';
    if(isVisible('size') && p.sizeText) first += ' with approximately '+p.sizeText+' sqft of land';
    if(isVisible('gfa') && p.gfa) first += ' and '+p.gfa+' permission';
    first += '.'; parts.push(first);
    var d=[];
    if(isVisible('features') && p.features) d.push('Features: '+p.features+'.');
    if(isVisible('pricing')){
      if(isVisible('priceSqft') && p.priceText) d.push('Price: AED '+p.priceText+' per sqft.');
      if(isVisible('totalPrice') && p.total) d.push('Total asking price: '+money(p.total)+'.');
      if(isVisible('deposit') && p.deposit) d.push('Deposit cheque 10%: '+money(p.deposit)+'.');
      if(isVisible('commission') && p.commission) d.push('Company commission 2%: '+money(p.commission)+'.');
    }
    if(d.length) parts.push(d.join(' '));
    var refs=[]; if(isVisible('masterPlot') && p.masterPlot) refs.push('Master plan reference: '+p.masterPlot+'.'); if(isVisible('phase') && p.phase) refs.push('Phase '+p.phase+'.'); if(isVisible('status') && p.color) refs.push('Status: '+statusLabel(p.color)+'.');
    if(refs.length) parts.push(refs.join(' '));
    parts.push('For more information, contact Hayat Luxury Properties.');
    return parts.filter(function(x){ return normText(x); }).join('\n\n');
  };
  function injectDetailFields(){
    var box=$('detailsChecklist'); if(!box || box.getAttribute('data-v32')) return; box.setAttribute('data-v32','1');
    var html='<label><input type="checkbox" data-field="status" checked> Status</label><label><input type="checkbox" data-field="priceSqft" checked> Price/sqft</label><label><input type="checkbox" data-field="totalPrice" checked> Total price</label><label><input type="checkbox" data-field="deposit" checked> Deposit cheque</label><label><input type="checkbox" data-field="commission" checked> Commission</label><label><input type="checkbox" data-field="features" checked> Plot features</label>';
    box.insertAdjacentHTML('beforeend', html);
    if(typeof window.loadDetailFields === 'function') window.loadDetailFields();
  }
  function collectContacts(){
    var map=safeJson(contactsKey, {});
    (window.points||[]).forEach(function(p){ if(p.agent) map[p.agent]=p.mobile || map[p.agent] || ''; if(p.secondAgent) map[p.secondAgent]=p.secondMobile || map[p.secondAgent] || ''; });
    saveJson(contactsKey,map); return map;
  }
  function refreshAgentDatalist(){
    var map=collectContacts(); var dl=$('v32AgentNames'); if(!dl){ dl=document.createElement('datalist'); dl.id='v32AgentNames'; document.body.appendChild(dl); }
    dl.innerHTML=Object.keys(map).sort().map(function(n){ return '<option value="'+esc(n)+'">'+esc(map[n]||'')+'</option>'; }).join('');
    ['editAgent','editSecondAgent','bulkValue'].forEach(function(id){ var el=$(id); if(el) el.setAttribute('list','v32AgentNames'); });
  }
  function maybeFillMobile(nameId, mobileId){ var nameEl=$(nameId), mobEl=$(mobileId); if(!nameEl || !mobEl) return; var map=collectContacts(); var n=nameEl.value; if(map[n] && (!mobEl.value || mobEl.getAttribute('data-autofilled')==='1')){ mobEl.value=map[n]; mobEl.setAttribute('data-autofilled','1'); } }
  function ensureAdminEditorFields(){
    if(!isAdmin || $('editGfaV32')) return;
    var phase=$('editPhase');
    if(phase && phase.parentElement){
      phase.parentElement.insertAdjacentHTML('afterend','<label>GFA<select id="editGfaV32"><option value=""></option><option value="G+1">G+1</option><option value="G+4">G+4</option></select></label><label class="plot-edit-wide">Plot features<input id="editFeaturesV32" placeholder="Corner, End Unit, Back to Back, Single Row, Park Facing..."></label>');
    }
    ['editAgent','editSecondAgent'].forEach(function(id){ var el=$(id); if(el) el.setAttribute('list','v32AgentNames'); });
    var a=$('editAgent'); if(a) a.addEventListener('change', function(){ maybeFillMobile('editAgent','editMobile'); });
    var a2=$('editSecondAgent'); if(a2) a2.addEventListener('change', function(){ maybeFillMobile('editSecondAgent','editSecondMobile'); });
    var m=$('editMobile'); if(m) m.addEventListener('input', function(){ m.removeAttribute('data-autofilled'); });
    var m2=$('editSecondMobile'); if(m2) m2.addEventListener('input', function(){ m2.removeAttribute('data-autofilled'); });
    var c=$('editColor'); if(c){ Array.from(c.options).forEach(function(o){ if(statusMap[o.value]) o.textContent=statusMap[o.value]; }); }
    var sc=$('editSecondColor'); if(sc){ Array.from(sc.options).forEach(function(o){ if(statusMap[o.value]) o.textContent=statusMap[o.value]; }); }
    refreshAgentDatalist();
  }
  function recalcGfa(p){
    var g=String(p.gfa||'').toUpperCase().replace(/\s/g,''); var pct=null;
    if(g.indexOf('G+4')!==-1) pct=2.20; else if(g.indexOf('G+1')!==-1) pct=0.65;
    p.gfaPct=pct!==null?Math.round(pct*100):null; p.gfaAllowed=(p.size!=null && pct!=null)?Number(p.size)*pct:null;
    p.gfaAllowedText=p.gfaAllowed!=null?Number(p.gfaAllowed).toLocaleString(undefined,{maximumFractionDigits:2}):'';
  }
  function postSaveRefresh(){
    refreshAgentDatalist();
    if(typeof window.refreshFilterOptionsFromPoints === 'function') window.refreshFilterOptionsFromPoints();
    if(typeof window.applyFilters === 'function') window.applyFilters(); else if(typeof window.addMarkers === 'function') window.addMarkers(window.points||[], false);
    if(typeof window.publishCurrentPoints === 'function') window.publishCurrentPoints();
  }
  function hookEditor(){
    if(!isAdmin || window.__v32EditorHooked) return; window.__v32EditorHooked=true;
    ensureAdminEditorFields();
    var oldOpen=window.openPlotEditorByRow;
    window.openPlotEditorByRow=function(row){ if(oldOpen) oldOpen(row); ensureAdminEditorFields(); var p=(window.points||[]).find(function(x){return String(x.row)===String(row);}); if(p){ var g=$('editGfaV32'), f=$('editFeaturesV32'); if(g) g.value=p.gfa||''; if(f) f.value=p.features||''; } refreshAgentDatalist(); };
    var oldAdd=window.openAddPlotByPA;
    if(oldAdd){ window.openAddPlotByPA=function(label,lat,lng){ oldAdd(label,lat,lng); ensureAdminEditorFields(); var g=$('editGfaV32'), f=$('editFeaturesV32'); if(g) g.value=''; if(f) f.value=''; }; }
    var oldSave=window.savePlotEdit;
    window.savePlotEdit=function(){
      var gis=$('editGisPlot') ? $('editGisPlot').value : ''; var g=$('editGfaV32') ? $('editGfaV32').value : ''; var f=$('editFeaturesV32') ? $('editFeaturesV32').value : '';
      var ag=$('editAgent') ? $('editAgent').value : '', mob=$('editMobile') ? $('editMobile').value : '', ag2=$('editSecondAgent') ? $('editSecondAgent').value : '', mob2=$('editSecondMobile') ? $('editSecondMobile').value : '';
      if(oldSave) oldSave();
      var p=(window.points||[]).find(function(x){return String(x.gisPlot)===String(gis);});
      if(p){ p.gfa=g; p.features=normText(f); recalcGfa(p); }
      var map=collectContacts(); if(ag) map[ag]=mob||map[ag]||''; if(ag2) map[ag2]=mob2||map[ag2]||''; saveJson(contactsKey,map);
      postSaveRefresh();
    };
  }
  function patchFilters(){
    if(window.__v32FiltersPatched) return; window.__v32FiltersPatched=true;
    window.refreshFilterOptionsFromPoints=function(){
      var agents=[], colors=[], types=[], phases=[], gfas=[]; function add(a,v){ v=normText(v); if(v && a.indexOf(v)===-1) a.push(v); }
      (window.points||[]).forEach(function(p){ p.type=normalizeTypeV32(p.type); add(agents,p.agent); add(agents,p.secondAgent); add(colors,p.color); add(types,p.type); add(phases,p.phase); add(gfas,p.gfa); });
      agents.sort(); colors.sort(); types.sort(); phases.sort(); gfas.sort();
      function set(id, vals, first, labeller){ var sel=$(id); if(!sel) return; var cur=sel.value; sel.innerHTML='<option value="">'+first+'</option>'+vals.map(function(v){return '<option value="'+esc(v)+'">'+esc(labeller?labeller(v):v)+'</option>';}).join(''); if(vals.indexOf(cur)!==-1) sel.value=cur; }
      set('agent',agents,'All agents'); set('color',colors,'All statuses',statusLabel); set('type',types,'All types'); set('phase',phases,'All phases'); set('gfa',gfas,'All GFA');
    };
    window.applyFilters=function(){
      var search=($('search')&&$('search').value||'').toLowerCase(), agent=$('agent')?$('agent').value:'', color=$('color')?$('color').value:'', type=$('type')?$('type').value:'', phase=$('phase')?$('phase').value:'', gfa=$('gfa')?$('gfa').value:'';
      var minSize=$('minSize')&&$('minSize').value!==''?parseFloat($('minSize').value):null, maxSize=$('maxSize')&&$('maxSize').value!==''?parseFloat($('maxSize').value):null, minPrice=$('minPrice')&&$('minPrice').value!==''?parseFloat($('minPrice').value):null, maxPrice=$('maxPrice')&&$('maxPrice').value!==''?parseFloat($('maxPrice').value):null, priced=$('priced')?$('priced').value:'';
      var ntype=normalizeTypeV32(type);
      var filtered=(window.points||[]).filter(function(p){
        p.type=normalizeTypeV32(p.type);
        var hay=[p.gisPlot,p.masterPlot,p.agent,p.mobile,p.secondAgent,p.secondMobile,p.features].join(' ').toLowerCase(); if(search && hay.indexOf(search)===-1) return false;
        if(agent && p.agent!==agent && p.secondAgent!==agent) return false; if(color && p.color!==color && p.secondColor!==color) return false; if(type && normalizeTypeV32(p.type)!==ntype) return false; if(phase && p.phase!==phase) return false; if(gfa && p.gfa!==gfa) return false;
        if(minSize!==null && (!p.size || p.size<minSize)) return false; if(maxSize!==null && (!p.size || p.size>maxSize)) return false;
        if(minPrice!==null && (!p.price || p.price<minPrice) && (!p.secondPrice || p.secondPrice<minPrice)) return false; if(maxPrice!==null && (!p.price || p.price>maxPrice) && (!p.secondPrice || p.secondPrice>maxPrice)) return false;
        if(priced==='priced' && !p.price && !p.secondPrice) return false; if(priced==='unpriced' && (p.price || p.secondPrice)) return false; return true;
      });
      window.baseFilteredList=filtered; if(window.showSelectedOnly && typeof window.setShowSelectedOnly==='function') window.setShowSelectedOnly(false); if(typeof window.addMarkers==='function') window.addMarkers(filtered);
    };
  }
  function injectBulkTools(){
    if(!isAdmin || $('v32BulkBox')) return;
    var selBox=$('selectionBox'); if(!selBox) return;
    selBox.insertAdjacentHTML('beforeend','<div id="v32BulkBox" class="v32-bulk-box"><div class="selection-title">Bulk edit selected</div><div class="row"><select id="bulkField"><option value="gfa">Set GFA</option><option value="features">Set plot features</option><option value="appendFeatures">Append plot features</option><option value="color">Set status</option><option value="type">Set type</option><option value="phase">Set phase</option><option value="agent">Set agent</option><option value="mobile">Set mobile</option><option value="price">Set price/sqft</option></select><input id="bulkValue" placeholder="Value"></div><div class="row"><button onclick="applyBulkEditSelected()">Apply to Selected</button><button class="danger" onclick="deleteSelectedPlotsV32()">Delete Selected</button></div></div>');
  }
  window.applyBulkEditSelected=function(){
    var list=(typeof window.selectedList==='function') ? window.selectedList() : []; if(!list.length){ alert('No plots selected.'); return; }
    var field=$('bulkField')?$('bulkField').value:'', value=$('bulkValue')?$('bulkValue').value:''; if(!field){return;}
    if(!confirm('Apply to '+list.length+' selected plot(s)?')) return;
    list.forEach(function(p){
      if(field==='gfa'){ p.gfa=value; recalcGfa(p); }
      else if(field==='features'){ p.features=normText(value); }
      else if(field==='appendFeatures'){ p.features=normText([p.features,value].filter(Boolean).join(', ')); }
      else if(field==='color'){ p.color=normalizeColorV32(value) || p.color; }
      else if(field==='type'){ p.type=normalizeTypeV32(value); }
      else if(field==='phase'){ p.phase=normText(value); }
      else if(field==='agent'){ p.agent=normText(value); var map=collectContacts(); if(map[p.agent]) p.mobile=map[p.agent]; }
      else if(field==='mobile'){ p.mobile=normText(value); }
      else if(field==='price'){ var n=Number(String(value).replace(/,/g,'')); if(!isNaN(n)){ p.price=n; p.priceText=Math.round(n).toLocaleString(); p.total=(p.size&&p.price)?p.size*p.price:null; p.totalText=p.total?Math.round(p.total).toLocaleString():''; p.deposit=p.total?p.total*.10:null; p.depositText=p.deposit?Math.round(p.deposit).toLocaleString():''; p.commission=p.total?p.total*.02:null; p.commissionText=p.commission?Math.round(p.commission).toLocaleString():''; } }
    });
    postSaveRefresh(); if(typeof window.updateSelectionPanel==='function') window.updateSelectionPanel(); alert('Bulk update applied.');
  };
  window.deleteSelectedPlotsV32=function(){
    var list=(typeof window.selectedList==='function') ? window.selectedList() : []; if(!list.length){ alert('No plots selected.'); return; }
    if(!confirm('Delete '+list.length+' selected plot(s) from inventory?')) return;
    var keys={}; list.forEach(function(p){ keys[String(p.gisPlot)]=true; }); window.points=(window.points||[]).filter(function(p){ return !keys[String(p.gisPlot)]; });
    if(typeof window.clearSelection==='function') window.clearSelection(); postSaveRefresh(); alert('Selected plots deleted.');
  };
  function patchAddMarkersHitTarget(){
    // Keep the same visual style but make the pin slightly easier to press by increasing marker radius a little.
    var old=window.addMarkers; if(!old || window.__v32AddMarkersPatched) return; window.__v32AddMarkersPatched=true;
    window.addMarkers=function(list, doFit){ old(list, doFit); try{ (window.markers||[]).forEach(function(o){ if(o.marker && o.marker.setStyle){ o.marker.setStyle({radius:8, weight:2}); } }); }catch(e){} };
  }
  function finishInit(){
    injectDisplayControls(); injectDetailFields(); patchFilters(); hookEditor(); injectBulkTools(); patchAddMarkersHitTarget();
    if(typeof window.refreshFilterOptionsFromPoints==='function') window.refreshFilterOptionsFromPoints();
    if(typeof window.applyFilters==='function') window.applyFilters(); else if(typeof window.updateLabels==='function') window.updateLabels();
    setTimeout(function(){ try{ if(isAdmin && window.markers){ window.markers.forEach(function(o){ if(o && o.marker && o.point && window.popupHtml) o.marker.bindPopup(window.popupHtml(o.point)); }); } }catch(e){} }, 100);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', finishInit); else setTimeout(finishInit, 0);
})();
