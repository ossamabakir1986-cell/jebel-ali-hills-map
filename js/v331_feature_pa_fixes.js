/* Hayat GIS v3.3.1 - PA move handle + standard plot features */
(function(){
  'use strict';
  var FEATURES = ['Corner','End Unit','Back to Back','Single Row','Park Facing','Green Belt Facing','Vastu'];
  window.HAYAT_STANDARD_FEATURES = FEATURES.slice();
  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s==null?'':s).replace(/[&<>\"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c];}); }
  function normText(s){ return String(s||'').replace(/\s+/g,' ').trim(); }
  function normKey(s){ return normText(s).toLowerCase().replace(/[\s_\-\/]+/g,' '); }
  function featureCanonical(s){
    var k = normKey(s);
    var aliases = {
      'corner':'Corner', 'end':'End Unit', 'end unit':'End Unit', 'end plot':'End Unit',
      'back to back':'Back to Back', 'backtoback':'Back to Back', 'back-to-back':'Back to Back',
      'single row':'Single Row', 'single':'Single Row',
      'park':'Park Facing', 'park facing':'Park Facing',
      'green belt':'Green Belt Facing', 'green belt facing':'Green Belt Facing', 'greenbelt':'Green Belt Facing',
      'vastu':'Vastu', 'vatsu':'Vastu', 'north east':'Vastu', 'northeast':'Vastu'
    };
    if(aliases[k]) return aliases[k];
    for(var i=0;i<FEATURES.length;i++){ if(normKey(FEATURES[i])===k) return FEATURES[i]; }
    return normText(s);
  }
  function parseFeatures(v){
    var out=[], seen={};
    String(v||'').split(/[;,|]+/).forEach(function(part){
      var c=featureCanonical(part);
      if(c && !seen[normKey(c)]){ seen[normKey(c)]=true; out.push(c); }
    });
    return out;
  }
  function formatFeatures(v){ return parseFeatures(v).join(', '); }
  function hasFeature(p, f){
    var key=normKey(featureCanonical(f));
    return parseFeatures(p && p.features).some(function(x){ return normKey(x)===key; });
  }
  window.HayatFeatureTools = {features:FEATURES, parse:parseFeatures, format:formatFeatures, has:hasFeature, canonical:featureCanonical};

  function addCss(){
    if($('v331FeatureCss')) return;
    var st=document.createElement('style'); st.id='v331FeatureCss';
    st.textContent = '.v331-feature-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px 10px;margin-top:6px}.v331-feature-grid label{display:flex!important;align-items:center;gap:6px;font-size:12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:6px}.v331-feature-grid input{width:auto!important}.v331-feature-other{margin-top:7px}.v331-move-pa-btn{border-color:#3b82f6!important}.v331-pa-move-icon{background:#2563eb;border:2px solid #fff;border-radius:50%;width:18px;height:18px;box-shadow:0 0 0 3px rgba(37,99,235,.25)}.v331-feature-filter{margin-top:6px}.v331-hidden-feature-input{opacity:.55}';
    document.head.appendChild(st);
  }

  function syncFeatureChecksToInput(){
    var input=$('editFeaturesV32'); if(!input) return;
    var vals=[];
    document.querySelectorAll('input.v331-feature-check').forEach(function(cb){ if(cb.checked) vals.push(cb.value); });
    var other=$('v331FeatureOther');
    if(other && normText(other.value)) vals.push(other.value);
    input.value=formatFeatures(vals.join(', '));
  }
  function fillFeatureChecks(value){
    var vals=parseFeatures(value), keys={}; vals.forEach(function(v){ keys[normKey(v)]=true; });
    FEATURES.forEach(function(f){ var cb=document.querySelector('input.v331-feature-check[value="'+f.replace(/"/g,'\\"')+'"]'); if(cb) cb.checked=!!keys[normKey(f)]; });
    var standardKeys={}; FEATURES.forEach(function(f){ standardKeys[normKey(f)]=true; });
    var otherVals=vals.filter(function(v){ return !standardKeys[normKey(v)]; });
    var other=$('v331FeatureOther'); if(other) other.value=otherVals.join(', ');
    syncFeatureChecksToInput();
  }
  function ensureFeatureEditor(){
    var input=$('editFeaturesV32'); if(!input || $('v331FeatureGrid')) return;
    input.classList.add('v331-hidden-feature-input');
    input.setAttribute('placeholder','Auto-filled from standard feature checkboxes');
    var html='<div id="v331FeatureGrid" class="v331-feature-grid">'+FEATURES.map(function(f){return '<label><input class="v331-feature-check" type="checkbox" value="'+esc(f)+'"> '+esc(f)+'</label>';}).join('')+'</div><input id="v331FeatureOther" class="v331-feature-other" placeholder="Other feature notes, optional">';
    input.insertAdjacentHTML('afterend', html);
    document.querySelectorAll('input.v331-feature-check').forEach(function(cb){ cb.addEventListener('change', syncFeatureChecksToInput); });
    var other=$('v331FeatureOther'); if(other) other.addEventListener('input', syncFeatureChecksToInput);
  }

  function isAdmin(){ return /admin\.html/i.test(location.pathname) || !!document.querySelector('[data-admin="true"]') || !!$('plotEditModal'); }
  function normPA(s){
    var raw=String(s||'').trim().toUpperCase().replace(/\s+/g,'');
    var m=raw.match(/^PA(\d+)_0*(\d+)$/); if(m) return 'PA'+Number(m[1])+'_'+Number(m[2]);
    return raw;
  }
  function findPoint(row){ return (window.points||[]).find(function(p){ return String(p.row)===String(row); }); }
  function findPAForPoint(p){
    if(!p || !window.JAH_PA_LABELS) return null;
    var targets=[p.masterPlot,p.gisPlot].map(normPA).filter(Boolean);
    return (window.JAH_PA_LABELS||[]).find(function(pa){ return targets.indexOf(normPA(pa.t||pa.label||pa.masterPlot))!==-1; }) || null;
  }
  function refreshAfterDataChange(msg){
    try{ if(window.HayatDataNormalize && window.HayatDataNormalize.normalizeAllPoints) window.HayatDataNormalize.normalizeAllPoints(); }catch(e){}
    try{ if(typeof window.refreshFilterOptionsFromPoints==='function') window.refreshFilterOptionsFromPoints(); }catch(e){}
    try{ if(typeof window.applyFilters==='function') window.applyFilters(); else if(typeof window.addMarkers==='function') window.addMarkers(window.points||[]); }catch(e){}
    try{ if(typeof window.publishCurrentPoints==='function') window.publishCurrentPoints(); }catch(e){}
    try{ if(typeof window.refreshAddablePALayer==='function') window.refreshAddablePALayer(); }catch(e){}
    if(msg) alert(msg);
  }
  function addMovePAButton(){
    if(!isAdmin() || $('v331MovePAButton')) return;
    var moveBtn=document.querySelector('#plotEditModal .plot-edit-actions button.secondary[onclick*="startMovePlotFromEditor"]');
    if(moveBtn){
      moveBtn.insertAdjacentHTML('afterend','<button id="v331MovePAButton" type="button" class="secondary v331-move-pa-btn" onclick="startMoveUnderlyingPAFromEditor()">Move PA Point</button>');
    }
  }
  window.startMoveUnderlyingPAFromEditor = function(){
    var row=$('editRowId') ? $('editRowId').value : ''; if(!row || row.indexOf('__')===0){ alert('Save the plot first, then move its PA point.'); return; }
    if(typeof closePlotEditor==='function') closePlotEditor();
    startMoveUnderlyingPAByRow(row);
  };
  window.startMoveUnderlyingPAByRow = function(row){ startMoveUnderlyingPAByRow(row); };
  function startMoveUnderlyingPAByRow(row){
    if(!window.map || !window.L){ alert('Map not ready.'); return; }
    var p=findPoint(row); if(!p){ alert('Plot not found.'); return; }
    var pa=findPAForPoint(p); if(!pa){ alert('No linked PA point found for '+(p.masterPlot||p.gisPlot||'this plot')+'.'); return; }
    if(window.__movePAMarker){ try{ map.removeLayer(window.__movePAMarker); }catch(e){} }
    var icon=L.divIcon({className:'', html:'<div class="v331-pa-move-icon"></div>', iconSize:[22,22], iconAnchor:[11,11]});
    var mk=L.marker([Number(pa.lat), Number(pa.lng)], {draggable:true, icon:icon, zIndexOffset:10000, title:'Drag underlying PA point'}).addTo(map);
    window.__movePAMarker=mk; window.__movePARef=pa; window.__movePAOriginal={lat:Number(pa.lat), lng:Number(pa.lng)};
    mk.bindPopup('<div class="popup-title">Move PA Point '+esc(pa.t||p.masterPlot||'')+'</div><div class="small-note">This moves only the underlying empty/master-plan PA point. Use this when the blue PA point is hidden under the inventory pin or was placed incorrectly.</div><div class="admin-actions"><button onclick="commitUnderlyingPAMove()">Save PA Position</button><button class="danger" onclick="cancelUnderlyingPAMove()">Cancel</button></div>').openPopup();
  }
  window.commitUnderlyingPAMove=function(){
    if(!window.__movePAMarker || !window.__movePARef){ alert('PA move operation not available.'); return; }
    var ll=window.__movePAMarker.getLatLng(); window.__movePARef.lat=Number(ll.lat); window.__movePARef.lng=Number(ll.lng);
    try{ map.removeLayer(window.__movePAMarker); }catch(e){}
    window.__movePAMarker=null; window.__movePARef=null; window.__movePAOriginal=null;
    refreshAfterDataChange('Underlying PA point updated.');
  };
  window.cancelUnderlyingPAMove=function(){
    try{ if(window.__movePARef && window.__movePAOriginal){ window.__movePARef.lat=window.__movePAOriginal.lat; window.__movePARef.lng=window.__movePAOriginal.lng; } }catch(e){}
    try{ if(window.__movePAMarker) map.removeLayer(window.__movePAMarker); }catch(e){}
    window.__movePAMarker=null; window.__movePARef=null; window.__movePAOriginal=null;
  };

  function injectFeatureFilter(){
    if($('v331FeatureFilter')) return;
    var typeSel=$('type'), anchor=typeSel ? typeSel.parentElement : null;
    if(!anchor) return;
    var html='<select id="v331FeatureFilter" class="v331-feature-filter"><option value="">All features</option>'+FEATURES.map(function(f){return '<option value="'+esc(f)+'">'+esc(f)+'</option>';}).join('')+'</select>';
    anchor.insertAdjacentHTML('afterend', html);
    $('v331FeatureFilter').addEventListener('change', function(){ if(typeof window.applyFilters==='function') window.applyFilters(); });
  }
  function patchFeatureFilter(){
    if(window.__v331FeatureFilterPatched) return; window.__v331FeatureFilterPatched=true;
    var oldApply=window.applyFilters;
    if(typeof oldApply==='function'){
      window.applyFilters=function(){
        oldApply.apply(this, arguments);
        var ff=$('v331FeatureFilter'); var val=ff && ff.value;
        if(val){
          var src=(window.baseFilteredList && window.baseFilteredList.length!==undefined) ? window.baseFilteredList : (window.points||[]);
          var filtered=Array.prototype.filter.call(src, function(p){ return hasFeature(p,val); });
          window.baseFilteredList=filtered;
          if(typeof window.addMarkers==='function') window.addMarkers(filtered);
          var count=$('count'); if(count) count.textContent=filtered.length+' plot(s)';
        }
      };
    }
  }
  function normalizeAllFeatures(){ (window.points||[]).forEach(function(p){ if(p.features) p.features=formatFeatures(p.features); }); }
  function patchEditorAndBulk(){
    if(window.__v331EditorPatched) return; window.__v331EditorPatched=true;
    var oldOpen=window.openPlotEditorByRow;
    if(typeof oldOpen==='function'){
      window.openPlotEditorByRow=function(row){
        oldOpen.apply(this, arguments); addMovePAButton(); ensureFeatureEditor();
        var p=findPoint(row); fillFeatureChecks(p ? p.features : '');
      };
    }
    var oldAdd=window.openAddPlotByPA;
    if(typeof oldAdd==='function'){
      window.openAddPlotByPA=function(){ oldAdd.apply(this, arguments); addMovePAButton(); ensureFeatureEditor(); fillFeatureChecks(''); };
    }
    var oldSave=window.savePlotEdit;
    if(typeof oldSave==='function'){
      window.savePlotEdit=function(){ syncFeatureChecksToInput(); oldSave.apply(this, arguments); normalizeAllFeatures(); };
    }
    var oldBulk=window.applyBulkEditSelected;
    if(typeof oldBulk==='function'){
      window.applyBulkEditSelected=function(){ oldBulk.apply(this, arguments); normalizeAllFeatures(); refreshAfterDataChange(); };
    }
  }
  function improveBulkFeatureInput(){
    var bv=$('bulkValue'); if(!bv || $('v331FeatureDatalist')) return;
    var dl=document.createElement('datalist'); dl.id='v331FeatureDatalist'; dl.innerHTML=FEATURES.map(function(f){return '<option value="'+esc(f)+'"></option>';}).join(''); document.body.appendChild(dl);
    bv.setAttribute('list','v331FeatureDatalist');
    var bf=$('bulkField');
    if(bf && !$('v331BulkFeaturePreset')){
      bf.insertAdjacentHTML('afterend','<select id="v331BulkFeaturePreset" title="Standard plot feature"><option value="">Standard feature...</option>'+FEATURES.map(function(f){return '<option value="'+esc(f)+'">'+esc(f)+'</option>';}).join('')+'</select>');
      $('v331BulkFeaturePreset').addEventListener('change', function(){ if(this.value) bv.value=this.value; });
    }
  }
  function init(){
    addCss(); injectFeatureFilter(); patchFeatureFilter(); patchEditorAndBulk(); improveBulkFeatureInput(); normalizeAllFeatures();
    addMovePAButton();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', function(){ setTimeout(init,150); }); else setTimeout(init,150);
  setTimeout(init,800);
})();
