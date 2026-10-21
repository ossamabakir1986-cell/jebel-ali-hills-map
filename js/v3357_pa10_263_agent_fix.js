// PA10_263 / GIS 5130614 agent assignment correction.
(function(){
  var TARGET_GIS = '5130614';
  var TARGET_MASTER = 'PA10_263';
  var AGENT = 'Firas Fraick';
  var MOBILE = '+971 52 446 9369';

  function applyFix(list){
    if (!Array.isArray(list)) return;
    list.forEach(function(point){
      if (!point) return;
      if (String(point.gisPlot || '').trim() !== TARGET_GIS &&
          String(point.masterPlot || '').trim().toUpperCase() !== TARGET_MASTER) return;
      point.agent = AGENT;
      point.mobile = MOBILE;
    });
  }

  applyFix(window.points);
  applyFix(window.HAYAT_PUBLISHED_POINTS);
})();
