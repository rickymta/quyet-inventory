/* Đọc số bằng OCR (Tesseract) — port từ index.html gốc 3955–4254 (phần engine, không có giao diện). */
import { db, S, klog, kkReady } from '../../core';
import { scMsg, scOcrStatus } from './dom.js';

export var OCR={worker:null,loading:null,psm:7,pool:[],q:[]};
export function ocrCreate(){
  return kkReady(['tesseract']).then(function(ok){
    if(!ok||!window.Tesseract)throw new Error('script');
    return Tesseract.createWorker('eng',1,{logger:function(m){
      if(!m||!S.SC)return;
      var pct=Math.round((m.progress||0)*100);
      if(/load|init/i.test(m.status||'')){
        scOcrStatus('Số: đang tải '+pct+'%');
        if(S.SC.ocrBusy)scMsg('Đang tải bộ đọc số… '+pct+'% (chỉ lần đầu)');
      }else if(m.status==='recognizing text'&&S.SC.ocrBusy)scMsg('Đang đọc số… '+pct+'%');
    }});
  }).then(function(w){
    return w.setParameters({tessedit_char_whitelist:'0123456789.,-',preserve_interword_spaces:'1',user_defined_dpi:'300',tessedit_pageseg_mode:'7'}).then(function(){return w;});
  });
}
export function ocrWorker(){
  if(OCR.worker)return Promise.resolve(OCR.worker);
  if(OCR.loading)return OCR.loading;
  OCR.loading=ocrCreate().then(function(w){
    OCR.worker=w;OCR.pool.push({w:w,busy:false,psm:7});OCR.err='';
    scOcrStatus('Số: sẵn sàng ✓','#4ade80');
    /* máy nhiều nhân: nạp thêm bộ đọc thứ 2 để đọc 2 dòng cùng lúc */
    if((navigator.hardwareConcurrency||2)>=4)setTimeout(function(){
      ocrCreate().then(function(w2){OCR.pool.push({w:w2,busy:false,psm:7});ocrPump();}).catch(function(){});
    },300);
    return w;
  }).catch(function(e){OCR.loading=null;throw e;});
  return OCR.loading;
}
export function ocrParse(r){
  var out=[],cf=(r.data&&typeof r.data.confidence==='number')?r.data.confidence:0;
  String((r.data&&r.data.text)||'').split(/\n+/).forEach(function(t){
    var dg=t.replace(/\D/g,'');
    if(dg.length>=3)out.push({raw:t.trim(),digits:dg,conf:cf});
    var toks=t.split(/\s+/).map(function(x){return x.replace(/\D/g,'');}).filter(function(x){return x.length>=3;});
    if(toks.length>1)toks.forEach(function(x){if(!out.some(function(o){return o.digits===x;}))out.push({raw:x,digits:x,conf:cf});});
  });
  return out;
}
export function ocrPump(){
  OCR.pool.forEach(function(en){
    if(en.busy||!OCR.q.length)return;
    var j=OCR.q.shift();en.busy=true;
    var go=function(){return en.w.recognize(j.cv,{},{text:true,blocks:false,hocr:false,tsv:false});};
    (en.psm===j.psm?go():en.w.setParameters({tessedit_pageseg_mode:String(j.psm)}).then(function(){en.psm=j.psm;return go();}))
      .then(function(r){en.busy=false;j.res(ocrParse(r));ocrPump();})
      .catch(function(e){en.busy=false;j.rej(e);ocrPump();});
  });
}
export function ocrRun(cv,psm){
  return ocrWorker().then(function(){
    return new Promise(function(res,rej){OCR.q.push({cv:cv,psm:psm,res:res,rej:rej});ocrPump();});
  });
}
/* Xoá các đường kẻ dài (viền bảng/khung nhãn) để không dính vào chữ số */
export function ocrStripLines(out,w,h){
  var x,y,run,st,mx=Math.round(w*0.25),my=Math.round(h*0.2);
  for(y=0;y<h;y++){
    run=0;
    for(x=0;x<=w;x++){
      if(x<w&&out[y*w+x]===0)run++;
      else{if(run>mx)for(st=x-run;st<x;st++)out[y*w+st]=255;run=0;}
    }
  }
  for(x=0;x<w;x++){
    run=0;
    for(y=0;y<=h;y++){
      if(y<h&&out[y*w+x]===0)run++;
      else{if(run>my)for(st=y-run;st<y;st++)out[st*w+x]=255;run=0;}
    }
  }
}
/* Giữ lại đúng các "dòng ký tự": chỉ những mảnh liền nhau có kích thước giống chữ/số và xếp thẳng hàng.
   Viền ô, đường kẻ, vân gỗ/màn hình, đốm nhiễu đều bị loại trước khi đưa vào nhận dạng (nguyên nhân số bị thừa "1" ở đầu/cuối). */
export function ocrKeep(a,w,h){
  var n=w*h,lab=new Int32Array(n),par=[0],nl=0,x,y,i,l,c1,c2,c3,c4;
  var find=function(k){while(par[k]!==k){par[k]=par[par[k]];k=par[k];}return k;};
  var uni=function(p,q){p=find(p);q=find(q);if(p!==q){if(p<q)par[q]=p;else par[p]=q;}};
  for(y=0;y<h;y++)for(x=0;x<w;x++){
    i=y*w+x;if(a[i]!==0)continue;
    c1=x>0?lab[i-1]:0;c2=(y>0&&x>0)?lab[i-w-1]:0;c3=y>0?lab[i-w]:0;c4=(y>0&&x<w-1)?lab[i-w+1]:0;
    l=c1||c2||c3||c4;
    if(!l){nl++;par.push(nl);lab[i]=nl;continue;}
    lab[i]=l;
    if(c1&&c1!==l)uni(l,c1);if(c2&&c2!==l)uni(l,c2);if(c3&&c3!==l)uni(l,c3);if(c4&&c4!==l)uni(l,c4);
  }
  if(!nl)return 0;
  var x0=new Int32Array(nl+1).fill(1e9),y0=new Int32Array(nl+1).fill(1e9),x1=new Int32Array(nl+1).fill(-1),y1=new Int32Array(nl+1).fill(-1),ar=new Int32Array(nl+1),r;
  for(y=0;y<h;y++)for(x=0;x<w;x++){
    l=lab[y*w+x];if(!l)continue;r=find(l);lab[y*w+x]=r;
    if(x<x0[r])x0[r]=x;if(x>x1[r])x1[r]=x;if(y<y0[r])y0[r]=y;if(y>y1[r])y1[r]=y;ar[r]++;
  }
  var C=[],cw,ch,minG=Math.max(8,0.025*h),maxG=0.45*h;
  for(r=1;r<=nl;r++){
    if(par[r]!==r||!ar[r])continue;
    cw=x1[r]-x0[r]+1;ch=y1[r]-y0[r]+1;
    if(ch<minG||ch>maxG||cw>2.6*ch||cw<0.1*ch||ar[r]/(cw*ch)<0.1)continue;
    C.push({x:x0[r],y:y0[r],w:cw,h:ch,r:r});
  }
  C.sort(function(p,q){return p.x-q.x;});
  var gp=C.map(function(_,k){return k;}),gf=function(k){while(gp[k]!==k){gp[k]=gp[gp[k]];k=gp[k];}return k;};
  var i2,j2,A,B,gap,mh;
  for(i2=0;i2<C.length;i2++){
    A=C[i2];
    for(j2=i2+1;j2<C.length;j2++){
      B=C[j2];mh=Math.max(A.h,B.h);gap=B.x-(A.x+A.w);
      if(gap>1.3*mh&&B.x>A.x+A.w){if(B.x-A.x>6*mh)break;continue;}
      if(Math.abs((A.y+A.h/2)-(B.y+B.h/2))<=0.4*mh&&A.h/B.h>=0.55&&A.h/B.h<=1.8&&gap>=-0.5*Math.min(A.w,B.w)){
        var ra=gf(i2),rb=gf(j2);if(ra!==rb)gp[rb]=ra;
      }
    }
  }
  var grp={},k2,g,keep=new Uint8Array(nl+1),kept=0;
  for(k2=0;k2<C.length;k2++){g=gf(k2);(grp[g]||(grp[g]=[])).push(C[k2]);}
  Object.keys(grp).forEach(function(key){
    var G=grp[key];if(G.length<3)return;
    var xs=1e9,xe=-1,ys=1e9,ye=-1;
    G.forEach(function(q){if(q.x<xs)xs=q.x;if(q.x+q.w>xe)xe=q.x+q.w;if(q.y<ys)ys=q.y;if(q.y+q.h>ye)ye=q.y+q.h;});
    if(xe-xs<2*(ye-ys))return;
    G.forEach(function(q){keep[q.r]=1;});kept++;
  });
  for(i=0;i<n;i++){if(lab[i]){a[i]=keep[lab[i]]?0:255;}}
  return kept;
}
/* Tách các dòng chữ trên ảnh đã làm sạch; một dòng bị tách tiếp ở khoảng trống lớn (ví dụ nhãn "Mã CCDC:" và dãy số cùng hàng) */
export function ocrBands(a,w,h){
  var rows=new Uint16Array(h),x,y,c,o;
  for(y=0;y<h;y++){c=0;o=y*w;for(x=0;x<w;x++)if(a[o+x]===0)c++;rows[y]=c;}
  var thr=Math.max(2,Math.round(w*0.004)),gap=Math.max(3,Math.round(h*0.012)),bands=[],st=-1,last=-1;
  for(y=0;y<=h;y++){
    var on=y<h&&rows[y]>=thr;
    if(on){if(st<0)st=y;last=y;}
    else if(st>=0&&(y>=h||y-last>gap)){
      var bh=last-st+1,yy,xx,ink=0,col=new Uint8Array(w);
      for(yy=st;yy<=last;yy++){ink+=rows[yy];for(xx=0;xx<w;xx++)if(a[yy*w+xx]===0)col[xx]=1;}
      var s0=-1,lc=-1,g=Math.max(6,1.2*bh);
      for(xx=0;xx<=w;xx++){
        if(xx<w&&col[xx]){if(s0<0)s0=xx;lc=xx;}
        else if(s0>=0&&(xx>=w||xx-lc>g)){
          var bw=lc-s0+1;
          if(bw>=1.5*bh&&bh>=Math.max(8,Math.round(h*0.025)))bands.push({x0:s0,y0:st,bw:bw,bh:bh,ink:ink*(bw/w),score:ink*(bw/w)});
          s0=-1;
        }
      }
      st=-1;
    }
  }
  bands.sort(function(p,q){return q.score-p.score;});
  return bands;
}
export function ocrCrop(arr,w,x0,y0,bw,bh,scale,pad){
  var t=document.createElement('canvas');t.width=bw;t.height=bh;
  var tg=t.getContext('2d'),im=tg.createImageData(bw,bh),x,y,v,o=0;
  for(y=0;y<bh;y++)for(x=0;x<bw;x++){v=arr[(y0+y)*w+x0+x];im.data[o++]=v;im.data[o++]=v;im.data[o++]=v;im.data[o++]=255;}
  tg.putImageData(im,0,0);
  var fw=Math.max(8,Math.round(bw*scale))+pad*2,fh=Math.max(8,Math.round(bh*scale))+pad*2;
  var f=document.createElement('canvas');f.width=fw;f.height=fh;
  var fg=f.getContext('2d');fg.fillStyle='#fff';fg.fillRect(0,0,fw,fh);fg.imageSmoothingQuality='high';
  fg.drawImage(t,0,0,bw,bh,pad,pad,fw-pad*2,fh-pad*2);
  return f;
}
/* Tiền xử lý: cắt vùng khung → xám → tách nét chữ (ngưỡng thích ứng) → bỏ đường kẻ → tách dòng */
/* Ước lượng độ nghiêng của các dòng số (độ): thử nhiều góc, chọn góc làm các dòng chữ "dồn" vào ít hàng nhất */
export function ocrSkew(a,w,h){
  var pts=[],step=Math.max(1,Math.floor(Math.sqrt(w*h/6000))),x,y;
  for(y=0;y<h;y+=step)for(x=0;x<w;x+=step)if(a[y*w+x]===0)pts.push(x-w/2,y-h/2);
  if(pts.length<160)return 0;
  var best=0,bs=-1,s0=0,ang,A,c,s,bins,i,yy,sc,cnt=Math.ceil(Math.hypot(w,h)/step)+4,off=cnt>>1;
  for(ang=-14;ang<=14;ang+=1){
    A=ang*Math.PI/180;c=Math.cos(A);s=Math.sin(A);bins=new Uint16Array(cnt);
    for(i=0;i<pts.length;i+=2){yy=Math.floor((pts[i]*s+pts[i+1]*c)/step)+off;if(yy>=0&&yy<cnt)bins[yy]++;}
    sc=0;for(i=0;i<cnt;i++)sc+=bins[i]*bins[i];
    if(ang===0)s0=sc;
    if(sc>bs){bs=sc;best=ang;}
  }
  return (Math.abs(best)>=2&&bs>s0*1.08)?best:0;
}
export function ocrPrep(el,sx,sy,sw,sh,mode,maxSide,rot,skew){
  rot=rot||0;
  var sw0=(rot===90||rot===270)?sh:sw,sh0=(rot===90||rot===270)?sw:sh;
  var k=Math.min(2.5,(maxSide||1400)/Math.max(sw,sh)),w=Math.max(8,Math.round(sw0*k)),h=Math.max(8,Math.round(sh0*k));
  var c=document.createElement('canvas');c.width=w;c.height=h;
  var g=c.getContext('2d',{willReadFrequently:true});
  g.imageSmoothingQuality='low';
  g.fillStyle='#fff';g.fillRect(0,0,w,h);
  g.save();g.translate(w/2,h/2);g.rotate((rot+(skew||0))*Math.PI/180);
  if(rot===90||rot===270)g.drawImage(el,sx,sy,sw,sh,-h/2,-w/2,h,w);else g.drawImage(el,sx,sy,sw,sh,-w/2,-h/2,w,h);
  g.restore();
  var d=g.getImageData(0,0,w,h).data,n=w*h,gray=new Uint8ClampedArray(n),out=new Uint8ClampedArray(n),i,x,y;
  for(i=0;i<n;i++)gray[i]=(d[i*4]*0.299+d[i*4+1]*0.587+d[i*4+2]*0.114)|0;
  var ratio=mode==='bin2'?0.84:0.91,W=w+1,S=new Uint32Array(W*(h+1)),row;
  for(y=0;y<h;y++){row=0;for(x=0;x<w;x++){row+=gray[y*w+x];S[(y+1)*W+x+1]=S[y*W+x+1]+row;}}
  var r=Math.max(12,Math.round(Math.min(w,h)/10));
  for(y=0;y<h;y++){
    var y0=Math.max(0,y-r),y1=Math.min(h,y+r+1);
    for(x=0;x<w;x++){
      var x0=Math.max(0,x-r),x1=Math.min(w,x+r+1);
      var sum=S[y1*W+x1]-S[y0*W+x1]-S[y1*W+x0]+S[y0*W+x0],cnt=(x1-x0)*(y1-y0);
      out[y*w+x]=gray[y*w+x]*cnt<sum*ratio?0:255;
    }
  }
  var raw=out.slice();
  ocrStripLines(out,w,h);
  ocrKeep(out,w,h);
  if(skew===undefined){var sk=ocrSkew(out,w,h);if(sk)return ocrPrep(el,sx,sy,sw,sh,mode,maxSide,rot,sk);}
  var stretch=function(){
    var hist=new Uint32Array(256),lo=0,hi=255,acc=0,q,sg=new Uint8ClampedArray(n);
    for(q=0;q<n;q++)hist[gray[q]]++;
    for(q=0;q<256;q++){acc+=hist[q];if(acc>n*0.005){lo=q;break;}}
    acc=0;for(q=0;q<256;q++){acc+=hist[q];if(acc>n*0.5){hi=q;break;}}
    if(hi-lo<20)hi=Math.min(255,lo+20);
    for(q=0;q<n;q++){
      if(raw[q]===0&&out[q]===255){sg[q]=255;continue;}
      var t=(gray[q]-lo)*255/(hi-lo);sg[q]=t<0?0:t>255?255:t;
    }
    return sg;
  };
  var src=mode==='gray'?stretch():out;
  var bands=ocrBands(out,w,h).map(function(b){
    var sc=Math.min(3,40/b.bh,1800/b.bw);
    return ocrCrop(src,w,b.x0,b.y0,b.bw,b.bh,sc,10);
  });
  return {bands:bands,full:function(){return ocrCrop(mode==='gray'?src:stretch(),w,0,0,w,h,1,24);}};
}
/* Đọc một khung hình: các dòng chữ được đọc song song, dừng ngay khi stopFn báo đã khớp */
export function ocrFrame(el,crop,mode,maxSide,maxBands,fallbackFull,stopFn,rot){
  var prep;
  try{prep=ocrPrep(el,crop.x,crop.y,crop.w,crop.h,mode,maxSide,rot||0);}catch(e){return Promise.reject(e);}
  var jobs=prep.bands.slice(0,maxBands).map(function(c){return {cv:c,psm:7};}),all=[],i=0,usedFull=false;
  return new Promise(function(res,rej){
    var done=false,active=0,conc=Math.max(1,OCR.pool.length);
    function add(lines){lines.forEach(function(L){L.rot=rot||0;var e=null;all.forEach(function(a){if(a.digits===L.digits)e=a;});if(!e)all.push(L);else if((L.conf||0)>(e.conf||0))e.conf=L.conf;});}
    function finish(){if(!done){done=true;res(all);}}
    function launch(){
      while(!done&&active<conc&&i<jobs.length){
        (function(j){
          active++;
          ocrRun(j.cv,j.psm).then(function(lines){
            active--;if(done)return;
            add(lines);
            if(stopFn&&stopFn(all))return finish();
            launch();
          }).catch(function(e){active--;if(!done){done=true;rej(e);}});
        })(jobs[i++]);
      }
      if(!done&&active===0&&i>=jobs.length){
        if(!all.length&&fallbackFull&&!usedFull){usedFull=true;jobs.push({cv:prep.full(),psm:11});launch();}
        else finish();
      }
    }
    launch();
  });
}
export var OCR_CONF=70; /* ngưỡng tin cậy tối thiểu (0–100) để coi một dãy số là "đọc rõ" */
export function ocrLooksDate(d){return d.length===8&&+d.slice(0,2)>=1&&+d.slice(0,2)<=31&&+d.slice(2,4)>=1&&+d.slice(2,4)<=12&&+d.slice(4,6)>=19&&+d.slice(4,6)<=21;}
export function ocrDigits(s){return String(s||'').replace(/\D/g,'');}
export function ocrLev(a,b,max){
  if(Math.abs(a.length-b.length)>max)return max+1;
  var prev=[],cur,i,j,mn,v;
  for(j=0;j<=b.length;j++)prev[j]=j;
  for(i=1;i<=a.length;i++){
    cur=[i];mn=i;
    for(j=1;j<=b.length;j++){
      v=Math.min(prev[j]+1,cur[j-1]+1,prev[j-1]+(a.charCodeAt(i-1)===b.charCodeAt(j-1)?0:1));
      cur[j]=v;if(v<mn)mn=v;
    }
    if(mn>max)return max+1;
    prev=cur;
  }
  return prev[b.length];
}
/* Xếp hạng vật tư theo độ giống của dãy số (chỉ so phần chữ số của mã) */
export function ocrRank(p,lines){
  var res=[],fx=db.ocrfix||{};
  p.items.forEach(function(it){
    var cd=ocrDigits(it.code);
    if(cd.length<4)return;
    var best=99,bl='',bc=0;
    lines.forEach(function(L){
      var d=L.digits,max=d.length>=9?3:d.length>=6?2:1,dist=(d===cd||(fx[d]&&String(fx[d]).toLowerCase()===String(it.code).toLowerCase()))?0:ocrLev(d,cd,max);
      if(dist<best){best=dist;bl=d;bc=L.conf||0;}
    });
    if(best<=3&&best<99){
      var L0=lines.filter(function(L){return L.digits===bl;})[0];
      var mx=bl.length>=9?3:bl.length>=6?2:1;
      if(best<=mx)res.push({item:it,dist:best,line:bl,conf:bc});
    }
  });
  res.sort(function(a,b){return a.dist-b.dist||String(a.item.code).localeCompare(String(b.item.code));});
  return res.slice(0,5);
}
