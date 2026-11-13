/* Phân tích mua hàng – tiêu hao: logic thuần (port nguyên văn từ khối script#ana-logic, dòng gốc 11326–11591). */
export const ANA = {};
if (typeof window !== "undefined") window.ANA = ANA;
(function(){
var KHO_ALIAS={'KHOBĐ2':'Nghĩa Dũng','KHOCL':'Ba Đình (Cát Linh)','KHOBTX':'Bùi Thị Xuân','KHOLVL':'Lê Văn Lương','KHOQN':'Quảng Ninh','KHOHH':'Hà Nội (Kho HH)','KHOCCDC':'Kho CCDC'};
var KHO_ORDER_MK=['KHOBĐ2','KHOCL','KHOBTX','KHOLVL','KHOQN','KHOHH','KHOCCDC'];
var NHOM={'10':'VTTH chung','11':'Dụng cụ PT/nhổ răng','12':'Labo/Phục hình/Abutment','13':'Implant/Ghép xương','14':'Chỉnh nha (gồm Invisalign)','16':'Nội nha/điều trị','88':'Thuốc/dịch truyền','90':'HHTM (mã 90xxx)','99':'Khác'};
var NHOM_GHIDE={'rang su lava plus':'Labo/Phục hình/Abutment','phi xu ly don hang invi':'Chỉnh nha (gồm Invisalign)'};
ANA.DEFAULT_EXCL='súc miệng, tăm nước, kem đánh răng';

function nz(s){return String(s==null?'':s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/\s+/g,' ').trim();}
ANA.nz=nz;
function pad(n){return n<10?'0'+n:''+n;}
function num(v){
  if(typeof v==='number')return isFinite(v)?v:0;
  if(v==null)return 0;
  var s=String(v).replace(/\s/g,'');
  if(!s)return 0;
  if(/^-?[\d.,]+$/.test(s)){
    var neg=s.charAt(0)==='-';if(neg)s=s.slice(1);
    var c=s.indexOf(','),d=s.indexOf('.');
    if(c>=0&&d>=0){var dec=s.lastIndexOf(',')>s.lastIndexOf('.')?',':'.',th=dec===','?'.':',';s=s.split(th).join('').replace(dec,'.');}
    else if(c>=0){s=/^\d{1,3}(,\d{3})+$/.test(s)?s.replace(/,/g,''):s.replace(',','.');}
    else if(d>=0){if(/^\d{1,3}(\.\d{3}){2,}$/.test(s))s=s.replace(/\./g,'');}
    if(neg)s='-'+s;
  }
  var x=Number(s);return isFinite(x)?x:0;
}
function tk(v){var s=String(v==null?'':v).trim();return /^\d+\.0$/.test(s)?s.slice(0,-2):s;}
function ymdOf(v,SSF){
  if(v==null||v==='')return '';
  if(typeof v==='number'){
    var o=null;
    try{if(SSF&&SSF.parse_date_code)o=SSF.parse_date_code(v);}catch(e){o=null;}
    if(!o){var d0=new Date(Date.UTC(1899,11,30)+Math.floor(v)*864e5);o={y:d0.getUTCFullYear(),m:d0.getUTCMonth()+1,d:d0.getUTCDate()};}
    return o.y+'-'+pad(o.m)+'-'+pad(o.d);
  }
  if(v instanceof Date)return v.getFullYear()+'-'+pad(v.getMonth()+1)+'-'+pad(v.getDate());
  var s=String(v).trim(),m=s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/);
  if(m)return m[3]+'-'+pad(+m[2])+'-'+pad(+m[1]);
  m=s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m?m[1]+'-'+m[2]+'-'+m[3]:'';
}
function aliasKho(ma,ten){
  var k=String(ma||'').trim().toUpperCase();
  if(KHO_ALIAS[k])return KHO_ALIAS[k];
  return String(ten||ma||'').trim().replace(/^kho\s+/i,'')||k;
}
/* Tên hiển thị của kho: tên người dùng cấu hình (theo mã kho) > tên mặc định */
function nameOf(mk,ten,custom){
  var c=custom&&custom[String(mk||'').trim().toUpperCase()];
  c=c==null?'':String(c).trim();
  return c||aliasKho(mk,ten);
}
function mkIdx(mk){var i=KHO_ORDER_MK.indexOf(String(mk||'').trim().toUpperCase());return i<0?99:i;}
ANA.defaultName=aliasKho;
function nhomOf(ma,ten){
  var g=NHOM_GHIDE[nz(ten)];if(g)return g;
  var m=String(ma||'').trim().toUpperCase();
  if(/^H[ÀA]NG\s?T[ẶA]NG/.test(m)||nz(ten).indexOf('hang tang')===0)return 'Hàng tặng';
  return NHOM[m.slice(0,2)]||'Khác';
}
function classify(loai){
  var n=nz(loai);
  if(n.indexOf('mua hang')===0)return 'mua';
  if(n.indexOf('chuyen kho')>=0)return 'chuyen';
  if(n.indexOf('xuat kho khac')>=0)return 'xk';
  return 'khac';
}

/* ---- Đọc bảng (mảng các dòng) thành danh sách dòng chuẩn ---- */
ANA.parse=function(aoa,SSF,custom){
  var h=-1,i,j;
  for(i=0;i<Math.min(40,aoa.length);i++){
    var cells=(aoa[i]||[]).map(nz);
    if(cells.indexOf('ma hang')>=0&&cells.indexOf('loai chung tu')>=0){h=i;break;}
  }
  if(h<0)return {error:'Không thấy dòng tiêu đề của "Sổ chi tiết vật tư hàng hóa" (cần các cột Mã hàng, Loại chứng từ…).'};
  var hd=(aoa[h]||[]).map(nz),C={};
  function ix(n){return hd.indexOf(n);}
  var need=[['kho','ma kho'],['tenKho','ten kho'],['ma','ma hang'],['ten','ten hang'],['ngay','ngay hach toan'],['sct','so chung tu'],['loai','loai chung tu'],['tkk','tk kho'],['tkd','tk doi ung'],['nhap','nhap'],['xuat','xuat'],['ton','ton']],miss=[];
  need.forEach(function(p){var k=ix(p[1]);if(k<0)miss.push(p[1]);else C[p[0]]=k;});
  if(miss.length)return {error:'Thiếu cột: '+miss.join(', ')};
  C.dg=ix('dien giai');
  var start=h+1,sub=(aoa[h+1]||[]).map(nz);
  if(sub.indexOf('so luong')>=0||sub.indexOf('gia tri')>=0)start=h+2;
  var rows=[],months={},khos={},bad=0,ord=0;
  for(i=start;i<aoa.length;i++){
    var r=aoa[i];if(!r)continue;
    var ma=String(r[C.ma]==null?'':r[C.ma]).trim(),ng=ymdOf(r[C.ngay],SSF);
    if(!ma||!ng){if(ma||r[C.ngay])bad++;continue;}
    var ym=ng.slice(0,7),mk0=String(r[C.kho]==null?'':r[C.kho]).trim(),ten0=String(r[C.tenKho]==null?'':r[C.tenKho]).trim(),kho=nameOf(mk0,ten0,custom);
    var o={ord:ord++,mk:mk0,tenSo:ten0,kho:kho,ma:ma,ten:String(r[C.ten]==null?'':r[C.ten]).trim(),ngay:ng,ym:ym,
      sct:String(r[C.sct]==null?'':r[C.sct]).trim(),dg:C.dg>=0?String(r[C.dg]==null?'':r[C.dg]):'',
      nSL:num(r[C.nhap]),nGT:num(r[C.nhap+1]),xSL:num(r[C.xuat]),xGT:num(r[C.xuat+1]),tSL:num(r[C.ton]),tGT:num(r[C.ton+1]),
      loai:String(r[C.loai]==null?'':r[C.loai]).trim(),tkk:tk(r[C.tkk]),tkd:tk(r[C.tkd])};
    o.lc=classify(o.loai);o.nhom=nhomOf(ma,o.ten);
    rows.push(o);months[ym]=1;khos[kho]=(khos[kho]||0)+1;
  }
  if(!rows.length)return {error:'Không có dòng dữ liệu hợp lệ (cần Mã hàng và Ngày hạch toán).'};
  var P={rows:rows,months:Object.keys(months).sort(),khos:khos,skipped:bad};
  ANA.rename(P,custom);
  return P;
};
/* Đổi tên kho trên dữ liệu đã nạp (không cần nạp lại file). Trả về danh sách tên trùng nếu có. */
ANA.rename=function(P,custom){
  var L={},khos={};
  P.rows.forEach(function(r){
    r.kho=nameOf(r.mk,r.tenSo,custom);
    khos[r.kho]=(khos[r.kho]||0)+1;
    var k=r.mk.toUpperCase();
    if(!L[k])L[k]={mk:r.mk,tenSo:r.tenSo,def:aliasKho(r.mk,r.tenSo),name:r.kho,n:0};
    L[k].n++;
  });
  P.khos=khos;
  P.khoList=Object.keys(L).map(function(k){return L[k];}).sort(function(a,b){return mkIdx(a.mk)-mkIdx(b.mk)||(a.name<b.name?-1:1);});
  return P;
};
ANA.dupNames=function(P,custom){
  var seen={},dup={};
  P.khoList.forEach(function(k){var n=nameOf(k.mk,k.tenSo,custom);if(seen[n])dup[n]=1;seen[n]=1;});
  return Object.keys(dup);
};

function add(o,a,b,v){var x=o[a]||(o[a]={});x[b]=(x[b]||0)+v;}
function g(o,a,b){return (o[a]&&o[a][b])||0;}
function sumObj(o,b){var s=0;Object.keys(o).forEach(function(k){s+=g(o,k,b);});return s;}

/* ---- Tính toán chính ---- */
ANA.calc=function(P,opt){
  var R=P.rows,m1=opt.m1,m2=opt.m2,MS=[m1,m2];
  var ex=String(opt.excl||'').split(',').map(nz).filter(Boolean);
  function isEx(name){var n=nz(name);for(var i=0;i<ex.length;i++)if(n.indexOf(ex[i])>=0)return true;return false;}
  function inW(r){return r.ym===m1||r.ym===m2;}
  /* 1. TK 632x → cơ sở (kho có giá trị xuất lớn nhất với TK đó) */
  var acc={};
  R.forEach(function(r){if(r.lc==='xk'&&r.tkd.indexOf('632')===0)add(acc,r.tkd,r.kho,Math.abs(r.xGT));});
  var tkMap={},csSet={};
  Object.keys(acc).forEach(function(t){var best=null;Object.keys(acc[t]).forEach(function(k){if(!best||acc[t][k]>acc[t][best])best=k;});tkMap[t]=best;csSet[best]=1;});
  if(opt.tkMap)Object.keys(opt.tkMap).forEach(function(t){tkMap[t]=opt.tkMap[t];csSet[opt.tkMap[t]]=1;});
  /* 2. Nguồn điều chuyển theo số chứng từ */
  var srcBy={},srcVo={};
  R.forEach(function(r){if(r.lc==='chuyen'&&r.xGT>0){(srcBy[r.sct+'|'+r.ma]=srcBy[r.sct+'|'+r.ma]||{})[r.kho]=1;(srcVo[r.sct]=srcVo[r.sct]||{})[r.kho]=1;}});
  function srcOf(r){
    var a=srcBy[r.sct+'|'+r.ma],ks=a?Object.keys(a):[];if(ks.length===1)return ks[0];
    var b=srcVo[r.sct];ks=b?Object.keys(b):[];if(ks.length===1)return ks[0];
    return '(không xác định)';
  }
  /* 3. Mua, điều chuyển nhận, tiêu hao */
  var D={},KM={},C={},CCs={},CTong={},TH={},QL={},EXV={},NH_TH={},NH_MUA={},IT={},DCX={},m4Mua={};
  var khosAll={},mkOf={};
  R.forEach(function(r){
    khosAll[r.kho]=1;mkOf[r.kho]=r.mk;
    if(!inW(r))return;
    if(r.lc==='mua'){
      var isKM=r.tkd==='711',ek=isEx(r.ten);
      if(isKM){add(KM,r.kho,r.ym,r.nGT);if(!opt.km0&&!(opt.exMua&&ek)){add(D,r.kho,r.ym,r.nGT);add(NH_MUA,r.nhom,r.ym,r.nGT);}}
      else{
        if(ek)add(m4Mua,r.kho,r.ym,r.nGT);
        if(!(opt.exMua&&ek)){add(D,r.kho,r.ym,r.nGT);add(NH_MUA,r.nhom,r.ym,r.nGT);}
      }
    }else if(r.lc==='chuyen'&&r.nGT>0){
      var s=srcOf(r);
      add(DCX,s,r.kho+'|'+r.ym,r.nGT);
      if(opt.dc&&!(opt.exMua&&isEx(r.ten))){
        add(C,r.kho,r.ym,r.nGT);
        if(csSet[s])add(CCs,r.kho,r.ym,r.nGT);else add(CTong,r.kho,r.ym,r.nGT);
      }
    }else if(r.lc==='xk'){
      var cs=r.tkd.indexOf('632')===0?tkMap[r.tkd]:null;
      if(isEx(r.ten)){add(EXV,cs||('QLDN: '+r.kho),r.ym,r.xGT);return;}
      if(cs){add(TH,cs,r.ym,r.xGT);add(NH_TH,r.nhom,r.ym,r.xGT);
        var key=r.ma+'|'+r.ten;add(IT,key,r.ym,r.xGT);add(IT,key,'@'+cs+'|'+r.ym,r.xGT);IT[key].nhom=r.nhom;IT[key].ten=r.ten;}
      else add(QL,r.kho,r.ym,r.xGT);
    }
  });
  /* 4. Bảng theo kho */
  var ord=Object.keys(khosAll).sort(function(a,b){return mkIdx(mkOf[a])-mkIdx(mkOf[b])||(a<b?-1:1);});
  var csList=ord.filter(function(k){return csSet[k];}),otherList=ord.filter(function(k){return !csSet[k];});
  function rowOf(k){
    var isCs=!!csSet[k],o={kho:k,isCs:isCs};
    MS.forEach(function(m,i){
      var t=i?'2':'1';
      o['d'+t]=g(D,k,m);o['km'+t]=g(KM,k,m);o['c'+t]=g(C,k,m);o['cc'+t]=g(CCs,k,m);o['ct'+t]=g(CTong,k,m);
      o['t'+t]=o['d'+t]+o['c'+t];
      o['th'+t]=isCs?g(TH,k,m):g(QL,k,m);
      o['ch'+t]=isCs?o['t'+t]-o['th'+t]:null;
    });
    return o;
  }
  var rows=ord.map(rowOf),cs=rows.filter(function(r){return r.isCs;});
  function S(arr,f){var s=0;arr.forEach(function(r){s+=r[f];});return s;}
  var tot={
    muaThuc1:sumObj(D,m1),muaThuc2:sumObj(D,m2),km1:sumObj(KM,m1),km2:sumObj(KM,m2),
    cong1:S(rows,'t1'),cong2:S(rows,'t2'),
    cs:{d1:S(cs,'d1'),d2:S(cs,'d2'),c1:S(cs,'c1'),c2:S(cs,'c2'),t1:S(cs,'t1'),t2:S(cs,'t2'),th1:S(cs,'th1'),th2:S(cs,'th2')},
    ql1:sumObj(QL,m1),ql2:sumObj(QL,m2),
    th1:sumObj(TH,m1)+sumObj(QL,m1),th2:sumObj(TH,m2)+sumObj(QL,m2),
    ex1:sumObj(EXV,m1),ex2:sumObj(EXV,m2)
  };
  tot.cs.ch1=tot.cs.t1-tot.cs.th1;tot.cs.ch2=tot.cs.t2-tot.cs.th2;
  /* 5. Nhóm hàng & mặt hàng biến động */
  var nhom=Object.keys(NH_TH).map(function(n){return {nhom:n,a:g(NH_TH,n,m1),b:g(NH_TH,n,m2),ma:g(NH_MUA,n,m1),mb:g(NH_MUA,n,m2)};});
  Object.keys(NH_MUA).forEach(function(n){if(!NH_TH[n])nhom.push({nhom:n,a:0,b:0,ma:g(NH_MUA,n,m1),mb:g(NH_MUA,n,m2)});});
  nhom.sort(function(x,y){return y.b-x.b;});
  var items=Object.keys(IT).map(function(k){var o=IT[k];return {ten:o.ten,nhom:o.nhom,a:g(IT,k,m1),b:g(IT,k,m2),d:g(IT,k,m2)-g(IT,k,m1)};});
  items.sort(function(x,y){return y.d-x.d;});
  var movers={all:{up:items.filter(function(i){return i.d>0;}).slice(0,10),down:items.filter(function(i){return i.d<0;}).slice(-10).reverse()},byCs:{}};
  csList.forEach(function(c){
    var arr=[];Object.keys(IT).forEach(function(k){var a=g(IT,k,'@'+c+'|'+m1),b=g(IT,k,'@'+c+'|'+m2);if(a||b)arr.push({ten:IT[k].ten,nhom:IT[k].nhom,a:a,b:b,d:b-a});});
    arr.sort(function(x,y){return y.d-x.d;});
    movers.byCs[c]={up:arr.filter(function(i){return i.d>0;}).slice(0,3),down:arr.filter(function(i){return i.d<0;}).slice(-3).reverse()};
  });
  /* 6. Tồn kho theo sổ (số dư ghi trên từng dòng) */
  var byKey={};
  R.forEach(function(r){(byKey[r.kho+'|'+r.ma]=byKey[r.kho+'|'+r.ma]||[]).push(r);});
  var stock=[];
  Object.keys(byKey).forEach(function(k){
    var L=byKey[k],f=L[0],open=f.tGT-f.nGT+f.xGT,t0=open,t1,t2,i;
    function bal(pred){var v=null;for(i=0;i<L.length;i++)if(pred(L[i]))v=L[i].tGT;return v;}
    var b0=bal(function(r){return r.ym<m1;}),b1=bal(function(r){return r.ym<=m1;}),b2=bal(function(r){return r.ym<=m2;});
    t0=b0===null?open:b0;t1=b1===null?open:b1;t2=b2===null?t1:b2;
    var xall=0;L.forEach(function(r){if(inW(r)&&r.xGT>0)xall+=r.xGT;});
    stock.push({kho:f.kho,ma:f.ma,ten:f.ten,nhom:f.nhom,t0:t0,t1:t1,t2:t2,xall:xall});
  });
  var stockKho=ord.map(function(k){var o={kho:k,t0:0,t1:0,t2:0};stock.forEach(function(s){if(s.kho===k){o.t0+=s.t0;o.t1+=s.t1;o.t2+=s.t2;}});return o;});
  var stT={t0:0,t1:0,t2:0};stockKho.forEach(function(s){stT.t0+=s.t0;stT.t1+=s.t1;stT.t2+=s.t2;});
  function idleOf(filter){
    var I=stock.filter(function(s){return s.t2>0&&s.xall===0&&(!filter||filter(s));});
    var by={},bn={},v=0;
    I.forEach(function(s){v+=s.t2;by[s.kho]=by[s.kho]||{n:0,v:0};by[s.kho].n++;by[s.kho].v+=s.t2;bn[s.nhom]=(bn[s.nhom]||0)+s.t2;});
    I.sort(function(a,b){return b.t2-a.t2;});
    return {n:I.length,v:v,byKho:by,byNhom:bn,top:I.slice(0,20),all:I};
  }
  var idle=idleOf(null),idleEx=idleOf(function(s){return !isEx(s.ten);});
  /* 7. Ma trận điều chuyển: kho đi → kho nhận */
  var dcm=[];
  Object.keys(DCX).forEach(function(s){Object.keys(DCX[s]).forEach(function(k){var p=k.split('|');if(p[1]===m1||p[1]===m2)dcm.push({from:s,to:p[0],ym:p[1],v:DCX[s][k]});});});
  /* 8. Kiểm tra dữ liệu */
  var chk={other:{},neg:[],vmis:[],tkLech:{n:0,v:0,list:[]},hhtmTk:{},zeroX:0};
  var vo={};
  R.forEach(function(r){
    if(!inW(r))return;
    if(r.lc==='khac')chk.other[r.loai]=(chk.other[r.loai]||0)+1;
    if(r.tGT<0||r.tSL<0)chk.neg.push({kho:r.kho,ten:r.ten,ngay:r.ngay,sl:r.tSL,gt:r.tGT});
    if(r.lc==='chuyen'){var o=vo[r.sct]||(vo[r.sct]={n:0,x:0});o.n+=r.nGT;o.x+=r.xGT;}
    if(r.lc==='xk'&&r.tkd.indexOf('632')===0&&tkMap[r.tkd]!==r.kho&&r.tkk!=='1538'){chk.tkLech.n++;chk.tkLech.v+=r.xGT;if(chk.tkLech.list.length<8)chk.tkLech.list.push({kho:r.kho,cs:tkMap[r.tkd],ten:r.ten,v:r.xGT});}
    if(r.lc==='mua'&&/^90/.test(r.ma)&&r.tkk!=='1561')chk.hhtmTk[r.ym]=(chk.hhtmTk[r.ym]||0)+r.nGT;
    if(r.xSL>0&&r.xGT===0)chk.zeroX++;
  });
  Object.keys(vo).forEach(function(s){if(Math.round(vo[s].n)!==Math.round(vo[s].x))chk.vmis.push({sct:s,n:vo[s].n,x:vo[s].x});});
  return {m1:m1,m2:m2,opt:opt,tkMap:tkMap,csList:csList,otherList:otherList,rows:rows,tot:tot,nhom:nhom,items:items,movers:movers,
    stock:stock,stockKho:stockKho,stT:stT,idle:idle,idleEx:idleEx,dcm:dcm,chk:chk,m4Mua:m4Mua,
    ex:ex,exTH:{a:tot.ex1,b:tot.ex2}};
};
})();
