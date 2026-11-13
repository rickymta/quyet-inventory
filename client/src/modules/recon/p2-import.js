/* Phần 2 · V7 — cập nhật lại đối chiếu khi nhập dữ liệu thay thế / bổ sung điều chỉnh (dòng gốc 8947–9097, 9167–9169). Thuật toán giữ nguyên văn. */
/* eslint-disable */
import { A, X, S, db, store, audit, saveSoon, toast, rerender, norm, esc, kkNeed } from '../../core';
import { RC_KQ } from './p2-apx.jsx';
import { rcImpShow } from './p2-impui.jsx';

S.RC_UNDO = null;

export var RC_FLD={dt:["cs","pid","kh","bs","ngay","dv","mvt","sl","dt"],xk:["cs","ma","ten","ngay","so","dg","dvt","ct","sl","pid"]};
export var RC_FLB={cs:"Cơ sở",pid:"PID",kh:"Khách",bs:"Bác sĩ",ngay:"Ngày",dv:"Dịch vụ",mvt:"Mã VT",sl:"SL",dt:"DT",ma:"Mã",ten:"Tên",so:"Số CT",dg:"Diễn giải",dvt:"ĐVT",ct:"Loại CT"};
export var RC_MODE={replace:"Thay thế",append:"Nối thêm",update:"Bổ sung / điều chỉnh"};
export function rcPidN(v){var m=String(v==null?"":v).match(/\d+/);return m?String(parseInt(m[0],10)):"";}
export function rcDK(v){var d=X.rcDate(v);return d?d.d+"/"+d.m+"/"+d.y:X.rcK(v);}
/* khóa mềm nhận ra "cùng 1 dòng" dù SL / số tiền / diễn giải được điều chỉnh */
export function rcLoose(side,r){
  var cs=X.rcK(r.cs),dk=rcDK(r.ngay),p,s;
  if(side==="dt"){
    p=rcPidN(r.pid);s=norm(r.dv);
    return {k1:p?cs+"|p"+p+"|"+dk+"|"+s:"",k2:norm(r.kh)?cs+"|k"+norm(r.kh)+"|"+dk+"|"+s:""};
  }
  s=norm(r.so);
  return {k1:norm(r.ma)?cs+"|m"+norm(r.ma)+"|"+dk+"|"+s:"",k2:norm(r.ten)?cs+"|t"+norm(r.ten)+"|"+dk+"|"+s:""};
}
export function rcShow(f,v){if(f==="dt")return X.rcF(v);if(f==="sl")return String(v);return (v===""||v==null)?"(trống)":String(v);}
/* các trường khác nhau giữa dòng cũ o và dòng mới r: [trường, cũ, mới, giá trị mới thô] */
export function rcRowDiff(side,o,r){
  var out=[];
  RC_FLD[side].forEach(function(f){
    var a=o[f],b=r[f],x,y;
    if(f==="pid"&&(b===""||b==null)&&a)return;           /* file không có PID → giữ PID đã nhập tay */
    if(f==="sl"||f==="dt"){x=X.rcNum(a);y=X.rcNum(b);}
    else if(f==="pid"){x=rcPidN(a);y=rcPidN(b);}
    else if(f==="ngay"){x=rcDK(a);y=rcDK(b);}
    else{x=String(a==null?"":a).trim();y=String(b==null?"":b).trim();}
    if(x!==y)out.push([f,(f==="pid"?String(a==null?"":a):x),(f==="pid"?String(b==null?"":b):y),(f==="sl"||f==="dt")?y:b]);
  });
  return out;
}
/* Áp dữ liệu nhập vào side ("dt" | "xk"). Trả về {add,upd,same,del,warn,chg[]} */
export function rcApply(side,arr,nt){
  var R=X.rcDb(),old=R[side].slice(),mode=X.RC.mode,res={add:0,upd:0,same:0,del:0,warn:0,chg:[]};
  var idIx={},m1={},m2={},used=[],idMap={},keep=["ov","pidm","tenm"],k,i;
  old.forEach(function(r,j){idIx[r.id]=j;var L=rcLoose(side,r);
    if(L.k1)(m1[L.k1]=m1[L.k1]||[]).push(j);
    if(L.k2)(m2[L.k2]=m2[L.k2]||[]).push(j);});
  function free(a){if(a)for(var j=0;j<a.length;j++)if(!used[a[j]])return a[j];return -1;}
  function find(r,byId){
    var j=-1,L=rcLoose(side,r);
    if(byId&&idIx[r.id]!==undefined&&!used[idIx[r.id]])j=idIx[r.id];
    if(j<0&&L.k1)j=free(m1[L.k1]);
    if(j<0&&L.k2)j=free(m2[L.k2]);
    return j;
  }
  function lbl(o){return side==="dt"?((o.kh||o.pid||"—")+" · "+(o.dv||"")):((o.so||o.ten||o.ma||"—")+" · "+(o.ten||o.ma||""));}
  function note(o,d){if(res.chg.length<60)res.chg.push({l:lbl(o),f:d.map(function(x){return [RC_FLB[x[0]],rcShow(x[0],x[1]),rcShow(x[0],x[2])];}),d:d.map(function(x){return RC_FLB[x[0]]+" "+rcShow(x[0],x[1])+" → "+rcShow(x[0],x[2]);}).join("; ")});}
  function mapNotes(overwrite){for(var q in nt){var t=idMap[q]||q;if(overwrite||!R.notes[t])R.notes[t]=nt[q];}}
  if(mode==="append"){
    /* giữ nguyên cách cũ: chỉ thêm dòng chưa có; cảnh báo dòng giống dòng cũ nhưng khác số liệu (có thể là bản điều chỉnh) */
    arr.forEach(function(r){
      if(idIx[r.id]!==undefined){res.same++;return;}
      if(find(r,false)>=0)res.warn++;
      R[side].push(r);idIx[r.id]=-1;res.add++;
    });
    mapNotes(false);
  }else if(mode==="update"){
    var taken={};R[side].forEach(function(r){taken[r.id]=1;});
    arr.forEach(function(r){
      var j=find(r,true),o,d;
      if(j<0){var b0=r.id,n0=1;while(taken[r.id])r.id=b0+"#u"+(++n0);if(r.id!==b0)idMap[b0]=r.id;taken[r.id]=1;R[side].push(r);res.add++;return;}
      used[j]=1;o=old[j];d=rcRowDiff(side,o,r);idMap[r.id]=o.id;
      if(!d.length){res.same++;return;}
      d.forEach(function(x){o[x[0]]=x[3];});
      res.upd++;note(o,d);
    });
    mapNotes(false);
  }else{
    /* thay thế: dùng đúng dữ liệu file, nhưng dòng trùng khóa mềm giữ mã cũ (→ giữ giải trình) và giữ các gán tay (vật tư gán, PID gán) */
    var nw=[],mt=[],um=[],tk={};
    arr.forEach(function(r){var j=find(r,true);if(j>=0){used[j]=1;mt.push([r,old[j]]);}else um.push(r);});
    mt.forEach(function(p){
      var r=p[0],o=p[1],d=rcRowDiff(side,o,r);
      idMap[r.id]=o.id;
      keep.forEach(function(f){if(o[f]!==undefined&&r[f]===undefined)r[f]=o[f];});
      if((r.pid===""||r.pid==null)&&o.pid)r.pid=o.pid;
      r.id=o.id;tk[r.id]=1;nw.push(r);
      if(d.length){res.upd++;note(o,d);}else res.same++;
    });
    um.forEach(function(r){var b0=r.id,n0=1;while(tk[r.id])r.id=b0+"#u"+(++n0);if(r.id!==b0)idMap[b0]=r.id;tk[r.id]=1;nw.push(r);res.add++;});
    res.del=old.length-mt.length;
    R[side]=nw;
    mapNotes(true);
  }
  return res;
}
/* ----- Ảnh chụp kết quả đối chiếu (để so sánh trước/sau khi nhập) ----- */
export function rcSnap(){
  var Z=X.rcCompute(),s={dt:{},xk:{},valid:{}};
  Z.dt.forEach(function(c){
    s.valid[c.nid]=1;
    if(!(c.first||c.none))return;
    s.dt[c.g?"G|"+c.g.k:"N|"+c.nid]={nid:c.nid,T:c.T,O:c.O||0,P:c.P||0,ok:!!c.ok,good:(c.T==="KHỚP"||c.T==="KHÔNG DÙNG VẬT TƯ"),lbl:(c.r.kh||c.pid||"—"),ten:(c.ten||c.r.dv||"")};
  });
  Z.xk.forEach(function(x){s.valid[x.nid]=1;s.xk[x.nid]={nid:x.nid,P:x.P||"",ok:!!x.ok,good:!x.bad,lbl:(x.r.so||x.ten||x.ma||"—"),ten:(x.ten||x.ma||"")};});
  var F=Z.dt.filter(function(o){return o.first;}),rev=0,val=0,ok=0;
  F.forEach(function(o){if(o.T==="KHỚP")ok++;});
  Z.rows.forEach(function(o){rev+=X.rcNum(o.r.dt);});
  Z.xk.forEach(function(x){val+=x.val||0;});
  s.k={n:F.length,ok:ok,rate:F.length?ok/F.length*100:null,needD:F.filter(function(o){return o.need;}).length,needX:Z.xk.filter(function(x){return x.need;}).length,rev:rev,val:val};
  return s;
}
export function rcImpReport(b,a,res,src){
  var R=X.rcDb(),N=R.notes,d=new Date();
  var rep={at:X.rcToday()+" "+("0"+d.getHours()).slice(-2)+":"+("0"+d.getMinutes()).slice(-2),src:src,mode:X.RC.mode,modeLbl:RC_MODE[X.RC.mode]||X.RC.mode,cnt:{},chg:{},ch:{},it:{},kb:b.k,ka:a.k,warn:0,reN:0,reD:0,reX:0,reL:[],orph:0};
  ["dt","xk"].forEach(function(sd){
    var r=res[sd];
    if(r){rep.cnt[sd]={add:r.add,upd:r.upd,same:r.same,del:r.del};rep.warn+=r.warn;rep.chg[sd]=r.chg;}
    var c=rep.ch[sd]={fixed:0,bad:0,other:0,nw:0,nwBad:0,gone:0},it=rep.it[sd]={fixed:[],bad:[],other:[],nwBad:[],gone:[]},keys={};
    Object.keys(b[sd]).forEach(function(k){keys[k]=1;});Object.keys(a[sd]).forEach(function(k){keys[k]=1;});
    function tx(e){return sd==="dt"?((RC_KQ[e.T]||e.T)+((e.O||e.P)?" (cần "+e.O+" / xuất "+e.P+")":"")):e.P;}
    function ln(e0,e1){var e=e1||e0;return {l:e.lbl+" · "+e.ten,a:e0?tx(e0):"(mới phát sinh)",b:e1?tx(e1):"(không còn)"};}
    function push(arr,s){if(arr.length<40)arr.push(s);}
    Object.keys(keys).forEach(function(k){
      var e0=b[sd][k],e1=a[sd][k],nn,chgd;
      if(e1&&e1.good){nn=N[e1.nid];if(nn&&nn.chg)delete nn.chg;}
      if(!e0&&e1){c.nw++;if(!e1.good){c.nwBad++;push(it.nwBad,ln(null,e1));}return;}
      if(e0&&!e1){c.gone++;push(it.gone,ln(e0,null));return;}
      chgd=sd==="dt"?(e0.T!==e1.T||e0.O!==e1.O||e0.P!==e1.P):(e0.P!==e1.P);
      if(!chgd||(e0.good&&e1.good))return;
      if(!e0.good&&e1.good){c.fixed++;push(it.fixed,ln(e0,e1));}
      else if(e0.good&&!e1.good){c.bad++;push(it.bad,ln(e0,e1));}
      else{c.other++;push(it.other,ln(e0,e1));}
      if(e0.ok&&!e1.good){
        nn=N[e1.nid];
        if(nn&&(nn.st==="Đã duyệt"||nn.st==="Đã xử lý")){
          nn.chg="Trước: "+tx(e0)+" → nay: "+tx(e1)+" ("+X.rcToday()+")";
          rep.reN++;if(sd==="dt")rep.reD++;else rep.reX++;push(rep.reL,ln(e0,e1));
        }
      }
    });
  });
  Object.keys(N).forEach(function(k){var n=N[k];if(n&&(n.r||n.g||n.st)&&b.valid[k]&&!a.valid[k])rep.orph++;});
  return rep;
}
/* Chạy 1 lần nhập: chụp trước → áp dữ liệu → đối chiếu lại → so sánh → hiện kết quả. Lỗi thì trả dữ liệu về như cũ. */
export function rcRunImport(src,fn){
  var R=X.rcDb(),before=rcSnap(),res,after,rep;
  var undo={dt:JSON.parse(JSON.stringify(R.dt)),xk:JSON.parse(JSON.stringify(R.xk)),notes:JSON.parse(JSON.stringify(R.notes)),last:R.lastImp?JSON.parse(JSON.stringify(R.lastImp)):null};
  try{res=fn();after=rcSnap();rep=rcImpReport(before,after,res,src);}
  catch(e){R.dt=undo.dt;R.xk=undo.xk;R.notes=undo.notes;throw e;}
  undo.at=rep.at;S.RC_UNDO=undo;R.lastImp=rep;
  audit("recon-import",src,null,rep.modeLbl+" · DT "+(rep.cnt.dt?"+"+rep.cnt.dt.add+"/~"+rep.cnt.dt.upd:"–")+" · XK "+(rep.cnt.xk?"+"+rep.cnt.xk.add+"/~"+rep.cnt.xk.upd:"–"));
  saveSoon();X.RC.tab=0;X.RC.lim=40;rerender();rcImpShow(rep);
}
export function rcRows(wb,name){var ws=wb.Sheets[name]||wb.Sheets[wb.SheetNames[0]];return XLSX.utils.sheet_to_json(ws,{header:1,raw:true,defval:""});}
export function rcWbOut(wb,fname){X.shareOrDownload(new Blob([XLSX.write(wb,{bookType:"xlsx",type:"array"})],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}),fname);}
export function rcWs(aoa,w){var ws=XLSX.utils.aoa_to_sheet(aoa);ws["!cols"]=w.map(function(x){return {wch:x};});return ws;}