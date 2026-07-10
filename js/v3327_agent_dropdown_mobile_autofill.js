// v3.3.27 - Agent dropdown + mobile autofill restore
// Purpose: restore the Admin Add/Edit Plot workflow where agent names can be chosen from a list
// and the mobile number is filled automatically. Loaded last and does not touch filters, labels,
// PA + Add badges, Move Plot, bulk features, or Agent view-only behavior.
(function(){
  'use strict';
  function $(id){ return document.getElementById(id); }
  function isAdmin(){ return !!$('plotEditModal') || /admin\.html/i.test(location.pathname); }
  if(!isAdmin()) return;

  var DATA_LIST_ID = 'hayatAgentNameListV3327';
  var SECOND_DATA_LIST_ID = 'hayatSecondAgentNameListV3327';
  var agentMobileMap = {};
  var lastPrimaryAgent = '';
  var lastSecondAgent = '';

  function clean(v){ return String(v == null ? '' : v).replace(/\s+/g,' ').trim(); }
  function norm(v){ return clean(v).toLowerCase(); }
  function title(v){
    v = clean(v);
    if(!v) return '';
    return v.toLowerCase().split(' ').map(function(w){
      if(/^g\+\d+$/i.test(w)) return w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1);
    }).join(' ');
  }
  function mobileClean(v){ return clean(v); }

  function chooseBetterMobile(existing, candidate){
    existing = mobileClean(existing); candidate = mobileClean(candidate);
    if(!candidate) return existing;
    if(!existing) return candidate;
    // Prefer UAE-looking numbers if duplicate names appear with mixed/blank formatting.
    var exScore = (/\+?971|^05/.test(existing) ? 2 : 1) + Math.min(existing.length, 20) / 100;
    var caScore = (/\+?971|^05/.test(candidate) ? 2 : 1) + Math.min(candidate.length, 20) / 100;
    return caScore > exScore ? candidate : existing;
  }

  function collectAgentMobiles(){
    var map = {};
    (window.points || []).forEach(function(p){
      if(!p) return;
      [[p.agent, p.mobile], [p.secondAgent, p.secondMobile]].forEach(function(pair){
        var name = title(pair[0]);
        var mob = mobileClean(pair[1]);
        if(!name) return;
        var key = norm(name);
        if(!map[key]) map[key] = { name:name, mobile:'' };
        map[key].name = name;
        map[key].mobile = chooseBetterMobile(map[key].mobile, mob);
      });
    });
    agentMobileMap = map;
    return map;
  }

  function ensureDatalist(id){
    var dl = $(id);
    if(!dl){
      dl = document.createElement('datalist');
      dl.id = id;
      document.body.appendChild(dl);
    }
    return dl;
  }

  function fillDatalists(){
    var map = collectAgentMobiles();
    var names = Object.keys(map).map(function(k){ return map[k]; }).sort(function(a,b){ return a.name.localeCompare(b.name); });
    [DATA_LIST_ID, SECOND_DATA_LIST_ID].forEach(function(id){
      var dl = ensureDatalist(id);
      dl.innerHTML = '';
      names.forEach(function(item){
        var opt = document.createElement('option');
        opt.value = item.name;
        if(item.mobile) opt.label = item.mobile;
        dl.appendChild(opt);
      });
    });
  }

  function addHint(input, text){
    if(!input || input.__v3327HintAdded) return;
    input.__v3327HintAdded = true;
    var hint = document.createElement('div');
    hint.className = 'v3327-agent-hint';
    hint.textContent = text;
    input.insertAdjacentElement('afterend', hint);
  }

  function installStyles(){
    if($('v3327AgentAutofillCss')) return;
    var st = document.createElement('style');
    st.id = 'v3327AgentAutofillCss';
    st.textContent = [
      '#editAgent[list],#editSecondAgent[list]{background-image:linear-gradient(45deg,transparent 50%,#7b5b1f 50%),linear-gradient(135deg,#7b5b1f 50%,transparent 50%);background-position:calc(100% - 14px) 50%,calc(100% - 9px) 50%;background-size:5px 5px,5px 5px;background-repeat:no-repeat;padding-right:26px!important;}',
      '.v3327-agent-hint{font-size:10.5px;color:#6b5b36;margin-top:3px;line-height:1.25}',
      '.plot-edit-grid label .v3327-agent-hint{font-weight:400}',
      '@media(max-width:700px){.v3327-agent-hint{font-size:10px}}'
    ].join('\n');
    document.head.appendChild(st);
  }

  function lookupMobile(agentName){
    var item = agentMobileMap[norm(agentName)];
    return item ? item.mobile : '';
  }

  function maybeAutofill(agentId, mobileId, force){
    fillDatalists();
    var agentInput = $(agentId), mobileInput = $(mobileId);
    if(!agentInput || !mobileInput) return;
    var agentName = clean(agentInput.value);
    var mobile = lookupMobile(agentName);
    if(!mobile) return;
    if(force || !clean(mobileInput.value) || mobileInput.__v3327AutoFilled){
      mobileInput.value = mobile;
      mobileInput.__v3327AutoFilled = true;
    } else {
      // User may have typed a custom number. Do not overwrite unless the agent changed.
      if(agentId === 'editAgent' && norm(agentName) !== norm(lastPrimaryAgent)){
        mobileInput.value = mobile;
        mobileInput.__v3327AutoFilled = true;
      }
      if(agentId === 'editSecondAgent' && norm(agentName) !== norm(lastSecondAgent)){
        mobileInput.value = mobile;
        mobileInput.__v3327AutoFilled = true;
      }
    }
    if(agentId === 'editAgent') lastPrimaryAgent = agentName;
    if(agentId === 'editSecondAgent') lastSecondAgent = agentName;
  }

  function installAgentPickers(){
    installStyles();
    fillDatalists();
    var a = $('editAgent'), m = $('editMobile'), sa = $('editSecondAgent'), sm = $('editSecondMobile');
    if(a){
      a.setAttribute('list', DATA_LIST_ID);
      a.setAttribute('autocomplete', 'off');
      a.setAttribute('placeholder', 'Choose agent from list');
      addHint(a, 'Choose an agent from the list; mobile fills automatically. You can still type manually.');
    }
    if(sa){
      sa.setAttribute('list', SECOND_DATA_LIST_ID);
      sa.setAttribute('autocomplete', 'off');
      sa.setAttribute('placeholder', 'Choose second agent from list');
      addHint(sa, 'Optional: choose second agent from the same list.');
    }
    if(a && !a.__v3327Hooked){
      a.__v3327Hooked = true;
      ['input','change','blur'].forEach(function(evt){ a.addEventListener(evt, function(){ maybeAutofill('editAgent','editMobile', evt === 'change' || evt === 'blur'); }); });
      a.addEventListener('focus', fillDatalists);
    }
    if(sa && !sa.__v3327Hooked){
      sa.__v3327Hooked = true;
      ['input','change','blur'].forEach(function(evt){ sa.addEventListener(evt, function(){ maybeAutofill('editSecondAgent','editSecondMobile', evt === 'change' || evt === 'blur'); }); });
      sa.addEventListener('focus', fillDatalists);
    }
    if(m && !m.__v3327ManualHooked){
      m.__v3327ManualHooked = true;
      m.addEventListener('input', function(){ m.__v3327AutoFilled = false; });
    }
    if(sm && !sm.__v3327ManualHooked){
      sm.__v3327ManualHooked = true;
      sm.addEventListener('input', function(){ sm.__v3327AutoFilled = false; });
    }
  }

  function afterModalOpen(){
    setTimeout(function(){
      installAgentPickers();
      lastPrimaryAgent = clean(($('editAgent') || {}).value);
      lastSecondAgent = clean(($('editSecondAgent') || {}).value);
    }, 0);
  }

  function wrap(name){
    var old = window[name];
    if(typeof old !== 'function' || old.__v3327Wrapped) return;
    var wrapped = function(){
      var res = old.apply(this, arguments);
      afterModalOpen();
      return res;
    };
    wrapped.__v3327Wrapped = true;
    window[name] = wrapped;
  }

  function init(){
    installAgentPickers();
    wrap('openPlotEditorByRow');
    wrap('openAddPlotByPA');
    wrap('startAddPlotByMapClick');
    var oldSave = window.savePlotEdit;
    if(typeof oldSave === 'function' && !oldSave.__v3327Wrapped){
      var saveWrapped = function(){
        maybeAutofill('editAgent','editMobile', true);
        maybeAutofill('editSecondAgent','editSecondMobile', true);
        var res = oldSave.apply(this, arguments);
        setTimeout(function(){ fillDatalists(); }, 100);
        return res;
      };
      saveWrapped.__v3327Wrapped = true;
      window.savePlotEdit = saveWrapped;
    }
    window.refreshAgentMobileDropdowns = function(){ fillDatalists(); installAgentPickers(); };
    console.log('v3.3.27 Agent dropdown + mobile autofill restored');
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  setTimeout(init, 500);
})();
