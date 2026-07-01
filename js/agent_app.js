
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
var detailSettingsKey = (window.HAYAT_SYNC_SETTINGS_KEY || 'HAYAT_JAH_PUBLISHED_SETTINGS_V21');
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
function addMarkers(list, doFit=true) {
  markers.forEach(function(obj) { map.removeLayer(obj.marker); });
  markers = [];
  var bounds = [];
  list = (list || []).filter(function(p){ return isInventoryColorVisible(p.color); });
  list.forEach(function(p) {
    var c = colorHex[p.color] || "#666";
    var marker = L.circleMarker([p.lat, p.lon], {
      radius: 7, color:"#fff", weight:1.5, fillColor:c, fillOpacity:.92
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
    document.getElementById(id).value = "";
  });
  loadDetailFields();
  baseFilteredList = points;
  setShowSelectedOnly(false);
  initMapLayerControls();
addMarkers(points);
}
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
  try { localStorage.setItem("JAH_overlay_opacity_map10", String(n)); } catch(e) {}
  if (masterPlanOverlay) masterPlanOverlay.setOpacity(n/100);
  if(!window.HAYAT_APPLYING_SETTINGS && typeof window.saveCurrentPublishSettings === 'function') window.saveCurrentPublishSettings();
}
function saveAlignment() {
  localStorage.setItem("JAH_overlay_corners_map10", JSON.stringify(overlayCorners));
  if(!window.HAYAT_APPLYING_SETTINGS && typeof window.saveCurrentPublishSettings === 'function') window.saveCurrentPublishSettings();
  alert("Alignment saved in this browser.");
}
function resetAlignment() {
  overlayCorners = JSON.parse(JSON.stringify(originalCorners));
  localStorage.removeItem("JAH_overlay_corners_map10");
  makeOverlay();
  if(!window.HAYAT_APPLYING_SETTINGS && typeof window.saveCurrentPublishSettings === 'function') window.saveCurrentPublishSettings();
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
