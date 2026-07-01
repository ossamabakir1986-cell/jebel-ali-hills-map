
var map = L.map('map', { zoomControl:false }).setView([24.900313373804266, 54.975459621044884], 16);
window.map = map;
L.control.zoom({ position:'bottomright' }).addTo(map);

function configureHayatPanes(){
  try{
    if(map.getPane('overlayPane')) map.getPane('overlayPane').style.zIndex = 200;
    if(map.getPane('tooltipPane')) map.getPane('tooltipPane').style.zIndex = 640;
    if(map.getPane('popupPane')) {
      map.getPane('popupPane').style.zIndex = 1200;
      map.getPane('popupPane').style.pointerEvents = 'auto';
    }
  }catch(e){}
}
configureHayatPanes();
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
var overlayOpacity = Number(localStorage.getItem("JAH_overlay_opacity_map10") || "70");
if (!isFinite(overlayOpacity) || overlayOpacity < 60) {
  overlayOpacity = 70;
  try { localStorage.setItem("JAH_overlay_opacity_map10", "70"); } catch(e) {}
}
if (isNaN(overlayOpacity) || overlayOpacity < 0 || overlayOpacity > 100) overlayOpacity = 45;
var masterPlanOverlay;

function makeOverlay() {
  if (masterPlanOverlay) map.removeLayer(masterPlanOverlay);
  var tlp = L.latLng(overlayCorners.tl[0], overlayCorners.tl[1]);
  var trp = L.latLng(overlayCorners.tr[0], overlayCorners.tr[1]);
  var blp = L.latLng(overlayCorners.bl[0], overlayCorners.bl[1]);
  if (L.imageOverlay.rotated) {
    masterPlanOverlay = L.imageOverlay.rotated(masterPlanImage, tlp, trp, blp, {opacity: overlayOpacity/100, interactive:false});
  } else {
    masterPlanOverlay = L.imageOverlay(masterPlanImage, [[24.881341646409087, 54.94266558388461], [24.919819914418028, 55.00217956231451]], {opacity: overlayOpacity/100, interactive:false});
  }
  masterPlanOverlay.addTo(map);
}
makeOverlay();

window.getCurrentOverlayCorners = function(){
  return JSON.parse(JSON.stringify(overlayCorners));
};
window.getCurrentOverlayOpacity = function(){
  return overlayOpacity;
};
window.setOverlayOpacityFromPublish = function(v){
  var n = Number(v);
  if(isNaN(n) || n < 0 || n > 100) return false;
  overlayOpacity = n;
  try { localStorage.setItem("JAH_overlay_opacity_map10", String(overlayOpacity)); } catch(e) {}
  if(masterPlanOverlay && masterPlanOverlay.setOpacity) masterPlanOverlay.setOpacity(overlayOpacity/100);
  var slider = document.getElementById('opacitySlider');
  if(slider) slider.value = String(Math.round(overlayOpacity));
  return true;
};
window.setOverlayCornersFromPublish = function(corners){
  if(!corners || !corners.tl || !corners.tr || !corners.bl) return false;
  function validPt(pt){ return Array.isArray(pt) && pt.length === 2 && isFinite(Number(pt[0])) && isFinite(Number(pt[1])); }
  if(!validPt(corners.tl) || !validPt(corners.tr) || !validPt(corners.bl)) return false;
  overlayCorners = JSON.parse(JSON.stringify(corners));
  try { localStorage.setItem("JAH_overlay_corners_map10", JSON.stringify(overlayCorners)); } catch(e) {}
  makeOverlay();
  return true;
};

