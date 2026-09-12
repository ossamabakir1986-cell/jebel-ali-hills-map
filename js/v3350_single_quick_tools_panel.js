// Hayat GIS v3.3.50 - single quick tools toolbar + reliable update panel
// Consolidates duplicated Quick tools boxes and keeps the filters fast.
(function(){
  'use strict';
  if(window.__HAYAT_V3350_SINGLE_QUICK_TOOLS_LOADED) return;
  window.__HAYAT_V3350_SINGLE_QUICK_TOOLS_LOADED = true;

  var LANG_KEY='HAYAT_UI_LANGUAGE';
  var GUIDE_EN='Hayat_GIS_Training_Guide.pdf';
  var GUIDE_AR='Hayat_GIS_Training_Guide_AR.pdf';

  function q(sel,root){return (root||document).querySelector(sel)}
  function qa(sel,root){return Array.prototype.slice.call((root||document).querySelectorAll(sel))}
  function isArabic(){return localStorage.getItem(LANG_KEY)==='ar'||document.documentElement.lang==='ar'||document.documentElement.dir==='rtl'}
  function isAdmin(){return /admin\.html/i.test(location.pathname)||!!q('#plotEditModal')||!!q('#exportFullPackageBtn')||!!q('[data-admin]')}
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}

  function addStyle(){
    if(q('#hayat-v3350-style')) return;
    var s=document.createElement('style');
    s.id='hayat-v3350-style';
    s.textContent=[
      '#hayat-v3350-toolbar{display:block!important;width:100%!important;margin:8px 0 12px!important;padding:8px!important;background:rgba(16,33,29,.96)!important;border:1.5px solid #d3ab4e!important;border-radius:14px!important;box-sizing:border-box!important;position:relative!important;z-index:999999!important;direction:ltr!important}',
      '#hayat-v3350-toolbar .hayat-v3350-title{font-size:11px!important;color:#d3ab4e!important;font-weight:900!important;margin:0 0 6px!important;opacity:.9!important}',
      '#hayat-v3350-toolbar .hayat-v3350-buttons{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:8px!important;width:100%!important}',
      '#hayat-v3350-toolbar button,#hayat-v3350-toolbar a{display:flex!important;align-items:center!important;justify-content:center!important;width:100%!important;height:42px!important;min-width:0!important;max-width:none!important;box-sizing:border-box!important;margin:0!important;padding:8px!important;border-radius:10px!important;border:1px solid #d3ab4e!important;background:#10211d!important;color:#d3ab4e!important;text-decoration:none!important;font-size:13px!important;font-weight:900!important;line-height:1.05!important;text-align:center!important;white-space:normal!important;overflow:hidden!important;box-shadow:none!important;cursor:pointer!important}',
      '#hayat-v3350-toolbar button:active,#hayat-v3350-toolbar a:active{transform:scale(.985)!important}',
      'html.hayat-ar #hayat-v3350-toolbar{direction:rtl!important;text-align:right!important}',
      '.hayat-v3347-toolbar:not(#hayat-v3350-toolbar),#hayat-v3347-toolbar,body>.hayat-v3343-tools,body>.hayat-v3346-mobile-tools{display:none!important}',
      '#hayat-v3350-panel{position:fixed!important;left:50%!important;top:74px!important;transform:translateX(-50%)!important;width:min(760px,calc(100vw - 22px))!important;max-height:calc(100dvh - 96px)!important;overflow:auto!important;background:#fffdf6!important;color:#10211d!important;border:2px solid #d3ab4e!important;border-radius:16px!important;box-shadow:0 18px 55px rgba(0,0,0,.38)!important;z-index:2147483647!important;padding:14px!important;box-sizing:border-box!important;font-family:Arial,Tahoma,sans-serif!important}',
      '#hayat-v3350-panel[hidden]{display:none!important}',
      '#hayat-v3350-panel .hayat-v3350-head{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:10px!important;position:sticky!important;top:-14px!important;background:#fffdf6!important;padding:6px 0 10px!important;border-bottom:1px solid #ead9a9!important;margin-bottom:10px!important}',
      '#hayat-v3350-panel h2{font-size:20px!important;margin:0!important;color:#10211d!important}',
      '#hayat-v3350-panel h3{font-size:15px!important;margin:10px 0 6px!important;color:#10211d!important}',
      '#hayat-v3350-panel ul{margin:6px 0 10px 20px!important;padding:0!important}',
      '#hayat-v3350-panel li{font-size:13px!important;line-height:1.42!important;margin:4px 0!important}',
      '#hayat-v3350-panel .card{border:1px solid #ead9a9!important;background:#fff!important;border-radius:10px!important;padding:9px 10px!important;margin:8px 0!important}',
      '#hayat-v3350-panel .tag{display:inline-block!important;background:#10211d!important;color:#d3ab4e!important;border-radius:999px!important;padding:3px 8px!important;font-size:11px!important;font-weight:900!important;margin:2px 4px 2px 0!important}',
      '#hayat-v3350-panel .close{width:auto!important;min-width:82px!important;height:36px!important;border:1px solid #d3ab4e!important;border-radius:9px!important;background:#10211d!important;color:#d3ab4e!important;font-weight:900!important}',
      'html.hayat-ar #hayat-v3350-panel{direction:rtl!important;text-align:right!important;font-family:Tahoma,Arial,sans-serif!important}',
      'html.hayat-ar #hayat-v3350-panel ul{margin:6px 20px 10px 0!important}',
      '@media(max-width:820px){#hayat-v3350-toolbar{margin:6px 0 10px!important;padding:7px!important;border-radius:12px!important}#hayat-v3350-toolbar .hayat-v3350-buttons{gap:6px!important}#hayat-v3350-toolbar button,#hayat-v3350-toolbar a{height:38px!important;font-size:12px!important;padding:6px 5px!important}#hayat-v3350-panel{top:62px!important;width:calc(100vw - 18px)!important;max-height:calc(100dvh - 74px)!important;padding:12px!important}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function killDuplicates(toolbar){
    qa('#hayat-v3347-toolbar,.hayat-v3347-toolbar,body>.hayat-v3343-tools,body>.hayat-v3346-mobile-tools').forEach(function(el){
      if(el!==toolbar && !toolbar.contains(el)){
        try{ el.parentNode && el.parentNode.removeChild(el); }catch(e){ el.style.display='none'; }
      }
    });
    qa('#hayat-v3350-toolbar').forEach(function(el,i){
      if(i>0 && el!==toolbar){try{el.parentNode.removeChild(el)}catch(e){el.style.display='none'}}
    });
  }

  function data(){
    return {
      en:{
        quick:'Quick tools', arabic:'العربية', guide:'Guide', changed:'What changed', close:'Close', title:'What changed',
        latest:'Latest update summary', admin:'Admin tools', agent:'Agent tools', note:'This panel is role-aware: Agent map shows only agent-facing changes; Admin map also shows editing and export changes.',
        sections:[
          ['Quick tools cleanup',['Only one Quick tools box should appear now.','The buttons are inside the top filter panel with matching size.','Old floating and duplicate toolbars are hidden/removed automatically.','This also avoids extra scripts slowing the filter tabs.']],
          ['Map data update - 10/09/2026',['Inventory records became 495.','Master-plan PA label points remain 2,963.','Added plots: 5130989, 5132133, 5134981, and 5135007.','Removed old duplicate/reference record: PA4_26.','Updated 40 existing plot records from the latest exported data.','Updated one master-plan label coordinate: PA4_052.']],
          ['Added plot details',['5130989 / PA14_223 — Malek Al Masri, 11,625.16 sqft, AED 340/sqft, Red, Single Row, G+1.','5132133 / PA7_126 — Hayat Al Masri, 11,858.83 sqft, AED 350/sqft, Red, Back to Back.','5134981 / PA4_026 — Lama Ismail, 10,000.03 sqft, AED 450/sqft, Red, Single Row, G+1.','5135007 / PA4_052 — Issam Al Halabi, 10,000.03 sqft, AED 320/sqft, Red, Back to Back.']],
          ['Search and filters',['Search supports GIS plot number, Master Plan number, agent name, and mobile number.','Filter tabs include agents, statuses/colors, types, features, phases, GFA, and pricing.','Multiple choices inside one filter tab work as OR. Different filter tabs work together as AND.','All selects every option in the open filter; Clear removes all ticks in that filter.']],
          ['Labels and viewing',['Display labels can show GIS, Master Plan, price, agent, features, and last update.','Master Plan / PA labels are off by default to keep the map clean.','Labels stay transparent so the map remains readable.']],
          ['Copy and guide tools',['Copy buttons keep agent-facing details available for sharing.','Guide opens the English guide in English mode and Arabic guide in Arabic mode.','Plot numbers, prices, mobile numbers, agent names, and coordinates are never translated.']]
        ],
        adminSections:[
          ['Admin-only changes',['Add/Edit inventory remains Admin-only.','Last Date Updated field can be edited/auto-filled from Admin.','GFA and manual GFA allowed tools remain Admin-only.','Move Plot, delete, import/export, and full website package tools remain Admin-only.']]
        ]
      },
      ar:{
        quick:'أدوات سريعة', arabic:'English', guide:'دليل التدريب', changed:'آخر التحديثات', close:'إغلاق', title:'آخر التحديثات',
        latest:'ملخص آخر تحديث', admin:'أدوات المدير', agent:'أدوات الوكيل', note:'هذه اللوحة حسب نوع الخريطة: خريطة الوكيل تعرض فقط ما يخص الوكيل، وخريطة المدير تعرض أيضاً تغييرات التعديل والتصدير.',
        sections:[
          ['تنظيف أزرار الأدوات السريعة',['يجب أن يظهر مربع أدوات سريعة واحد فقط الآن.','الأزرار أصبحت داخل لوحة الفلاتر العلوية وبنفس المقاس.','تم إخفاء/إزالة الأزرار العائمة والمكررة تلقائياً.','هذا يقلل عدد السكربتات الإضافية حتى تصبح تبويبات الفلترة أسرع.']],
          ['تحديث بيانات الخريطة - 10/09/2026',['أصبح عدد سجلات الإنفنتوري 495.','عدد نقاط أرقام المخطط الرئيسي بقي 2,963.','تمت إضافة القطع: 5130989 و 5132133 و 5134981 و 5135007.','تم حذف السجل القديم/المكرر: PA4_26.','تم تحديث 40 سجل قطعة موجودة حسب آخر ملف تصدير.','تم تعديل إحداثيات رقم مخطط واحد: PA4_052.']],
          ['تفاصيل القطع المضافة',['5130989 / PA14_223 — مالك المصري، 11,625.16 قدم مربع، 340 درهم/قدم، أحمر، صف واحد، G+1.','5132133 / PA7_126 — حياة المصري، 11,858.83 قدم مربع، 350 درهم/قدم، أحمر، ظهر لظهر.','5134981 / PA4_026 — لمى إسماعيل، 10,000.03 قدم مربع، 450 درهم/قدم، أحمر، صف واحد، G+1.','5135007 / PA4_052 — عصام الحلبي، 10,000.03 قدم مربع، 320 درهم/قدم، أحمر، ظهر لظهر.']],
          ['البحث والفلاتر',['البحث يدعم رقم قطعة GIS ورقم المخطط الرئيسي واسم الوكيل ورقم الموبايل.','تبويبات الفلترة تشمل الوكلاء والحالات/الألوان والأنواع والمميزات والمراحل و GFA والأسعار.','الاختيارات المتعددة داخل نفس الفلتر تعمل كـ OR، أما الفلاتر المختلفة فتعمل معاً كـ AND.','زر All يحدد كل خيارات الفلتر المفتوح، وزر Clear يلغي كل الاختيارات داخل ذلك الفلتر.']],
          ['التسميات والعرض',['يمكن إظهار تسميات GIS ورقم المخطط والسعر والوكيل والمميزات وآخر تحديث.','تسميات المخطط الرئيسي / PA تبقى مغلقة افتراضياً حتى تبقى الخريطة نظيفة.','التسميات شفافة حتى تبقى الخريطة واضحة.']],
          ['أدوات النسخ والدليل',['أزرار النسخ تبقي تفاصيل الوكيل جاهزة للمشاركة.','الدليل يفتح النسخة الإنجليزية في وضع الإنجليزية والنسخة العربية في وضع العربية.','أرقام القطع والأسعار وأرقام الهواتف وأسماء الوكلاء والإحداثيات لا تتم ترجمتها.']]
        ],
        adminSections:[
          ['تغييرات خاصة بالمدير فقط',['إضافة/تعديل الإنفنتوري تبقى للمدير فقط.','حقل آخر تاريخ تحديث يمكن تعديله أو تعبئته تلقائياً من خريطة المدير.','أدوات GFA والتعديل اليدوي للمساحة المسموحة تبقى للمدير فقط.','تحريك القطعة والحذف والاستيراد/التصدير وتصدير الموقع الكامل تبقى للمدير فقط.']]
        ]
      }
    };
  }

  function renderPanel(){
    var lang=isArabic()?'ar':'en', d=data()[lang], p=q('#hayat-v3350-panel');
    if(!p){p=document.createElement('div');p.id='hayat-v3350-panel';p.hidden=true;document.body.appendChild(p)}
    var sections=d.sections.slice();
    if(isAdmin()) sections=sections.concat(d.adminSections);
    var html='<div class="hayat-v3350-head"><div><h2>'+esc(d.title)+'</h2><div><span class="tag">'+esc(isAdmin()?d.admin:d.agent)+'</span><span class="tag">v3.3.50</span></div></div><button type="button" class="close" id="hayat-v3350-close">'+esc(d.close)+'</button></div>';
    html+='<div class="card"><h3>'+esc(d.latest)+'</h3><ul><li>'+esc(d.note)+'</li></ul></div>';
    sections.forEach(function(sec){html+='<div class="card"><h3>'+esc(sec[0])+'</h3><ul>'+sec[1].map(function(x){return '<li>'+esc(x)+'</li>'}).join('')+'</ul></div>'});
    p.innerHTML=html;
    q('#hayat-v3350-close',p).onclick=function(e){e.preventDefault();p.hidden=true};
    return p;
  }

  function openPanel(e){
    if(e){e.preventDefault();e.stopPropagation();}
    var p=renderPanel();
    p.hidden=false;
  }

  function ensureToolbar(){
    addStyle();
    var panel=q('#panel')||q('.panel')||q('#filters')||q('.filters');
    var toolbar=q('#hayat-v3350-toolbar');
    if(!toolbar){
      toolbar=document.createElement('div');
      toolbar.id='hayat-v3350-toolbar';
      toolbar.innerHTML='<div class="hayat-v3350-title"></div><div class="hayat-v3350-buttons"><button type="button" id="hayat-v3350-lang"></button><a id="hayat-v3350-guide" target="_blank" rel="noopener"></a><button type="button" id="hayat-v3350-updates"></button></div>';
    }
    killDuplicates(toolbar);
    if(panel && toolbar.parentNode!==panel){
      var anchor=panel.querySelector('h1,h2,h3,.panel-title,.filters-title');
      if(anchor && anchor.parentNode===panel) anchor.parentNode.insertBefore(toolbar,anchor.nextSibling);
      else panel.insertBefore(toolbar,panel.firstChild);
    }else if(!panel && !toolbar.parentNode){
      document.body.insertBefore(toolbar,document.body.firstChild);
    }
    var lang=isArabic()?'ar':'en', d=data()[lang];
    document.documentElement.classList.toggle('hayat-ar',lang==='ar');
    document.documentElement.lang=lang;
    document.documentElement.dir=lang==='ar'?'rtl':'ltr';
    q('.hayat-v3350-title',toolbar).textContent=d.quick;
    var bLang=q('#hayat-v3350-lang',toolbar), bGuide=q('#hayat-v3350-guide',toolbar), bUpd=q('#hayat-v3350-updates',toolbar);
    bLang.textContent=d.arabic;
    bGuide.textContent=d.guide;
    bGuide.href=lang==='ar'?GUIDE_AR:GUIDE_EN;
    bUpd.textContent=d.changed;
    bLang.onclick=function(ev){ev.preventDefault();localStorage.setItem(LANG_KEY,lang==='ar'?'en':'ar');location.reload()};
    bUpd.onclick=openPanel;
    renderPanel();
  }

  function boot(){
    ensureToolbar();
    setTimeout(ensureToolbar,700);
    setTimeout(ensureToolbar,1600);
    setTimeout(ensureToolbar,2800);
  }

  document.addEventListener('keydown',function(e){if(e.key==='Escape'){var p=q('#hayat-v3350-panel');if(p)p.hidden=true}},true);
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
