// Hayat GIS v3.3.49 - Self-contained What Changed panel fix
// Fixes What changed / آخر التحديثات button showing nothing in English and Arabic.
(function(){
  'use strict';
  if(window.__HAYAT_V3349_WHAT_CHANGED_PANEL_FIX_LOADED) return;
  window.__HAYAT_V3349_WHAT_CHANGED_PANEL_FIX_LOADED = true;

  var LANG_KEY = 'HAYAT_UI_LANGUAGE';
  function qs(sel, root){ return (root || document).querySelector(sel); }
  function qsa(sel, root){ return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function isAr(){
    try{
      return localStorage.getItem(LANG_KEY) === 'ar' ||
        document.documentElement.lang === 'ar' ||
        document.documentElement.dir === 'rtl' ||
        document.body.classList.contains('hayat-ar');
    }catch(e){ return false; }
  }
  function isAdmin(){
    return /admin\.html/i.test(location.pathname) || !!qs('#plotEditModal') || !!qs('#exportFullPackageBtn') || !!qs('#exportBtn');
  }
  function esc(v){
    return String(v == null ? '' : v).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  var SECTIONS = [
    {
      kind:'both', date:'12/09/2026', enTitle:'Filter tab speed fix', arTitle:'تسريع تبويبات الفلاتر',
      en:[
        'Removed the slow layered Arabic/mobile helper scripts from the active loader.',
        'Kept Arabic support, Guide, and What changed without the continuous full-page observer.',
        'Filter tabs should open faster and feel smoother on mobile and desktop.',
        'No map data was changed in this speed update.'
      ],
      ar:[
        'تم إيقاف تحميل السكربتات المساعدة القديمة التي كانت تبطئ الفلاتر.',
        'تم الإبقاء على دعم العربية والدليل وآخر التحديثات بدون مراقبة مستمرة لكل الصفحة.',
        'تبويبات الفلاتر يجب أن تفتح بشكل أسرع على الموبايل والكمبيوتر.',
        'لم يتم تغيير بيانات الخريطة في هذا التحديث.'
      ]
    },
    {
      kind:'both', date:'12/09/2026', enTitle:'What changed panel fixed', arTitle:'إصلاح لوحة آخر التحديثات',
      en:[
        'What changed now opens from its own independent panel, so it does not depend on older scripts.',
        'The same button works in English and Arabic.',
        'The panel has its own Close button and can also be closed by tapping outside it.',
        'Agent map shows agent-relevant updates only; Admin map shows full admin and agent notes.'
      ],
      ar:[
        'زر آخر التحديثات يفتح الآن لوحة مستقلة ولا يعتمد على السكربتات القديمة.',
        'نفس الزر يعمل في وضع الإنجليزية ووضع العربية.',
        'اللوحة فيها زر إغلاق مستقل ويمكن إغلاقها أيضاً بالضغط خارجها.',
        'خريطة الوكلاء تعرض التحديثات التي تهم الوكلاء فقط، أما خريطة الأدمن فتعرض التفاصيل الكاملة.'
      ]
    },
    {
      kind:'both', date:'12/09/2026', enTitle:'Quick buttons inside filter panel', arTitle:'الأزرار السريعة داخل لوحة الفلاتر',
      en:[
        'Arabic / Guide / What changed were moved into the top filter area.',
        'The three buttons now have matching sizes and sit with the other filter controls.',
        'On mobile, the buttons should appear inside the filter panel instead of floating over the map.',
        'The older bottom/top floating toolbars are suppressed to avoid duplicate controls.'
      ],
      ar:[
        'تم نقل أزرار العربية / الدليل / آخر التحديثات إلى أعلى لوحة الفلاتر.',
        'الأزرار الثلاثة أصبحت بنفس الحجم وتظهر مع باقي أدوات الفلترة.',
        'على الموبايل تظهر الأزرار داخل لوحة الفلاتر بدل أن تطفو فوق الخريطة.',
        'تم إخفاء أماكن الأزرار العائمة القديمة حتى لا تظهر مكررة.'
      ]
    },
    {
      kind:'both', date:'12/09/2026', enTitle:'Arabic and English guide behavior', arTitle:'الدليل حسب اللغة',
      en:[
        'Guide opens the English training guide when the map is in English.',
        'Guide opens the Arabic training guide when the map is in Arabic.',
        'The guides explain the map buttons, filters, labels, search, copy tools, and update panel.',
        'Arabic guide is RTL Arabic; English guide is English.'
      ],
      ar:[
        'زر الدليل يفتح الدليل الإنجليزي عندما تكون الخريطة باللغة الإنجليزية.',
        'زر الدليل يفتح الدليل العربي عندما تكون الخريطة باللغة العربية.',
        'الأدلة تشرح أزرار الخريطة والفلاتر والليبلات والبحث وأدوات النسخ ولوحة التحديثات.',
        'الدليل العربي باتجاه عربي RTL، والدليل الإنجليزي باللغة الإنجليزية.'
      ]
    },
    {
      kind:'both', date:'10/09/2026', enTitle:'Latest map data update', arTitle:'آخر تحديث لبيانات الخريطة',
      en:[
        'Inventory records became 495.',
        'Master-plan PA label points remain 2,963.',
        '4 plots were added: 5130989, 5132133, 5134981, and 5135007.',
        '1 old duplicate/reference record was removed: PA4_26.',
        '40 existing plot records were updated from the latest export.',
        '1 master-plan label coordinate was updated: PA4_052.'
      ],
      ar:[
        'أصبح عدد سجلات الإنفنتوري 495.',
        'عدد نقاط أرقام المخطط الرئيسي بقي 2,963.',
        'تمت إضافة 4 قطع: 5130989 و 5132133 و 5134981 و 5135007.',
        'تم حذف سجل قديم/مكرر واحد: PA4_26.',
        'تم تحديث 40 سجل قطعة موجودة حسب آخر ملف تصدير.',
        'تم تعديل إحداثيات رقم مخطط واحد: PA4_052.'
      ]
    },
    {
      kind:'both', date:'10/09/2026', enTitle:'Added plot details', arTitle:'تفاصيل القطع المضافة',
      en:[
        '5130989 / PA14_223 — Malek Al Masri, 11,625.16 sqft, AED 340/sqft, Red, Single Row, G+1.',
        '5132133 / PA7_126 — Hayat Al Masri, 11,858.83 sqft, AED 350/sqft, Red, Back to Back, with construction extension note kept in comments.',
        '5134981 / PA4_026 — Lama Ismail, 10,000.03 sqft, AED 450/sqft, Red, Single Row, G+1.',
        '5135007 / PA4_052 — Issam Al Halabi, 10,000.03 sqft, AED 320/sqft, Red, Back to Back.'
      ],
      ar:[
        '5130989 / PA14_223 — مالك المصري، 11,625.16 قدم مربع، 340 درهم/قدم، أحمر، صف واحد، G+1.',
        '5132133 / PA7_126 — حياة المصري، 11,858.83 قدم مربع، 350 درهم/قدم، أحمر، ظهر لظهر، مع حفظ ملاحظة تمديد البناء في التعليقات.',
        '5134981 / PA4_026 — لمى إسماعيل، 10,000.03 قدم مربع، 450 درهم/قدم، أحمر، صف واحد، G+1.',
        '5135007 / PA4_052 — عصام الحلبي، 10,000.03 قدم مربع، 320 درهم/قدم، أحمر، ظهر لظهر.'
      ]
    },
    {
      kind:'both', date:'10/09/2026', enTitle:'Updated record behavior', arTitle:'طريقة تحديث السجلات',
      en:[
        'Several records received corrected Last Date Updated values from the latest export.',
        'Some second-agent and second-offer fields were cleared where the latest export no longer shows a second offer.',
        'For some plots, the latest export made the previous second offer become the main visible offer, such as 5131922, 5135097, and 5135293.',
        'Coordinates were refreshed where the latest export included corrected coordinates.'
      ],
      ar:[
        'عدة سجلات حصلت على تصحيح في آخر تاريخ تحديث حسب آخر ملف تصدير.',
        'تم حذف بعض حقول الوكيل الثاني والعرض الثاني عندما لم يعد آخر ملف تصدير يحتوي على عرض ثانٍ.',
        'في بعض القطع أصبح العرض الذي كان ثانياً هو العرض الرئيسي الظاهر حسب آخر ملف، مثل 5131922 و 5135097 و 5135293.',
        'تم تحديث الإحداثيات في السجلات التي احتوى ملف التصدير الأخير على إحداثيات مصححة لها.'
      ]
    },
    {
      kind:'both', date:'12/09/2026', enTitle:'Search and filters reminder', arTitle:'تذكير البحث والفلاتر',
      en:[
        'Search supports GIS plot number, master-plan plot number, agent name, and mobile number.',
        'Filter tabs include agents, statuses/colors, types, features, phases, GFA, and pricing.',
        'Inside one filter tab, multiple choices work as OR. Between different tabs, filters work together as AND.',
        'All selects every choice inside the opened filter. Clear removes all selections inside that filter.'
      ],
      ar:[
        'البحث يدعم رقم قطعة GIS ورقم المخطط الرئيسي واسم الوكيل ورقم الموبايل.',
        'تبويبات الفلترة تشمل الوكلاء والحالات/الألوان والأنواع والمميزات والمراحل و GFA والأسعار.',
        'داخل نفس الفلتر، الاختيارات المتعددة تعمل كـ OR. بين الفلاتر المختلفة تعمل الشروط معاً كـ AND.',
        'زر All يحدد كل الخيارات داخل الفلتر المفتوح. زر Clear يمسح كل الاختيارات داخل نفس الفلتر.'
      ]
    },
    {
      kind:'both', date:'12/09/2026', enTitle:'Labels and display options', arTitle:'الليبلات وخيارات العرض',
      en:[
        'Display labels can show GIS number, master-plan number, price, agent, features, and Last Updated where available.',
        'Master-plan PA labels remain transparent and can be switched on/off.',
        'Agent view keeps viewing and copying tools, but does not show admin editing tools.',
        'Plot numbers, PA numbers, prices, coordinates, and phone numbers are never translated.'
      ],
      ar:[
        'خيارات الليبلات يمكن أن تعرض رقم GIS ورقم المخطط والسعر والوكيل والمميزات وآخر تحديث عند توفره.',
        'أرقام المخطط PA تبقى شفافة ويمكن إظهارها أو إخفاؤها.',
        'خريطة الوكلاء تبقي أدوات العرض والنسخ فقط ولا تعرض أدوات تعديل الأدمن.',
        'أرقام القطع وأرقام PA والأسعار والإحداثيات وأرقام الهواتف لا تتم ترجمتها.'
      ]
    },
    {
      kind:'admin', date:'12/09/2026', enTitle:'Admin-only editing notes', arTitle:'ملاحظات الأدمن فقط',
      en:[
        'Admin map keeps Add Plot / Add Inventory tools.',
        'Admin map keeps edit fields for price, agent, mobile, type, phase, features, GFA, manual GFA allowed, comments, and Last Date Updated.',
        'Admin map keeps Move Plot / Save Position / Cancel movement tools.',
        'Admin export tools remain admin-only and are not shown as agent-facing changes.'
      ],
      ar:[
        'خريطة الأدمن تبقي أدوات إضافة قطعة / إضافة إنفنتوري.',
        'خريطة الأدمن تبقي حقول تعديل السعر والوكيل والموبايل والنوع والمرحلة والمميزات و GFA و GFA اليدوي والتعليقات وآخر تاريخ تحديث.',
        'خريطة الأدمن تبقي أدوات نقل القطعة / حفظ الموقع / إلغاء النقل.',
        'أدوات التصدير تبقى للأدمن فقط ولا تظهر كتحديثات تخص الوكلاء.'
      ]
    }
  ];

  function addStyle(){
    if(qs('#hayat-v3349-style')) return;
    var style = document.createElement('style');
    style.id = 'hayat-v3349-style';
    style.textContent = [
      '#hayat-v3349-overlay{position:fixed!important;inset:0!important;background:rgba(0,0,0,.38)!important;z-index:2147483647!important;display:none!important;align-items:flex-start!important;justify-content:center!important;padding:52px 12px 16px!important;box-sizing:border-box!important}',
      '#hayat-v3349-overlay.hayat-v3349-open{display:flex!important}',
      '#hayat-v3349-box{width:min(720px,96vw)!important;max-height:calc(100dvh - 76px)!important;overflow:auto!important;background:#fffaf0!important;color:#10211d!important;border:2px solid #d3ab4e!important;border-radius:16px!important;box-shadow:0 18px 54px rgba(0,0,0,.35)!important;font-family:Arial,sans-serif!important}',
      '#hayat-v3349-head{position:sticky!important;top:0!important;background:#10211d!important;color:#d3ab4e!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;padding:12px 14px!important;border-bottom:1px solid #d3ab4e!important;z-index:2!important}',
      '#hayat-v3349-head h2{font-size:18px!important;line-height:1.2!important;margin:0!important;color:#d3ab4e!important;font-weight:900!important}',
      '#hayat-v3349-close{border:1px solid #d3ab4e!important;background:#d3ab4e!important;color:#10211d!important;border-radius:10px!important;height:36px!important;min-width:82px!important;font-weight:900!important;font-size:13px!important;cursor:pointer!important}',
      '#hayat-v3349-body{padding:12px 14px 16px!important}',
      '#hayat-v3349-body .intro{font-size:13px!important;line-height:1.45!important;margin:0 0 12px!important;color:#36423d!important}',
      '#hayat-v3349-body .role{display:inline-block!important;margin:0 0 10px!important;padding:5px 10px!important;border-radius:999px!important;background:#10211d!important;color:#d3ab4e!important;font-size:12px!important;font-weight:900!important}',
      '#hayat-v3349-body .section{border:1px solid #ead9a9!important;background:#fffdf8!important;border-radius:12px!important;padding:10px 12px!important;margin:10px 0!important}',
      '#hayat-v3349-body .section h3{font-size:15px!important;line-height:1.25!important;margin:0 0 6px!important;color:#10211d!important;font-weight:900!important}',
      '#hayat-v3349-body .date{display:inline-block!important;margin:0 0 6px!important;color:#7a6532!important;font-size:11px!important;font-weight:900!important}',
      '#hayat-v3349-body ul{margin:4px 0 0 18px!important;padding:0!important}',
      '#hayat-v3349-body li{margin:5px 0!important;font-size:13px!important;line-height:1.42!important}',
      'html.hayat-ar #hayat-v3349-box,#hayat-v3349-box[dir="rtl"]{direction:rtl!important;text-align:right!important}',
      'html.hayat-ar #hayat-v3349-body ul,#hayat-v3349-box[dir="rtl"] ul{margin:4px 18px 0 0!important}',
      '#panel .hayat-v3349-fixed-tools{display:block!important;width:100%!important;margin:8px 0 12px!important;padding:8px!important;background:rgba(16,33,29,.96)!important;border:1.5px solid #d3ab4e!important;border-radius:14px!important;box-sizing:border-box!important;position:relative!important;z-index:999999!important}',
      '#panel .hayat-v3349-fixed-tools .label{font-size:11px!important;color:#d3ab4e!important;font-weight:900!important;margin:0 0 6px!important;opacity:.9!important}',
      '#panel .hayat-v3349-fixed-tools .row{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:8px!important;width:100%!important}',
      '#panel .hayat-v3349-fixed-tools button,#panel .hayat-v3349-fixed-tools a{display:flex!important;align-items:center!important;justify-content:center!important;width:100%!important;height:42px!important;box-sizing:border-box!important;margin:0!important;padding:8px!important;border-radius:10px!important;border:1px solid #d3ab4e!important;background:#10211d!important;color:#d3ab4e!important;text-decoration:none!important;font-size:13px!important;font-weight:900!important;line-height:1.05!important;text-align:center!important;cursor:pointer!important}',
      '@media(max-width:820px){#hayat-v3349-overlay{padding-top:26px!important}#hayat-v3349-box{width:96vw!important;max-height:calc(100dvh - 42px)!important}#hayat-v3349-head h2{font-size:16px!important}#panel .hayat-v3349-fixed-tools button,#panel .hayat-v3349-fixed-tools a{height:38px!important;font-size:12px!important;padding:6px 5px!important}#panel .hayat-v3349-fixed-tools{position:sticky!important;top:0!important}}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function makeOverlay(){
    addStyle();
    var ov = qs('#hayat-v3349-overlay');
    if(ov) return ov;
    ov = document.createElement('div');
    ov.id = 'hayat-v3349-overlay';
    ov.setAttribute('aria-hidden','true');
    ov.innerHTML = '<div id="hayat-v3349-box" role="dialog" aria-modal="true"><div id="hayat-v3349-head"><h2></h2><button id="hayat-v3349-close" type="button"></button></div><div id="hayat-v3349-body"></div></div>';
    document.body.appendChild(ov);
    return ov;
  }

  function render(){
    var arabic = isAr();
    var adminMode = isAdmin();
    var ov = makeOverlay();
    var box = qs('#hayat-v3349-box', ov);
    var head = qs('#hayat-v3349-head h2', ov);
    var close = qs('#hayat-v3349-close', ov);
    var body = qs('#hayat-v3349-body', ov);
    if(box) box.dir = arabic ? 'rtl' : 'ltr';
    if(head) head.textContent = arabic ? 'آخر التحديثات وما الذي تغير' : 'Latest updates / What changed';
    if(close) close.textContent = arabic ? 'إغلاق' : 'Close';
    var html = '';
    html += '<div class="role">' + esc(arabic ? (adminMode ? 'وضع الأدمن' : 'وضع الوكلاء') : (adminMode ? 'Admin view' : 'Agent view')) + '</div>';
    html += '<p class="intro">' + esc(arabic ? 'هذه اللوحة تعرض آخر التحديثات المهمة. في خريطة الوكلاء يتم إخفاء تحديثات التعديل الخاصة بالأدمن لأنها لا تخص الوكيل.' : 'This panel shows the important recent changes. On the Agent map, admin-only editing changes are hidden because they do not concern agents.') + '</p>';
    SECTIONS.forEach(function(s){
      if(s.kind === 'admin' && !adminMode) return;
      var title = arabic ? s.arTitle : s.enTitle;
      var list = arabic ? s.ar : s.en;
      html += '<div class="section"><span class="date">' + esc(s.date) + '</span><h3>' + esc(title) + '</h3><ul>';
      list.forEach(function(item){ html += '<li>' + esc(item) + '</li>'; });
      html += '</ul></div>';
    });
    body.innerHTML = html;
  }

  function showPanel(){
    render();
    var ov = qs('#hayat-v3349-overlay');
    if(!ov) return;
    ov.classList.add('hayat-v3349-open');
    ov.setAttribute('aria-hidden','false');
  }
  function hidePanel(){
    var ov = qs('#hayat-v3349-overlay');
    if(!ov) return;
    ov.classList.remove('hayat-v3349-open');
    ov.setAttribute('aria-hidden','true');
  }

  function ensureButtons(){
    addStyle();
    var panel = qs('#panel') || qs('.panel') || qs('#filters') || qs('.filters');
    if(!panel) return;
    var wrap = qs('#hayat-v3349-fixed-tools');
    if(!wrap){
      wrap = document.createElement('div');
      wrap.id = 'hayat-v3349-fixed-tools';
      wrap.className = 'hayat-v3349-fixed-tools';
      wrap.innerHTML = '<div class="label"></div><div class="row"><button id="hayat-v3349-lang" type="button"></button><a id="hayat-v3349-guide" target="_blank" rel="noopener"></a><button id="hayat-v3349-updates" type="button"></button></div>';
    }
    if(wrap.parentNode !== panel){
      var after = qs('.small-note', panel) || qs('h3', panel) || panel.firstElementChild;
      if(after && after.parentNode === panel) after.insertAdjacentElement('afterend', wrap);
      else panel.insertBefore(wrap, panel.firstChild);
    }
    var arabic = isAr();
    qs('.label', wrap).textContent = arabic ? 'أدوات سريعة' : 'Quick tools';
    var lang = qs('#hayat-v3349-lang', wrap);
    var guide = qs('#hayat-v3349-guide', wrap);
    var updates = qs('#hayat-v3349-updates', wrap);
    if(lang){
      lang.textContent = arabic ? 'English' : 'العربية';
      lang.onclick = function(e){
        e.preventDefault(); e.stopPropagation();
        try{ localStorage.setItem(LANG_KEY, arabic ? 'en' : 'ar'); }catch(_e){}
        location.reload();
      };
    }
    if(guide){
      guide.textContent = arabic ? 'دليل التدريب' : 'Guide';
      guide.href = arabic ? 'Hayat_GIS_Training_Guide_AR.pdf' : 'Hayat_GIS_Training_Guide.pdf';
    }
    if(updates){
      updates.textContent = arabic ? 'آخر التحديثات' : 'What changed';
      updates.onclick = function(e){
        e.preventDefault(); e.stopPropagation();
        showPanel();
        return false;
      };
    }

    // Re-wire older button IDs too, in case the user presses a button created by previous scripts.
    ['#hayat-v3343-updates','#hayat-v3347-updates','#hayat-v3346-updates'].forEach(function(sel){
      var old = qs(sel);
      if(old){
        old.onclick = function(e){
          e.preventDefault(); e.stopPropagation();
          showPanel();
          return false;
        };
      }
    });
  }

  document.addEventListener('click', function(e){
    var target = e.target;
    if(!target) return;
    var close = target.closest && target.closest('#hayat-v3349-close');
    if(close){
      e.preventDefault(); e.stopPropagation();
      hidePanel();
      return;
    }
    var ov = qs('#hayat-v3349-overlay');
    if(ov && target === ov){
      e.preventDefault(); e.stopPropagation();
      hidePanel();
      return;
    }
    var btn = target.closest && target.closest('#hayat-v3349-updates,#hayat-v3343-updates,#hayat-v3347-updates,#hayat-v3346-updates,button,a');
    if(btn){
      var txt = (btn.textContent || '').replace(/\s+/g,' ').trim().toLowerCase();
      var isUpdates = btn.id === 'hayat-v3349-updates' || btn.id === 'hayat-v3343-updates' || btn.id === 'hayat-v3347-updates' || btn.id === 'hayat-v3346-updates' || txt === 'what changed' || txt === 'آخر التحديثات' || txt.indexOf('what changed') >= 0 || txt.indexOf('آخر التحديثات') >= 0;
      if(isUpdates){
        e.preventDefault();
        e.stopPropagation();
        if(e.stopImmediatePropagation) e.stopImmediatePropagation();
        showPanel();
        return false;
      }
    }
  }, true);

  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape') hidePanel();
  });

  function boot(){
    makeOverlay();
    ensureButtons();
  }
  boot();
  [250, 800, 1600, 3000].forEach(function(ms){ setTimeout(boot, ms); });
  window.HAYAT_OPEN_WHAT_CHANGED = showPanel;
})();
