// Hayat GIS v3.3.33 - Popup Refresh + Manual GFA Override + Last Updated Labels
// Builds on v3.3.32 base update. Final lightweight compatibility layer only.
(function(){
  'use strict';
  var VERSION = 'v3.3.33 Popup Refresh + Manual GFA Override + Last Updated Labels';
  function byId(id){ return document.getElementById(id); }
  function clean(v){ return String(v == null ? '' : v).replace(/\s+/g,' ').trim(); }
  function esc(v){ return String(v == null ? '' : v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function numberFrom(v){ var s=String(v == null ? '' : v).replace(/,/g,'').trim(); if(!s) return null; var n=Number(s); return isFinite(n) ? n : null; }
  function fmtNum(x){ return (x===null || x===undefined || isNaN(x)) ? '' : Number(x).toLocaleString(undefined,{minimumFractionDigits:0,maximumFractionDigits:2}); }
  function isAdmin(){ return !!byId('plotEditModal') || /admin\.html/i.test(location.pathname); }
  function getPoints(){ return Array.isArray(window.points) ? window.points : []; }
  function storageKey(){ return isAdmin() ? 'HAYAT_V32_ADMIN_DISPLAY' : 'HAYAT_V32_AGENT_DISPLAY'; }
  function visible(k){
    var cb = document.querySelector('#detailsChecklist input[data-field="'+ k +'"]');
    if(cb) return cb.checked !== false;
    return !(window.detailFields && window.detailFields[k] === false);
  }
  function readDisplay(){
    try{ var o=JSON.parse(localStorage.getItem(storageKey()) || '{}'); if(o && o.labels) return o; }catch(e){}
    return {labels:{}, offerMode:'cheapest'};
  }
  function writeDisplay(obj){ try{ localStorage.setItem(storageKey(), JSON.stringify(obj || {labels:{}})); }catch(e){} }
  function getOnlyActiveLabel(labels){
    var active = Object.keys(labels || {}).filter(function(k){ return labels[k]; });
    return active.length === 1 ? active[0] : '';
  }

  function extractLastUpdated(p){
    if(!p) return '';
    var direct = clean(p.lastUpdated || p.lastDateUpdated || p.lastDate || p.updateDate || p.updatedDate || p.dateUpdated || p.last_update);
    if(direct) return direct;
    var c = clean(p.comment);
    if(!c) return '';
    var m = c.match(/(?:last\s*(?:date\s*)?updated|last\s*update|updated)\s*[:\-]?\s*(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}|\d{4}[\/\-.]\d{1,2}[\/\-.]\d{1,2})/i);
    if(m) return m[1];
    m = c.match(/^(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}|\d{4}[\/\-.]\d{1,2}[\/\-.]\d{1,2})$/);
    return m ? m[1] : '';
  }
  function setLastUpdated(p, v){
    if(!p) return;
    p.lastUpdated = clean(v);
    p.lastDateUpdated = p.lastUpdated;
  }
  function manualValue(p){ return numberFrom(p && (p.gfaAllowedOverride != null ? p.gfaAllowedOverride : (p.gfaAllowedManual != null ? p.gfaAllowedManual : p.manualGfaAllowed))); }
  function applyManualGfa(p){
    if(!p) return p;
    var m = manualValue(p);
    if(m !== null){
      p.gfaAllowedOverride = m;
      p.gfaAllowedManual = m;
      p.manualGfaAllowed = m;
      p.gfaAllowed = m;
      p.gfaAllowedText = fmtNum(m);
      p.gfaAllowedIsManual = true;
    } else if(p.gfaAllowedIsManual && !p.gfaAllowedOverride && !p.gfaAllowedManual && !p.manualGfaAllowed) {
      p.gfaAllowedIsManual = false;
    }
    var lu = extractLastUpdated(p);
    if(lu) setLastUpdated(p, lu);
    return p;
  }
  function gfaAllowedLabel(p){
    applyManualGfa(p);
    if(!p || !p.gfaAllowedText) return '';
    if(p.gfaAllowedIsManual || manualValue(p) !== null) return p.gfaAllowedText + ' sqft (manual override)';
    return p.gfaAllowedText + ' sqft' + (p.gfaPct ? ' (' + p.gfaPct + '%)' : '');
  }
  function lastUpdatedLabel(p){ var v=extractLastUpdated(p); return v ? 'Last updated: ' + v : ''; }

  function addDetailsCheckbox(){
    var box = byId('detailsChecklist');
    if(!box || box.querySelector('input[data-field="lastUpdated"]')) return;
    var label = document.createElement('label');
    label.innerHTML = '<input type="checkbox" data-field="lastUpdated" checked> Last date updated';
    var comment = box.querySelector('input[data-field="comment"]');
    if(comment && comment.parentElement) comment.parentElement.insertAdjacentElement('beforebegin', label); else box.appendChild(label);
    window.detailFields = window.detailFields || {};
    if(window.detailFields.lastUpdated !== false) window.detailFields.lastUpdated = true;
  }

  function addDisplayCheckbox(){
    var grid = document.querySelector('#v3326DisplayBox .v3326-label-grid');
    if(!grid || grid.querySelector('[data-v3326-label="lastUpdated"]')) return;
    var disp = readDisplay();
    var checked = disp.labels && disp.labels.lastUpdated ? ' checked' : '';
    var lab = document.createElement('label');
    lab.innerHTML = '<input type="checkbox" data-v3326-label="lastUpdated"'+checked+'> Last updated';
    grid.appendChild(lab);
    lab.querySelector('input').addEventListener('change', function(){
      var obj = readDisplay(); obj.labels = obj.labels || {}; obj.labels.lastUpdated = !!this.checked; writeDisplay(obj);
      var sel = byId('labelMode'); if(sel) sel.value = 'custom';
      refreshLabelsAndOpenPopup();
    });
  }

  function patchLabels(){
    if(window.__v3333LabelPatched) return;
    window.__v3333LabelPatched = true;
    var previousLabelText = window.labelText;
    window.labelText = function(p){
      applyManualGfa(p);
      var obj = readDisplay();
      var labels = obj.labels || {};
      var updated = lastUpdatedLabel(p);
      if(labels.lastUpdated){
        if(getOnlyActiveLabel(labels) === 'lastUpdated') return updated;
        var base = previousLabelText ? previousLabelText(p) : '';
        return clean(base) ? (base + (updated ? '\n' + updated : '')) : updated;
      }
      return previousLabelText ? previousLabelText(p) : '';
    };
    window.updateLabels = function(){ refreshLabelsAndOpenPopup(); };
  }

  function popupRow(label, value){ return '<tr><td>'+esc(label)+'</td><td>'+esc(value)+'</td></tr>'; }
  function patchPopup(){
    if(window.__v3333PopupPatched || typeof window.popupHtml !== 'function') return;
    window.__v3333PopupPatched = true;
    var oldPopup = window.popupHtml;
    window.popupHtml = function(p){
      applyManualGfa(p);
      var html = oldPopup.apply(this, arguments) || '';
      var gfaLine = visible('gfa') ? gfaAllowedLabel(p) : '';
      if(gfaLine){
        if(/<tr><td>GFA allowed<\/td><td>[\s\S]*?<\/td><\/tr>/i.test(html)){
          html = html.replace(/<tr><td>GFA allowed<\/td><td>[\s\S]*?<\/td><\/tr>/i, popupRow('GFA allowed', gfaLine));
        } else if(html.indexOf('</table>') !== -1) {
          html = html.replace('</table>', popupRow('GFA allowed', gfaLine) + '</table>');
        }
      }
      var lu = extractLastUpdated(p);
      if(lu && visible('lastUpdated') && html.indexOf('<td>Last updated</td>') === -1){
        if(html.indexOf('</table>') !== -1) html = html.replace('</table>', popupRow('Last updated', lu) + '</table>');
      }
      return html;
    };
  }

  function rebindPopups(){
    try{
      if(Array.isArray(window.markers) && typeof window.popupHtml === 'function'){
        window.markers.forEach(function(obj){ if(obj && obj.marker && obj.point) obj.marker.bindPopup(window.popupHtml(obj.point)); });
      }
    }catch(e){}
  }
  function refreshOpenPopup(){
    try{
      if(!Array.isArray(window.markers) || typeof window.popupHtml !== 'function') return;
      window.markers.some(function(obj){
        if(obj && obj.marker && obj.marker.getPopup && obj.marker.getPopup() && obj.marker.getPopup().isOpen()){
          obj.marker.setPopupContent(window.popupHtml(obj.point));
          return true;
        }
        return false;
      });
    }catch(e){}
  }
  function refreshLabelsAndOpenPopup(){
    try{
      getPoints().forEach(applyManualGfa);
      if(Array.isArray(window.markers)){
        window.markers.forEach(function(obj){ if(obj && obj.marker && obj.marker.setTooltipContent && obj.point) obj.marker.setTooltipContent(window.labelText(obj.point)); });
      }
    }catch(e){}
    rebindPopups();
    refreshOpenPopup();
  }

  function patchDetailApply(){
    if(window.__v3333DetailPatched) return;
    window.__v3333DetailPatched = true;
    var oldApply = window.applyDetailChecklist;
    if(typeof oldApply === 'function'){
      window.applyDetailChecklist = function(){
        var r = oldApply.apply(this, arguments);
        setTimeout(refreshLabelsAndOpenPopup, 0);
        return r;
      };
    }
    document.addEventListener('change', function(e){
      if(e.target && (e.target.matches('#detailsChecklist input[data-field]') || e.target.matches('#labelMode') || e.target.matches('#v3326DisplayBox input') || e.target.matches('#v3326OfferMode'))){
        setTimeout(refreshLabelsAndOpenPopup, 0);
      }
    }, true);
  }

  function ensureEditorFields(){
    if(!isAdmin()) return;
    var anchor = byId('editGfa') || byId('editPhase');
    if(!anchor || !anchor.parentElement) return;
    if(!byId('editGfaAllowedOverride')){
      var lab = document.createElement('label');
      lab.id = 'v3333GfaOverrideLabel';
      lab.innerHTML = 'GFA allowed override <input id="editGfaAllowedOverride" type="number" step="0.01" placeholder="Manual sqft only if different">';
      anchor.parentElement.insertAdjacentElement('afterend', lab);
    }
    if(!byId('editLastUpdated')){
      var last = document.createElement('label');
      last.id = 'v3333LastUpdatedLabel';
      last.innerHTML = 'Last date updated <input id="editLastUpdated" placeholder="27/08/2026">';
      var comment = byId('editComment');
      if(comment && comment.parentElement) comment.parentElement.insertAdjacentElement('beforebegin', last);
      else anchor.parentElement.insertAdjacentElement('afterend', last);
    }
  }
  function pointByRow(row){ return getPoints().find(function(p){ return String(p.row) === String(row); }); }
  function findSavedPoint(row, gis, master, beforeRows){
    var p = null;
    if(row && String(row).indexOf('__') !== 0) p = pointByRow(row);
    if(!p && master) p = getPoints().slice().reverse().find(function(x){ return clean(x.masterPlot) === master; });
    if(!p && gis) p = getPoints().slice().reverse().find(function(x){ return clean(x.gisPlot) === gis; });
    if(!p && beforeRows) p = getPoints().slice().reverse().find(function(x){ return !beforeRows[String(x.row)]; });
    return p || null;
  }
  function fillEditorFields(p){
    ensureEditorFields();
    var g = byId('editGfaAllowedOverride'); if(g) g.value = manualValue(p) !== null ? manualValue(p) : '';
    var d = byId('editLastUpdated'); if(d) d.value = extractLastUpdated(p || {}) || '';
  }
  function refreshEditSummary(){
    var box = byId('plotEditSummary'); if(!box) return;
    var manual = numberFrom(byId('editGfaAllowedOverride') ? byId('editGfaAllowedOverride').value : '');
    var date = clean(byId('editLastUpdated') ? byId('editLastUpdated').value : '');
    var old = box.innerHTML.replace(/<div class="v3333-extra-summary"[\s\S]*?<\/div>/g,'');
    var parts = [];
    if(manual !== null) parts.push('Manual GFA allowed: <b>' + fmtNum(manual) + ' sqft</b>');
    if(date) parts.push('Last updated: <b>' + esc(date) + '</b>');
    box.innerHTML = old + (parts.length ? '<div class="v3333-extra-summary" style="margin-top:6px;color:#d6a94d">' + parts.join(' | ') + '</div>' : '');
  }
  function patchEditor(){
    if(!isAdmin() || window.__v3333EditorPatched) return;
    window.__v3333EditorPatched = true;
    ensureEditorFields();
    var oldOpen = window.openPlotEditorByRow;
    if(typeof oldOpen === 'function'){
      window.openPlotEditorByRow = function(row){ var r=oldOpen.apply(this, arguments); fillEditorFields(pointByRow(row)); refreshEditSummary(); return r; };
    }
    var oldAdd = window.openAddPlotByPA;
    if(typeof oldAdd === 'function'){
      window.openAddPlotByPA = function(label, lat, lng){ var r=oldAdd.apply(this, arguments); fillEditorFields(null); refreshEditSummary(); return r; };
    }
    var oldSave = window.savePlotEdit;
    if(typeof oldSave === 'function'){
      window.savePlotEdit = function(){
        ensureEditorFields();
        var before = {}; getPoints().forEach(function(p){ before[String(p.row)] = true; });
        var row = byId('editRowId') ? byId('editRowId').value : '';
        var gis = byId('editGisPlot') ? clean(byId('editGisPlot').value) : '';
        var master = byId('editMasterPlot') ? clean(byId('editMasterPlot').value) : '';
        var manual = numberFrom(byId('editGfaAllowedOverride') ? byId('editGfaAllowedOverride').value : '');
        var date = clean(byId('editLastUpdated') ? byId('editLastUpdated').value : '');
        var result = oldSave.apply(this, arguments);
        setTimeout(function(){
          var p = findSavedPoint(row, gis, master, before);
          if(p){
            if(manual !== null){ p.gfaAllowedOverride = manual; p.gfaAllowedManual = manual; p.manualGfaAllowed = manual; p.gfaAllowedIsManual = true; }
            else { delete p.gfaAllowedOverride; delete p.gfaAllowedManual; delete p.manualGfaAllowed; p.gfaAllowedIsManual = false; }
            setLastUpdated(p, date);
            applyManualGfa(p);
            try{ if(typeof window.publishCurrentPoints === 'function') window.publishCurrentPoints(); }catch(e){}
            try{ if(typeof window.applyFilters === 'function') window.applyFilters(); }catch(e){}
            setTimeout(refreshLabelsAndOpenPopup, 20);
          }
        }, 80);
        return result;
      };
    }
    ['editGfaAllowedOverride','editLastUpdated','editGfa','editSize'].forEach(function(id){
      var el = byId(id); if(el && !el.__v3333Listener){ el.__v3333Listener = true; el.addEventListener('input', refreshEditSummary); el.addEventListener('change', refreshEditSummary); }
    });
  }

  function patchCopyText(){
    if(window.__v3333CopyPatched || typeof window.plotDetailsText !== 'function') return;
    window.__v3333CopyPatched = true;
    var oldDetails = window.plotDetailsText;
    window.plotDetailsText = function(p){
      applyManualGfa(p);
      var txt = oldDetails.apply(this, arguments) || '';
      var lu = extractLastUpdated(p);
      if(lu && visible('lastUpdated') && txt.indexOf('Last updated:') === -1){
        txt = txt.replace('\nSource: Hayat Luxury GIS', '\nLast updated: ' + lu + '\nSource: Hayat Luxury GIS');
      }
      if((p && (p.gfaAllowedIsManual || manualValue(p) !== null)) && txt.indexOf('GFA allowed:') !== -1){
        txt = txt.replace(/GFA allowed:[^\n]*/g, 'GFA allowed: ' + gfaAllowedLabel(p));
      }
      return txt;
    };
  }

  function boot(){
    try{ getPoints().forEach(applyManualGfa); }catch(e){}
    addDetailsCheckbox();
    addDisplayCheckbox();
    patchLabels();
    patchPopup();
    patchDetailApply();
    patchEditor();
    patchCopyText();
    refreshLabelsAndOpenPopup();
    console.log(VERSION + ' loaded');
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  setTimeout(boot, 600);
  setTimeout(boot, 1600);
  window.HAYAT_V3333_REFRESH_OPEN_POPUP = refreshLabelsAndOpenPopup;
})();
