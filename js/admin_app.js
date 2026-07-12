
var colorHex = {"Red": "#e53935", "Pink": "#ff5da2", "Blue": "#1e88e5", "Black": "#111111", "Green": "#43a047", "Yellow": "#fdd835", "Orange": "#fb8c00", "": "#666666"};
var markers = [];
var selectionMode = false;
var selectedPlots = {};
var selectionMode = false;
var showSelectedOnly = false;
var currentList = points;
var baseFilteredList = points;


// === Map layer visibility controls ===
var inventoryVisibility = {Red:true, Blue:true, Pink:true, Other:true};
function colorBucket(color){
  var c = String(color || '').toLowerCase();
  if(c === 'red') return 'Red';
  if(c === 'blue') return 'Blue';
  if(c === 'pink') return 'Pink';
  return 'Other';
}
function isInventoryColorVisible(color){
  var bucket = colorBucket(color);
  return inventoryVisibility[bucket] !== false;
}
function setInventoryColorVisible(bucket, show){
  inventoryVisibility[bucket] = !!show;
  try{ localStorage.setItem('JAH_inventory_visibility', JSON.stringify(inventoryVisibility)); }catch(e){}
  addMarkers(baseFilteredList || points, false);
  if(!window.HAYAT_APPLYING_SETTINGS && typeof window.saveCurrentPublishSettings === 'function') window.saveCurrentPublishSettings();
}
function setMasterPlanVisible(show){
  if(!masterPlanOverlay) return;
  if(show){
    try{ if(!map.hasLayer(masterPlanOverlay)) masterPlanOverlay.addTo(map); }catch(e){}
  } else {
    try{ if(map.hasLayer(masterPlanOverlay)) map.removeLayer(masterPlanOverlay); }catch(e){}
  }
  try{ localStorage.setItem('JAH_show_master_plan', show ? '1':'0'); }catch(e){}
  if(!window.HAYAT_APPLYING_SETTINGS && typeof window.saveCurrentPublishSettings === 'function') window.saveCurrentPublishSettings();
}
function initMapLayerControls(){
  try{
    var publishedLayers = (location.pathname.indexOf('agent') !== -1 && window.HAYAT_ACTIVE_PUBLISHED_SETTINGS && window.HAYAT_ACTIVE_PUBLISHED_SETTINGS.layerVisibility) ? window.HAYAT_ACTIVE_PUBLISHED_SETTINGS.layerVisibility : null;
    var saved = localStorage.getItem('JAH_inventory_visibility');
    if(saved) inventoryVisibility = Object.assign(inventoryVisibility, JSON.parse(saved));
    if(publishedLayers && publishedLayers.inventoryVisibility){
      inventoryVisibility = Object.assign(inventoryVisibility, publishedLayers.inventoryVisibility);
    }
    ['Red','Blue','Pink','Other'].forEach(function(b){
      var id = b === 'Red' ? 'showRedInventory' : b === 'Blue' ? 'showBlueInventory' : b === 'Pink' ? 'showPinkInventory' : 'showOtherInventory';
      var el = document.getElementById(id); if(el) el.checked = inventoryVisibility[b] !== false;
    });
    var showMaster = localStorage.getItem('JAH_show_master_plan');
    if(publishedLayers && typeof publishedLayers.showMasterPlan === 'boolean') showMaster = publishedLayers.showMasterPlan ? '1' : '0';
    if(showMaster === '0'){
      var mp = document.getElementById('toggleMasterPlan'); if(mp) mp.checked = false;
      setMasterPlanVisible(false);
    } else {
      var mp2 = document.getElementById('toggleMasterPlan'); if(mp2) mp2.checked = true;
      setMasterPlanVisible(true);
    }
    if(publishedLayers && typeof publishedLayers.showNonInventoryPA === 'boolean'){
      window.showNonInventoryPALabels = publishedLayers.showNonInventoryPA;
      try{ localStorage.setItem('JAH_show_non_inventory_pa', publishedLayers.showNonInventoryPA ? '1':'0'); }catch(e){}
      var pa = document.getElementById('showNonInventoryPA'); if(pa) pa.checked = publishedLayers.showNonInventoryPA;
    }
  }catch(e){}
}
window.getCurrentLayerSettings = function(){
  var mp = document.getElementById('toggleMasterPlan');
  var pa = document.getElementById('showNonInventoryPA');
  return {
    inventoryVisibility: Object.assign({}, inventoryVisibility),
    showMasterPlan: mp ? !!mp.checked : true,
    showNonInventoryPA: pa ? !!pa.checked : (window.showNonInventoryPALabels !== false)
  };
};
window.applyPublishedLayerVisibility = function(layerSettings){
  if(!layerSettings || typeof layerSettings !== 'object') return;
  if(layerSettings.inventoryVisibility){
    inventoryVisibility = Object.assign(inventoryVisibility, layerSettings.inventoryVisibility);
    ['Red','Blue','Pink','Other'].forEach(function(b){
      var id = b === 'Red' ? 'showRedInventory' : b === 'Blue' ? 'showBlueInventory' : b === 'Pink' ? 'showPinkInventory' : 'showOtherInventory';
      var el = document.getElementById(id); if(el) el.checked = inventoryVisibility[b] !== false;
    });
  }
  if(typeof layerSettings.showMasterPlan === 'boolean'){
    var mp = document.getElementById('toggleMasterPlan'); if(mp) mp.checked = layerSettings.showMasterPlan;
    setMasterPlanVisible(layerSettings.showMasterPlan);
  }
  if(typeof layerSettings.showNonInventoryPA === 'boolean'){
    window.showNonInventoryPALabels = layerSettings.showNonInventoryPA;
    var pa = document.getElementById('showNonInventoryPA'); if(pa) pa.checked = layerSettings.showNonInventoryPA;
    if(typeof window.updatePALabelZoomStyles === 'function') window.updatePALabelZoomStyles();
  }
  addMarkers(baseFilteredList || points, false);
};
// === End map layer visibility controls ===


function hideFilters() {
  document.getElementById("panel").style.display = "none";
  document.getElementById("showBtn").style.display = "block";
}
function showFilters() {
  document.getElementById("panel").style.display = "block";
  document.getElementById("showBtn").style.display = "none";
}
function money(x) {
  if (x === null || x === undefined || isNaN(x)) return "";
  if (Math.abs(x) >= 1000000) return "AED " + (x/1000000).toFixed(2).replace(/\.00$/,'') + "M";
  return "AED " + Math.round(x).toLocaleString();
}
function val(id) { return document.getElementById(id).value.trim(); }
function num(id) { var v = val(id); return v === "" ? null : parseFloat(v); }
function esc(s) { return String(s === null || s === undefined ? "" : s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

var detailFieldsKey = 'HAYAT_JAH_DETAIL_FIELDS_V21';
var detailSettingsKey = (window.HAYAT_SYNC_SETTINGS_KEY || 'HAYAT_JAH_PUBLISHED_SETTINGS_V31');
var legacyDetailFieldsKey = (location.pathname.indexOf('agent') !== -1 ? 'hayatAgentDetailFields' : 'hayatAdminDetailFields');
var detailFieldDefaults = {
  masterPlot:true, agent:true, mobile:true, size:true, pricing:true, secondOffer:true,
  type:true, phase:true, gfa:true, comment:true, coordinates:true
};
var detailFields = Object.assign({}, detailFieldDefaults);
window.detailFields = detailFields;
function readJsonSafe(key){
  try { var raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; } catch(e) { return null; }
}
function getSharedDetailFields(){
  var s = readJsonSafe(detailSettingsKey);
  return (s && s.detailFields && typeof s.detailFields === 'object') ? s.detailFields : null;
}
function writeSharedDetailFields(fields){
  try {
    var s = readJsonSafe(detailSettingsKey) || {};
    s.detailFields = Object.assign({}, fields);
    s.settingsUpdated = new Date().toISOString();
    localStorage.setItem(detailSettingsKey, JSON.stringify(s));
    window.HAYAT_ACTIVE_PUBLISHED_SETTINGS = Object.assign({}, window.HAYAT_ACTIVE_PUBLISHED_SETTINGS || {}, s);
  } catch(e) {}
}
function collectDetailFieldsFromChecklist(){
  document.querySelectorAll('#detailsChecklist input[data-field]').forEach(function(cb){
    // Do not ignore disabled checkboxes here; disabled agent fields still represent Admin visibility.
    detailFields[cb.getAttribute('data-field')] = !!cb.checked;
  });
  window.detailFields = detailFields;
  return Object.assign({}, detailFields);
}
window.getCurrentDetailFields = function(){ return collectDetailFieldsFromChecklist(); };
function getPublishedDetailPermissions(){
  // Prefer the active settings chosen by sync_core. Fall back to the file settings.
  var active = window.HAYAT_ACTIVE_PUBLISHED_SETTINGS || {};
  if (active && active.detailFields && typeof active.detailFields === 'object') return active.detailFields;
  var s = window.HAYAT_PUBLISHED_SETTINGS || {};
  return (s && s.detailFields && typeof s.detailFields === 'object') ? s.detailFields : null;
}
function loadDetailFields(){
  // Correct priority:
  // defaults < published file < old legacy key < direct shared key < current shared settings.
  // Legacy keys used to reset Agent/Admin to all checked, so they must NOT override current shared settings.
  detailFields = Object.assign({}, detailFieldDefaults);
  var published = getPublishedDetailPermissions();
  if (published) detailFields = Object.assign({}, detailFields, published);
  var legacy = readJsonSafe(legacyDetailFieldsKey);
  if (legacy) detailFields = Object.assign({}, detailFields, legacy);
  var direct = readJsonSafe(detailFieldsKey);
  if (direct) detailFields = Object.assign({}, detailFields, direct);
  var shared = getSharedDetailFields();
  if (shared) detailFields = Object.assign({}, detailFields, shared);

  document.querySelectorAll('#detailsChecklist input[data-field]').forEach(function(cb){
    var k = cb.getAttribute('data-field');
    cb.checked = detailFields[k] !== false;
    cb.disabled = false;
    cb.onchange = function(){ applyDetailChecklist(); };
    if (cb.parentElement) cb.parentElement.style.opacity = '1';
    if (cb.parentElement) cb.parentElement.title = '';
  });
  window.detailFields = detailFields;
  return Object.assign({}, detailFields);
}
window.loadDetailFields = loadDetailFields;
function isDetailVisible(k){ return detailFields[k] !== false; }
function applyDetailChecklist(){
  collectDetailFieldsFromChecklist();
  try {
    localStorage.setItem(detailFieldsKey, JSON.stringify(detailFields));
    localStorage.setItem(legacyDetailFieldsKey, JSON.stringify(detailFields));
    writeSharedDetailFields(detailFields);
  } catch(e) {}
  if (typeof markers !== 'undefined' && markers) markers.forEach(function(obj){ obj.marker.bindPopup(popupHtml(obj.point)); });
  if(!window.HAYAT_APPLYING_SETTINGS && typeof window.saveCurrentPublishSettings === 'function') window.saveCurrentPublishSettings();
}
window.applyPublishedFieldVisibility = function(){
  loadDetailFields();
  if (typeof markers !== 'undefined' && markers) markers.forEach(function(obj){ obj.marker.bindPopup(popupHtml(obj.point)); });
};
function copyToClipboardSilent(text, label){
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).catch(function(){ prompt(label || 'Copy:', text); });
  } else {
    prompt(label || 'Copy:', text);
  }
}
function plotDetailsText(p){
  var lines = [];
  lines.push('Jebel Ali Hills');
  lines.push('Plot: ' + (p.gisPlot || ''));
  if(isDetailVisible('masterPlot') && p.masterPlot) lines.push('PA Plot: ' + p.masterPlot);
  if(isDetailVisible('type') && p.type) lines.push('Type: ' + p.type);
  if(isDetailVisible('gfa') && p.gfa) lines.push('GFA: ' + p.gfa);
  if(isDetailVisible('size') && p.sizeText) lines.push('Area: ' + p.sizeText + ' sqft');
  if(isDetailVisible('pricing') && p.priceText) lines.push('Price/sqft: AED ' + p.priceText);
  if(isDetailVisible('pricing') && p.total) lines.push('Total Price: ' + money(p.total));
  if(isDetailVisible('phase') && p.phase) lines.push('Phase: ' + p.phase);
  if(isDetailVisible('comment') && p.comment) lines.push('Note: ' + p.comment);
  lines.push('');
  lines.push('Source: Hayat Luxury GIS');
  return lines.join('\n');
}
function plotDescriptionText(p){
  var type = p.type ? p.type : 'residential plot';
  var area = (isDetailVisible('size') && p.sizeText) ? ' with approximately ' + p.sizeText + ' sqft of land' : '';
  var gfa = (isDetailVisible('gfa') && p.gfa) ? ' and ' + p.gfa + ' permission' : '';
  var priceSqft = (isDetailVisible('pricing') && p.priceText) ? ' The plot is offered at AED ' + p.priceText + ' per sqft' : '';
  var total = (isDetailVisible('pricing') && p.total) ? ', with a total asking price of ' + money(p.total) + '.' : '.';
  var pa = (isDetailVisible('masterPlot') && p.masterPlot) ? ' Master plan reference: ' + p.masterPlot + '.' : '';
  var phase = (isDetailVisible('phase') && p.phase) ? ' Located in Phase ' + p.phase + '.' : '';
  var status = p.color ? ' Current status: ' + p.color + '.' : '';
  var lines = [];
  lines.push('Premium ' + type + ' opportunity in Jebel Ali Hills' + area + gfa + '. This plot is suitable for buyers looking to secure land in one of Dubai’s developing villa communities.' + priceSqft + total);
  lines.push(pa + phase + status);
  lines.push('For more information, contact Hayat Luxury Properties.');
  return lines.filter(function(x){ return String(x).trim(); }).join('\n\n');
}
function copyPlotDetails(gisPlot){
  var p = (points || []).find(function(x){ return String(x.gisPlot) === String(gisPlot); });
  if(!p) return;
  copyToClipboardSilent(plotDetailsText(p), 'Copy details:');
}
function copyPlotDescription(gisPlot){
  var p = (points || []).find(function(x){ return String(x.gisPlot) === String(gisPlot); });
  if(!p) return;
  copyToClipboardSilent(plotDescriptionText(p), 'Copy description:');
}


function getPlotByRow(row){
  return (points || []).find(function(x){ return String(x.row) === String(row); });
}
function copyPlotDetailsByRow(row){
  var p = getPlotByRow(row);
  if(!p){ return; }
  copyToClipboardSilent(plotDetailsText(p), 'Copy details:');
}
function copyPlotDescriptionByRow(row){
  var p = getPlotByRow(row);
  if(!p){ return; }
  copyToClipboardSilent(plotDescriptionText(p), 'Copy description:');
}

function selectedList(){
  return (points || []).filter(function(p){ return selectedPlots[String(p.gisPlot)]; });
}
function toggleSelectionMode(){
  setSelectionMode(!selectionMode);
}
function togglePlotSelection(gisPlot){
  var key = String(gisPlot || '');
  if(!key) return;
  if(selectedPlots[key]) delete selectedPlots[key]; else selectedPlots[key] = true;
  if(showSelectedOnly){
    var remaining = selectedList();
    if(!remaining.length){ setShowSelectedOnly(false); addMarkers(baseFilteredList || points, false); }
    else { addMarkers(remaining, false); }
  } else {
    refreshSelectionStyles();
    updateSelectionPanel();
  }
}
function setSelectionMode(on){
  selectionMode = !!on;
  var btn = document.getElementById('selectionModeBtn');
  if(btn){
    btn.textContent = selectionMode ? 'Selection Mode ON' : 'Select Plots';
    btn.classList.toggle('selection-on', selectionMode);
  }
}
function setShowSelectedOnly(on){
  showSelectedOnly = !!on;
  var btn = document.getElementById('showSelectedBtn');
  if(btn){
    btn.textContent = showSelectedOnly ? 'Showing Selected' : 'Show Selected Only';
    btn.classList.toggle('selection-on', showSelectedOnly);
  }
}
function toggleShowSelectedOnly(){
  var list = selectedList();
  if(!showSelectedOnly && !list.length){ alert('Select at least one plot first'); return; }
  setShowSelectedOnly(!showSelectedOnly);
  addMarkers(showSelectedOnly ? selectedList() : baseFilteredList, true);
}
function clearSelection(){
  selectedPlots = {};
  setSelectionMode(false);
  setShowSelectedOnly(false);
  addMarkers(baseFilteredList || points, false);
  refreshSelectionStyles();
  updateSelectionPanel();
}
function refreshSelectionStyles(){
  markers.forEach(function(obj){
    var selected = !!selectedPlots[String(obj.point.gisPlot)];
    var base = colorHex[obj.point.color] || '#666';
    obj.marker.setStyle({
      radius: selected ? 11 : 7,
      color: selected ? '#CEA350' : '#fff',
      weight: selected ? 4 : 1.5,
      fillColor: base,
      fillOpacity: selected ? 1 : .92
    });
  });
}
function updateSelectionPanel(){
  var el = document.getElementById('selectionStats');
  if(!el) return;
  var list = selectedList();
  if(!list.length){ el.innerHTML = 'No plots selected.'; return; }
  var area = list.reduce(function(s,p){ return s + (p.size || 0); },0);
  var value = list.reduce(function(s,p){ return s + (p.total || 0); },0);
  var priced = list.filter(function(p){ return p.total; }).length;
  el.innerHTML = '<b>' + list.length + '</b> plots selected<br>' +
    'Total area: <b>' + Math.round(area).toLocaleString() + ' sqft</b><br>' +
    'Priced plots: <b>' + priced + '</b>' +
    (value ? '<br>Total value: <b>' + money(value) + '</b>' : '');
}
function copySelectedDetails(){
  var list = selectedList();
  if(!list.length){ alert('No plots selected'); return; }
  var lines = ['Jebel Ali Hills - Selected Plots', ''];
  list.forEach(function(p, i){
    lines.push((i+1) + '. Plot ' + (p.gisPlot || ''));
    if(p.masterPlot && isDetailVisible('masterPlot')) lines.push('   PA: ' + p.masterPlot);
    if(p.type && isDetailVisible('type')) lines.push('   Type: ' + p.type);
    if(p.sizeText && isDetailVisible('size')) lines.push('   Area: ' + p.sizeText + ' sqft');
    if(p.priceText && isDetailVisible('pricing')) lines.push('   Price/sqft: AED ' + p.priceText);
    if(p.total && isDetailVisible('pricing')) lines.push('   Total: ' + money(p.total));
    lines.push('');
  });
  lines.push('Source: Hayat Luxury GIS');
  var text = lines.join('\n'); copyToClipboardSilent(text, 'Copy selected plots:');
}
function copySelectedDescription(){
  var list = selectedList();
  if(!list.length){ alert('No plots selected'); return; }
  var count = list.length;
  var area = list.reduce(function(s,p){ return s + (p.size || 0); },0);
  var value = list.reduce(function(s,p){ return s + (p.total || 0); },0);
  var types = Array.from(new Set(list.map(function(p){ return p.type; }).filter(Boolean))).slice(0,3).join(', ');
  var lines = [];
  lines.push('A curated selection of ' + count + ' Jebel Ali Hills plot' + (count > 1 ? 's' : '') + (types ? ' including ' + types : '') + (area ? ', with a combined land area of approximately ' + Math.round(area).toLocaleString() + ' sqft' : '') + '.');
  if(value && isDetailVisible('pricing')) lines.push('Combined asking value: ' + money(value) + '.');
  var pricedArea = list.reduce(function(s,p){ return s + ((p.total && p.size) ? p.size : 0); },0);
  if(value && pricedArea && isDetailVisible('pricing')) lines.push('Average price per sqft: AED ' + Math.round(value / pricedArea).toLocaleString() + '.');
  var gfas = Array.from(new Set(list.map(function(p){ return p.gfa; }).filter(Boolean))).join(', ');
  if(gfas && isDetailVisible('gfa')) lines.push('GFA: ' + gfas + '.');
  lines.push('This selection is suitable for buyers looking for land opportunities in one of Dubai’s developing villa communities.');
  lines.push('For more information, contact Hayat Luxury Properties.');
  var text = lines.join('\n\n');
  copyToClipboardSilent(text, 'Copy selected description:');
}

function row(label, value) {
  if (value === null || value === undefined || value === "") return "";
  return "<tr><td>" + esc(label) + "</td><td>" + value + "</td></tr>";
}
function priceBlock(prefix, priceText, total, deposit, commission) {
  var hasAny = (priceText !== null && priceText !== undefined && priceText !== "") || (total !== null && total !== undefined && !isNaN(total));
  if (!hasAny) return "";
  var title = prefix ? "<tr><td colspan='2' style='background:#f6f6f6;font-weight:bold'>" + esc(prefix) + "</td></tr>" : "";
  return title +
    row("Price/sqft", priceText ? "AED " + esc(priceText) : "") +
    row("Total", total !== null && total !== undefined && !isNaN(total) ? money(total) : "") +
    row("Deposit cheque 10%", deposit !== null && deposit !== undefined && !isNaN(deposit) ? money(deposit) : "") +
    row("Company commission 2%", commission !== null && commission !== undefined && !isNaN(commission) ? money(commission) : "");
}
function masterPlanLabel(p) {
  var raw = String((p && p.masterPlot) || "").trim();
  if (!raw) return (p && p.gisPlot) || "";
  // Keep the familiar master plan format: PA8_120, PA10_269, etc.
  // If Excel contains PA6_12, display it as PA6_012 to match the master plan style.
  var m = raw.match(/^(PA\d+)[_\-]?(\d+)$/i);
  if (m) return m[1].toUpperCase() + "_" + m[2].padStart(3, "0");
  return raw.toUpperCase().replace(/-/g, "_");
}
function labelText(p) {
  var mode = val("labelMode") || "masterPlot";
  if (mode === "gisPlot") return p.gisPlot || "";
  if (mode === "masterPlot") return masterPlanLabel(p);
  if (mode === "price") return p.price ? "AED " + p.priceText : "";
  if (mode === "total") return p.total ? money(p.total) : "";
  if (mode === "size") return p.sizeText ? p.sizeText + " sqft" : "";
  if (mode === "agent") return p.agent || p.secondAgent || "";
  if (mode === "gfa") return p.gfa || "";
  if (mode === "phase") return p.phase || "";
  return p.gisPlot || "";
}
function popupHtml(p) {
  var s = "<div class='popup-title'>GIS Plot " + esc(p.gisPlot) + "</div><table class='popup-table'>";
  if (isDetailVisible("masterPlot")) s += row("Master Plan Plot", esc(masterPlanLabel(p)));
  if (isDetailVisible("agent")) s += row("Agent", esc(p.agent || ""));
  if (isDetailVisible("mobile")) s += row("Mobile", esc(p.mobile || ""));
  if (isDetailVisible("size")) s += row("Size", p.sizeText ? esc(p.sizeText) + " sqft" : "");
  if (isDetailVisible("pricing")) s += priceBlock("", p.priceText, p.total, p.deposit, p.commission);
  if (isDetailVisible("secondOffer") && (p.secondAgent || p.secondPriceText || p.secondMobile)) {
    s += "<tr><td colspan='2' style='background:#f9f7ef;font-weight:bold'>Additional agent / offer</td></tr>";
    if (isDetailVisible("agent")) s += row("Second agent", esc(p.secondAgent || ""));
    if (isDetailVisible("mobile")) s += row("Second mobile", esc(p.secondMobile || ""));
    if (isDetailVisible("pricing")) s += priceBlock("", p.secondPriceText, p.secondTotal, p.secondDeposit, p.secondCommission);
  }
  if (isDetailVisible("type")) s += row("Type", esc(p.type || ""));
  if (isDetailVisible("phase")) s += row("Phase", esc(p.phase || ""));
  if (isDetailVisible("gfa")) {
    s += row("GFA", esc(p.gfa || ""));
    s += row("GFA allowed", p.gfaAllowed ? Math.round(p.gfaAllowed).toLocaleString() + " sqft" + (p.gfaPct ? " (" + p.gfaPct + "%)" : "") : "");
  }
  if (isDetailVisible("comment") && p.comment) s += row("Comment", esc(p.comment));
  if (isDetailVisible("coordinates")) s += "<tr><td>Coordinates</td><td><a target='_blank' href='" + p.mapsUrl + "'>" + esc(p.coords || "") + "</a></td></tr>";
  s += "</table><div class=\'copy-actions\'><button onclick=\'copyPlotDetailsByRow(" + Number(p.row || 0) + ")\'>Copy Details</button><button onclick=\'copyPlotDescriptionByRow(" + Number(p.row || 0) + ")\'>Copy Description</button></div>";
  return s;
}
function labelClass(color) {
  var c = (color || "").toLowerCase();
  if (["red","pink","blue","black","green","yellow","orange"].includes(c)) return "lbl lbl-" + c;
  return "lbl lbl-default";
}
function ensureInventoryPane(){
  try{
    if(!map.getPane('inventoryPane')){
      map.createPane('inventoryPane');
      map.getPane('inventoryPane').style.zIndex = 620;
      map.getPane('inventoryPane').style.pointerEvents = 'auto';
    }
  }catch(e){}
}
function addMarkers(list, doFit=true) {
  markers.forEach(function(obj) { map.removeLayer(obj.marker); });
  markers = [];
  var bounds = [];
  ensureInventoryPane();
  list = (list || []).filter(function(p){ return isInventoryColorVisible(p.color); });
  list.forEach(function(p) {
    var c = colorHex[p.color] || "#666";
    var marker = L.circleMarker([p.lat, p.lon], {
      radius: 7, color:"#fff", weight:1.5, fillColor:c, fillOpacity:.92, pane:'inventoryPane'
    }).addTo(map);
    marker.bindTooltip(labelText(p), {permanent:true, direction:"top", className:labelClass(p.color), offset:[0,-8]});
    marker.bindPopup(popupHtml(p));
    marker.on('click', function(e){
      if(selectionMode){
        togglePlotSelection(p.gisPlot);
        marker.closePopup();
        if(e && e.originalEvent) L.DomEvent.stop(e.originalEvent);
      }
    });
    markers.push({marker: marker, point: p});
    bounds.push([p.lat, p.lon]);
  });
  currentList = list;
  refreshSelectionStyles();
  updateSelectionPanel();
  updateStats(list);
  if (doFit && bounds.length) map.fitBounds(bounds, {padding:[80,80]});
}
function updateLabels() {
  markers.forEach(function(obj) { obj.marker.setTooltipContent(labelText(obj.point)); });
}
function updateStats(list) {
  var priced = list.filter(p => p.price || p.secondPrice).length;
  var totalValue = list.reduce((s,p) => s + (p.total || 0), 0);
  var txt = "<b>" + list.length + "</b> plots shown<br>" +
            "Priced: <b>" + priced + "</b> | Unpriced: <b>" + (list.length-priced) + "</b>";
  if (totalValue > 0) txt += "<br>Total priced value: <b>" + money(totalValue) + "</b>";
  document.getElementById("count").innerHTML = txt;
}
function applyFilters() {
  var search = val("search").toLowerCase();
  var agent = val("agent"), color = val("color"), type = val("type"), phase = val("phase"), gfa = val("gfa");
  var minSize = num("minSize"), maxSize = num("maxSize"), minPrice = num("minPrice"), maxPrice = num("maxPrice");
  var priced = val("priced");
  var filtered = points.filter(function(p) {
    if (search && !((p.gisPlot||"").toLowerCase().includes(search) || (p.masterPlot||"").toLowerCase().includes(search) || (p.agent||"").toLowerCase().includes(search) || (p.mobile||"").toLowerCase().includes(search) || (p.secondAgent||"").toLowerCase().includes(search) || (p.secondMobile||"").toLowerCase().includes(search))) return false;
    if (agent && p.agent !== agent && p.secondAgent !== agent) return false;
    if (color && p.color !== color) return false;
    if (type && p.type !== type) return false;
    if (phase && p.phase !== phase) return false;
    if (gfa && p.gfa !== gfa) return false;
    if (minSize !== null && (!p.size || p.size < minSize)) return false;
    if (maxSize !== null && (!p.size || p.size > maxSize)) return false;
    if (minPrice !== null && (!p.price || p.price < minPrice) && (!p.secondPrice || p.secondPrice < minPrice)) return false;
    if (maxPrice !== null && (!p.price || p.price > maxPrice) && (!p.secondPrice || p.secondPrice > maxPrice)) return false;
    if (priced === "priced" && !p.price && !p.secondPrice) return false;
    if (priced === "unpriced" && (p.price || p.secondPrice)) return false;
    return true;
  });
  baseFilteredList = filtered;
  if(showSelectedOnly){ setShowSelectedOnly(false); }
  addMarkers(filtered);
}
function resetFilters() {
  ["search","agent","color","type","phase","gfa","minSize","maxSize","minPrice","maxPrice","priced"].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.value = "";
  });
  loadDetailFields();
  baseFilteredList = points;
  setShowSelectedOnly(false);
  initMapLayerControls();
  addMarkers(points);
}
function normalizeHeaderKey(k) {
  return String(k || "").trim().toLowerCase();
}
function getCell(row, names) {
  var map = {};
  Object.keys(row).forEach(function(k){ map[normalizeHeaderKey(k)] = row[k]; });
  for (var i=0; i<names.length; i++) {
    var key = normalizeHeaderKey(names[i]);
    if (map[key] !== undefined && map[key] !== null && String(map[key]).trim() !== "") return String(map[key]).trim();
  }
  return "";
}
function dmsToDecimalBrowser(dms) {
  var m = String(dms || "").trim().match(/(\d+)°(\d+)'([\d.]+)"([NSEW])/);
  if (!m) return null;
  var val = Number(m[1]) + Number(m[2]) / 60 + Number(m[3]) / 3600;
  if (m[4] === "S" || m[4] === "W") val = -val;
  return val;
}
function parseCoordsBrowser(text) {
  var m = String(text || "").match(/(\d+°\d+'[\d.]+"[NS])\s+(\d+°\d+'[\d.]+"[EW])/);
  if (!m) return null;
  return {lat: dmsToDecimalBrowser(m[1]), lon: dmsToDecimalBrowser(m[2])};
}
function asNumber(v) {
  var s = String(v || "").replace(/,/g, "").trim();
  if (!s) return null;
  var n = Number(s);
  return isNaN(n) ? null : n;
}
function fmtNumberBrowser(x) {
  if (x === null || x === undefined || isNaN(x)) return "";
  return Number(x).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2});
}
function fmtPriceBrowser(x) {
  if (x === null || x === undefined || isNaN(x)) return "";
  return Math.round(Number(x)).toLocaleString();
}
function gfaPctBrowser(gfa) {
  var g = String(gfa || "").toUpperCase().replace(/\s/g, "");
  if (g.indexOf("G+4") !== -1) return 2.20;
  if (g.indexOf("G+1") !== -1) return 0.65;
  return null;
}
function colorTitle(s) {
  s = String(s || "").trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
}
function pointFromExcelRow(row, idx) {
  var gisPlot = getCell(row, ["GIS plot number", "plot number", "plot"]);
  var masterPlot = getCell(row, ["Master Plan Plot", "master plan plot", "pa plot"]);
  var coordsText = getCell(row, ["coordinates", "coordinate"]);
  var coords = parseCoordsBrowser(coordsText);
  if (!gisPlot || !coords) return null;

  var size = asNumber(getCell(row, ["Size", "size"]));
  var price = asNumber(getCell(row, ["price per sqrf", "price per sqft", "price/sqft", "price"]));
  var secondPrice = asNumber(getCell(row, ["Second Price", "second price"]));

  var total = (size !== null && price !== null) ? size * price : null;
  var deposit = total !== null ? total * 0.10 : null;
  var commission = total !== null ? total * 0.02 : null;

  var secondTotal = (size !== null && secondPrice !== null) ? size * secondPrice : null;
  var secondDeposit = secondTotal !== null ? secondTotal * 0.10 : null;
  var secondCommission = secondTotal !== null ? secondTotal * 0.02 : null;

  var gfa = getCell(row, ["GFA", "gfa"]);
  var pct = gfaPctBrowser(gfa);
  var gfaAllowed = (size !== null && pct !== null) ? size * pct : null;

  var color = colorTitle(getCell(row, ["color"]));
  var secondColor = colorTitle(getCell(row, ["second color"]));
  var displayColor = color || secondColor || "Red";

  return {
    row: idx + 2,
    gisPlot: String(gisPlot),
    masterPlot: String(masterPlot || ""),
    lat: coords.lat,
    lon: coords.lon,
    coords: coordsText,
    mapsUrl: "https://www.google.com/maps?q=" + coords.lat + "," + coords.lon,
    agent: getCell(row, ["agent name", "agent"]),
    mobile: getCell(row, ["Mobile", "mobile"]),
    size: size,
    sizeText: size !== null ? fmtNumberBrowser(size) : "",
    price: price,
    priceText: fmtPriceBrowser(price),
    total: total,
    totalText: fmtPriceBrowser(total),
    deposit: deposit,
    depositText: fmtPriceBrowser(deposit),
    commission: commission,
    commissionText: fmtPriceBrowser(commission),
    color: displayColor,
    type: (window.HayatDataNormalize ? window.HayatDataNormalize.normalizeType(getCell(row, ["type"])) : getCell(row, ["type"])),
    phase: getCell(row, ["Phase", "phase"]),
    gfa: gfa,
    gfaPct: pct !== null ? Math.round(pct * 100) : null,
    gfaAllowed: gfaAllowed,
    gfaAllowedText: gfaAllowed !== null ? fmtNumberBrowser(gfaAllowed) : "",
    secondAgent: getCell(row, ["second agent name", "second agent"]),
    secondMobile: getCell(row, ["Second agent number", "second mobile", "second agent mobile"]),
    secondPrice: secondPrice,
    secondPriceText: fmtPriceBrowser(secondPrice),
    secondTotal: secondTotal,
    secondTotalText: fmtPriceBrowser(secondTotal),
    secondDeposit: secondDeposit,
    secondDepositText: fmtPriceBrowser(secondDeposit),
    secondCommission: secondCommission,
    secondCommissionText: fmtPriceBrowser(secondCommission),
    secondColor: secondColor,
    comment: getCell(row, ["comment", "comments", "note", "notes"])
  };
}
function setSelectOptions(id, values, firstText) {
  var sel = document.getElementById(id);
  if (!sel) return;
  var current = sel.value;
  sel.innerHTML = '<option value="">' + firstText + '</option>' + values.map(function(v){
    return '<option value="' + esc(v) + '">' + esc(v) + '</option>';
  }).join('');
  if (values.indexOf(current) !== -1) sel.value = current;
}
function refreshFilterOptionsFromPoints() {
  var agents = [], colors = [], types = [], phases = [], gfas = [];
  function add(arr, v){ if (v && arr.indexOf(v) === -1) arr.push(v); }
  points.forEach(function(p){
    add(agents, p.agent); add(agents, p.secondAgent);
    add(colors, p.color); add(types, p.type); add(phases, p.phase); add(gfas, p.gfa);
  });
  agents.sort(); colors.sort(); types.sort(); phases.sort(); gfas.sort();
  setSelectOptions("agent", agents, "All agents");
  setSelectOptions("color", colors, "All statuses");
  setSelectOptions("type", types, "All types");
  setSelectOptions("phase", phases, "All phases");
  setSelectOptions("gfa", gfas, "All GFA");
}
function uploadExcelFile(event) {
  var file = event.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    try {
      var data = new Uint8Array(e.target.result);
      var workbook = XLSX.read(data, {type: "array"});
      var sheet = workbook.Sheets[workbook.SheetNames[0]];
      var rows = XLSX.utils.sheet_to_json(sheet, {defval: ""});
      var newPoints = [];
      rows.forEach(function(row, idx) {
        var p = pointFromExcelRow(row, idx);
        if (p) newPoints.push(p);
      });
      if (!newPoints.length) {
        alert("No valid rows found. Please check GIS plot number and coordinates.");
        return;
      }
      points = newPoints;
      refreshFilterOptionsFromPoints();
      resetFilters();
      alert("Excel loaded: " + points.length + " valid plots.");
    } catch(err) {
      alert("Could not read Excel file: " + err.message);
    }
  };
  reader.readAsArrayBuffer(file);
}
function exportAgentVersion() {
  var doc = document.documentElement.cloneNode(true);

  // Remove admin/editing controls.
  doc.querySelectorAll('[data-admin="true"]').forEach(function(el){ el.remove(); });
  var upload = doc.querySelector('#excelUpload');
  if (upload) upload.remove();

  var htmlText = "<!doctype html>\n" + doc.outerHTML;

  // Freeze current point data inside exported file.
  htmlText = htmlText.replace(/var points = \[[\s\S]*?\];\nvar colorHex =/, "var points = " + JSON.stringify(points) + ";\nvar colorHex =");

  // Freeze current overlay alignment and prevent agent version from loading admin saved browser alignment.
  htmlText = htmlText.replace(/var overlayCorners = JSON\.parse\(localStorage\.getItem\("JAH_overlay_corners_v31"\)[\s\S]*?JSON\.parse\(JSON\.stringify\(originalCorners\)\);/, 
    "var overlayCorners = " + JSON.stringify(overlayCorners) + ";");

  // Remove admin-only function bodies from being visible/usable, but harmless if left.
  htmlText = htmlText.replace(/<title>Jebel Ali Hills Inventory Map<\/title>/, "<title>Jebel Ali Hills Agent Map</title>");

  var blob = new Blob([htmlText], {type: "text/html;charset=utf-8"});
  var a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "Jebel_Ali_Hills_AGENT_VERSION.html";
  document.body.appendChild(a);
  a.click();
  setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

loadDetailFields();
initMapLayerControls();
addMarkers(points);
function offsetLatLng(pt, eastMeters, northMeters) {
  var lat = pt[0], lon = pt[1];
  var newLat = lat + northMeters / 111320;
  var newLon = lon + eastMeters / (111320 * Math.cos(lat * Math.PI / 180));
  return [newLat, newLon];
}
function shiftOverlay(eastMeters, northMeters) {
  overlayCorners.tl = offsetLatLng(overlayCorners.tl, eastMeters, northMeters);
  overlayCorners.tr = offsetLatLng(overlayCorners.tr, eastMeters, northMeters);
  overlayCorners.bl = offsetLatLng(overlayCorners.bl, eastMeters, northMeters);
  makeOverlay();
}
function scaleOverlay(factor) {
  var center = [(overlayCorners.tl[0]+overlayCorners.tr[0]+overlayCorners.bl[0])/3, (overlayCorners.tl[1]+overlayCorners.tr[1]+overlayCorners.bl[1])/3];
  ["tl","tr","bl"].forEach(function(k) {
    overlayCorners[k] = [
      center[0] + (overlayCorners[k][0]-center[0])*factor,
      center[1] + (overlayCorners[k][1]-center[1])*factor
    ];
  });
  makeOverlay();
}
function setOverlayOpacity(v) {
  var n = Number(v);
  if(isNaN(n) || n < 0 || n > 100) return;
  if (typeof overlayOpacity !== 'undefined') overlayOpacity = n;
  try { localStorage.setItem("JAH_overlay_opacity_v31", String(n)); } catch(e) {}
  if (masterPlanOverlay) masterPlanOverlay.setOpacity(n/100);
  if(!window.HAYAT_APPLYING_SETTINGS && typeof window.saveCurrentPublishSettings === 'function') window.saveCurrentPublishSettings();
}
function saveAlignment() {
  localStorage.setItem("JAH_overlay_corners_v31", JSON.stringify(overlayCorners));
  if(!window.HAYAT_APPLYING_SETTINGS && typeof window.saveCurrentPublishSettings === 'function') window.saveCurrentPublishSettings();
  alert("Alignment saved in this browser.");
}
function resetAlignment() {
  overlayCorners = JSON.parse(JSON.stringify(originalCorners));
  localStorage.removeItem("JAH_overlay_corners_v31");
  makeOverlay();
  if(!window.HAYAT_APPLYING_SETTINGS && typeof window.saveCurrentPublishSettings === 'function') window.saveCurrentPublishSettings();
}

function normalizeHeaderKey(k) {
  return String(k || "").trim().toLowerCase();
}
function getCell(row, names) {
  var map = {};
  Object.keys(row).forEach(function(k){ map[normalizeHeaderKey(k)] = row[k]; });
  for (var i=0; i<names.length; i++) {
    var key = normalizeHeaderKey(names[i]);
    if (map[key] !== undefined && map[key] !== null && String(map[key]).trim() !== "") return String(map[key]).trim();
  }
  return "";
}
function dmsToDecimalBrowser(dms) {
  var m = String(dms || "").trim().match(/(\d+)°(\d+)'([\d.]+)"([NSEW])/);
  if (!m) return null;
  var val = Number(m[1]) + Number(m[2]) / 60 + Number(m[3]) / 3600;
  if (m[4] === "S" || m[4] === "W") val = -val;
  return val;
}
function parseCoordsBrowser(text) {
  var m = String(text || "").match(/(\d+°\d+'[\d.]+"[NS])\s+(\d+°\d+'[\d.]+"[EW])/);
  if (!m) return null;
  return {lat: dmsToDecimalBrowser(m[1]), lon: dmsToDecimalBrowser(m[2])};
}
function asNumber(v) {
  var s = String(v || "").replace(/,/g, "").trim();
  if (!s) return null;
  var n = Number(s);
  return isNaN(n) ? null : n;
}
function fmtNumberBrowser(x) {
  if (x === null || x === undefined || isNaN(x)) return "";
  return Number(x).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2});
}
function fmtPriceBrowser(x) {
  if (x === null || x === undefined || isNaN(x)) return "";
  return Math.round(Number(x)).toLocaleString();
}
function gfaPctBrowser(gfa) {
  var g = String(gfa || "").toUpperCase().replace(/\s/g, "");
  if (g.indexOf("G+4") !== -1) return 2.20;
  if (g.indexOf("G+1") !== -1) return 0.65;
  return null;
}
function colorTitle(s) {
  s = String(s || "").trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
}
function pointFromExcelRow(row, idx) {
  var gisPlot = getCell(row, ["GIS plot number", "plot number", "plot"]);
  var masterPlot = getCell(row, ["Master Plan Plot", "master plan plot", "pa plot"]);
  var coordsText = getCell(row, ["coordinates", "coordinate"]);
  var coords = parseCoordsBrowser(coordsText);
  if (!gisPlot || !coords) return null;

  var size = asNumber(getCell(row, ["Size", "size"]));
  var price = asNumber(getCell(row, ["price per sqrf", "price per sqft", "price/sqft", "price"]));
  var secondPrice = asNumber(getCell(row, ["Second Price", "second price"]));

  var total = (size !== null && price !== null) ? size * price : null;
  var deposit = total !== null ? total * 0.10 : null;
  var commission = total !== null ? total * 0.02 : null;

  var secondTotal = (size !== null && secondPrice !== null) ? size * secondPrice : null;
  var secondDeposit = secondTotal !== null ? secondTotal * 0.10 : null;
  var secondCommission = secondTotal !== null ? secondTotal * 0.02 : null;

  var gfa = getCell(row, ["GFA", "gfa"]);
  var pct = gfaPctBrowser(gfa);
  var gfaAllowed = (size !== null && pct !== null) ? size * pct : null;

  var color = colorTitle(getCell(row, ["color"]));
  var secondColor = colorTitle(getCell(row, ["second color"]));
  var displayColor = color || secondColor || "Red";

  return {
    row: idx + 2,
    gisPlot: String(gisPlot),
    masterPlot: String(masterPlot || ""),
    lat: coords.lat,
    lon: coords.lon,
    coords: coordsText,
    mapsUrl: "https://www.google.com/maps?q=" + coords.lat + "," + coords.lon,
    agent: getCell(row, ["agent name", "agent"]),
    mobile: getCell(row, ["Mobile", "mobile"]),
    size: size,
    sizeText: size !== null ? fmtNumberBrowser(size) : "",
    price: price,
    priceText: fmtPriceBrowser(price),
    total: total,
    totalText: fmtPriceBrowser(total),
    deposit: deposit,
    depositText: fmtPriceBrowser(deposit),
    commission: commission,
    commissionText: fmtPriceBrowser(commission),
    color: displayColor,
    type: (window.HayatDataNormalize ? window.HayatDataNormalize.normalizeType(getCell(row, ["type"])) : getCell(row, ["type"])),
    phase: getCell(row, ["Phase", "phase"]),
    gfa: gfa,
    gfaPct: pct !== null ? Math.round(pct * 100) : null,
    gfaAllowed: gfaAllowed,
    gfaAllowedText: gfaAllowed !== null ? fmtNumberBrowser(gfaAllowed) : "",
    secondAgent: getCell(row, ["second agent name", "second agent"]),
    secondMobile: getCell(row, ["Second agent number", "second mobile", "second agent mobile"]),
    secondPrice: secondPrice,
    secondPriceText: fmtPriceBrowser(secondPrice),
    secondTotal: secondTotal,
    secondTotalText: fmtPriceBrowser(secondTotal),
    secondDeposit: secondDeposit,
    secondDepositText: fmtPriceBrowser(secondDeposit),
    secondCommission: secondCommission,
    secondCommissionText: fmtPriceBrowser(secondCommission),
    secondColor: secondColor,
    comment: getCell(row, ["comment", "comments", "note", "notes"])
  };
}
function setSelectOptions(id, values, firstText) {
  var sel = document.getElementById(id);
  if (!sel) return;
  var current = sel.value;
  sel.innerHTML = '<option value="">' + firstText + '</option>' + values.map(function(v){
    return '<option value="' + esc(v) + '">' + esc(v) + '</option>';
  }).join('');
  if (values.indexOf(current) !== -1) sel.value = current;
}
function refreshFilterOptionsFromPoints() {
  var agents = [], colors = [], types = [], phases = [], gfas = [];
  function add(arr, v){ if (v && arr.indexOf(v) === -1) arr.push(v); }
  points.forEach(function(p){
    add(agents, p.agent); add(agents, p.secondAgent);
    add(colors, p.color); add(types, p.type); add(phases, p.phase); add(gfas, p.gfa);
  });
  agents.sort(); colors.sort(); types.sort(); phases.sort(); gfas.sort();
  setSelectOptions("agent", agents, "All agents");
  setSelectOptions("color", colors, "All statuses");
  setSelectOptions("type", types, "All types");
  setSelectOptions("phase", phases, "All phases");
  setSelectOptions("gfa", gfas, "All GFA");
}
function uploadExcelFile(event) {
  var file = event.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    try {
      var data = new Uint8Array(e.target.result);
      var workbook = XLSX.read(data, {type: "array"});
      var sheet = workbook.Sheets[workbook.SheetNames[0]];
      var rows = XLSX.utils.sheet_to_json(sheet, {defval: ""});
      var newPoints = [];
      rows.forEach(function(row, idx) {
        var p = pointFromExcelRow(row, idx);
        if (p) newPoints.push(p);
      });
      if (!newPoints.length) {
        alert("No valid rows found. Please check GIS plot number and coordinates.");
        return;
      }
      points = newPoints;
      refreshFilterOptionsFromPoints();
      resetFilters();
      alert("Excel loaded: " + points.length + " valid plots.");
    } catch(err) {
      alert("Could not read Excel file: " + err.message);
    }
  };
  reader.readAsArrayBuffer(file);
}
function exportAgentVersion() {
  var doc = document.documentElement.cloneNode(true);

  // Remove admin/editing controls.
  doc.querySelectorAll('[data-admin="true"]').forEach(function(el){ el.remove(); });
  var upload = doc.querySelector('#excelUpload');
  if (upload) upload.remove();

  var htmlText = "<!doctype html>\n" + doc.outerHTML;

  // Freeze current point data inside exported file.
  htmlText = htmlText.replace(/var points = \[[\s\S]*?\];\nvar colorHex =/, "var points = " + JSON.stringify(points) + ";\nvar colorHex =");

  // Freeze current overlay alignment and prevent agent version from loading admin saved browser alignment.
  htmlText = htmlText.replace(/var overlayCorners = JSON\.parse\(localStorage\.getItem\("JAH_overlay_corners_v31"\)[\s\S]*?JSON\.parse\(JSON\.stringify\(originalCorners\)\);/, 
    "var overlayCorners = " + JSON.stringify(overlayCorners) + ";");

  // Remove admin-only function bodies from being visible/usable, but harmless if left.
  htmlText = htmlText.replace(/<title>Jebel Ali Hills Inventory Map<\/title>/, "<title>Jebel Ali Hills Agent Map</title>");

  var blob = new Blob([htmlText], {type: "text/html;charset=utf-8"});
  var a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "Jebel_Ali_Hills_AGENT_VERSION.html";
  document.body.appendChild(a);
  a.click();
  setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

initMapLayerControls();
addMarkers(points);


// Robust delegated details checklist save. This keeps Admin and Agent settings persistent across refreshes.
setTimeout(function(){
  var box = document.getElementById('detailsChecklist');
  if (box && !box.__hayatDetailsBound) {
    box.__hayatDetailsBound = true;
    box.addEventListener('change', function(e){
      if (e.target && e.target.matches && e.target.matches('input[data-field]')) applyDetailChecklist();
    }, true);
  }
}, 0);

// Re-apply details after all other initializers finish, so defaults cannot override saved settings.
setTimeout(function(){ if (typeof loadDetailFields === 'function') loadDetailFields(); }, 50);
setTimeout(function(){ if (typeof loadDetailFields === 'function') loadDetailFields(); }, 400);
window.addEventListener('pageshow', function(){ if (typeof loadDetailFields === 'function') loadDetailFields(); });

setTimeout(function(){ if (window.HayatDataNormalize) { window.HayatDataNormalize.normalizeAllPoints(); if (typeof refreshFilterOptionsFromPoints === 'function') refreshFilterOptionsFromPoints(); if (typeof applyFilters === 'function') applyFilters(); } }, 0);


// === Admin direct plot editing / deletion ===
(function(){
  function isAdminPage(){ return /admin\.html?$|\/admin(\.html)?$/i.test(location.pathname) || location.pathname.toLowerCase().indexOf('admin') !== -1; }
  function cleanNumber(v){
    var s = String(v == null ? '' : v).replace(/,/g,'').trim();
    if(!s) return null;
    var n = Number(s);
    return isNaN(n) ? null : n;
  }
  function fmtNum2(x){
    if(x === null || x === undefined || isNaN(x)) return '';
    return Number(x).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
  }
  function fmtPrice0(x){
    if(x === null || x === undefined || isNaN(x)) return '';
    return Math.round(Number(x)).toLocaleString();
  }
  function normalizeBasicTitle(s){
    s = String(s || '').trim().replace(/\s+/g,' ');
    if(!s) return '';
    return s.toLowerCase().split(' ').map(function(w){
      if(/^g\+\d+$/i.test(w)) return w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1);
    }).join(' ');
  }
  function normalizeStatus(s){
    s = String(s || '').trim();
    if(!s) return '';
    var low = s.toLowerCase();
    var known = {red:'Red',blue:'Blue',pink:'Pink',black:'Black',green:'Green',yellow:'Yellow',orange:'Orange'};
    return known[low] || normalizeBasicTitle(s);
  }
  function recalcPlotFinancials(p){
    p.size = cleanNumber(p.size);
    p.price = cleanNumber(p.price);
    p.secondPrice = cleanNumber(p.secondPrice);
    p.priceText = fmtPrice0(p.price);
    p.secondPriceText = fmtPrice0(p.secondPrice);
    p.sizeText = p.size !== null ? fmtNum2(p.size) : '';
    p.total = (p.size !== null && p.price !== null) ? p.size * p.price : null;
    p.totalText = fmtPrice0(p.total);
    p.deposit = p.total !== null ? p.total * 0.10 : null;
    p.depositText = fmtNum2(p.deposit);
    p.commission = p.total !== null ? p.total * 0.02 : null;
    p.commissionText = fmtNum2(p.commission);
    p.secondTotal = (p.size !== null && p.secondPrice !== null) ? p.size * p.secondPrice : null;
    p.secondTotalText = fmtPrice0(p.secondTotal);
    p.secondDeposit = p.secondTotal !== null ? p.secondTotal * 0.10 : null;
    p.secondDepositText = fmtNum2(p.secondDeposit);
    p.secondCommission = p.secondTotal !== null ? p.secondTotal * 0.02 : null;
    p.secondCommissionText = fmtNum2(p.secondCommission);
    var g = String(p.gfa || '').toUpperCase().replace(/\s/g,'');
    var pct = null;
    if(g.indexOf('G+4') !== -1) pct = 2.20;
    else if(g.indexOf('G+1') !== -1) pct = 0.65;
    p.gfaPct = pct !== null ? Math.round(pct * 100) : null;
    p.gfaAllowed = (p.size !== null && pct !== null) ? p.size * pct : null;
    p.gfaAllowedText = p.gfaAllowed !== null ? fmtNum2(p.gfaAllowed) : '';
    if(p.lat && p.lon) p.mapsUrl = 'https://www.google.com/maps?q=' + p.lat + ',' + p.lon;
    return p;
  }
  function findPointByRow(row){
    return (window.points || []).find(function(x){ return String(x.row) === String(row); });
  }
  function findPointByGIS(gis){
    return (window.points || []).find(function(x){ return String(x.gisPlot) === String(gis); });
  }
  function refreshAfterAdminEdit(message){
    if(window.HayatDataNormalize && window.HayatDataNormalize.normalizeAllPoints) window.HayatDataNormalize.normalizeAllPoints();
    if(typeof refreshFilterOptionsFromPoints === 'function') refreshFilterOptionsFromPoints();
    if(typeof applyFilters === 'function') applyFilters();
    else if(typeof addMarkers === 'function') addMarkers(window.points || [], false);
    if(typeof updateSelectionPanel === 'function') updateSelectionPanel();
    if(typeof publishCurrentPoints === 'function') publishCurrentPoints();
    if(typeof refreshAddablePALayer === 'function') refreshAddablePALayer();
    if(message) alert(message);
  }
  window.openPlotEditorByRow = function(row){
    if(!isAdminPage()) return;
    var p = findPointByRow(row);
    if(!p){ alert('Plot not found.'); return; }
    window.currentEditRow = row;
    var modal = document.getElementById('plotEditModal');
    if(!modal){ alert('Editor not available on this page.'); return; }
    document.getElementById('editRowId').value = row;
    document.getElementById('editGisPlot').disabled = true;
    var dangerBtn = document.querySelector('#plotEditModal .plot-edit-actions .danger');
    if(dangerBtn) dangerBtn.style.display = '';
    var saveBtn = document.querySelector('#plotEditModal .plot-edit-actions button:first-child');
    if(saveBtn) saveBtn.textContent = 'Save Changes';
    document.getElementById('editGisPlot').value = p.gisPlot || '';
    document.getElementById('editMasterPlot').value = (typeof masterPlanLabel === 'function' ? masterPlanLabel(p) : (p.masterPlot || ''));
    document.getElementById('editAgent').value = p.agent || '';
    document.getElementById('editMobile').value = p.mobile || '';
    var editSizeEl = document.getElementById('editSize');
    if(editSizeEl) editSizeEl.value = p.size != null ? p.size : '';
    document.getElementById('editPrice').value = p.price != null ? p.price : '';
    document.getElementById('editColor').value = normalizeStatus(p.color || '') || '';
    document.getElementById('editType').value = p.type || '';
    document.getElementById('editPhase').value = p.phase || '';
    document.getElementById('editSecondAgent').value = p.secondAgent || '';
    document.getElementById('editSecondMobile').value = p.secondMobile || '';
    document.getElementById('editSecondPrice').value = p.secondPrice != null ? p.secondPrice : '';
    document.getElementById('editSecondColor').value = normalizeStatus(p.secondColor || '') || '';
    document.getElementById('editComment').value = p.comment || '';
    document.getElementById('plotEditTitle').textContent = 'Edit Plot ' + (p.gisPlot || '');
    var total = p.total ? money(p.total) : 'Unpriced';
    document.getElementById('plotEditSummary').innerHTML = 'Current total: <b>' + esc(total) + '</b>' + (p.sizeText ? ' | Size: <b>' + esc(p.sizeText) + ' sqft</b>' : '');
    modal.style.display = 'flex';
  };
  window.closePlotEditor = function(){
    var modal = document.getElementById('plotEditModal');
    if(modal) modal.style.display = 'none';
  };
  window.savePlotEdit = function(){
    var row = document.getElementById('editRowId').value;
    var p = null;
    var isNew = String(row || '').indexOf('__add__') === 0;
    if(isNew){
      p = {
        row: nextInventoryRowId(),
        gisPlot: String(document.getElementById('editGisPlot').value || '').trim(),
        masterPlot: String(document.getElementById('editMasterPlot').value || '').trim(),
        lat: window.currentAddPALabel ? Number(window.currentAddPALabel.lat) : null,
        lon: window.currentAddPALabel ? Number(window.currentAddPALabel.lng) : null,
        coords: '', mapsUrl: ''
      };
      if(!p.gisPlot) p.gisPlot = p.masterPlot;
      if(!p.masterPlot){ alert('Master Plan Plot is required.'); return; }
      if(findInventoryByMasterPlot(p.masterPlot)) { alert('This PA plot already exists in inventory.'); return; }
      if(!p.lat || !p.lon){ alert('Coordinates are missing for this PA plot.'); return; }
    } else {
      p = findPointByRow(row);
      if(!p){ alert('Plot not found.'); return; }
    }
    p.agent = normalizeBasicTitle(document.getElementById('editAgent').value);
    p.mobile = document.getElementById('editMobile').value.trim();
    var editSizeForSave = document.getElementById('editSize');
    if(editSizeForSave) p.size = cleanNumber(editSizeForSave.value);
    p.price = cleanNumber(document.getElementById('editPrice').value);
    p.color = normalizeStatus(document.getElementById('editColor').value) || p.color || 'Red';
    p.type = window.HayatDataNormalize && window.HayatDataNormalize.normalizeType ? window.HayatDataNormalize.normalizeType(document.getElementById('editType').value) : normalizeBasicTitle(document.getElementById('editType').value);
    p.phase = document.getElementById('editPhase').value.trim();
    p.secondAgent = normalizeBasicTitle(document.getElementById('editSecondAgent').value);
    p.secondMobile = document.getElementById('editSecondMobile').value.trim();
    p.secondPrice = cleanNumber(document.getElementById('editSecondPrice').value);
    p.secondColor = normalizeStatus(document.getElementById('editSecondColor').value);
    p.comment = document.getElementById('editComment').value.trim();
    recalcPlotFinancials(p);
    if(isNew){
      window.points = window.points || [];
      window.points.push(p);
    }
    closePlotEditor();
    refreshAfterAdminEdit((isNew ? 'Plot added to inventory.' : 'Plot updated.') + ' Remember to download/upload the updated data file for GitHub.');
  };
  window.deletePlotByRow = function(row){
    if(!isAdminPage()) return;
    var p = findPointByRow(row);
    if(!p){ alert('Plot not found.'); return; }
    var label = (p.masterPlot ? p.masterPlot + ' / ' : '') + (p.gisPlot || '');
    if(!confirm('Delete this plot from inventory?\n\n' + label + '\n\nThe master plan label will remain. Only the inventory marker will be removed.')) return;
    window.points = (window.points || []).filter(function(x){ return String(x.row) !== String(row); });
    if(window.selectedPlots && p.gisPlot) delete window.selectedPlots[String(p.gisPlot)];
    refreshAfterAdminEdit('Plot deleted from inventory.');
  };
  window.deletePlotFromEditor = function(){
    var row = document.getElementById('editRowId').value;
    closePlotEditor();
    deletePlotByRow(row);
  };
  window.generateAdminInventoryDataJS = function(){
    var stamp = new Date().toISOString();
    return '// Hayat Luxury GIS Admin inventory data\n// Generated: ' + stamp + '\nvar points = ' + JSON.stringify(window.points || []) + ';\n';
  };
  window.downloadAdminInventoryDataFile = function(){
    var js = window.generateAdminInventoryDataJS();
    var blob = new Blob([js], {type:'application/javascript;charset=utf-8'});
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'admin_inventory_data.js';
    document.body.appendChild(a);
    a.click();
    setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  };


  function normPAForAdd(s){
    var raw = String(s || '').trim().toUpperCase().replace(/\s+/g,'');
    var m = raw.match(/^PA(\d+)_0*(\d+)$/);
    if(m) return 'PA' + String(Number(m[1])) + '_' + String(Number(m[2]));
    return raw;
  }
  function findInventoryByMasterPlot(label){
    var n = normPAForAdd(label);
    return (window.points || []).find(function(x){
      var mp = normPAForAdd(x.masterPlot || (typeof masterPlanLabel === 'function' ? masterPlanLabel(x) : ''));
      var gp = normPAForAdd(x.gisPlot || '');
      return mp === n || gp === n;
    });
  }
  function openInventoryPopupForPoint(inv){
    if(!inv) return false;
    var hit = (window.markers || []).find(function(obj){ return obj.point && String(obj.point.row) === String(inv.row); });
    if(hit && hit.marker){ try{ hit.marker.openPopup(); return true; }catch(e){} }
    try{ L.popup().setLatLng([inv.lat, inv.lon]).setContent(window.popupHtml(inv)).openOn(map); return true; }catch(e){}
    return false;
  }
  function nextInventoryRowId(){
    var max = 0;
    (window.points || []).forEach(function(x){ var r = Number(x.row || 0); if(r > max) max = r; });
    return max + 1;
  }
  function phaseFromPA(label){
    var m = String(label || '').match(/^PA(\d+)_/i);
    return m ? m[1] : '';
  }
  window.openAddPlotByPA = function(label, lat, lng){
    if(!isAdminPage()) return;
    var existing = findInventoryByMasterPlot(label);
    if(existing) { openInventoryPopupForPoint(existing); return; }
    window.currentAddPALabel = {label: normPAForAdd(label), lat:Number(lat), lng:Number(lng)};
    var modal = document.getElementById('plotEditModal');
    if(!modal){ alert('Editor not available on this page.'); return; }
    document.getElementById('editRowId').value = '__add__' + normPAForAdd(label);
    document.getElementById('editGisPlot').disabled = false;
    document.getElementById('editGisPlot').value = normPAForAdd(label);
    document.getElementById('editMasterPlot').value = normPAForAdd(label);
    document.getElementById('editAgent').value = '';
    document.getElementById('editMobile').value = '';
    var editSizeEl = document.getElementById('editSize');
    if(editSizeEl) editSizeEl.value = '';
    document.getElementById('editPrice').value = '';
    document.getElementById('editColor').value = 'Red';
    document.getElementById('editType').value = 'Plot';
    document.getElementById('editPhase').value = phaseFromPA(label);
    document.getElementById('editSecondAgent').value = '';
    document.getElementById('editSecondMobile').value = '';
    document.getElementById('editSecondPrice').value = '';
    document.getElementById('editSecondColor').value = '';
    document.getElementById('editComment').value = '';
    document.getElementById('plotEditTitle').textContent = 'Add Plot ' + normPAForAdd(label);
    document.getElementById('plotEditSummary').innerHTML = 'New inventory record from master plan PA label. Coordinates are filled automatically from the master plan label position.';
    var dangerBtn = document.querySelector('#plotEditModal .plot-edit-actions .danger');
    if(dangerBtn) dangerBtn.style.display = 'none';
    var saveBtn = document.querySelector('#plotEditModal .plot-edit-actions button:first-child');
    if(saveBtn) saveBtn.textContent = 'Add Plot';
    modal.style.display = 'flex';
  };
  window.refreshAddablePALayer = function(){
    if(!isAdminPage() || !window.L || !window.map || !window.JAH_PA_LABELS) return;
    try{ if(window.addablePALayer) map.removeLayer(window.addablePALayer); }catch(e){}
    if(!map.getPane('paAddPane')){
      map.createPane('paAddPane');
      // Keep PA add hotspots below inventory markers so existing pins receive clicks first.
      map.getPane('paAddPane').style.zIndex = 500;
      map.getPane('paAddPane').style.pointerEvents = 'auto';
    }
    window.addablePALayer = L.layerGroup();
    window.JAH_PA_LABELS.forEach(function(pa){
      var label = normPAForAdd(pa.t);
      var existingInventory = findInventoryByMasterPlot(label);
      if(existingInventory) return;
      var icon = L.divIcon({
        className:'pa-add-hotspot',
        html:'<span title="Add '+esc(label)+' to inventory"></span>',
        iconSize:[34,24],
        iconAnchor:[17,12]
      });
      var m = L.marker([pa.lat, pa.lng], {icon:icon, pane:'paAddPane', keyboard:false, interactive:true});
      m.bindPopup('<div class="popup-title">'+esc(label)+'</div><div class="small-note">This plot is not in the inventory.</div><div class="admin-actions"><button onclick="openAddPlotByPA(\''+esc(label)+'\','+Number(pa.lat)+','+Number(pa.lng)+')">+ Add to Inventory</button></div>');
      m.addTo(window.addablePALayer);
    });
    window.addablePALayer.addTo(map);
  };
  setTimeout(function(){ refreshAddablePALayer(); }, 900);

  var previousPopupHtml = window.popupHtml;
  window.popupHtml = function(p){
    var base = previousPopupHtml ? previousPopupHtml(p) : '';
    if(!isAdminPage() || !p) return base;
    var rowId = Number(p.row || 0);
    var actions = '<div class="admin-actions"><button onclick="openPlotEditorByRow(' + rowId + ')">Edit Plot</button><button class="danger" onclick="deletePlotByRow(' + rowId + ')">Delete Plot</button></div>';
    return base + actions;
  };
  // Rebind any markers that were created before this module loaded.
  setTimeout(function(){
    try{ if(window.markers) window.markers.forEach(function(obj){ obj.marker.bindPopup(window.popupHtml(obj.point)); }); }catch(e){}
  }, 0);
})();
// === End Admin direct plot editing / deletion ===


// === v3.1.2 normalized type filtering patch ===
(function(){
  function normType(v){ return (window.HayatDataNormalize && window.HayatDataNormalize.normalizeType) ? window.HayatDataNormalize.normalizeType(v) : String(v || '').replace(/\s+/g,' ').trim(); }
  function normColor(v){ return (window.HayatDataNormalize && window.HayatDataNormalize.normalizeColor) ? window.HayatDataNormalize.normalizeColor(v) : String(v || '').replace(/\s+/g,' ').trim(); }
  function normAgent(v){ return (window.HayatDataNormalize && window.HayatDataNormalize.normalizeAgent) ? window.HayatDataNormalize.normalizeAgent(v) : String(v || '').replace(/\s+/g,' ').trim(); }
  function normGfa(v){ return (window.HayatDataNormalize && window.HayatDataNormalize.normalizeGfa) ? window.HayatDataNormalize.normalizeGfa(v) : String(v || '').replace(/\s+/g,' ').trim(); }
  function clean(v){ return String(v == null ? '' : v).replace(/\s+/g,' ').trim(); }
  function addUnique(arr, v){ v=clean(v); if(v && arr.indexOf(v) === -1) arr.push(v); }
  function setOptions(id, values, first){
    var sel=document.getElementById(id); if(!sel) return;
    var cur=sel.value;
    values=values.filter(Boolean).sort(function(a,b){return String(a).localeCompare(String(b), undefined, {numeric:true, sensitivity:'base'});});
    sel.innerHTML='<option value="">'+first+'</option>'+values.map(function(v){return '<option value="'+esc(v)+'">'+esc(v)+'</option>';}).join('');
    if(values.indexOf(cur)!==-1) sel.value=cur;
  }
  window.refreshFilterOptionsFromPoints=function(){
    var agents=[], colors=[], types=[], phases=[], gfas=[];
    (window.points || []).forEach(function(p){
      if(window.HayatDataNormalize && window.HayatDataNormalize.normalizePoint) window.HayatDataNormalize.normalizePoint(p);
      addUnique(agents, normAgent(p.agent)); addUnique(agents, normAgent(p.secondAgent));
      addUnique(colors, normColor(p.color)); addUnique(types, normType(p.type)); addUnique(phases, clean(p.phase)); addUnique(gfas, normGfa(p.gfa));
    });
    setOptions('agent', agents, 'All agents'); setOptions('color', colors, 'All statuses'); setOptions('type', types, 'All types'); setOptions('phase', phases, 'All phases'); setOptions('gfa', gfas, 'All GFA');
  };
  window.applyFilters=function(){
    var search = val('search').toLowerCase();
    var agent = normAgent(val('agent')), color = normColor(val('color')), type = normType(val('type')), phase = clean(val('phase')), gfa = normGfa(val('gfa'));
    var minSize = num('minSize'), maxSize = num('maxSize'), minPrice = num('minPrice'), maxPrice = num('maxPrice');
    var priced = val('priced');
    var filtered = (window.points || []).filter(function(p){
      if(window.HayatDataNormalize && window.HayatDataNormalize.normalizePoint) window.HayatDataNormalize.normalizePoint(p);
      if(search && !((p.gisPlot||'').toLowerCase().includes(search) || (p.masterPlot||'').toLowerCase().includes(search) || (p.agent||'').toLowerCase().includes(search) || (p.mobile||'').toLowerCase().includes(search) || (p.secondAgent||'').toLowerCase().includes(search) || (p.secondMobile||'').toLowerCase().includes(search))) return false;
      if(agent && normAgent(p.agent) !== agent && normAgent(p.secondAgent) !== agent) return false;
      if(color && normColor(p.color) !== color && normColor(p.secondColor) !== color) return false;
      if(type && normType(p.type) !== type) return false;
      if(phase && clean(p.phase) !== phase) return false;
      if(gfa && normGfa(p.gfa) !== gfa) return false;
      if(minSize !== null && (!p.size || p.size < minSize)) return false;
      if(maxSize !== null && (!p.size || p.size > maxSize)) return false;
      if(minPrice !== null && (!p.price || p.price < minPrice) && (!p.secondPrice || p.secondPrice < minPrice)) return false;
      if(maxPrice !== null && (!p.price || p.price > maxPrice) && (!p.secondPrice || p.secondPrice > maxPrice)) return false;
      if(priced === 'priced' && !p.price && !p.secondPrice) return false;
      if(priced === 'unpriced' && (p.price || p.secondPrice)) return false;
      return true;
    });
    baseFilteredList = filtered;
    if(showSelectedOnly && typeof setShowSelectedOnly === 'function') setShowSelectedOnly(false);
    addMarkers(filtered);
  };
  setTimeout(function(){ if(window.HayatDataNormalize) window.HayatDataNormalize.normalizeAllPoints(); window.refreshFilterOptionsFromPoints(); }, 0);
})();
// === End v3.1.2 normalized type filtering patch ===


// === v3.1.2 Admin Move Plot + Add by Map Click + Advanced Coordinates ===
(function(){
  function isAdminPage(){ return location.pathname.toLowerCase().indexOf('admin') !== -1 || document.querySelector('[data-admin="true"]'); }
  if(!isAdminPage()) return;
  function cleanNumber(v){ var s=String(v == null ? '' : v).replace(/,/g,'').trim(); if(!s) return null; var n=Number(s); return isNaN(n) ? null : n; }
  function fmtNum2(x){ return (x===null||x===undefined||isNaN(x)) ? '' : Number(x).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}); }
  function fmtPrice(x){ return (x===null||x===undefined||isNaN(x)) ? '' : Number(x).toLocaleString(undefined,{maximumFractionDigits:2}); }
  function normalizeType(v){ return (window.HayatDataNormalize && window.HayatDataNormalize.normalizeType) ? window.HayatDataNormalize.normalizeType(v) : String(v||'').replace(/\s+/g,' ').trim(); }
  function normalizeAgent(v){ return (window.HayatDataNormalize && window.HayatDataNormalize.normalizeAgent) ? window.HayatDataNormalize.normalizeAgent(v) : String(v||'').replace(/\s+/g,' ').trim(); }
  function normalizeColor(v){ return (window.HayatDataNormalize && window.HayatDataNormalize.normalizeColor) ? (window.HayatDataNormalize.normalizeColor(v) || '') : String(v||'').replace(/\s+/g,' ').trim(); }
  function findPointByRow(row){ return (window.points || []).find(function(x){ return String(x.row) === String(row); }); }
  function nextRow(){ var max=0; (window.points||[]).forEach(function(p){ var r=Number(p.row||0); if(r>max) max=r; }); return max+1; }
  function updateCoords(p, lat, lon){
    lat=Number(lat); lon=Number(lon);
    if(!isNaN(lat) && !isNaN(lon)){ p.lat=lat; p.lon=lon; p.coords=lat.toFixed(7)+', '+lon.toFixed(7); p.mapsUrl='https://www.google.com/maps?q='+lat+','+lon; }
  }
  function normPAForMove(s){
    var raw=String(s||'').trim().toUpperCase().replace(/\s+/g,'');
    var m=raw.match(/^PA(\d+)_0*(\d+)$/);
    if(m) return 'PA'+String(Number(m[1]))+'_'+String(Number(m[2]));
    return raw;
  }
  function findMasterPALabelForPoint(p){
    if(!p || !window.JAH_PA_LABELS) return null;
    var targets=[p.masterPlot, p.gisPlot].map(normPAForMove).filter(Boolean);
    return (window.JAH_PA_LABELS||[]).find(function(pa){ return targets.indexOf(normPAForMove(pa.t)) !== -1; }) || null;
  }
  function updateUnderlyingPALabel(p, lat, lon){
    var pa=findMasterPALabelForPoint(p);
    if(pa){ pa.lat=Number(lat); pa.lng=Number(lon); return true; }
    return false;
  }
  function recalc(p){
    p.size=cleanNumber(p.size); p.price=cleanNumber(p.price); p.secondPrice=cleanNumber(p.secondPrice);
    p.sizeText=p.size!==null?fmtNum2(p.size):''; p.priceText=p.price!==null?fmtPrice(p.price):''; p.secondPriceText=p.secondPrice!==null?fmtPrice(p.secondPrice):'';
    p.total=(p.size!==null && p.price!==null)?p.size*p.price:null; p.totalText=p.total!==null?fmtPrice(p.total):'';
    p.deposit=p.total!==null?p.total*0.10:null; p.depositText=p.deposit!==null?fmtNum2(p.deposit):'';
    p.commission=p.total!==null?p.total*0.02:null; p.commissionText=p.commission!==null?fmtNum2(p.commission):'';
    p.secondTotal=(p.size!==null && p.secondPrice!==null)?p.size*p.secondPrice:null; p.secondTotalText=p.secondTotal!==null?fmtPrice(p.secondTotal):'';
    p.secondDeposit=p.secondTotal!==null?p.secondTotal*0.10:null; p.secondDepositText=p.secondDeposit!==null?fmtNum2(p.secondDeposit):'';
    p.secondCommission=p.secondTotal!==null?p.secondTotal*0.02:null; p.secondCommissionText=p.secondCommission!==null?fmtNum2(p.secondCommission):'';
    var g=String(p.gfa||'').toUpperCase().replace(/\s/g,''); var pct=null; if(g.indexOf('G+4')!==-1) pct=2.20; else if(g.indexOf('G+1')!==-1) pct=0.65;
    p.gfaPct=pct!==null?Math.round(pct*100):null; p.gfaAllowed=(p.size!==null && pct!==null)?p.size*pct:null; p.gfaAllowedText=p.gfaAllowed!==null?fmtNum2(p.gfaAllowed):'';
    updateCoords(p, p.lat, p.lon);
    if(window.HayatDataNormalize && window.HayatDataNormalize.normalizePoint) window.HayatDataNormalize.normalizePoint(p);
    return p;
  }
  function afterEdit(msg){
    if(window.HayatDataNormalize && window.HayatDataNormalize.normalizeAllPoints) window.HayatDataNormalize.normalizeAllPoints();
    if(typeof refreshFilterOptionsFromPoints==='function') refreshFilterOptionsFromPoints();
    if(typeof applyFilters==='function') applyFilters(); else if(typeof addMarkers==='function') addMarkers(window.points||[], false);
    if(typeof updateSelectionPanel==='function') updateSelectionPanel();
    if(typeof publishCurrentPoints==='function') publishCurrentPoints();
    if(typeof refreshAddablePALayer==='function') refreshAddablePALayer();
    if(msg) alert(msg);
  }
  var oldOpen = window.openPlotEditorByRow;
  window.openPlotEditorByRow = function(row){
    if(oldOpen) oldOpen(row);
    var p=findPointByRow(row);
    if(p){ var la=document.getElementById('editLat'), lo=document.getElementById('editLon'); if(la) la.value = p.lat != null ? Number(p.lat).toFixed(7) : ''; if(lo) lo.value = p.lon != null ? Number(p.lon).toFixed(7) : ''; }
  };
  var oldAddPA = window.openAddPlotByPA;
  window.openAddPlotByPA = function(label, lat, lng){
    if(oldAddPA) oldAddPA(label, lat, lng);
    var la=document.getElementById('editLat'), lo=document.getElementById('editLon'); if(la) la.value=Number(lat).toFixed(7); if(lo) lo.value=Number(lng).toFixed(7);
  };
  window.savePlotEdit = function(){
    var row=document.getElementById('editRowId').value || '';
    var isNew = row.indexOf('__add__')===0 || row.indexOf('__mapadd__')===0;
    var p = isNew ? {row:nextRow(), coords:'', mapsUrl:''} : findPointByRow(row);
    if(!p){ alert('Plot not found.'); return; }
    p.gisPlot=String(document.getElementById('editGisPlot').value||'').trim();
    p.masterPlot=String(document.getElementById('editMasterPlot').value||'').trim();
    if(!p.gisPlot){ alert('GIS Plot is required.'); return; }
    p.agent=normalizeAgent(document.getElementById('editAgent').value);
    p.mobile=String(document.getElementById('editMobile').value||'').trim();
    var editSizeForSave=document.getElementById('editSize');
    p.size=editSizeForSave ? cleanNumber(editSizeForSave.value) : p.size;
    p.price=cleanNumber(document.getElementById('editPrice').value);
    p.color=normalizeColor(document.getElementById('editColor').value) || p.color || 'Red';
    p.type=normalizeType(document.getElementById('editType').value) || 'Plot';
    p.phase=String(document.getElementById('editPhase').value||'').trim();
    p.secondAgent=normalizeAgent(document.getElementById('editSecondAgent').value);
    p.secondMobile=String(document.getElementById('editSecondMobile').value||'').trim();
    p.secondPrice=cleanNumber(document.getElementById('editSecondPrice').value);
    p.secondColor=normalizeColor(document.getElementById('editSecondColor').value);
    p.comment=String(document.getElementById('editComment').value||'').trim();
    var la=document.getElementById('editLat'), lo=document.getElementById('editLon');
    var lat=la ? cleanNumber(la.value) : null, lon=lo ? cleanNumber(lo.value) : null;
    if(lat===null || lon===null){
      if(window.currentAddPALabel && isNew){ lat=Number(window.currentAddPALabel.lat); lon=Number(window.currentAddPALabel.lng); }
      else { lat=Number(p.lat); lon=Number(p.lon); }
    }
    if(isNaN(lat) || isNaN(lon)){ alert('Latitude and longitude are required.'); return; }
    updateCoords(p, lat, lon);
    var movePABox=document.getElementById('editMoveMasterPA');
    if(movePABox && movePABox.checked){ updateUnderlyingPALabel(p, lat, lon); }
    recalc(p);
    if(isNew){ window.points=window.points||[]; window.points.push(p); }
    if(typeof closePlotEditor==='function') closePlotEditor();
    afterEdit(isNew ? 'Plot added.' : 'Plot updated.');
  };
  window.startAddPlotByMapClick = function(){
    if(!window.map){ alert('Map not ready.'); return; }
    alert('Click once on the map where you want to place the new plot pin.');
    document.body.classList.add('map-click-add-mode');
    window.__addByMapClickActive = true;
    map.once('click', function(e){
      document.body.classList.remove('map-click-add-mode');
      window.__addByMapClickActive = false;
      window.currentAddPALabel = {label:'', lat:e.latlng.lat, lng:e.latlng.lng, manual:true};
      var modal=document.getElementById('plotEditModal'); if(!modal){ alert('Editor not available.'); return; }
      document.getElementById('editRowId').value='__mapadd__'+Date.now();
      document.getElementById('editGisPlot').disabled=false; document.getElementById('editMasterPlot').disabled=false;
      ['editGisPlot','editMasterPlot','editAgent','editMobile','editSize','editPrice','editSecondAgent','editSecondMobile','editSecondPrice','editComment'].forEach(function(id){ var el=document.getElementById(id); if(el) el.value=''; });
      document.getElementById('editColor').value='Red'; document.getElementById('editType').value='Plot'; document.getElementById('editPhase').value=''; document.getElementById('editSecondColor').value='';
      var la=document.getElementById('editLat'), lo=document.getElementById('editLon'); if(la) la.value=e.latlng.lat.toFixed(7); if(lo) lo.value=e.latlng.lng.toFixed(7);
      document.getElementById('plotEditTitle').textContent='Add Plot by Map Click';
      document.getElementById('plotEditSummary').innerHTML='New inventory record using the clicked map position.';
      var dangerBtn=document.querySelector('#plotEditModal .plot-edit-actions .danger'); if(dangerBtn) dangerBtn.style.display='none';
      var saveBtn=document.querySelector('#plotEditModal .plot-edit-actions button:first-child'); if(saveBtn) saveBtn.textContent='Add Plot';
      modal.style.display='flex';
    });
  };
  window.cancelMapClickMode = function(){ window.__addByMapClickActive=false; document.body.classList.remove('map-click-add-mode'); alert('Map click add mode cancelled.'); };
  window.startMovePlotFromEditor = function(){
    var row=document.getElementById('editRowId').value; if(row.indexOf('__')===0){ alert('Save the new plot first, then move it if needed.'); return; }
    if(typeof closePlotEditor==='function') closePlotEditor();
    window.startMovePlotByRow(row);
  };
  window.startMovePlotByRow = function(row){
    var p=findPointByRow(row); if(!p){ alert('Plot not found.'); return; }
    if(window.__moveMarker){ try{ map.removeLayer(window.__moveMarker); }catch(e){} }
    var mk=L.marker([Number(p.lat), Number(p.lon)], {draggable:true, title:'Drag to new position'}).addTo(map);
    window.__moveMarker=mk; window.__moveRow=row;
    var pa=findMasterPALabelForPoint(p);
    window.__moveOriginalPA = pa ? {pa:pa, lat:Number(pa.lat), lng:Number(pa.lng)} : null;
    mk.bindPopup('<div class="popup-title">Move Plot '+esc(p.gisPlot||'')+'</div><div class="small-note">Drag this marker to the correct position, then save.</div><label style="display:flex;gap:6px;align-items:center;margin:8px 0;font-size:12px;"><input id="moveUnderlyingPA" type="checkbox" checked style="width:auto;">Move underlying master-plan / empty PA point also</label><div class="small-note">Keep checked when the PA hotspot underneath was wrong too. Uncheck only if you want to move the inventory pin alone.</div><div class="admin-actions"><button onclick="commitMovePlotPosition()">Save Position</button><button class="danger" onclick="cancelMovePlotPosition()">Cancel</button></div>').openPopup();
  };
  window.commitMovePlotPosition = function(){
    var p=findPointByRow(window.__moveRow); if(!p || !window.__moveMarker){ alert('Move operation not available.'); return; }
    var ll=window.__moveMarker.getLatLng(); updateCoords(p, ll.lat, ll.lng);
    var cb=document.getElementById('moveUnderlyingPA');
    if(!cb || cb.checked){ updateUnderlyingPALabel(p, ll.lat, ll.lng); }
    recalc(p);
    try{ map.removeLayer(window.__moveMarker); }catch(e){} window.__moveMarker=null; window.__moveRow=null; window.__moveOriginalPA=null;
    afterEdit('Plot position updated.');
  };
  window.cancelMovePlotPosition = function(){
    try{ if(window.__moveOriginalPA && window.__moveOriginalPA.pa){ window.__moveOriginalPA.pa.lat=window.__moveOriginalPA.lat; window.__moveOriginalPA.pa.lng=window.__moveOriginalPA.lng; } }catch(e){}
    try{ if(window.__moveMarker) map.removeLayer(window.__moveMarker); }catch(e){}
    window.__moveMarker=null; window.__moveRow=null; window.__moveOriginalPA=null;
  };
})();
// === End v3.1.2 Admin Move Plot + Add by Map Click + Advanced Coordinates ===
