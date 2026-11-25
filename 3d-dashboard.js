/* AHBA Content Operations — spatial interaction layer */
(() => {
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;
  function relabel() {
    const labels = [['hunter','Settings'],['quests','Tasks'],['add','Content']];
    labels.forEach(([key,value]) => {
      const tab=document.querySelector('#tabs .tab[data-v="'+key+'"]');
      if(!tab)return;
      tab.setAttribute('aria-label',value);tab.setAttribute('title',value);
      const label=tab.querySelector('.lbl');if(label)label.textContent=value;
    });
    const title=document.querySelector('#v-quests .quest-title-row h1');
    if(title)title.textContent='Task management';
    const intro=document.querySelector('#v-quests .quest-title-row p');
    if(intro)intro.textContent='Manage content work from preparation through confirmed publication.';
    const kicker=document.querySelector('#batchPlanner .batch-kicker');
    if(kicker)kicker.textContent='Daily planning reminder · 4:00 PM Philippine time';
  }
  function spatialize(){
    const selectors=['#v-overview .sh-home','#v-overview .ops-kpi','#v-overview .ops-panels > .card','#v-overview .batch-planner','#v-quests .quest-command','#v-quests .quest-board-panel','#v-add .add-entry-card','#v-add #draftCard','#v-reports > .card','#v-album > .card','#v-hunter .card'];
    document.querySelectorAll(selectors.join(',')).forEach(node=>{
      if(node.dataset.spatialReady==='1')return;
      node.dataset.spatialReady='1';node.classList.add('spatial-card');
      if(!finePointer||reduce)return;
      let frame=0;
      node.addEventListener('pointermove',event=>{
        if(event.pointerType==='touch')return;
        const rect=node.getBoundingClientRect(),x=(event.clientX-rect.left)/rect.width,y=(event.clientY-rect.top)/rect.height;
        if(frame)cancelAnimationFrame(frame);
        frame=requestAnimationFrame(()=>{
          node.style.setProperty('--tilt-x',((.5-y)*4.5).toFixed(2)+'deg');
          node.style.setProperty('--tilt-y',((x-.5)*5.5).toFixed(2)+'deg');
          node.style.setProperty('--lift','-3px');
        });
      },{passive:true});
      node.addEventListener('pointerleave',()=>{
        if(frame)cancelAnimationFrame(frame);
        node.style.setProperty('--tilt-x','0deg');node.style.setProperty('--tilt-y','0deg');node.style.setProperty('--lift','0px');
      },{passive:true});
    });
  }
  function init(){relabel();spatialize();const app=document.getElementById('app');if(!app)return;new MutationObserver(()=>{relabel();spatialize()}).observe(app,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();