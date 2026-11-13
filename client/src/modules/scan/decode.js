/* Phân tích GS1, khớp mã, giải mã QR/mã vạch (port từ index.html gốc 3635–3780). */
import { db, S, klog, kkReady } from '../../core';

export function parseGS1(t){
  var s=String(t||''),out={},m,found=false;
  if(/^\(\d{2}\)/.test(s)){
    var re=/\((\d{2,4})\)([^(]*)/g;
    while((m=re.exec(s))){out[m[1]]=m[2];found=true;}
  }else if(/^01\d{14}/.test(s)){
    var i=0;
    while(i<s.length){
      var ai=s.substr(i,2);
      if(ai==='01'){out['01']=s.substr(i+2,14);i+=16;found=true;}
      else if(ai==='17'||ai==='11'||ai==='15'){out[ai]=s.substr(i+2,6);i+=8;}
      else if(ai==='10'||ai==='21'){var j=s.indexOf('\u001d',i+2);if(j<0)j=s.length;out[ai]=s.substring(i+2,j);i=j+1;}
      else break;
    }
  }
  if(!found||!out['01'])return null;
  var r={gtin:out['01'],lot:out['10']||'',ser:out['21']||'',exp:'',expIso:'',raw:s};
  var e=out['17']||'';
  if(e.length===6){
    var yy=2000+parseInt(e.substr(0,2),10),mm=parseInt(e.substr(2,2),10),dd=parseInt(e.substr(4,2),10);
    r.exp=yy+'-'+e.substr(2,2);
    if(mm>=1&&mm<=12){if(!dd)dd=new Date(yy,mm,0).getDate();r.expIso=yy+'-'+e.substr(2,2)+'-'+('0'+dd).slice(-2);}
  }
  return r;
}
export function scCanon(text){
  var t=String(text||'').trim(),g=parseGS1(t);
  if(g)return 'N:'+g.gtin.replace(/^0+/,'');
  if(/^\d{8,14}$/.test(t))return 'N:'+t.replace(/^0+/,'');
  return t;
}
export function scHasCode(low,c){
  var digits=/^\d+$/.test(c),from=0,i;
  while((i=low.indexOf(c,from))>=0){
    var pv=i>0?low.charAt(i-1):'',nx=low.charAt(i+c.length);
    var bad=digits?(/\d/.test(pv)||/\d/.test(nx)):(/[a-z0-9]/.test(pv)||/[a-z0-9]/.test(nx));
    if(!bad)return true;
    from=i+1;
  }
  return false;
}
export var SCIDX={p:null,n:-1,m:null};
export function scIndex(p){
  if(SCIDX.p!==p||SCIDX.n!==p.items.length||SCIDX.m===null){
    var m=Object.create(null);
    p.items.forEach(function(i,x){var k=String(i.code).trim().toLowerCase();(m[k]||(m[k]=[])).push(x);});
    SCIDX.p=p;SCIDX.n=p.items.length;SCIDX.m=m;
  }
  return SCIDX.m;
}
/* mã trùng ở nhiều kho: ưu tiên kho đang chọn; chưa chọn kho mà mã có ở nhiều kho thì trả về ds để người dùng chọn */
export function scPickItem(p,k,ix){
  var l=ix[k];if(!l)return null;
  var arr=l.map(function(x){return p.items[x];}).filter(function(i){return i&&String(i.code).trim().toLowerCase()===k;});
  if(!arr.length){SCIDX.m=null;return null;}
  var br=(S.P&&S.P.id===p.id)?S.P.br:"all";
  if(br&&br!=="all"){var in1=arr.filter(function(i){return i.branch===br;});return in1.length?{item:in1[0]}:{other:arr};}
  return arr.length>1?{ambig:arr}:{item:arr[0]};
}
export function scEnsureZx(){return kkReady(['zxing']).then(function(ok){return !!ok&&!!window.ZXing;});}
export function scInitDecoder(){
  if('BarcodeDetector' in window){try{S.SC.det=new BarcodeDetector();return Promise.resolve(true);}catch(e){S.SC.det=null;}}
  return scEnsureZx();
}
export function scMatch(p,text){
  var t=String(text||'').replace(/\u001d/g,' ').trim(),g=parseGS1(text),canon=scCanon(text),ix=scIndex(p);
  var byCode={};
  function look(k){
    var r=scPickItem(p,k,ix);if(!r)return null;
    return r.item?{item:r.item,gs1:g,canon:canon}:{item:null,gs1:g,canon:canon,ambig:r.ambig,other:r.other};
  }
  var learned=db.barcodes&&db.barcodes[canon],r0;
  if(learned&&(r0=look(String(learned).trim().toLowerCase())))return Object.assign(r0,{how:'learned'});
  var low=t.toLowerCase();
  if(r0=look(low))return Object.assign(r0,{how:'code'});
  if(!g){
    /* mã nằm lẫn trong chuỗi, ví dụ VT10000002, CCDC-00123-LVL, {"ma":"10000025"}: ưu tiên mã DÀI nhất (đặc trưng nhất) */
    var best=null,bl=0;
    Object.keys(ix).forEach(function(c){
      if(c.length>=5&&c.length>bl&&scHasCode(low,c)){best=c;bl=c.length;}
    });
    if(best&&(r0=look(best)))return Object.assign(r0,{how:'code'});
    var toks=low.split(/[^a-z0-9]+/).filter(Boolean);
    for(var k=0;k<toks.length;k++)if(r0=look(toks[k]))return Object.assign(r0,{how:'code'});
    /* mã số khác nhau chỉ ở số 0 đầu (GTIN-14 / UPC / Excel làm mất số 0) */
    if(/^\d{8,14}$/.test(low)){
      var nz=low.replace(/^0+/,''),ks=Object.keys(ix);
      var zm=[];
      for(var z=0;z<ks.length;z++)if(/^\d{8,14}$/.test(ks[z])&&ks[z].replace(/^0+/,'')===nz&&(r0=look(ks[z])))zm.push(r0);
      if(zm.length===1)return Object.assign(zm[0],{how:'code'});
      if(zm.length>1){ /* nhiều mã chỉ khác số 0 đầu: KHÔNG tự chọn, buộc người dùng xác nhận */
        var all=[];zm.forEach(function(m){(m.item?[m.item]:(m.ambig||m.other||[])).forEach(function(i){if(all.indexOf(i)<0)all.push(i);});});
        return {item:null,gs1:g,canon:canon,ambig:all,how:'code'};
      }
    }
  }
  return {item:null,gs1:g,canon:canon};
}
export var SCFMT='';
/* Vùng ngắm: quy khung xanh trên màn hình về toạ độ khung hình video (object-fit:cover cắt bớt hình).
   full=true: toàn bộ vùng đang nhìn thấy. Không bao giờ đọc phần bị cắt khỏi màn hình. */
export function scRoi(v,full){
  var vw=v.videoWidth,vh=v.videoHeight,cw=v.clientWidth||vw,ch=v.clientHeight||vh;
  var s=Math.max(cw/vw,ch/vh),ox=(cw-vw*s)/2,oy=(ch-vh*s)/2;
  var a=full?0:cw*.06,b=full?cw:cw*.94,c=full?0:ch*.14,d=full?ch:ch*.86;
  var x0=Math.max(0,(a-ox)/s),y0=Math.max(0,(c-oy)/s),x1=Math.min(vw,(b-ox)/s),y1=Math.min(vh,(d-oy)/s);
  return {x:x0,y:y0,w:Math.max(16,x1-x0),h:Math.max(16,y1-y0)};
}
export function scDecodeZx(c){
  if(!window.ZXing)return null;
  try{
    if(!S.SC.zr){var hints=new Map();hints.set(ZXing.DecodeHintType.TRY_HARDER,true);try{var F=ZXing.BarcodeFormat,fm=['QR_CODE','DATA_MATRIX','AZTEC','PDF_417','EAN_13','EAN_8','UPC_A','UPC_E','CODE_128','CODE_39','CODE_93','ITF'].map(function(n){return F[n];}).filter(function(x){return x!==undefined;});if(fm.length>4)hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS,fm);}catch(e){klog("var F=ZXing.BarcodeFormat,fm=['QR_CODE','DATA_MA",e)}S.SC.zr=new ZXing.MultiFormatReader();S.SC.zr.setHints(hints);}
    var bmp=new ZXing.BinaryBitmap(new ZXing.HybridBinarizer(new ZXing.HTMLCanvasElementLuminanceSource(c)));
    var zr=S.SC.zr.decode(bmp);try{SCFMT=String(ZXing.BarcodeFormat[zr.getBarcodeFormat()]||'').toLowerCase();}catch(e){SCFMT='';}return zr.getText();
  }catch(e){return null;}
}
export function scDecode(c){
  if(S.SC.det){
    return S.SC.det.detect(c).then(function(r){
      if(!r||!r.length)return null;
      var cx=c.width/2,cy=c.height/2,b=r[0],bd=1e18;
      r.forEach(function(d){var bb=d.boundingBox;if(!bb)return;var dd=Math.pow(bb.x+bb.width/2-cx,2)+Math.pow(bb.y+bb.height/2-cy,2);if(dd<bd){bd=dd;b=d;}});
      SCFMT=String(b.format||'').toLowerCase();return b.rawValue;}).catch(function(){
      S.SC.det=null;return scEnsureZx().then(function(){return scDecodeZx(c);});
    });
  }
  return Promise.resolve(scDecodeZx(c));
}
export function scInApp(){
  var ua=navigator.userAgent||'';
  if(/FBAN|FBAV|FB_IAB|Instagram|TikTok|musical_ly|Zalo|Line\/|Messenger/i.test(ua))return true;
  return /iPhone|iPad|iPod/.test(ua)&&!/Safari\//.test(ua)&&!navigator.standalone;
}
export function scLoadImage(f){
  return new Promise(function(res,rej){
    function viaReader(){
      var fr=new FileReader();
      fr.onload=function(){var im=new Image();im.onload=function(){res({el:im,w:im.naturalWidth,h:im.naturalHeight});};im.onerror=function(){rej();};im.src=fr.result;};
      fr.onerror=function(){rej();};
      fr.readAsDataURL(f);
    }
    if(window.createImageBitmap){
      createImageBitmap(f).then(function(b){res({el:b,w:b.width,h:b.height});}).catch(viaReader);
    }else viaReader();
  });
}
