(function(){
  function safeText(v){ return (v === null || v === undefined) ? '' : String(v); }
  function cleanText(v){ return safeText(v).replace(/\s+/g,' ').trim(); }
  function titleCaseWord(w){
    if (!w) return '';
    var upperTokens = {'G+1':true,'G+4':true,'AED':true,'PA':true};
    var raw = cleanText(w);
    if (upperTokens[raw.toUpperCase()]) return raw.toUpperCase();
    return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
  }
  function titleCasePhrase(s){
    s = cleanText(s);
    if (!s) return '';
    return s.split(' ').map(function(part){
      return part.split('/').map(function(piece){
        return piece.split('-').map(titleCaseWord).join('-');
      }).join(' / ');
    }).join(' ');
  }
  function normalizeType(v){
    var s = cleanText(v);
    if (!s) return '';
    var key = s.toLowerCase().replace(/\s+/g,' ');
    var map = {
      'plot':'Plot',
      'ready villa':'Ready Villa',
      'ready building':'Ready Building',
      'building':'Building',
      'twin villa':'Twin Villa',
      'twin villa (ready)':'Twin Villa (Ready)',
      'retail / hotel apartments':'Retail / Hotel Apartments',
      'retail/hotel apartments':'Retail / Hotel Apartments'
    };
    return map[key] || titleCasePhrase(s);
  }
  function normalizeColor(v){
    var s = cleanText(v).toLowerCase();
    if (s === 'direct' || s === 'red') return 'Red';
    if (s === 'through broker' || s === 'throughbroker' || s === 'blue') return 'Blue';
    if (s === 'on hold' || s === 'onhold' || s === 'pink') return 'Pink';
    if (!s) return '';
    return titleCasePhrase(s);
  }
  function normalizeAgent(v){ return titleCasePhrase(v); }
  function normalizePhase(v){ return cleanText(v); }
  function normalizeGfa(v){
    var s = cleanText(v).toUpperCase().replace(/\s+/g,'');
    if (s === 'G+1' || s === 'G+4') return s;
    return cleanText(v);
  }
  function normalizePoint(p){
    if (!p) return p;
    if (p.type !== undefined) p.type = normalizeType(p.type);
    if (p.color !== undefined) p.color = normalizeColor(p.color) || 'Red';
    if (p.secondColor !== undefined) p.secondColor = normalizeColor(p.secondColor);
    if (p.agent !== undefined) p.agent = normalizeAgent(p.agent);
    if (p.secondAgent !== undefined) p.secondAgent = normalizeAgent(p.secondAgent);
    if (p.phase !== undefined) p.phase = normalizePhase(p.phase);
    if (p.gfa !== undefined) p.gfa = normalizeGfa(p.gfa);
    return p;
  }
  function normalizeAllPoints(){
    if (!window.points || !Array.isArray(window.points)) return;
    window.points.forEach(normalizePoint);
  }
  window.HayatDataNormalize = { cleanText: cleanText, normalizeType: normalizeType, normalizeColor: normalizeColor, normalizeAgent: normalizeAgent, normalizePhase: normalizePhase, normalizeGfa: normalizeGfa, normalizePoint: normalizePoint, normalizeAllPoints: normalizeAllPoints };
})();
