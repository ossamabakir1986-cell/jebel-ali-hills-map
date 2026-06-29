
var map = L.map('map', { zoomControl:false }).setView([24.900313373804266, 54.975459621044884], 16);
window.map = map;
L.control.zoom({ position:'bottomright' }).addTo(map);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom:20,
  attribution:'&copy; OpenStreetMap contributors'
}).addTo(map);

var masterPlanImage = "assets/jah_master_plan_hd.png";
var masterPlanSource = "Vector PDF render - 300 DPI";
var originalCorners = {
  tl: [24.919666067631066, 54.94266558388461],
  tr: [24.919819914418028, 55.00208048799185],
  bl: [24.881341646409087, 54.942764658207274]
};
var overlayCorners = JSON.parse(localStorage.getItem("JAH_overlay_corners_map10") || "null") || JSON.parse(JSON.stringify(originalCorners));
var masterPlanOverlay;

function makeOverlay() {
  if (masterPlanOverlay) map.removeLayer(masterPlanOverlay);
  var tlp = L.latLng(overlayCorners.tl[0], overlayCorners.tl[1]);
  var trp = L.latLng(overlayCorners.tr[0], overlayCorners.tr[1]);
  var blp = L.latLng(overlayCorners.bl[0], overlayCorners.bl[1]);
  if (L.imageOverlay.rotated) {
    masterPlanOverlay = L.imageOverlay.rotated(masterPlanImage, tlp, trp, blp, {opacity: 0.45, interactive:false});
  } else {
    masterPlanOverlay = L.imageOverlay(masterPlanImage, [[24.881341646409087, 54.94266558388461], [24.919819914418028, 55.00217956231451]], {opacity: 0.45, interactive:false});
  }
  masterPlanOverlay.addTo(map);
}
makeOverlay();

window.getCurrentOverlayCorners = function(){
  return JSON.parse(JSON.stringify(overlayCorners));
};
window.setOverlayCornersFromPublish = function(corners){
  if(!corners || !corners.tl || !corners.tr || !corners.bl) return false;
  overlayCorners = JSON.parse(JSON.stringify(corners));
  try { localStorage.setItem("JAH_overlay_corners_map10", JSON.stringify(overlayCorners)); } catch(e) {}
  makeOverlay();
  return true;
};

