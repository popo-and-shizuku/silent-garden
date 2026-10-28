/* MIT · ぽぽとしずく */
(function (root) {
  'use strict';
  const SIZE = 144, LIMIT = 12;
  function board(moves, until = moves.length) {
    const cells = Array(SIZE).fill(0);
    for (const turn of moves.slice(0, until)) for (const [i, value] of turn) cells[i] = value;
    return cells;
  }
  function validate(value) {
    if (!Array.isArray(value) || value.length !== 2 || !/^[a-f0-9]{16}$/.test(value[0]) || !Array.isArray(value[1]) || value[1].length > LIMIT) throw Error('庭のリンクを読み取れません。送ってもらったリンク全体を開いてね。');
    const cells = Array(SIZE).fill(0);
    for (const turn of value[1]) {
      if (!Array.isArray(turn) || turn.length > 3) throw Error('1手は3マスまでです。');
      const seen = new Set();
      for (const change of turn) {
        if (!Array.isArray(change) || change.length !== 2) throw Error('手順の形式が違います。');
        const [i, v] = change;
        if (!Number.isInteger(i) || i < 0 || i >= SIZE || !Number.isInteger(v) || v < 0 || v > 5 || seen.has(i) || cells[i] === v) throw Error('手順に使えないマスがあります。');
        seen.add(i); cells[i] = v;
      }
    }
    return {id: value[0], moves: value[1]};
  }
  function encode(state) {
    validate([state.id, state.moves]);
    return '#g1.' + btoa(JSON.stringify([state.id, state.moves])).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function decode(hash) {
    if (hash.length > 4096 || !/^#g1\.[A-Za-z0-9_-]+$/.test(hash)) throw Error('庭のリンクが違うみたい。もう一度コピーしてもらってね。');
    try {return validate(JSON.parse(atob(hash.slice(4).replace(/-/g, '+').replace(/_/g, '/'))));}
    catch (error) {throw Error('庭のリンクを読み取れません。途中で切れていないか確認してね。');}
  }
  function diff(before, after) {return after.flatMap((v, i) => before[i] === v ? [] : [[i, v]]);}
  const api = {SIZE, LIMIT, board, validate, encode, decode, diff};
  if (typeof module !== 'undefined') module.exports = api;
  root.Garden = api;
})(typeof window === 'undefined' ? globalThis : window);
