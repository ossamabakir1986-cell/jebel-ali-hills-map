(function(){
  function byId(id){ return document.getElementById(id); }
  function safeText(v){ return (v === null || v === undefined) ? '' : String(v); }
  function clean(v){ return safeText(v).trim(); }
  function n(v){
    var s = safeText(v).replace(/,/g,'').trim();
    if (!s) return null;
    var x = Number(s);
    return isNaN(x) ? null : x;
  }
  function fmtNum(x){ return (x === null || x === undefined || isNaN(x)) ? '' : Number(x).toLocaleString(undefined,{maximumFractionDigits:2}); }
  function fmtMoney(x){ return (x === null || x === undefined || isNaN(x)) ? '' : Math.round(Number(x)).toLocaleString(); }
  function gfaPct(gfa){
    var g = safeText(gfa).toUpperCase().replace(/\s/g,'');
    if (g.indexOf('G+4') !== -1) return 2.20;
    if (g.indexOf('G+1') !== -1) return 0.65;
    return null;
  }
  function updateDerived(p){
    p.size = n(p.size);
    p.price = n(p.price);
    p.secondPrice = n(p.secondPrice);
    p.sizeText = p.size !== null ? fmtNum(p.size) : '';
    p.priceText = p.price !== null ? fmtMoney(p.price) : '';
    p.total = (p.size !== null && p.price !== null) ? p.size * p.price : null;
    p.totalText = p.total !== null ? fmtMoney(p.total) : '';
    p.deposit = p.total !== null ? p.total * 0.10 : null;
    p.depositText = p.deposit !== null ? fmtMoney(p.deposit) : '';
    p.commission = p.total !== null ? p.total * 0.02 : null;
    p.commissionText = p.commission !== null ? fmtMoney(p.commission) : '';
    var pct = gfaPct(p.gfa);
    p.gfaPct = pct !== null ? Math.round(pct * 100) : null;
    p.gfaAllowed = (p.size !== null && pct !== null) ? p.size * pct : null;
    p.gfaAllowedText = p.gfaAllowed !== null ? fmtNum(p.gfaAllowed) : '';
    p.secondPriceText = p.secondPrice !== null ? fmtMoney(p.secondPrice) : '';
    p.secondTotal = (p.size !== null && p.secondPrice !== null) ? p.size * p.secondPrice : null;
    p.secondTotalText = p.secondTotal !== null ? fmtMoney(p.secondTotal) : '';
    p.secondDeposit = p.secondTotal !== null ? p.secondTotal * 0.10 : null;
    p.secondDepositText = p.secondDeposit !== null ? fmtMoney(p.secondDeposit) : '';
    p.secondCommission = p.secondTotal !== null ? p.secondTotal * 0.02 : null;
    p.secondCommissionText = p.secondCommission !== null ? fmtMoney(p.secondCommission) : '';
    p.mapsUrl = (p.lat && p.lon) ? ('https://www.google.com/maps?q=' + p.lat + ',' + p.lon) : (p.mapsUrl || '');
    return p;
  }
  function normalizeColor(v){
    if (window.HayatDataNormalize && window.HayatDataNormalize.normalizeColor) {
      return window.HayatDataNormalize.normalizeColor(v) || 'Red';
    }
    var s = clean(v).toLowerCase();
    if (s === 'direct' || s === 'red') return 'Red';
    if (s === 'through broker' || s === 'throughbroker' || s === 'blue') return 'Blue';
    if (s === 'on hold' || s === 'onhold' || s === 'pink') return 'Pink';
    if (!s) return 'Red';
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  function normalizeType(v){
    return (window.HayatDataNormalize && window.HayatDataNormalize.normalizeType) ? window.HayatDataNormalize.normalizeType(v) : clean(v).replace(/\s+/g,' ').replace(/\b\w/g,function(c){return c.toUpperCase();});
  }
  function normalizeAgent(v){
    return (window.HayatDataNormalize && window.HayatDataNormalize.normalizeAgent) ? window.HayatDataNormalize.normalizeAgent(v) : clean(v);
  }
  function pointKey(p){ return clean(p.gisPlot) || clean(p.masterPlot); }
  function agentNames(){
    var set = {};
    (window.points || []).forEach(function(p){
      if (clean(p.agent)) set[clean(p.agent)] = true;
      if (clean(p.secondAgent)) set[clean(p.secondAgent)] = true;
    });
    return Object.keys(set).sort();
  }
  function populateAgentExportSelect(){
    var sel = byId('agentExportSelect');
    if (!sel) return;
    var current = sel.value;
    sel.innerHTML = '<option value="">Select agent to export</option>' + agentNames().map(function(a){ return '<option value="' + esc(a) + '">' + esc(a) + '</option>'; }).join('');
    if (current) sel.value = current;
  }
  var ORIGINAL_HEADERS = [
    'GIS plot number','coordinates','Master Plan Plot','agent name','Mobile','Size','price per sqrf','color','type','Phase','GFA','second agent name','Second agent number','Second Price','second color','comment'
  ];
  var LOCKED_HEADERS = {
    'GIS plot number':true,
    'coordinates':true,
    'Master Plan Plot':true,
    'agent name':true,
    'Size':true,
    'Phase':true,
    'GFA':true
  };
  var EDITABLE_HEADERS = {
    'Mobile':true,
    'price per sqrf':true,
    'color':true,
    'type':true,
    'second agent name':true,
    'Second agent number':true,
    'Second Price':true,
    'second color':true,
    'comment':true
  };
  function rowForExportArray(p){
    return [
      p.gisPlot || '',
      p.coords || '',
      p.masterPlot || '',
      normalizeAgent(p.agent) || '',
      p.mobile || '',
      p.size || '',
      p.price || '',
      normalizeColor(p.color) || '',
      normalizeType(p.type) || '',
      p.phase || '',
      p.gfa || '',
      normalizeAgent(p.secondAgent) || '',
      p.secondMobile || '',
      p.secondPrice || '',
      normalizeColor(p.secondColor) || '',
      p.comment || ''
    ];
  }
  function makeInventorySheet(points){
    var data = [ORIGINAL_HEADERS].concat(points.map(rowForExportArray));
    var ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [
      {wch:16},{wch:24},{wch:18},{wch:22},{wch:18},{wch:12},{wch:14},{wch:12},
      {wch:16},{wch:10},{wch:10},{wch:22},{wch:18},{wch:14},{wch:12},{wch:35}
    ];
    ws['!autofilter'] = { ref: XLSX.utils.encode_range({s:{r:0,c:0}, e:{r:data.length-1,c:ORIGINAL_HEADERS.length-1}}) };
    ws['!freeze'] = { xSplit:0, ySplit:1 };
    // SheetJS CE supports worksheet protection; editable cells are marked unlocked.
    ws['!protect'] = { password:'hayat', selectLockedCells:true, selectUnlockedCells:true, formatCells:false, formatColumns:false, formatRows:false, insertRows:false, insertColumns:false, deleteRows:false, deleteColumns:false, sort:true, autoFilter:true };
    for (var R=0; R<data.length; R++){
      for (var C=0; C<ORIGINAL_HEADERS.length; C++){
        var addr = XLSX.utils.encode_cell({r:R,c:C});
        if (!ws[addr]) ws[addr] = {t:'s', v:''};
        ws[addr].s = ws[addr].s || {};
        if (R === 0) {
          ws[addr].s = { font:{bold:true, color:{rgb:'FFFFFF'}}, fill:{fgColor:{rgb:'10211D'}}, alignment:{horizontal:'center'}, protection:{locked:true} };
        } else if (EDITABLE_HEADERS[ORIGINAL_HEADERS[C]]) {
          ws[addr].s.protection = { locked:false };
          ws[addr].s.fill = { fgColor:{rgb:'FFF3CD'} };
        } else {
          ws[addr].s.protection = { locked:true };
          ws[addr].s.fill = { fgColor:{rgb:'E9ECEF'} };
        }
      }
    }
    return ws;
  }
  function makeNewPlotSheet(agent){
    var rows = [ORIGINAL_HEADERS];
    for (var i=0;i<25;i++){
      rows.push(['','', '', agent || '', '', '', '', 'Red', 'Plot', '', 'G+1', '', '', '', '', '']);
    }
    var ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [
      {wch:16},{wch:24},{wch:18},{wch:22},{wch:18},{wch:12},{wch:14},{wch:12},
      {wch:16},{wch:10},{wch:10},{wch:22},{wch:18},{wch:14},{wch:12},{wch:35}
    ];
    ws['!autofilter'] = { ref: XLSX.utils.encode_range({s:{r:0,c:0}, e:{r:rows.length-1,c:ORIGINAL_HEADERS.length-1}}) };
    for (var C=0; C<ORIGINAL_HEADERS.length; C++){
      var addr = XLSX.utils.encode_cell({r:0,c:C});
      if (ws[addr]) ws[addr].s = { font:{bold:true, color:{rgb:'FFFFFF'}}, fill:{fgColor:{rgb:'1F3F37'}}, alignment:{horizontal:'center'} };
    }
    return ws;
  }
  function sheetFromJson(rows){ return XLSX.utils.json_to_sheet(rows); }

  function exportAgentWorkbook(){
    if (window.HayatDataNormalize) window.HayatDataNormalize.normalizeAllPoints();
    var agent = clean(byId('agentExportSelect') && byId('agentExportSelect').value);
    if (!agent) { alert('Please select an agent first.'); return; }
    var rows = (window.points || []).filter(function(p){ return clean(p.agent) === agent || clean(p.secondAgent) === agent; });
    if (!rows.length) { alert('No plots found for this agent.'); return; }
    if (window.ExcelJS) {
      exportAgentWorkbookExcelJS(agent, rows).catch(function(err){
        console.error(err);
        alert('Excel export failed: ' + (err && err.message ? err.message : err));
      });
    } else {
      alert('Excel protection library did not load. Please check your internet connection and reload the page.');
    }
  }

  async function exportAgentWorkbookExcelJS(agent, rows){
    var wb = new ExcelJS.Workbook();
    wb.creator = 'Hayat Luxury GIS';
    wb.created = new Date();

    var inst = wb.addWorksheet('Instructions');
    inst.columns = [{width:34},{width:90}];
    [
      ['Hayat Luxury GIS - Agent Update Workbook'],
      ['Agent', agent],
      ['Exported', new Date().toLocaleString()],
      [''],
      ['Agent Inventory uses the same column order as the original Jebel Ali Hills inventory Excel.'],
      ['Grey columns are fixed/protected. Yellow columns are editable by the agent.'],
      ['Editable columns: Mobile, price per sqrf, color, type, second agent name, Second agent number, Second Price, second color, comment.'],
      ['Do not change fixed fields: GIS plot number, coordinates, Master Plan Plot, agent name, Size, Phase, or GFA.'],
      ['To add a new plot, use the New Plot Requests sheet. Coordinates are required for a new plot to appear on the map.'],
      ['Protected sheet password, if needed by Admin: hayat']
    ].forEach(function(r){ inst.addRow(r); });
    inst.getRow(1).font = {bold:true, size:14};

    var sh = wb.addWorksheet('Agent Inventory', {views:[{state:'frozen', ySplit:1}]});
    sh.columns = ORIGINAL_HEADERS.map(function(h, i){
      var widths = [16,24,18,22,18,12,14,12,16,10,10,22,18,14,12,35];
      return {header:h, key:'c'+i, width:widths[i] || 14};
    });
    sh.getRow(1).eachCell(function(cell){
      cell.font = {bold:true, color:{argb:'FFFFFFFF'}};
      cell.fill = {type:'pattern', pattern:'solid', fgColor:{argb:'FF10211D'}};
      cell.alignment = {horizontal:'center'};
      cell.protection = {locked:true};
    });
    rows.forEach(function(p){ sh.addRow(rowForExportArray(p)); });
    for (var r=2; r<=sh.rowCount; r++){
      for (var c=1; c<=ORIGINAL_HEADERS.length; c++){
        var h = ORIGINAL_HEADERS[c-1];
        var cell = sh.getCell(r,c);
        cell.protection = {locked: !EDITABLE_HEADERS[h]};
        cell.fill = {type:'pattern', pattern:'solid', fgColor:{argb: EDITABLE_HEADERS[h] ? 'FFFFF3CD' : 'FFE9ECEF'}};
        cell.border = {top:{style:'thin',color:{argb:'FFD9D9D9'}},left:{style:'thin',color:{argb:'FFD9D9D9'}},bottom:{style:'thin',color:{argb:'FFD9D9D9'}},right:{style:'thin',color:{argb:'FFD9D9D9'}}};
      }
    }
    sh.autoFilter = {from:{row:1,column:1}, to:{row:Math.max(1,sh.rowCount), column:ORIGINAL_HEADERS.length}};
    await sh.protect('hayat', {
      selectLockedCells:true, selectUnlockedCells:true,
      formatCells:false, formatColumns:true, formatRows:true,
      insertRows:false, insertColumns:false, deleteRows:false, deleteColumns:false,
      sort:true, autoFilter:true
    });

    var np = wb.addWorksheet('New Plot Requests', {views:[{state:'frozen', ySplit:1}]});
    np.columns = ORIGINAL_HEADERS.map(function(h,i){
      var widths = [16,24,18,22,18,12,14,12,16,10,10,22,18,14,12,35];
      return {header:h, key:'c'+i, width:widths[i] || 14};
    });
    np.getRow(1).eachCell(function(cell){
      cell.font = {bold:true, color:{argb:'FFFFFFFF'}};
      cell.fill = {type:'pattern', pattern:'solid', fgColor:{argb:'FF1F3F37'}};
      cell.alignment = {horizontal:'center'};
    });
    for (var i=0; i<25; i++){
      var arr = ['', '', '', agent || '', '', '', '', 'Red', 'Plot', '', 'G+1', '', '', '', '', ''];
      np.addRow(arr);
    }
    for (var rr=2; rr<=np.rowCount; rr++){
      for (var cc=1; cc<=ORIGINAL_HEADERS.length; cc++){
        var ncell = np.getCell(rr,cc);
        ncell.fill = {type:'pattern', pattern:'solid', fgColor:{argb:'FFFFFFFF'}};
        ncell.protection = {locked:false};
      }
    }
    np.autoFilter = {from:{row:1,column:1}, to:{row:np.rowCount, column:ORIGINAL_HEADERS.length}};

    var safeAgent = agent.replace(/[^a-z0-9]+/gi,'_').replace(/^_+|_+$/g,'');
    var buffer = await wb.xlsx.writeBuffer();
    var blob = new Blob([buffer], {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'JAH_Agent_Update_' + safeAgent + '.xlsx';
    document.body.appendChild(a);
    a.click();
    setTimeout(function(){ URL.revokeObjectURL(url); a.remove(); }, 1000);
    status('Exported ' + rows.length + ' plots for ' + agent + '. Yellow cells are editable; grey cells are locked.');
  }
  function status(msg){ var el = byId('agentWorkflowStatus'); if (el) el.textContent = msg; }
  function getField(row, names){
    var map = {};
    Object.keys(row || {}).forEach(function(k){ map[String(k).trim().toLowerCase()] = row[k]; });
    for (var i=0;i<names.length;i++){
      var key = names[i].toLowerCase();
      if (map[key] !== undefined && clean(map[key]) !== '') return map[key];
    }
    return '';
  }
  function parseLatLon(row){
    var lat = n(getField(row, ['Latitude','Lat']));
    var lon = n(getField(row, ['Longitude','Lng','Lon']));
    if (lat !== null && lon !== null) return {lat:lat, lon:lon};
    var coords = clean(getField(row, ['Coordinates','Coordinate']));
    if (coords && typeof parseCoordsBrowser === 'function') {
      var c = parseCoordsBrowser(coords);
      if (c && c.lat && c.lon) return {lat:c.lat, lon:c.lon};
    }
    return null;
  }
  function applyEditableFields(p, row){
    // Existing plot import deliberately ignores fixed fields even if an agent unlocks the sheet.
    var before = JSON.stringify({mobile:p.mobile,color:p.color,price:p.price,type:p.type,secondAgent:p.secondAgent,secondMobile:p.secondMobile,secondPrice:p.secondPrice,secondColor:p.secondColor,comment:p.comment});
    var v;
    v = getField(row, ['Mobile']); if (clean(v)) p.mobile = clean(v);
    v = getField(row, ['color','Color / Status','Color','Status']); if (clean(v)) p.color = normalizeColor(v);
    v = getField(row, ['price per sqrf','Price per sqrf','Price per sqft','Price/sqft','Price']); if (clean(v)) p.price = n(v);
    v = getField(row, ['type','Type']); if (clean(v)) p.type = normalizeType(v);
    v = getField(row, ['second agent name','Second Agent name','Second Agent']); if (clean(v)) p.secondAgent = clean(v);
    v = getField(row, ['Second agent number','second agent number','Second Mobile']); if (clean(v)) p.secondMobile = clean(v);
    v = getField(row, ['Second Price']); if (clean(v)) p.secondPrice = n(v);
    v = getField(row, ['second color','Second Color']); if (clean(v)) p.secondColor = normalizeColor(v);
    v = getField(row, ['comment','Comment','Comments','Note']); p.comment = clean(v);
    updateDerived(p);
    var after = JSON.stringify({mobile:p.mobile,color:p.color,price:p.price,type:p.type,secondAgent:p.secondAgent,secondMobile:p.secondMobile,secondPrice:p.secondPrice,secondColor:p.secondColor,comment:p.comment});
    return before !== after;
  }
  function pointFromNewRequest(row){
    var gis = clean(getField(row, ['GIS plot number','Plot number','Plot']));
    var pa = clean(getField(row, ['Master Plan Plot','PA Plot','PA']));
    if (!gis && !pa) return null;
    var ll = parseLatLon(row);
    if (!ll) return null;
    var p = {
      row: (window.points || []).length + 2,
      gisPlot: gis || pa,
      masterPlot: pa,
      lat: ll.lat,
      lon: ll.lon,
      coords: clean(getField(row, ['Coordinates'])) || (ll.lat + ',' + ll.lon),
      mapsUrl: '',
      agent: normalizeAgent(getField(row, ['agent name','Agent name','Agent'])),
      mobile: clean(getField(row, ['Mobile'])),
      size: n(getField(row, ['Size'])),
      price: n(getField(row, ['price per sqrf','Price per sqrf','Price per sqft','Price'])),
      color: normalizeColor(getField(row, ['color','Color / Status','Color','Status'])),
      type: normalizeType(getField(row, ['type','Type'])) || 'Plot',
      phase: clean(getField(row, ['Phase','phase'])),
      gfa: clean(getField(row, ['GFA','gfa'])) || 'G+1',
      secondAgent: normalizeAgent(getField(row, ['second agent name','Second Agent name','Second Agent'])), secondMobile: clean(getField(row, ['Second agent number','second agent number','Second Mobile'])), secondPrice: n(getField(row, ['Second Price'])), secondColor: normalizeColor(getField(row, ['second color','Second Color'])), comment: clean(getField(row, ['comment','Comment','Comments','Note']))
    };
    return updateDerived(p);
  }
  function importAgentWorkbook(event){
    if (window.HayatDataNormalize) window.HayatDataNormalize.normalizeAllPoints();
    var file = event.target.files && event.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(e){
      try {
        var wb = XLSX.read(new Uint8Array(e.target.result), {type:'array'});
        var invSheet = wb.Sheets['Agent Inventory'] || wb.Sheets[wb.SheetNames[0]];
        var rows = invSheet ? XLSX.utils.sheet_to_json(invSheet, {defval:''}) : [];
        var byGis = {}, byPa = {};
        (window.points || []).forEach(function(p){ if(clean(p.gisPlot)) byGis[clean(p.gisPlot)] = p; if(clean(p.masterPlot)) byPa[clean(p.masterPlot)] = p; });
        var updated = 0, skipped = 0;
        rows.forEach(function(r){
          var gis = clean(getField(r, ['GIS plot number','Plot number','Plot']));
          var pa = clean(getField(r, ['Master Plan Plot','PA Plot','PA']));
          var p = (gis && byGis[gis]) || (pa && byPa[pa]);
          if (!p) { skipped++; return; }
          if (applyEditableFields(p, r)) updated++;
        });
        var newRows = [];
        if (wb.Sheets['New Plot Requests']) newRows = XLSX.utils.sheet_to_json(wb.Sheets['New Plot Requests'], {defval:''});
        var added = 0, invalidNew = 0, duplicateNew = 0;
        newRows.forEach(function(r){
          var p = pointFromNewRequest(r);
          if (!p) { var hasAny = Object.keys(r).some(function(k){ return clean(r[k]); }); if (hasAny) invalidNew++; return; }
          if ((p.gisPlot && byGis[p.gisPlot]) || (p.masterPlot && byPa[p.masterPlot])) { duplicateNew++; return; }
          window.points.push(p); if(p.gisPlot) byGis[p.gisPlot]=p; if(p.masterPlot) byPa[p.masterPlot]=p; added++;
        });
        if (typeof publishCurrentPoints === 'function') publishCurrentPoints();
        if (typeof refreshFilterOptionsFromPoints === 'function') refreshFilterOptionsFromPoints();
        if (typeof applyFilters === 'function') applyFilters();
        populateAgentExportSelect();
        status('Import complete: ' + updated + ' updated, ' + added + ' new plots added, ' + skipped + ' skipped, ' + duplicateNew + ' duplicate new, ' + invalidNew + ' invalid new. Agent map will reflect after refresh on the same hosted domain.');
      } catch(err) {
        alert('Could not import agent workbook: ' + err.message);
      } finally {
        event.target.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  }
  window.exportAgentWorkbook = exportAgentWorkbook;
  window.importAgentWorkbook = importAgentWorkbook;
  window.populateAgentExportSelect = populateAgentExportSelect;
  setTimeout(function(){ if (window.HayatDataNormalize) window.HayatDataNormalize.normalizeAllPoints(); populateAgentExportSelect(); if (typeof refreshFilterOptionsFromPoints === 'function') refreshFilterOptionsFromPoints(); }, 0);
})();
