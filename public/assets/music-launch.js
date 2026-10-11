(()=>{
  const button=document.querySelector('[data-music="lyrics"]'),toggle=document.querySelector('[data-music="toggle"]');
  if(!button||!toggle)return;
  let host=window.parent;
  const send=command=>host.postMessage({kind:'chenhua-music-command',command},'*');
  document.querySelectorAll('[data-music]').forEach(control=>control.addEventListener('click',()=>send(control.dataset.music)));
  window.addEventListener('message',event=>{
    if(event.source!==host||event.data?.kind!=='chenhua-music-state')return;
    const s=event.data.state;
    if(!s)return;
    button.classList.toggle('is-playing',s.phase==='playing');
    button.classList.toggle('is-loading',s.phase==='loading'||s.phase==='waiting');
    const pause=s.phase==='playing'||((s.phase==='loading'||s.phase==='waiting'||s.phase==='error')&&s.requested);
    toggle.setAttribute('aria-label',pause?'暂停音乐':'播放我的歌单');
    toggle.setAttribute('aria-pressed',String(pause));
    toggle.classList.toggle('is-paused-icon',pause);
    button.closest('.record-player').classList.toggle('is-loading',s.phase==='loading'||s.phase==='waiting');
    button.querySelector('.record-caption-title').textContent=s.loaded?s.title:'我的歌单';
    button.querySelector('.record-caption-platform').textContent=s.loaded?s.artist:s.phase==='loading'?'正在载入…':'查看专辑与歌词';
    const cover=button.querySelector('.record-cover');
    if(s.cover&&/^(https?:|data:image\/)/.test(s.cover)){
      if(cover.getAttribute('src')!==s.cover)cover.src=s.cover;
      cover.hidden=cover.dataset.failedSrc===s.cover;
    }else{cover.hidden=true;cover.removeAttribute('src');}
    document.querySelectorAll('[data-music="previous"],[data-music="next"]').forEach(b=>b.disabled=!s.loaded||s.count<2);
  });
  button.querySelector('.record-cover').addEventListener('error',event=>{event.target.dataset.failedSrc=event.target.getAttribute('src');event.target.hidden=true;});
  send('state');
})();
