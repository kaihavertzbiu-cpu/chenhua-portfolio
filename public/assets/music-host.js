(()=>{
  'use strict';
  const frame=document.getElementById('site');
  if(!frame||!window.APlayer||!window.MetingJSElement)return;
  const playlistId='12903419329';
  const panel=document.getElementById('music-panel'),slot=document.getElementById('music-slot');
  const tray=document.getElementById('music-tray'),status=document.getElementById('music-status');
  const retry=document.getElementById('music-retry');
  let ap=null,element=null,loadController=null,wantPlay=false,hasStartedPlayback=false,lastFocus=null,skipTimer=null,consecutiveFailures=0;
  let state={phase:'idle',title:'我的歌单',artist:'',cover:'',loaded:false,index:0,count:0};
  const $=s=>document.querySelector(s);
  function publish(){
    if(ap)slot.querySelectorAll('.aplayer-list li').forEach((row,index)=>{
      const entry=ap.list.audios[index];if(!entry)return;
      const title=row.querySelector('.aplayer-list-title'),artist=row.querySelector('.aplayer-list-author');
      if(title)title.textContent=entry.displayName||entry.name||'';
      if(artist)artist.textContent=entry.displayArtist||entry.artist||'';
    });
    tray.hidden=!hasStartedPlayback;
    state.requested=wantPlay;
    document.body.dataset.musicPhase=state.phase;
    const busy=state.phase==='loading';
    const playing=state.phase==='playing';
    const label=playing?'暂停':state.phase==='error'&&wantPlay?'停止切歌':busy&&wantPlay?'取消播放':'播放';
    $('#music-toggle').textContent='';
    $('#music-toggle').classList.toggle('is-paused-icon',playing);
    $('#music-toggle').setAttribute('aria-label',label);
    $('#music-toggle').setAttribute('aria-pressed',String(playing));
    $('#music-title').textContent=state.title;
    $('#music-artist').textContent=state.artist;
    const cover=$('#music-cover');
    if(state.cover){if(cover.getAttribute('src')!==state.cover)cover.src=state.cover;cover.hidden=cover.dataset.failedSrc===state.cover;}else{cover.hidden=true;cover.removeAttribute('src');}
    $('#music-count').textContent=state.loaded?state.count+' 首':'我的歌单';
    $('#music-prev').disabled=$('#music-next').disabled=!state.loaded||state.count<2;
    document.body.classList.toggle('music-active',!tray.hidden);
    frame.contentWindow?.postMessage({kind:'chenhua-music-state',state},'*');
    const entry=ap?.list.audios[ap.list.index];
    window.dispatchEvent(new CustomEvent('chenhua-music-view',{detail:{...state,audio:ap?.audio,lyricSource:entry?.lrc||'',queue:(ap?.list.audios||[]).map((item,index)=>({index,title:item.displayName||item.name||'',artist:item.displayArtist||item.artist||'',cover:item.cover||''}))}}));
    if(window.CH_MUSIC_DIAGNOSTIC){
      const item=ap?.list.audios[ap.list.index];
      let host='',protocol='';try{const u=new URL(item?.url);host=u.hostname;protocol=u.protocol;}catch{}
      window.dispatchEvent(new CustomEvent('chenhua-music-diagnostic',{detail:{title:state.title,phase:state.phase,hasURL:!!item?.url,host,protocol,audioError:ap?.audio.error?.code||0,readyState:ap?.audio.readyState??0,networkState:ap?.audio.networkState??0,message:status.textContent,resource:item?.url||''}}));
    }
  }
  function phase(value,message=''){
    state.phase=value;
    status.textContent=message;
    publish();
  }
  function current(index=ap?.list.index){
    if(!ap)return;
    const entry=ap.list.audios[index]||{};
    state={...state,index,title:entry.displayName||entry.name||'我的歌单',artist:entry.displayArtist||entry.artist||'',cover:entry.cover||''};
    publish();
  }
  function show(){
    lastFocus=document.activeElement;
    panel.hidden=false;
    if(ap)publish();
    $('#music-close').focus();
    $('#music-open').setAttribute('aria-expanded','true');
  }
  function hide(){
    panel.hidden=true;
    $('#music-open').setAttribute('aria-expanded','false');
    if(lastFocus?.isConnected)lastFocus.focus();
  }
  async function play(){
    if(!ap)return;
    wantPlay=true;
    hasStartedPlayback=true;publish();
    if(!ap.list.audios[ap.list.index]?.url){unavailable();return;}
    try{await ap.audio.play();}
    catch(error){
      if(!skipTimer)wantPlay=false;
      if(error.name==='NotAllowedError')phase('paused','歌单已载入，请点击播放。');
      else if(!skipTimer)phase('error','这首的音源不可访问，请切换下一首。');
    }
  }
  function toggle(){
    if(skipTimer){clearTimeout(skipTimer);skipTimer=null;wantPlay=false;phase('paused','已停止切歌。');return;}
    if(state.phase==='loading'){
      wantPlay=!wantPlay;
      status.textContent=wantPlay?'正在载入歌单…':'正在载入歌单，完成后不自动播放。';
      publish();
      return;
    }
    if(!ap){show();load(true);return;}
    if(!ap.audio.paused){wantPlay=false;ap.pause();}
    else play();
  }
  function skip(direction){
    clearTimeout(skipTimer);skipTimer=null;consecutiveFailures=0;
    if(!ap)return;
    if(direction<0)ap.skipBack();else ap.skipForward();
  }
  function unavailable(){
    if(skipTimer)return;
    const item=ap?.list.audios[ap.list.index];
    const row=slot.querySelectorAll('.aplayer-list li')[ap?.list.index];
    if(row){row.classList.add('music-unavailable');row.setAttribute('title','音源暂时无法播放');}
    retry.hidden=false;retry.textContent='重新载入歌单';
    const reason=!item?.url?'接口未提供音源':'音源暂时不可访问';
    if(!wantPlay){consecutiveFailures=0;phase('error',reason+'。请选择其他歌曲。');return;}
    consecutiveFailures+=1;
    if(wantPlay&&!window.CH_MUSIC_DIAGNOSTIC&&consecutiveFailures<=Math.min(5,state.count-1)){
      phase('error',reason+'，正在切换下一首…');
      skipTimer=setTimeout(()=>{skipTimer=null;ap.skipForward();play();},900);
    }else{
      wantPlay=false;
      phase('error',reason+'。请选择其他歌曲。');
    }
  }
  function bind(player){
    ap=player;
    state.loaded=true;state.count=ap.list.audios.length;
    retry.hidden=true;
    const labels={'.aplayer-icon-volume-down':'音量／静音','.aplayer-icon-volume-up':'音量／静音','.aplayer-icon-order':'切换播放顺序','.aplayer-icon-loop':'切换循环模式','.aplayer-icon-menu':'显示／收起曲目','.aplayer-icon-lrc':'显示／收起歌词'};
    for(const [selector,label] of Object.entries(labels))slot.querySelector(selector)?.setAttribute('aria-label',label);
    tray.hidden=!hasStartedPlayback;
    current();
    phase('paused','');
    ap.on('playing',()=>{hasStartedPlayback=true;const row=slot.querySelectorAll('.aplayer-list li')[ap.list.index];if(row){row.classList.remove('music-unavailable');row.removeAttribute('title');}retry.hidden=true;consecutiveFailures=0;clearTimeout(skipTimer);skipTimer=null;phase('playing','');});
    ap.on('pause',()=>{if(state.phase!=='error')phase('paused','');});
    ap.on('waiting',()=>phase('waiting','正在缓冲…'));
    ap.on('ended',()=>phase('paused',''));
    ap.on('error',unavailable);
    ap.on('listswitch',event=>{current(event.index);phase('paused','');});
    ap.on('listadd',()=>{state.count=ap.list.audios.length;publish();});
    if(wantPlay)play();
  }
  class BlogPlaylist extends window.MetingJSElement{
    disconnectedCallback(){this.aplayer?.destroy();}
    async _parse(){
      loadController?.abort();
      const controller=new AbortController();loadController=controller;
      const timer=setTimeout(()=>controller.abort(),18000);
      try{
        const url=this.api.replace(':server',this.meta.server).replace(':type',this.meta.type).replace(':id',this.meta.id).replace(':auth',this.meta.auth||'').replace(':r',Date.now());
        const localTracks=Array.isArray(window.CH_LOCAL_TRACKS)?window.CH_LOCAL_TRACKS:[];
        const key=item=>String(item.name||item.title||'').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
        const prepare=data=>data.filter(item=>item&&(typeof item.name==='string'||typeof item.title==='string')).map(item=>{
          const name=item.name||item.title,artist=Array.isArray(item.artist)?item.artist.join(' / '):String(item.artist||item.author||'');
          return {name:escapeText(name),artist:escapeText(artist),displayName:name,displayArtist:artist,
            url:mediaURL(item.url),cover:mediaURL(typeof item.pic==='string'?item.pic:typeof item.cover==='string'?item.cover:''),
            lrc:typeof item.lrc==='string'?item.lrc:''};
        });
        const start=tracks=>{
          if(!tracks.length)throw new Error('No tracks');
          this.config.lrcType=3;this.config.volume=0.35;
          this._loadPlayer(tracks);bind(this.aplayer);
        };
        // Provided files are ready immediately; the legacy selection is appended in the background.
        if(localTracks.length)start(prepare(localTracks));
        const selected=new Set((window.CH_REMOTE_TITLES||[]).map(title=>key({name:title})));
        if(!selected.size)return;
        const response=await fetch(url,{signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer'});
        if(!response.ok){
          let code='';try{code=(await response.json()).code||'';}catch{}
          throw new Error(code==='SERVICE_NOT_CONFIGURED'?'Music service not ready':'HTTP '+response.status);
        }
        const data=await response.json();
        if(!Array.isArray(data))throw new Error('Empty playlist');
        if(element!==this||controller.signal.aborted)return;
        const seen=new Set(localTracks.map(key));
        const tail=data.filter(item=>{if(!item)return false;const name=key(item);if(!selected.has(name)||seen.has(name))return false;seen.add(name);return true;});
        const tracks=prepare(tail);
        if(this.aplayer){if(tracks.length)this.aplayer.list.add(tracks);state.count=this.aplayer.list.audios.length;publish();}
        else start(tracks);
      }catch(error){
        if(element!==this)return;
        if(this.aplayer)return;
        wantPlay=false;
        const reason=error.name==='AbortError'?'连接超时':error.name==='TypeError'?'连接失败（网络或跨域限制）':error.name==='SyntaxError'?'接口没有返回歌单数据':error.message==='Music service not ready'?'音乐服务暂未就绪':/^HTTP \d+$/.test(error.message)?'接口响应 '+error.message:error.message==='Empty playlist'?'接口返回空歌单':'歌单数据格式不兼容';
        phase('error','歌单未能载入：'+reason+'。');
        retry.hidden=false;
      }finally{clearTimeout(timer);}
    }
  }
  function escapeText(value){return String(value).replace(/[&<>\"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[char]));}
  function mediaURL(value){
    if(typeof value!=='string'||!value)return '';
    try{const u=new URL(value.startsWith('//')?'https:'+value:value,location.href);if(u.protocol==='http:'&&(u.hostname.endsWith('.music.126.net')||u.hostname==='music.126.net'||u.hostname==='api.i-meto.com'||u.hostname==='music.163.com'))u.protocol='https:';return u.protocol==='https:'||(u.protocol==='http:'&&u.origin===location.origin)?u.href:'';}catch{return '';}
  }
  if(!customElements.get('chenhua-playlist'))customElements.define('chenhua-playlist',BlogPlaylist);
  function load(autoplay){
    wantPlay=autoplay;
    if(ap){if(autoplay)play();return;}
    if(state.phase==='loading')return;
    retry.hidden=true;
    phase('loading','正在载入歌单…');
    element=document.createElement('chenhua-playlist');
    if(typeof window.CH_MUSIC_API==='string'&&window.CH_MUSIC_API.startsWith('/api/music?'))element.setAttribute('api',window.CH_MUSIC_API);
    for(const [key,value] of Object.entries({server:'netease',type:'playlist',id:playlistId,theme:'#8f1f2a',autoplay:'false',preload:'none',volume:'0.35',order:'list',loop:'all','list-folded':'false','list-max-height':'260px','lrc-type':'3','storage-name':'chenhua-music'}))element.setAttribute(key,value);
    slot.replaceChildren(element);
  }
  window.addEventListener('chenhua-music-action',event=>{
    const {command,value}=event.detail||{};
    if(command==='state')publish();
    else if(command==='toggle')toggle();
    else if(command==='previous')skip(-1);
    else if(command==='next')skip(1);
    else if(command==='playlist'){show();load(false);}
    else if(command==='select'&&ap&&Number.isInteger(Number(value))&&Number(value)>=0&&Number(value)<ap.list.audios.length){
      clearTimeout(skipTimer);skipTimer=null;consecutiveFailures=0;
      ap.list.switch(Number(value));play();
    }
    else if(command==='seek'&&ap&&Number.isFinite(ap.audio.duration))ap.seek(Math.max(0,Math.min(ap.audio.duration,Number(value)||0)));
    else if(command==='volume'&&ap)ap.volume(Math.max(0,Math.min(1,Number(value)||0)),true);
  });
  $('#music-cover').addEventListener('error',event=>{event.target.dataset.failedSrc=event.target.getAttribute('src');event.target.hidden=true;});
  $('#music-toggle').addEventListener('click',toggle);
  $('#music-open').addEventListener('click',()=>{if(panel.hidden){show();load(false);}else hide();});
  $('#music-close').addEventListener('click',hide);
  $('#music-prev').addEventListener('click',()=>skip(-1));
  $('#music-next').addEventListener('click',()=>skip(1));
  retry.addEventListener('click',()=>{clearTimeout(skipTimer);skipTimer=null;wantPlay=false;if(ap){ap=null;slot.replaceChildren();state.loaded=false;state.count=0;state.phase='idle';}load(false);});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden)hide();});
  window.addEventListener('message',event=>{
    if(event.source!==frame.contentWindow||event.data?.kind!=='chenhua-music-command')return;
    switch(event.data.command){
      case 'state':publish();if(state.phase==='idle')load(false);break;
      case 'toggle':toggle();break;
      case 'lyrics':if(!ap)load(false);window.dispatchEvent(new CustomEvent('chenhua-music-open-view'));break;
      case 'open':show();load(false);break;
      case 'previous':skip(-1);break;
      case 'next':skip(1);break;
    }
  });
  frame.addEventListener('load',publish);
  publish();
})();
