/* MIT · ぽぽとしずく */
'use strict';
const $ = id => document.getElementById(id);
const tiles = [['·','空き地'],['🌳','木'],['🌸','花'],['💧','水'],['▪','道'],['🪑','ベンチ']];
let state, role, base, draft, selected = -1, replayStep, sampleMode = false;
const memory = new Map();
function load(key) {try {return localStorage.getItem(key) ?? memory.get(key);} catch {return memory.get(key);}}
function save(key, value) {memory.set(key,value);try {localStorage.setItem(key,value);} catch {$('storage').hidden=false;$('storage').textContent='このブラウザでは保存できません。メモは画面を閉じると消えます。必要なら手元に控えてね。';}}
function roleKey() {return 'garden-role-' + state.id;}
function memoKey(turn = state.moves.length) {return 'garden-memo-' + state.id + '-' + role + '-' + JSON.stringify(state.moves.slice(0,turn));}
function editable() {return state && !sampleMode && state.moves.length < 12 && state.moves.length % 2 === role;}
function newGarden() {
  const id = Array.from(crypto.getRandomValues(new Uint8Array(8)), x => x.toString(16).padStart(2,'0')).join('');
  save('garden-role-'+id,'0'); location.hash = Garden.encode({id, moves:[]});
}
function draw(cells) {
  $('board').replaceChildren();
  const changes = new Set(editable() ? Garden.diff(base,draft).map(x=>x[0]) : []);
  cells.forEach((value,index) => {
    const cell=document.createElement('button'); cell.type='button'; cell.className='cell'; cell.dataset.tile=value;
    cell.textContent=tiles[value][0]; cell.setAttribute('aria-label',`${Math.floor(index/12)+1}行${index%12+1}列 ${tiles[value][1]}`);
    cell.setAttribute('aria-pressed',String(index===selected)); cell.classList.toggle('chosen',index===selected);cell.classList.toggle('changed',changes.has(index));
    cell.disabled=!editable();cell.onclick=()=>{selected=index;draw(draft);$('selected').textContent=`${Math.floor(index/12)+1}行${index%12+1}列。置くものを選んでね。`;};
    $('board').append(cell);
  });
  $('count').textContent=`この手で変えるマス：${Garden.diff(base,draft).length} / 3`;
  for(const button of $('palette').children) button.disabled=selected<0 || !editable();
}
function showNotes() {
  $('notes').replaceChildren();let found=false;
  for(let t=role;t<12;t+=2) {
    const text=load(memoKey(t)); if(!text) continue;
    const p=document.createElement('p');p.className='note';p.textContent=`${t+1}手目\n${text}`;$('notes').append(p);found=true;
  }
  if(!found) $('notes').textContent=sampleMode ? 'サンプルには作者のメモを入れていません。自分ならどう読んだか、話してみてね。' : 'このブラウザにはメモがありません。覚えていることから話そう。';
}
function replay() {replayStep=Number($('step').value);$('step-label').textContent=replayStep===0?'はじまりの空き地':`${replayStep}手目（${replayStep%2 ? '先手' : '後手'}）`;$('previous').disabled=replayStep===0;$('next').disabled=replayStep===12;draw(Garden.board(state.moves,replayStep));}
function render() {
  const n=state.moves.length, done=n===12;
  $('welcome').hidden=true;$('game').hidden=false;$('error').hidden=true;
  base=Garden.board(state.moves);draft=base.slice();selected=-1;
  $('identity').textContent=sampleMode?'サンプル':role===0?'あなたは先手':'あなたは後手';
  $('turn').textContent=done?'ふたりの庭、できあがり。':`${n+1} / 12手目`;
  $('instruction').textContent=done?'できた庭は同じ。見えていたものは、同じかな。':editable()?'あなたの番。3マスまで、自由に変えてね。':'相手から次のリンクが届くのを待とう。';
  $('editor').hidden=!editable();$('share').hidden=done||editable();$('replay').hidden=!done;
  $('selected').textContent='マスをタップしてから、置くものを選んでね。';
  $('memo').value=load(memoKey())||'';$('live').textContent='';$('copy-status').textContent='';
  $('share-url').value=location.href;
  $('copy').textContent=done?'完成した庭のリンクをコピー':'リンクをコピー';
  $('switch').hidden=sampleMode;
  draw(draft);
  if(done){$('step').value=12;replay();showNotes();}
}
function openHash() {
  if(!location.hash){state=null;$('welcome').hidden=false;$('game').hidden=true;$('error').hidden=true;return;}
  try {
    state=Garden.decode(location.hash);sampleMode=state.id===GARDEN_SAMPLE.id && JSON.stringify(state.moves)===JSON.stringify(GARDEN_SAMPLE.moves);
    const stored=load(roleKey());role=stored==='0'||stored==='1'?Number(stored):state.moves.length%2;
    if(!sampleMode) save(roleKey(),String(role));render();
  } catch(error){state=null;$('game').hidden=true;$('welcome').hidden=false;$('error').hidden=false;$('error').textContent=error.message;}
}
for(let v=0;v<tiles.length;v++) {
  const button=document.createElement('button');button.textContent=tiles[v].join(' ');button.type='button';
  button.onclick=()=>{
    if(selected<0||!editable()) return;
    const next=draft.slice();next[selected]=v;
    if(Garden.diff(base,next).length>3){$('live').textContent='この手は3マスまで。やり直すか、変更したマスを元に戻してね。';return;}
    draft=next;$('live').textContent='';draw(draft);
  };$('palette').append(button);
}
$('new').onclick=newGarden;
$('restart').onclick=()=>{if(confirm('今の庭はリンクから戻れます。別の庭をはじめる？'))newGarden();};
$('undo').onclick=()=>{draft=base.slice();selected=-1;draw(draft);$('selected').textContent='マスをタップしてから、置くものを選んでね。';};
$('memo').oninput=()=>{if(editable())save(memoKey(),$('memo').value);};
$('commit').onclick=()=>{
  if(!editable())return;
  const changes=Garden.diff(base,draft);
  if(changes.length===0&&!confirm('何も変えずにパスする？'))return;
  save(memoKey(),$('memo').value);
  location.hash=Garden.encode({id:state.id,moves:[...state.moves,changes]});
};
$('copy').onclick=async()=>{
  if(editable()&&Garden.diff(base,draft).length){$('copy-status').textContent='まず「この手を終える」を押してね。まだリンクに反映されていません。';return;}
  try{await navigator.clipboard.writeText(location.href);$('copy-status').textContent='コピーしたよ。相手にリンクだけ送ってね。';}
  catch{$('share-url').focus();$('share-url').select();$('copy-status').textContent='この欄を選択しました。手動でコピーしてね。';}
};
$('switch').onclick=()=>{if(confirm('このブラウザを使う人を交代する？ メモも交代後の人の表示になります。')){role=1-role;save(roleKey(),String(role));render();}};
$('step').oninput=replay;$('previous').onclick=()=>{$('step').value=Math.max(0,replayStep-1);replay();};$('next').onclick=()=>{$('step').value=Math.min(12,replayStep+1);replay();};
$('sample').href=Garden.encode(GARDEN_SAMPLE);
window.addEventListener('hashchange',openHash);openHash();
