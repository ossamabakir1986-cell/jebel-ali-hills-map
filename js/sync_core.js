(function(){
  var STORAGE_KEY = 'HAYAT_JAH_POINTS_V21';
  var UPDATED_KEY = 'HAYAT_JAH_POINTS_V21_UPDATED';
  window.HAYAT_SYNC_KEY = STORAGE_KEY;

  function parseDate(v){
    if(!v) return 0;
    var t = Date.parse(v);
    return isNaN(t) ? 0 : t;
  }
  function safePoints(data){ return Array.isArray(data) && data.length ? data : null; }
  function setPoints(data){
    if (safePoints(data)) {
      window.points = data;
      if (window.HayatDataNormalize && window.HayatDataNormalize.normalizeAllPoints) {
        window.HayatDataNormalize.normalizeAllPoints();
      }
      return true;
    }
    return false;
  }
  function getLocalPublished(){
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      return safePoints(data) ? {points:data, updated:localStorage.getItem(UPDATED_KEY) || ''} : null;
    } catch(e) { return null; }
  }
  function getFilePublished(){
    if (safePoints(window.HAYAT_PUBLISHED_POINTS)) {
      return {points:window.HAYAT_PUBLISHED_POINTS, updated:window.HAYAT_PUBLISHED_UPDATED || ''};
    }
    return null;
  }

  window.loadPublishedPoints = function(){
    var local = getLocalPublished();
    var file = getFilePublished();
    var chosen = null;
    if (local && file) chosen = parseDate(local.updated) >= parseDate(file.updated) ? local : file;
    else chosen = local || file;
    if (chosen) {
      var ok = setPoints(chosen.points);
      window.HAYAT_ACTIVE_DATA_UPDATED = chosen.updated || '';
      window.HAYAT_ACTIVE_DATA_SOURCE = chosen === local ? 'browser publish' : 'published data file';
      return ok;
    }
    window.HAYAT_ACTIVE_DATA_SOURCE = 'built-in inventory';
    window.HAYAT_ACTIVE_DATA_UPDATED = '';
    return false;
  };

  window.publishCurrentPoints = function(){
    try {
      var stamp = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(window.points || []));
      localStorage.setItem(UPDATED_KEY, stamp);
      window.HAYAT_ACTIVE_DATA_SOURCE = 'browser publish';
      window.HAYAT_ACTIVE_DATA_UPDATED = stamp;
      if (typeof window.refreshSyncStatus === 'function') window.refreshSyncStatus();
      return true;
    } catch(e) {
      alert('Could not publish updates to browser storage: ' + e.message);
      return false;
    }
  };

  window.clearPublishedPoints = function(){
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(UPDATED_KEY);
    window.HAYAT_ACTIVE_DATA_SOURCE = 'built-in inventory';
    window.HAYAT_ACTIVE_DATA_UPDATED = '';
    if (typeof window.refreshSyncStatus === 'function') window.refreshSyncStatus();
  };

  window.downloadPublishedDataFile = function(){
    var stamp = new Date().toISOString();
    var json = JSON.stringify(window.points || []);
    var js = '// Hayat Luxury GIS published inventory data\n' +
      '// Generated: ' + stamp + '\n' +
      'window.HAYAT_PUBLISHED_UPDATED = ' + JSON.stringify(stamp) + ';\n' +
      'window.HAYAT_PUBLISHED_POINTS = ' + json + ';\n';
    var blob = new Blob([js], {type:'application/javascript;charset=utf-8'});
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'published_inventory_data.js';
    document.body.appendChild(a);
    a.click();
    setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    window.publishCurrentPoints();
  };

  window.importPublishedDataFile = function(event){
    var file = event.target.files && event.target.files[0];
    if(!file) return;
    var reader = new FileReader();
    reader.onload = function(e){
      try{
        var txt = e.target.result || '';
        var m = txt.match(/window\.HAYAT_PUBLISHED_POINTS\s*=\s*([\s\S]*?);\s*$/m);
        if(!m) throw new Error('Could not find HAYAT_PUBLISHED_POINTS in file.');
        var data = JSON.parse(m[1]);
        if(!safePoints(data)) throw new Error('The file does not contain valid plot data.');
        window.points = data;
        window.publishCurrentPoints();
        if(typeof refreshFilterOptionsFromPoints === 'function') refreshFilterOptionsFromPoints();
        if(typeof applyFilters === 'function') applyFilters();
        alert('Published data imported into this browser. Refresh Agent map to view it.');
      }catch(err){ alert('Could not import published data: ' + err.message); }
      finally{ event.target.value=''; }
    };
    reader.readAsText(file);
  };

  window.refreshSyncStatus = function(){
    var el = document.getElementById('syncStatus');
    if(!el) return;
    var src = window.HAYAT_ACTIVE_DATA_SOURCE || 'built-in inventory';
    var upd = window.HAYAT_ACTIVE_DATA_UPDATED || 'not published yet';
    el.textContent = 'Active data: ' + src + ' | Updated: ' + upd;
  };

  window.loadPublishedPoints();
  setTimeout(window.refreshSyncStatus, 0);
})();
