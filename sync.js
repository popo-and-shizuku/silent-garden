/* MIT · ぽぽとしずく */
(function(root){
  'use strict';
  const G=typeof module!=='undefined'?require('./core.js'):root.Garden;
  const validID=id=>typeof id==='string'&&/^[a-f0-9]{16}$/.test(id);
  function reduce(events){
    const peers=[], moves=[], seen=new Set();
    for(const event of events){
      if(!event||event.event!=='message'||typeof event.id!=='string'||seen.has(event.id)||typeof event.message!=='string'||event.message.length>4096)continue;
      seen.add(event.id);
      let data;try{data=JSON.parse(event.message);}catch{continue;}
      if(!data||data.v!==2||!validID(data.peer))continue;
      if(data.kind==='join'){
        if(peers.length<2&&!peers.includes(data.peer))peers.push(data.peer);
      }else if(data.kind==='turn'&&peers.length===2&&moves.length<12&&data.peer===peers[moves.length%2]&&data.game===peers[0]){
        try{G.validate([peers[0],data.moves]);}catch{continue;}
        if(data.moves.length!==moves.length+1||JSON.stringify(data.moves.slice(0,-1))!==JSON.stringify(moves))continue;
        moves.push(data.moves.at(-1));
      }
    }
    return {id:peers[0]||'0000000000000000',peers,moves};
  }
  function randomID(){return Array.from(crypto.getRandomValues(new Uint8Array(8)),v=>v.toString(16).padStart(2,'0')).join('');}
  async function topicFor(phrase){
    const normalized=phrase.normalize('NFKC').trim();
    if(normalized.length<4||normalized.length>80)throw Error('合言葉は4〜80文字で決めてね。');
    const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('silent-garden-v2:'+normalized));
    return 'silent-garden-v2-'+Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('').slice(0,32);
  }
  class Room{
    constructor(topic,onUpdate,onConnection){
      if(!/^silent-garden-v2-[a-f0-9]{32}$/.test(topic))throw Error('合言葉をもう一度入れてね。');
      this.url='https://ntfy.sh/'+topic;this.onUpdate=onUpdate;this.onConnection=onConnection;this.closed=false;this.refreshing=null;this.again=false;
    }
    async read(){
      const response=await fetch(this.url+'/json?poll=1&since=all',{cache:'no-store',signal:AbortSignal.timeout(15000)});
      if(!response.ok)throw Error(response.status===429?'少し混み合っています。時間を置いてつなぎ直してね。':'庭につながりません。つなぎ直してね。');
      if(response.headers.get('X-Messages-Truncated')==='1')throw Error('この庭の記録が多すぎます。別の合言葉で始めてね。');
      const text=await response.text();if(text.length>1000000)throw Error('この庭の記録が多すぎます。');
      const events=text.split('\n').filter(Boolean).map(line=>{try{return JSON.parse(line);}catch{return null;}});
      this.known=new Set(events.filter(Boolean).map(e=>e.id));
      return reduce(events);
    }
    async refresh(){
      if(this.closed)return;
      if(this.refreshing){this.again=true;return this.refreshing;}
      this.refreshing=(async()=>{
        do{this.again=false;const state=await this.read();if(this.closed)return;this.onUpdate(state);this.onConnection(true);this.delay=10000;}while(this.again&&!this.closed);
      })();
      try{await this.refreshing;}catch(e){this.delay=30000;if(!this.closed)this.onConnection(false,e.message);throw e;}finally{this.refreshing=null;clearTimeout(this.fallback);if(!this.closed)this.fallback=setTimeout(()=>this.refresh().catch(()=>{}),this.delay||10000);}
    }
    async publish(data){
      const response=await fetch(this.url,{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify(data),signal:AbortSignal.timeout(15000)});
      if(!response.ok)throw Error(response.status===429?'送信が混み合っています。少し待ってね。':'送れませんでした。つなぎ直して盤面を確認してね。');
      await this.refresh();
    }
    listen(){
      if(this.closed)return;
      clearTimeout(this.reconnect);this.stream?.close();
      const stream=new WebSocket(this.url.replace('https:','wss:')+'/ws');this.stream=stream;
      stream.onopen=()=>{if(this.stream===stream){this.backoff=1000;this.refresh().catch(()=>{});}};
      stream.onmessage=event=>{
        if(this.stream!==stream)return;
        let data;try{data=JSON.parse(event.data);}catch{return;}
        if(data.event!=='message'||this.known?.has(data.id))return;
        clearTimeout(this.debounce);this.debounce=setTimeout(()=>{if(!this.known?.has(data.id))this.refresh().catch(()=>{});},120);
      };
      stream.onerror=()=>{if(!this.closed&&this.stream===stream)this.onConnection(false,'接続を確かめています…');};
      stream.onclose=()=>{
        if(this.closed||this.stream!==stream)return;
        this.onConnection(false,'接続が切れました。つなぎ直しています…');
        this.backoff=Math.min((this.backoff||1000)*2,30000);this.reconnect=setTimeout(()=>this.listen(),this.backoff);
      };
    }
    close(){this.closed=true;clearTimeout(this.fallback);clearTimeout(this.debounce);clearTimeout(this.reconnect);this.stream?.close();}

  }
  const api={reduce,randomID,topicFor,Room};if(typeof module!=='undefined')module.exports=api;root.GardenSync=api;
})(typeof window==='undefined'?globalThis:window);
