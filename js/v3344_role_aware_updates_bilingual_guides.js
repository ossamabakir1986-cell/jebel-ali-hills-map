// Hayat GIS role-aware update log and bilingual guide links
(function(){
  'use strict';
  if(window.__HAYAT_V3344_ROLE_AWARE_GUIDES_LOADED) return;
  window.__HAYAT_V3344_ROLE_AWARE_GUIDES_LOADED = true;
  var LANG_KEY = 'HAYAT_UI_LANGUAGE';
  function isArabic(){ return localStorage.getItem(LANG_KEY)==='ar' || document.documentElement.lang==='ar' || document.documentElement.dir==='rtl'; }
  function isAdmin(){ return /admin\.html/i.test(location.pathname) || !!document.getElementById('plotEditModal'); }
  function q(s,r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); }
  function clean(v){ return String(v==null?'':v).replace(/\s+/g,' ').trim(); }
  function esc(v){ return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function guideFile(){ return isArabic() ? 'Hayat_GIS_Training_Guide_AR.html' : 'Hayat_GIS_Training_Guide_EN.html'; }
  function addStyle(){
    if(document.getElementById('hayat-v3344-style')) return;
    var s=document.createElement('style'); s.id='hayat-v3344-style';
    s.textContent='.hayat-v3344-note{font-size:12px;color:#64746c;margin:4px 0 10px}.hayat-v3344-badge{display:inline-block;background:#10211d;color:#d3ab4e;border:1px solid #d3ab4e;border-radius:999px;padding:3px 8px;font-size:11px;font-weight:900;margin:0 4px 5px 0}.hayat-v3344-admin{background:#fff7e5;border-left:4px solid #d3ab4e;padding:8px 10px;border-radius:8px;margin:9px 0}html.hayat-ar .hayat-v3344-admin{border-left:0;border-right:4px solid #d3ab4e}.hayat-v3344-print{display:inline-block;margin-top:8px;background:#10211d;color:#d3ab4e;border:1px solid #d3ab4e;border-radius:8px;padding:7px 10px;text-decoration:none;font-weight:900}';
    document.head.appendChild(s);
  }
  function hideVersionText(){
    var re=/\b(v\d+(?:\.\d+){1,}|version\s*\d+(?:\.\d+){1,}|334[0-9]|333[0-9])\b/i;
    q('#count span,#count small,#count div,.small-note,.stats,.version,.build-version').forEach(function(el){
      var t=clean(el.textContent);
      if(t && re.test(t) && t.length<220) el.style.display='none';
    });
  }
  function getDataStats(){
    var pts = Array.isArray(window.points)?window.points:(Array.isArray(window.HAYAT_PUBLISHED_POINTS)?window.HAYAT_PUBLISHED_POINTS:[]);
    return {inventory:pts.length||495, labels:(Array.isArray(window.jahPaLabels)?window.jahPaLabels.length:2963)};
  }
  function englishLog(admin){
    var st=getDataStats();
    var parts=[];
    parts.push('<button id="hayat-v3344-close" style="float:right;background:#10211d;color:#d3ab4e;border:0;border-radius:8px;padding:4px 8px;font-weight:900;cursor:pointer">Close</button>');
    parts.push('<h3>What changed</h3>');
    parts.push('<p class="hayat-v3344-note">This list is filtered by role. Agents see only changes that affect how they view, search, filter, label, copy, or use the map.</p>');
    parts.push('<span class="hayat-v3344-badge">Agent view</span><span class="hayat-v3344-badge">Latest data</span>');
    parts.push('<h4>Latest map data</h4><ul><li>Inventory now has '+st.inventory+' records.</li><li>Master-plan labels remain '+st.labels+'.</li><li>Latest data update added four records, removed one duplicate/reference, updated forty records, and adjusted one PA label coordinate.</li></ul>');
    parts.push('<h4>Search, filters, and labels</h4><ul><li>Filter menus are stable and no longer rebuild while open.</li><li>All and Clear buttons now visibly tick or untick the available choices.</li><li>Agents can use Arabic/English, display labels, the guide, and What changed without changing the map data.</li></ul>');
    parts.push('<h4>Guide</h4><ul><li>The Guide button opens the English guide in English mode and the Arabic guide in Arabic mode.</li><li>The guide explains the current buttons, filters, labels, All/Clear behavior, and update panel.</li></ul>');
    if(admin){
      parts.push('<div class="hayat-v3344-admin"><h4>Admin-only changes</h4><ul><li>Admin can still see editing-related updates because those tools belong to the Admin map.</li><li>Admin-only notes include Add/Edit Plot, GFA override, Last Date Updated, Move Plot, delete tools, export tools, and website package updates.</li><li>Agents do not see this editing information on the Agent map.</li></ul></div>');
    }
    parts.push('<a class="hayat-v3344-print" target="_blank" href="'+guideFile()+'">Open training guide</a>');
    return parts.join('');
  }
  function arabicLog(admin){
    var st=getDataStats();
    var parts=[];
    parts.push('<button id="hayat-v3344-close" style="float:left;background:#10211d;color:#d3ab4e;border:0;border-radius:8px;padding:4px 8px;font-weight:900;cursor:pointer">إغلاق</button>');
    parts.push('<h3>ما الذي تغير؟</h3>');
    parts.push('<p class="hayat-v3344-note">هذه القائمة تظهر حسب الصلاحية. الوكيل يرى فقط التغييرات التي تخص العرض والبحث والفلاتر والتسميات والنسخ واستخدام الخريطة.</p>');
    parts.push('<span class="hayat-v3344-badge">عرض الوكيل</span><span class="hayat-v3344-badge">آخر تحديث بيانات</span>');
    parts.push('<h4>آخر تحديث لبيانات الخريطة</h4><ul><li>أصبح عدد سجلات الإنفنتوري '+st.inventory+'.</li><li>عدد أرقام المخطط الرئيسي بقي '+st.labels+'.</li><li>آخر تحديث بيانات أضاف أربع قطع، حذف مرجعاً مكرراً/قديماً واحداً، حدّث أربعين سجلاً، وعدّل إحداثيات رقم مخطط واحد.</li></ul>');
    parts.push('<h4>البحث والفلاتر والتسميات</h4><ul><li>قوائم الفلاتر أصبحت ثابتة ولا تتحرك أثناء فتحها.</li><li>زر الكل وزر مسح أصبحا يظهران التحديد أو الإلغاء بشكل واضح.</li><li>يمكن للوكيل استخدام العربية/الإنجليزية والتسميات والدليل وزر ما الذي تغير بدون تعديل بيانات الخريطة.</li></ul>');
    parts.push('<h4>الدليل</h4><ul><li>زر الدليل يفتح الدليل الإنجليزي في الوضع الإنجليزي والدليل العربي في الوضع العربي.</li><li>الدليل يشرح الأزرار والفلاتر والتسميات وطريقة عمل الكل/مسح ولوحة التحديثات.</li></ul>');
    if(admin){
      parts.push('<div class="hayat-v3344-admin"><h4>تغييرات خاصة بالإدارة فقط</h4><ul><li>الإدارة ترى تغييرات التعديل لأنها تخص خريطة الأدمن.</li><li>ملاحظات الأدمن تشمل إضافة/تعديل قطعة، تعديل GFA اليدوي، آخر تاريخ تحديث، تحريك القطعة، الحذف، التصدير، وتحديث حزمة الموقع.</li><li>الوكيل لا يرى معلومات التعديل هذه في خريطة الوكيل.</li></ul></div>');
    }
    parts.push('<a class="hayat-v3344-print" target="_blank" href="'+guideFile()+'">فتح دليل التدريب</a>');
    return parts.join('');
  }
  function panel(){
    var p=document.getElementById('hayat-v3343-panel') || document.getElementById('hayat-v3344-panel');
    if(!p){ p=document.createElement('div'); p.id='hayat-v3343-panel'; document.body.appendChild(p); }
    return p;
  }
  function openUpdates(){
    addStyle(); hideVersionText();
    var p=panel();
    p.innerHTML = isArabic()?arabicLog(isAdmin()):englishLog(isAdmin());
    p.classList.add('open');
    p.style.display='block';
    var close=document.getElementById('hayat-v3344-close');
    if(close) close.onclick=function(){p.classList.remove('open');p.style.display='none';};
  }
  function wireButtons(){
    addStyle(); hideVersionText();
    var u=document.getElementById('hayat-v3343-updates');
    if(u){ u.onclick=function(ev){ev.preventDefault();ev.stopPropagation();openUpdates();}; u.textContent=isArabic()?'ما الذي تغير؟':'What changed'; }
    var g=document.getElementById('hayat-v3343-guide');
    if(g){ g.onclick=function(ev){ev.preventDefault();ev.stopPropagation();window.open(guideFile(),'_blank');}; g.textContent=isArabic()?'دليل التدريب':'Guide'; if(g.tagName==='A') g.setAttribute('href',guideFile()); }
  }
  window.HAYAT_V3344_OPEN_UPDATES=openUpdates;
  setTimeout(wireButtons,400);
  setTimeout(wireButtons,1200);
  setTimeout(wireButtons,2500);
  document.addEventListener('click',function(){setTimeout(wireButtons,50);},true);
  var mo=new MutationObserver(function(){clearTimeout(window.__hayat3344Timer);window.__hayat3344Timer=setTimeout(wireButtons,120);});
  setTimeout(function(){try{mo.observe(document.body,{childList:true,subtree:true});}catch(_){}} ,600);
})();
