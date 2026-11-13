import { Blob } from './models.js';

/* Giá trị chuỗi dài hơn ngưỡng này được cắt thành nhiều document (giới hạn BSON 16MB/document). */
export const PART_SIZE = 8_000_000;
export const blobId = (store, key) => `${store}:${key}`;
const partId = (id, i) => `${id}#${i}`;

export async function putBlob(store, key, value) {
  const _id = blobId(store, key);
  const isStr = typeof value === 'string';
  const size = isStr ? value.length : JSON.stringify(value).length;
  let keep = [];
  if (isStr && value.length > PART_SIZE) {
    const n = Math.ceil(value.length / PART_SIZE);
    for (let i = 0; i < n; i++) {
      const pid = partId(_id, i);
      keep.push(pid);
      await Blob.replaceOne({ _id: pid }, { _id: pid, store, part: true, parent: _id, value: value.slice(i * PART_SIZE, (i + 1) * PART_SIZE) }, { upsert: true });
    }
    await Blob.replaceOne({ _id }, { _id, store, key, parts: n, size }, { upsert: true });
  } else {
    await Blob.replaceOne({ _id }, { _id, store, key, value, size }, { upsert: true });
  }
  /* ghi đè: xoá các phần cũ thừa */
  await Blob.deleteMany({ parent: _id, _id: { $nin: keep } });
  return size;
}

/* Trả { key, value } đã ghép đủ các phần, hoặc null */
export async function getBlob(store, key) {
  const _id = blobId(store, key);
  const b = await Blob.findById(_id).lean();
  if (!b) return null;
  if (!b.parts) return { key: b.key, value: b.value };
  const ids = Array.from({ length: b.parts }, (_, i) => partId(_id, i));
  const docs = await Blob.find({ _id: { $in: ids } }).lean();
  const m = new Map(docs.map((d) => [d._id, d.value]));
  let out = '';
  for (const id of ids) {
    if (typeof m.get(id) !== 'string') throw Object.assign(new Error('Blob thiếu phần ' + id), { status: 500 });
    out += m.get(id);
  }
  return { key: b.key, value: out };
}

export async function delBlob(store, key) {
  const _id = blobId(store, key);
  await Blob.deleteMany({ $or: [{ _id }, { parent: _id }] });
}
