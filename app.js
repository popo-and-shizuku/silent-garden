/* MIT · ぽぽとしずく */
'use strict';
const $=id=>document.getElementById(id), names=['空き地','木','花','水','道','ベンチ'];
const memory=new Map();
let state={id:'0000000000000000',peers:[],moves:[]},room=null,peer='',topic='',role=-1,base=Garden.board([]),draft=base.slice(),selected=-1,replayStep=0,demo=false,online=false,sending=false,joining=false;
function load(key){try{return localStorage.getItem(key)??memory.get(key);}catch{return memory.get(key);}}
function save(key,value){memory.set(key,value);try{localStorage.setItem(key,value);}catch{$('storage').hidden=false;$('storage').textContent='このブラウザでは保存できません。画面を閉じるとメモや担当が失われます。';}}
function remove(key){memory.delete(key);try{localStorage.removeItem(key);}catch{}}
function memoKey(t=state.moves.length){return 'garden-v2-note-'+state.id+'-'+peer+'-'+JSON.stringify(state.moves.slice(0,t));}
function editable(){return !demo&&online&&!sending&&!joining&&state.peers.length===2&&role===state.moves.length%2&&state.moves.length<12;}
function draw(cells){
  const focus=document.activeElement?.closest('.cell')?.dataset.index;
  $('board').replaceChildren();const changes=new Set(Garden.diff(base,draft).map(x=>x[0]));
  cells.forEach((value,index)=>{
    const button=document.createElement('button');button.type='button';button.className='cell';button.dataset.index=index;button.dataset.tile=value;
    button.innerHTML=GardenTiles.svg(value,index,cells);button.setAttribute('aria-label',`${Math.floor(index/12)+1}行${index%12+1}列 ${names[value]}`);
    button.setAttribute('aria-pressed',String(index===selected));button.classList.toggle('chosen',index===selected);button.classList.toggle('changed',editable()&&changes.has(index));button.disabled=!editable();
    button.onclick=()=>{selected=index;draw(draft);$('selected').textContent=`${Math.floor(index/12)+1}行${index%12+1}列に、何を置く？`;};$('board').append(button);
  });
  if(focus!==undefined&&editable())$('board').children[Number(focus)]?.focus({preventScroll:true});
  $('count').textContent=`${Garden.diff(base,draft).length} / 3マス`;
  for(const button of $('palette').children)button.disabled=selected<0||!editable();
}
function showNotes(){
  $('notes').replaceChildren();let found=false;
  if(!demo&&role>=0)for(let t=role;t<state.moves.length;t+=2){const text=load(memoKey(t));if(!text)continue;const p=document.createElement('p');p.className='note';p.textContent=`${t+1}手目\n${text}`;$('notes').append(p);found=true;}
  if(!found)$('notes').textContent=demo?'作者のメモは入っていません。自分ならどう読んだか、話してみてね。':'メモはありません。覚えているところから話そう。';
}
function replay(){replayStep=Number($('step').value);$('step-label').textContent=replayStep===0?'はじまりの空き地':`${replayStep}手目（${replayStep%2?'先手':'後手'}）`;$('previous').disabled=replayStep===0;$('next').disabled=replayStep===state.moves.length;draw(Garden.board(state.moves,replayStep));}
function render(reset=false){
  if(reset){base=Garden.board(state.moves);draft=base.slice();selected=-1;$('memo').value=demo||role<0?'':load(memoKey())||'';$('memo-box').open=false;$('selected').textContent='マスを選んで、置くものをタップ。';$('live').textContent='';}
  const done=state.moves.length===12||demo;
  $('welcome').hidden=true;$('game').hidden=false;$('identity').textContent=demo?'ふたりの庭':role===0?'あなたは先手':role===1?'あなたは後手':'見守り中';
  $('turn').textContent=done?'ふたりの庭、できあがり。':`${state.moves.length+1} / 12手目`;
  $('instruction').textContent=demo?'ちがうつもりで作った、同じ庭。':done?'「そういうつもりだったの!?」を話そう。':joining?'庭につないでいます…':state.peers.length<2?'相手を待っています。同じ合言葉で入ってもらってね。':role<0?'この庭はふたりで制作中。ここから見守れます。':sending?'相手に届けています…':!online?'接続を確かめています。':editable()?'あなたの番。3マスまで、自由に。':'相手の番。どんな続きを作るかな。';
  $('editor').hidden=done||role<0||state.peers.length<2||role!==state.moves.length%2;
  $('commit').disabled=!editable();$('undo').disabled=!editable();$('memo').disabled=!editable();$('replay').hidden=!done;
  $('connection').hidden=demo;$('retry').hidden=demo||online||joining;
  if(done){$('step').max=state.moves.length;if(reset)$('step').value=state.moves.length;replay();showNotes();}else draw(draft);
}
function applyState(next){
  const nextRole=next.peers.indexOf(peer),changed=state.id!==next.id||JSON.stringify(state.moves)!==JSON.stringify(next.moves)||role!==nextRole;
  state=next;role=nextRole;render(changed);
  if(state.moves.length===12)room?.close();
}
async function connect(nextTopic){
  room?.close();topic=nextTopic;demo=false;online=false;joining=true;sending=false;state={id:'0000000000000000',peers:[],moves:[]};peer=load('garden-v2-peer-'+topic)||GardenSync.randomID();role=-1;render(true);
  const client=new GardenSync.Room(topic,next=>{if(room===client)applyState(next);},(ok,message)=>{if(room!==client)return;online=ok;$('connection').textContent=ok?'つながっています':message;render();});room=client;
  try{
    await client.refresh();if(room!==client)return;
    if(state.peers.length===0)peer=GardenSync.randomID();
    save('garden-v2-peer-'+topic,peer);save('garden-v2-active',topic);
    if(!state.peers.includes(peer)&&state.peers.length<2)await client.publish({v:2,kind:'join',peer});
    if(room!==client)return;role=state.peers.indexOf(peer);client.listen();
  }catch(error){if(room!==client)return;online=false;$('connection').textContent=error.message;}
  finally{if(room===client){joining=false;render(true);}}
}
function leave(){room?.close();room=null;online=false;joining=false;sending=false;demo=false;remove('garden-v2-active');$('memo').value='';$('notes').replaceChildren();$('game').hidden=true;$('welcome').hidden=false;$('join-error').textContent='';history.replaceState(null,'',location.pathname+location.search);$('phrase').focus();}
function openDemo(){
  room?.close();room=null;demo=true;online=false;joining=false;sending=false;peer='';role=-1;
  try{state={...Garden.decode(location.hash),peers:[]};render(true);}catch(error){leave();$('join-error').textContent=error.message;}
}
for(let v=0;v<names.length;v++){
 const button=document.createElement('button');button.type='button';button.innerHTML=GardenTiles.svg(v)+`<span>${names[v]}</span>`;button.setAttribute('aria-label',names[v]);
 button.onclick=()=>{if(selected<0||!editable())return;const next=draft.slice();next[selected]=v;if(Garden.diff(base,next).length>3){$('live').textContent='1手は3マスまで。変えたマスを元に戻すか、手を終えよう。';return;}draft=next;$('live').textContent='';draw(draft);};$('palette').append(button);
}
$('little-garden').innerHTML=[1,2,5,1].map(v=>GardenTiles.svg(v)).join('');
$('join').onsubmit=async event=>{event.preventDefault();if(joining)return;$('start').disabled=true;$('join-error').textContent='';try{const nextTopic=await GardenSync.topicFor($('phrase').value);$('phrase').value='';await connect(nextTopic);}catch(error){$('join-error').textContent=error.message;}finally{$('start').disabled=false;}};
$('memo').oninput=()=>{if(editable())save(memoKey(),$('memo').value);};
$('undo').onclick=()=>{if(!editable())return;draft=base.slice();selected=-1;draw(draft);$('selected').textContent='マスを選んで、置くものをタップ。';};
$('commit').onclick=async()=>{
 if(!editable())return;const changes=Garden.diff(base,draft);if(!changes.length&&!confirm('何も変えずにパスする？'))return;
 const client=room,payload={v:2,kind:'turn',peer,game:state.id,moves:[...state.moves,changes]};save(memoKey(),$('memo').value);sending=true;render();
 try{await client.publish(payload);}catch(error){if(room!==client)return;$('live').textContent=error.message;try{await client.refresh();}catch{} }
 finally{if(room===client){sending=false;render();}}
};
$('retry').onclick=async()=>{if(!room)return;const client=room;try{await client.refresh();client.listen();if(state.peers.indexOf(peer)<0&&state.peers.length<2)await connect(topic);}catch(error){$('connection').textContent=error.message;}};
$('leave').onclick=leave;$('step').oninput=replay;
$('previous').onclick=()=>{$('step').value=Math.max(0,replayStep-1);replay();};$('next').onclick=()=>{$('step').value=Math.min(state.moves.length,replayStep+1);replay();};
$('sample').href=Garden.encode(GARDEN_SAMPLE);window.addEventListener('hashchange',()=>{if(location.hash)openDemo();else leave();});
window.addEventListener('online',()=>room?.refresh().catch(()=>{}));document.addEventListener('visibilitychange',()=>{if(!document.hidden)room?.refresh().catch(()=>{});});
if(location.hash)openDemo();else{const previous=load('garden-v2-active');if(previous&&/^silent-garden-v2-[a-f0-9]{32}$/.test(previous))connect(previous);}
