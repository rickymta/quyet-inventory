/* Đề nghị thanh toán NCC — hành động A.pay* (dòng gốc 10303, 10806–10944) + 3 hành động rc* nằm trong dải (10945–10956). */
/* eslint-disable */
import { A, X, toast, saveSoon, store, audit, klog, kkNeed, rerender } from '../../core';
import {
  PAY, PAY_LOI, PAY_NGUONG_BK, payDb, payNKey, payNoteRow, payNoteMut, payNoteGet, payCompute, payErrAll, payKeep, payParse, payMerge,
} from './logic.js';
import {
  payNeed, payToday, payTpl, payOut, payAscii, payAddErr, payAddDn, payAddBk, payAddDs, payAddRecon, paySname, payPrintOpen,
} from './exporters.js';

export const actions = {};
Object.assign(actions,{payClr:function(){PAY.q="";PAY.f="all";PAY.ec="all";payKeep();}});
Object.assign(actions,{
  payCdOk:function(gk,i){var r=payNoteRow(gk,i);if(!r)return;payDb().notes[payNKey(r)]={t:[],x:"",ok:1,at:Date.now()};saveSoon();PAY.ed="";payKeep();},
  payCdMiss:function(gk,i){payNoteMut(gk,i,function(n){n.ok=0;if(!n.t.length&&!String(n.x||"").trim())n.t.push("Thiếu chứng từ/chữ ký");});PAY.ed=gk+"#"+i;payKeep();},
  payNoteEd:function(gk,i){var k=gk?gk+"#"+i:"";PAY.ed=(k&&PAY.ed!==k)?k:"";payKeep();},
  payNoteTag:function(gk,i,ti){var t=PAY_LOI[ti];if(!t)return;payNoteMut(gk,i,function(n){var x=n.t.indexOf(t);if(x>=0)n.t.splice(x,1);else n.t.push(t);n.ok=0;});payKeep();},
  payNoteTxt:function(gk,i,v){payNoteMut(gk,i,function(n){n.x=v;if(String(v||"").trim())n.ok=0;});},
  payNoteClr:function(gk,i){
    var r=payNoteRow(gk,i);if(!r)return;
    var P=payDb(),k=payNKey(r);if(r[9])P.notes[k]={t:[],x:"",at:Date.now()};else delete P.notes[k];
    saveSoon();PAY.ed="";payKeep();
  },
  payErrFilter:function(c){PAY.ec=c||"all";rerender();},
  payXlsxErr:function(cs){
    if(!payNeed("payXlsxErr",[cs]))return;
    cs=cs||PAY.ec||"all";
    var E=payErrAll(),n=0;
    if(cs!=="all")E=E.filter(function(B){return (B.cs||"?")===cs;});
    E.forEach(function(B){n+=B.items.length;});
    if(!n){toast(cs==="all"?"Chưa có lỗi nào để tổng hợp":"Cơ sở này chưa có lỗi nào");return;}
    var wb=new ExcelJS.Workbook(),t=payToday();payAddErr(wb,E,cs);
    payOut(wb,(cs==="all"?"TongHop_LoiCoSo_":"BaoLoi_"+(cs==="?"?"ChuaRo":payAscii(cs))+"_")+("0"+t.d).slice(-2)+("0"+t.m).slice(-2)+t.y+".xlsx");
  },
  payEc:function(c){PAY.ec=c||"all";payKeep();},
  payMonth:function(m){PAY.m=m||"all";PAY.sel="";PAY.f="all";payKeep();},
  payCsName:function(i,v){var l=payDb().csl;if(l[i]){l[i][1]=v;saveSoon();}},
  payCsDel:function(i){var l=payDb().csl;if(l.length<=1){toast("Cần giữ ít nhất 1 cơ sở");return;}l.splice(i,1);saveSoon();PAY.csOpen=1;payKeep();},
  payCsAdd:function(){
    var ce=document.getElementById("paycsc"),ne=document.getElementById("paycsn"),l=payDb().csl;
    var c=String(ce&&ce.value||"").toUpperCase().replace(/[^A-Z0-9]/g,""),nm=String(ne&&ne.value||"").trim();
    if(!c){toast("Nhập mã cơ sở đúng như trong số phiếu (vd BTX)");return;}
    if(l.some(function(x){return x[0]===c;})){toast("Mã "+c+" đã có trong danh mục");return;}
    l.push([c,nm]);saveSoon();PAY.csOpen=1;payKeep();toast("Đã thêm cơ sở "+c);
  }
});
Object.assign(actions,{
  payTemplate:function(){if(!payNeed("payTemplate"))return;payOut(payTpl(),"Mau_DeNghiThanhToan_NhapLieu.xlsx");},
  payFile:function(inp){
    var f=inp.files&&inp.files[0];if(!f)return;
    if(!kkNeed(["xlsx"],function(){A.payFile(inp);}))return;
    var rd=new FileReader();
    rd.onload=function(e){
      try{
        var wb=XLSX.read(new Uint8Array(e.target.result),{type:"array"}),o=payParse(wb),P=payDb();
        P.ncc=o.ncc.length?o.ncc:P.ncc;P.mua=o.mua;P.hd=o.hd;P.at=Date.now();P.file=f.name;delete P.undo;delete P.last;
        PAY.sel="";PAY.f="all";PAY.q="";audit("pay-import",f.name,null,o.mua.length+"/"+o.hd.length);
        if(!store.saveVerified())toast("Đã nạp nhưng chưa lưu được lên máy chủ — hãy thử lại");else toast("Đã nạp "+o.mua.length+" phiếu mua, "+o.hd.length+" HĐ MISA");
        PAY.step=2;rerender();
      }catch(err){console.error(err);toast("Không đọc được file: "+(err&&err.message||err));}
      inp.value="";
    };
    rd.readAsArrayBuffer(f);
  },
  payAdd:function(inp,kind){
    var f=inp.files&&inp.files[0];if(!f)return;
    if(!kkNeed(["xlsx"],function(){A.payAdd(inp,kind);}))return;
    var rd=new FileReader();
    rd.onload=function(e){
      try{
        var wb=XLSX.read(new Uint8Array(e.target.result),{type:"array"}),o=payParse(wb,1,kind||0),st=payMerge(o,f.name);
        var dup=st.mua.dup+st.hd.dup,ch=st.mua.add+st.hd.add+st.ncc.add+st.ncc.upd;
        if(ch){
          audit("pay-add",f.name,null,st.mua.add+"/"+st.hd.add);
          if(!store.saveVerified())toast("Đã bổ sung nhưng chưa lưu được lên máy chủ — hãy thử lại");
          else toast("Đã bổ sung "+st.mua.add+" phiếu mua, "+st.hd.add+" HĐ MISA"+(dup?" · bỏ qua "+dup+" dòng trùng":""));
        }else toast("Không có dòng mới: "+dup+" dòng đã có sẵn trong dữ liệu");
        PAY.sel="";if(ch)PAY.step=2;rerender();
      }catch(err){console.error(err);toast("Không đọc được file: "+(err&&err.message||err));}
      inp.value="";
    };
    rd.readAsArrayBuffer(f);
  },
  payUndoAdd:function(){
    var P=payDb(),u=P.undo,l=P.last;if(!u)return;
    if(P.mua.length<u.mua||P.hd.length<u.hd){toast("Không hoàn tác được vì dữ liệu đã thay đổi");return;}
    if(!confirm("Hoàn tác lần bổ sung từ file “"+(l&&l.file||"")+"”? Các phiếu mua và HĐ MISA vừa thêm sẽ bị gỡ ra.\nGhi chú lỗi đã nhập tay vẫn được giữ."))return;
    P.mua.length=u.mua;P.hd.length=u.hd;
    try{P.ncc=JSON.parse(u.ncc);}catch(e){klog("P.ncc=JSON.parse(u.ncc);",e)}
    audit("pay-add-undo",l&&l.file||"",null,"");
    delete P.undo;delete P.last;
    store.saveVerified();toast("Đã hoàn tác lần bổ sung gần nhất");rerender();
  },
  payFilter:function(f){PAY.f=f;rerender();},
  paySearch:function(v){PAY.q=v;clearTimeout(PAY._qt);PAY._qt=setTimeout(rerender,180);},
  paySel:function(k){PAY.sel=k||"";rerender();window.scrollTo(0,0);},
  payStep:function(n){PAY.step=n;PAY.sel="";PAY.v="";rerender();window.scrollTo(0,0);},
  payView:function(v){PAY.v=v||"";PAY.sel="";rerender();window.scrollTo(0,0);},
  payErrCopy:function(bi,pi,share){
    var B=payErrAll()[bi],t=B&&B.parts[pi];if(!t)return;
    var who=B.cs?"cơ sở "+B.cs:"nhóm chung";
    function ok(){toast("Đã sao chép — dán vào Zalo gửi "+who);}
    function fb(){var ta=document.createElement("textarea");ta.value=t;ta.style.cssText="position:fixed;opacity:0";document.body.appendChild(ta);ta.select();try{document.execCommand("copy");ok();}catch(e){prompt("Sao chép nội dung này:",t);}document.body.removeChild(ta);}
    function cp(){if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(ok).catch(fb);else fb();}
    if(share&&navigator.share)navigator.share({text:t}).catch(function(e){if(!e||e.name!=="AbortError")cp();});else cp();
  },
  payCfg:function(k,v){payDb().cfg[k]=v;saveSoon();},
  payPrintOne:function(key){
    var g=payCompute().filter(function(x){return x.key===key;})[0];if(!g)return;
    payPrintOpen([g],"DNTT_"+payAscii(g.short));
  },
  payPrintAll:function(){
    var S=payCompute().filter(function(g){return g.khop;});
    if(!S.length){toast("Chưa có NCC nào khớp công nợ để in");return;}
    var ns=S.filter(function(g){return !g.stk;}).length;
    payPrintOpen(S,"DNTT_NCC_khop");
    if(ns)toast(ns+" NCC thiếu số tài khoản — ô STK trên phiếu để trống");
  },
  payXlsxOne:function(key){
    if(!payNeed("payXlsxOne",[key]))return;
    var g=payCompute().filter(function(x){return x.key===key;})[0];if(!g)return;
    var wb=new ExcelJS.Workbook();payAddDn(wb,g,"DE NGHI THANH TOAN");
    if(g.rows.length>=PAY_NGUONG_BK)payAddBk(wb,g,"BANG KE HOA DON");
    payOut(wb,"DNTT_"+payAscii(g.short)+"_T"+g.thang+"-"+g.nam+".xlsx");
  },
  payXlsxDs:function(){
    if(!payNeed("payXlsxDs",[]))return;
    var L=payCompute();if(!L.some(function(g){return g.chot>0;})){toast("Chưa có NCC nào chốt được");return;}
    var wb=new ExcelJS.Workbook();payAddDs(wb,L,"DS THANH TOAN");
    var t=payToday();payOut(wb,"DS_ThanhToan_"+("0"+t.d).slice(-2)+("0"+t.m).slice(-2)+t.y+".xlsx");
  },
  payXlsxRecon:function(){
    if(!payNeed("payXlsxRecon",[]))return;
    var L=payCompute();if(!L.length){toast("Chưa có dữ liệu Mua hàng để đối chiếu");return;}
    var wb=new ExcelJS.Workbook(),t=payToday();payAddRecon(wb,L);
    audit("Xuất tổng hợp đối chiếu MISA-Mua hàng","pay",null,{ncc:L.length});
    payOut(wb,"DoiChieu_MISA_MuaHang_"+(PAY.m==="all"?"TatCaThang_":"T"+PAY.m.slice(4)+PAY.m.slice(0,4)+"_")+("0"+t.d).slice(-2)+("0"+t.m).slice(-2)+t.y+".xlsx");
  },
  payXlsxAll:function(){
    if(!payNeed("payXlsxAll",[]))return;
    var L=payCompute(),S=L.filter(function(g){return g.chot>0;});
    if(!S.length){toast("Chưa có NCC nào chốt được");return;}
    var wb=new ExcelJS.Workbook();payAddDs(wb,L,"DS THANH TOAN");
    S.forEach(function(g){
      payAddDn(wb,g,paySname(wb,"DN "+g.short));
      if(g.rows.length>=PAY_NGUONG_BK)payAddBk(wb,g,paySname(wb,"BK "+g.short));
    });
    var t=payToday();payOut(wb,"DNTT_HangLoat_"+("0"+t.d).slice(-2)+("0"+t.m).slice(-2)+t.y+".xlsx");
  }
});

/* Ba hành động của phân hệ recon nằm trong dải dòng gốc của pay (10945–10956). Trạng thái RC thuộc recon (X.RC). */
export const rcActions = {
  rcClr:function(){var RC=X.RC;RC.cs="Tất cả";RC.th="Tất cả";RC.lim=40;rerender();},
  rcGoList:function(side){var RC=X.RC;RC.tab=1;RC.side=side;RC.only=1;RC.q="";RC.lim=40;RC.from=1;rerender();window.scrollTo(0,0);},
  rcSearch:function(v){var RC=X.RC;RC.q=v;RC.lim=40;rerender();}
};
