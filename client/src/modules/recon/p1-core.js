/* Lõi đối chiếu V5/V8 — phần logic thuần (dòng gốc 8254–8946). Thuật toán giữ nguyên văn, chỉ đổi cách truy cập biến toàn cục. */
import { db, S, norm, stok, smatch } from '../../core';
import { RC_SEED } from './p1-seed.js';
export { RC_SEED };
export const RC_LD=["Muộn kỳ","Liên cơ sở","Bảo hành","Phác đồ duyệt","Sai PID","Ký gửi","Khác"];
export const RC_LX=["Xuất trước - DT sau","Xuất nhầm","Ký gửi","Hao hụt/hỏng","Chưa gắn PID","Bảo hành","Khác"];
export const RC_ST=["Chờ duyệt","Đã duyệt","Không duyệt"];
export const RC_TABS=[["sum","Tổng quan"],["list","Ca lệch"],["chk","Kiểm tra DL"],["map","Cấu hình"],["imp","Nhập/Xuất"],["apx","Phụ lục"]];
export const RC_KEYS=["cs","th","q","side","only","mode","map","yr","ap"];
/* V5: bỏ "nhóm vật tư". Cấu hình chính = bảng cfg (dịch vụ → vật tư xuất + định mức + mã/tên thay thế). dm = định mức theo từ khóa (ghi đè SL cần). cs = chuẩn hóa cơ sở */
export const RC_MAPS={cfg:["Định mức dịch vụ → vật tư xuất"],dm:["Định mức theo từ khóa (ghi đè SL cần)","Từ khóa dịch vụ","Số lượng"],cs:["Chuẩn hóa cơ sở","Tên gốc","Tên chuẩn"]};
export const RC_CF=[["dv","Dịch vụ (tên đầy đủ hoặc từ khóa)"],["ma","Mã vật tư xuất"],["ten","Tên vật tư xuất"],["dm","Định mức (SL / 1 dịch vụ)"],["alt","Mã / tên thay thế (cách nhau bằng ;)"],["gia","Đơn giá VND (tuỳ chọn)"]];
/* tiêu đề cột nhận diện khi nhập file (đã bỏ dấu, chữ thường) */
export const RC_HD={
  dt:{cs:["co so","chi nhanh","don vi"],pid:["ma kh","ma khach hang","pid","ma kh (pid)","ma benh nhan"],kh:["khach hang","ten khach hang","ten kh","benh nhan"],bs:["bac si"],ngay:["ngay dv","ngay dich vu","ngay","ngay thuc hien"],dv:["dich vu","ten dich vu"],mvt:["ma vat tu"],sl:["sl dich vu","so luong dich vu","so luong","sl"],dt:["doanh thu","doanh thu (vnd)","gia tri dt","gia tri doanh thu","thanh tien"]},
  xk:{cs:["co so","chi nhanh","don vi","kho"],pid:["ma kh","ma khach hang","pid","ma kh (pid)"],ma:["ma vat tu","ma hang","ma vt"],ten:["ten vat tu","ten hang","ten vt"],ngay:["ngay xuat","ngay hach toan","ngay"],so:["so ct","so chung tu","so phieu"],dg:["dien giai","dien giai chung","noi dung"],dvt:["dvt","don vi tinh"],ct:["loai ct","loai chung tu"],sl:["sl xuat","so luong xuat","so luong","sl"]}
};
if (S.RC_RES === undefined) S.RC_RES = null;
export const RC={mf:1,mlim:60,mq:"",mx:"",tab:0,cs:"Tất cả",th:"Tất cả",q:"",lim:40,side:0,only:1,mode:"replace",map:"cfg",co:{},cfgG:[],apxK:[],yr:"Tất cả",ap:"mat"};
export function rcSeedCfg(M){
  var out=[],seen={},gp={},vtG={};
  (M.grp||[]).forEach(function(g){gp[g[0]]=+g[3]||0;});
  (M.vt||[]).forEach(function(r){(vtG[r[1]]=vtG[r[1]]||[]).push(r[0]);});
  (M.dv||[]).forEach(function(r){
    var dv=String(r[0]||"").trim(),ten=String(r[1]||"").trim();if(!dv||!ten)return;
    var key=rcK(dv)+"|"+rcK(ten);if(seen[key])return;seen[key]=1;
    var al=[],dup={};dup[rcK(ten)]=1;
    (vtG[r[2]]||[]).forEach(function(n){var k=rcK(n);if(!dup[k]){dup[k]=1;al.push(n);}});
    out.push({dv:dv,ma:"",ten:ten,dm:1,alt:al.join("; "),gia:gp[r[2]]||0});
  });
  return out;
}
export function rcDb(){
  var r=db.recon;
  if(!r||!r.maps){r=db.recon={maps:JSON.parse(JSON.stringify(RC_SEED)),dt:[],xk:[],notes:{}};}
  if(!Array.isArray(r.cfg))r.cfg=rcSeedCfg(r.maps);
  if(!r.opt||typeof r.opt!=="object")r.opt={cs:0,th:0};
  if(!Array.isArray(r.maps.dm))r.maps.dm=JSON.parse(JSON.stringify(RC_SEED.dm));
  if(!Array.isArray(r.maps.cs))r.maps.cs=JSON.parse(JSON.stringify(RC_SEED.cs));
  return r;
}
export function rcK(s){return String(s==null?"":s).trim().toLowerCase();}
export function rcNum(v){if(typeof v==="number")return v;var s=String(v==null?"":v).trim();if(/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s))s=s.replace(/\./g,"").replace(",",".");else s=s.replace(/,/g,"");return parseFloat(s.replace(/[^\d.\-]/g,""))||0;}
export function rcF(n){return Math.round(n||0).toLocaleString("vi-VN");}
export function rcDate(v){
  if(v==null||v==="")return null;
  if(v instanceof Date)return {d:v.getDate(),m:v.getMonth()+1,y:v.getFullYear()};
  if(typeof v==="number"){var o=window.XLSX.SSF.parse_date_code(v);return o?{d:o.d,m:o.m,y:o.y}:null;}
  var s=String(v).trim(),m=s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/);
  if(m)return {d:+m[1],m:+m[2],y:+m[3]};
  m=s.match(/^(\d{4})-(\d{2})-(\d{2})/);return m?{d:+m[3],m:+m[2],y:+m[1]}:null;
}
export function rcDStr(v){var d=rcDate(v);return (typeof v==="string")?v.trim():(d?("0"+d.d).slice(-2)+"/"+("0"+d.m).slice(-2)+"/"+d.y:"");}
export function rcToday(){var d=new Date();return ("0"+d.getDate()).slice(-2)+"/"+("0"+(d.getMonth()+1)).slice(-2)+"/"+d.getFullYear();}
/* mã vật tư (hoặc tên nếu chưa có mã) = khóa nhận diện 1 vật tư */
export function rcVid(c){return norm(c.ma)||norm(c.ten);}
/* tập "mã/tên được chấp nhận" của 1 dòng cấu hình: mã + tên + mã/tên thay thế */
export function rcTok(c){var o={},a=[c.ma,c.ten];String(c.alt||"").split(/[;\n|]/).forEach(function(s){a.push(s);});a.forEach(function(s){var k=norm(s);if(k)o[k]=1;});return o;}
export function rcHit(a,b){for(var k in b)if(a[k])return true;return false;}
export function rcDm(c){var v=c.dm;return (v===""||v==null||isNaN(+v))?1:+v;}
/* ----- Bộ máy đối chiếu V5 -----
   Khớp khi: đúng mã KH (PID) + đúng vật tư xuất (mã/tên theo cấu hình, gồm cả mã/tên thay thế) + đúng số lượng.
   SL cần = định mức × SL dịch vụ (hoặc số ở bảng "định mức theo từ khóa" nếu dịch vụ chứa từ khóa đó). */
export function rcCompute(){
  var R=rcDb(),M=R.maps,O=R.opt,N=R.notes,cfg=R.cfg,csM={};
  M.cs.forEach(function(r){csM[rcK(r[0])]=r[1];});
  function ccs(a){var t=String(a||"").trim();return csM[rcK(t)]||t;}
  function cpid(a){if(a===""||a==null)return "";var m=String(a).match(/\d+/),n=m?parseInt(m[0],10):0;return n?"PID"+String(n).padStart(7,"0"):"";}
  function appr(id){var n=N[id];return !!(n&&(n.st==="Đã duyệt"||n.st==="Đã xử lý"));}
  function kwQty(s){var t=rcK(s),res=0;(M.dm||[]).forEach(function(d){var k=rcK(d[0]);if(k&&t.indexOf(k)>=0)res=+d[1]||0;});return res;}
  var info=cfg.map(function(c){return {vid:rcVid(c),tok:rcTok(c)};});
  var vidName={},vidPrice={},tokVid={},vids=[];
  cfg.forEach(function(c,i){var v=info[i].vid;if(!v)return;
    if(!vidName[v]){vidName[v]=c.ten||c.ma;vids.push(v);}
    if(!vidPrice[v]&&+c.gia)vidPrice[v]=+c.gia;
    for(var t in info[i].tok)if(!tokVid[t])tokVid[t]=v;});
  var rcache={};
  function rulesFor(svc){
    var t=norm(svc);if(rcache[t]!==undefined)return rcache[t];
    var best="",bs=-1;
    cfg.forEach(function(c){var k=norm(c.dv);if(!k)return;var sc=k===t?1e6:(t.indexOf(k)>=0?k.length:-1);if(sc>=0&&sc>=bs){bs=sc;best=k;}});
    var res=null;
    if(bs>=0){res=[];cfg.forEach(function(c,i){if(norm(c.dv)===best)res.push(i);});}
    return rcache[t]=res;
  }
  var cases=[],rows=[],gmap={},gby={},pidAll={},svcMiss={};
  R.dt.forEach(function(r,i){
    var d=rcDate(r.ngay),svc=String(r.dv||"").trim(),cs=ccs(r.cs),pid=cpid(r.pid),mo=d?d.m:"";
    rows.push({r:r,cs:cs,mo:mo,i:i});
    function ph(T,why){cases.push({i:i,r:r,cs:cs,pid:pid,mo:mo,first:false,none:true,bad:false,need:0,ok:false,T:T,why:why,ten:"",ri:-1,nid:r.id,fin:T,O:0,P:0,Q:0,R:0,rowFirst:true});}
    if(pid)pidAll[pid]=1;
    if(!pid){ph("THIẾU MÃ KH (PID)","Dòng doanh thu chưa có mã khách hàng nên không đối chiếu được.");return;}
    var list=[],ov=null;
    if(r.ov){
      var f=-1;cfg.forEach(function(c,ci){if(f<0&&(norm(c.ten)===norm(r.ov)||(c.ma&&norm(c.ma)===norm(r.ov))))f=ci;});
      if(f>=0)list=[{c:cfg[f],ci:f}];else list=[{c:{dv:svc,ma:"",ten:r.ov,dm:1,alt:"",gia:0},ci:-1}];
    }else if(svc){
      var ix=rulesFor(svc);
      if(ix)list=ix.map(function(ci){return {c:cfg[ci],ci:ci};});
      else{svcMiss[svc]=(svcMiss[svc]||0)+1;ph("CHƯA CẤU HÌNH DỊCH VỤ","Dịch vụ này chưa có trong Cấu hình → thêm dịch vụ và vật tư xuất.");return;}
    }else{ph("KHÔNG CÓ DỊCH VỤ","Dòng không ghi tên dịch vụ.");return;}
    var q=r.ov?0:kwQty(svc),sl=rcNum(r.sl)||1,k=0,anyV=list.some(function(x){return rcVid(x.c);}),noneDone=false;
    list.forEach(function(x){
      var rule=x.c,vid=rcVid(rule);
      if(!vid){if(!anyV&&!noneDone){noneDone=true;ph("KHÔNG DÙNG VẬT TƯ","Dịch vụ được cấu hình không đối chiếu vật tư.");}return;}
      var need=q>1?q:rcDm(rule)*sl;
      var gk=(O.cs?rcK(cs):"")+"|"+pid+"|"+vid+"|"+(O.th?mo:"");
      var g=gmap[gk];
      if(!g){g=gmap[gk]={k:gk,cs:cs,pid:pid,mo:mo,vid:vid,ten:vidName[vid]||rule.ten||rule.ma,ri:x.ci,need:0,n:0,got:0,cum:0,tok:{},price:vidPrice[vid]||(+rule.gia)||0,head:null,xs:[]};(gby[pid]=gby[pid]||[]).push(g);}
      if(!vidName[vid])vidName[vid]=rule.ten||rule.ma;
      for(var t in rcTok(rule))g.tok[t]=1;
      g.need+=need;g.n++;
      var c={i:i,r:r,cs:cs,pid:pid,mo:mo,g:g,ri:x.ci,ten:g.ten,nd:need,first:!g.head,bad:false,need:0,ok:false,T:"",why:"",nid:r.id+(k>0?"|"+vid:""),fin:"",O:0,P:0,Q:0,R:0,rowFirst:k===0};
      if(!g.head)g.head=c;
      cases.push(c);k++;
    });
  });
  /* xuất kho */
  var xbyPid={};
  var xk=R.xk.map(function(r,i){
    var d=rcDate(r.ngay),G=String(r.dg||""),p=G.toLowerCase().indexOf("pid"),pid="",mm;
    if(p>=0){mm=G.slice(p+3,p+18).replace(/^[\s:\-.#=]+/,"").replace(/[\s\t]/g,"").match(/^\d{1,12}/);if(mm)pid=cpid(mm[0]);}
    if(r.pid)pid=cpid(r.pid)||pid;
    if(r.pidm)pid=cpid(r.pidm)||pid;
    var ma=String(r.ma||"").trim(),ten=String(r.ten||"").trim(),tok={};
    if(r.tenm){var tk=norm(r.tenm);if(tk)tok[tk]=1;}else{var a=norm(ma),b=norm(ten);if(a)tok[a]=1;if(b)tok[b]=1;}
    var gk=rcK(G),sl=rcNum(r.sl);
    var skip=rcK(r.ct).indexOf("chuyển kho")>=0||gk.indexOf("chuyển kho")>=0||gk.indexOf("hết hạn")>=0||(" "+gk.replace(/[-–,():]/g," ")+" ").indexOf(" hủy ")>=0||String(r.cs).toUpperCase().indexOf("KHÔNG TÍNH")>=0;
    var x={i:i,r:r,cs:ccs(r.cs),pid:pid,mo:d?d.m:"",sl:sl,ma:ma,ten:ten,tok:tok,skip:skip,nid:r.id,g:null};
    if(!skip&&pid)(xbyPid[pid]=xbyPid[pid]||[]).push(x);
    return x;
  });
  function okOpt(g,x){return !((O.cs&&rcK(g.cs)!==rcK(x.cs))||(O.th&&g.mo!==x.mo));}
  xk.forEach(function(x){
    if(x.skip||!x.pid)return;var L=gby[x.pid];if(!L)return;
    for(var j=0;j<L.length;j++){var g=L[j];if(okOpt(g,x)&&rcHit(g.tok,x.tok)){x.g=g;g.got+=x.sl;g.xs.push(x);break;}}
  });
  var heads=Object.keys(gmap).map(function(k){return gmap[k];});
  /* phiếu xuất chưa có PID: thử khớp theo tên khách hàng trong diễn giải (chỉ khi chưa có phiếu xuất nào khớp theo PID) */
  var xnop=xk.filter(function(x){return !x.skip&&!x.pid;});
  if(xnop.length)heads.forEach(function(g){
    if(g.got>0)return;var cn=rcK(g.head.r.kh);if(!cn)return;
    xnop.forEach(function(x){if(x.g||!okOpt(g,x))return;if(rcK(x.r.dg).indexOf(cn)>=0&&rcHit(g.tok,x.tok)){x.g=g;g.got+=x.sl;g.xs.push(x);x.byName=1;}});
  });
  var eps=1e-9;
  heads.forEach(function(g){
    var c=g.head,s=g.got,Q=s-g.need,wrong=[],sw={};
    if(s===0&&(xbyPid[g.pid]||[]).length)(xbyPid[g.pid]).forEach(function(x){
      if(x.g||!okOpt(g,x))return;x.inWrong=1;var k=norm(x.ma)+"|"+norm(x.ten);if(sw[k])return;sw[k]=1;wrong.push({ma:x.ma,ten:x.ten,sl:x.sl,so:x.r.so});});
    c.O=g.need;c.P=s;c.Q=Q;c.R=Q*g.price;c.wrong=wrong.slice(0,5);
    c.T=s===0?(wrong.length?"XUẤT SAI VẬT TƯ":"CHƯA XUẤT KHO"):Math.abs(Q)<eps?"KHỚP":Q>0?"XUẤT SAI SỐ LƯỢNG (THỪA)":"XUẤT SAI SỐ LƯỢNG (THIẾU)";
    c.bad=c.T!=="KHỚP";c.ok=c.bad&&appr(c.nid);c.need=c.bad&&!c.ok?1:0;
    c.fin=c.T==="KHỚP"?"Khớp":c.ok?"Hợp lệ (đã duyệt)":"Chưa khớp";
  });
  xk.forEach(function(x){
    var anyHit=false;
    if(x.skip)x.P="(Chuyển kho/Hủy – bỏ qua)";
    else if(x.g){x.g.cum+=x.sl;x.P=x.g.cum>x.g.need+eps?"TRÙNG/THỪA XUẤT":"OK - có DT";}
    else if(!x.pid)x.P="THIẾU MÃ KH – bổ sung PID";
    else if(gby[x.pid]){
      gby[x.pid].forEach(function(g){if(rcHit(g.tok,x.tok))anyHit=true;});
      x.P=anyHit?"XUẤT CHƯA CÓ DOANH THU":"XUẤT SAI VẬT TƯ";
      if(!anyHit){var se={};x.exp=[];gby[x.pid].forEach(function(g){if(se[g.vid])return;se[g.vid]=1;x.exp.push({ri:g.ri,ten:g.ten});});}
    }
    else if(pidAll[x.pid])x.P="CHƯA CẤU HÌNH DỊCH VỤ";
    else x.P="XUẤT CHƯA CÓ DOANH THU";
    x.vid=x.g?x.g.vid:"";if(!x.vid){for(var t in x.tok){if(tokVid[t]){x.vid=tokVid[t];break;}}}
    x.vname=x.vid?(vidName[x.vid]||""):(x.ten||x.ma);
    x.val=x.sl*(x.g?x.g.price:(vidPrice[x.vid]||0));
    x.bad=(x.P==="XUẤT CHƯA CÓ DOANH THU"||x.P==="TRÙNG/THỪA XUẤT"||x.P==="XUẤT SAI VẬT TƯ"||x.P.indexOf("THIẾU MÃ KH")===0);
    x.ok=x.bad&&appr(x.nid);x.need=x.bad&&!x.ok?1:0;
    x.fin=x.bad&&x.ok?"Hợp lệ (đã duyệt)":x.P;
    x.vt=x.g?"✓ Đúng định mức: "+x.g.ten:x.P==="XUẤT SAI VẬT TƯ"?"✗ SAI VẬT TƯ – đúng ra: "+x.exp.map(function(e){return e.ten;}).join(" / "):"";
  });
  cases.forEach(function(c,j){c.j=j;});
  var miss=Object.keys(svcMiss).map(function(k){return [k,svcMiss[k]];}).sort(function(a,b){return b[1]-a[1];});
  return {dt:cases,rows:rows,xk:xk,M:M,cfg:cfg,vids:vids.map(function(v){return {vid:v,ten:vidName[v]};}),svcMiss:miss};
}
export function rcIn(o){return (RC.cs==="Tất cả"||o.cs===RC.cs)&&(RC.th==="Tất cả"||o.mo===+RC.th);}
export function rcCsList(){var a=[],Z=S.RC_RES;function add(c){if(c&&a.indexOf(c)<0)a.push(c);}Z.M.cs.forEach(function(r){add(r[1]);});Z.dt.forEach(function(o){add(o.cs);});Z.xk.forEach(function(x){add(x.cs);});return a;}
export function rcSum(){
  var Z=S.RC_RES,s={F:Z.dt.filter(function(o){return o.first&&rcIn(o);}),X:Z.xk.filter(rcIn),rev:0,val:0};
  Z.rows.filter(rcIn).forEach(function(o){s.rev+=rcNum(o.r.dt);});s.X.forEach(function(x){s.val+=x.val;});
  s.ok=s.F.filter(function(o){return o.T==="KHỚP";}).length;
  s.needD=s.F.filter(function(o){return o.need;});s.needX=s.X.filter(function(x){return x.need;});
  s.apprD=s.F.filter(function(o){return o.ok;}).length;s.badVt=s.X.filter(function(x){return x.P==="XUẤT SAI VẬT TƯ";}).length;
  return s;
}
export function rcNames(){var a=[];rcDb().cfg.forEach(function(r){if(r.ten&&a.indexOf(r.ten)<0)a.push(r.ten);});return a;}
export function rcScopeTxt(){return {cs:RC.cs==="Tất cả"?"Tất cả cơ sở":RC.cs,th:RC.th==="Tất cả"?"Tất cả tháng":"Tháng "+RC.th,all:RC.cs==="Tất cả"};}
export function rcScopeTag(){return ((RC.cs==="Tất cả"?"":"_"+RC.cs)+(RC.th==="Tất cả"?"":"_T"+RC.th)).normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/g,"d").replace(/Đ/g,"D").replace(/[^\w-]+/g,"_");}
export const RC_GRP=[["Tổng quan",[0]],["Đối chiếu",[1,6]],["Dữ liệu",[4,2]],["Báo cáo",[5]],["Cấu hình",[3]]];
export const RC_SUBN={1:"Ca lệch",6:"Map DT ↔ xuất kho",4:"Nhập / Xuất file",2:"Kiểm tra dữ liệu"};
export const RC_ONLY=[[1,"Chưa duyệt"],[0,"Tất cả lệch"],[4,"Đã duyệt hợp lệ"],[3,"Cần xem lại"],[2,"Tất cả dòng"]];
export function rcQ(n){n=Math.round((+n||0)*1000)/1000;return String(n);}
export function rcSgn(n){n=Math.round((+n||0)*1000)/1000;return n>0?"+"+n:n<0?"−"+Math.abs(n):"0";}
export function rcSgnF(n){n=Math.round(n||0);return n>0?"+"+rcF(n):n<0?"−"+rcF(-n):"0";}
export function rcSvcRows(g){
  var Z=S.RC_RES;
  if(!Z._gr){Z._gr={};Z.dt.forEach(function(c){if(!c.g||c.none)return;var k=c.g.k,m=Z._gr[k]||(Z._gr[k]={seen:{},list:[]});if(m.seen[c.i])return;m.seen[c.i]=1;m.list.push(c.r);});}
  var m=Z._gr[g.k];return m?m.list:[];
}
export function rcDtByPid(pid){
  var Z=S.RC_RES;
  if(!Z._bp){Z._bp={};Z.dt.forEach(function(c){if(c.first&&c.g&&c.pid)(Z._bp[c.pid]=Z._bp[c.pid]||[]).push(c);});}
  return Z._bp[pid]||[];
}
export function rcGi(){var gi=0;RC_GRP.forEach(function(g,i){if(g[1].indexOf(RC.tab)>=0)gi=i;});return gi;}
export function rcMapBuild(Z,O,N){
      var byG={};
      Z.dt.forEach(function(c){if(c.g)(byG[c.g.k]=byG[c.g.k]||[]).push(c);});
      var used={},M=[],nG=0,cnt={match:0,bad:0,ok:0,warn:0,none:0,xbad:0};
      function dtDesc(o){
        var t=o.T,vt=o.ten||"vật tư theo định mức";
        if(t==="KHỚP")return "Khớp: cần "+o.O+", đã xuất "+o.P+".";
        if(t==="CHƯA XUẤT KHO")return "Có doanh thu nhưng chưa có phiếu xuất kho «"+vt+"» (cần "+o.O+").";
        if(t==="XUẤT SAI VẬT TƯ")return "Đã xuất vật tư khác ("+(o.wrong||[]).map(function(w){return (w.ten||w.ma||"")+" · SL "+w.sl;}).join("; ")+") thay vì «"+vt+"» (cần "+o.O+").";
        return "Cần "+o.O+" «"+vt+"», thực xuất "+o.P+" → "+(o.Q<0?"THIẾU ":"THỪA ")+Math.abs(o.Q)+".";
      }
      function xkDesc(x){
        var t=x.P;
        if(t==="XUẤT CHƯA CÓ DOANH THU")return "Có phiếu xuất kho nhưng không có dòng doanh thu nào tương ứng"+(x.pid?" của "+x.pid:"")+".";
        if(t==="XUẤT SAI VẬT TƯ")return (x.vt||"Vật tư xuất không đúng định mức của dịch vụ").replace(/^✗\s*/,"")+".";
        if(t==="CHƯA CẤU HÌNH DỊCH VỤ")return "Khách có doanh thu nhưng dịch vụ chưa được cấu hình vật tư nên không gắn được phiếu xuất.";
        if(t.indexOf("THIẾU MÃ KH")===0)return "Phiếu xuất chưa có mã KH (PID) nên không gắn được với doanh thu.";
        return t;
      }
      var items=[];
      Z.dt.forEach(function(c){if(!rcIn(c))return;if(c.first&&c.g)items.push({c:c,cs:c.cs||""});else if(c.none)items.push({c:c,cs:c.cs||""});});
      items.sort(function(p,q){return String(p.cs).localeCompare(String(q.cs),"vi")||p.c.j-q.c.j;});
      items.forEach(function(it){
        var c=it.c,nt=N[c.nid]||{};
        if(c.none){
          var tp=c.T==="KHÔNG DÙNG VẬT TƯ"?"none":"warn";cnt[tp]++;nG++;
          M.push({t:tp,f:1,v:[nG,c.cs,c.pid||"",c.r.kh||"",c.r.ngay,c.r.dv,rcNum(c.r.sl)||1,rcNum(c.r.dt),"","","","","","","","","","","",c.T,c.why||"",nt.r||"",nt.g||"",nt.st||""]});
          return;
        }
        var g=c.g,lines=byG[g.k]||[c],xs=(g.xs||[]).slice();
        if(!xs.length&&c.T==="XUẤT SAI VẬT TƯ")xs=Z.xk.filter(function(x){return !x.skip&&!x.g&&x.inWrong&&x.pid===g.pid&&(!O.cs||rcK(x.cs)===rcK(g.cs));});
        xs.forEach(function(x){used[x.i]=1;});
        var tp=c.T==="KHỚP"?"match":(c.ok?"ok":"bad");cnt[tp]++;nG++;
        var n=Math.max(lines.length,xs.length,1);
        for(var i=0;i<n;i++){
          var L=lines[i],x=xs[i],f=i===0;
          M.push({t:tp,f:f,v:[nG,g.cs,g.pid,c.r.kh||"",
            L?L.r.ngay:"",L?L.r.dv:"",L?(rcNum(L.r.sl)||1):"",(L&&L.rowFirst)?rcNum(L.r.dt):"",g.ten||"",f?c.O:"",
            x?x.r.ngay:"",x?x.r.so:"",x?x.r.dg:"",x?x.ma:"",x?x.ten:"",x?x.sl:"",
            f?c.P:"",f?c.Q:"",f?c.R:"",c.T,f?dtDesc(c):"",f?(nt.r||""):"",f?(nt.g||""):"",f?(nt.st||""):""]});
        }
      });
      var left=Z.xk.filter(function(x){return !x.skip&&!used[x.i]&&rcIn(x);}).sort(function(p,q){return String(p.cs||"").localeCompare(String(q.cs||""),"vi")||p.i-q.i;});
      if(left.length){
        M.push({t:"sec",v:["PHIẾU XUẤT KHO CHƯA KHỚP VỚI DOANH THU ("+left.length+" phiếu) – không gắn được vào dòng doanh thu nào"]});
        left.forEach(function(x){
          var nt=N[x.nid]||{},tp=x.ok?"ok":"bad";if(tp==="bad")cnt.xbad++;else cnt.ok++;
          M.push({t:tp,f:1,v:["—",x.cs,x.pid||"","","","","","","","",x.r.ngay,x.r.so,x.r.dg,x.ma,x.ten,x.sl,x.sl,x.sl,x.val||0,x.P,xkDesc(x),nt.r||"",nt.g||"",nt.st||""]});
        });
      }
  return {M:M,cnt:cnt,nG:nG,left:left};
}
/* ===== Tab Map: xem ngay trên màn hình, cùng cách tô màu như sheet MAP trong file Excel ===== */
export const MP_COLS=[[3,"Khách hàng"],[1,"Cơ sở"],[5,"Dịch vụ"],[7,"Doanh thu"],[8,"VT định mức"],[9,"SL cần"],[11,"Số CT"],[14,"VT xuất"],[15,"SL xuất"],[17,"Chênh"],[19,"Kết quả"]];
export const MP_BANDS=[["Khách hàng",2,"#1e3a6b"],["Doanh thu · mốc",4,"#3f64a8"],["Xuất kho",3,"#a97c2f"],["Đối chiếu",2,"#14284b"]];
export function rcMapB(){var R=rcDb(),B=rcMapBuild(S.RC_RES,R.opt||{},R.notes||{});B.M.forEach(function(w,i){w._i=i;w._k=(w.t!=="sec"&&w.v[0]!=="—")?String(w.v[0]):"x"+i;});return B;}
export const KY_BADGE={'Chưa đối chiếu':'gray','Đang xử lý':'amber','Chờ xác nhận':'blue','Hoàn thành':'green'};
export const RC_KYL=[];
export function kyKey(cs,mo){return cs+'|'+mo;}
export function kyTime(ts){if(!ts)return '';var d=new Date(ts),p=function(n){return ('0'+n).slice(-2);};return p(d.getDate())+'/'+p(d.getMonth()+1)+'/'+d.getFullYear()+' '+p(d.getHours())+':'+p(d.getMinutes());}
export function rcKyStat(cs,mo){
  var Z=S.RC_RES,F=Z.dt.filter(function(o){return o.first&&o.cs===cs&&o.mo===mo;}),X=Z.xk.filter(function(x){return x.cs===cs&&x.mo===mo;});
  var nd=F.filter(function(o){return o.need;}).length,nx=X.filter(function(x){return x.need;}).length,rev=0,val=0;
  Z.rows.forEach(function(o){if(o.cs===cs&&o.mo===mo)rev+=rcNum(o.r.dt);});X.forEach(function(x){val+=x.val;});
  return {n:F.length,x:X.length,need:nd+nx,nd:nd,nx:nx,rev:rev,val:val,sig:[F.length,X.length,nd+nx,Math.round(rev),Math.round(val)].join('/')};
}
export function rcKyGet(cs,mo){
  var R=rcDb(),S=rcKyStat(cs,mo),rec=(R.kyst||{})[kyKey(cs,mo)],has=S.n+S.x>0;
  var st=(rec&&rec.st)?rec.st:(has?'Đang xử lý':'Chưa đối chiếu');
  var stale=!!(rec&&(rec.st==='Chờ xác nhận'||rec.st==='Hoàn thành')&&rec.sig&&rec.sig!==S.sig);
  return {st:st,rec:rec,S:S,stale:stale,has:has};
}
export function rcListRows(side,only,q){
  var Z=S.RC_RES,R=rcDb();
  var base=only==2?(side==0?Z.dt:Z.xk):only==4?(side==0?Z.dt.filter(function(o){return o.first;}):Z.xk):(side==0?Z.dt.filter(function(o){return o.first&&o.bad;}):Z.xk.filter(function(x){return x.bad;}));
  return base.filter(function(o){return rcIn(o)&&(only!=1||o.need)&&(only!=4||o.ok)&&(only!=3||(R.notes[o.nid]&&R.notes[o.nid].chg))&&(!q||smatch(norm(JSON.stringify(o.r)+" "+o.pid+" "+(o.ten||"")+" "+(o.vt||"")+" "+(o.P||"")+" "+(o.T||"")+" "+(o.why||"")),stok(q)));});
}
export const RC_GO=[
  {t:1,side:1,q:"THIẾU MÃ",only:1},
  {t:1,side:0,q:"THIẾU MÃ",only:2},
  {t:3,map:"cfg",q:"",only:1},
  {t:3,map:"cfg",q:"",only:1},
  {t:3,map:"cs",q:"",only:1},
  {t:3,map:"cs",q:"",only:1},
  {t:1,side:1,q:"TRÙNG",only:1},
  {t:1,side:1,q:"SAI VẬT TƯ",only:1}
];
/* ----- Nhập file (đọc theo TÊN CỘT; không có tiêu đề thì theo bố cục MISA cũ) ----- */
export function rcHdr(rows,side){
  var H=RC_HD[side],req=side==="dt"?["cs","pid","ngay","dv"]:["cs","ten","ngay","sl"];
  for(var i=0;i<Math.min(rows.length,10);i++){
    var m={},row=rows[i]||[];
    for(var j=0;j<row.length;j++){var t=norm(row[j]);if(!t)continue;for(var f in H){if(m[f]===undefined&&H[f].indexOf(t)>=0){m[f]=j;break;}}}
    if(req.every(function(f){return m[f]!==undefined;}))return {row:i,col:m};
  }
  return null;
}
export function rcMk(rows,side,v4,nt){
  var st=0,i,out=[],ids={},hd=rcHdr(rows,side),C=hd?hd.col:null;
  if(hd)st=hd.row+1;
  else for(i=0;i<Math.min(rows.length,8);i++)if(norm(rows[i][0])==="co so"){st=i+1;break;}
  var P=side==="dt"?{cs:0,pid:1,kh:2,bs:3,ngay:4,dv:5,mvt:6,sl:7,dt:8}:{cs:0,ma:1,ten:2,ngay:3,so:5,dg:6,dvt:7,ct:10,sl:11};
  /* file MISA cũ có tiêu đề: cột nào không nhận ra tên thì lấy theo vị trí cũ (nếu vị trí đó chưa dành cho cột khác) */
  var used={},fb=!!(hd&&(rows[hd.row]||[]).length>=(side==="dt"?9:12));
  if(C)for(var uf in C)used[C[uf]]=1;
  for(i=st;i<rows.length;i++){
    var c=rows[i];if(!c)continue;
    var gv=function(f){var j=C?C[f]:P[f];if(C&&j===undefined&&fb&&!used[P[f]])j=P[f];return j===undefined?"":c[j];};
    var cs=String(gv("cs")||"").trim();
    if(!cs||/^(nhap|vi du)/.test(norm(cs)))continue;
    var r=side==="dt"?{cs:cs,pid:String(gv("pid")||"").trim(),kh:String(gv("kh")||"").trim(),bs:String(gv("bs")||"").trim(),ngay:rcDStr(gv("ngay")),dv:String(gv("dv")||"").trim(),mvt:String(gv("mvt")||"").trim(),sl:rcNum(gv("sl")),dt:rcNum(gv("dt"))}
      :{cs:cs,ma:String(gv("ma")||"").trim(),ten:String(gv("ten")||"").trim(),ngay:rcDStr(gv("ngay")),so:String(gv("so")||"").trim(),dg:String(gv("dg")||"").trim(),dvt:String(gv("dvt")||"").trim(),ct:String(gv("ct")||"").trim(),sl:rcNum(gv("sl"))};
    if(side==="xk"&&C&&C.pid!==undefined){var pp=String(gv("pid")||"").trim();if(pp)r.pid=pp;}
    if(side==="dt"&&!r.dv&&!r.pid)continue;if(side==="xk"&&!r.ten&&!r.ma)continue;
    var b=side+"|"+[r.cs,side==="xk"?r.ma+(r.pid?"@"+r.pid:""):r.pid,r.ngay,r.dv||r.so,r.sl].join("|"),k=b,n=1;while(ids[k])k=b+"#"+(++n);ids[k]=1;r.id=k;
    if(v4){
      var g=side==="dt"?{ov:c[39],r:c[30],g:c[23],by:c[24],at:c[25],st:c[26]}:{r:c[20],g:c[21],by:c[22],at:c[23],st:c[24]};
      if(side==="dt"&&g.ov)r.ov=String(g.ov).trim();
      var nn={};["r","g","by","st"].forEach(function(f){if(g[f])nn[f]=String(g[f]).trim();});if(g.at)nn.at=rcDStr(g.at);
      if(nn.r||nn.g||nn.st)nt[k]=nn;
    }
    out.push(r);
  }
  return out;
}
