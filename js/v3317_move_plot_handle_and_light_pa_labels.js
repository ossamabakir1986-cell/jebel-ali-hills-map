/* Hayat GIS v3.3.17 - Move Plot handle offset + lighter master-plan labels
   - Keeps v3.3.16 filter engine untouched.
   - Moves the temporary Move Plot drag handle visually to the right of the inventory pin.
   - Makes master-plan / PA labels transparent except for the plot number text. */
(function(){
  function addStyle(){
    if(document.getElementById('v3317MovePlotLightLabelsStyle')) return;
    var css = document.createElement('style');
    css.id = 'v3317MovePlotLightLabelsStyle';
    css.textContent = `
      /* v3.3.17: transparent master-plan labels, colored number only */
      .master-label{
        background:transparent!important;
        border-color:transparent!important;
        box-shadow:none!important;
        color:rgba(16,33,29,.88)!important;
        text-shadow:0 1px 2px rgba(255,255,255,.65)!important;
      }
      .pa-master-label-icon{opacity:1!important;background:transparent!important;}
      .pa-master-label-icon span{
        background:transparent!important;
        color:rgba(16,33,29,.86)!important;
        font-weight:900!important;
        text-shadow:0 1px 2px rgba(255,255,255,.70), 0 0 1px rgba(255,255,255,.85)!important;
      }
      .pa-master-label-icon span::before,
      .pa-master-label-icon.inventory-fallback span::before{
        display:none!important;
        content:none!important;
        background:transparent!important;
        box-shadow:none!important;
      }
      .pa-master-label-icon.inventory-fallback span{
        color:rgba(74,63,31,.72)!important;
        text-shadow:0 1px 2px rgba(255,255,255,.65)!important;
      }
      .hayat-pa-label-click-wrap,
      .hayat-unified-pa-add-label{
        background:transparent!important;
        border:0!important;
        box-shadow:none!important;
      }
      .hayat-pa-label-click,
      .hayat-unified-pa-add-label .pa-text{
        background:transparent!important;
        border-color:transparent!important;
        box-shadow:none!important;
        color:rgba(15,118,110,.92)!important;
        font-weight:900!important;
        text-shadow:0 1px 2px rgba(255,255,255,.72), 0 0 1px rgba(255,255,255,.88)!important;
      }
      .hayat-pa-label-click:hover,
      .hayat-unified-pa-add-label:hover .pa-text{
        background:rgba(255,255,255,.22)!important;
        border-color:rgba(15,118,110,.20)!important;
        box-shadow:none!important;
      }

      /* v3.3.17: Move Plot handle sits to the right of the real plot coordinate. */
      .v3317-move-plot-icon-wrap{
        background:transparent!important;
        border:0!important;
        pointer-events:auto!important;
      }
      .v3317-move-plot-icon{
        position:relative;
        width:76px;
        height:34px;
        pointer-events:auto!important;
        cursor:grab;
        touch-action:none;
      }
      .v3317-move-plot-icon:active{cursor:grabbing;}
      .v3317-move-plot-tail{
        position:absolute;
        left:8px;
        top:16px;
        width:27px;
        height:2px;
        background:rgba(206,163,80,.95);
        box-shadow:0 1px 3px rgba(0,0,0,.30);
      }
      .v3317-move-plot-anchor{
        position:absolute;
        left:3px;
        top:12px;
        width:10px;
        height:10px;
        border-radius:50%;
        background:#CEA350;
        border:2px solid #fff;
        box-shadow:0 0 0 2px rgba(206,163,80,.35),0 2px 6px rgba(0,0,0,.30);
      }
      .v3317-move-plot-handle{
        position:absolute;
        left:34px;
        top:3px;
        width:28px;
        height:28px;
        border-radius:50%;
        background:#0f766e;
        border:3px solid #fff;
        box-shadow:0 0 0 4px rgba(15,118,110,.25),0 4px 12px rgba(0,0,0,.38);
        display:flex;
        align-items:center;
        justify-content:center;
        color:#fff;
        font:900 15px Arial, sans-serif;
        line-height:1;
        pointer-events:auto!important;
      }
      .v3317-move-plot-handle::after{content:'↔'; transform:translateY(-1px);}
      .v3317-move-plot-help{
        position:absolute;
        left:65px;
        top:8px;
        padding:2px 5px;
        border-radius:5px;
        background:rgba(16,33,29,.88);
        color:#fff;
        font:800 10px Arial,sans-serif;
        white-space:nowrap;
        box-shadow:0 2px 8px rgba(0,0,0,.25);
        pointer-events:none;
        opacity:.92;
      }
    `;
    document.head.appendChild(css);
  }

  function makeMoveIcon(){
    return L.divIcon({
      className:'v3317-move-plot-icon-wrap',
      html:'<div class="v3317-move-plot-icon" title="Drag this handle; the gold dot marks the saved plot coordinate"><div class="v3317-move-plot-tail"></div><div class="v3317-move-plot-anchor"></div><div class="v3317-move-plot-handle"></div><div class="v3317-move-plot-help">move</div></div>',
      iconSize:[76,34],
      iconAnchor:[8,17],
      popupAnchor:[32,-14]
    });
  }

  function applyMovePlotHandleOffset(){
    if(!window.L || !window.__moveMarker || typeof window.__moveMarker.setIcon !== 'function') return;
    try{ window.__moveMarker.setIcon(makeMoveIcon()); }catch(e){}
    try{ if(typeof window.__moveMarker.setZIndexOffset === 'function') window.__moveMarker.setZIndexOffset(50000); }catch(e){}
    try{
      var pop = window.__moveMarker.getPopup && window.__moveMarker.getPopup();
      if(pop && pop.setContent){
        var html = pop.getContent ? String(pop.getContent()) : '';
        if(html && html.indexOf('gold dot') === -1){
          html = html.replace('Drag this marker to the correct position, then save.', 'Drag the right-side handle. The small gold dot marks the exact coordinate that will be saved.');
          pop.setContent(html);
        }
      }
    }catch(e){}
  }

  function patchMovePlotStart(){
    if(window.__v3317MovePlotPatched) return;
    if(typeof window.startMovePlotByRow !== 'function') return;
    var oldStart = window.startMovePlotByRow;
    window.startMovePlotByRow = function(row){
      var result = oldStart.apply(this, arguments);
      setTimeout(applyMovePlotHandleOffset, 0);
      setTimeout(applyMovePlotHandleOffset, 80);
      return result;
    };
    window.__v3317MovePlotPatched = true;
  }

  function init(){
    addStyle();
    patchMovePlotStart();
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  setTimeout(init, 100);
  setTimeout(init, 500);
})();
