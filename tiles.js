/* Original SVG artwork · MIT · ぽぽとしずく */
(function(root){
'use strict';
const wrap=(body)=>`<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
const art={
0:'<path d="M16 46l-2-4m2 4 3-3M46 18l1-4m-1 4-3-2" stroke="#a2b18a" stroke-width="1.6" stroke-linecap="round" fill="none"/><circle cx="43" cy="48" r="1.2" fill="#c5c4a0"/>',
1:'<ellipse cx="33" cy="54" rx="19" ry="5" fill="#758867" opacity=".18"/><path d="M31 51l1-24m0 17-9-8m9 4 8-7" fill="none" stroke="#8f694d" stroke-width="5" stroke-linecap="round"/><path d="M16 36C5 33 10 17 21 17 20 4 39 3 42 14 56 12 61 30 48 36 39 46 25 43 16 36Z" fill="#7f9e70" stroke="#607e56" stroke-width="1.4"/><path d="M16 26c0-6 5-9 10-8m8-4c5-2 10 1 11 5" fill="none" stroke="#bed0a1" stroke-width="3" stroke-linecap="round"/><path d="M29 32c5 3 9 0 12-2" fill="none" stroke="#6d8c61" stroke-width="2" stroke-linecap="round"/>',
2:'<path d="M20 52l3-21m17 20-1-27" fill="none" stroke="#7d9565" stroke-width="2.5" stroke-linecap="round"/><path d="M21 46c-9 0-11-7-9-8 8 0 10 4 9 8m19-5c9 1 13-5 11-7-7-1-11 3-11 7" fill="#9ab17d"/><g fill="#d59599" stroke="#bb7c80" stroke-width=".8"><ellipse cx="23" cy="22" rx="5" ry="7"/><ellipse cx="23" cy="35" rx="5" ry="7"/><ellipse cx="17" cy="28" rx="7" ry="5"/><ellipse cx="29" cy="28" rx="7" ry="5"/></g><g fill="#f3dcb0" stroke="#d3b680" stroke-width=".8"><ellipse cx="40" cy="16" rx="4.5" ry="6"/><ellipse cx="40" cy="28" rx="4.5" ry="6"/><ellipse cx="34" cy="22" rx="6" ry="4.5"/><ellipse cx="46" cy="22" rx="6" ry="4.5"/></g><circle cx="23" cy="28" r="4" fill="#eed399"/><circle cx="40" cy="22" r="3.5" fill="#d9ac6d"/>',
5:'<ellipse cx="33" cy="52" rx="23" ry="5" fill="#758867" opacity=".15"/><g stroke="#826749" stroke-linecap="round" stroke-linejoin="round"><path d="M17 34l-2 17m33-17 2 17M18 23l-1 14m28-14 1 14" stroke-width="3"/><path d="M14 15l36 1-1 14-35-1Z" fill="#c59e70" stroke-width="1.5"/><path d="M14 21l35 1" stroke-width="1.2"/><path d="M12 34l36-1 6 8-44 1Z" fill="#d9b88b" stroke-width="1.5"/><path d="M13 38l37-1" stroke-width="1"/></g>'
};
function svg(value,index=0,cells=[]){
 if(value!==3&&value!==4)return wrap(art[value]||art[0]);
 const x=index%12,y=Math.floor(index/12), links=[y>0&&cells[index-12]===value,x<11&&cells[index+1]===value,y<11&&cells[index+12]===value,x>0&&cells[index-1]===value];
 const ends=[[32,-4],[68,32],[32,68],[-4,32]],stroke=value===3?'#8bbfc2':'#d0b997',edge=value===3?'#75aeb2':'#bea681';
 const paths=links.map((on,i)=>on?`M32 32 Q${i%2?49:30} ${i%2?30:48} ${ends[i][0]} ${ends[i][1]}`:'').filter(Boolean);
 let body=paths.map(d=>`<path d="${d}" fill="none" stroke="${edge}" stroke-width="30" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${stroke}" stroke-width="27" stroke-linecap="round"/>`).join('');
 body+=`<path d="M16 27Q18 15 34 17T49 34Q45 49 28 47T16 27" fill="${stroke}" stroke="${edge}" stroke-width="1"/>`;
 body+=value===3?'<path d="M21 28q5-3 10 0t10 0m-16 9q5 3 11 0" fill="none" stroke="#c6e1d9" stroke-width="2" stroke-linecap="round"/>':'<g fill="#aa9477" opacity=".65"><ellipse cx="25" cy="27" rx="2" ry="1.2"/><ellipse cx="39" cy="35" rx="2.5" ry="1.2"/><ellipse cx="27" cy="40" rx="1.5" ry="1"/></g>';
 return wrap(body);
}
root.GardenTiles={svg};
})(typeof window==='undefined'?globalThis:window);
