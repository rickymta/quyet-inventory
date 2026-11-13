/* Đề nghị thanh toán NCC — lõi tính toán thuần (dòng gốc 9972–10226, 10285, 10313–10357, 10398).
   Giữ NGUYÊN VĂN thuật toán; chỉ đổi truy cập biến toàn cục. */
/* eslint-disable */
import { db, X, norm, soThanhChu, saveSoon, rerender } from '../../core';

const rcNum = (v) => X.rcNum(v);
const rcDate = (v) => X.rcDate(v);

export var PAY={q:"",f:"all",sel:"",v:"",ed:"",ec:"all",m:"all",csOpen:0};
/* Lọc theo tháng (yyyymm hoặc "all"): tháng của phiếu = tháng HĐ MISA nếu đã khớp, nếu chưa thì tháng hạch toán của phiếu */
export function payInM(d){var m=PAY.m;return !m||m==="all"||!!(d&&Math.floor(d/100)===+m);}
export function payMLab(ym){ym=String(ym);return ym.slice(4)+"/"+ym.slice(0,4);}
export var PAY_CSL0=[["ND","Nghĩa Dũng"],["BTX","Bùi Thị Xuân"],["CL","Cát Linh"],["LVL","Lê Văn Lương"],["QN","Quảng Ninh"],["HO","Văn phòng"]],PAY_NGUONG_BK=4;
export var PAY_CFG0={nlap:"",pb:"Phòng Hành chính hậu cần",dv:"MEDDENTAL",dvcp:"HC115",ht:"Chuyển khoản",tgd:"Trần Phương Bình",ktt:"Nguyễn Thị Ngọc Anh",ql:"Nguyễn Văn Đại"};
export function payDb(){
  var p=db.pay;
  if(!p||typeof p!=="object"||!Array.isArray(p.mua))p=db.pay={ncc:[],mua:[],hd:[],at:0,file:""};
  if(!p.cfg||typeof p.cfg!=="object")p.cfg={};
  if(!p.notes||typeof p.notes!=="object"||Array.isArray(p.notes))p.notes={};
  if(!Array.isArray(p.csl))p.csl=null;
  if(p.csl)p.csl=p.csl.filter(function(c){return Array.isArray(c)&&c[0];});
  if(!p.csl||!p.csl.length)p.csl=PAY_CSL0.map(function(c){return c.slice();});
  for(var k in PAY_CFG0)if(typeof p.cfg[k]!=="string")p.cfg[k]=PAY_CFG0[k];
  return p;
}
export function payCsCodes(){return payDb().csl.map(function(c){return c[0];});}
export function payCsName(c){var l=payDb().csl;for(var i=0;i<l.length;i++)if(l[i][0]===c)return String(l[i][1]||"").trim();return "";}
export function payCsLabel(c){if(!c)return "Chưa rõ";var n=payCsName(c);return n?c+" - "+n:c;}
export function payCsFull(c){if(!c)return "Chưa rõ cơ sở";var n=payCsName(c);return n?n+" ("+c+")":c;}
export function payCsFromCt(ct){
  var s=String(ct||"").toUpperCase(),T=s.split(/[^A-Z0-9]+/).filter(Boolean),C=payCsCodes();
  for(var i=0;i<T.length;i++)if(C.indexOf(T[i])>=0)return T[i];
  var m=s.match(/NK\s*-\s*([A-Z]+)/);return m?m[1]:"";
}
export function payEcOk(c){return PAY.ec==="all"||(PAY.ec==="?"?!c:c===PAY.ec);}
export function payK(s){return norm(s).replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim();}
export function payN(v){var x=(typeof v==="number")?v:rcNum(v);return isNaN(x)?0:x;}
export function payD(v){var d=rcDate(v);return d?d.y*10000+d.m*100+d.d:0;}
export function payDs(n){return n?("0"+(n%100)).slice(-2)+"/"+("0"+Math.floor(n/100)%100).slice(-2)+"/"+Math.floor(n/10000):"";}
export function payHn(v){var s=String(v==null?"":v).replace(/\D/g,"");return s?String(parseInt(s,10)):"";}
export function payF(n){return Math.round(n||0).toLocaleString("vi-VN");}
export function payPri(n){return n>=50000000?"① CAO":(n>=10000000?"② T.Bình":"③ Thấp");}
export function payCol(m,p){for(var k in m)if(k.indexOf(p)===0)return m[k];return -1;}
export function payColAny(m,ps){for(var i=0;i<ps.length;i++){var c=payCol(m,ps[i]);if(c>=0)return c;}return -1;}
export function payHdr(rows,must){
  for(var i=0;i<Math.min(rows.length,12);i++){
    var m={};(rows[i]||[]).forEach(function(c,j){var k=payK(c);if(k&&m[k]==null)m[k]=j;});
    var ok=must.every(function(x){return payCol(m,x)>=0;});
    if(ok)return {i:i,m:m};
  }
  return null;
}
export function paySheet(wb,names){
  for(var i=0;i<wb.SheetNames.length;i++)if(names.indexOf(payK(wb.SheetNames[i]))>=0)return wb.Sheets[wb.SheetNames[i]];
  return null;
}
/* ----- Đọc file Excel mẫu ----- */
export function payParse(wb,part,kind){
  var rd=function(ws){return XLSX.utils.sheet_to_json(ws,{header:1,raw:true,defval:null,blankrows:false});};
  var sN=paySheet(wb,["danh muc ncc"]),sM=paySheet(wb,["mua hang"]),sH=paySheet(wb,["hoa don misa"]);
  if(part){
    if(kind===1&&!sM)sM=wb.Sheets[wb.SheetNames[0]];
    if(kind===2&&!sH)sH=wb.Sheets[wb.SheetNames[0]];
    if(kind===1)sH=null;
    if(kind===2)sM=null;
    if(!sM&&!sH)throw new Error("Không thấy sheet MUA_HANG hoặc HOA_DON_MISA. Nếu file chỉ có 1 sheet, dùng nút “Chỉ Mua hàng” hoặc “Chỉ HĐ MISA”.");
  }else if(!sM||!sH)throw new Error("Thiếu sheet MUA_HANG hoặc HOA_DON_MISA");
  var out={ncc:[],mua:[],hd:[]};
  if(sN){
    var rn=rd(sN),hn=payHdr(rn,["ten goi tat","ten day du"]);
    if(hn){
      var c=function(p){return payCol(hn.m,p);},cs=c("ten goi tat"),cf=c("ten day du"),ct=c("so tai khoan"),cb=c("ngan hang"),cc=c("chi nhanh"),cg=c("ghi chu"),cm=c("ten doi chieu");
      for(var i=hn.i+1;i<rn.length;i++){
        var r=rn[i],g=function(j){return j>=0&&r[j]!=null?String(r[j]).trim():"";};
        if(!g(cs)&&!g(cf))continue;
        out.ncc.push([g(cs),g(cf),g(ct),g(cb),g(cc),g(cg),g(cm)]);
      }
    }
  }
  var rm=sM?rd(sM):[],hm=sM?payHdr(rm,["so chung tu","so hoa don","nha cung cap"]):null;
  if(sM&&!hm)throw new Error("Không thấy dòng tiêu đề ở sheet MUA_HANG");
  var m=hm?hm.m:{},ix={d:payCol(m,"ngay hach toan"),ct:payCol(m,"so chung tu"),hd:payCol(m,"so hoa don"),n:payCol(m,"nha cung cap"),t:payCol(m,"tong tien thanh toan"),v:payCol(m,"gia tri nhap kho"),nc:payCol(m,"ncc chuan"),hc:payCol(m,"so hd chuan"),cs:payCol(m,"ma co so"),nt:payColAny(m,["ghi chu loi","loi co so","loi nhap","ghi chu co so"])};
  var gv=function(r,j){return j>=0?r[j]:null;};
  for(var a=hm?hm.i+1:0;a<rm.length;a++){
    var r2=rm[a],ncc=String(gv(r2,ix.nc)||gv(r2,ix.n)||"").trim(),tong=payN(gv(r2,ix.t)),tr=payN(gv(r2,ix.v));
    var hn1=payHn(gv(r2,ix.hc)!=null&&gv(r2,ix.hc)!==""?gv(r2,ix.hc):gv(r2,ix.hd));
    if(!ncc||(!tong&&!tr&&!hn1))continue;
    if(!tong)tong=tr;
    var sct=String(gv(r2,ix.ct)||"").trim(),cs=String(gv(r2,ix.cs)||"").trim().toUpperCase();
    if(!cs)cs=payCsFromCt(sct);
    out.mua.push([payD(gv(r2,ix.d)),sct,String(gv(r2,ix.hd)||"").trim(),String(gv(r2,ix.n)||"").trim(),tong,tr||tong,hn1,cs,ncc,String(gv(r2,ix.nt)||"").trim()]);
  }
  var rh=sH?rd(sH):[],hh=sH?payHdr(rh,["so chung tu","so hoa don","nha cung cap","gia tri hoa don"]):null;
  if(sH&&!hh)throw new Error("Không thấy dòng tiêu đề ở sheet HOA_DON_MISA");
  var q=hh?hh.m:{},jx={d:payCol(q,"ngay hach toan"),ct:payCol(q,"so chung tu"),hd:payCol(q,"so hoa don"),n:payCol(q,"nha cung cap"),g:payCol(q,"gia tri hoa don"),th:payCol(q,"thue gtgt"),t:payCol(q,"tong tien thanh toan"),nc:payCol(q,"ncc chuan"),hc:payCol(q,"so hd chuan")};
  for(var b=hh?hh.i+1:0;b<rh.length;b++){
    var r3=rh[b],nc3=String(gv(r3,jx.nc)||gv(r3,jx.n)||"").trim(),gt=payN(gv(r3,jx.g)),th=payN(gv(r3,jx.th)),t3=payN(gv(r3,jx.t))||(gt+th);
    var hn3=payHn(gv(r3,jx.hc)!=null&&gv(r3,jx.hc)!==""?gv(r3,jx.hc):gv(r3,jx.hd));
    if(!nc3||(!t3&&!hn3))continue;
    out.hd.push([payD(gv(r3,jx.d)),String(gv(r3,jx.ct)||"").trim(),String(gv(r3,jx.hd)||"").trim(),String(gv(r3,jx.n)||"").trim(),gt||t3,th,t3,hn3,nc3]);
  }
  if(part){if(!out.mua.length&&!out.hd.length)throw new Error("Không có dòng dữ liệu nào trong file");}
  else if(!out.mua.length)throw new Error("MUA_HANG chưa có dòng dữ liệu nào");
  return out;
}
/* ----- Bổ sung dữ liệu: chỉ THÊM dòng mới, bỏ dòng trùng, không xóa / sửa dòng cũ ----- */
export function payHKey(h){return [h[1]||"",h[7]||"",payK(h[8]),Math.round(h[6]||0)].join("|");}
export function payMerge(o,fname){
  var P=payDb(),had={},hadH={},st={mua:{add:0,dup:0},hd:{add:0,dup:0},ncc:{add:0,upd:0}};
  var snap={mua:P.mua.length,hd:P.hd.length,ncc:JSON.stringify(P.ncc)};
  P.mua.forEach(function(r){had[payNKey(r)]=1;});
  P.hd.forEach(function(h){hadH[payHKey(h)]=1;});
  o.mua.forEach(function(r){if(had[payNKey(r)])st.mua.dup++;else{P.mua.push(r);st.mua.add++;}});
  o.hd.forEach(function(h){if(hadH[payHKey(h)])st.hd.dup++;else{P.hd.push(h);st.hd.add++;}});
  o.ncc.forEach(function(n){
    var ix=-1,a=payK(n[0]),b=payK(n[1]);
    P.ncc.forEach(function(e,i){if(ix<0&&((a&&payK(e[0])===a)||(b&&payK(e[1])===b)))ix=i;});
    if(ix<0){P.ncc.push(n);st.ncc.add++;return;}
    var e=P.ncc[ix],ch=0;
    for(var j=2;j<7;j++)if(!String(e[j]||"").trim()&&String(n[j]||"").trim()){e[j]=n[j];ch=1;}
    if(ch)st.ncc.upd++;
  });
  if(st.mua.add||st.hd.add||st.ncc.add||st.ncc.upd){P.undo=snap;P.last={at:Date.now(),file:fname,mua:st.mua,hd:st.hd,ncc:st.ncc};P.at=Date.now();}
  return st;
}
/* ----- Đối chiếu Mua hàng ⇄ HĐ MISA (khóa: NCC → số HĐ → giá trị) ----- */
export function payCompute(){
  var P=payDb(),dm={},G={};
  P.ncc.forEach(function(n,i){[n[1],n[0],n[6]].forEach(function(s){var k=payK(s);if(k&&dm[k]==null)dm[k]=i;});});
  function gk(raw){
    var k=payK(raw);if(!k)return null;var di=dm[k];
    var key=di==null?"x"+k:"d"+di,g=G[key];
    if(!g){var n=di==null?null:P.ncc[di];g=G[key]={key:key,di:di==null?-1:di,short:n&&n[0]||raw,full:n&&n[1]||raw,stk:n?n[2]:"",bank:n?n[3]:"",cn:n?n[4]:"",mua:[],hd:[]};}
    return g;
  }
  P.mua.forEach(function(r){if(!r[7])r[7]=payCsFromCt(r[1]);var g=gk(r[8]);if(g)g.mua.push(r);});
  P.hd.forEach(function(r){var g=gk(r[8]);if(g)g.hd.push(r);});
  var list=[];
  Object.keys(G).forEach(function(key){
    var g=G[key],byN={},cnt={},seen={};
    g.hd.forEach(function(h){(byN[h[7]]=byN[h[7]]||[]).push(h);});
    g.mua.forEach(function(r){if(r[6])cnt[r[6]]=(cnt[r[6]]||0)+1;});
    g.rows=[];g.extra=[];g.chot=0;g.tong=0;g.bad=0;g.nNote=0;
    g.mua.forEach(function(r){
      var hs=r[6]?byN[r[6]]:null,h=hs?hs[0]:null,st="ok";
      if(!r[6])st="noHd";else if(!h)st="missing";else if(cnt[r[6]]>1)st="dup";else if(Math.abs(h[6]-r[4])>0.5)st="diff";
      if(r[6])seen[r[6]]=1;
      var row={r:r,h:h,st:st,d:(h&&h[0])||r[0],tong:r[4],vat:h?h[5]:Math.max(0,r[4]-r[5]),pre:h?h[4]:r[5],note:payNoteGet(r)};
      if(!payInM(row.d))return;
      g.rows.push(row);g.tong+=r[4];if(st==="ok")g.chot+=r[4];else g.bad++;if(row.note)g.nNote++;
    });
    g.hd.forEach(function(h){if(!seen[h[7]]&&h[6]&&payInM(h[0])){g.extra.push(h);g.bad++;}});
    /* Sắp xếp số hóa đơn từ nhỏ đến lớn (lấy cụm số cuối: 00003324, C26TAA/3324 → 3324); phiếu chưa có số xếp cuối */
    var hdN=function(v){var m=String(v==null?"":v).match(/(\d+)\D*$/);return m?parseInt(m[1],10):NaN;},
        hdCmp=function(a,b){var x=hdN(a),y=hdN(b),nx=isNaN(x),ny=isNaN(y);if(nx!==ny)return nx?1:-1;if(!nx&&x!==y)return x-y;return String(a||"").localeCompare(String(b||""),"vi",{numeric:true});};
    g.rows.sort(function(a,b){return hdCmp(a.r[2],b.r[2])||((a.d||0)-(b.d||0));});
    g.extra.sort(function(a,b){return hdCmp(a[2],b[2]);});
    g.nOk=g.rows.filter(function(x){return x.st==="ok";}).length;
    g.extraSum=g.extra.reduce(function(s,h){return s+h[6];},0);
    g.khop=g.rows.length>0&&!g.bad;
    var cs={},mo={},mx=0;
    g.rows.forEach(function(x){if(x.r[7])cs[x.r[7]]=1;if(x.d){mo[Math.floor(x.d/100)]=1;if(x.d>mx)mx=x.d;}});
    g.cs=payCsCodes().filter(function(c){return cs[c];}).concat(Object.keys(cs).filter(function(c){return payCsCodes().indexOf(c)<0;}));
    g.months=Object.keys(mo).sort();g.mx=mx;
    g.thang=mx?Math.floor(mx/100)%100:0;g.nam=mx?Math.floor(mx/10000):0;
    g.pri=payPri(g.chot);
    if(g.rows.length)list.push(g);
  });
  list.sort(function(a,b){return a.full.localeCompare(b.full,"vi");});
  return list;
}
/* ----- Ghi chú lỗi cơ sở theo từng phiếu mua (nhập tay trong app hoặc đọc từ cột "Ghi chú lỗi" của MUA_HANG) ----- */
export var PAY_LOI=["Thiếu nhập kho","Thiếu phiếu giao hàng","Thiếu chứng từ/chữ ký","Sai số lượng/đơn giá","Sai cơ sở nhận hàng"];
export var PAY_LOI_KW=[["nhap kho"],["giao hang","pgh"],["chung tu","chu ky","bien ban"],["so luong","don gia"],["sai co so"]];
export function payNKey(r){return [r[1]||"",r[6]||payHn(r[2])||"",payK(r[8]),Math.round(r[4]||0)].join("|");}
export function payNoteFromText(x){var k=norm(x),o=[];PAY_LOI.forEach(function(t,i){if(PAY_LOI_KW[i].some(function(w){return k.indexOf(w)>=0;}))o.push(t);});return o;}
export function payNoteGet(r){
  var m=payDb().notes[payNKey(r)];
  if(m){return ((m.t&&m.t.length)||String(m.x||"").trim())?{t:m.t||[],x:String(m.x||""),imp:0}:null;}
  var x=String(r[9]||"").trim();return x?{t:[],x:x,imp:1}:null;
}
export function payNoteErrs(n){
  var s=n.imp?"File Excel":"Ghi chú tay",x=String(n.x||"").trim(),T=(n.t&&n.t.length)?n.t:(n.imp?payNoteFromText(x):[]);
  if(T.length)return T.map(function(t){return {k:t,d:n.imp?x:t+(x?" — "+x:""),s:s};});
  return x?[{k:"Khác",d:x,s:s}]:[];
}
export function payNoteRow(gk,i){var g=payCompute().filter(function(z){return z.key===gk;})[0];return g&&g.rows[i]?g.rows[i].r:null;}
export function payNoteMut(gk,i,fn){
  var r=payNoteRow(gk,i);if(!r)return false;
  var P=payDb(),k=payNKey(r),n=P.notes[k];
  if(!n){var c=payNoteGet(r);n={t:[],x:c&&c.imp?c.x:"",ok:0,at:0};}
  fn(n);n.at=Date.now();
  if(!n.t.length&&!String(n.x||"").trim()&&!r[9]&&!n.ok)delete P.notes[k];else P.notes[k]=n;
  saveSoon();return true;
}
export function payOkGet(r){var m=payDb().notes[payNKey(r)];return !!(m&&m.ok&&!((m.t&&m.t.length)||String(m.x||"").trim()));}
export var PAY_CSN={ND:"nghia dung",BTX:"bui thi xuan",CL:"cat linh",LVL:"le van luong",QN:"quang ninh",HO:"van phong tru so"};
export function payRowHay(x,g){
  var r=x.r,cs=r[7]||"",nt=x.note?payNoteErrs(x.note).map(function(z){return z.d;}).join(" "):"";
  return norm([g.short,g.full,r[1],r[2],r[6],payDs(r[0]),payDs(x.d),cs,payCsName(cs),r[3],r[8],Math.round(r[4]||0),payF(r[4]),Math.round(r[5]||0),payF(r[5]),x.h?x.h[2]:"",nt,x.note?"thieu chung tu loi ghi chu":(payOkGet(r)?"chung tu du":"")].join(" "));
}
export function payHits(L,q){
  var T=norm(q).split(" ").filter(Boolean),o=[];
  L.forEach(function(g){g.rows.forEach(function(x,i){
    var hay=payRowHay(x,g);
    if(T.every(function(t){var d=/^[\d.,]+$/.test(t)?t.replace(/[.,]/g,""):"";return hay.indexOf(t)>=0||(d&&hay.indexOf(d)>=0);}))if(payEcOk(x.r[7]))o.push({g:g,x:x,i:i});
  });});
  return o;
}
export function payKeep(){var y=window.scrollY;rerender();requestAnimationFrame(function(){window.scrollTo(0,y);});}
export function payContent(g){
  var c=g.cs.length>1?g.cs.slice(0,-1).join(", ")+" và "+g.cs[g.cs.length-1]:(g.cs[0]||"");
  return "Thanh toán chi phí mua vật tư tháng "+g.thang+(c?" cho cơ sở "+c:"")+".";
}
export function paySoHd(g){
  return g.rows.length>=PAY_NGUONG_BK?"Theo bảng kê đính kèm ("+g.rows.length+" hóa đơn)":g.rows.map(function(x){return payHn(x.r[2])||x.r[2];}).filter(Boolean).join(", ");
}
export function payCheck(g){
  var c=[],noStk=!g.stk;
  c.push([!noStk,"1. Số tài khoản",noStk?"✖ Thiếu STK - cần bổ sung":"✔ Có STK / không cần"]);
  c.push([g.months.length<=1,"2. Kỳ hóa đơn",g.months.length<=1?"✔ Cùng 1 tháng":"⚠ Nhiều tháng: "+g.months.map(function(m){return m.slice(4)+"/"+m.slice(0,4);}).join(", ")]);
  var nb=g.rows.filter(function(x){return x.st!=="ok";}).length,ne=g.extra.length;
  c.push([g.khop,"3. Đối chiếu công nợ",g.khop?"✔ Đã khớp - đủ điều kiện chốt":"✖ Lệch: "+[nb?nb+" phiếu mua chưa khớp":"",ne?ne+" HĐ MISA thừa ("+payF(g.extraSum)+" đ)":""].filter(Boolean).join(" · ")]);
  var nh=g.rows.filter(function(x){return x.h;}).length;
  c.push([nh===g.rows.length,"4. Dữ liệu hóa đơn",nh===g.rows.length?"✔ "+nh+" hóa đơn trong hệ thống":"✖ "+(g.rows.length-nh)+"/"+g.rows.length+" phiếu chưa có HĐ MISA"]);
  c.push([!g.nNote,"5. Ghi chú lỗi cơ sở",g.nNote?"⚠ "+g.nNote+" phiếu có ghi chú lỗi - xử lý với cơ sở trước khi trình ký":"✔ Không có ghi chú lỗi"]);
  var all=c.every(function(x){return x[0];});
  return {items:c,ok:all,end:all?"✔ SẴN SÀNG trình ký":"⚠ CẦN KIỂM TRA"};
}
export var PAY_ST={ok:["Khớp","green"],noHd:["Thiếu số HĐ","red"],missing:["Chưa có HĐ MISA","red"],dup:["Trùng số HĐ","orange"],diff:["Sai giá trị","red"],extra:["HĐ MISA thừa","amber"]};
export function payMonths(){
  var keep=PAY.m,c={};PAY.m="all";
  try{
    payCompute().forEach(function(g){
      g.rows.forEach(function(x){if(x.d){var k=Math.floor(x.d/100);c[k]=(c[k]||0)+1;}});
      g.extra.forEach(function(h){if(h[0]){var k=Math.floor(h[0]/100);c[k]=(c[k]||0)+1;}});
    });
  }finally{PAY.m=keep;}
  return Object.keys(c).map(Number).sort(function(a,b){return b-a;}).map(function(k){return [String(k),c[k]];});
}
export function payAttn(g){return !g.khop||(!g.stk&&g.chot>0)||g.nNote>0;}
export var PAY_ZALO_MAX=1800;
export function payErrAll(){
  var L=payCompute(),by={};
  function box(cs){var k=cs||"";return by[k]||(by[k]={cs:k,items:[]});}
  function l2(ct,hd,d,t,lb){return [ct?(lb||"Phiếu")+" "+ct:"",hd?"HĐ "+hd:"",d?payDs(d):"",t?payF(t)+" đ":""].filter(Boolean).join(" · ");}
  function A1(k,d){return {k:k,d:d||k,s:"Đối chiếu"};}
  L.forEach(function(g){
    var cnt={};g.mua.forEach(function(r){if(r[6])cnt[r[6]]=(cnt[r[6]]||0)+1;});
    g.rows.forEach(function(x){
      var r=x.r,e=[];
      if(!r[6])e.push(A1("Thiếu số hóa đơn"));
      else if(!x.h)e.push(A1("HĐ chưa có trong MISA","Số HĐ "+r[6]+" chưa có trong MISA (chưa có hóa đơn hoặc nhập sai số)"));
      else if(cnt[r[6]]>1)e.push(A1("Số HĐ trùng","Số HĐ nhập trùng ("+cnt[r[6]]+" phiếu cùng số HĐ)"));
      else if(x.st==="diff")e.push(A1("Sai giá trị","Sai giá trị: phiếu mua "+payF(r[4])+" đ, HĐ MISA "+payF(x.h[6])+" đ (lệch "+payF(Math.abs(x.h[6]-r[4]))+" đ)"));
      if(!r[0])e.push(A1("Thiếu ngày hạch toán"));
      if(!r[7])e.push(A1("Thiếu mã cơ sở"));
      if(x.note)e=e.concat(payNoteErrs(x.note));
      if(e.length)box(r[7]).items.push({ncc:g.short,d:r[0],ct:r[1],hd:r[6]||r[2],t:r[4],l2:l2(r[1],r[6]||r[2],r[0],r[4]),e:e});
    });
    g.extra.forEach(function(h){box("").items.push({ncc:g.short,d:h[0],ct:h[1],hd:h[7]||h[2],t:h[6],l2:l2(h[1],h[7]||h[2],h[0],h[6],"Chứng từ MISA"),e:[A1("HĐ MISA thừa","Có trong MISA nhưng chưa có phiếu mua hàng")]});});
  });
  var ord=payCsCodes().filter(function(c){return by[c];}).concat(Object.keys(by).filter(function(c){return c&&payCsCodes().indexOf(c)<0;}).sort());
  if(by[""])ord.push("");
  return ord.map(function(c){
    var B=by[c];
    B.items.sort(function(a,b){return a.ncc.localeCompare(b.ncc,"vi")||(a.d-b.d);});
    B.parts=payZaloParts(B);
    return B;
  });
}
export function payZaloParts(B){
  var C=payDb().cfg,n=B.items.length,pb=C.pb||"Phòng Hành chính hậu cần";
  var head=B.cs?"Chào cơ sở "+payCsFull(B.cs)+",\n"+pb+" vừa rà soát dữ liệu mua hàng, có "+n+" dòng cần cơ sở kiểm tra và chỉnh lại trên MISA:"
    :"Chào các cơ sở,\n"+pb+" vừa rà soát dữ liệu mua hàng, có "+n+" dòng chưa xác định được cơ sở. Cơ sở nào nhận hàng / nhập phiếu nhờ kiểm tra giúp:";
  var foot="\n\nChỉnh xong cơ sở báo lại để phòng đối chiếu lại. Cảm ơn!\n— "+payNguoiLap()+" ("+pb+")";
  var blocks=B.items.map(function(it,i){return "\n\n"+(i+1)+". "+it.ncc+(it.l2?"\n    "+it.l2:"")+"\n    ➜ "+it.e.map(function(z){return z.d;}).join("; ");});
  var parts=[],cur=head,nb=0,rs=foot.length+20;
  blocks.forEach(function(b){
    if(nb>0&&cur.length+b.length+rs>PAY_ZALO_MAX){parts.push(cur);cur="(tiếp theo)";nb=0;}
    cur+=b;nb++;
  });
  parts.push(cur+foot);
  var tot=parts.length;
  return tot>1?parts.map(function(t,i){return "["+(i+1)+"/"+tot+"] "+t;}):parts;
}
export function payNguoiLap(){var C=payDb().cfg;return C.nlap||(db.profile&&db.profile.ten)||"Mai Văn Quyết";}
