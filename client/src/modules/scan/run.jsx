/* Màn quét QR / mã vạch / đọc số: lớp phủ toàn màn hình, vòng lặp camera, hiển thị kết quả (port 3781–3951, 4255–4499). */
import { useLayoutEffect } from 'react';
import { A, X, S, db, per, fmt, I, H, st, klog, toast, openLayer, closeLayer, parseNum, rerender } from '../../core';
import { scMsg, scOcrStatus, scHint, scBeep, SC_CHIP, scSetRes, scMount_, scClearImp } from './dom.js';
import { parseGS1, scCanon, scMatch, scInitDecoder, scEnsureZx, scDecode, scInApp, scRoi, SCFMT } from './decode.js';
import { OCR, OCR_CONF, ocrWorker, ocrFrame, ocrRank, ocrDigits, ocrLooksDate, ocrLev } from './ocr.js';

/* nút/đoạn JSX có thể nhận chuỗi HTML (nếu hàm của phân hệ khác còn trả chuỗi) */
const node = (x) => (typeof x === 'string' ? H(x) : x);

export var RISK = { key: '', set: null };

/* dừng camera + interval + watch của một phiên quét (an toàn khi gọi nhiều lần) */
export function scStopCam(sc){
  if(!sc)return;
  if(sc.timer){clearInterval(sc.timer);sc.timer=null;}
  if(sc.watch){clearTimeout(sc.watch);sc.watch=null;}
  if(sc.stream){try{sc.stream.getTracks().forEach(function(t){t.stop();});}catch(e){klog('scStopCam',e);}sc.stream=null;}
  sc.track=null;
  sc.started=false;sc.startId=(sc.startId||0)+1; /* huỷ getUserMedia đang chờ */
}
export function scPause(){
  if(!S.SC||(!S.SC.stream&&!S.SC.started))return;
  scStopCam(S.SC);S.SC.paused=true;
  scMsg('Camera đã tạm dừng khi rời app. Dữ liệu đã lưu.');
}
export function scResume(){if(S.SC&&S.SC.paused){S.SC.paused=false;scStart();}}
document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')scPause();else scResume();});

const BTN = 'padding:11px;background:#23232c;color:#e5e7eb;border:1px solid #33333d';

/* ---- khung lớp phủ (scMount) ---- */
export function ScanOverlay(){
  const asset = S.SC && S.SC.kind === 'asset';
  /* khi assets dùng S.SC.res (hàm trả JSX), gỡ thẻ kết quả đổ tay còn sót ở #scres_imp để hai thẻ không chồng nhau */
  useLayoutEffect(() => { if (S.SC && typeof S.SC.res === 'function') scClearImp(); });
  const bindIt = S.SC && S.SC.bind ? ((per(S.SC.pid) || { items: [] }).items.filter((x) => x.id === S.SC.bind)[0] || null) : null;
  return (
    <div id="scanovl" style={st('position:fixed;inset:0;z-index:120;background:#0b0b12;display:flex;flex-direction:column;color:#e5e7eb')}>
      <div style={st('display:flex;align-items:center;justify-content:space-between;padding:calc(env(safe-area-inset-top,0px) + 10px) 16px 10px')}>
        <div style={st('font-weight:800;font-size:16px')}>{asset ? 'Quét mã CCDC / TSCĐ' : 'Quét mã vật tư'} <span style={st('font-size:10px;font-weight:700;color:#a9bde0;border:1px solid #2c4f8f;border-radius:999px;padding:2px 7px;margin-left:6px;vertical-align:middle')}>+ đọc số</span></div>
        <button onClick={() => A.scClose()} style={st('background:#23232c;color:#e5e7eb;border:1px solid #33333d;border-radius:999px;width:36px;height:36px;font-size:16px')}>✕</button>
      </div>
      <div style={st('position:relative;flex:1;min-height:120px;overflow:hidden;background:#000')}>
        <video id="scvid" playsInline muted autoPlay style={st('width:100%;height:100%;object-fit:cover')}></video>
        <div id="sctools" style={st('position:absolute;right:10px;top:10px;display:flex;flex-direction:column;gap:8px;align-items:flex-end')}></div>
        <div id="scst" onClick={() => scOcrRetry()} style={st('position:absolute;left:10px;top:10px;max-width:62%;font-size:11px;padding:4px 9px;border-radius:999px;background:rgba(18,18,26,.78);border:1px solid #33333d;color:#9ca3af;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>Số: đang chuẩn bị…</div>
        <div id="scunm" onClick={() => X.scChipClick()} style={st('display:none;position:absolute;left:10px;top:44px;font-size:12px;font-weight:700;padding:5px 10px;border-radius:999px;background:rgba(42,31,18,.9);border:1px solid #8a5a1a;color:#fbbf24')}></div>
        <div style={st('position:absolute;left:12%;right:12%;top:22%;bottom:22%;border:2px solid rgba(77,166,255,.85);border-radius:16px;box-shadow:0 0 0 999px rgba(0,0,0,.35);pointer-events:none')}></div>
        <div id="scmsg" style={st('position:absolute;left:12px;right:12px;bottom:10px;text-align:center;font-size:13px;color:#e5e7eb;text-shadow:0 1px 3px #000')}>Đang mở camera…</div>
      </div>
      <div style={st('padding:12px 16px calc(env(safe-area-inset-bottom,0px) + 14px);max-height:52%;overflow:auto;background:#12121a')}>
        {bindIt ? <div id="scbind" style={st('font-size:12px;padding:8px 10px;border-radius:10px;background:#1b1b24;border:1px solid #33333d;margin-bottom:8px')}>Quét từng hộp cho: <b>{bindIt.name}</b> ({bindIt.code})</div> : null}<div id="scwarn"></div><div id="scres"><div id="scres_imp"></div>{S.SC && typeof S.SC.res === 'function' ? <div key="res">{S.SC.res()}</div> : null}</div><div id="sclog"></div>
        <div style={st('display:flex;gap:8px;margin-top:8px')}>
          <input id="scman" className="inp" inputMode="text" placeholder="Hoặc nhập/dán dãy số, mã VT" style={st('flex:1;min-width:0;background:#1b1b24;color:#e5e7eb;border-color:#33333d')} onKeyDown={(e) => { if (e.key === 'Enter') A.scManual(); }} />
          <button className="btn btn-primary" style={st('width:auto;padding:0 18px')} onClick={() => A.scManual()}>Tìm</button>
        </div>
        <div style={st('display:flex;gap:8px;margin-top:8px')}>
          <button id="scautobtn" className="btn" style={st('flex:1;width:auto;padding:12px;background:#14203a;color:#a9bde0;border:1px solid #2c4f8f')} onClick={() => A.scAuto()}>{'Tự đọc số: ' + (S.SC && S.SC.auto === false ? 'TẮT' : 'BẬT')}</button>
          <button className="btn" style={st('flex:1;width:auto;padding:12px;background:#14203a;color:#a9bde0;border:1px solid #2c4f8f;display:flex;align-items:center;justify-content:center;gap:6px')} onClick={() => A.scOcr()}>{I('scan', 16)}Đọc ngay</button>
        </div>
        <label id="scphoto" style={st('display:flex;align-items:center;justify-content:center;gap:8px;margin-top:8px;padding:11px;border:1px dashed '+(S.SC&&S.SC.blurOn?'#d9822b':'#44444f')+';border-radius:12px;color:'+(S.SC&&S.SC.blurOn?'#fbbf24':'#9ca3af')+';font-size:13px;cursor:pointer')}>{I('scan', 16)}<span id="scphotot">{S.SC&&S.SC.blurOn?'Ảnh trực tiếp đang mờ — bấm đây để chụp bằng camera hệ thống (tự lấy nét)':'Chụp ảnh mã / dãy số (nếu camera trực tiếp không mở được)'}</span><input type="file" accept="image/*" capture="environment" style={{display:'none'}} onChange={(e) => A.scPhoto(e.target)} /></label>
      </div>
    </div>
  );
}
function ScWarn(){
  return (
    <div style={st('background:#2a1f12;border:1px solid #8a5a1a;border-radius:12px;padding:10px 12px;margin-bottom:8px;font-size:12px;line-height:1.45')}>
      Có vẻ bạn đang mở app trong một ứng dụng khác (không phải Safari), nơi camera trực tiếp thường bị chặn. Hãy bấm <b>Chụp ảnh mã</b> bên dưới, hoặc mở link app bằng <b>Safari</b>.
      <button onClick={() => A.scCopyLink()} style={st('display:block;margin-top:8px;padding:8px 12px;border-radius:10px;border:1px solid #8a5a1a;background:transparent;color:#fbbf24;font:inherit;font-size:12px')}>Sao chép link để dán vào Safari</button>
    </div>
  );
}
/* mở lớp phủ; scStart tự hoãn tới khi khung đã có trên màn hình và chỉ chạy một lần (idempotent) */
export function scMount(){
  openLayer('scan', () => <ScanOverlay />);
  scStart();
}
export function scUnmount(){ closeLayer('scan'); }
export function v_ready(){var v=document.getElementById('scvid');return !!(v&&v.videoWidth>0);}

export function scStart(){
  if(!S.SC||S.SC.started)return;
  if(!document.getElementById('scvid')){requestAnimationFrame(scStart);return;}
  var SCx=S.SC;SCx.started=true;
  var sid=SCx.startId=(SCx.startId||0)+1;
  if(OCR.worker)scOcrStatus('Số: sẵn sàng ✓','#4ade80');else scOcrStatus('Số: đang tải…');
  X.scUnmChip();
  ocrWorker().then(function(){if(S.SC&&!S.SC.hold&&!S.SC.ocrBusy&&v_ready())scMsg(scHint());}).catch(scOcrFail);
  setTimeout(function(){if(S.SC&&!OCR.worker&&!OCR.err)scOcrStatus('Số: tải chậm · chạm để thử lại','#fbbf24');},40000);
  scInitDecoder().then(function(ok){
    if(!S.SC)return;
    if(!S.SC.det&&!ok&&!S.SC.camErr)scMsg('Không tải được bộ đọc mã (cần mạng). Có thể nhập dãy số bên dưới.');
  });
  if(scInApp()){
    scMount_('scwarn',<ScWarn/>);
  }
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){
    scMsg('Trình duyệt này không mở được camera trực tiếp. Dùng nút Chụp ảnh mã hoặc nhập số.');return;
  }
  navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1920},height:{ideal:1080}},audio:false}).then(function(stream){
    if(S.SC!==SCx||SCx.startId!==sid||!SCx.started){stream.getTracks().forEach(function(t){t.stop();});return;}
    if(SCx.timer){clearInterval(SCx.timer);SCx.timer=null;}
    if(SCx.watch){clearTimeout(SCx.watch);SCx.watch=null;}
    if(SCx.stream){try{SCx.stream.getTracks().forEach(function(t){t.stop();});}catch(e){klog('scStart old stream',e);}}
    S.SC.stream=stream;scTools(stream);
    try{if(S.SC.track)S.SC.track.applyConstraints({advanced:[{focusMode:'continuous'}]}).catch(function(){});}catch(e){klog("if(S.SC.track)S.SC.track.applyConstraints({advanced:",e)}
    var v=document.getElementById('scvid');
    v.muted=true;v.defaultMuted=true;v.playsInline=true;
    v.setAttribute('muted','');v.setAttribute('playsinline','');v.setAttribute('webkit-playsinline','');
    v.srcObject=stream;
    var play=function(){var pr=v.play();if(pr&&pr.catch)pr.catch(function(){});};
    v.onloadedmetadata=play;play();
    scMsg('Đang mở camera…');
    S.SC.timer=setInterval(scTick,90);
    S.SC.watch=setTimeout(function(){
      if(!S.SC)return;
      if(v.videoWidth>0){scMsg(scHint());}
      else scMsg('Camera đã được cấp quyền nhưng không có hình. Dùng nút Chụp ảnh mã hoặc mở bằng Safari.');
    },2500);
  }).catch(function(e){
    var n=(e&&e.name)||'lỗi';
    if(S.SC!==SCx||SCx.startId!==sid)return;
    SCx.started=false; /* cho phép thử lại (scResume) sau khi lỗi */
    SCx.camErr=true;
    scMsg('Không mở được camera ('+n+'). '+(n==='NotAllowedError'?'Hãy cho phép camera cho trình duyệt. ':'')+'Dùng nút Chụp ảnh mã hoặc nhập số.');
  });
}

export function scTick(){
  var v=document.getElementById('scvid');
  if(!S.SC||S.SC.busy||S.SC.hold||!v||v.readyState<2||!v.videoWidth)return;
  S.SC.busy=true;
  S.SC.n=(S.SC.n||0)+1;
  var roi=scRoi(v,S.SC.n%3===0),k=Math.min(1,1100/Math.max(roi.w,roi.h));
  var c=S.SC.canvas||(S.SC.canvas=document.createElement('canvas'));
  c.width=Math.round(roi.w*k);c.height=Math.round(roi.h*k);
  try{c.getContext('2d',{willReadFrequently:true}).drawImage(v,roi.x,roi.y,roi.w,roi.h,0,0,c.width,c.height);}catch(e){S.SC.busy=false;return;}
  scDecode(c).then(function(txt){
    if(!S.SC)return;
    S.SC.busy=false;
    if(txt){
      if(/^(code_39|code_93|itf|codabar)$/.test(SCFMT)){var now=Date.now();if(S.SC.cand===txt&&now-S.SC.candAt<1500){S.SC.cand=null;scOnCode(txt);}else{S.SC.cand=txt;S.SC.candAt=now;}return;}
      scOnCode(txt);return;
    }
    if(S.SC.auto!==false&&OCR.worker&&!S.SC.hold&&!S.SC.autoBusy&&!S.SC.ocrBusy&&Date.now()-(S.SC.ocrAt||0)>50)scAutoOcr(v);
  }).catch(function(){if(S.SC)S.SC.busy=false;});
}

export function scGuideCrop(v){
  var box=v.parentNode,cw=box.clientWidth,ch=box.clientHeight,vw=v.videoWidth,vh=v.videoHeight;
  var s=Math.max(cw/vw,ch/vh),ox=(cw-vw*s)/2,oy=(ch-vh*s)/2;
  var x=Math.max(0,(cw*0.12-ox)/s),y=Math.max(0,(ch*0.22-oy)/s);
  return {x:x,y:y,w:Math.min(vw-x,cw*0.76/s),h:Math.min(vh-y,ch*0.56/s)};
}
/* Tự động đọc số trong khung khi camera đang chạy: khớp hoàn toàn mã vật tư là nhảy luôn */
export function scSig(v,cr){
  var c=S.SC.sigc||(S.SC.sigc=document.createElement('canvas'));c.width=c.height=16;
  var g=c.getContext('2d',{willReadFrequently:true});
  g.drawImage(v,cr.x,cr.y,cr.w,cr.h,0,0,16,16);
  var d=g.getImageData(0,0,16,16).data,a=new Uint8Array(256),i;
  for(i=0;i<256;i++)a[i]=(d[i*4]+d[i*4+1]+d[i*4+2])/3;
  return a;
}
export function scOcrFail(e){
  OCR.err=(e&&e.message)||String(e||'lỗi');
  scOcrStatus('Số: lỗi tải · chạm để thử lại','#f87171');
  if(S.SC&&!S.SC.camErr)scMsg('Không tải được bộ đọc số ('+OCR.err+'). Kiểm tra mạng rồi chạm ô “Số” góc trái camera để thử lại. QR / mã vạch vẫn quét được.');
}
export function scOcrRetry(){
  if(OCR.worker){scOcrStatus('Số: sẵn sàng ✓','#4ade80');return;}
  OCR.loading=null;OCR.err='';scOcrStatus('Số: đang tải…');
  ocrWorker().then(function(){if(S.SC&&!S.SC.hold)scMsg(scHint());}).catch(scOcrFail);
}
/* Đánh giá kết quả đọc: chỉ khớp HOÀN TOÀN mới tự nhảy. Lệch dù 1 chữ số cũng không tự khớp (tránh nhầm sang tài sản khác), chỉ ghi nhận để đối chiếu */

export function scJudge(p,lines){
  var r=ocrRank(p,lines);if(!r.length)return null;
  var a=r[0],b=r[1];
  if(a.dist===0&&(!b||b.dist>0))return {it:a.item,line:a.line,dist:0,need:(scRisky(p,a.item)||a.conf<OCR_CONF||ocrDigits(a.item.code).length<7)?2:1};
  return null;
}
/* Phát hiện ảnh trực tiếp bị MỜ thật sự (máy quá gần, chưa lấy nét): so với độ nét tuyệt đối chứ không chỉ so với khung nét nhất đã thấy
   (nếu cả phiên đều mờ thì phép so tương đối không bao giờ báo). Chỉ dùng để GỢI Ý, không chặn việc đọc. */
export function scIsBlurry(c){
  var w=c.width,h=c.height,d=c.getContext('2d',{willReadFrequently:true}).getImageData(0,0,w,h).data,L=new Float32Array(w*h),i,x,y,m=0,m2=0,s=0,s2=0,n=0,v;
  for(i=0;i<w*h;i++){L[i]=d[i*4]*.3+d[i*4+1]*.59+d[i*4+2]*.11;m+=L[i];m2+=L[i]*L[i];}
  m/=w*h;var lv=m2/(w*h)-m*m;
  if(lv<25)return false;
  for(y=1;y<h-1;y++)for(x=1;x<w-1;x++){i=y*w+x;v=4*L[i]-L[i-1]-L[i+1]-L[i-w]-L[i+w];s+=v;s2+=v*v;n++;}
  var lap=s2/n-(s/n)*(s/n);
  return lap<25&&lap/lv<0.02;
}
export function scBlurHint(on){
  if(!S.SC)return;
  var ch=S.SC.blurOn!==!!on;
  S.SC.blurOn=!!on;
  if(ch)rerender();
  if(on){
    scOcrStatus('Số: ảnh mờ — lùi máy ra','#fbbf24');
    scMsg('Ảnh đang bị mờ (máy quá gần hoặc chưa lấy nét). Lùi máy ra khoảng 15–20 cm, phóng to bằng thanh zoom, chờ nét rồi giữ yên.');
  }
}
export function scAutoOcr(v){
  var p=per(S.SC.pid);if(!p)return;
  var cr=scGuideCrop(v),sig,diff=99,i,now=Date.now();
  try{sig=scSig(v,cr);}catch(e){return;}
  if(S.SC.sig){diff=0;for(i=0;i<256;i++)diff+=Math.abs(sig[i]-S.SC.sig[i]);diff/=256;}
  S.SC.sig=sig;
  /* Đứng yên: vẫn tiếp tục thử nhưng thưa hơn (1,5 giây một lần), không bao giờ dừng hẳn */
  if(diff<4){S.SC.steady=(S.SC.steady||0)+1;if(S.SC.steady>3){if(now-(S.SC.ocrSlow||0)<1500)return;S.SC.ocrSlow=now;}}else S.SC.steady=0;
  /* Bỏ qua khung hình đang mờ (chưa lấy nét / rung tay) — đọc khung mờ vừa chậm vừa dễ sai */
  try{
    var c2=S.SC.shc||(S.SC.shc=document.createElement('canvas'));
    c2.width=320;c2.height=Math.max(8,Math.round(cr.h*320/cr.w));
    c2.getContext('2d',{willReadFrequently:true}).drawImage(v,cr.x,cr.y,cr.w,cr.h,0,0,c2.width,c2.height);
    var sh=X.phSharp(c2);
    S.SC.shMax=Math.max((S.SC.shMax||0)*0.985,sh);
    if(scIsBlurry(c2))S.SC.blurN=(S.SC.blurN||0)+1;else{S.SC.blurN=0;if(S.SC.blurOn)scBlurHint(false);}
    if(sh<S.SC.shMax*0.4&&(S.SC.blurSkip||0)<2){S.SC.blurSkip=(S.SC.blurSkip||0)+1;scOcrStatus('Số: ảnh mờ — giữ yên máy, chờ lấy nét','#fbbf24');return;}
    S.SC.blurSkip=0;
  }catch(e){klog("var c2=S.SC.shc||(S.SC.shc=document.createElement('c",e)}
  /* Luôn dùng cùng một cách xử lý để các lần đọc cho cùng một chuỗi (dễ xác nhận); chỉ đổi cách khác khi lần trước không thấy gì */
  var mi=S.SC.ocrMiss||0,mode=mi===0?'bin':(mi%2?'bin2':'gray');
  var t0=now,exact=function(lines){var j=scJudge(p,lines);return !!(j&&j.dist===0&&j.need===1);};
  var good=function(lines){return exact(lines)||(S.SC.kind==='asset'&&lines.some(function(l){return l.digits.length>=7;}));};
  S.SC.autoBusy=true;
  var rot=S.SC.rot||0;
  ocrFrame(v,cr,mode,800,4,true,good,rot).then(function(lines){
    if(!S.SC)return;
    S.SC.autoBusy=false;S.SC.ocrAt=Date.now();S.SC.ocrMiss=lines.length?0:mi+1;
    var rel=lines.filter(function(L){return L.digits.length>=6&&(L.conf||0)>=OCR_CONF;}).sort(function(a,b){return b.digits.length-a.digits.length||b.conf-a.conf;});
    var ms=Date.now()-t0;
    if(S.SC.hold||S.SC.ocrBusy||S.SC.auto===false)return;
    var j=scJudge(p,lines);
    /* hướng đọc: giữ hướng đã đọc rõ; chưa đọc rõ thì lần sau thử hướng kế tiếp (0 → 180 → 90 → 270) */
    if(rel.length||j){S.SC.rot=rot;}else{var ORD=[0,180,90,270];S.SC.rot=ORD[(ORD.indexOf(rot)+1)%4];}
    scOcrStatus('Số: '+(rel.length?rel[0].digits:'chưa đọc rõ')+' · '+ms+' ms'+(rot?' · xoay '+rot+'°':''),rel.length?'#a9bde0':'#9ca3af');
    if(j){
      var vt=S.SC.vote;
      if(vt&&vt.id===j.it.id&&Date.now()-vt.t<5000)vt.n++;else vt=S.SC.vote={id:j.it.id,n:1,t:0};
      vt.t=Date.now();
      if(vt.n>=j.need){
        S.SC.vote=null;
        try{if(navigator.vibrate)navigator.vibrate(60);}catch(e){klog("if(navigator.vibrate)navigator.vibrate(60);",e)}
        S.SC.hold=true;
        scMsg('⚡ '+j.line+(j.dist?' ≈ '+j.it.code:'')+' · '+ms+' ms');
        scShowMatched({item:j.it,how:'ocr',qty:ocrQtyCands(lines,j.line)});
      }else{
        S.SC.steady=0;
        scMsg('Đang xác nhận '+j.line+'…');
      }
    }else if(rel.length){
      scMsg('Đọc rõ '+rel[0].digits+' nhưng chưa có trong danh mục');
      X.scTrack(rel.filter(function(L){return !ocrLooksDate(L.digits);})).forEach(function(c){
        if(c.done)return;
        if(S.SC.kind==='asset'){
          var vv=c.cnt[c.rep]||0,ean=X.eanOk(c.rep);
          if(c.rep.length<7||vv<2)return;
          c.done=true;
          if(ean===true){var ra=X.asAutoAdd(p,c.rep,'ocr');X.asAddedNotice(ra.it,ra.isNew);return;}
          X.asConfirmNum(c.rep);return;
        }
        if(c.n<(X.eanOk(c.rep)===false?3:2))return;
        c.done=true;
        var r=X.unmAdd(p,c.rep,'ocr',c.n);
        X.scUnmNotice(r.e,r.isNew);
      });
    }else if(S.SC.blurN>=4){scBlurHint(true);
    }else scMsg(lines.length?'Chưa đọc rõ — giữ yên máy, đủ sáng, để tem nằm gọn trong khung':scHint());
  }).catch(function(e){if(S.SC){S.SC.autoBusy=false;S.SC.ocrAt=Date.now()+4000;scOcrStatus('Số: lỗi đọc · '+((e&&e.message)||'?'),'#f87171');}});
}

export function scRisky(p,it){
  var key=p.id+':'+p.items.length;
  if(RISK.key!==key){
    var pat=Object.create(null),set={};
    p.items.forEach(function(i){
      var cd=ocrDigits(i.code);if(cd.length<4)return;
      for(var k=0;k<cd.length;k++){
        var pt=cd.slice(0,k)+'*'+cd.slice(k+1),o=pat[pt];
        if(!o)pat[pt]={cd:cd,id:i.id};
        else if(o.cd!==cd){set[o.id]=1;set[i.id]=1;}
      }
    });
    RISK.key=key;RISK.set=set;
  }
  return !!RISK.set[it.id];
}
export function ocrQtyCands(lines,codeLine){
  var out=[];
  (lines||[]).forEach(function(L){
    if(L.digits===codeLine||L.digits.length>=7)return;
    var m=String(L.raw||'').replace(/[^\d.,]/g,'');
    if(!/\d/.test(m))return;
    var n=parseNum(m);
    if(n>0&&out.indexOf(n)<0)out.push(n);
  });
  return out.slice(0,2);
}

export function scCommit(it,qn){
  var pp=per(S.SC&&S.SC.pid);
  if(pp&&pp.locked){toast('Kỳ này đã khoá, mở khoá để chỉnh sửa');return;}
  if(it.counted&&it.countQty!==null){
    if(it.countQty===qn){toast('Mã này đã kiểm: '+fmt(qn)+' (không đổi)');A.scNext();return;}
    if(!confirm('Mã "'+it.code+'" ĐÃ KIỂM: '+fmt(it.countQty)+'.\nSửa thành '+fmt(qn)+'? Thay đổi được ghi vào nhật ký.'))return;
  }
  var updated={};Object.keys(it).forEach(function(k){updated[k]=it[k];});
  updated.counted=true;updated.countQty=qn;
  updated.by=(db.profile&&db.profile.ten)||'';updated.at=Date.now();
  X.applyItem(updated);
  S.SC.log=S.SC.log||[];S.SC.log.push({name:it.name,qty:qn});
  scBeep();
  A.scNext();
  scLogRender();
  toast('Đã lưu: '+it.name+' · '+fmt(qn));
}

export function scOcrProcess(src,crop){
  if(!S.SC)return;
  var p=per(S.SC.pid);if(!p)return;
  S.SC.hold=true;S.SC.ocrBusy=true;S.SC.pending=null;
  scSetRes(null);
  var variants=[['bin',6,0],['gray',6,0],['bin2',11,0]],all=[],idx=0,rotAdded=false;
  scMsg('Đang chuẩn bị bộ đọc số…');
  function finish(r){
    if(!S.SC)return;
    S.SC.ocrBusy=false;
    r=r||ocrRank(p,all);
    if(r.length&&r[0].dist===0&&(r.length<2||r[1].dist>0)){
      scMsg('Đã đọc số: '+r[0].line);
      scShowMatched({item:r[0].item,how:'ocr',qty:ocrQtyCands(all,r[0].line)});
    }else{
      scMsg(all.length?'Đã đọc được số, hãy kiểm tra lại bên dưới.':'Không thấy chữ số nào trong khung.');
      var rl=all.filter(function(L){return (L.conf||0)>=OCR_CONF;});
      S.SC.lastLines=rl.length?rl:all;
      scShowOcr(S.SC.lastLines,r);
    }
  }
  function next(){
    if(!S.SC)return;
    if(idx>=variants.length){
      if(!rotAdded&&!all.some(function(L){return L.digits.length>=6&&(L.conf||0)>=OCR_CONF;})){rotAdded=true;variants.push(['bin',6,180],['bin',6,90],['bin',6,270]);}
      else return finish();
    }
    var v=variants[idx++];
    scMsg('Đang đọc số… (lần '+idx+'/'+variants.length+')');
    ocrFrame(src,crop,v[0],1400,5,true,function(lines){var r=ocrRank(p,lines);return r.length&&r[0].dist===0;},v[2]||0).then(function(lines){
      if(!S.SC)return;
      lines.forEach(function(L){if(!all.some(function(a){return a.digits===L.digits;}))all.push(L);});
      var r=ocrRank(p,all);
      if(r.length&&r[0].dist===0)return finish(r);
      next();
    }).catch(fail);
  }
  function fail(e){
    if(!S.SC)return;
    S.SC.ocrBusy=false;S.SC.hold=false;
    scMsg('Không chạy được bộ đọc số (lần đầu cần có mạng để tải). Hãy nhập dãy số bên dưới.');
  }
  next();
}



/* ---- tiện ích / kết quả ---- */
export function scLogRender(){
  var e=document.getElementById('sclog');if(!e||!S.SC)return;
  var l=S.SC.log||[];
  if(!l.length){scMount_('sclog',null);return;}
  scMount_('sclog',
    <>
      <div style={st('font-size:11px;color:#6b7280;margin-top:8px;text-transform:uppercase;letter-spacing:.06em')}>Đã lưu trong phiên: {l.length} mã</div>
      {l.slice(-3).reverse().map(function(x,i){return <div key={i} style={st('font-size:12px;color:#9ca3af;margin-top:2px;word-break:break-word')}>✓ {x.name} · <b style={{color:'#e5e7eb'}}>{fmt(x.qty)}</b></div>;})}
    </>
  );
}
export function scTools(stream){
  var tr=stream.getVideoTracks&&stream.getVideoTracks()[0],box=document.getElementById('sctools');
  if(!tr||!box)return;
  S.SC.track=tr;
  var caps={};try{caps=tr.getCapabilities?tr.getCapabilities():{};}catch(e){klog("caps=tr.getCapabilities?tr.getCapabilities():{};",e)}
  box.innerHTML='';
  if(caps.torch){
    var b=document.createElement('button');b.id='sctorch';b.textContent='🔦';
    b.style.cssText='width:40px;height:40px;border-radius:50%;border:1px solid #33333d;background:rgba(18,18,26,.75);color:#fbbf24;font-size:18px';
    b.onclick=function(){A.scTorch();};box.appendChild(b);
  }
  if(caps.zoom&&caps.zoom.max>caps.zoom.min){
    var r=document.createElement('input');r.type='range';r.min=caps.zoom.min;r.max=Math.min(caps.zoom.max,5);r.step=caps.zoom.step||0.1;r.value=caps.zoom.min;
    r.style.width='110px';r.oninput=function(){A.scZoom(r.value);};box.appendChild(r);
  }
}
export function scInfoGs1(g){
  if(!g||(!g.lot&&!g.exp))return null;
  return <div style={st('font-size:12px;color:#9ca3af;margin-top:4px')}>{g.lot?'Lô '+g.lot:''}{g.lot&&g.exp?' · ':''}{g.exp?'HSD '+g.exp:''}</div>;
}
export function scOcrNear(text){return null;}
export function scCandHtml(c){
  return c.map(function(x){
    var i=x.item,tag=x.dist===0?'khớp hoàn toàn':'lệch '+x.dist+' chữ số';
    return <button key={i.id} onClick={() => A.scOcrPick(i.id,x.line)} style={st('display:block;width:100%;text-align:left;margin-top:6px;padding:10px 12px;border-radius:10px;border:1px solid #33333d;background:#1b1b24;color:#e5e7eb;font:inherit;font-size:13px')}><b>{i.name}</b><br /><span style={st('color:#9ca3af;font-size:12px')}>{i.code} · {i.unit} · <span style={{color:x.dist===0?'#4ade80':'#fbbf24'}}>{tag}</span></span></button>;
  });
}
const INP = 'background:#1b1b24;color:#e5e7eb;border-color:#33333d';
const GREYBTN = (extra) => st('padding:10px;background:#23232c;color:#e5e7eb;border:1px solid #33333d' + (extra || ''));

export function scShowMatched(m){
  if(S.SC&&S.SC.kind==='asset')return X.asShowMatched(m);
  var it=m.item,done=it.counted&&it.countQty!==null;
  var sp=per(S.SC.pid),bx=(m.gs1&&sp&&!sp.locked&&X.isTracked(it))?X.bxRecord(it,m.gs1):null;
  S.SC.hold=true;S.SC.mgs=m.gs1;scBeep();
  scSetRes(
    <div style={st('background:#16231b;border:1px solid #1f6b3a;border-radius:14px;padding:12px 14px')}>
      <div style={st('font-size:11px;font-weight:800;letter-spacing:.08em;color:#4ade80;text-transform:uppercase')}>{I('check',13)} Đã khớp{m.how==='learned'?' (mã vạch đã học)':m.how==='ocr'?' (đọc số)':''}</div>
      <div style={st('font-weight:700;font-size:16px;margin-top:4px;word-break:break-word')}>{it.name}</div>
      <div style={st('font-size:12px;color:#9ca3af;margin-top:2px')}>{it.code} · {it.unit} · Tồn sổ sách {fmt(it.close)}{done?' · Đã kiểm '+fmt(it.countQty):' · Chưa kiểm'}</div>
      {scInfoGs1(m.gs1)}
      {bx?node(X.scBoxHtml(it,bx)):(m.gs1&&!X.isTracked(it)?<button onClick={() => A.scTrackOn(it.id)} style={st('margin-top:6px;padding:7px 10px;border-radius:999px;border:1px solid #2c4f8f;background:#14203a;color:#a9bde0;font:inherit;font-size:12px;font-weight:700')}>+ Theo dõi từng hộp (vật tư đắt / tồn lâu)</button>:null)}
      <div style={st('display:flex;gap:8px;margin-top:10px')}>
        <input id="scqty" className="inp" inputMode="decimal" placeholder="Số kiểm kê" style={st('flex:1;min-width:0;'+INP)} onKeyDown={(e) => { if (e.key === 'Enter') A.scQtySave(it.id); }} />
        <button className="btn btn-primary" style={st('width:auto;padding:0 14px')} onClick={() => A.scQtySave(it.id)}>Lưu &amp; quét tiếp</button>
      </div>
      <div style={st('display:flex;flex-wrap:wrap;gap:6px;margin-top:8px')}>
        <button onClick={() => A.scQtyMatch(it.id)} style={st('padding:8px 12px;border-radius:999px;border:1px solid #1f6b3a;background:#16231b;color:#4ade80;font:inherit;font-size:13px;font-weight:700')}>✓ Đủ {fmt(it.close)}</button>
        {bx?<button onClick={() => A.scQtySet(X.bxSeenQty(it))} style={st(SC_CHIP)}>Theo SL đã quét: {X.bxSeenQty(it)}</button>:null}
        {(m.qty||[]).map(function(n){return <button key={'q'+n} onClick={() => A.scQtySet(n)} style={st(SC_CHIP)}>Đọc được: {fmt(n)}</button>;})}
      </div>
      <div style={st('display:flex;gap:8px;margin-top:8px')}>
        <button className="btn" style={st('flex:1;padding:10px;background:#23232c;color:#e5e7eb;border:1px solid #33333d')} onClick={() => A.scOpenItem(it.id)}>Mở chi tiết</button>
        <button className="btn" style={st('flex:1;padding:10px;background:#23232c;color:#e5e7eb;border:1px solid #33333d')} onClick={() => A.scNext()}>Quét tiếp</button>
      </div>
    </div>
  );
}
export function scShowKho(m,text){
  S.SC.hold=true;scBeep();
  var boxSt='background:#2a1f12;border:1px solid #8a5a1a;border-radius:14px;padding:12px 14px',hd='font-size:11px;font-weight:800;letter-spacing:.08em;color:#fbbf24;text-transform:uppercase';
  if(m.ambig){
    scSetRes(
      <div style={st(boxSt)}><div style={st(hd)}>Mã có ở nhiều kho — chọn kho</div>
        {m.ambig.map(function(i){return <button key={i.id} onClick={() => A.scPickKho(i.id)} style={st('display:block;width:100%;text-align:left;margin-top:6px;padding:10px 12px;border-radius:10px;border:1px solid #33333d;background:#1b1b24;color:#e5e7eb;font:inherit;font-size:13px')}><b>{i.branch}</b> · {i.name}<br /><span style={st('color:#9ca3af;font-size:12px')}>{i.code} · Tồn {fmt(i.close)}{i.counted?' · Đã kiểm '+fmt(i.countQty):' · Chưa kiểm'}</span></button>;})}
        <button className="btn" style={st('margin-top:8px;padding:10px;background:#23232c;color:#e5e7eb;border:1px solid #33333d')} onClick={() => A.scNext()}>Bỏ qua, quét tiếp</button>
      </div>
    );
  }else{
    scSetRes(
      <div style={st(boxSt)}><div style={st(hd)}>Mã thuộc kho khác</div>
        <div style={st('font-size:14px;margin-top:6px')}>Mã này không có trong kho đang chọn (<b>{S.P&&S.P.br}</b>), chỉ có ở: <b>{m.other.map(function(i){return i.branch;}).join(', ')}</b>.</div>
        <div style={st('font-size:12px;color:#9ca3af;margin-top:4px')}>App không ghi gì. Đổi bộ lọc kho ở màn hình kiểm kê nếu cần kiểm kho đó.</div>
        <button className="btn" style={st('margin-top:8px;padding:10px;background:#23232c;color:#e5e7eb;border:1px solid #33333d')} onClick={() => A.scNext()}>Quét tiếp</button>
      </div>
    );
  }
}
export function scShowUnmatched(text,m){
  if(S.SC&&S.SC.kind==='asset')return X.asShowUnmatched(text,m);
  S.SC.hold=true;S.SC.pending={text:text,canon:m.canon,gs1:m.gs1};
  var shown=String(text).replace(/\u001d/g,' ');
  scSetRes(
    <div style={st('background:#2a1f12;border:1px solid #8a5a1a;border-radius:14px;padding:12px 14px')}>
      <div style={st('font-size:11px;font-weight:800;letter-spacing:.08em;color:#fbbf24;text-transform:uppercase')}>Chưa có trong kỳ này</div>
      <div style={st('font-size:12px;color:#9ca3af;margin-top:6px')}>Nội dung đọc được trong mã:</div>
      <div style={st('font-family:ui-monospace,Menlo,monospace;font-size:12px;background:#1b1b24;border:1px solid #33333d;border-radius:8px;padding:8px;margin-top:4px;max-height:84px;overflow:auto;word-break:break-all;-webkit-user-select:text;user-select:text')}>{shown.length>400?shown.slice(0,400)+'…':shown}</div>
      {scInfoGs1(m.gs1)}
      {scOcrNear(text)}
      <div style={st('font-size:12px;color:#9ca3af;margin-top:6px')}>Chọn vật tư tương ứng để liên kết. Lần sau quét mã này app tự nhận.</div>
      <input id="scpick" className="inp" placeholder="Gõ tên hoặc mã vật tư…" style={st('margin-top:8px;'+INP)} onInput={(e) => A.scPickQ(e.target.value)} />
      <div id="scpicklist"></div>
      <button className="btn" style={st('margin-top:8px;padding:11px;background:#23232c;color:#e5e7eb;border:1px solid #33333d')} onClick={() => A.scNext()}>Bỏ qua, quét tiếp</button>
    </div>
  );
}
export function scBindCode(p,text){
  var it=p.items.filter(function(x){return x.id===S.SC.bind;})[0],g=parseGS1(text),el=document.getElementById('scres');
  if(!it||!el)return;
  S.SC.hold=true;
  var nx=<div style={st('display:flex;gap:8px;margin-top:10px')}><button className="btn" style={st('flex:1;padding:10px;background:#23232c;color:#e5e7eb;border:1px solid #33333d')} onClick={() => A.scNext()}>Quét tiếp</button><button className="btn btn-primary" style={st('flex:1;padding:10px')} onClick={() => A.scClose()}>Xong</button></div>;
  function W(t){scSetRes(<><div style={st('background:#2a1f12;border:1px solid #8a5a1a;border-radius:14px;padding:12px 14px;color:#fbbf24;font-size:13px')}>{t}</div>{nx}</>);}
  if(p.locked)return W('Kỳ này đã khoá, không ghi thêm hộp.');
  S.SC.bindText=text;
  if(!g){
    var tx=String(text).replace(/[\u001d\s]+/g,' ').trim();
    if(!tx||tx.length>80)return W('Mã quá dài hoặc không hợp lệ. Bấm Xong rồi dùng “+ Thêm tay”.');
    g={gtin:tx,lot:'',ser:'',expIso:'',plain:true,force:!!S.SC.forceNew};S.SC.forceNew=false;
  }
  var canon=scCanon(text),old=db.barcodes[canon];
  if(old&&String(old).trim().toLowerCase()!==String(it.code).trim().toLowerCase())return W(<>Mã hộp này đã gắn với vật tư <b>{old}</b>, không ghi vào {it.code}.</>);
  if(!old){db.barcodes[canon]=it.code;}
  var bx=X.bxRecord(it,g);scBeep();
  scSetRes(<>{node(X.scBoxHtml(it,bx))}{nx}</>);
}
export function scOnCode(text,force){
  if(!S.SC)return;
  if(!force&&S.SC.hold)return; /* đang xử lý một mã khác: bỏ qua kết quả đọc đến muộn */
  var now=Date.now();
  if(!force&&S.SC.last===text&&now-S.SC.lastAt<2500)return;
  S.SC.last=text;S.SC.lastAt=now;
  var p=per(S.SC.pid);if(!p)return;
  try{if(navigator.vibrate)navigator.vibrate(60);}catch(e){klog("if(navigator.vibrate)navigator.vibrate(60);",e)}
  if(S.SC.bind)return scBindCode(p,text);
  var m=scMatch(p,text);
  if(m.item)scShowMatched(m);
  else if(m.ambig||m.other)scShowKho(m,text);
  else if(force)scShowUnmatched(text,m);else X.scUnmCode(p,text,m);
}
export function scShowOcr(lines,cands){
  if(S.SC)S.SC.lastLines=lines;
  var inp=document.getElementById('scman');
  if(lines.length&&inp)inp.value=lines.slice().sort(function(a,b){return b.digits.length-a.digits.length;})[0].digits;
  scSetRes(
    <div style={st('background:#101a2c;border:1px solid #2c4f8f;border-radius:14px;padding:12px 14px')}>
      <div style={st('font-size:11px;font-weight:800;letter-spacing:.08em;color:#a9bde0;text-transform:uppercase')}>{I('scan',13)} Số đọc được</div>
      {!lines.length?
        <div style={st('font-size:13px;color:#cbd5e1;margin-top:6px;line-height:1.5')}>Không thấy chữ số nào. Hãy viết to, nét đậm, đủ sáng, mỗi mã một dòng và đặt gọn trong khung rồi đọc lại.</div>
      :<>
        <div style={st('font-size:12px;color:#9ca3af;margin-top:6px')}>Bấm vào số đúng để tìm, hoặc sửa ở ô nhập bên dưới:</div>
        <div style={st('display:flex;flex-wrap:wrap;gap:6px;margin-top:6px')}>
          {lines.map(function(L,i){return <button key={i+L.digits} onClick={() => A.scOcrUse(L.digits)} style={st('padding:7px 12px;border-radius:999px;border:1px solid #2c4f8f;background:#14203a;color:#e5e7eb;font:inherit;font-family:ui-monospace,Menlo,monospace;font-size:14px;font-weight:700')}>{L.digits}</button>;})}
        </div>
        <div style={st('font-size:12px;color:#fbbf24;margin-top:10px')}>Chưa có mã nào trong danh sách trùng 100% với các số trên. Chạm vào số cần thêm.</div>
      </>}
      <button className="btn" style={st('margin-top:10px;padding:11px;background:#23232c;color:#e5e7eb;border:1px solid #33333d')} onClick={() => A.scNext()}>Đọc lại</button>
    </div>
  );
}
