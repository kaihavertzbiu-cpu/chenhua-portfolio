(()=>{
  'use strict';
  const $=id=>document.getElementById(id),view=$('listening-view');
  if(!view)return;
  const artwork=$('music-artwork'),lyrics=$('listening-lyrics'),lines=$('listening-lines');
  let audio=null,lastFocus=null,trackKey='',rows=[],active=-1,controller=null,manualUntil=0,resumeTimer=null,seeking=false,queueSignature='';
  const send=(command,value)=>window.dispatchEvent(new CustomEvent('chenhua-music-action',{detail:{command,value}}));
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clock=value=>{const n=Math.max(0,Math.floor(Number(value)||0));return Math.floor(n/60)+':'+String(n%60).padStart(2,'0');};
  function center(){
    if(view.hidden||active<0||!rows[active]?.node)return;
    const node=rows[active].node;
    lyrics.scrollTo({top:node.offsetTop-lines.offsetTop-lyrics.clientHeight/2+node.offsetHeight/2,behavior:reduced()?'instant':'smooth'});
  }
  function updateTime(force=false){
    const t=audio?.currentTime||0,d=Number.isFinite(audio?.duration)?audio.duration:0;
    $('listening-elapsed').textContent=clock(t);$('listening-duration').textContent=clock(d);
    $('listening-seek').max=String(d||1);$('listening-seek').disabled=!d;
    if(!seeking)$('listening-seek').value=String(t);
    let next=rows.length?0:-1;for(let i=0;i<rows.length&&rows[i].time<=t;i++)next=i;
    if(next!==active){rows[active]?.node.classList.remove('is-current');active=next;rows[active]?.node.classList.toggle('is-current',rows[active].time<=t);if(Date.now()>=manualUntil)center();}
    else {rows[active]?.node.classList.toggle('is-current',rows[active].time<=t);if(force===true&&Date.now()>=manualUntil)center();}
  }
  function empty(message){rows=[];active=-1;const p=document.createElement('p');p.className='listening-empty';p.textContent=message;lines.replaceChildren(p);}
  function parse(text){
    const offset=Number(text.match(/\[offset:([+-]?\d+)\]/i)?.[1]||0)/1000;
    const map=new Map();
    for(const line of text.replace(/^\uFEFF/,'').split(/\r?\n/)){
      const stamps=[...line.matchAll(/\[(\d{1,3}):(\d{1,2}(?:\.\d{1,3})?)\]/g)];
      const words=line.replace(/\[[^\]]*\]/g,'').trim();if(!words)continue;
      for(const stamp of stamps){const time=Math.max(0,Number(stamp[1])*60+Number(stamp[2])+offset);if(!map.has(time))map.set(time,[]);if(!map.get(time).includes(words))map.get(time).push(words);}
    }
    return [...map].sort((a,b)=>a[0]-b[0]).map(([time,texts])=>({time,texts}));
  }
  async function loadLyrics(source,key){
    controller?.abort();controller=new AbortController();const own=controller;
    empty(source?'正在载入歌词…':'这首歌暂无歌词。');$('listening-message').textContent='';
    if(!source)return;
    const timeout=setTimeout(()=>own.abort(),12000);
    try{
      let text=source;
      if(!source.includes('\n')&&!source.includes('[00:')){const response=await fetch(source,{signal:own.signal,credentials:'omit'});if(!response.ok)throw new Error('Lyrics unavailable');text=await response.text();}
      if(key!==trackKey)return;
      if(text.length>1000000)throw new Error('Lyrics too large');
      const parsed=parse(text);if(!parsed.length){empty('这首歌暂无同步歌词。');return;}
      active=-1;rows=parsed;lines.replaceChildren();
      for(const row of rows){const button=document.createElement('button');button.className='listening-line';button.type='button';button.tabIndex=-1;button.dataset.time=String(row.time);button.append(document.createTextNode(row.texts[0]));for(const translation of row.texts.slice(1)){const span=document.createElement('span');span.textContent=translation;button.append(span);}button.addEventListener('click',()=>{manualUntil=0;$('listening-resume').hidden=true;send('seek',row.time);updateTime(true);});row.node=button;lines.append(button);}
      updateTime(true);
    }catch(error){if(key===trackKey&&!own.signal.aborted)empty('歌词暂时未能载入。');else if(key===trackKey&&own.signal.aborted)empty('歌词载入超时，可以切歌后重试。');}
    finally{clearTimeout(timeout);}
  }
  function open(){
    if(!view.hidden)return;
    lastFocus=document.activeElement;view.hidden=false;document.body.classList.add('listening-open');
    $('site').inert=true;$('music-tray').inert=true;$('music-panel').inert=true;
    artwork.setAttribute('aria-expanded','true');$('listening-close').focus();
    manualUntil=0;$('listening-resume').hidden=true;send('state');updateTime(true);
  }
  function closeQueue(restoreFocus=true){
    $('listening-queue').hidden=true;$('listening-queue-shade').hidden=true;
    $('listening-playlist').setAttribute('aria-expanded','false');
    if(restoreFocus&&!view.hidden)$('listening-playlist').focus();
  }
  function openQueue(){
    $('listening-queue').hidden=false;$('listening-queue-shade').hidden=false;
    $('listening-playlist').setAttribute('aria-expanded','true');
    $('listening-queue-close').focus();
    const current=$('listening-queue-list').querySelector('[aria-current="true"]');
    current?.scrollIntoView({block:'nearest'});
  }
  function close(){
    if(view.hidden)return;
    closeQueue(false);view.hidden=true;document.body.classList.remove('listening-open');
    $('site').inert=false;$('music-tray').inert=false;$('music-panel').inert=false;
    artwork.setAttribute('aria-expanded','false');if(lastFocus?.isConnected)lastFocus.focus();
  }
  artwork.addEventListener('click',open);$('listening-close').addEventListener('click',close);
  window.addEventListener('chenhua-music-open-view',open);
  $('listening-playlist').addEventListener('click',()=>{if($('listening-queue').hidden)openQueue();else closeQueue();});
  $('listening-queue-close').addEventListener('click',()=>closeQueue());
  $('listening-queue-shade').addEventListener('click',()=>closeQueue());
  view.querySelectorAll('[data-listening-action]').forEach(button=>button.addEventListener('click',()=>send(button.dataset.listeningAction)));
  $('listening-seek').addEventListener('input',()=>{seeking=true;$('listening-elapsed').textContent=clock($('listening-seek').value);});
  $('listening-seek').addEventListener('change',()=>{send('seek',Number($('listening-seek').value));seeking=false;manualUntil=0;updateTime(true);});
  $('listening-volume').addEventListener('input',()=>send('volume',Number($('listening-volume').value)));
  function manual(){manualUntil=Date.now()+5000;$('listening-resume').hidden=false;clearTimeout(resumeTimer);resumeTimer=setTimeout(()=>{manualUntil=0;$('listening-resume').hidden=true;updateTime(true);},5100);}
  lyrics.addEventListener('wheel',manual,{passive:true});lyrics.addEventListener('touchmove',manual,{passive:true});
  lyrics.addEventListener('keydown',event=>{if(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End'].includes(event.key))manual();});
  $('listening-resume').addEventListener('click',()=>{manualUntil=0;clearTimeout(resumeTimer);$('listening-resume').hidden=true;center();});
  view.addEventListener('keydown',event=>{
    if(event.key==='Escape'){event.preventDefault();if(!$('listening-queue').hidden)closeQueue();else close();return;}
    if(event.key==='Tab'){const focusable=[...view.querySelectorAll('button:not(:disabled),input:not(:disabled),[tabindex="0"]')].filter(node=>!node.hidden&&node.getClientRects().length);const first=focusable[0],last=focusable.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}
  });
  window.addEventListener('resize',()=>updateTime(true));
  window.addEventListener('chenhua-music-view',event=>{
    const state=event.detail||{},playing=state.phase==='playing';
    view.classList.toggle('is-playing',playing);
    $('listening-toggle').classList.toggle('is-paused-icon',playing);$('listening-toggle').setAttribute('aria-label',playing?'暂停':'播放');$('listening-toggle').setAttribute('aria-pressed',String(playing));
    $('listening-title').textContent=$('listening-footer-title').textContent=state.title||'我的歌单';
    $('listening-artist').textContent=$('listening-footer-artist').textContent=state.artist||'';
    $('listening-message').textContent=state.phase==='waiting'?'正在缓冲…':state.phase==='error'?'这首歌暂时无法播放':'';
    view.querySelectorAll('[data-listening-action="previous"],[data-listening-action="next"]').forEach(button=>button.disabled=!state.loaded||state.count<2);
    if(audio!==state.audio){if(audio){audio.removeEventListener('timeupdate',updateTime);audio.removeEventListener('loadedmetadata',updateTime);audio.removeEventListener('seeked',updateTime);}audio=state.audio||null;if(audio){audio.addEventListener('timeupdate',updateTime);audio.addEventListener('loadedmetadata',updateTime);audio.addEventListener('seeked',updateTime);}}
    if(audio)$('listening-volume').value=String(audio.volume);
    const key=String(state.index)+'|'+state.title+'|'+state.lyricSource;
    if(key!==trackKey){trackKey=key;manualUntil=0;$('listening-resume').hidden=true;
      const cover=$('listening-cover');cover.hidden=!state.cover;if(state.cover){cover.src=state.cover;view.querySelector('.listening-backdrop').style.backgroundImage='url('+JSON.stringify(state.cover)+')';view.style.setProperty('--listening-art','url('+JSON.stringify(state.cover)+')');}else{cover.removeAttribute('src');view.querySelector('.listening-backdrop').style.backgroundImage='none';view.style.setProperty('--listening-art','none');}
      loadLyrics(state.lyricSource||'',key);
    }
    renderQueue(state.queue||[],state.index,playing);
    updateTime();
  });
  function renderQueue(queue,index,playing){
    const signature=JSON.stringify(queue);
    $('listening-queue-count').textContent=queue.length+' 首歌曲';
    if(signature!==queueSignature){
      queueSignature=signature;const list=$('listening-queue-list');list.replaceChildren();
      if(!queue.length){const item=document.createElement('li');item.className='listening-queue-empty';item.textContent='歌单正在载入…';list.append(item);}
      for(const item of queue){
        const li=document.createElement('li'),button=document.createElement('button');
        button.className='listening-queue-song';button.dataset.index=String(item.index);button.setAttribute('aria-label','播放 '+item.title+' · '+item.artist);
        const number=document.createElement('span');number.className='listening-queue-number';number.textContent=String(item.index+1).padStart(2,'0');button.append(number);
        const picture=document.createElement('span');picture.className='listening-queue-cover';
        if(item.cover){const image=document.createElement('img');image.src=item.cover;image.alt='';image.loading='lazy';image.addEventListener('error',()=>image.hidden=true);picture.append(image);}button.append(picture);
        const copy=document.createElement('span');copy.className='listening-queue-copy';const title=document.createElement('strong'),artist=document.createElement('span');title.textContent=item.title;title.title=item.title;artist.textContent=item.artist;copy.append(title,artist);button.append(copy);
        const mark=document.createElement('span');mark.className='listening-queue-mark';mark.setAttribute('aria-hidden','true');button.append(mark);
        button.addEventListener('click',()=>send('select',item.index));li.append(button);list.append(li);
      }
    }
    $('listening-queue-list').querySelectorAll('button').forEach(button=>{
      const selected=Number(button.dataset.index)===index;button.classList.toggle('is-current',selected);button.classList.toggle('is-playing',selected&&playing);
      if(selected)button.setAttribute('aria-current','true');else button.removeAttribute('aria-current');
    });
  }
  $('listening-cover').addEventListener('error',()=>{$('listening-cover').hidden=true;});
  send('state');
})();
