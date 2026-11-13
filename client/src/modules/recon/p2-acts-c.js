/* Phần 2 · Phụ lục 01 → Excel / in (dòng gốc 9788–9948). */
/* eslint-disable */
import { A, X, S, db, store, audit, saveSoon, toast, rerender, closeModal, norm, esc, kkNeed } from '../../core';
import { rcApxBuild, RC_APX_HEAD, RC_APX_CLS } from './p2-apx.jsx';
import { rcImpShow } from './p2-impui.jsx';

export const actions = {
  rcApxOpen:function(bi,o){var k=X.RC.apxK&&X.RC.apxK[bi];if(k!=null)X.RC.co[k]=!!o;},
  rcOpenK:function(k,o){X.RC.co[k]=!!o;},
  /* ----- Phụ lục → Excel (mỗi cơ sở 1 sheet, bố cục như biểu mẫu PHU_LUC) ----- */
  rcApxXlsx:function(){
    if(!kkNeed(["exceljs"],function(){A.rcApxXlsx();}))return;
    var D=rcApxBuild();if(!D.list.length){toast("Không có dữ liệu để lập phụ lục");return;}
    try{
      var wb=new ExcelJS.Workbook(),thin={style:"thin",color:{argb:"FF8C96A8"}},bd={top:thin,left:thin,bottom:thin,right:thin};
      var F=function(o){return Object.assign({name:"Times New Roman",size:10},o||{});};
      var FILL={g:"FFE2F0D9",b:"FFDDEBF7",r:"FFFCE4E4",n:"FFF2F2F2"},FC={g:"FF15803D",b:"FF0B5394",r:"FFC00000",n:"FF595959"};
      var fill=function(a){return {type:"pattern",pattern:"solid",fgColor:{argb:a}};};
      var used={},xl=X.prPage("landscape").xl;
      var sname=function(s){var b=String(s||"Kho").replace(/[\[\]\*\?\/\\:']/g," ").replace(/\s+/g," ").trim().substring(0,31)||"Kho",nm=b,k=2;while(used[nm.toLowerCase()]){nm=b.substring(0,28)+" "+k;k++;}used[nm.toLowerCase()]=1;return nm;};
      var psetup=function(){return {paperSize:xl,orientation:"landscape",fitToPage:true,fitToWidth:1,fitToHeight:0,margins:{left:0.4,right:0.4,top:0.5,bottom:0.5,header:0.2,footer:0.2}};};
      var nlines=function(s,w){return Math.max(1,Math.ceil(String(s==null?"":s).length/Math.max(1,w*1.05)));};
      /* --- sheet tổng hợp --- */
      var ts=wb.addWorksheet(sname("TONG_HOP"),{pageSetup:psetup()});
      [26,14,10,16,16,16,20].forEach(function(w,i){ts.getColumn(i+1).width=w;});
      ts.mergeCells("A1:G1");ts.getCell("A1").value="TỔNG HỢP ĐỐI CHIẾU DỊCH VỤ – PHIẾU XUẤT KHO THEO CƠ SỞ";ts.getCell("A1").font=F({size:14,bold:true});ts.getCell("A1").alignment={horizontal:"center"};
      ts.mergeCells("A2:G2");ts.getCell("A2").value="Kỳ: "+D.per;ts.getCell("A2").font=F({italic:true});ts.getCell("A2").alignment={horizontal:"center"};
      ["Cơ sở","Số dịch vụ đối chiếu","Khớp","Hợp lệ (đã duyệt)","Lệch chưa xử lý","Không dùng vật tư","Phiếu xuất chưa gắn DV"].forEach(function(t,j){
        var c=ts.getCell(4,j+1);c.value=t;c.font=F({bold:true,color:{argb:"FFFFFFFF"}});c.fill=fill("FF1F4E5F");c.border=bd;c.alignment={horizontal:"center",vertical:"middle",wrapText:true};
      });
      ts.getRow(4).height=32;
      var tt={tot:0,ok:0,ap:0,bad:0,nov:0,orph:0};
      D.list.forEach(function(B,i){
        var s=B.st,v=[B.cs,s.tot,s.ok,s.ap,s.bad,s.nov,s.orph];
        v.forEach(function(x,j){var c=ts.getCell(5+i,j+1);c.value=x;c.font=F();c.border=bd;c.alignment={horizontal:j?"center":"left",vertical:"middle"};});
        if(s.bad)ts.getCell(5+i,5).font=F({bold:true,color:{argb:FC.r}});
        for(var k in tt)tt[k]+=s[k];
      });
      var rt=5+D.list.length;
      [ "Tổng cộng",tt.tot,tt.ok,tt.ap,tt.bad,tt.nov,tt.orph].forEach(function(x,j){var c=ts.getCell(rt,j+1);c.value=x;c.font=F({bold:true});c.border=bd;c.fill=fill("FFD9E2F3");c.alignment={horizontal:j?"center":"left",vertical:"middle"};});
      /* --- mỗi cơ sở 1 sheet --- */
      var W=[6,13,22,12,46,18,30,10,10,18,32,10];
      D.list.forEach(function(B){
        var ws=wb.addWorksheet(sname(B.cs),{pageSetup:psetup()});
        W.forEach(function(w,i){ws.getColumn(i+1).width=w;});
        var put=function(addr,val,font,al){var c=ws.getCell(addr);c.value=val;c.font=F(font);if(al)c.alignment=al;return c;};
        ws.mergeCells("A1:L1");put("A1","PHỤ LỤC 01 – CHI TIẾT ĐỐI CHIẾU DỊCH VỤ VÀ PHIẾU XUẤT KHO",{size:14,bold:true},{horizontal:"center"});
        ws.mergeCells("A2:L2");put("A2","(Kèm theo và là một phần không tách rời của Biên bản xác nhận số lượng dịch vụ và vật tư xuất kho)",{italic:true},{horizontal:"center"});
        ws.mergeCells("A3:L3");put("A3","Cơ sở: "+B.cs+"   |   Kỳ: "+D.per,{bold:true,size:11},{horizontal:"center"});
        var s=B.st;
        ws.mergeCells("A4:L4");put("A4","Tổng "+s.tot+" dịch vụ đối chiếu · Khớp "+s.ok+" · Hợp lệ (đã duyệt) "+s.ap+" · Lệch chưa xử lý "+s.bad+(s.nov?" · Không dùng vật tư "+s.nov:"")+(s.orph?" · Phiếu xuất chưa gắn DV "+s.orph:""),{italic:true},{horizontal:"center"});
        var HR=6;
        RC_APX_HEAD.forEach(function(t,j){var c=ws.getCell(HR,j+1);c.value=t;c.font=F({bold:true,color:{argb:"FFFFFFFF"}});c.fill=fill("FF1F4E5F");c.border=bd;c.alignment={horizontal:"center",vertical:"middle",wrapText:true};});
        ws.getRow(HR).height=30;
        B.rows.forEach(function(w,i){
          var r=HR+1+i,vals=[i+1,w.pid,w.kh,w.ngay,w.dv,w.so,w.vt,w.nd,w.xt,w.kq,w.gt,"☐"],ln=1;
          vals.forEach(function(v,j){
            var c=ws.getCell(r,j+1);c.value=(v===""?null:v);c.font=F();c.border=bd;
            c.alignment={vertical:"middle",wrapText:true,horizontal:(j===5||j===6||j===4||j===2||j===10)?"left":"center"};
            ln=Math.max(ln,nlines(v,W[j]));
          });
          ws.getRow(r).height=Math.max(16,ln*13);
          var kc=ws.getCell(r,10);kc.fill=fill(FILL[w.cls]);kc.font=F({bold:true,color:{argb:FC[w.cls]}});
          if(w.so==="(chưa xuất)")ws.getCell(r,6).font=F({italic:true,color:{argb:"FF1F4FD8"}});
        });
        var next=HR+B.rows.length+2;
        if(B.orph.length){
          ws.mergeCells(next,1,next,12);put(ws.getCell(next,1).address,"II. PHIẾU XUẤT KHO CHƯA GẮN ĐƯỢC DỊCH VỤ ("+B.orph.length+")",{bold:true},{horizontal:"left"});ws.getCell(next,1).fill=fill("FFFFF2CC");
          var hr2=next+1,H2=["STT","Mã BN","Số phiếu xuất kho","Ngày xuất","Vật tư","SL xuất","Kết quả","Giải trình"];
          H2.forEach(function(t,j){var c=ws.getCell(hr2,j+1);c.value=t;c.font=F({bold:true,color:{argb:"FFFFFFFF"}});c.fill=fill("FF1F4E5F");c.border=bd;c.alignment={horizontal:"center",vertical:"middle",wrapText:true};});
          ws.mergeCells(hr2,8,hr2,11);
          B.orph.forEach(function(w,i){
            var r=hr2+1+i,vals=[i+1,w.pid,w.so,w.ngay,w.vt,w.sl,w.kq,w.gt];
            vals.forEach(function(v,j){var c=ws.getCell(r,j+1);c.value=(v===""?null:v);c.font=F();c.border=bd;c.alignment={vertical:"middle",wrapText:true,horizontal:(j===4||j===7)?"left":"center"};});
            ws.mergeCells(r,8,r,11);
            var kc=ws.getCell(r,7);kc.fill=fill(FILL[w.cls]);kc.font=F({bold:true,color:{argb:FC[w.cls]}});
            ws.getRow(r).height=Math.max(16,Math.max(nlines(w.vt,W[4]),nlines(w.gt,W[7]+W[8]+W[9]+W[10]))*13);
          });
          next=hr2+B.orph.length+2;
        }
        var sg=next+1;
        [["B","D","THỦ KHO CƠ SỞ"],["E","F","PHÒNG HÀNH CHÍNH HẬU CẦN"],["J","K","GIÁM ĐỐC CƠ SỞ"]].forEach(function(b){
          ws.mergeCells(b[0]+sg+":"+b[1]+sg);put(b[0]+sg,b[2],{bold:true},{horizontal:"center"});
          ws.mergeCells(b[0]+(sg+1)+":"+b[1]+(sg+1));put(b[0]+(sg+1),"(Ký, ghi rõ họ tên)",{italic:true},{horizontal:"center"});
        });
        ws.pageSetup.printTitlesRow=HR+":"+HR;
        ws.views=[{state:"frozen",ySplit:HR}];
      });
      var d=new Date(),p=function(n){return String(n).padStart(2,"0");};
      var fname="PhuLuc01_DoiChieu_TheoKho"+X.rcScopeTag()+"_"+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+".xlsx";
      wb.xlsx.writeBuffer().then(function(buf){
        X.shareOrDownload(new Blob([buf],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}),fname);
      }).catch(function(e){console.error(e);toast("Không tạo được file: "+e.message);});
    }catch(err){console.error(err);toast("Không tạo được phụ lục: "+err.message);}
  },
  /* ----- Phụ lục → in / PDF (khổ ngang, mỗi cơ sở 1 trang mới) ----- */
  rcApxPrint:function(){
    var D=rcApxBuild();if(!D.list.length){toast("Không có dữ liệu để lập phụ lục");return;}
    var W=[3,7.5,10.5,6.5,21,8.5,13,4,4,7.5,10,4.5];
    var body='<style>.apx{table-layout:fixed}.apx th,.apx td{font-size:8.5pt;padding:2pt 4pt;vertical-align:top;word-wrap:break-word}.apx th{font-size:8pt}.apx .c{text-align:center}</style>';
    D.list.forEach(function(B,bi){
      var s=B.st;
      body+='<div'+(bi?' style="page-break-before:always"':'')+'>'
        +'<p style="text-align:center;font-weight:bold;font-size:14pt;margin:0">PHỤ LỤC 01 – CHI TIẾT ĐỐI CHIẾU DỊCH VỤ VÀ PHIẾU XUẤT KHO</p>'
        +'<p style="text-align:center;font-style:italic;margin:2pt 0">(Kèm theo và là một phần không tách rời của Biên bản xác nhận số lượng dịch vụ và vật tư xuất kho)</p>'
        +'<p style="text-align:center;margin:2pt 0"><b>Cơ sở: '+esc(B.cs)+'</b> &nbsp;|&nbsp; Kỳ: '+esc(D.per)+'</p>'
        +'<p style="text-align:center;font-size:9pt;margin:2pt 0 6pt">Tổng '+s.tot+' dịch vụ đối chiếu · Khớp '+s.ok+' · Hợp lệ (đã duyệt) '+s.ap+' · Lệch chưa xử lý '+s.bad+(s.nov?' · Không dùng vật tư '+s.nov:'')+(s.orph?' · Phiếu xuất chưa gắn DV '+s.orph:'')+'</p>'
        +'<table class="apx"><colgroup>'+W.map(function(x){return '<col style="width:'+x+'%">';}).join('')+'</colgroup><thead><tr>'+RC_APX_HEAD.map(function(t){return '<th>'+t+'</th>';}).join('')+'</tr></thead><tbody>'
        +B.rows.map(function(w,i){
          var c=RC_APX_CLS[w.cls]||RC_APX_CLS.n;
          return '<tr><td class="c">'+(i+1)+'</td><td class="c">'+esc(w.pid)+'</td><td>'+esc(w.kh)+'</td><td class="c">'+esc(w.ngay)+'</td><td>'+esc(w.dv)+'</td><td'+(w.so==="(chưa xuất)"?' style="color:#1f4fd8;font-style:italic"':'')+'>'+esc(w.so)+'</td><td>'+esc(w.vt)+'</td><td class="c">'+esc(w.nd)+'</td><td class="c">'+esc(w.xt)+'</td><td class="c" style="background:'+c[0]+';color:'+c[1]+';font-weight:bold">'+esc(w.kq)+'</td><td>'+esc(w.gt)+'</td><td class="c">☐</td></tr>';
        }).join('')+'</tbody></table>';
      if(!B.rows.length)body+='<p><i>Không có dòng dịch vụ nào theo bộ lọc.</i></p>';
      if(B.orph.length){
        body+='<p style="font-weight:bold;margin:10pt 0 2pt">II. PHIẾU XUẤT KHO CHƯA GẮN ĐƯỢC DỊCH VỤ ('+B.orph.length+')</p>'
          +'<table class="apx"><thead><tr><th style="width:4%">STT</th><th style="width:10%">Mã BN</th><th style="width:14%">Số phiếu xuất kho</th><th style="width:9%">Ngày xuất</th><th>Vật tư</th><th style="width:6%">SL xuất</th><th style="width:13%">Kết quả</th><th style="width:20%">Giải trình</th></tr></thead><tbody>'
          +B.orph.map(function(w,i){var c=RC_APX_CLS[w.cls];return '<tr><td class="c">'+(i+1)+'</td><td class="c">'+esc(w.pid)+'</td><td>'+esc(w.so)+'</td><td class="c">'+esc(w.ngay)+'</td><td>'+esc(w.vt)+'</td><td class="c">'+esc(w.sl)+'</td><td class="c" style="background:'+c[0]+';color:'+c[1]+';font-weight:bold">'+esc(w.kq)+'</td><td>'+esc(w.gt)+'</td></tr>';}).join('')+'</tbody></table>';
      }
      body+='<table class="sign" style="width:100%;margin-top:18pt;page-break-inside:avoid"><tr><td><b>THỦ KHO CƠ SỞ</b><br><i>(Ký, ghi rõ họ tên)</i></td><td><b>PHÒNG HÀNH CHÍNH HẬU CẦN</b><br><i>(Ký, ghi rõ họ tên)</i></td><td><b>GIÁM ĐỐC CƠ SỞ</b><br><i>(Ký, đóng dấu)</i></td></tr></table></div>';
    });
    X.printPreviewHtml(X.docWrap("Phụ lục 01 - Đối chiếu dịch vụ và phiếu xuất kho",body,"landscape"));
  },
  /* ----- V7 · thao tác cho khung kết quả cập nhật đối chiếu (dòng gốc 9951–9971) ----- */
  rcImpClose:function(){closeModal();},
  rcImpLast:function(){var L=X.rcDb().lastImp;if(L)rcImpShow(L);},
  rcImpGo:function(side){
    A.rcImpClose();X.RC.tab=1;X.RC.lim=40;X.RC.q="";X.RC.cs="Tất cả";X.RC.th="Tất cả";
    if(side>=0){X.RC.side=side;X.RC.only=3;}else X.RC.only=1;
    rerender();window.scrollTo(0,0);
  },
  rcImpUndo:function(){
    var U=S.RC_UNDO,R=X.rcDb();
    if(!U){toast("Không còn bản để hoàn tác (chỉ hoàn tác được trong phiên làm việc hiện tại)");return;}
    if(!confirm("Hoàn tác lần nhập lúc "+U.at+"?\n\nDữ liệu doanh thu, xuất kho và giải trình trở về như trước khi nhập. Các chỉnh sửa tay làm sau lần nhập đó cũng sẽ mất."))return;
    R.dt=U.dt;R.xk=U.xk;R.notes=U.notes;
    if(U.last)R.lastImp=U.last;else delete R.lastImp;
    S.RC_UNDO=null;audit("recon-import","undo",null,U.at);saveSoon();A.rcImpClose();rerender();toast("Đã hoàn tác lần nhập");
  },
  rcChgOk:function(side,j){
    var R=X.rcDb(),o=(side?S.RC_RES.xk:S.RC_RES.dt)[j],n=o&&R.notes[o.nid];
    if(n&&n.chg){delete n.chg;audit("recon",o.nid+"/chg","cờ xem lại","giữ nguyên duyệt");saveSoon();rerender();}
  }
};
