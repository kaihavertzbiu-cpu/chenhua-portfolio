(()=>{
  const tabs=[...document.querySelectorAll('[data-section]')];
  const search=document.querySelector('#writing-search');
  const articles=document.querySelector('#writing-articles'),albums=document.querySelector('#writing-albums');
  const rows=[...articles.querySelectorAll('.writing-entry')];
  const count=document.querySelector('#writing-count'),empty=document.querySelector('#writing-empty');
  let active='articles';
  for(const list of [articles,albums]){
    [...list.children].sort((a,b)=>(b.dataset.date||'').localeCompare(a.dataset.date||'')).forEach(row=>list.append(row));
  }
  function update(){
    const isArticle=active==='articles';
    articles.hidden=!isArticle;albums.hidden=isArticle;search.closest('label').hidden=!isArticle;
    let visible=0;
    for(const row of rows){row.hidden=!row.textContent.toLocaleLowerCase().includes(search.value.trim().toLocaleLowerCase());if(!row.hidden)visible++;}
    count.textContent=isArticle?visible+' 篇文章':albums.children.length+' 条记录';
    empty.hidden=!isArticle||visible>0;
    for(const tab of tabs){const selected=tab.dataset.section===active;tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;}
  }
  function select(tab){active=tab.dataset.section;update();}
  for(const tab of tabs){
    tab.addEventListener('click',()=>select(tab));
    tab.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
      event.preventDefault();
      const next=event.key==='Home'?tabs[0]:event.key==='End'?tabs.at(-1):tabs[(tabs.indexOf(tab)+1)%tabs.length];
      select(next);next.focus();
    });
  }
  search.addEventListener('input',update);update();
  const viewer=document.querySelector('#album-lightbox'),image=document.querySelector('#album-large-image');
  for(const button of document.querySelectorAll('.album-photo'))button.addEventListener('click',()=>{
    const thumbnail=button.querySelector('img'),entry=button.closest('.album-entry');
    image.src=thumbnail.currentSrc||thumbnail.src;image.alt=thumbnail.alt;
    document.querySelector('#album-photo-title').textContent=thumbnail.alt;
    document.querySelector('#album-photo-date').textContent=entry.querySelector('time').textContent;
    document.querySelector('#album-photo-caption').textContent=button.dataset.caption||entry.querySelector('.album-caption').textContent;
    viewer.showModal();
  });
  viewer.querySelector('.album-close').addEventListener('click',()=>viewer.close());
  viewer.addEventListener('click',event=>{if(event.target===viewer)viewer.close();});
})();
