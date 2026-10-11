(()=>{
const scenes={
roster:{image:'home.webp',alt:'游戏指挥室首页',title:'十二位角色，各选五人出战',text:'双方交替选人，不能选择已入队的角色。治疗、斩杀、反伤与持续消耗会形成不同的阵容取向。',caption:'游戏首页 / 实机截图'},
core:{image:'battle.webp',alt:'实机战略桌与双方角色卡',title:'能核暗选，决定这一轮谁先行动',text:'秩序克制新月，新月克制荒芜，荒芜克制秩序。双方先锁定自己的选择，再一起揭示；相同则重新暗选。',caption:'战斗界面 / 下方为能核克制关系'},
battle:{image:'battle.webp',alt:'战斗中的人物卡和行动面板',title:'进攻目标隐藏，防守只能选一人',text:'攻击方承诺目标，防守方再选择一名角色保护自己。对手的目标在结算前不公开，不能看到答案后再格挡。',caption:'攻防教学 / 实机截图'},
report:{image:'report.webp',alt:'胜利战报与关键行动记录',title:'看清哪一次判断改变了局面',text:'从伤害、治疗、格挡、处决及关键事件回看整局。命线与斩杀直接造成阵亡，战报将它们与普通伤害分开记录。',caption:'开发测试对局 / 实际战报'}
};
const tabs=[...document.querySelectorAll('[data-scene]')];
function show(tab){const s=scenes[tab.dataset.scene];tabs.forEach(t=>{t.setAttribute('aria-selected',String(t===tab));t.tabIndex=t===tab?0:-1});document.querySelector('#decision-panel').setAttribute('aria-labelledby',tab.id);const image=document.querySelector('#scene-image');image.src='assets/first-move/'+s.image;image.alt=s.alt;document.querySelector('#scene-title').textContent=s.title;document.querySelector('#scene-description').textContent=s.text;document.querySelector('#scene-caption').textContent=s.caption;}
tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>show(tab));tab.addEventListener('keydown',e=>{let n;if(e.key==='ArrowRight'||e.key==='ArrowDown')n=(i+1)%tabs.length;else if(e.key==='ArrowLeft'||e.key==='ArrowUp')n=(i+tabs.length-1)%tabs.length;else if(e.key==='Home')n=0;else if(e.key==='End')n=tabs.length-1;else return;e.preventDefault();tabs[n].focus();show(tabs[n]);});});
})();
