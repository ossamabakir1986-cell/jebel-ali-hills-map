(function(){
  var STORAGE_KEY = 'HAYAT_JAH_POINTS_V31';
  var UPDATED_KEY = 'HAYAT_JAH_POINTS_V31_UPDATED';
  var SETTINGS_KEY = 'HAYAT_JAH_PUBLISHED_SETTINGS_V31';
  window.HAYAT_SYNC_KEY = STORAGE_KEY;
  window.HAYAT_SYNC_SETTINGS_KEY = SETTINGS_KEY;

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
  function getCurrentPublishSettings(){
    var settings = {};
    if (typeof window.getCurrentDetailFields === 'function') {
      settings.detailFields = window.getCurrentDetailFields();
    } else if (window.detailFields) {
      settings.detailFields = window.detailFields;
    }
    if (typeof window.getCurrentLayerSettings === 'function') {
      settings.layerVisibility = window.getCurrentLayerSettings();
    }
    if (typeof window.getCurrentOverlayCorners === 'function') {
      settings.overlayCorners = window.getCurrentOverlayCorners();
    }
    if (typeof window.getCurrentOverlayOpacity === 'function') {
      settings.overlayOpacity = window.getCurrentOverlayOpacity();
    }
    return settings;
  }
  function safeSettings(data){ return data && typeof data === 'object' ? data : {}; }
  function getLocalSettings(){
    try { return safeSettings(JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')); } catch(e) { return {}; }
  }
  function hasSettings(settings){
    return settings && typeof settings === 'object' && Object.keys(settings).length > 0;
  }
  function setActiveSettings(settings){
    window.HAYAT_APPLYING_SETTINGS = true;
    window.HAYAT_ACTIVE_PUBLISHED_SETTINGS = safeSettings(settings);
    if (window.HAYAT_ACTIVE_PUBLISHED_SETTINGS.overlayCorners && typeof window.setOverlayCornersFromPublish === 'function') {
      window.setOverlayCornersFromPublish(window.HAYAT_ACTIVE_PUBLISHED_SETTINGS.overlayCorners);
    }
    if (typeof window.HAYAT_ACTIVE_PUBLISHED_SETTINGS.overlayOpacity !== 'undefined' && typeof window.setOverlayOpacityFromPublish === 'function') {
      window.setOverlayOpacityFromPublish(window.HAYAT_ACTIVE_PUBLISHED_SETTINGS.overlayOpacity);
    }
    if (typeof window.applyPublishedFieldVisibility === 'function') {
      window.applyPublishedFieldVisibility();
    }
    if (typeof window.applyPublishedLayerVisibility === 'function') {
      window.applyPublishedLayerVisibility(window.HAYAT_ACTIVE_PUBLISHED_SETTINGS.layerVisibility || {});
    }
    window.HAYAT_APPLYING_SETTINGS = false;
  }

  window.saveCurrentPublishSettings = function(){
    try {
      var settings = getCurrentPublishSettings();
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      window.HAYAT_ACTIVE_PUBLISHED_SETTINGS = safeSettings(settings);
      if (typeof window.refreshSyncStatus === 'function') window.refreshSyncStatus();
      return true;
    } catch(e) {
      console.warn('Could not save publish settings', e);
      return false;
    }
  };

  function getLocalPublished(){
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      return safePoints(data) ? {points:data, updated:localStorage.getItem(UPDATED_KEY) || '', settings:getLocalSettings()} : null;
    } catch(e) { return null; }
  }
  function getFilePublished(){
    if (safePoints(window.HAYAT_PUBLISHED_POINTS)) {
      return {points:window.HAYAT_PUBLISHED_POINTS, updated:window.HAYAT_PUBLISHED_UPDATED || '', settings:safeSettings(window.HAYAT_PUBLISHED_SETTINGS)};
    }
    return null;
  }

  window.loadPublishedPoints = function(){
    var local = getLocalPublished();
    var file = getFilePublished();
    var chosen = null;
    if (local && file) chosen = parseDate(local.updated) >= parseDate(file.updated) ? local : file;
    else chosen = local || file;
    var localSettings = getLocalSettings();
    if (chosen) {
      var ok = setPoints(chosen.points);
      window.HAYAT_ACTIVE_DATA_UPDATED = chosen.updated || '';
      window.HAYAT_ACTIVE_DATA_SOURCE = chosen === local ? 'browser publish' : 'published data file';
      setActiveSettings(hasSettings(localSettings) ? localSettings : (chosen.settings || {}));
      return ok;
    }
    window.HAYAT_ACTIVE_DATA_SOURCE = 'built-in inventory';
    window.HAYAT_ACTIVE_DATA_UPDATED = '';
    setActiveSettings(hasSettings(localSettings) ? localSettings : {});
    return false;
  };

  window.publishCurrentPoints = function(){
    try {
      var stamp = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(window.points || []));
      localStorage.setItem(UPDATED_KEY, stamp);
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(getCurrentPublishSettings()));
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
    localStorage.removeItem(SETTINGS_KEY);
    window.HAYAT_ACTIVE_DATA_SOURCE = 'built-in inventory';
    window.HAYAT_ACTIVE_DATA_UPDATED = '';
    setActiveSettings({});
    if (typeof window.refreshSyncStatus === 'function') window.refreshSyncStatus();
  };

  window.generatePublishedDataJS = function(){
    var stamp = new Date().toISOString();
    var json = JSON.stringify(window.points || []);
    var settingsJson = JSON.stringify(getCurrentPublishSettings());
    return '// Hayat Luxury GIS published inventory data\n' +
      '// Generated: ' + stamp + '\n' +
      'window.HAYAT_PUBLISHED_UPDATED = ' + JSON.stringify(stamp) + ';\n' +
      'window.HAYAT_PUBLISHED_SETTINGS = ' + settingsJson + ';\n' +
      'window.HAYAT_PUBLISHED_POINTS = ' + json + ';\n';
  };
  window.downloadPublishedDataFile = function(){
    var js = window.generatePublishedDataJS();
    var blob = new Blob([js], {type:'application/javascript;charset=utf-8'});
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'published_inventory_data.js';
    document.body.appendChild(a);
    a.click();
    setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    window.publishCurrentPoints();
  };

  window.exportWebsiteUpdatePackage = async function(){
    try {
      var adminJS = (typeof window.generateAdminInventoryDataJS === 'function') ? window.generateAdminInventoryDataJS() : ('// Hayat Luxury GIS Admin inventory data\nvar points = ' + JSON.stringify(window.points || []) + ';\n');
      var publishedJS = (typeof window.generatePublishedDataJS === 'function') ? window.generatePublishedDataJS() : '';
      window.publishCurrentPoints();
      if (!window.JSZip) {
        alert('ZIP generator is not loaded. The two data files will download separately instead.');
        if (typeof window.downloadAdminInventoryDataFile === 'function') window.downloadAdminInventoryDataFile();
        window.downloadPublishedDataFile();
        return;
      }
      var zip = new JSZip();
      zip.file('js/admin_inventory_data.js', adminJS);
      zip.file('js/published_inventory_data.js', publishedJS);
      zip.file('README_WEBSITE_UPDATE.txt', 'Upload the files inside this ZIP to the same paths in GitHub.\n\nReplace:\n- js/admin_inventory_data.js\n- js/published_inventory_data.js\n\nAfter committing, wait 2-5 minutes for GitHub Pages and refresh Admin/Agent.\n');
      var blob = await zip.generateAsync({type:'blob'});
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'hayat_gis_website_update.zip';
      document.body.appendChild(a);
      a.click();
      setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 1000);
      alert('Website update ZIP created. Upload its contents to GitHub when you are ready.');
    } catch(e) {
      alert('Could not create website update package: ' + e.message);
    }
  };



  function generateInventoryDataJSForFile(fileLabel){
    var stamp = new Date().toISOString();
    var label = fileLabel || 'Inventory';
    return '// Hayat Luxury GIS ' + label + ' inventory data\n' +
      '// Generated: ' + stamp + '\n' +
      'var points = ' + JSON.stringify(window.points || []) + ';\n';
  }

  function generatePALabelsJSForFile(){
    return '// Auto-generated crisp PA label layer from JAH Master Plan vector PDF.\n' +
      '// Updated from Admin map if any underlying PA points were moved.\n' +
      'window.JAH_PA_LABELS = ' + JSON.stringify(window.JAH_PA_LABELS || []) + ';\n';
  }

  async function fetchPackageFile(path, binary){
    var res = await fetch(path + '?v=' + Date.now(), {cache:'no-store'});
    if(!res.ok) throw new Error(path + ' (' + res.status + ')');
    return binary ? await res.blob() : await res.text();
  }



  window.exportUpdatedMapDataPackage = async function(){
    try {
      if (!window.JSZip) {
        alert('ZIP generator is not loaded. Please keep JSZip enabled.');
        return;
      }
      window.publishCurrentPoints();
      var zip = new JSZip();
      var adminJS = (typeof window.generateAdminInventoryDataJS === 'function') ? window.generateAdminInventoryDataJS() : generateInventoryDataJSForFile('Admin');
      var agentJS = generateInventoryDataJSForFile('Agent');
      var publishedJS = (typeof window.generatePublishedDataJS === 'function') ? window.generatePublishedDataJS() : '';
      var paJS = generatePALabelsJSForFile();
      zip.file('js/admin_inventory_data.js', adminJS);
      zip.file('js/agent_inventory_data.js', agentJS);
      zip.file('js/published_inventory_data.js', publishedJS);
      zip.file('assets/jah_pa_labels.js', paJS);
      zip.file('README_UPDATED_MAP_DATA.txt', 'Hayat Luxury GIS - Updated Map Data Export\nGenerated: ' + new Date().toLocaleString() + '\n\nUpload only these four files to GitHub for normal daily map updates:\n- js/admin_inventory_data.js\n- js/agent_inventory_data.js\n- js/published_inventory_data.js\n- assets/jah_pa_labels.js\n\nDo not place data files in the repository root. Keep each file in its matching folder path.\n\nIncluded inventory records: ' + ((window.points || []).length) + '\n');
      var blob = await zip.generateAsync({type:'blob'});
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'hayat_gis_updated_map_data_' + new Date().toISOString().slice(0,10) + '.zip';
      document.body.appendChild(a);
      a.click();
      setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 1000);
      alert('Updated map data ZIP created. Upload the four files to GitHub in their existing folders.');
    } catch(e) {
      alert('Could not create updated map data package: ' + e.message);
    }
  };

  window.exportFullWebsitePackage = async function(){
    try {
      if (!window.JSZip) {
        alert('ZIP generator is not loaded. Please connect to internet or keep jszip enabled.');
        return;
      }

      window.publishCurrentPoints();

      var zip = new JSZip();
      var adminJS = (typeof window.generateAdminInventoryDataJS === 'function') ? window.generateAdminInventoryDataJS() : generateInventoryDataJSForFile('Admin');
      var agentJS = generateInventoryDataJSForFile('Agent');
      var publishedJS = (typeof window.generatePublishedDataJS === 'function') ? window.generatePublishedDataJS() : '';

      var textFiles = [
        'admin.html','agent.html','index.html',
        'css/admin.css','css/agent.css','css/index.css',
        'js/admin_app.js','js/admin_inline_2.js','js/admin_map.js',
        'js/agent_app.js','js/agent_excel_workflow.js','js/agent_inline_2.js','js/agent_map.js',
        'js/data_normalize.js','js/sync_core.js',
        'assets/jah_pa_labels.js',
        'README_HAYAT_GIS_V3_STABLE.txt','README_SETTINGS_SYNC_FIX.txt','README_V3_0_3_DETAILS_SYNC_FIX.txt','README_V3_1_STABLE.txt'
      ];
      var binaryFiles = ['assets/jah_master_plan_hd.png'];

      var missing = [];
      for (var i=0; i<textFiles.length; i++) {
        var path = textFiles[i];
        try {
          zip.file(path, await fetchPackageFile(path, false));
        } catch(e) {
          missing.push(path);
        }
      }
      for (var j=0; j<binaryFiles.length; j++) {
        var bpath = binaryFiles[j];
        try {
          zip.file(bpath, await fetchPackageFile(bpath, true));
        } catch(e) {
          missing.push(bpath);
        }
      }

      zip.file('js/admin_inventory_data.js', adminJS);
      zip.file('js/agent_inventory_data.js', agentJS);
      zip.file('js/published_inventory_data.js', publishedJS);
      zip.file('assets/jah_pa_labels.js', generatePALabelsJSForFile());

      var notes = 'Hayat Luxury GIS - Full Website Export\n' +
        'Generated: ' + new Date().toLocaleString() + '\n\n' +
        'This ZIP is the full website package for GitHub.\n\n' +
        'How to use:\n' +
        '1. Extract this ZIP.\n' +
        '2. Delete/clear the old GitHub repository files if needed.\n' +
        '3. Upload the extracted folders/files, not the ZIP itself.\n' +
        '4. Keep data files inside the js folder. Do not place them in the root folder.\n\n' +
        'Included live inventory records: ' + ((window.points || []).length) + '\n' +
        'Included data files:\n' +
        '- js/admin_inventory_data.js\n' +
        '- js/agent_inventory_data.js\n' +
        '- js/published_inventory_data.js\n\n' +
        (missing.length ? ('Warning: these static files could not be fetched from this page and were not included:\n- ' + missing.join('\n- ') + '\n\nIf you opened the page by double-clicking the HTML file, use the GitHub Pages link or a local server, then export again.\n') : 'All expected static files were included.\n');
      zip.file('README_FULL_WEBSITE_EXPORT.txt', notes);

      var blob = await zip.generateAsync({type:'blob'});
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'hayat_gis_full_website_package_' + new Date().toISOString().slice(0,10) + '.zip';
      document.body.appendChild(a);
      a.click();
      setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 1000);
      alert(missing.length ? 'Full website ZIP created, but some static files were missing. Read README_FULL_WEBSITE_EXPORT.txt inside the ZIP.' : 'Full website ZIP created. Upload the extracted folders/files to GitHub.');
    } catch(e) {
      alert('Could not create full website package: ' + e.message);
    }
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
        var sm = txt.match(/window\.HAYAT_PUBLISHED_SETTINGS\s*=\s*([\s\S]*?);\s*window\.HAYAT_PUBLISHED_POINTS/m);
        var importedSettings = sm ? safeSettings(JSON.parse(sm[1])) : {};
        window.points = data;
        try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(importedSettings)); } catch(e) {}
        setActiveSettings(importedSettings);
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
