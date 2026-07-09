/* Hayat GIS v3.3.2 - Feature filter + label stacking fix */
(function(){
  'use strict';
  var FEATURES = window.HAYAT_STANDARD_FEATURES || ['Corner','End Unit','Back to Back','Single Row','Park Facing','Green Belt Facing','Vastu'];
  function $(id){return document.getElementById(id);} 
  function normText(s){return String(s||'').replace(/\s+/g,' ').trim();}
  function normKey(s){return normText(s).toLowerCase().replace(/[\s_\-\/]+/g,' ');} 
  function esc(s){return String(s==null?'':s).replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c];});}
  function featureCanonical(s){
    var k=normKey(s); var aliases={
      'corner':'Corner','end':'End Unit','end unit':'End Unit','end plot':'End Unit',
      'back to back':'Back to Back','backtoback':'Back to Back','back-to-back':'Back to Back',
      'single row':'Single Row','single':'Single Row','park':'Park Facing','park facing':'Park Facing',
      'green belt':'Green Belt Facing','green belt facing':'Green Belt Facing','greenbelt':'Green Belt Facing',
      'vastu':'Vastu','vatsu':'Vastu','north east':'Vastu','northeast':'Vastu'
    };
    if(aliases[k]) return aliases[k];
    for(var i=0;i<FEATURES.length;i++){ if(normKey(FEATURES[i])===k) return FEATURES[i]; }
    return normText(s);
  }
  function parseFeatures(v){
    var arr=[]; var seen={};
    if(Array.isArray(v)) v=v.join(',');
    String(v||'').split(/[;,|]+/).forEach(function(part){ var c=featureCanonical(part); var key=normKey(c); if(c && !seen[key]){ seen[key]=true; arr.push(c); } });
    return arr;
  }
  function hasFeature(p,f){var key=normKey(featureCanonical(f)); return parseFeatures(p && p.features).some(function(x){return normKey(x)===key;});}
  window.HayatFeatureTools = Object.assign({}, window.HayatFeatureTools||{}, {features:FEATURES, parse:parseFeatures, has:hasFeature, canonical:featureCanonical});
  function val(id){var e=$(id); return e ? e.value : '';} function num(id){var v=val(id); if(v==='') return null; var n=Number(String(v).replace(/,/g,'')); return isNaN(n)?null:n;}
  function normType(v){ if(window.HayatNormalizeTypeV32) return window.HayatNormalizeTypeV32(v); if(window.HayatDataNormalize && window.HayatDataNormalize.normalizeType) return window.HayatDataNormalize.normalizeType(v); return normText(v).toLowerCase(); }
  function selectedFeatures(){
    var out=[]; var sel=$('v331FeatureFilter'); if(sel && sel.value) out.push(sel.value);
    document.querySelectorAll('[data-v34-feature-filter]:checked').forEach(function(cb){out.push(cb.value);});
    var seen={}; return out.map(featureCanonical).filter(function(f){var k=normKey(f); if(seen[k]) return false; seen[k]=true; return true;});
  }
  function matchFilters(p){
    var search=val('search').toLowerCase(), agent=val('agent'), color=val('color'), type=val('type'), phase=val('phase'), gfa=val('gfa');
    var minSize=num('minSize'), maxSize=num('maxSize'), minPrice=num('minPrice'), maxPrice=num('maxPrice'), priced=val('priced');
    if(search && !([p.gisPlot,p.masterPlot,p.agent,p.mobile,p.secondAgent,p.secondMobile,p.type,p.gfa,p.features].join(' ').toLowerCase().includes(search))) return false;
    if(agent && p.agent!==agent && p.secondAgent!==agent) return false;
    if(color && p.color!==color && p.secondColor!==color) return false;
    if(type && normType(p.type)!==normType(type)) return false;
    if(phase && String(p.phase)!==String(phase)) return false;
    if(gfa && String(p.gfa)!==String(gfa)) return false;
    if(minSize!==null && (!p.size || p.size<minSize)) return false;
    if(maxSize!==null && (!p.size || p.size>maxSize)) return false;
    if(minPrice!==null && (!p.price || p.price<minPrice) && (!p.secondPrice || p.secondPrice<minPrice)) return false;
    if(maxPrice!==null && (!p.price || p.price>maxPrice) && (!p.secondPrice || p.secondPrice>maxPrice)) return false;
    if(priced==='priced' && !p.price && !p.secondPrice) return false;
    if(priced==='unpriced' && (p.price || p.secondPrice)) return false;
    var fs=selectedFeatures();
    for(var i=0;i<fs.length;i++){ if(!hasFeature(p,fs[i])) return false; }
    return true;
  }
  window.applyFilters = function(){
    clearTimeout(window.__hayat332FilterTimer);
    window.__hayat332FilterTimer=setTimeout(function(){
      var filtered=(window.points||[]).filter(matchFilters);
      window.baseFilteredList=filtered;
      try{ if(window.showSelectedOnly && typeof window.setShowSelectedOnly==='function') window.setShowSelectedOnly(false); }catch(e){}
      if(typeof window.addMarkers==='function') window.addMarkers(filtered);
      var c=$('count'); if(c) c.textContent=filtered.length+' plot(s)';
    },50);
  };
  window.applyFiltersImmediate=function(){
    var filtered=(window.points||[]).filter(matchFilters); window.baseFilteredList=filtered; if(typeof window.addMarkers==='function') window.addMarkers(filtered); return filtered;
  };
  function displayKey(){ return document.getElementById('plotEditModal') ? 'HAYAT_V32_ADMIN_DISPLAY' : 'HAYAT_V32_AGENT_DISPLAY'; }
  function saveDisplay(labels, offerMode){ try{ localStorage.setItem(displayKey(), JSON.stringify({labels:labels, offerMode:offerMode||(($('v32OfferMode')||{}).value)||'cheapest'})); }catch(e){} if(typeof window.updateLabels==='function') window.updateLabels(); }
  function labelMapForMode(mode){
    var labels={};
    if(mode==='gisPlot') labels.gisPlot=true;
    else if(mode==='price') labels.price=true;
    else if(mode==='agent') labels.agent=true;
    else if(mode==='gfa') labels.gfa=true;
    else if(mode==='phase') labels.phase=true;
    else if(mode==='size') labels.size=true;
    else if(mode==='total') labels.total=true;
    else if(mode==='features') labels.features=true;
    else labels.masterPlot=true;
    return labels;
  }
  function syncLabelControlsFromDropdown(){
    var mode=val('labelMode')||'masterPlot'; var labels=labelMapForMode(mode);
    document.querySelectorAll('[data-v32-label]').forEach(function(cb){ cb.checked=!!labels[cb.getAttribute('data-v32-label')]; });
    saveDisplay(labels);
  }
  function markCustomLabels(){
    var sel=$('labelMode'); if(sel){
      if(!Array.from(sel.options).some(function(o){return o.value==='custom';})){ var o=document.createElement('option'); o.value='custom'; o.textContent='Custom labels'; sel.appendChild(o); }
      sel.value='custom';
    }
    var labels={}; document.querySelectorAll('[data-v32-label]').forEach(function(cb){labels[cb.getAttribute('data-v32-label')]=!!cb.checked;});
    saveDisplay(labels);
  }
  function patchLabelControls(){
    var sel=$('labelMode'); if(sel && !sel.__hayat332){ sel.__hayat332=true; sel.addEventListener('change', syncLabelControlsFromDropdown); }
    document.querySelectorAll('[data-v32-label]').forEach(function(cb){ if(!cb.__hayat332){ cb.__hayat332=true; cb.addEventListener('change', markCustomLabels); } });
  }
  function fixFeatureFilterEvents(){
    var ff=$('v331FeatureFilter'); if(ff && !ff.__hayat332){ ff.__hayat332=true; ff.addEventListener('change', window.applyFilters); }
    document.querySelectorAll('[data-v34-feature-filter]').forEach(function(cb){ if(!cb.__hayat332){cb.__hayat332=true; cb.addEventListener('change', window.applyFilters);} });
  }
  function init(){ patchLabelControls(); fixFeatureFilterEvents(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', function(){setTimeout(init,250);}); else setTimeout(init,250);
  setTimeout(init,1200); setTimeout(init,2500);
})();
