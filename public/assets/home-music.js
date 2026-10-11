(()=>{
 const dock=document.querySelector('.home-music-dock');if(!dock)return;
 const entry=dock.querySelector('.home-music-entry'),panel=dock.querySelector('.home-turntable'),cover=entry.querySelector('img');
 const setOpen=(open,restore=false)=>{panel.hidden=!open;entry.setAttribute('aria-expanded',String(open));entry.setAttribute('aria-label',open?'收起唱片机':'展开唱片机');if(open)panel.querySelector('.home-music-close').focus({preventScroll:true});else if(restore)entry.focus({preventScroll:true});};
 entry.addEventListener('click',()=>setOpen(panel.hidden));
 dock.querySelector('.home-music-close').addEventListener('click',()=>setOpen(false,true));
 document.addEventListener('pointerdown',e=>{if(!panel.hidden&&!dock.contains(e.target))setOpen(false);});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden){setOpen(false,true);e.preventDefault();}});
 dock.querySelectorAll('[data-music="lyrics"],[data-music="open"]').forEach(b=>b.addEventListener('click',()=>setOpen(false)));
 window.addEventListener('message',e=>{if(e.source!==window.parent||e.data?.kind!=='chenhua-music-state')return;const s=e.data.state;if(!s)return;entry.classList.toggle('is-playing',s.phase==='playing');entry.title=s.loaded?s.title+' · '+s.artist:'音乐';if(s.cover&&/^(https?:|data:image\/)/.test(s.cover)){if(cover.getAttribute('src')!==s.cover){cover.hidden=false;cover.src=s.cover;}}else{cover.hidden=true;cover.removeAttribute('src');}});
 cover.addEventListener('error',()=>cover.hidden=true);
})();
