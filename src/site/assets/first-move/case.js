(()=>{
const scenes={
roster:{image:'home.webp',alt:'游戏首页',title:'从十二名角色中组建队伍',text:'双方交替选人，各选五名，已经被选走的角色不能再选。每名角色都有自己的技能，可以根据想用的打法搭配队伍。',caption:'游戏首页'},
core:{image:'battle.webp',alt:'双方角色卡与战斗界面',title:'秘密选择能核，决定谁先行动',text:'每回合双方各选一种能核，选择完成后一起揭示。三种能核互相克制，克制对方的一方先攻；双方相同则重新选择。',caption:'战斗界面'},
battle:{image:'battle.webp',alt:'角色卡与行动选项',title:'猜对攻击目标，保护你的角色',text:'进攻方先选好攻击目标，防守方再选择一名角色格挡。目标在结算前隐藏，防守方需要判断对手会攻击谁。先攻方完成行动后，双方交换攻防。',caption:'战斗界面'},
report:{image:'report.webp',alt:'胜利战报与行动记录',title:'回看每回合的行动',text:'对局结束后，可以查看伤害、治疗、格挡和处决记录，了解哪些攻击被挡住，哪些技能击杀了角色。',caption:'一局开发测试的战报'}
};
const tabs=[...document.querySelectorAll('[data-scene]')];
function show(tab){const s=scenes[tab.dataset.scene];tabs.forEach(t=>{t.setAttribute('aria-selected',String(t===tab));t.tabIndex=t===tab?0:-1});document.querySelector('#decision-panel').setAttribute('aria-labelledby',tab.id);const image=document.querySelector('#scene-image');image.src='assets/first-move/'+s.image;image.alt=s.alt;document.querySelector('#scene-title').textContent=s.title;document.querySelector('#scene-description').textContent=s.text;document.querySelector('#scene-caption').textContent=s.caption;}
tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>show(tab));tab.addEventListener('keydown',e=>{let n;if(e.key==='ArrowRight'||e.key==='ArrowDown')n=(i+1)%tabs.length;else if(e.key==='ArrowLeft'||e.key==='ArrowUp')n=(i+tabs.length-1)%tabs.length;else if(e.key==='Home')n=0;else if(e.key==='End')n=tabs.length-1;else return;e.preventDefault();tabs[n].focus();show(tabs[n]);});});
})();
