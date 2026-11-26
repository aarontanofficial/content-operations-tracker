/* AHBA Content Operations — Executive Command Center */
(() => {
 const $=s=>document.querySelector(s), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const tz='Asia/Manila', dateNow=()=>new Date().toLocaleDateString('en-CA',{timeZone:tz}), add=(d,n)=>{const x=new Date(d+'T00:00:00Z');x.setUTCDate(x.getUTCDate()+n);return x.toISOString().slice(0,10)},fmt=d=>new Date(d+'T00:00:00Z').toLocaleDateString('en-PH',{day:'numeric',month:'short',timeZone:'UTC'}),time=t=>t?String(t).slice(0,5):'Time TBC';
 const done=s=>s==='published'||s==='completed', label=s=>({'pending':'Pending','prepared':'Prepared','scheduled':'Scheduled','published':'Published','completed':'Completed'}[s]||s);
 let lastRows=[],mounted=false,loadToken=0;
 function mount(){
  const view=$('#v-overview');if(!view)return;
  let shell=$('#opsExecutive');
  if(!shell){shell=document.createElement('div');shell.id='opsExecutive';
  shell.innerHTML=`
   <div class="cc-topline"><div class="cc-breadcrumb">WORKSPACE <span style="opacity:.4">/</span> OVERVIEW</div><div class="cc-topright"><span id="ccDate"></span><span class="cc-live">LIVE WORKSPACE</span></div></div>
   <section class="cc-hero">
    <div class="cc-hero-copy"><div class="cc-eyebrow">AHBA DEVELOPMENT · CONTENT OPERATIONS</div><h1 id="ccGreeting">Your content command center.</h1><p>Plan campaigns, manage the publishing pipeline, and see what needs attention—all from one workspace.</p>
     <div class="cc-hero-actions"><button onclick="showView('add')">＋ Create content</button><button class="cc-ghost" onclick="showView('quests')">Open task manager ↗</button></div>
    </div>
    <div class="cc-orbit-stage" aria-hidden="true"><div class="cc-orbit o1"></div><div class="cc-orbit o2"></div><div class="cc-orbit o3"></div><div class="cc-orbit-core"><svg viewBox="0 0 80 80" fill="none"><path d="M12 55 28 37l11 10 25-29" stroke="#a6eaff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M48 18h16v16" stroke="#a6eaff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 65h56" stroke="#739dff" stroke-width="3" stroke-linecap="round"/></svg></div></div>
   </section>
   <section class="cc-kpis" id="ccKpis">
    <article class="cc-kpi"><div class="cc-kpi-top"><span>Published · 30 days</span><i class="cc-kpi-icon">↗</i></div><strong id="ccPublished">—</strong><small id="ccPublishedNote">Confirmed live content</small></article>
    <article class="cc-kpi"><div class="cc-kpi-top"><span>Scheduled</span><i class="cc-kpi-icon">◷</i></div><strong id="ccScheduled">—</strong><small>Awaiting publication</small></article>
    <article class="cc-kpi"><div class="cc-kpi-top"><span>Needs attention</span><i class="cc-kpi-icon">!</i></div><strong id="ccAttention">—</strong><small id="ccAttentionNote">Overdue + pending</small></article>
    <article class="cc-kpi"><div class="cc-kpi-top"><span>Publish rate · 30 days</span><i class="cc-kpi-icon">◎</i></div><strong id="ccRate">—</strong><small>Published ÷ tracked content</small></article>
   </section>
   <section class="cc-grid-main">
    <article class="cc-panel"><div class="cc-panel-head"><div><h2>Publishing activity</h2><p>Confirmed posts across the last seven days</p></div><span class="cc-period">LAST 7 DAYS</span></div><div class="cc-chart" id="ccChart"></div><div class="cc-chart-footer"><span id="ccChartSummary">Waiting for data</span><b id="ccChartPeak"></b></div></article>
    <article class="cc-panel"><div class="cc-panel-head"><div><h2>Workflow pipeline</h2><p>All tracked content records</p></div><span class="cc-period">ALL TIME</span></div><div class="cc-pipeline" id="ccPipeline"></div><div class="cc-chart-footer"><span>Total tracked records</span><b id="ccTotal">—</b></div></article>
   </section>
   <section class="cc-lower">
    <article class="cc-panel"><div class="cc-panel-head"><div><h2>Upcoming schedule</h2><p>Next seven days · Manila time</p></div><button class="sec" onclick="showView('quests')">View all</button></div><div class="cc-agenda" id="ccAgenda"></div></article>
    <article class="cc-panel"><div class="cc-panel-head"><div><h2>Priority queue</h2><p>Work that needs your attention first</p></div><span class="cc-period" id="ccPriorityCount">0 OPEN</span></div><div class="cc-priority" id="ccPriority"></div></article>
   </section>
   <section class="cc-activity-strip"><div class="cc-mini"><b>One content record, multiple channels</b><span>Track Facebook, Instagram and TikTok links together.</span></div><div class="cc-mini"><b>Proof stays attached</b><span>Keep screenshots, post links and notes with each record.</span></div><div class="cc-mini"><b>Plan tomorrow today</b><span>Use the 4 PM planning workspace to prepare the next day's posts.</span></div></section>
   <section class="cc-planning-wrap"><div id="ccPlanMount"></div></section>
   <div id="ccLoadError" class="cc-empty" hidden></div>`;
  view.insertBefore(shell,view.firstChild);
  }
  const planner=$('#batchPlanner'),mountPoint=$('#ccPlanMount');if(planner&&mountPoint&&planner.parentElement!==mountPoint)mountPoint.appendChild(planner);
  document.querySelectorAll('#tabs .tab').forEach(b=>{const k=b.dataset.v;const names={overview:'Overview',quests:'Tasks',add:'Content',album:'Media',reports:'Reports',hunter:'Settings'};const l=b.querySelector('.lbl');if(l)l.textContent=names[k]||l.textContent;b.setAttribute('aria-label',names[k]||k)});
  $('#ccDate').textContent=new Date().toLocaleDateString('en-PH',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:tz});
  $('#ccGreeting').textContent='Your content command center.';
  mounted=true;
 }
 function render(rows){
  const today=dateNow(),from=add(today,-29),recent=rows.filter(x=>x.task_date>=from&&x.task_date<=today),pub30=recent.filter(x=>x.status==='published').length,scheduled=rows.filter(x=>x.status==='scheduled'&&x.task_date>=today).length,pending=rows.filter(x=>x.status==='pending').length,overdue=rows.filter(x=>x.task_date<today&&!done(x.status)),attention=pending+overdue.length,rate=recent.length?Math.round(pub30/recent.length*100):0;
  $('#ccPublished').textContent=pub30;$('#ccPublishedNote').textContent=recent.length+' records in the last 30 days';$('#ccScheduled').textContent=scheduled;$('#ccAttention').textContent=attention;$('#ccAttentionNote').textContent=overdue.length+' overdue · '+pending+' pending';$('#ccRate').textContent=rate+'%';$('#ccTotal').textContent=rows.length;
  const stages=[['Pending',rows.filter(x=>x.status==='pending').length,'pending'],['Prepared',rows.filter(x=>x.status==='prepared').length,'prepared'],['Scheduled',rows.filter(x=>x.status==='scheduled').length,'scheduled'],['Published',rows.filter(x=>x.status==='published').length,'published'],['Completed',rows.filter(x=>x.status==='completed').length,'completed']],max=Math.max(1,...stages.map(x=>x[1]));
  $('#ccPipeline').innerHTML=stages.map(([n,v,k])=>'<div class="cc-stage"><span>'+n+'</span><div class="cc-track"><i style="width:'+Math.round(v/max*100)+'%"></i></div><b>'+v+'</b></div>').join('');
  const days=Array.from({length:7},(_,i)=>add(today,i-6)),vals=days.map(d=>rows.filter(x=>x.task_date===d&&x.status==='published').length),peak=Math.max(1,...vals),sum=vals.reduce((a,b)=>a+b,0);
  $('#ccChart').innerHTML=days.map((d,i)=>'<div class="cc-chart-col"><span class="cc-chart-value">'+vals[i]+'</span><div class="cc-chart-track"><i class="cc-chart-bar" style="height:'+Math.max(3,vals[i]/peak*100)+'%"></i></div><span class="cc-chart-day">'+new Date(d+'T00:00:00Z').toLocaleDateString('en',{weekday:'short',timeZone:'UTC'})+'</span></div>').join('');
  $('#ccChartSummary').textContent=sum+' confirmed posts this week';$('#ccChartPeak').textContent='Peak '+peak+'/day';
  const upcoming=rows.filter(x=>x.task_date>=today&&x.task_date<=add(today,7)&&!done(x.status)).sort((a,b)=>a.task_date.localeCompare(b.task_date)||(a.scheduled_time||'99:99').localeCompare(b.scheduled_time||'99:99')).slice(0,6);
  $('#ccAgenda').innerHTML=upcoming.length?upcoming.map(x=>'<div class="cc-agenda-row"><span class="cc-time">'+(x.scheduled_time?time(x.scheduled_time):fmt(x.task_date))+'</span><div class="cc-agenda-title">'+esc(x.title)+'<span class="cc-agenda-meta">'+fmt(x.task_date)+' · '+esc(x.category||'Content')+'</span></div><span class="cc-status '+x.status+'">'+label(x.status)+'</span></div>').join(''):'<div class="cc-empty">No upcoming items in the next seven days.<br>Use Create content to add a post or plan.</div>';
  const queue=[...overdue.sort((a,b)=>a.task_date.localeCompare(b.task_date)),...rows.filter(x=>x.status==='pending'&&x.task_date>=today).sort((a,b)=>a.task_date.localeCompare(b.task_date))].slice(0,5);
  $('#ccPriorityCount').textContent=queue.length+' OPEN';$('#ccPriority').innerHTML=queue.length?queue.map(x=>'<div class="cc-priority-row"><span class="cc-time">'+(x.task_date<today?'OVERDUE':fmt(x.task_date))+'</span><div class="cc-priority-title">'+esc(x.title)+'<span class="cc-priority-meta">'+fmt(x.task_date)+' · '+esc(x.category||'Content')+'</span></div><span class="cc-status '+x.status+'">'+label(x.status)+'</span></div>').join(''):'<div class="cc-empty">You're clear. No overdue or pending work needs attention.</div>';
 }
 async function refresh(){
  if(!mounted||!$('#app')||$('#app').classList.contains('hide'))return;
  const token=++loadToken;try{const {data,error}=await sb.from('tasks').select('id,title,task_date,status,scheduled_time,category,notes,fb_url').limit(5000);if(token!==loadToken)return;if(error)throw error;lastRows=data||[];render(lastRows);const who=window.profile?.name||'';$('#ccGreeting').textContent=who?'Welcome back, '+who+'.':'Your content command center.';$('#ccLoadError').hidden=true;}
  catch(e){$('#ccLoadError').hidden=false;$('#ccLoadError').textContent='Dashboard data could not refresh: '+(e.message||'Unknown error');}
 }
 function init(){
  mount();if(!mounted)return;refresh();
  const app=$('#app');if(app)new MutationObserver(()=>{if(!app.classList.contains('hide'))refresh()}).observe(app,{attributes:true,attributeFilter:['class']});
  const old=window.renderOpsCockpit;if(typeof old==='function'&&!old.__ccWrapped){const wrapped=function(rows){old(rows);render(rows||[])};wrapped.__ccWrapped=true;window.renderOpsCockpit=wrapped;}
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
  const view=$('#v-overview');if(view)new MutationObserver(()=>{if(view.classList.contains('on'))refresh()}).observe(view,{attributes:true,attributeFilter:['class']});
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!reduced&&matchMedia('(hover:hover) and (pointer:fine)').matches){
   document.addEventListener('pointermove',e=>{const el=e.target.closest('.cc-kpi');if(!el)return;const r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;el.style.transform='perspective(850px) rotateX('+((.5-y)*5)+'deg) rotateY('+((x-.5)*6)+'deg) translateY(-3px)'},{passive:true});
   document.addEventListener('pointerout',e=>{const el=e.target.closest('.cc-kpi');if(el&&!el.contains(e.relatedTarget))el.style.transform=''}, {passive:true});
  }
 }
 let initAttempts=0;
 function safeInit(){if(mounted||initAttempts>=4)return;initAttempts++;try{init();}catch(e){console.error('[AHBA Ops] Dashboard mount failed',e);const view=$('#v-overview');if(view){let msg=$('#ccMountError');if(!msg){msg=document.createElement('div');msg.id='ccMountError';msg.className='cc-empty';view.insertBefore(msg,view.firstChild);}msg.textContent='The dashboard could not initialize. Reload the page to retry.';}}}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',safeInit,{once:true});else safeInit();
 window.addEventListener('load',safeInit,{once:true});
 window.addEventListener('pageshow',safeInit);
})();