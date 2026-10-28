/* HORIZON HDV — outil personnel hors ligne.
   Règles initiales reconstituées à partir du classeur fourni, et non certification aéronautique. */
(() => {
  'use strict';
  const STORE='horizon_hdv_pwa_storage_v1';
  const DEV_TYPES=['EFI','MRTD','FFS','EDITH','FNPT II','EPSA','SHERPA'];
  const AIRCRAFT=['EC120','AS555','SA342','NH90','EC665','AS332','SA330'];
  const FLYING_EXCLUDED=['PCE','VIG','PAX'];
  const NOW=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
  const parse=d=>d?new Date(`${d}T12:00:00`):null;
  const iso=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
  const addMonths=(s,n)=>{const d=parse(s);if(!d)return null;const day=d.getDate();d.setDate(1);d.setMonth(d.getMonth()+n);const last=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();d.setDate(Math.min(day,last));return iso(d)};
  const addDays=(s,n)=>{const d=parse(s);if(!d)return null;d.setDate(d.getDate()+n);return iso(d)};
  const diff=(a,b)=>Math.round((parse(a)-parse(b))/86400000);
  const endOfMonth=(year,month)=>iso(new Date(year,month,0));
  const expiryFor=(date,rule)=>{if(!date||rule.kind==='conditional'||rule.kind==='none')return null;
    if(rule.kind==='months')return addMonths(date,rule.count);
    if(rule.kind==='practical'){const d=parse(date);return endOfMonth(d.getFullYear()+1,d.getMonth()+1)}
    if(rule.kind==='theory'){const d=parse(date);return `${d.getMonth()>=6?d.getFullYear()+1:d.getFullYear()}-06-30`}
    return null;};
  const fmtDate=(d,long=false)=>d?parse(d).toLocaleDateString('fr-FR',long?{day:'numeric',month:'long',year:'numeric'}:{day:'2-digit',month:'short',year:'numeric'}):'—';
  const fnum=n=>(Number(n)||0).toLocaleString('en-US',{minimumFractionDigits:1,maximumFractionDigits:2,useGrouping:false});
  const h=n=>`${fnum(n)} h`;
  const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const number=x=>Math.max(0,Number(x)||0);
  const rule=(kind,count)=>({kind,count});
  const QUAL=[
    {id:'carte-jour',name:'Carte jour',group:'Carte de vol',source:{kind:'field',field:'day'},rule:rule('months',3)},
    {id:'carte-nuit',name:'Carte nuit',group:'Carte de vol',source:{kind:'field',field:'night'},rule:rule('months',3)},
    {id:'carte-jvn',name:'Carte JVN',group:'Carte de vol',source:{kind:'field',field:'sil'},rule:rule('months',3),note:'Le classeur utilise la colonne J « Dont SIL » pour ce calcul.'},
    {id:'carte-vi',name:'Carte VI',group:'Carte de vol',source:{kind:'fieldAny',fields:['capote','cloud']},rule:rule('months',3)},
    {id:'carte-tac',name:'Carte TAC',group:'Carte de vol',source:{kind:'tag',tag:'TAC'},rule:rule('months',3)},
    {id:'carte-tacn',name:'Carte TACN',group:'Carte de vol',source:{kind:'tag',tag:'VTN'},rule:rule('months',3)},
    ...AIRCRAFT.slice(0,6).map(type=>({id:'vol-'+type,name:'Dernier vol '+type,group:'Vols sur type',source:{kind:'type',type},rule:rule('months',6)})),
    ...AIRCRAFT.slice(0,6).map(type=>({id:'pu-'+type,name:'PU '+type,group:'PU par type',source:{kind:'tagType',type,tag:'PU'},rule:rule('months',6)})),
    {id:'simu',name:'Simulateur',group:'Simulateur',source:{kind:'simu'},rule:rule('conditional'),note:'Sous condition : le classeur ne définit pas de durée automatique.'},
    {id:'prat-vav',name:'Contrôle pratique VAV',group:'Contrôles pratiques',source:{kind:'tag',tag:'VAV'},rule:rule('practical')},
    {id:'prat-vi',name:'Contrôle pratique VI',group:'Contrôles pratiques',source:{kind:'tag',tag:'VI'},rule:rule('practical')},
    {id:'prat-sil',name:'Contrôle pratique SIL',group:'Contrôles pratiques',source:{kind:'tag',tag:'JVN'},rule:rule('practical')},
    ...['VAV','VI CAG','VI CAM','EC120','AS555','SA342','EC665','SA332'].map((name,i)=>({id:'theo-'+i,name:'Théorique '+name,group:'Contrôles théoriques',source:{kind:'manual'},rule:rule('theory')})),
    {id:'med-vrpn',name:'VRPN',group:'Aptitudes médicales',source:{kind:'manual',seed:'VRPN'},rule:rule('months',6)},
    {id:'med-cempn',name:'CEMPN',group:'Aptitudes médicales',source:{kind:'manual',seed:'CEMPN'},rule:rule('months',24)},
    {id:'med-classe',name:'Classe 1',group:'Aptitudes médicales',source:{kind:'manual',seed:'CLASSE 1'},rule:rule('months',12)},
    {id:'crm',name:'CRM initial',group:'Autres suivis',source:{kind:'manual',seed:'CRM INIT'},rule:rule('months',36)},
    {id:'gilet',name:'Gilet',group:'Autres suivis',source:{kind:'manual'},rule:rule('none'),note:'Pas de périodicité indiquée dans le classeur.'},
    {id:'trousse',name:'Trousse',group:'Autres suivis',source:{kind:'manual'},rule:rule('none'),note:'Pas de périodicité indiquée dans le classeur.'}
  ];
  const NAV=[{id:'dashboard',label:'Accueil',ico:'grid'},{id:'flights',label:'Vols',ico:'plane'},{id:'quals',label:'Qualifs',ico:'shield'},{id:'stats',label:'Stats',ico:'bars'},{id:'settings',label:'Plus',ico:'settings'}];
  const paths={grid:'<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',plane:'<path d="M17 21v-8l4-2V9l-4 1-3-7h-2l-3 7-4-1v2l4 2v8l-2 1v1l6-2 6 2v-1z"/>',shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',bars:'<path d="M4 20V10M10 20V4M16 20v-7M22 20V8"/>',settings:'<path d="M12 3.5a2 2 0 0 0 2 2l.6.2a2 2 0 0 0 2.6-.7l1.3 1.3a2 2 0 0 0-.7 2.6l.2.6a2 2 0 0 0 2 2v1.8a2 2 0 0 0-2 2l-.2.6a2 2 0 0 0 .7 2.6l-1.3 1.3a2 2 0 0 0-2.6-.7l-.6.2a2 2 0 0 0-2 2h-1.8a2 2 0 0 0-2-2l-.6-.2a2 2 0 0 0-2.6.7l-1.3-1.3a2 2 0 0 0 .7-2.6l-.2-.6a2 2 0 0 0-2-2v-1.8a2 2 0 0 0 2-2l.2-.6a2 2 0 0 0-.7-2.6L5 5a2 2 0 0 0 2.6.7l.6-.2a2 2 0 0 0 2-2Z"/><circle cx="12" cy="12.4" r="3"/>'};
  const navSvg=name=>`<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.grid}</svg>`;
  function load(){try{const s=JSON.parse(localStorage.getItem(STORE));if(s&&Array.isArray(s.flights)&&s.manual&&typeof s.manual==='object')return s}catch(e){}
    const seed={flights:[],manual:{}};return {version:1,flights:JSON.parse(JSON.stringify(seed.flights)),manual:{...seed.manual},overrides:{},settings:{alertDays:30},modifiedAt:null};}
  let state=load();
  let page='dashboard';let flightQuery='';let flightType='all';let flightPeriod='all';let qFilter='all';let statsPeriod='12m';let statsType='all';let noticeTimer;
  function persist(){state.modifiedAt=new Date().toISOString();try{localStorage.setItem(STORE,JSON.stringify(state));queueAutoSync()}catch(e){toast('Enregistrement impossible : espace insuffisant ou stockage désactivé.')}}
  const eligible=f=>!FLYING_EXCLUDED.includes(f.function||'');
  const physical=f=>!DEV_TYPES.includes(f.type||'');
  const latest=arr=>arr.length?arr.map(x=>x.date).filter(Boolean).sort().pop():null;
  function getLast(q){if(state.overrides?.[q.id])return state.overrides[q.id];if(q.source.kind==='manual')return state.manual[q.source.seed||q.id]||null;
    return latest(state.flights.filter(f=>{
      if(!f.date||f.date>NOW())return false;
      const src=q.source;
      switch(src.kind){
        case 'field':return physical(f)&&eligible(f)&&number(f[src.field])>0;
        case 'fieldAny':return physical(f)&&eligible(f)&&src.fields.some(x=>number(f[x])>0);
        case 'tag':return physical(f)&&eligible(f)&&Array.isArray(f.tags)&&f.tags.includes(src.tag);
        case 'type':return eligible(f)&&f.type===src.type&&number(f.total)>0;
        case 'tagType':return f.type===src.type&&Array.isArray(f.tags)&&f.tags.includes(src.tag);
        case 'simu':return DEV_TYPES.includes(f.type)&&number(f.total)>0;
        default:return false;
      }
    }));}
  function qState(q){const last=getLast(q),expiry=expiryFor(last,q.rule),days=expiry?diff(expiry,NOW()):null;
    const status=!last?'none':!expiry?(q.rule.kind==='conditional'?'none':'none'):days<0?'expired':days<=Number(state.settings?.alertDays??30)?'soon':'valid';
    return {...q,last,expiry,days,status};}
  const allStates=()=>QUAL.map(qState);
  const labelStatus=q=>q.status==='expired'?'Périmé':q.status==='soon'?'À renouveler':q.status==='valid'?'Valide':q.last?'Sans échéance':'À renseigner';
  const statusPill=q=>`<span class="status-pill ${q.status}"><span class="status-dot"></span>${labelStatus(q)}</span>`;
  function filterDates(period,flights){const today=NOW();let from=null;
    if(period==='30d')from=addDays(today,-30);else if(period==='12m')from=addMonths(today,-12);else if(period==='year')from=`${today.slice(0,4)}-01-01`;
    return flights.filter(f=>f.date&&f.date<=today&&(!from||f.date>=from));}
  function sums(list){return list.reduce((a,f)=>{a.total+=number(f.total);a.day+=number(f.day);a.night+=number(f.night);a.vi+=number(f.capote)+number(f.cloud);a.sil+=number(f.sil);a.sim+=DEV_TYPES.includes(f.type)?number(f.total):0;a.count++;return a},{total:0,day:0,night:0,vi:0,sil:0,sim:0,count:0})}
  const freshFlights=()=>state.flights.filter(f=>f.date&&f.date<=NOW()).sort((a,b)=>b.date.localeCompare(a.date)||String(b.id).localeCompare(String(a.id)));
  function metric(label,value,unit,ico,foot){return `<div class="metric"><div class="metric-top"><span class="metric-label">${label}</span><span class="metric-ico">${ico}</span></div><div class="metric-value">${value}<span class="metric-unit">${unit}</span></div><div class="metric-foot">${foot}</div></div>`;}
  function renderNav(){for(const id of ['desktopNav','bottomNav']){document.getElementById(id).innerHTML=NAV.map(n=>`<button data-nav="${n.id}" class="${page===n.id?'active':''}" aria-current="${page===n.id?'page':'false'}"><span class="nav-icon">${navSvg(n.ico)}</span><span class="nav-label">${n.label}</span></button>`).join('');}}
  function header(title,lead,eyebrow='HORIZON HDV'){return `<div class="page-heading"><div class="eyebrow">${escape(eyebrow)}</div><h1 class="page-title">${escape(title)}</h1><p class="lead">${escape(lead)}</p></div>`;}
  const padTime=n=>`${fnum(n)} h`; // Toutes les durées sont exprimées en heures décimales.
  function premiumMetric(label,value,icon,meta,color='mint'){return `<div class="premium-metric ${color}"><div class="pm-heading"><span class="pm-icon">${icon}</span><span class="pm-label">${label}</span></div><div class="pm-value">${value}</div><div class="pm-meta">${meta}</div></div>`;}
  function shortAlertRow(q){const status=q.status, ico=q.group==='Aptitudes médicales'?'✚':q.name.toLowerCase().includes('nuit')?'☾':q.name.toLowerCase().includes('jour')?'☀':'◉';return `<button class="premium-alert" data-act="editQual" data-id="${escape(q.id)}"><span class="prem-alert-icon ${status}">${ico}</span><span class="premium-alert-main"><strong>${escape(q.name)}</strong><small>${q.expiry?'Échéance '+fmtDate(q.expiry):'Date à renseigner'}</small></span><span class="premium-alert-state ${status}">${q.status==='expired'?'Périmée':q.status==='soon'?Math.max(0,q.days)+' j':labelStatus(q)}</span><span class="chev">›</span></button>`;}
  function rowFlight(f,editable){const details=[f.function,f.captain].filter(Boolean).join(' · ');return `<div class="${editable?'flight-row':'flight-card'}"><div class="flight-mark">${escape((f.type||'?').slice(0,5))}</div><div class="${editable?'flight-content':''}" style="flex:1;min-width:0"><div class="flight-primary">${escape(f.type||'Non précisé')} <span style="color:#97a4b5;font-weight:600">· ${fmtDate(f.date)}</span></div><div class="flight-secondary">${escape(details||'Fonction non renseignée')}${f.notes?' · '+escape(f.notes.slice(0,33)):''}</div></div><div class="${editable?'right':''}"><div class="flight-hour">${fnum(f.total)} h<small>${number(f.night)>0?'Nuit '+fnum(f.night)+' h':'Jour '+fnum(f.day)+' h'}</small></div>${editable?`<button class="icon-button" data-act="editFlight" data-id="${escape(f.id)}" aria-label="Modifier le vol">✎</button>`:''}</div></div>`;}
  function renderDashboard(){
    const fl=freshFlights(),actual=fl.filter(f=>eligible(f)&&physical(f));
    const career=sums(actual),year=sums(filterDates('year',actual)),recent=sums(filterDates('30d',actual));
    const alerts=allStates().filter(x=>x.status==='expired'||x.status==='soon').sort((a,b)=>a.days-b.days);
    const expired=alerts.filter(x=>x.status==='expired').length,soon=alerts.filter(x=>x.status==='soon').length;
    return `<section class="premium-hero" aria-label="AS332 Super Puma et tableau de bord">
      <div class="premium-hero-content"><div class="premium-hero-tag"><span class="mint-dot"></span> SUIVI PERSONNEL DE VOL</div><h1>HORIZON <span>HDV</span></h1><p>Carnet de vol & qualifications</p></div>
      <div class="premium-hero-footer"><span class="aircraft-chip">AS332 <i></i> ARMÉE DE TERRE · ILLUSTRATION</span><span class="hero-storage" id="heroSyncStatus">● INSTALLABLE · HORS LIGNE</span></div>
    </section>
    ${!state.flights.length?'<div class="pwa-onboarding"><strong>Bienvenue dans Horizon HDV</strong><p>Ton carnet est vide sur cet appareil. Pour récupérer tes vols, ouvre <b>Plus → Importer une sauvegarde JSON</b>. Si tes données sont déjà sur Google Drive, connecte-toi avec le même compte Google : elles seront récupérées après autorisation.</p><button class="btn" data-act="importJson">Importer mon carnet privé</button></div>':''}
    <div class="premium-intro"><div><h2>Vue d’ensemble</h2><p>Ton activité aéronautique en un coup d’œil</p></div><button class="premium-plus" data-act="newFlight" aria-label="Ajouter un vol">＋</button></div>
    <section class="premium-kpis" aria-label="Heures de vol">${premiumMetric('TOTAL HDV',padTime(career.total),'◷',career.count+' vols retenus')}${premiumMetric('JOUR',padTime(career.day),'☀',fnum(career.total?career.day/career.total*100:0)+' % de la carrière','yellow')}${premiumMetric('NUIT',padTime(career.night),'☾',fnum(career.total?career.night/career.total*100:0)+' % de la carrière','blue')}${premiumMetric('VSV',padTime(career.vi),'◎','Sous capote + nuages','neutral')}</section>
    <div class="premium-quickbar"><span><b>${padTime(year.total)}</b><small> cette année</small></span><span class="quickbar-divider"></span><span><b>${padTime(recent.total)}</b><small> sur 30 jours</small></span></div>
    <section><div class="section-head"><h2>Échéances proches</h2><button class="text-link" data-nav="quals">Voir tout ›</button></div><div class="card premium-alert-card">${alerts.length?alerts.slice(0,4).map(shortAlertRow).join(''):'<div class="empty-state">Aucune échéance proche ou périmée parmi les rubriques datées.</div>'}</div>
    <p class="tiny-info premium-qualification-note">${expired} périmée(s) · ${soon} proche(s) · données indicatives, à vérifier avant utilisation opérationnelle</p></section>
    <section><div class="section-head"><h2>Derniers vols</h2><button class="text-link" data-nav="flights">Carnet complet ›</button></div><div class="card premium-flight-list">${fl.length?fl.slice(0,4).map(f=>rowFlight(f,false)).join(''):'<div class="empty-state">Aucun vol enregistré.</div>'}</div></section>
    <section><div class="section-head"><h2>Activité mensuelle</h2><button class="text-link" data-nav="stats">Statistiques ›</button></div><div class="card chart-panel"><div class="flex-between"><b>12 derniers mois</b><span class="status-pill valid">Actualisé</span></div>${barChart(actual)}</div></section>
    <p class="tiny-info ops-disclaimer">SUIVI PERSONNEL UNIQUEMENT — Les dates et règles sont issues du classeur fourni et ne constituent ni une attestation réglementaire, ni une autorisation de vol.</p>`;
  }
  function applyFlightFilter(){let arr=freshFlights();if(flightType!=='all')arr=arr.filter(f=>f.type===flightType);arr=filterDates(flightPeriod,arr);if(flightQuery.trim())arr=arr.filter(f=>[f.type,f.function,f.captain,f.registration,f.notes,f.date,f.service].join(' ').toLowerCase().includes(flightQuery.trim().toLowerCase()));return arr;}
  function renderFlightItems(){const res=document.getElementById('flightResults');if(!res)return;const list=applyFlightFilter();const count=document.getElementById('flightCount');if(count)count.textContent=`${list.length} vol${list.length>1?'s':''} · ${fnum(sums(list).total)} h enregistrées`;
    res.innerHTML=list.length?list.slice(0,250).map(f=>rowFlight(f,true)).join(''):'<div class="empty-state"><div class="empty-ico">⌕</div>Aucun vol pour ces critères.</div>';
    if(list.length>250)res.innerHTML+='<p class="tiny-info">250 premiers résultats affichés. Affinez vos filtres pour trouver un vol.</p>';
  }
  function renderFlights(){const types=[...new Set(state.flights.map(x=>x.type).filter(Boolean))].sort();return `${header('Carnet de vol','Retrouvez vos vols, consultez les détails et ajoutez de nouvelles saisies.','HISTORIQUE')}
    <div class="flex-between" style="flex-wrap:wrap"><div class="summary-strip">${state.flights.length} vols importés et enregistrés · ${fnum(sums(state.flights).total)} h au total, simulateur inclus.</div><button class="btn" data-act="newFlight">＋ Nouveau vol</button></div>
    <div class="toolbar"><div class="search-holder"><input id="flightSearch" class="search" type="search" placeholder="Rechercher type, pilote, observation…" value="${escape(flightQuery)}"></div><div class="toolbar-row"><select id="flightType" class="filter" aria-label="Filtrer par type"><option value="all">Tous les aéronefs</option>${types.map(t=>`<option value="${escape(t)}" ${flightType===t?'selected':''}>${escape(t)}</option>`).join('')}</select><select id="flightPeriod" class="filter" aria-label="Période"><option value="all" ${flightPeriod==='all'?'selected':''}>Toute la carrière</option><option value="12m" ${flightPeriod==='12m'?'selected':''}>12 derniers mois</option><option value="30d" ${flightPeriod==='30d'?'selected':''}>30 derniers jours</option><option value="year" ${flightPeriod==='year'?'selected':''}>Cette année</option></select></div></div>
    <div class="card"><div class="flex-between mb-8"><b style="font-size:13px">Journal de vol</b><span class="tiny-info" id="flightCount"></span></div><div class="flight-list" id="flightResults"></div></div>`;}
  const groupNames=['Carte de vol','Vols sur type','PU par type','Contrôles pratiques','Contrôles théoriques','Aptitudes médicales','Autres suivis','Simulateur'];
  function qIcon(q){if(q.group==='Aptitudes médicales')return '✚';if(/nuit/i.test(q.name))return '☾';if(/jour/i.test(q.name))return '☀';if(/VI|VSV/i.test(q.name))return '◎';if(/TAC|TACN/i.test(q.name))return '⌁';if(/PU /i.test(q.name))return '♟';if(/[Vv]ol [A-Z0-9]/.test(q.name))return '✈';if(/théor/i.test(q.name))return '▤';if(/pratique/i.test(q.name))return '✓';return '◈'}
  function qCard(q){
    const ratio=q.last&&q.expiry?Math.max(0,Math.min(100,100-(Math.max(0,diff(NOW(),q.last))/Math.max(1,diff(q.expiry,q.last)))*100)):0;
    const label=q.expiry?q.days<0?'Exp.':q.days+'j':'—';
    const caption=q.expiry?q.days<0?'Périmé depuis '+Math.abs(q.days)+' jours':q.days+' jours restants':q.last?'Validité à vérifier':'Aucune date connue';
    return `<button class="premium-qrow ${q.status}" data-act="editQual" data-id="${escape(q.id)}" aria-label="${escape(q.name)} : ${escape(labelStatus(q))}, modifier">
     <span class="premium-qicon">${qIcon(q)}</span><span class="premium-qdetail"><strong>${escape(q.name)}</strong><em class="premium-qstatus ${q.status}">${escape(caption)}</em><small>${q.expiry?'Échéance : '+fmtDate(q.expiry):q.last?'Dernier événement : '+fmtDate(q.last):'Toucher pour renseigner'}</small></span>
     <span class="premium-ring ${q.status}" style="--ring:${ratio}%"><span>${escape(label)}</span></span><span class="chev">›</span></button>`;
  }
  function renderQuals(){
    const all=allStates();const valid=all.filter(q=>q.status==='valid').length;const due=all.filter(q=>q.status==='expired').length;const soon=all.filter(q=>q.status==='soon').length;
    let selected=all;
    if(qFilter==='alert')selected=all.filter(q=>q.status==='soon'||q.status==='expired');
    else if(qFilter==='medical')selected=all.filter(q=>q.group==='Aptitudes médicales');
    else if(qFilter==='checks')selected=all.filter(q=>q.group.startsWith('Contrôles'));
    else if(qFilter==='types')selected=all.filter(q=>q.group==='Vols sur type'||q.group==='PU par type');
    else if(qFilter==='navigation')selected=all.filter(q=>q.group==='Carte de vol'||q.group==='Vols sur type');
    else if(qFilter==='tactical')selected=all.filter(q=>q.group==='PU par type'||q.group==='Contrôles pratiques');
    else if(qFilter==='other')selected=all.filter(q=>!['Carte de vol','Vols sur type','PU par type','Contrôles pratiques','Aptitudes médicales'].includes(q.group));
    return `${header('Qualifications','Tes cartes, contrôles et aptitudes au même endroit.','MAINTIEN DES QUALIFICATIONS')}
      <div class="premium-qual-stats"><span><b class="green-num">${valid}</b><small>Valides</small></span><span><b class="orange-num">${soon}</b><small>À renouveler</small></span><span><b class="red-num">${due}</b><small>Périmées</small></span><span><b>${all.filter(q=>q.status==='none').length}</b><small>À renseigner</small></span></div>
      <div class="premium-tabs" id="qualFilters">${[['all','Toutes'],['navigation','Navigation'],['tactical','Tactique'],['medical','Médical'],['other','Autre'],['alert','Alertes']].map(([id,title])=>`<button data-qfilter="${id}" class="${qFilter===id?'active':''}">${title}</button>`).join('')}</div>
      <div class="section-head"><h2>Suivi des validités</h2><span class="tiny-info">${selected.length} rubriques</span></div>
      <div class="premium-q-list">${selected.length?selected.map(qCard).join(''):'<div class="empty-state">Aucune qualification pour ce filtre.</div>'}</div>
      <p class="hint premium-qual-hint">Les statuts sont recalculés à partir des vols et dates renseignés. Ce suivi personnel ne remplace pas la vérification des documents et règles officielles.</p>`;
  }
  function barChart(flights){const today=parse(NOW());let months=[];for(let k=11;k>=0;k--){let d=new Date(today.getFullYear(),today.getMonth()-k,1);months.push({key:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`,label:d.toLocaleDateString('fr-FR',{month:'short'}).replace('.',''),value:0})};for(const f of flights){const month=months.find(m=>f.date?.slice(0,7)===m.key);if(month)month.value+=number(f.total)}const max=Math.max(...months.map(x=>x.value),1);return `<div class="month-chart" role="img" aria-label="Heures par mois sur les 12 derniers mois">${months.map(m=>`<div class="bar-col" title="${escape(m.key)} : ${fnum(m.value)} h"><div class="bar-value">${m.value?fnum(m.value):''}</div><div class="bar" style="height:${Math.max(2,Math.round(m.value/max*105))}px"></div><div class="bar-label">${escape(m.label)}</div></div>`).join('')}</div>`;}
  function renderStats(){const today=NOW(),arr=filterDates(statsPeriod,state.flights.filter(f=>eligible(f)&&physical(f))).filter(f=>statsType==='all'||f.type===statsType);const s=sums(arr),groups={};for(const f of arr)groups[f.type||'Non précisé']=(groups[f.type||'Non précisé']||0)+number(f.total);const max=Math.max(...Object.values(groups),1);
    return `${header('Statistiques de vol','Vision détaillée de tes heures, par période et par type d’aéronef.','ANALYSE')}
    <div class="toolbar"><div class="segmented">${[['30d','30 jours'],['12m','12 mois'],['year','Année'],['all','Carrière']].map(([p,t])=>`<button class="${statsPeriod===p?'active':''}" data-statsperiod="${p}">${t}</button>`).join('')}</div><select id="statsType" class="filter" style="max-width:230px"><option value="all">Tous les types</option>${[...new Set(state.flights.map(f=>f.type).filter(Boolean))].sort().map(t=>`<option value="${escape(t)}" ${statsType===t?'selected':''}>${escape(t)}</option>`).join('')}</select></div>
    <div class="stats-grid">${metric('Total retenu',fnum(s.total),'h','✈',s.count+' vols')}${metric('Jour',fnum(s.day),'h','☼','Heures de jour')}${metric('Nuit',fnum(s.night),'h','☾','Heures de nuit')}${metric('VSV',fnum(s.vi),'h','◎','Capote + nuages')}</div>
    <div class="two-col"><section><div class="section-head"><h2>Évolution mensuelle</h2></div><div class="card">${barChart(arr)}</div></section><section><div class="section-head"><h2>Par type d’aéronef</h2></div><div class="card">${Object.keys(groups).length?Object.entries(groups).sort((a,b)=>b[1]-a[1]).map(([type,value])=>`<div class="type-row"><div class="type-label">${escape(type)}</div><div class="type-line"><div class="type-fill" style="width:${(value/max*100).toFixed(1)}%"></div></div><div class="type-hour">${h(value)}</div></div>`).join(''):'<div class="empty-state">Pas de vols retenus sur cette période.</div>'}</div></section></div>
    <div class="section-head"><h2>Autres indicateurs</h2></div><div class="stats-grid" style="margin-top:0">${metric('SIL',fnum(s.sil),'h','◈','Selon colonne J')}${metric('Vols',s.count,'','✈','Hors PCE/VIG/PAX')}${metric('Simulateur',fnum(sums(filterDates(statsPeriod,state.flights.filter(f=>DEV_TYPES.includes(f.type)))).total),'h','▤','Compté séparément')}${metric('Fin de période',fmtDate(today),'','◷','Date appareil')}</div>
    <p class="tiny-info" style="margin-top:16px">Statistiques de vol : exclusion des types de simulateur et des fonctions PCE, VIG et PAX, conformément à la logique principale de l’onglet CARTE. Les heures brutes restent accessibles dans le carnet.</p>`;}

  // Google Drive appDataFolder synchronization. The OAuth access token is memory-only.
  // No API secrets and no personal flight data are shipped with the public GitHub Pages site.
  const DRIVE_CLIENT_STORE='horizon_hdv_pwa_drive_client_v1';
  const DRIVE_META_STORE='horizon_hdv_pwa_drive_sync_meta_v1';
  const DRIVE_FILE_NAME='horizon-hdv-backup.json';
  const DRIVE_PENDING_STORE='horizon_hdv_pwa_drive_pending_v1';
  const DRIVE_SCOPE='https://www.googleapis.com/auth/drive.appdata';
  function readJson(key,fallback){try{return JSON.parse(localStorage.getItem(key))||fallback}catch(_){return fallback}}
  let syncConfig=readJson(DRIVE_CLIENT_STORE,{clientId:''});
  let syncMeta=readJson(DRIVE_META_STORE,{fileId:null,version:null,lastJson:null});
  let syncAuth={accessToken:null,expiresAt:0};
  let tokenClient=null;
  let syncState={phase:'off',message:'Mode local. Configure un identifiant Google OAuth pour synchroniser.',remote:null};
  let syncBusy=false,syncTimer=null,syncRetryTimer=null,syncRetryCount=0;
  let pendingUpload=localStorage.getItem(DRIVE_PENDING_STORE)==='1';
  const stableStringify=value=>JSON.stringify(value,(_key,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
  const cloudJson=()=>stableStringify({version:1,flights:state.flights,manual:state.manual,overrides:state.overrides||{},settings:state.settings||{alertDays:30}});
  const hasLocalData=()=>Boolean(state.modifiedAt || state.flights.length || Object.keys(state.manual||{}).length || Object.keys(state.overrides||{}).length);
  function syncLabel(){return ({off:'Local',ready:'Prêt à synchroniser',pending:'En attente d’envoi',auth:'Reconnecter Google',syncing:'Synchronisation…',ok:'Synchronisé',offline:'Hors ligne',error:'Erreur Drive',conflict:'Conflit à résoudre'})[syncState.phase]||'Local'}
  function setSyncStatus(phase,message,remote=null){
    syncState={phase,message,remote};
    const badge=document.getElementById('syncBadge');if(badge){badge.textContent=syncLabel();badge.className='sync-badge '+(phase==='error'||phase==='conflict'?'error':phase==='offline'?'warning':'')}
    const top=document.getElementById('topSyncStatus');if(top){top.textContent=({ok:'✓ Drive',syncing:'↥ Envoi',pending:'↥ En attente',auth:'! Reconnexion',offline:'! Hors ligne',conflict:'! Conflit',error:'! Erreur Drive',ready:'● Prêt',off:'● Local'})[phase]||'● Local';top.className='top-sync-status '+phase;top.title=message}
    const msg=document.getElementById('syncMessage');if(msg)msg.textContent=message;
    const hero=document.getElementById('heroSyncStatus');if(hero)hero.textContent=phase==='ok'?'● DRIVE SYNCHRONISÉ':phase==='syncing'?'● SYNC EN COURS':phase==='conflict'?'● CONFLIT DRIVE':(phase==='pending'||phase==='offline'||phase==='auth'||phase==='error')?'● EN ATTENTE DRIVE':'● DONNÉES LOCALES';
    if(page==='settings'&&phase==='conflict')render();
  }
  function canSync(){return Boolean(syncAuth.accessToken&&Date.now()<syncAuth.expiresAt-60000)}
  function savePending(value){pendingUpload=Boolean(value);if(pendingUpload)localStorage.setItem(DRIVE_PENDING_STORE,'1');else localStorage.removeItem(DRIVE_PENDING_STORE)}
  function queueAutoSync(){
    // Called by every local mutation. Never transmit without the user's initial Drive authorization.
    savePending(true);clearTimeout(syncRetryTimer);
    if(syncState.phase==='conflict')return;
    if(!navigator.onLine){setSyncStatus('offline','Modification enregistrée ici. Envoi Drive automatique au retour du réseau (si Google est connecté).');return}
    if(!canSync()){setSyncStatus('auth','Modification enregistrée ici. Reconnecte Google pour envoyer les changements en attente.');return}
    setSyncStatus('pending','Modification enregistrée. Sauvegarde automatique sur Google Drive en attente…');
    scheduleSync();
  }
  function scheduleSync(delay=1600){
    clearTimeout(syncTimer);
    if(syncState.phase==='conflict')return;
    if(!navigator.onLine){if(pendingUpload)setSyncStatus('offline','Modifications en attente : synchronisation au retour du réseau.');return}
    if(!canSync()){if(pendingUpload)setSyncStatus('auth','Modifications en attente : reconnecte-toi à Google pour reprendre la synchronisation.');return}
    syncTimer=setTimeout(()=>cloudSync(false),delay);
  }
  function retrySync(){
    if(syncState.phase==='conflict'||!canSync()||!navigator.onLine)return;
    clearTimeout(syncRetryTimer);
    const delay=[5000,15000,45000,120000][Math.min(syncRetryCount++,3)];
    syncRetryTimer=setTimeout(()=>cloudSync(false),delay);
  }
  function saveCloudConfig(form){
    const id=String(new FormData(form).get('clientId')||'').trim();
    if(!/^[0-9]+-[a-z0-9_-]+\.apps\.googleusercontent\.com$/i.test(id)){toast('Identifiant OAuth Google invalide : il doit terminer par .apps.googleusercontent.com');return}
    if(syncConfig.clientId!==id){syncMeta={fileId:null,version:null,lastJson:null};localStorage.removeItem(DRIVE_META_STORE);syncAuth={accessToken:null,expiresAt:0};tokenClient=null;clearTimeout(syncRetryTimer);clearTimeout(syncTimer)}
    syncConfig={clientId:id};localStorage.setItem(DRIVE_CLIENT_STORE,JSON.stringify(syncConfig));
    setSyncStatus('off','Identifiant enregistré. Clique sur « Se connecter avec Google ».');render();toast('Configuration Google enregistrée.');
  }
  function connectDrive(){
    if(!syncConfig.clientId){toast('Enregistre d’abord ton identifiant client OAuth.');return}
    if(!navigator.onLine){setSyncStatus('offline','Connexion Internet nécessaire pour te connecter avec Google.');return}
    if(!window.google?.accounts?.oauth2?.initTokenClient){
      setSyncStatus('error','Le module de connexion Google n’est pas chargé. Vérifie Internet, puis recharge la page.');return;
    }
    // requestAccessToken must happen during a direct click (popup blocked otherwise).
    try{
      if(!tokenClient){
        tokenClient=google.accounts.oauth2.initTokenClient({
          client_id:syncConfig.clientId,scope:DRIVE_SCOPE,
          callback:async(response)=>{
            if(response.error || !response.access_token){setSyncStatus('error','Connexion Google refusée : '+String(response.error||'aucun jeton'));return}
            syncAuth={accessToken:response.access_token,expiresAt:Date.now()+(Number(response.expires_in)||3600)*1000};
            setSyncStatus('ready','Google Drive autorisé pour cette session. Vérification des modifications en attente…');render();await cloudSync(false);
          },
          error_callback:err=>setSyncStatus('error','Fenêtre de connexion Google inaccessible : '+String(err?.type||'erreur pop-up'))
        });
      }
      tokenClient.requestAccessToken({prompt:'select_account'});
    }catch(e){setSyncStatus('error','Impossible de lancer la connexion Google : '+e.message)}
  }
  function syncLogout(){
    if(syncAuth.accessToken&&window.google?.accounts?.oauth2?.revoke){try{google.accounts.oauth2.revoke(syncAuth.accessToken,()=>{})}catch(_){}}
    syncAuth={accessToken:null,expiresAt:0};tokenClient=null;clearTimeout(syncTimer);clearTimeout(syncRetryTimer);
    // Keep the cloud revision metadata and pending edits to preserve conflict safety on reconnection.
    setSyncStatus(pendingUpload?'auth':'off',pendingUpload?'Modifications enregistrées localement. Reconnecte Google pour les envoyer.':'Déconnecté de Drive. Le carnet reste enregistré sur cet appareil.');render();
  }
  async function driveRequest(path,options={}){
    if(!canSync())throw Error('Session Google expirée : reconnecte-toi avec Google.');
    if(!navigator.onLine)throw Error('Hors connexion');
    const headers={Authorization:'Bearer '+syncAuth.accessToken,...(options.headers||{})};
    const res=await fetch('https://www.googleapis.com'+path,{...options,headers,cache:'no-store'});
    let data=null;const raw=await res.text();try{data=raw?JSON.parse(raw):null}catch(_){data=raw}
    if(!res.ok){const message=data?.error?.message||data?.message||('HTTP '+res.status);
      if(res.status===401)throw Error('Session Google expirée : reconnecte-toi.');
      if(res.status===403)throw Error('Accès Drive refusé : active Drive API et autorise le champ drive.appdata. '+message);
      throw Error(message);
    }
    return data;
  }
  const enc=encodeURIComponent;
  async function getDriveFiles(){
    let nextPageToken='',files=[];
    do {
      const params=new URLSearchParams({spaces:'appDataFolder',q:"name = '"+DRIVE_FILE_NAME+"' and trashed = false",fields:'nextPageToken,files(id,name,version,modifiedTime)',pageSize:'100'});
      if(nextPageToken)params.set('pageToken',nextPageToken);
      const res=await driveRequest('/drive/v3/files?'+params.toString());
      files=files.concat(res.files||[]);nextPageToken=res.nextPageToken||'';
    }while(nextPageToken&&files.length<300);
    if(files.length>1)throw Error('Plusieurs sauvegardes Horizon HDV sur Drive : aucune fusion automatique. Exporte les fichiers avant de poursuivre.');
    return files;
  }
  async function getDriveFileVersion(id){return driveRequest('/drive/v3/files/'+enc(id)+'?fields=id,version,modifiedTime');}
  async function getRemote(){
    const files=await getDriveFiles();if(!files.length){
      if(syncMeta.fileId)throw Error('La sauvegarde liée à cet appareil est absente de ce compte Google. Vérifie le compte sélectionné.');
      return null;
    }
    const file=files[0];
    if(syncMeta.fileId&&syncMeta.fileId!==file.id)throw Error('Ce compte Drive contient une autre sauvegarde. Vérifie le compte Google utilisé pour éviter de mélanger deux carnets.');
    const payload=await driveRequest('/drive/v3/files/'+enc(file.id)+'?alt=media');
    const after=await getDriveFileVersion(file.id);
    if(String(after.version)!==String(file.version))throw Error('La sauvegarde Drive a changé pendant la lecture : recommence la synchronisation.');
    if(!payload||!Array.isArray(payload.flights)||!payload.manual||typeof payload.manual!=='object'||payload.flights.length>50000)throw Error('Sauvegarde Google Drive invalide');
    return {fileId:file.id,version:String(file.version),payload};
  }
  function synced(file,snapshot){
    syncMeta={fileId:file.fileId,version:String(file.version),lastJson:stableStringify(snapshot),lastSyncAt:new Date().toISOString()};
    localStorage.setItem(DRIVE_META_STORE,JSON.stringify(syncMeta));
    // An edit can occur during an upload. Keep it queued instead of reporting success too early.
    if(cloudJson()!==syncMeta.lastJson){savePending(true);setSyncStatus('pending','Une nouvelle modification attend son envoi automatique.');}
    else {savePending(false);syncRetryCount=0;clearTimeout(syncRetryTimer);setSyncStatus('ok','Synchronisé automatiquement avec Google Drive · '+new Date().toLocaleString('fr-FR'));}
  }
  function applyRemote(snapshot){
    if(!snapshot||!Array.isArray(snapshot.flights)||!snapshot.manual||typeof snapshot.manual!=='object'||snapshot.flights.length>50000)throw Error('Sauvegarde Drive invalide');
    state={version:1,flights:snapshot.flights,manual:snapshot.manual,overrides:snapshot.overrides||{},settings:snapshot.settings||{alertDays:30},modifiedAt:new Date().toISOString()};
    localStorage.setItem(STORE,JSON.stringify(state));savePending(false);render();
  }
  async function commitCloud(remote,snapshot){
    const body=JSON.stringify(snapshot);
    if(new Blob([body]).size>4500000)throw Error('Sauvegarde trop volumineuse pour la synchronisation simple Drive (4,5 Mo). Exporte le JSON.');
    if(remote){
      // Best-effort optimistic conflict check: Drive v3 does not provide an atomic compare-and-swap update here.
      const fresh=await getDriveFileVersion(remote.fileId);
      if(String(fresh.version)!==String(remote.version))throw Error('REVISION_CONFLICT');
      const result=await driveRequest('/upload/drive/v3/files/'+enc(remote.fileId)+'?uploadType=media&fields=id,version',{
        method:'PATCH',headers:{'Content-Type':'application/json'},body
      });
      return {fileId:result.id||remote.fileId,version:String(result.version)};
    }
    if((await getDriveFiles()).length)throw Error('REVISION_CONFLICT');
    const boundary='hdv_'+Math.random().toString(36).slice(2)+Date.now().toString(36);
    const metadata={name:DRIVE_FILE_NAME,parents:['appDataFolder'],mimeType:'application/json'};
    const multipart='--'+boundary+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'+JSON.stringify(metadata)+'\r\n--'+boundary+'\r\nContent-Type: application/json\r\n\r\n'+body+'\r\n--'+boundary+'--';
    const created=await driveRequest('/upload/drive/v3/files?uploadType=multipart&fields=id,version',{
      method:'POST',headers:{'Content-Type':'multipart/related; boundary='+boundary},body:multipart
    });
    return {fileId:created.id,version:String(created.version)};
  }
  async function cloudSync(manual){
    if(syncBusy||syncState.phase==='conflict')return;
    if(!canSync()){if(manual||pendingUpload)setSyncStatus('auth','Connexion Google nécessaire pour synchroniser. Les changements restent sur cet appareil.');return}
    if(!navigator.onLine){setSyncStatus('offline','Hors connexion : les modifications restent locales et seront renvoyées au retour du réseau.');return}
    syncBusy=true;setSyncStatus('syncing','Comparaison des données locales et de Google Drive…');
    try{
      const remote=await getRemote(),local=JSON.parse(cloudJson()),localJson=cloudJson();
      const cloudData=remote?.payload||null,remoteJson=cloudData?stableStringify(cloudData):null;
      const changed=syncMeta.lastJson!==null&&syncMeta.lastJson!==localJson;
      if(!remote){
        if(!hasLocalData()){setSyncStatus('ready','Aucune sauvegarde Drive. Crée un vol fictif ou importe ton carnet, puis synchronise.');}
        else if(manual&&confirm('Première sauvegarde sur Google Drive ? Le carnet local sera transféré dans appDataFolder. Ne transfère que des données autorisées.')){
          const created=await commitCloud(null,local);synced(created,local);
        }else{setSyncStatus('ready','Aucune sauvegarde Drive. Appuie sur Synchroniser pour confirmer le premier transfert.');}
      }else if(cloudJson()===remoteJson){synced(remote,local)}
      else if(!syncMeta.fileId){
        if(!hasLocalData()){applyRemote(cloudData);synced(remote,cloudData)}
        else setSyncStatus('conflict','Drive contient déjà un carnet et cet appareil possède des données locales. Choisis une version après export.',remote);
      }else if(syncMeta.fileId===remote.fileId&&String(syncMeta.version)===String(remote.version)){
        if(changed){const saved=await commitCloud(remote,local);synced(saved,local)}
        else {applyRemote(cloudData);synced(remote,cloudData)}
      }else if(!changed){applyRemote(cloudData);synced(remote,cloudData)}
      else setSyncStatus('conflict','Les deux appareils ont modifié le carnet. Aucune version n’est écrasée automatiquement.',remote);
    }catch(e){
      if(/REVISION_CONFLICT/.test(e.message))setSyncStatus('conflict','Drive a changé pendant l’envoi. Exporte une sauvegarde avant de choisir une version.');
      else if(/Session Google expirée|Session Google.*reconnect/i.test(e.message)){
        syncAuth={accessToken:null,expiresAt:0};setSyncStatus('auth','Connexion Google expirée. Les modifications restent locales ; clique sur « Se connecter avec Google » pour les envoyer.');
      }else{
        setSyncStatus(navigator.onLine?'error':'offline','Sauvegarde automatique non terminée : '+e.message+(navigator.onLine?' · nouvelle tentative prévue.':''));
        if(navigator.onLine&& !/Accès Drive refusé|Sauvegarde Google Drive invalide|Plusieurs sauvegardes|autre sauvegarde|Sauvegarde trop volumineuse/i.test(e.message))retrySync();
      }
    }finally{
      syncBusy=false;
      if(syncState.phase==='pending'||syncState.phase==='ok'&&syncMeta.lastJson!==cloudJson())scheduleSync();
    }
  }
  async function useCloudVersion(){
    if(syncState.phase!=='conflict')return;
    if(!confirm('Remplacer les données de cet appareil par Drive ? Exporte une sauvegarde JSON au préalable.'))return;
    try{const remote=await getRemote();if(!remote)throw Error('Sauvegarde Drive introuvable');applyRemote(remote.payload);synced(remote,remote.payload);toast('Version Drive chargée.');}
    catch(e){setSyncStatus('error',e.message)}
  }
  async function useLocalVersion(){
    if(syncState.phase!=='conflict')return;
    if(!confirm('Envoyer le carnet local et remplacer Drive ? Cela peut effacer les modifications de la tablette. Exporte les deux sauvegardes auparavant.'))return;
    try{const remote=await getRemote(),local=JSON.parse(cloudJson());const written=await commitCloud(remote,local);synced(written,local);toast('Version locale envoyée.');}
    catch(e){setSyncStatus('error','Envoi refusé : '+e.message)}
  }
  window.addEventListener('online',()=>{clearTimeout(syncRetryTimer);if(canSync())scheduleSync(250);else if(pendingUpload)setSyncStatus('auth','Connexion rétablie. Reconnecte Google pour envoyer les modifications en attente.');});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){if(canSync())scheduleSync(250);else if(pendingUpload)setSyncStatus('auth','Modifications en attente. Reconnecte Google pour terminer la sauvegarde.');}});
  window.addEventListener('pageshow',()=>{if(canSync())scheduleSync(400)});
  function renderSettings(){const days=state.settings?.alertDays??30;return `${header('Réglages & sauvegarde','Données locales avec sauvegarde Google Drive facultative.','PARAMÈTRES')}
    <div class="section-head"><h2>Synchronisation téléphone / tablette</h2><span class="sync-badge ${syncState.phase==='error'||syncState.phase==='conflict'?'error':syncState.phase==='offline'?'warning':''}" id="syncBadge">${escape(syncLabel())}</span></div>
    <div class="sync-card"><div class="settings-title">Compte personnel Google Drive</div>
    <p><b>Sauvegarde automatique activée :</b> après chaque ajout, modification ou suppression de vol, ainsi que chaque changement de qualification, Horizon HDV enregistre d’abord sur cet appareil puis tente l’envoi sur Drive (environ 2 secondes après la dernière modification). La connexion Google doit rester valide. En cas de coupure, l’envoi est mis en attente et repris après reconnexion. Les modifications sur un appareil sont récupérées sur l’autre lors de la synchronisation ou de son ouverture. Le dossier privé <b>appDataFolder</b> est utilisé.</p>
    <div class="sync-small" role="status">${pendingUpload?'<b>● Changements locaux en attente d’envoi Drive.</b>':'● Aucun changement local en attente.'} ${syncMeta.lastSyncAt?'Dernière sauvegarde confirmée : '+escape(new Date(syncMeta.lastSyncAt).toLocaleString('fr-FR'))+'.':''}</div>
    <form id="driveConfigForm" class="sync-form">
      <div class="wide"><label for="googleClientId">Identifiant client OAuth Google (type Application Web)</label><input id="googleClientId" name="clientId" type="text" value="${escape(syncConfig.clientId||'')}" placeholder="123456789-abc.apps.googleusercontent.com" spellcheck="false" autocomplete="off" required></div>
      <div class="wide"><button type="submit" class="btn btn-soft btn-xs">Enregistrer l’identifiant</button></div>
    </form>
    <div class="sync-message" id="syncMessage">${escape(syncState.message)}</div>
    <div class="sync-actions">
      <button class="btn btn-soft btn-xs" data-act="driveConnect">Se connecter avec Google</button>
      <button class="btn btn-soft btn-xs" data-act="syncNow">Synchroniser</button>
      <button class="btn btn-ghost btn-xs" data-act="cloudLogout">Déconnexion</button>
    </div>
    ${syncState.phase==='conflict'?`<div class="sync-conflict"><strong>Deux versions différentes détectées</strong><p>Exporte un JSON sur chaque appareil avant toute action. Google Drive ne permet pas une fusion automatique garantie.</p><div class="sync-actions"><button class="btn btn-soft btn-xs" data-act="exportJson">Sauvegarder le local</button><button class="btn btn-ghost btn-xs" data-act="cloudUseRemote">Utiliser Drive</button><button class="btn btn-ghost btn-xs" data-act="cloudUseLocal">Envoyer le local</button></div></div>`:''}
    <p class="sync-small">La toute première sauvegarde sur Drive doit être confirmée manuellement. Après celle-ci, les changements sont envoyés automatiquement tant que Google reste connecté. En cas d’expiration de la session OAuth, une reconnexion manuelle est indispensable : une PWA statique ne peut pas renouveler silencieusement l’autorisation Google. Il n’y a pas de synchronisation garantie lorsque l’application est fermée.</p>
    <p class="sync-small">Configuration unique : Google Cloud → activer Drive API, créer un client OAuth « Application Web », ajouter <b>https://aigle-noir.github.io</b> dans les origines JavaScript autorisées et autoriser ton compte dans « Audience / Utilisateurs tests » si l’application est en test. Aucun mot de passe ni clé API secrète dans Horizon HDV. Le dossier appDataFolder n’apparaît pas dans l’interface habituelle de Drive. Le contrôle des versions réduit les conflits, mais n’offre pas de protection atomique contre deux écritures exactement simultanées. Conserve des exports JSON réguliers.</p>
    </div>
    <div class="section-head"><h2>Sauvegarde des données</h2></div><div class="card"><div class="settings-card"><div><div class="settings-title">Exporter une sauvegarde JSON</div><div class="settings-desc">Contient tous les vols, dates manuelles et paramètres.</div></div><button class="btn btn-soft btn-xs" data-act="exportJson">Exporter</button></div><div class="settings-card"><div><div class="settings-title">Importer une sauvegarde JSON</div><div class="settings-desc">Remplace les données actuelles après confirmation.</div></div><button class="btn btn-soft btn-xs" data-act="importJson">Importer</button></div><div class="settings-card"><div><div class="settings-title">Exporter le carnet CSV</div><div class="settings-desc">Pour archivage ou ouverture dans un tableur.</div></div><button class="btn btn-soft btn-xs" data-act="exportCsv">Exporter</button></div></div>
    <div class="section-head"><h2>Préférences d’alertes</h2></div><div class="card"><div class="settings-card"><div><div class="settings-title">Prévenir avant échéance</div><div class="settings-desc">Pastilles orange dans l’application, calculées à l’ouverture.</div></div><select id="alertDays" class="filter" style="max-width:126px"><option value="7" ${days===7?'selected':''}>7 jours</option><option value="15" ${days===15?'selected':''}>15 jours</option><option value="30" ${days===30?'selected':''}>30 jours</option><option value="60" ${days===60?'selected':''}>60 jours</option></select></div><div class="settings-card"><div><div class="settings-title">Premier import privé</div><div class="settings-desc">Le site public ne contient aucun vol personnel. Garde ton fichier JSON privé hors de GitHub.</div></div><button class="btn btn-soft btn-xs" data-act="importJson">Importer</button></div></div>
    <div class="section-head"><h2>À propos des calculs</h2></div><div class="card"><div class="info-list"><div><b>Carte :</b> 3 mois depuis le dernier événement correspondant.</div><div><b>Vol sur type et PU :</b> 6 mois depuis le dernier vol ou PU enregistré.</div><div><b>Contrôles pratiques :</b> jusqu’au dernier jour du même mois l’année suivante.</div><div><b>Contrôles théoriques :</b> cycle du 1er juillet au 30 juin.</div><div><b>VRPN, CEMPN, classe 1 :</b> respectivement 6, 24 et 12 mois, tels qu’indiqués dans le fichier.</div><div><b>CRM initial :</b> 36 mois, selon le fichier. Les rubriques sans périodicité indiquée ne reçoivent pas de date inventée.</div><div><b>Confidentialité :</b> cloud facultatif uniquement après configuration et connexion. Sans connexion, les données restent locales. Elles peuvent être perdues en cas de désinstallation ou d’effacement des données de l’application. Exporte régulièrement tes sauvegardes.</div><div><b>Attention :</b> ce suivi ne constitue pas une attestation d’aptitude, de qualification ou de conformité. Vérifie les règles applicables auprès de ton autorité et de ton unité.</div></div></div>`;}

  function render(){document.getElementById('todayChip').textContent=fmtDate(NOW());renderNav();document.getElementById('app').innerHTML=page==='dashboard'?renderDashboard():page==='flights'?renderFlights():page==='quals'?renderQuals():page==='stats'?renderStats():renderSettings();if(page==='flights')renderFlightItems();}
  function go(name){page=name;render();window.scrollTo(0,0)}
  function toast(msg){const el=document.getElementById('toast');el.textContent=msg;el.classList.add('visible');clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>el.classList.remove('visible'),3500)}
  function modal(title,body){document.getElementById('modalRoot').innerHTML=`<div class="modal-overlay" id="overlay"><div class="modal" role="dialog" aria-modal="true" aria-label="${escape(title)}"><div class="modal-top"><h2>${escape(title)}</h2><button class="modal-close" data-act="closeModal" aria-label="Fermer">×</button></div><div class="modal-body">${body}</div></div></div>`;document.body.style.overflow='hidden'}
  function closeModal(){document.getElementById('modalRoot').innerHTML='';document.body.style.overflow=''}
  const ffield=(label,name,value='',type='text',extra='',full=false)=>`<div class="form-field ${full?'full':''}"><label for="input-${name}">${label}</label><input id="input-${name}" name="${name}" type="${type}" value="${escape(value)}" ${extra}></div>`;
  function flightModal(id){const f=state.flights.find(x=>x.id===id)||{date:NOW(),function:'PIL',type:'',day:0,night:0,capote:0,cloud:0,sil:0,tags:[]};const edit=!!id;
    modal(edit?'Modifier un vol':'Ajouter un vol',`<form id="flightForm" data-edit="${escape(id||'')}"><div class="form-grid"><div class="form-subtitle">Vol</div>${ffield('Date *','date',f.date,'date','required')}
      <div class="form-field"><label for="flightTypeInput">Type d’aéronef *</label><input list="typeOptions" id="flightTypeInput" name="type" value="${escape(f.type)}" required placeholder="EC120…"><datalist id="typeOptions">${[...new Set(AIRCRAFT.concat(state.flights.map(x=>x.type).filter(Boolean)))].map(x=>`<option value="${escape(x)}"></option>`).join('')}</datalist></div>
      <div class="form-field"><label for="flightFunction">Fonction à bord</label><select name="function" id="flightFunction">${[...new Set(['PIL','EP','ECDB','ICUS','PCB','PCE','VIG','PAX','MO',f.function].filter(Boolean))].map(v=>`<option value="${escape(v)}" ${v===f.function?'selected':''}>${escape(v)}</option>`).join('')}</select></div>${ffield('Immatriculation / numéro','registration',f.registration||'')}${ffield('CDB / équipage','captain',f.captain||'','text','',true)}
      <div class="form-subtitle">Temps (heures décimales)</div>${ffield('Jour','day',f.day,'number','min="0" step="0.01"')}${ffield('Nuit','night',f.night,'number','min="0" step="0.01"')}${ffield('VSV sous capote','capote',f.capote,'number','min="0" step="0.01"')}${ffield('VSV nuages','cloud',f.cloud,'number','min="0" step="0.01"')}${ffield('SIL / JVN','sil',f.sil,'number','min="0" step="0.01"')}${ffield('Code de service','service',f.service||'')}
      <div class="form-subtitle">Événements & notes</div><div class="form-field full"><label>Événements de qualification</label><div class="check-row">${['PU','TAC','VTN','VAV','VI','JVN'].map(t=>`<label><input type="checkbox" name="tags" value="${t}" ${f.tags?.includes(t)?'checked':''}>${t}</label>`).join('')}</div></div><div class="form-field full"><label for="flightNotes">Observations</label><textarea id="flightNotes" name="notes" placeholder="Mission, lieu, remarques…">${escape(f.notes||'')}</textarea></div></div>
      <p class="form-help">Durée totale calculée : jour + nuit. Les autres colonnes d’un vol importé (atterrissages, aides radio…) restent conservées lors de la modification.</p><div class="form-actions">${edit?'<button type="button" class="btn btn-danger" data-act="deleteFlight" data-id="'+escape(id)+'">Supprimer</button>':''}<button type="button" class="btn btn-ghost" data-act="closeModal">Annuler</button><button class="btn" type="submit">Enregistrer le vol</button></div></form>`);
  }
  function saveFlight(form){const fd=new FormData(form),id=form.dataset.edit;const type=String(fd.get('type')||'').trim().toUpperCase();const date=String(fd.get('date')||'');if(!date||!type){toast('Date et type obligatoires.');return}
    const fields=['day','night','capote','cloud','sil'];for(const x of fields){if(Number(fd.get(x))<0){toast('Les durées doivent être positives.');return}}
    const payload={date,type,function:String(fd.get('function')||''),registration:String(fd.get('registration')||''),captain:String(fd.get('captain')||''),day:number(fd.get('day')),night:number(fd.get('night')),capote:number(fd.get('capote')),cloud:number(fd.get('cloud')),sil:number(fd.get('sil')),service:String(fd.get('service')||''),notes:String(fd.get('notes')||''),tags:fd.getAll('tags'),total:Math.round((number(fd.get('day'))+number(fd.get('night')))*1000)/1000};
    if(id){const idx=state.flights.findIndex(f=>f.id===id);if(idx<0)return;state.flights[idx]={...state.flights[idx],...payload}}else{state.flights.push({id:'m'+Date.now()+'-'+Math.random().toString(36).slice(2,7),...payload})}persist();closeModal();render();toast(id?'Vol modifié.':'Vol ajouté.');}
  function editQual(id){const q=QUAL.find(x=>x.id===id);if(!q)return;const date=getLast(q),source=q.source.kind==='manual'?'date enregistrée':'calcul automatique';modal(q.name,`<form id="qualForm" data-id="${escape(id)}"><p class="form-help">Dernière date connue : <b>${fmtDate(date)}</b> (${source}). Une date manuelle remplace le calcul automatique pour cette rubrique, sans modifier les vols.</p><div class="form-grid">${ffield('Dernier contrôle, examen ou vol','qualDate',date||'','date','',true)}</div><p class="form-help">Règle : ${escape(q.rule.kind==='months'?q.rule.count+' mois':q.rule.kind==='practical'?'dernier jour du mois correspondant en A+1':q.rule.kind==='theory'?'échéance au 30 juin de la campagne':'aucune échéance automatique')}. ${escape(q.note||'')}</p><div class="form-actions"><button type="button" data-act="clearQual" data-id="${escape(id)}" class="btn btn-ghost">Effacer / auto</button><button type="button" class="btn btn-ghost" data-act="closeModal">Annuler</button><button class="btn" type="submit">Enregistrer</button></div></form>`);}
  function saveQual(form){const q=QUAL.find(x=>x.id===form.dataset.id),date=new FormData(form).get('qualDate');if(!q)return;if(date){if(q.source.kind==='manual')state.manual[q.source.seed||q.id]=date;else{state.overrides=state.overrides||{};state.overrides[q.id]=date}}else{if(q.source.kind==='manual')delete state.manual[q.source.seed||q.id];else delete state.overrides[q.id]}persist();closeModal();render();toast('Échéance recalculée.')}
  function clearQual(id){const q=QUAL.find(x=>x.id===id);if(!q)return;if(q.source.kind==='manual')delete state.manual[q.source.seed||q.id];else if(state.overrides)delete state.overrides[id];persist();closeModal();render();toast('Date effacée.')}
  function download(name,mime,body){if(window.AndroidHost&&typeof window.AndroidHost.saveFile==='function'){window.AndroidHost.saveFile(name,mime,body);return}const url=URL.createObjectURL(new Blob([body],{type:mime}));const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),500)}
  function exportJson(){download('Horizon_HDV_sauvegarde_'+NOW()+'.json','application/json',JSON.stringify(state,null,2));toast('Sauvegarde préparée.')}
  function csvEscape(v){const s=String(v??'');return /[;"\n\r]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s}
  function exportCsv(){const keys=['date','function','captain','type','registration','day','capote','cloud','night','sil','total','atr','ar','gca','gnss','ndb','vor','ils','service','notes','zone','tags','landing'];const rows=[keys.join(';'),...state.flights.map(f=>keys.map(k=>csvEscape(Array.isArray(f[k])?f[k].join('|'):f[k])).join(';'))];download('Horizon_HDV_carnet_'+NOW()+'.csv','text/csv','\ufeff'+rows.join('\r\n'));toast('Export CSV préparé.')}
  function importJson(){if(window.AndroidHost&&typeof window.AndroidHost.openBackup==='function'){window.AndroidHost.openBackup();return}const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.onchange=async()=>{const file=input.files?.[0];if(file)receiveBackup(await file.text())};input.click()}
  function receiveBackup(raw){try{const candidate=JSON.parse(raw);if(!candidate||!Array.isArray(candidate.flights)||typeof candidate.manual!=='object'||candidate.manual===null)throw Error('format');if(candidate.flights.length>50000)throw Error('volume');if(!confirm(`Importer ${candidate.flights.length} vols ? Cette opération remplace le carnet actuel.`))return;state={version:1,flights:candidate.flights,manual:candidate.manual,overrides:candidate.overrides||{},settings:candidate.settings||{alertDays:30}};persist();go('dashboard');toast('Sauvegarde restaurée.')}catch(e){toast('Fichier de sauvegarde invalide ou illisible.')}}
  window.receiveAndroidBackup=receiveBackup;
  document.addEventListener('click',e=>{const target=e.target.closest('[data-nav],[data-act],[data-qfilter],[data-statsperiod]');if(!target)return;if(target.dataset.nav){go(target.dataset.nav);return}if(target.dataset.qfilter){qFilter=target.dataset.qfilter;render();return}if(target.dataset.statsperiod){statsPeriod=target.dataset.statsperiod;render();return}
    const action=target.dataset.act;switch(action){case 'newFlight':flightModal();break;case 'editFlight':flightModal(target.dataset.id);break;case 'deleteFlight':if(confirm('Supprimer définitivement ce vol ?')){state.flights=state.flights.filter(f=>f.id!==target.dataset.id);persist();closeModal();render();toast('Vol supprimé.')}break;case 'editQual':editQual(target.dataset.id);break;case 'clearQual':clearQual(target.dataset.id);break;case 'closeModal':closeModal();break;case 'exportJson':exportJson();break;case 'importJson':importJson();break;case 'exportCsv':exportCsv();break;case 'driveConnect':connectDrive();break;case 'cloudLogout':syncLogout();break;case 'syncNow':cloudSync(true);break;case 'cloudUseRemote':useCloudVersion();break;case 'cloudUseLocal':useLocalVersion();break;}}
  );
  document.addEventListener('submit',e=>{if(e.target.id==='flightForm'){e.preventDefault();saveFlight(e.target)}else if(e.target.id==='qualForm'){e.preventDefault();saveQual(e.target)}else if(e.target.id==='driveConfigForm'){e.preventDefault();saveCloudConfig(e.target)}});
  document.addEventListener('input',e=>{if(e.target.id==='flightSearch'){flightQuery=e.target.value;renderFlightItems()}});
  document.addEventListener('change',e=>{if(e.target.id==='flightType'){flightType=e.target.value;renderFlightItems()}else if(e.target.id==='flightPeriod'){flightPeriod=e.target.value;renderFlightItems()}else if(e.target.id==='statsType'){statsType=e.target.value;render()}else if(e.target.id==='alertDays'){state.settings.alertDays=Number(e.target.value);persist();render();toast('Préférence enregistrée.')}});
  document.getElementById('quickSettings').addEventListener('click',()=>go('settings'));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
  if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1'))navigator.serviceWorker.register('./sw.js').catch(()=>{});
  render();
  // On a reload we cannot silently renew OAuth, but we must show any unsent edits.
  if(pendingUpload&&!canSync())setSyncStatus('auth','Changements non encore envoyés sur Drive. Clique sur « Se connecter avec Google » pour terminer la synchronisation.');
  // Access tokens are not stored; connection requires an explicit Google sign-in gesture.
  window.HDV_TEST={getState:()=>state,getSync:()=>({phase:syncState.phase,revision:syncMeta.version,pending:pendingUpload}),qualities:allStates,addMonths,expiryFor,stats:sums};
})();
