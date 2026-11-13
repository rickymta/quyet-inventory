/* Hành động A.sc* của phân hệ quét (port từ A={...} dòng 7103–7259 + vá đè 7622–7630). */
import { A, X, S, db, per, norm, qtyCheck, store, toast, klog, st, rerender } from '../../core';
import { scMsg, scHint, scSetRes, scMount_, scUnmountAll } from './dom.js';
import { scEnsureZx, scDecode, scLoadImage } from './decode.js';
import { OCR, ocrWorker, ocrDigits } from './ocr.js';
import { scMount, scUnmount, scStopCam, scOnCode, scGuideCrop, scOcrProcess, scShowMatched, scCommit, ocrQtyCands } from './run.jsx';

export const actions = {
  scanOpen:function(){
    var p=per(S.P&&S.P.id);if(!p)return;
    if(S.SC)A.scClose();
    S.SC={pid:p.id,hold:false,busy:false,auto:true};
    try{var AC=window.AudioContext||window.webkitAudioContext;if(AC){S.SC.actx=new AC();if(S.SC.actx.resume)S.SC.actx.resume();}}catch(e){klog("var AC=window.AudioContext||window.webkitAudioCo",e)}
    scMount();
  },
  scClose:function(){
    /* gộp vá đè 7622–7630: sau khi đóng màn quét của kỳ tài sản thì nhắc số tài sản chưa xuất Excel */
    var k=S.SC&&S.SC.kind,pid=S.SC&&S.SC.pid;
    if(S.SC){
      scStopCam(S.SC);
      try{if(S.SC.actx&&S.SC.actx.close)S.SC.actx.close();}catch(e){klog("if(SC.actx&&SC.actx.close)SC.actx.close();",e)}
    }
    var wasBind=S.SC&&S.SC.bind;
    S.SC=null;
    scUnmountAll();
    scUnmount();
    if(wasBind&&S.SB){try{X.renderBoxes();}catch(e){klog("renderBoxes();",e)}}
    if(k==='asset'){var p=X.asPer(pid),q=p&&X.asPending(p);if(q&&q.n)setTimeout(function(){toast('Còn '+q.n+' tài sản kiểm mới chưa xuất Excel');},400);}
  },
  scNext:function(){
    if(!S.SC)return;
    S.SC.hold=false;S.SC.pending=null;S.SC.lastAt=Date.now();S.SC.snap=null;
    scSetRes(null);
    scMsg(scHint());
  },
  scOpenItem:function(id){
    var pid=S.SC&&S.SC.pid;
    A.scClose();
    if(pid)X.openSheet(id,false);
  },
  scManual:function(){
    var e=document.getElementById('scman');var v=e?e.value.trim():'';
    if(!v)return;
    scOnCode(v,true);
  },
  scAuto:function(){
    if(!S.SC)return;
    S.SC.auto=S.SC.auto===false;
    rerender(); /* nút #scautobtn do ScanOverlay vẽ từ S.SC.auto */
    if(S.SC.auto&&!OCR.worker){scMsg('Đang tải bộ đọc số…');ocrWorker().then(function(){if(S.SC&&!S.SC.hold)scMsg(scHint());}).catch(function(){scMsg('Không tải được bộ đọc số (cần mạng).');});}
    else if(!S.SC.hold)scMsg(scHint());
  },
  scOcr:function(){
    if(!S.SC||S.SC.ocrBusy)return;
    var v=document.getElementById('scvid');
    if(!v||v.readyState<2||!v.videoWidth){scMsg('Chưa có hình từ camera. Hãy dùng nút Chụp ảnh bên dưới.');return;}
    var cr=scGuideCrop(v),vw=v.videoWidth,vh=v.videoHeight;
    var snap=document.createElement('canvas');snap.width=vw;snap.height=vh;
    try{snap.getContext('2d').drawImage(v,0,0);}catch(e){scMsg('Không chụp được khung hình.');return;}
    scOcrProcess(snap,cr);
  },
  scOcrUse:function(dg){
    var e=document.getElementById('scman');if(e)e.value=dg;
    A.scManual();
  },
  scOcrPick:function(id,line){
    if(!S.SC)return;
    var p=per(S.SC.pid),it=null;
    p.items.forEach(function(x){if(x.id===id)it=x;});
    if(!it)return;
    if(line&&ocrDigits(it.code)!==line){
      if(!db.ocrfix)db.ocrfix={};
      db.ocrfix[line]=it.code;store.save();
      toast('Đã ghi nhớ: '+line+' → '+it.code);
    }
    scShowMatched({item:it,how:'ocr',qty:ocrQtyCands(S.SC.lastLines,line)});
  },
  scQtySave:function(id){
    if(!S.SC)return;
    var p=per(S.SC.pid),it=null;
    p.items.forEach(function(x){if(x.id===id)it=x;});
    if(!it)return;
    var e=document.getElementById('scqty'),v=e?e.value.trim():'';
    var qc=qtyCheck(v);
    if(!qc.ok){toast(qc.err);if(e){e.style.borderColor='var(--red)';e.focus();}return;}
    var qn=qc.n;
    if(Math.round((qn-it.close)*100)/100!==0){
      A.scClose();X.openSheet(id,false);
      if(S.SB){S.SB.qtyStr=String(qn);A.calc();}
      toast('Có chênh lệch — nhập giải trình để lưu');
      return;
    }
    scCommit(it,qn);
  },
  scPickKho:function(id){
    if(!S.SC)return;var p=per(S.SC.pid),it=null;
    p.items.forEach(function(x){if(x.id===id)it=x;});
    if(it)scShowMatched({item:it,how:'code'});
  },
  scQtyMatch:function(id){
    if(!S.SC)return;
    var p=per(S.SC.pid),it=null;
    p.items.forEach(function(x){if(x.id===id)it=x;});
    if(it)scCommit(it,it.close);
  },
  scQtySet:function(n){var e=document.getElementById('scqty');if(e)e.value=String(n);},
  scTorch:function(){
    if(!S.SC||!S.SC.track)return;
    S.SC.torch=!S.SC.torch;
    try{S.SC.track.applyConstraints({advanced:[{torch:S.SC.torch}]}).catch(function(){});}catch(e){klog("SC.track.applyConstraints({advanced:[{torch:SC.t",e)}
    var b=document.getElementById('sctorch');if(b)b.style.opacity=S.SC.torch?'1':'.55';
  },
  scZoom:function(v){
    if(!S.SC||!S.SC.track)return;
    try{S.SC.track.applyConstraints({advanced:[{zoom:parseFloat(v)}]}).catch(function(){});}catch(e){klog("SC.track.applyConstraints({advanced:[{zoom:parse",e)}
  },
  scPickQ:function(q){
    var box=document.getElementById('scpicklist');if(!box||!S.SC)return;
    var p=per(S.SC.pid),n=norm(q||''),c=0,rows=[];
    if(!n){scMount_('scpicklist',null);return;}
    p.items.forEach(function(i){
      if(c>=6||norm(i.name+' '+i.code).indexOf(n)<0)return;
      c++;
      rows.push(<button key={i.id} onClick={() => A.scLink(i.id)} style={st('display:block;width:100%;text-align:left;margin-top:6px;padding:10px 12px;border-radius:10px;border:1px solid #33333d;background:#1b1b24;color:#e5e7eb;font:inherit;font-size:13px')}><b>{i.name}</b><br /><span style={st('color:#9ca3af;font-size:12px')}>{i.code} · {i.unit}</span></button>);
    });
    scMount_('scpicklist',rows.length?<>{rows}</>:<div style={st('font-size:12px;color:#9ca3af;margin-top:6px')}>Không có vật tư phù hợp.</div>);
  },
  scLink:function(id){
    if(!S.SC||!S.SC.pending)return;
    var p=per(S.SC.pid),it=null;
    p.items.forEach(function(x){if(x.id===id)it=x;});
    if(!it)return;
    db.barcodes[S.SC.pending.canon]=it.code;store.save();
    var gs1=S.SC.pending.gs1;S.SC.pending=null;
    scShowMatched({item:it,how:'learned',gs1:gs1});
    toast('Đã liên kết mã vạch với '+it.name);
  },
  scCopyLink:function(){
    var url=location.href.split('#')[0];
    var done=function(){toast('Đã sao chép link. Dán vào Safari để mở.');};
    if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(url).then(done).catch(function(){prompt('Sao chép link này:',url);});}
    else prompt('Sao chép link này:',url);
  },
  scPhoto:function(input){
    var f=input.files&&input.files[0];input.value='';
    if(!f||!S.SC)return;
    scMsg('Đang đọc ảnh…');
    var info=(f.type||'không rõ định dạng')+', '+Math.round(f.size/1024)+' KB';
    scLoadImage(f).then(function(im){
      if(!S.SC)return;
      try{var kk=Math.min(1,1600/Math.max(im.w,im.h)),sn=document.createElement('canvas');sn.width=Math.round(im.w*kk);sn.height=Math.round(im.h*kk);sn.getContext('2d').drawImage(im.el,0,0,sn.width,sn.height);S.SC.snap={d:sn.toDataURL('image/jpeg',0.88),w:sn.width,h:sn.height};}catch(e){klog("var kk=Math.min(1,1600/Math.max(im.w,im.h)),sn=d",e)}
      var go=function(){
        var tryScale=function(maxSide){
          var k=Math.min(1,maxSide/Math.max(im.w,im.h));
          var c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.w*k));c.height=Math.max(1,Math.round(im.h*k));
          c.getContext('2d').drawImage(im.el,0,0,c.width,c.height);
          return scDecode(c);
        };
        tryScale(1600).then(function(t){return t||tryScale(900);}).then(function(t){return t||tryScale(2400);}).then(function(txt){
          if(!S.SC)return;
          if(txt){scMsg('Đã đọc ảnh');scOnCode(txt,true);}
          else scOcrProcess(im.el,{x:0,y:0,w:im.w,h:im.h});
        });
      };
      if(!S.SC.det&&!window.ZXing)scEnsureZx().then(go);else go();
    }).catch(function(){scMsg('Không mở được ảnh ('+info+'). Thử chụp lại hoặc nhập số.');});
  },
};
