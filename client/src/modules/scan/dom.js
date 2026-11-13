/* Phần dùng chung của màn quét: dòng thông báo, trạng thái OCR, âm báo, vùng kết quả #scres (port 4263–4281, 4393–4401). */
import { createRoot } from 'react-dom/client';
import { S, klog, rerender } from '../../core';

export function scMsg(m){var e=document.getElementById('scmsg');if(e)e.textContent=m;}
export function scOcrStatus(t,col){var e=document.getElementById('scst');if(!e)return;e.textContent=t;e.style.color=col||'#9ca3af';}
export function scHint(){
  return (S.SC&&S.SC.auto===false)?'Hướng vào mã QR / mã vạch, hoặc bấm “Đọc ngay” để đọc số':'Hướng camera vào mã QR, mã vạch hoặc dãy số — app tự nhận';
}
export var SC_CHIP='padding:8px 12px;border-radius:999px;border:1px solid #2c4f8f;background:#14203a;color:#e5e7eb;font:inherit;font-size:13px;font-weight:700';
export function scBeep(){
  try{
    var a=S.SC&&S.SC.actx;if(!a)return;
    var o=a.createOscillator(),g=a.createGain();
    o.frequency.value=1500;g.gain.value=0.15;o.connect(g);g.connect(a.destination);
    o.start();o.stop(a.currentTime+0.08);
  }catch(e){klog("var a=SC&&SC.actx;if(!a)return; var o=a.createOs",e)}
}

/* Vùng kết quả #scres: app gốc gán innerHTML. Ở đây #scres do React (ScanOverlay) quản lý nên KHÔNG gán innerHTML lên nó:
   nội dung đổ tay (chuỗi → innerHTML; JSX → một cây React riêng) đi vào phần tử con #scres_imp. Gọi scSetRes(null) để xoá. */
var roots={};
function scTarget(id){return id==='scres'?'scres_imp':id;}
function scDrop(id){
  if(roots[id]){var r=roots[id];roots[id]=null;try{r.unmount();}catch(e){klog('scSetRes unmount',e);}}
}
export function scMount_(id,node){
  id=scTarget(id);
  if(id==='scres_imp')scDrop('scpicklist'); /* danh sách chọn vật tư nằm trong thẻ cũ, gỡ root của nó trước khi thay nội dung */
  scDrop(id);
  var el=document.getElementById(id);
  if(!el)return;
  el.innerHTML='';
  if(node==null||node==='')return;
  if(typeof node==='string'){el.innerHTML=node;return;}
  var host=document.createElement('div');el.appendChild(host);
  roots[id]=createRoot(host);roots[id].render(node);
}
/* gỡ nội dung #scres_imp (gọi từ useLayoutEffect của ScanOverlay: chỉ xoá DOM, unmount root hoãn sang microtask) */
export function scClearImp(){
  var el=document.getElementById('scres_imp');
  var rs=[roots.scres_imp,roots.scpicklist];roots.scres_imp=null;roots.scpicklist=null;
  if(el&&el.firstChild)el.innerHTML='';
  Promise.resolve().then(function(){rs.forEach(function(r){if(r){try{r.unmount();}catch(e){klog('scClearImp',e);}}});});
}
/* gỡ mọi root React phụ (khi đóng màn quét) */
export function scUnmountAll(){
  Object.keys(roots).forEach(scDrop);
  ['scres_imp','scwarn','sclog'].forEach(function(i){var e=document.getElementById(i);if(e)e.innerHTML='';});
}
/* scSetRes xoá S.SC.res (cơ chế "hàm trả JSX" của assets) để hai cách không chồng nhau */
var resGen=0;
export function scSetRes(node){
  var gen=++resGen;
  if(S.SC&&typeof S.SC.res==='function'){
    S.SC.res=null;rerender();
    setTimeout(function(){if(gen!==resGen)return;scMount_('scres',node);},0); /* chờ React gỡ phần tử của S.SC.res rồi mới đổ nội dung */
    return;
  }
  scMount_('scres',node);
}
