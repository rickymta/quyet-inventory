/* IndexedDB nhỏ gọn cho hàng đợi ghi (CSDL 'kk_sync', store 'kv'). Mọi hàm không bao giờ ném lỗi:
   IndexedDB không dùng được (chế độ riêng tư, bị chặn...) thì trả undefined/false và app chạy tiếp. */
const DB = 'kk_sync';
const ST = 'kv';
let dbp = null;

function open() {
  if (dbp) return dbp;
  dbp = new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined' || !indexedDB) return resolve(null);
      const q = indexedDB.open(DB, 1);
      q.onupgradeneeded = () => { try { q.result.createObjectStore(ST); } catch (_) { /* đã có */ } };
      q.onsuccess = () => resolve(q.result);
      q.onerror = () => resolve(null);
      q.onblocked = () => resolve(null);
      setTimeout(() => resolve(null), 3000);
    } catch (_) { resolve(null); }
  });
  return dbp;
}
async function run(mode, fn) {
  const d = await open();
  if (!d) return undefined;
  return new Promise((resolve) => {
    try {
      const tx = d.transaction(ST, mode);
      const rq = fn(tx.objectStore(ST));
      tx.oncomplete = () => resolve(rq && 'result' in rq ? rq.result : true);
      tx.onerror = () => resolve(undefined);
      tx.onabort = () => resolve(undefined);
    } catch (_) { resolve(undefined); }
  });
}
export const idbGet = (key) => run('readonly', (s) => s.get(key));
export const idbPut = async (key, val) => (await run('readwrite', (s) => { s.put(val, key); return null; })) === true;
export const idbDel = async (key) => (await run('readwrite', (s) => { s.delete(key); return null; })) === true;
/* [[key, value], ...] cho các khoá bắt đầu bằng prefix */
export async function idbAll(prefix) {
  const d = await open();
  if (!d) return [];
  return new Promise((resolve) => {
    const out = [];
    try {
      const tx = d.transaction(ST, 'readonly');
      const q = tx.objectStore(ST).openCursor();
      q.onsuccess = () => { const c = q.result; if (!c) return; if (String(c.key).startsWith(prefix)) out.push([String(c.key), c.value]); c.continue(); };
      tx.oncomplete = () => resolve(out);
      tx.onerror = () => resolve(out);
      tx.onabort = () => resolve(out);
    } catch (_) { resolve(out); }
  });
}
