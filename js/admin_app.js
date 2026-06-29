
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
}
function setMasterPlanVisible(show){
  if(!masterPlanOverlay) return;
  if(show){
    try{ if(!map.hasLayer(masterPlanOverlay)) masterPlanOverlay.addTo(map); }catch(e){}
  } else {
    try{ if(map.hasLayer(masterPlanOverlay)) map.removeLayer(masterPlanOverlay); }catch(e){}
  }
  try{ localStorage.setItem('JAH_show_master_plan', show ? '1':'0'); }catch(e){}
}
function initMapLayerControls(){
  try{
    var saved = localStorage.getItem('JAH_inventory_visibility');
    if(saved) inventoryVisibility = Object.assign(inventoryVisibility, JSON.parse(saved));
    ['Red','Blue','Pink','Other'].forEach(function(b){
      var id = b === 'Red' ? 'showRedInventory' : b === 'Blue' ? 'showBlueInventory' : b === 'Pink' ? 'showPinkInventory' : 'showOtherInventory';
      var el = document.getElementById(id); if(el) el.checked = inventoryVisibility[b] !== false;
    });
    var showMaster = localStorage.getItem('JAH_show_master_plan');
    if(showMaster === '0'){
      var mp = document.getElementById('toggleMasterPlan'); if(mp) mp.checked = false;
      setMasterPlanVisible(false);
    }
  }catch(e){}
}
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

var detailFieldsKey = (location.pathname.indexOf('agent') !== -1 ? 'hayatAgentDetailFields' : 'hayatAdminDetailFields');
var detailFieldDefaults = {
  masterPlot:true, agent:true, mobile:true, size:true, pricing:true, secondOffer:true,
  type:true, phase:true, gfa:true, comment:true, coordinates:true
};
var detailFields = Object.assign({}, detailFieldDefaults);
window.detailFields = detailFields;
function collectDetailFieldsFromChecklist(){
  document.querySelectorAll('#detailsChecklist input[data-field]').forEach(function(cb){
    detailFields[cb.getAttribute('data-field')] = cb.checked && !cb.disabled;
  });
  window.detailFields = detailFields;
  return Object.assign({}, detailFields);
}
window.getCurrentDetailFields = function(){ return collectDetailFieldsFromChecklist(); };
function getPublishedDetailPermissions(){
  var s = window.HAYAT_ACTIVE_PUBLISHED_SETTINGS || window.HAYAT_PUBLISHED_SETTINGS || {};
  return (s && s.detailFields && typeof s.detailFields === 'object') ? s.detailFields : null;
}
function loadDetailFields(){
  try {
    var saved = localStorage.getItem(detailFieldsKey);
    if (saved) detailFields = Object.assign({}, detailFieldDefaults, JSON.parse(saved));
  } catch(e) {}
  var published = (location.pathname.indexOf('agent') !== -1) ? getPublishedDetailPermissions() : null;
  document.querySelectorAll('#detailsChecklist input[data-field]').forEach(function(cb){
    var k = cb.getAttribute('data-field');
    var blocked = published && published[k] === false;
    if (blocked) detailFields[k] = false;
    cb.checked = detailFields[k] !== false;
    cb.disabled = !!blocked;
    if (cb.parentElement) cb.parentElement.style.opacity = blocked ? '0.45' : '1';
    if (cb.parentElement) cb.parentElement.title = blocked ? 'Hidden by Admin permission' : '';
  });
  window.detailFields = detailFields;
}
function isDetailVisible(k){ return detailFields[k] !== false; }
function applyDetailChecklist(){
  collectDetailFieldsFromChecklist();
  try { localStorage.setItem(detailFieldsKey, JSON.stringify(detailFields)); } catch(e) {}
  markers.forEach(function(obj){ obj.marker.bindPopup(popupHtml(obj.point)); });
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
  htmlText = htmlText.replace(/var overlayCorners = JSON\.parse\(localStorage\.getItem\("JAH_overlay_corners_map10"\)[\s\S]*?JSON\.parse\(JSON\.stringify\(originalCorners\)\);/, 
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
  if (masterPlanOverlay) masterPlanOverlay.setOpacity(Number(v)/100);
}
function saveAlignment() {
  localStorage.setItem("JAH_overlay_corners_map10", JSON.stringify(overlayCorners));
  alert("Alignment saved in this browser.");
}
function resetAlignment() {
  overlayCorners = JSON.parse(JSON.stringify(originalCorners));
  localStorage.removeItem("JAH_overlay_corners_map10");
  makeOverlay();
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
  htmlText = htmlText.replace(/var overlayCorners = JSON\.parse\(localStorage\.getItem\("JAH_overlay_corners_map10"\)[\s\S]*?JSON\.parse\(JSON\.stringify\(originalCorners\)\);/, 
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

setTimeout(function(){ if (window.HayatDataNormalize) { window.HayatDataNormalize.normalizeAllPoints(); if (typeof refreshFilterOptionsFromPoints === 'function') refreshFilterOptionsFromPoints(); if (typeof applyFilters === 'function') applyFilters(); } }, 0);
