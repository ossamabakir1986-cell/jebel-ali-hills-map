// Hayat GIS v3.3.48 - Speed fix for filter tabs
// Keeps Arabic support without the old full-page MutationObserver.
(function(){
  'use strict';
  if(window.__HAYAT_V3348_FAST_ARABIC_NO_OBSERVER) return;
  window.__HAYAT_V3348_FAST_ARABIC_NO_OBSERVER = true;
  var K='HAYAT_UI_LANGUAGE';
  function q(s,r){return (r||document).querySelector(s)}
  function qa(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
  function on(){return localStorage.getItem(K)==='ar'}
  function clean(x){return String(x==null?'':x).replace(/\s+/g,' ').trim()}
  var D={
    'Jebel Ali Hills Filters':'فلاتر جبل علي هيلز','Hayat Luxury GIS':'حياة لاكشري GIS','Jebel Ali Hills Master Plan':'المخطط الرئيسي - جبل علي هيلز',
    'Quick tools':'أدوات سريعة','Map layers':'طبقات الخريطة','Details checklist':'قائمة التفاصيل','Selected plots':'القطع المحددة','Agent Excel workflow':'تصدير ملف الوكيل','Deployment / Data Export':'النشر / تصدير البيانات','Admin Plot Editor':'محرر القطعة',
    'GIS Plot':'رقم قطعة GIS','Master Plan Plot':'رقم المخطط الرئيسي','Master Plan':'المخطط الرئيسي','Agent':'الوكيل','Mobile':'الموبايل','Size':'المساحة','Size / Area sqft':'المساحة بالقدم المربع','Price per sqft':'السعر للقدم المربع','Status / Color':'الحالة / اللون','Type':'النوع','Phase':'المرحلة','Features':'المميزات','Pricing':'السعر','Comment':'ملاحظة','Coordinates':'الإحداثيات','Additional offer':'عرض إضافي','Second Agent':'الوكيل الثاني','Second Mobile':'موبايل الوكيل الثاني','Second Price':'السعر الثاني','Second Color':'اللون الثاني','GFA allowed':'المساحة البنائية المسموحة','Last updated':'آخر تحديث','Last Date Updated':'آخر تاريخ تحديث',
    'All agents':'كل الوكلاء','All statuses':'كل الحالات','All types':'كل الأنواع','All features':'كل المميزات','All phases':'كل المراحل','All GFA':'كل GFA','All pricing':'كل الأسعار','All':'الكل','Clear':'مسح','Apply':'تطبيق','Reset':'إعادة ضبط','Hide':'إخفاء','Show filters':'إظهار الفلاتر','Apply Details View':'تطبيق عرض التفاصيل','Select Plots':'تحديد قطع','Show Selected Only':'إظهار المحدد فقط','Copy Selected Details':'نسخ تفاصيل المحدد','Copy Selected Description':'نسخ وصف المحدد','No plots selected.':'لا توجد قطع محددة.',
    'HD Master Plan':'المخطط الرئيسي HD','Master Plan PA labels':'أرقام قطع المخطط','Red labels':'تسميات حمراء','Blue labels':'تسميات زرقاء','Pink labels':'تسميات وردية','Other labels':'تسميات أخرى','Label: GIS plot number':'التسمية: رقم قطعة GIS','Label: Master Plan plot':'التسمية: رقم المخطط الرئيسي','Label: Price/sqft':'التسمية: السعر/قدم','Label: Total price':'التسمية: السعر الإجمالي','Label: Size':'التسمية: المساحة','Label: Agent':'التسمية: الوكيل','Label: GFA':'التسمية: GFA','Label: Phase':'التسمية: المرحلة',
    'Direct':'مباشر','On hold':'قيد الانتظار','Through broker':'عن طريق وسيط','Priced only':'المسعر فقط','Unpriced only':'غير المسعر فقط','Plot':'أرض','Building':'بناء','Ready Building':'بناء جاهز','Ready Villa':'فيلا جاهزة','Twin Villa':'فيلا توين','Twin Villa (Ready)':'فيلا توين جاهزة','Corner':'زاوية','Single Row':'صف واحد','Back to Back':'ظهر لظهر','End Unit':'وحدة طرفية','Park Facing':'مطلة على الحديقة','Green Belt Facing':'مطلة على الحزام الأخضر','Red':'أحمر','Blue':'أزرق','Pink':'وردي','Other / Blank':'أخرى / فارغ','Close':'إغلاق'
  };
  var P={'Search GIS plot, PA plot, agent, mobile':'ابحث برقم GIS أو رقم المخطط أو الوكيل أو الموبايل','Min size':'أقل مساحة','Max size':'أكبر مساحة','Min AED/sqft':'أقل سعر/قدم','Max AED/sqft':'أعلى سعر/قدم','Select agent to export':'اختر الوكيل للتصدير','Example: 10000':'مثال: 10000','Corner, Single Row, Back to Back':'زاوية، صف واحد، ظهر لظهر'};
  function tr(t){var s=clean(t); if(!s) return t; if(D[s]) return String(t).replace(s,D[s]); var m=s.match(/^(\d+) selected$/i); return m?m[1]+' محدد':t}
  function apply(root){
    document.documentElement.classList.toggle('hayat-ar',on());
    document.documentElement.lang=on()?'ar':'en';
    document.documentElement.dir=on()?'rtl':'ltr';
    if(!on()) return;
    root=root||q('#panel')||document.body;
    qa('input[placeholder],textarea[placeholder]',root).forEach(function(x){var v=x.getAttribute('placeholder')||''; if(P[v]) x.setAttribute('placeholder',P[v])});
    qa('option',root).forEach(function(o){var n=tr(o.textContent); if(n!==o.textContent)o.textContent=n});
    var w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:function(n){var p=n.parentElement;if(!p||!clean(n.nodeValue))return NodeFilter.FILTER_REJECT;if(['SCRIPT','STYLE','TEXTAREA'].indexOf(p.tagName)>=0)return NodeFilter.FILTER_REJECT;if(p.closest&&p.closest('#hayat-v3343-panel'))return NodeFilter.FILTER_REJECT;return NodeFilter.FILTER_ACCEPT}}),arr=[],n;while(n=w.nextNode())arr.push(n);arr.forEach(function(n){var v=tr(n.nodeValue); if(v!==n.nodeValue)n.nodeValue=v});
  }
  function cleanVersion(){
    var re=/(\bv\d+(?:\.\d+){1,}\b|\bVersion\s*\d+(?:\.\d+)?\b|Unified filters:\s*v|Multi-select filters:\s*v|Labels:\s*v)/i;
    qa('#count span,#count small,#count div,.small-note span,.small-note small,.small-note,.stats').forEach(function(x){if(x.id==='count')return;var t=clean(x.textContent);if(re.test(t)&&t.length<180)x.style.display='none'});
  }
  function style(){if(q('#hayat-v3348-fast-style'))return;var s=document.createElement('style');s.id='hayat-v3348-fast-style';s.textContent='body>.hayat-v3343-tools,body>.hayat-v3346-mobile-tools{display:none!important}html.hayat-ar body,html.hayat-ar #panel,html.hayat-ar .leaflet-popup-content{direction:rtl;text-align:right}html.hayat-ar #hayat-v3343-panel{direction:rtl;text-align:right;left:12px;right:auto}html.hayat-ar #hayat-v3343-close{float:left}html.hayat-ar #hayat-v3343-panel ul{padding-right:18px;padding-left:0}';document.head.appendChild(s)}
  function boot(){style();cleanVersion();apply(q('#panel')||document.body)}
  document.addEventListener('click',function(){if(on())setTimeout(function(){apply(q('#panel')||document.body);var p=q('.leaflet-popup-content');if(p)apply(p)},80)},true);
  [250,900,1800,3200].forEach(function(ms){setTimeout(boot,ms)});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
