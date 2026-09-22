(function(){
  'use strict';

  var IMAGE_W = 4764;
  var IMAGE_H = 3368;
  var PREVIEW_W = 1680;
  var SOURCE_IMAGE = 'assets/jah_master_plan_hd.png';
  var STATUS = {
    Red:{name:'Direct', dot:'#b91c1c', fill:'#fee2e2', border:'#991b1b'},
    Pink:{name:'On hold', dot:'#db2777', fill:'#fce7f3', border:'#be185d'},
    Blue:{name:'Through broker', dot:'#0369a1', fill:'#dbeafe', border:'#075985'},
    Other:{name:'Other', dot:'#374151', fill:'#e5e7eb', border:'#1f2937'}
  };

  var context = readContext();
  var selectedIds = new Set((context.selected || []).map(String));
  var filteredIds = new Set((context.filtered || []).map(String));
  var image = new Image();
  var inventory = [];
  var drawStart = null;
  var drawBox = null;
  var renderMeta = null;
  var renderTimer = null;
  var panStart = null;
  var labelDrag = null;
  var labelDragFrame = null;
  var manualLabelOffsets = new Map();
  var ready = false;
  var state = {
    mode:queryMode(),
    drawCrop:null,
    fields:new Set(['price','master','size']),
    avoidOverlap:true,
    showLeaderLines:true,
    showDots:true,
    showLegend:true,
    showWatermark:true,
    scope:selectedIds.size ? 'selected' : (filteredIds.size ? 'filtered' : 'priced'),
    search:'', agent:'', phase:'', status:'', pricing:'',
    title:'Jebel Ali Hills — Selected Plots',
    subtitle:''
  };

  var els = {};

  function $(id){ return document.getElementById(id); }
  function clamp(v,min,max){ return Math.max(min,Math.min(max,v)); }
  function clean(v){ return String(v == null ? '' : v).replace(/\s+/g,' ').trim(); }
  function unique(list){ return Array.from(new Set(list.filter(Boolean))); }
  function statusFor(color){ return STATUS[color] || STATUS.Other; }
  function pointKey(p){ return clean(p&&p.gisPlot)||[clean(p&&p.masterPlot),Number(p&&p.lat).toFixed(6),Number(p&&p.lon).toFixed(6)].join('|'); }

  function readContext(){
    var params=new URLSearchParams(location.search);
    var token=params.get('handoff');
    if(token){
      try {
        var handoff=JSON.parse(localStorage.getItem('JAH_CAPTURE_HANDOFF_V1') || '{}') || {};
        if(handoff.token===token && handoff.context){
          sessionStorage.setItem('JAH_CAPTURE_CONTEXT_V1',JSON.stringify(handoff.context));
          return handoff.context;
        }
      } catch(e) {}
    }
    try {
      var saved=JSON.parse(sessionStorage.getItem('JAH_CAPTURE_CONTEXT_V1') || '{}') || {};
      if(saved.selected || saved.filtered || saved.bounds) return saved;
    } catch(e) {}
    var selected=(params.get('plots') || '').split(',').map(clean).filter(Boolean);
    var filtered=(params.get('filtered') || '').split(',').map(clean).filter(Boolean);
    var rawBounds=(params.get('bounds') || '').split(',').map(Number);
    var bounds=rawBounds.length===4 && rawBounds.every(isFinite) ? {north:rawBounds[0],south:rawBounds[1],east:rawBounds[2],west:rawBounds[3]} : null;
    return {version:1,source:'link',selected:selected,filtered:filtered,bounds:bounds};
  }

  function queryMode(){
    var mode = new URLSearchParams(location.search).get('mode') || '';
    if(['full','current','filtered','selected','draw'].indexOf(mode) === -1) mode = 'full';
    return mode;
  }

  function publishedCorners(){
    var settings = window.HAYAT_PUBLISHED_SETTINGS || {};
    return settings.overlayCorners || {
      tl:[24.919666067631066,54.94266558388461],
      tr:[24.919819914418028,55.00208048799185],
      bl:[24.881341646409087,54.942764658207274]
    };
  }

  function geoToImage(lat,lon){
    var c = publishedCorners();
    var ax = Number(c.tr[1]) - Number(c.tl[1]);
    var ay = Number(c.tr[0]) - Number(c.tl[0]);
    var bx = Number(c.bl[1]) - Number(c.tl[1]);
    var by = Number(c.bl[0]) - Number(c.tl[0]);
    var px = Number(lon) - Number(c.tl[1]);
    var py = Number(lat) - Number(c.tl[0]);
    var det = ax * by - ay * bx;
    if(!isFinite(det) || Math.abs(det) < 1e-12) return {x:0,y:0};
    var u = (px * by - py * bx) / det;
    var v = (ax * py - ay * px) / det;
    return {x:u * IMAGE_W, y:v * IMAGE_H};
  }

  function fullCrop(){ return {x:0,y:0,w:IMAGE_W,h:IMAGE_H}; }

  function normalizedCrop(crop){
    crop = crop || fullCrop();
    var x1 = clamp(Math.min(crop.x,crop.x+crop.w),0,IMAGE_W);
    var x2 = clamp(Math.max(crop.x,crop.x+crop.w),0,IMAGE_W);
    var y1 = clamp(Math.min(crop.y,crop.y+crop.h),0,IMAGE_H);
    var y2 = clamp(Math.max(crop.y,crop.y+crop.h),0,IMAGE_H);
    if(x2-x1 < 80 || y2-y1 < 80) return fullCrop();
    return {x:x1,y:y1,w:x2-x1,h:y2-y1};
  }

  function cropFromBounds(bounds){
    if(!bounds || !isFinite(bounds.north) || !isFinite(bounds.south) || !isFinite(bounds.east) || !isFinite(bounds.west)) return null;
    var pts = [
      geoToImage(bounds.north,bounds.west), geoToImage(bounds.north,bounds.east),
      geoToImage(bounds.south,bounds.west), geoToImage(bounds.south,bounds.east)
    ];
    var xs=pts.map(function(p){return p.x;}), ys=pts.map(function(p){return p.y;});
    return normalizedCrop({x:Math.min.apply(null,xs),y:Math.min.apply(null,ys),w:Math.max.apply(null,xs)-Math.min.apply(null,xs),h:Math.max.apply(null,ys)-Math.min.apply(null,ys)});
  }

  function cropAroundPoints(list){
    if(!list.length) return null;
    var pts=list.map(function(p){return geoToImage(p.lat,p.lon);});
    var xs=pts.map(function(p){return p.x;}), ys=pts.map(function(p){return p.y;});
    var minX=Math.min.apply(null,xs), maxX=Math.max.apply(null,xs);
    var minY=Math.min.apply(null,ys), maxY=Math.max.apply(null,ys);
    var pad=Math.max(180,Math.max(maxX-minX,maxY-minY)*.18);
    return normalizedCrop({x:minX-pad,y:minY-pad,w:(maxX-minX)+(pad*2),h:(maxY-minY)+(pad*2)});
  }

  function currentCrop(){
    if(state.mode === 'draw' && state.drawCrop) return normalizedCrop(state.drawCrop);
    if(state.phase) {
      var phasePlots=inventory.filter(function(p){return clean(p.phase)===state.phase;});
      var phaseCrop=cropAroundPoints(phasePlots);
      if(phaseCrop) return phaseCrop;
    }
    if(state.mode === 'current') return cropFromBounds(context.bounds) || fullCrop();
    if(state.mode === 'filtered') {
      var filtered=inventory.filter(function(p){return filteredIds.has(String(p.gisPlot));});
      return cropAroundPoints(filtered) || cropFromBounds(context.bounds) || fullCrop();
    }
    if(state.mode === 'selected') {
      var selected=inventory.filter(function(p){return selectedIds.has(String(p.gisPlot));});
      return cropAroundPoints(selected) || cropFromBounds(context.bounds) || fullCrop();
    }
    return fullCrop();
  }

  function loadInventory(){
    var source = Array.isArray(window.points) ? window.points : (window.HAYAT_PUBLISHED_POINTS || []);
    var normalized = source.map(function(p){
      var copy=Object.assign({},p);
      if(window.HayatDataNormalize && window.HayatDataNormalize.normalizePoint) window.HayatDataNormalize.normalizePoint(copy);
      return copy;
    }).filter(function(p){return isFinite(Number(p.lat)) && isFinite(Number(p.lon));});
    var byPlot=new Map();
    normalized.forEach(function(p){
      var key=clean(p.gisPlot)||[clean(p.masterPlot),Number(p.lat).toFixed(6),Number(p.lon).toFixed(6)].join('|');
      var existing=byPlot.get(key);
      if(!existing || Number(p.row||0)>=Number(existing.row||0)) byPlot.set(key,p);
    });
    inventory=Array.from(byPlot.values());
  }

  function populateFilters(){
    setOptions(els.agentFilter,unique(inventory.reduce(function(a,p){a.push(clean(p.agent),clean(p.secondAgent));return a;},[])),'All agents');
    setOptions(els.phaseFilter,unique(inventory.map(function(p){return clean(p.phase);})).sort(numericSort),'All phases');
  }

  function numericSort(a,b){return String(a).localeCompare(String(b),undefined,{numeric:true,sensitivity:'base'});}

  function setOptions(select,values,first){
    select.innerHTML='';
    var base=document.createElement('option'); base.value=''; base.textContent=first; select.appendChild(base);
    values.sort(numericSort).forEach(function(value){var o=document.createElement('option');o.value=value;o.textContent=value;select.appendChild(o);});
  }

  function visiblePoints(){
    var search=state.search.toLowerCase();
    var list=inventory.filter(function(p){
      if(state.scope === 'selected' && !selectedIds.has(String(p.gisPlot))) return false;
      if(state.scope === 'filtered' && !filteredIds.has(String(p.gisPlot))) return false;
      if(state.scope === 'priced' && !p.price && !p.secondPrice) return false;
      if(search && [p.gisPlot,p.masterPlot,p.agent,p.secondAgent].map(clean).join(' ').toLowerCase().indexOf(search)===-1) return false;
      if(state.agent && clean(p.agent)!==state.agent && clean(p.secondAgent)!==state.agent) return false;
      if(state.phase && clean(p.phase)!==state.phase) return false;
      if(state.status && clean(p.color)!==state.status && clean(p.secondColor)!==state.status) return false;
      if(state.pricing==='priced' && !p.price && !p.secondPrice) return false;
      if(state.pricing==='unpriced' && (p.price || p.secondPrice)) return false;
      return true;
    });
    var crop=currentCrop();
    return list.filter(function(p){
      var q=geoToImage(p.lat,p.lon);
      return q.x>=crop.x && q.x<=crop.x+crop.w && q.y>=crop.y && q.y<=crop.y+crop.h;
    });
  }

  function labelLines(p){
    var lines=[];
    if(state.fields.has('price')) {
      if(p.priceText || p.price) {
        var price='AED '+clean(p.priceText || Math.round(p.price));
        if(p.secondPriceText || p.secondPrice) price+=' / '+clean(p.secondPriceText || Math.round(p.secondPrice));
        lines.push(price+' / sqft');
      } else lines.push('Price on request');
    }
    if(state.fields.has('master') && p.masterPlot) lines.push(clean(p.masterPlot).replace(/-/g,'_'));
    if(state.fields.has('gis') && p.gisPlot) lines.push('GIS '+clean(p.gisPlot));
    if(state.fields.has('size') && (p.sizeText || p.size)) lines.push(clean(p.sizeText || Number(p.size).toLocaleString())+' sqft');
    if(state.fields.has('total')) {
      if(p.totalText || p.total) lines.push('Total AED '+clean(p.totalText || Math.round(p.total).toLocaleString()));
      if((p.secondTotalText || p.secondTotal) && !state.fields.has('secondOffer')) lines.push('Total 2 AED '+clean(p.secondTotalText || Math.round(p.secondTotal).toLocaleString()));
    }
    if(state.fields.has('deposit')) {
      if(p.depositText || p.deposit) lines.push('Deposit AED '+clean(p.depositText || Math.round(p.deposit).toLocaleString()));
      if((p.secondDepositText || p.secondDeposit) && !state.fields.has('secondOffer')) lines.push('Deposit 2 AED '+clean(p.secondDepositText || Math.round(p.secondDeposit).toLocaleString()));
    }
    if(state.fields.has('commission')) {
      if(p.commissionText || p.commission) lines.push('Commission AED '+clean(p.commissionText || Math.round(p.commission).toLocaleString()));
      if((p.secondCommissionText || p.secondCommission) && !state.fields.has('secondOffer')) lines.push('Commission 2 AED '+clean(p.secondCommissionText || Math.round(p.secondCommission).toLocaleString()));
    }
    if(state.fields.has('agent') && p.agent) lines.push('Agent '+clean(p.agent));
    if(state.fields.has('mobile') && p.mobile) lines.push(clean(p.mobile));
    if(state.fields.has('secondOffer') && (p.secondAgent || p.secondPrice || p.secondMobile)) {
      var offer='Offer 2';
      if(p.secondPriceText || p.secondPrice) offer+=' · AED '+clean(p.secondPriceText || Math.round(p.secondPrice))+'/sqft';
      lines.push(offer);
      if(p.secondAgent) lines.push('Agent 2 '+clean(p.secondAgent));
      if(state.fields.has('mobile') && p.secondMobile) lines.push(clean(p.secondMobile));
      if(state.fields.has('total') && (p.secondTotalText || p.secondTotal)) lines.push('Total 2 AED '+clean(p.secondTotalText || Math.round(p.secondTotal).toLocaleString()));
      if(state.fields.has('deposit') && (p.secondDepositText || p.secondDeposit)) lines.push('Deposit 2 AED '+clean(p.secondDepositText || Math.round(p.secondDeposit).toLocaleString()));
      if(state.fields.has('commission') && (p.secondCommissionText || p.secondCommission)) lines.push('Commission 2 AED '+clean(p.secondCommissionText || Math.round(p.secondCommission).toLocaleString()));
    }
    if(state.fields.has('type') && p.type) lines.push('Type '+clean(p.type));
    if(state.fields.has('phase') && p.phase) lines.push('Phase '+clean(p.phase));
    if(state.fields.has('gfa')) {
      if(p.gfa) lines.push('GFA '+clean(p.gfa));
      if(p.gfaAllowedText || p.gfaAllowed) lines.push('Allowed '+clean(p.gfaAllowedText || Math.round(p.gfaAllowed).toLocaleString())+' sqft'+(p.gfaPct?' ('+clean(p.gfaPct)+'%)':''));
    }
    if(state.fields.has('features') && p.features) lines.push(clean(p.features));
    if(state.fields.has('comment') && p.comment) lines.push('Comment '+clean(p.comment));
    if(state.fields.has('coordinates') && p.coords) lines.push(clean(p.coords));
    if(state.fields.has('status')) lines.push('Status '+statusFor(p.color).name);
    if(state.fields.has('updated') && (p.lastUpdated || p.lastDateUpdated)) lines.push('Updated '+clean(p.lastUpdated || p.lastDateUpdated));
    if(!lines.length) lines.push(clean(p.masterPlot || p.gisPlot));
    return lines;
  }

  function rectOverlap(a,b,pad){
    pad=pad||0;
    return !(a.x+a.w+pad<=b.x || b.x+b.w+pad<=a.x || a.y+a.h+pad<=b.y || b.y+b.h+pad<=a.y);
  }

  function overlapArea(a,b){
    var w=Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x));
    var h=Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));
    return w*h;
  }

  function candidates(anchor,w,h,fontSize,mapRect){
    var gap=Math.max(8,fontSize*.65);
    var cx=anchor.x-w/2;
    var top=anchor.y-h-gap;
    var list=[{x:cx,y:top,index:0}];
    var step=Math.max(fontSize*1.45,18);
    var dirs=[[1,0],[-1,0],[0,-1],[0,1],[1,-1],[-1,-1],[1,1],[-1,1],[2,-1],[-2,-1],[2,1],[-2,1]];
    for(var ring=1;ring<=8;ring++) dirs.forEach(function(d){list.push({x:cx+d[0]*step*ring,y:top+d[1]*step*ring,index:list.length});});
    return list.map(function(r){
      r.x=clamp(r.x,mapRect.x+3,mapRect.x+mapRect.w-w-3);
      r.y=clamp(r.y,mapRect.y+3,mapRect.y+mapRect.h-h-3);
      r.w=w;r.h=h;return r;
    });
  }

  function placeLabels(ctx,items,fontSize,mapRect,crop){
    var occupied=[];
    items.sort(function(a,b){
      var am=manualLabelOffsets.has(pointKey(a.point))?0:1;
      var bm=manualLabelOffsets.has(pointKey(b.point))?0:1;
      var ap=selectedIds.has(String(a.point.gisPlot))?0:1;
      var bp=selectedIds.has(String(b.point.gisPlot))?0:1;
      return am-bm || ap-bp || a.anchor.y-b.anchor.y;
    });
    items.forEach(function(item){
      ctx.font='600 '+fontSize+'px Arial, sans-serif';
      var widths=item.lines.map(function(line){return ctx.measureText(line).width;});
      var padX=fontSize*.62,padY=fontSize*.48,lineH=fontSize*1.22;
      var w=Math.max.apply(null,widths)+padX*2;
      var h=item.lines.length*lineH+padY*2;
      var options=candidates(item.anchor,w,h,fontSize,mapRect);
      var chosen=options[0];
      var manual=manualLabelOffsets.get(pointKey(item.point));
      if(manual){
        chosen={
          x:clamp(item.anchor.x+(manual.dx/crop.w)*mapRect.w,mapRect.x+3,mapRect.x+mapRect.w-w-3),
          y:clamp(item.anchor.y+(manual.dy/crop.h)*mapRect.h,mapRect.y+3,mapRect.y+mapRect.h-h-3),
          w:w,h:h,index:-1
        };
      } else if(state.avoidOverlap){
        var clear=options.find(function(r){return !occupied.some(function(o){return rectOverlap(r,o,fontSize*.18);});});
        if(clear) chosen=clear;
        else {
          var score=Infinity;
          options.forEach(function(r){
            var s=occupied.reduce(function(n,o){return n+overlapArea(r,o);},0);
            if(s<score){score=s;chosen=r;}
          });
        }
      }
      item.box=chosen;
      item.box.lineH=lineH;item.box.padX=padX;item.box.padY=padY;
      item.moved=chosen.index!==0;
      item.manual=!!manual;
      occupied.push(chosen);
    });
    return items;
  }

  function roundedRect(ctx,x,y,w,h,r){
    r=Math.min(r,w/2,h/2);
    ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();
  }

  function nearestBoxPoint(anchor,box){
    var x=clamp(anchor.x,box.x,box.x+box.w),y=clamp(anchor.y,box.y,box.y+box.h);
    if(anchor.x>=box.x&&anchor.x<=box.x+box.w&&anchor.y>=box.y&&anchor.y<=box.y+box.h){
      var edges=[{d:anchor.x-box.x,x:box.x,y:anchor.y},{d:box.x+box.w-anchor.x,x:box.x+box.w,y:anchor.y},{d:anchor.y-box.y,x:anchor.x,y:box.y},{d:box.y+box.h-anchor.y,x:anchor.x,y:box.y+box.h}];
      edges.sort(function(a,b){return a.d-b.d;});x=edges[0].x;y=edges[0].y;
    }
    return {x:x,y:y};
  }

  function drawWatermark(ctx,mapRect,width){
    if(!state.showWatermark) return;
    var text='HAYAT LUXURY PROPERTIES';
    var font=Math.max(18,Math.round(width*.018));
    var stepX=Math.max(310,width*.24),stepY=Math.max(155,width*.12);
    ctx.save();
    ctx.beginPath();ctx.rect(mapRect.x,mapRect.y,mapRect.w,mapRect.h);ctx.clip();
    ctx.translate(mapRect.x,mapRect.y);ctx.rotate(-Math.PI/9);
    ctx.font='700 '+font+'px Arial, sans-serif';ctx.fillStyle='rgba(78,84,82,.13)';ctx.textAlign='center';ctx.textBaseline='middle';
    for(var y=-mapRect.h;y<mapRect.h*1.8;y+=stepY){
      for(var x=-mapRect.w;x<mapRect.w*1.8;x+=stepX){ctx.fillText(text,x,y);}
    }
    ctx.restore();
  }

  function renderToCanvas(canvas,width){
    var crop=currentCrop();
    var mapH=Math.round(width*(crop.h/crop.w));
    var headerH=Math.round(width*.064);
    var footerH=Math.round(width*.036);
    var totalH=headerH+mapH+footerH;
    canvas.width=width;canvas.height=totalH;
    var ctx=canvas.getContext('2d',{alpha:false});
    ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    ctx.fillStyle='#f7f4ed';ctx.fillRect(0,0,width,totalH);

    ctx.fillStyle='#062f28';ctx.fillRect(0,0,width,headerH);
    var brandR=Math.max(18,width*.014);
    ctx.strokeStyle='#cda85b';ctx.lineWidth=Math.max(1,width/1500);ctx.beginPath();ctx.arc(headerH*.58,headerH/2,brandR,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle='#ead8ac';ctx.font='700 '+Math.round(width*.018)+'px Georgia, serif';ctx.textBaseline='middle';ctx.fillText('H',headerH*.58-ctx.measureText('H').width/2,headerH/2);
    ctx.font='700 '+Math.round(width*.017)+'px Georgia, serif';ctx.fillText('Hayat Luxury Properties',headerH*1.02,headerH*.38);
    ctx.fillStyle='#cbd8d4';ctx.font='500 '+Math.round(width*.0085)+'px Arial, sans-serif';ctx.fillText('JEBEL ALI HILLS · CLIENT PRESENTATION',headerH*1.02,headerH*.68);
    var title=clean(state.title)||'Jebel Ali Hills — Selected Plots';
    ctx.fillStyle='#fff';ctx.textAlign='right';ctx.font='700 '+Math.round(width*.015)+'px Arial, sans-serif';ctx.fillText(title,width-width*.035,headerH*.40);
    if(state.subtitle){ctx.fillStyle='#d5dedb';ctx.font='500 '+Math.round(width*.009)+'px Arial, sans-serif';ctx.fillText(clean(state.subtitle),width-width*.035,headerH*.69);}
    ctx.textAlign='left';

    var mapRect={x:0,y:headerH,w:width,h:mapH};
    ctx.drawImage(image,crop.x,crop.y,crop.w,crop.h,mapRect.x,mapRect.y,mapRect.w,mapRect.h);
    drawWatermark(ctx,mapRect,width);

    var list=visiblePoints();
    var labelDivisor=list.length>300?330:(list.length>180?275:(list.length>80?225:(list.length>30?180:145)));
    var fontSize=Math.max(width/labelDivisor,width/340);
    var dotR=Math.max(5,width/420);
    var items=list.map(function(p){
      var source=geoToImage(p.lat,p.lon);
      return {point:p,lines:labelLines(p),anchor:{x:mapRect.x+(source.x-crop.x)/crop.w*mapRect.w,y:mapRect.y+(source.y-crop.y)/crop.h*mapRect.h}};
    });
    placeLabels(ctx,items,fontSize,mapRect,crop);

    ctx.save();
    items.forEach(function(item){
      var end=nearestBoxPoint(item.anchor,item.box);
      ctx.strokeStyle='rgba(4,47,40,.88)';ctx.lineWidth=Math.max(1.4,width/1500);ctx.beginPath();ctx.moveTo(item.anchor.x,item.anchor.y);ctx.lineTo(end.x,end.y);ctx.stroke();
    });
    items.forEach(function(item){
      var s=statusFor(item.point.color);
      if(state.showDots){
        ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(item.anchor.x,item.anchor.y,dotR*1.45,0,Math.PI*2);ctx.fill();
        ctx.fillStyle=s.dot;ctx.strokeStyle=s.border;ctx.lineWidth=Math.max(1.5,width/1300);ctx.beginPath();ctx.arc(item.anchor.x,item.anchor.y,dotR,0,Math.PI*2);ctx.fill();ctx.stroke();
      }
    });
    items.forEach(function(item){
      var b=item.box,s=statusFor(item.point.color);
      ctx.shadowColor='rgba(5,35,29,.18)';ctx.shadowBlur=fontSize*.55;ctx.shadowOffsetY=fontSize*.16;
      roundedRect(ctx,b.x,b.y,b.w,b.h,fontSize*.45);ctx.fillStyle=s.fill;ctx.fill();ctx.shadowColor='transparent';ctx.strokeStyle=s.border;ctx.lineWidth=Math.max(1.5,width/1450);ctx.stroke();
      item.lines.forEach(function(line,i){
        ctx.fillStyle=i===0&&state.fields.has('price')?'#062f28':'#354d46';
        ctx.font=(i===0?'700 ':'600 ')+fontSize+'px Arial, sans-serif';
        ctx.textBaseline='top';ctx.fillText(line,b.x+b.padX,b.y+b.padY+i*b.lineH);
      });
    });
    ctx.restore();

    ctx.fillStyle='#fffdf8';ctx.fillRect(0,headerH+mapH,width,footerH);
    ctx.fillStyle='#566963';ctx.textBaseline='middle';ctx.font='600 '+Math.round(width*.0085)+'px Arial, sans-serif';
    ctx.fillText(list.length+' plot'+(list.length===1?'':'s')+' shown',width*.03,headerH+mapH+footerH/2);
    var today=new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',year:'numeric'}).format(new Date());
    ctx.textAlign='right';ctx.fillText('Prepared '+today+' · Hayat Luxury GIS',width-width*.03,headerH+mapH+footerH/2);ctx.textAlign='left';
    if(state.showLegend) drawLegend(ctx,width,headerH,mapH,footerH);

    renderMeta={crop:crop,mapRect:mapRect,width:width,height:totalH,count:list.length,items:items};
    return renderMeta;
  }

  function drawLegend(ctx,width,headerH,mapH,footerH){
    var font=Math.round(width*.0077),x=width*.22,y=headerH+mapH+footerH/2;
    ctx.font='600 '+font+'px Arial, sans-serif';ctx.textBaseline='middle';
    ['Red','Pink','Blue'].forEach(function(key){
      var s=STATUS[key];ctx.fillStyle=s.dot;ctx.beginPath();ctx.arc(x,y,font*.44,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#566963';ctx.fillText(s.name,x+font*.8,y);x+=ctx.measureText(s.name).width+font*2.3;
    });
  }

  function schedulePreview(){
    if(!ready) return;
    clearTimeout(renderTimer);renderTimer=setTimeout(renderPreview,80);
  }

  function renderPreview(){
    syncState();
    renderToCanvas(els.previewCanvas,PREVIEW_W);
    applyPreviewZoom();
    els.previewMeta.textContent=renderMeta.count+' plots · '+Math.round(renderMeta.crop.w)+' × '+Math.round(renderMeta.crop.h)+' source pixels';
    els.plotSummary.textContent=renderMeta.count+' plots included in this capture';
  }

  function syncState(){
    state.scope=els.plotScope.value;state.search=els.plotSearch.value;state.agent=els.agentFilter.value;state.phase=els.phaseFilter.value;state.status=els.statusFilter.value;state.pricing=els.pricingFilter.value;
    state.fields=new Set(Array.prototype.slice.call(document.querySelectorAll('#labelFields input:checked')).map(function(i){return i.value;}));
    state.avoidOverlap=els.avoidOverlap.checked;state.showLeaderLines=true;state.showDots=els.showDots.checked;state.showLegend=els.showLegend.checked;state.showWatermark=els.showWatermark.checked;
    state.title=els.documentTitle.value;state.subtitle=els.documentSubtitle.value;
  }

  function setMode(mode,resetDraw){
    if(mode==='selected' && !selectedIds.size){mode=context.bounds?'current':'full';}
    if(mode==='filtered' && !filteredIds.size){mode=context.bounds?'current':'full';}
    if(mode==='current' && !context.bounds){mode='full';}
    if(mode==='draw' && resetDraw) state.drawCrop=null;
    state.mode=mode;
    Array.prototype.slice.call(document.querySelectorAll('#captureModes button')).forEach(function(b){b.classList.toggle('active',b.dataset.mode===mode);});
    var help={
      full:'Shows the complete Jebel Ali Hills master plan.',
      current:'Uses the same area and zoom that were open in the Agent/Admin map.',
      filtered:'Uses the plots already shown by your Agent/Admin filters and frames them automatically.',
      selected:'Shows only the plots you selected and frames them automatically.',
      draw:'Drag a rectangle on the preview to choose any area.'
    };
    els.modeHelp.textContent=help[mode];
    var drawing=mode==='draw'&&!state.drawCrop;
    els.drawInstruction.hidden=!drawing;els.previewScroller.classList.toggle('draw-mode',drawing);
    schedulePreview();
  }

  function applyPreviewZoom(){
    var zoom=Number(els.previewZoom.value)/100;
    var w=Math.round(els.previewCanvas.width*zoom),h=Math.round(els.previewCanvas.height*zoom);
    els.previewCanvas.style.width=w+'px';els.canvasWrap.style.width=w+'px';els.canvasWrap.style.height=h+'px';
  }

  function setZoomAround(nextZoom,clientX,clientY){
    var oldZoom=Number(els.previewZoom.value);
    nextZoom=clamp(nextZoom,35,180);
    if(nextZoom===oldZoom) return;
    var r=els.previewScroller.getBoundingClientRect();
    var localX=clientX-r.left,localY=clientY-r.top;
    var contentX=els.previewScroller.scrollLeft+localX;
    var contentY=els.previewScroller.scrollTop+localY;
    els.previewZoom.value=nextZoom;applyPreviewZoom();
    var ratio=nextZoom/oldZoom;
    els.previewScroller.scrollLeft=contentX*ratio-localX;
    els.previewScroller.scrollTop=contentY*ratio-localY;
  }

  function wheelZoom(e){
    if(e.ctrlKey || e.metaKey || Math.abs(e.deltaY)>=Math.abs(e.deltaX)){
      e.preventDefault();
      setZoomAround(Number(els.previewZoom.value)+(e.deltaY<0?10:-10),e.clientX,e.clientY);
    }
  }

  function startPan(e){
    if(state.mode==='draw' || labelDrag || e.button!==0) return;
    panStart={x:e.clientX,y:e.clientY,left:els.previewScroller.scrollLeft,top:els.previewScroller.scrollTop,id:e.pointerId};
    els.previewScroller.classList.add('dragging');
    els.previewScroller.setPointerCapture&&els.previewScroller.setPointerCapture(e.pointerId);
    e.preventDefault();
  }

  function movePan(e){
    if(labelDrag || !panStart || (panStart.id!=null && e.pointerId!==panStart.id)) return;
    els.previewScroller.scrollLeft=panStart.left-(e.clientX-panStart.x);
    els.previewScroller.scrollTop=panStart.top-(e.clientY-panStart.y);
  }

  function finishPan(e){
    if(!panStart || (e.pointerId!=null && panStart.id!=null && e.pointerId!==panStart.id)) return;
    panStart=null;els.previewScroller.classList.remove('dragging');
  }

  function fitPreview(){
    var available=Math.max(280,els.previewScroller.clientWidth-46);
    els.previewZoom.value=clamp(Math.floor(available/PREVIEW_W*100),35,180);applyPreviewZoom();
  }

  function bind(){
    els.previewCanvas=$('previewCanvas');els.canvasWrap=$('canvasWrap');els.previewScroller=$('previewScroller');els.previewMeta=$('previewMeta');els.modeHelp=$('modeHelp');
    els.plotScope=$('plotScope');els.plotSearch=$('plotSearch');els.agentFilter=$('agentFilter');els.phaseFilter=$('phaseFilter');els.statusFilter=$('statusFilter');els.pricingFilter=$('pricingFilter');els.plotSummary=$('plotSummary');
    els.avoidOverlap=$('avoidOverlap');els.showLeaderLines=$('showLeaderLines');els.showDots=$('showDots');els.showLegend=$('showLegend');els.showWatermark=$('showWatermark');els.includeExcel=$('includeExcel');els.documentTitle=$('documentTitle');els.documentSubtitle=$('documentSubtitle');els.previewZoom=$('previewZoom');els.drawInstruction=$('drawInstruction');els.exportStatus=$('exportStatus');
    Array.prototype.slice.call(document.querySelectorAll('#captureModes button')).forEach(function(btn){btn.addEventListener('click',function(){setMode(btn.dataset.mode,true);});});
    ['plotScope','plotSearch','agentFilter','phaseFilter','statusFilter','pricingFilter','avoidOverlap','showDots','showLegend','showWatermark','documentTitle','documentSubtitle'].forEach(function(id){$(id).addEventListener(id==='plotSearch'||id==='documentTitle'||id==='documentSubtitle'?'input':'change',schedulePreview);});
    Array.prototype.slice.call(document.querySelectorAll('#labelFields input')).forEach(function(input){input.addEventListener('change',schedulePreview);});
    $('refreshPreview').addEventListener('click',renderPreview);
    els.previewZoom.addEventListener('input',applyPreviewZoom);
    $('zoomOut').addEventListener('click',function(){els.previewZoom.value=clamp(Number(els.previewZoom.value)-10,35,180);applyPreviewZoom();});
    $('zoomIn').addEventListener('click',function(){els.previewZoom.value=clamp(Number(els.previewZoom.value)+10,35,180);applyPreviewZoom();});
    $('fitPreview').addEventListener('click',fitPreview);
    $('downloadPng').addEventListener('click',function(){exportFile('png');});
    $('downloadPdf').addEventListener('click',function(){exportFile('pdf');});
    $('downloadExcel').addEventListener('click',exportExcel);
    $('resetLabelPositions').addEventListener('click',function(){manualLabelOffsets.clear();els.exportStatus.textContent='Badge positions reset to automatic layout.';schedulePreview();});
    els.previewScroller.addEventListener('wheel',wheelZoom,{passive:false});
    els.previewScroller.addEventListener('pointerdown',startPan);
    window.addEventListener('pointermove',movePan);
    window.addEventListener('pointerup',finishPan);
    window.addEventListener('pointercancel',finishPan);
    els.previewCanvas.addEventListener('pointerdown',startLabelDrag);
    els.previewCanvas.addEventListener('pointerdown',startDraw);
    els.previewCanvas.addEventListener('pointermove',updateBadgeHover);
    els.previewCanvas.addEventListener('pointerleave',function(){if(!labelDrag)els.previewScroller.classList.remove('badge-hover');});
    window.addEventListener('pointermove',moveLabelDrag);
    window.addEventListener('pointerup',finishLabelDrag);
    window.addEventListener('pointercancel',finishLabelDrag);
    window.addEventListener('pointermove',moveDraw);
    window.addEventListener('pointerup',finishDraw);
    window.addEventListener('keydown',function(e){if(e.key==='Escape')cancelDraw();});
    window.addEventListener('resize',function(){if(innerWidth<900) fitPreview();});
  }

  function pointerCanvasPosition(e){
    var r=els.previewCanvas.getBoundingClientRect();
    return {x:(e.clientX-r.left)*(els.previewCanvas.width/r.width),y:(e.clientY-r.top)*(els.previewCanvas.height/r.height),cssX:e.clientX-r.left,cssY:e.clientY-r.top};
  }

  function labelAtPosition(p){
    var items=renderMeta&&renderMeta.items||[];
    for(var i=items.length-1;i>=0;i--){
      var b=items[i].box;
      if(b&&p.x>=b.x&&p.x<=b.x+b.w&&p.y>=b.y&&p.y<=b.y+b.h) return items[i];
    }
    return null;
  }

  function updateBadgeHover(e){
    if(state.mode==='draw'||labelDrag) return;
    els.previewScroller.classList.toggle('badge-hover',!!labelAtPosition(pointerCanvasPosition(e)));
  }

  function startLabelDrag(e){
    if(state.mode==='draw'||e.button!==0||!renderMeta) return;
    var p=pointerCanvasPosition(e),item=labelAtPosition(p);
    if(!item) return;
    labelDrag={key:pointKey(item.point),id:e.pointerId,offsetX:p.x-item.box.x,offsetY:p.y-item.box.y};
    panStart=null;els.previewScroller.classList.remove('dragging','badge-hover');els.previewScroller.classList.add('badge-dragging');
    els.previewCanvas.setPointerCapture&&els.previewCanvas.setPointerCapture(e.pointerId);
    e.preventDefault();e.stopPropagation();
  }

  function moveLabelDrag(e){
    if(!labelDrag||(labelDrag.id!=null&&e.pointerId!==labelDrag.id)||!renderMeta) return;
    var item=(renderMeta.items||[]).find(function(x){return pointKey(x.point)===labelDrag.key;});
    if(!item) return;
    var p=pointerCanvasPosition(e),m=renderMeta.mapRect,crop=renderMeta.crop,b=item.box;
    var x=clamp(p.x-labelDrag.offsetX,m.x+3,m.x+m.w-b.w-3);
    var y=clamp(p.y-labelDrag.offsetY,m.y+3,m.y+m.h-b.h-3);
    manualLabelOffsets.set(labelDrag.key,{dx:(x-item.anchor.x)/m.w*crop.w,dy:(y-item.anchor.y)/m.h*crop.h});
    if(!labelDragFrame){
      labelDragFrame=requestAnimationFrame(function(){labelDragFrame=null;renderPreview();});
    }
    e.preventDefault();
  }

  function finishLabelDrag(e){
    if(!labelDrag||(e.pointerId!=null&&labelDrag.id!=null&&e.pointerId!==labelDrag.id)) return;
    labelDrag=null;els.previewScroller.classList.remove('badge-dragging');
    els.exportStatus.textContent='Badge position saved for this capture and its exports.';
  }

  function startDraw(e){
    if(state.mode!=='draw'||state.drawCrop) return;
    var p=pointerCanvasPosition(e),m=renderMeta&&renderMeta.mapRect;
    if(!m||p.x<m.x||p.x>m.x+m.w||p.y<m.y||p.y>m.y+m.h) return;
    drawStart=p;drawBox=$('drawOverlay');drawBox.hidden=false;drawBox.style.left=p.cssX+'px';drawBox.style.top=p.cssY+'px';drawBox.style.width='0';drawBox.style.height='0';els.previewCanvas.setPointerCapture&&els.previewCanvas.setPointerCapture(e.pointerId);e.preventDefault();
  }

  function moveDraw(e){
    if(!drawStart) return;
    var p=pointerCanvasPosition(e),r=els.previewCanvas.getBoundingClientRect();
    var x1=clamp(Math.min(drawStart.cssX,p.cssX),0,r.width),x2=clamp(Math.max(drawStart.cssX,p.cssX),0,r.width);
    var y1=clamp(Math.min(drawStart.cssY,p.cssY),0,r.height),y2=clamp(Math.max(drawStart.cssY,p.cssY),0,r.height);
    drawBox.style.left=x1+'px';drawBox.style.top=y1+'px';drawBox.style.width=(x2-x1)+'px';drawBox.style.height=(y2-y1)+'px';
  }

  function finishDraw(e){
    if(!drawStart) return;
    var end=pointerCanvasPosition(e),m=renderMeta.mapRect,crop=renderMeta.crop;
    var x1=clamp(Math.min(drawStart.x,end.x),m.x,m.x+m.w),x2=clamp(Math.max(drawStart.x,end.x),m.x,m.x+m.w);
    var y1=clamp(Math.min(drawStart.y,end.y),m.y,m.y+m.h),y2=clamp(Math.max(drawStart.y,end.y),m.y,m.y+m.h);
    drawStart=null;if(drawBox)drawBox.hidden=true;
    if(x2-x1<30||y2-y1<30)return;
    state.drawCrop=normalizedCrop({x:crop.x+(x1-m.x)/m.w*crop.w,y:crop.y+(y1-m.y)/m.h*crop.h,w:(x2-x1)/m.w*crop.w,h:(y2-y1)/m.h*crop.h});
    els.drawInstruction.hidden=true;els.previewScroller.classList.remove('draw-mode');schedulePreview();
  }

  function cancelDraw(){drawStart=null;if(drawBox)drawBox.hidden=true;if(state.mode==='draw'&&!state.drawCrop)setMode('full');}

  function numberOrBlank(value){var n=Number(value);return isFinite(n)&&value!==null&&value!==''?n:'';}

  function excelRows(){
    return visiblePoints().map(function(p){
      return {
        'GIS Plot':clean(p.gisPlot),
        'Master Plan':clean(p.masterPlot),
        'Status':statusFor(p.color).name,
        'Status Color':clean(p.color),
        'Type':clean(p.type),
        'Phase':clean(p.phase),
        'Size (sqft)':numberOrBlank(p.size),
        'Price 1 (AED/sqft)':numberOrBlank(p.price),
        'Total Price 1 (AED)':numberOrBlank(p.total || (p.size&&p.price?Number(p.size)*Number(p.price):'')),
        'Deposit Cheque 1 - 10% (AED)':numberOrBlank(p.deposit || (p.total?Number(p.total)*.1:'')),
        'Commission 1 - 2% (AED)':numberOrBlank(p.commission || (p.total?Number(p.total)*.02:'')),
        'Agent 1':clean(p.agent),
        'Mobile 1':clean(p.mobile),
        'Price 2 (AED/sqft)':numberOrBlank(p.secondPrice),
        'Total Price 2 (AED)':numberOrBlank(p.secondTotal || (p.size&&p.secondPrice?Number(p.size)*Number(p.secondPrice):'')),
        'Deposit Cheque 2 - 10% (AED)':numberOrBlank(p.secondDeposit || (p.secondTotal?Number(p.secondTotal)*.1:'')),
        'Commission 2 - 2% (AED)':numberOrBlank(p.secondCommission || (p.secondTotal?Number(p.secondTotal)*.02:'')),
        'Agent 2':clean(p.secondAgent),
        'Mobile 2':clean(p.secondMobile),
        'GFA':clean(p.gfa),
        'GFA %':numberOrBlank(p.gfaPct),
        'GFA Allowed (sqft)':numberOrBlank(p.gfaAllowed),
        'Features':clean(p.features),
        'Comment':clean(p.comment),
        'Coordinates':clean(p.coords),
        'Google Maps':clean(p.mapsUrl),
        'Last Updated':clean(p.lastUpdated || p.lastDateUpdated)
      };
    });
  }

  function styleWorksheet(ws,rows){
    if(!ws || !ws['!ref']) return;
    var range=window.XLSX.utils.decode_range(ws['!ref']);
    for(var c=range.s.c;c<=range.e.c;c++){
      var cell=ws[window.XLSX.utils.encode_cell({r:0,c:c})];
      if(cell) cell.s={font:{bold:true,color:{rgb:'EAD8AC'}},fill:{fgColor:{rgb:'062F28'}},alignment:{horizontal:'center',vertical:'center'}};
    }
    ws['!rows']=[{hpt:24}];
    ws['!autofilter']={ref:ws['!ref']};
    var keys=rows.length?Object.keys(rows[0]):[];
    ws['!cols']=keys.map(function(key){
      var longest=Math.max(key.length,Math.min(42,rows.reduce(function(n,row){return Math.max(n,String(row[key] == null?'':row[key]).length);},0)));
      return {wch:clamp(longest+2,12,42)};
    });
  }

  function exportExcel(){
    syncState();
    var XLSX=window.XLSX;
    if(!XLSX){els.exportStatus.textContent='Excel library did not load. Please refresh and try again.';return false;}
    var rows=excelRows();
    if(!rows.length){els.exportStatus.textContent='No plots are currently included for Excel export.';return false;}
    var totals=rows.reduce(function(a,row){
      a.area+=Number(row['Size (sqft)'])||0;a.value1+=Number(row['Total Price 1 (AED)'])||0;a.deposit1+=Number(row['Deposit Cheque 1 - 10% (AED)'])||0;a.value2+=Number(row['Total Price 2 (AED)'])||0;a.deposit2+=Number(row['Deposit Cheque 2 - 10% (AED)'])||0;return a;
    },{area:0,value1:0,deposit1:0,value2:0,deposit2:0});
    var summary=[
      ['Hayat Luxury Properties — Jebel Ali Hills'],
      ['Capture title',clean(state.title)],
      ['Prepared',new Date().toISOString()],
      ['Plots',rows.length],
      ['Total area (sqft)',totals.area],
      ['Total offer 1 value (AED)',totals.value1],
      ['Total offer 1 deposit cheques (AED)',totals.deposit1],
      ['Total offer 2 value (AED)',totals.value2],
      ['Total offer 2 deposit cheques (AED)',totals.deposit2],
      ['Calculation note','Deposit cheque = 10% of total price; commission = 2% of total price, using stored inventory calculations.']
    ];
    var wb=XLSX.utils.book_new();
    var summaryWs=XLSX.utils.aoa_to_sheet(summary);summaryWs['!cols']=[{wch:38},{wch:72}];
    var dataWs=XLSX.utils.json_to_sheet(rows);styleWorksheet(dataWs,rows);
    XLSX.utils.book_append_sheet(wb,summaryWs,'Summary');XLSX.utils.book_append_sheet(wb,dataWs,'Plots');
    XLSX.writeFile(wb,fileName('xlsx'));
    els.exportStatus.textContent='Excel ready — '+rows.length+' plot'+(rows.length===1?'':'s')+' with calculations.';
    return true;
  }

  function exportFile(format){
    syncState();
    var width=Number($('quality').value)||3840;
    var buttons=[$('downloadPng'),$('downloadPdf')];buttons.forEach(function(b){b.disabled=true;});
    els.exportStatus.textContent='Rendering '+(width===7680?'8K':width===3840?'4K':'HD')+' '+format.toUpperCase()+'…';
    setTimeout(function(){
      try{
        var canvas=document.createElement('canvas');renderToCanvas(canvas,width);
        if(format==='png'){
          canvas.toBlob(function(blob){
            if(!blob){finishExport(buttons,'PNG export failed.');return;}
            downloadBlob(blob,fileName('png'));
            var withExcel=els.includeExcel.checked&&exportExcel();
            finishExport(buttons,'PNG ready — '+Math.round(canvas.width)+' × '+Math.round(canvas.height)+' px'+(withExcel?' · Excel included.':'.'));
          },'image/png');
        } else {
          var jsPDF=window.jspdf&&window.jspdf.jsPDF;
          if(!jsPDF){finishExport(buttons,'PDF library did not load. PNG export is still available.');return;}
          var landscape=canvas.width>=canvas.height;
          var pageW=landscape?297:210,pageH=landscape?210:297;
          var pdf=new jsPDF({orientation:landscape?'landscape':'portrait',unit:'mm',format:'a4',compress:true});
          var ratio=Math.min(pageW/canvas.width,pageH/canvas.height),w=canvas.width*ratio,h=canvas.height*ratio;
          pdf.addImage(canvas.toDataURL('image/jpeg',.94),'JPEG',(pageW-w)/2,(pageH-h)/2,w,h,undefined,'FAST');
          pdf.save(fileName('pdf'));
          var pdfWithExcel=els.includeExcel.checked&&exportExcel();
          finishExport(buttons,'PDF ready'+(pdfWithExcel?' · Excel included.':'.'));
        }
      }catch(err){console.error(err);finishExport(buttons,'Export failed: '+err.message);}
    },60);
  }

  function finishExport(buttons,message){buttons.forEach(function(b){b.disabled=false;});els.exportStatus.textContent=message;}
  function fileName(ext){return 'Hayat_Jebel_Ali_Hills_'+new Date().toISOString().slice(0,10)+'.'+ext;}
  function downloadBlob(blob,name){var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},800);}

  function boot(){
    if(ready) return;
    loadInventory();
    bind();populateFilters();
    els.plotScope.value=state.scope;
    var selectedOption=els.plotScope.querySelector('option[value="selected"]');
    var filteredOption=els.plotScope.querySelector('option[value="filtered"]');
    var selectedModeButton=document.querySelector('#captureModes button[data-mode="selected"]');
    var filteredModeButton=document.querySelector('#captureModes button[data-mode="filtered"]');
    if(selectedIds.size) selectedOption.textContent='Selected in Agent/Admin map ('+selectedIds.size+')';
    if(filteredIds.size) filteredOption.textContent='Filtered in Agent/Admin map ('+filteredIds.size+')';
    if(!selectedIds.size && !filteredIds.size){
      state.title='Jebel Ali Hills — Available Plots';
      els.documentTitle.value=state.title;
    } else if(!selectedIds.size && filteredIds.size) {
      state.title='Jebel Ali Hills — Filtered Plots';
      els.documentTitle.value=state.title;
    }
    if(!selectedIds.size){
      selectedOption.disabled=true;
      selectedModeButton.disabled=true;
      selectedModeButton.title='Select plots in the Agent or Admin map, then open Capture Studio again.';
    }
    if(!filteredIds.size){
      filteredOption.disabled=true;
      filteredModeButton.disabled=true;
      filteredModeButton.title='Apply filters in the Agent or Admin map, then open Capture Studio again.';
    }
    if(state.mode==='selected'&&!selectedIds.size) state.mode=context.bounds?'current':'full';
    if(state.mode==='filtered'&&!filteredIds.size) state.mode=context.bounds?'current':'full';
    if(state.mode==='current'&&!context.bounds) state.mode='full';
    image.onload=function(){ready=true;setMode(state.mode);setTimeout(fitPreview,100);};
    image.onerror=function(){els.exportStatus.textContent='The master plan image could not be loaded.';};
    image.src=SOURCE_IMAGE;
  }

  window.addEventListener('hayat:data-updated',function(){if(ready){loadInventory();populateFilters();schedulePreview();}});
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){setTimeout(boot,720);});
  else setTimeout(boot,720);
})();
