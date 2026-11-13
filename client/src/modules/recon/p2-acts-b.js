/* Phần 2 · mẫu nhập, nhập file, xuất Excel (MAP + 2 sheet gốc, ca chênh lệch), biên bản in (dòng gốc 9335–9616). */
/* eslint-disable */
import { A, X, S, db, store, audit, saveSoon, toast, rerender, norm, esc, kkNeed } from '../../core';
import { rcApply, rcRunImport, rcRows, rcWbOut, rcWs } from './p2-import.js';

export const actions = {
  rcTpl:function(){
    if(!kkNeed(["xlsx"],function(){A.rcTpl();}))return;
    var wb=XLSX.utils.book_new();
    var dt=[["Cơ sở","Mã KH (PID)","Khách hàng","Bác sĩ","Ngày DV","Dịch vụ","SL dịch vụ","Doanh thu (VND)"],
      ["VÍ DỤ: Cát Linh","PID0001234","Nguyễn Văn A","BS Hùng","15/10/2026","Phẫu thuật cấy ghép Implant (Neodent Neoporos + abutment)",1,25000000]];
    var xk=[["Cơ sở","Mã KH (PID)","Mã vật tư","Tên vật tư","Ngày xuất","Số CT","Diễn giải","ĐVT","Loại CT","SL xuất"],
      ["VÍ DỤ: Cát Linh","PID0001234","13000170","Trụ Neodent Neoporos","15/10/2026","XK0001","Xuất cho khách PID0001234 – Nguyễn Văn A","Cái","Xuất kho",1]];
    var g=[["HƯỚNG DẪN FILE MẪU ĐỐI CHIẾU DOANH THU – XUẤT KHO"],[""],
      ["CÁCH KHỚP: một ca KHỚP khi đúng Mã KH (PID) + đúng vật tư xuất (mã hoặc tên theo Cấu hình của dịch vụ) + đúng số lượng."],
      ["SL cần = Định mức của dịch vụ (trong app › Cấu hình) × SL dịch vụ."],[""],
      ["SHEET DOANH_THU (mỗi dòng = 1 dịch vụ đã thu tiền)"],
      ["• Cơ sở*, Mã KH (PID)*, Ngày DV*, Dịch vụ* là bắt buộc. Khách hàng, Bác sĩ, SL dịch vụ (trống = 1), Doanh thu là tuỳ chọn nhưng nên có."],
      ["• Mã KH: PID0001234 hoặc chỉ số 1234 đều được. Thiếu mã KH thì dòng đó không đối chiếu được."],
      ["• Tên dịch vụ nhập đúng như MISA để app tìm được định mức trong Cấu hình."],[""],
      ["SHEET XUAT_KHO (mỗi dòng = 1 dòng phiếu xuất kho)"],
      ["• Cơ sở*, Tên vật tư* (hoặc Mã vật tư), Ngày xuất*, SL xuất* là bắt buộc."],
      ["• Mã KH (PID): nên điền riêng 1 cột. Nếu để trống, app tự tìm chữ “PID” + số trong cột Diễn giải."],
      ["• Mã vật tư = Mã hàng ở phiếu xuất. App so mã/tên này với vật tư đã cấu hình cho dịch vụ."],
      ["• Phiếu có Loại CT / Diễn giải chứa “chuyển kho”, “hủy”, “hết hạn” được bỏ qua."],[""],
      ["QUY ƯỚC CHUNG"],
      ["• Ngày: dd/mm/yyyy (hoặc ô ngày của Excel). Số: nhập số thuần, không chữ."],
      ["• Giữ nguyên dòng tiêu đề (không đổi tên cột, có thể đổi thứ tự cột). Xóa các dòng bắt đầu bằng “VÍ DỤ” hoặc để nguyên — app tự bỏ qua."],
      ["• Mỗi sheet bắt đầu từ dòng 1 là tiêu đề, dữ liệu từ dòng 2."]];
    XLSX.utils.book_append_sheet(wb,rcWs(dt,[18,16,22,14,13,58,12,16]),"DOANH_THU");
    XLSX.utils.book_append_sheet(wb,rcWs(xk,[18,16,14,30,13,12,44,8,12,10]),"XUAT_KHO");
    XLSX.utils.book_append_sheet(wb,rcWs(g,[130]),"HUONG_DAN");
    rcWbOut(wb,"Mau_nhap_DoiChieu_DT_XuatKho.xlsx");
  },
  rcFile:function(inp,kind){
    if(!kkNeed(["xlsx"],function(){A.rcFile(inp,kind);}))return;
    var f=inp.files&&inp.files[0];if(!f)return;
    var fr=new FileReader();
    fr.onload=function(){
      try{
        var wb=XLSX.read(fr.result,{type:"array"});
        rcRunImport(f.name,function(){
          var o={},n1={},n2={};
          if(kind===0||kind===1)o.dt=rcApply("dt",X.rcMk(rcRows(wb,"DOANH_THU"),"dt",kind===0,n1),n1);
          if(kind===0||kind===2)o.xk=rcApply("xk",X.rcMk(rcRows(wb,"XUAT_KHO"),"xk",kind===0,n2),n2);
          return o;
        });
      }catch(e){console.error(e);toast("Không đọc được file: "+e.message);}
      inp.value="";
    };
    fr.readAsArrayBuffer(f);
  },
  rcExport:function(){
    if(!kkNeed(["exceljs"],function(){A.rcExport();}))return;
    try{
      S.RC_RES=X.rcCompute();
      var Z=S.RC_RES,R=X.rcDb(),O=R.opt||{},N=R.notes||{},wb=new ExcelJS.Workbook();
      var thin={style:"thin",color:{argb:"FF8C96A8"}},bd={top:thin,left:thin,bottom:thin,right:thin};
      var F=function(o){return Object.assign({name:"Times New Roman",size:10},o||{});};
      var fill=function(a){return {type:"pattern",pattern:"solid",fgColor:{argb:a}};};
      var xl=X.prPage("landscape").xl,MONEY="#,##0;[Red]-#,##0";
      var nlines=function(v,w){return Math.max(1,Math.ceil(String(v==null?"":v).length/Math.max(1,w*1.05)));};
      var per="Cơ sở: "+X.RC.cs+"  |  Kỳ: "+(X.RC.th==="Tất cả"?"Tất cả các tháng":"Tháng "+X.RC.th)+"  |  Xuất ngày "+X.rcToday();

      /* ===== Dữ liệu 2 sheet gốc (giữ nguyên cấu trúc để còn nhập lại được) ===== */
      var a=[["Cơ sở","Mã KH","Khách hàng","Ngày DV","Dịch vụ","SL dịch vụ","Giá trị DT","Vật tư theo định mức","SL cần (gộp)","SL thực xuất","Chênh","Giá trị lệch","Trạng thái","Kết quả cuối","Vật tư đã xuất khác","Mã lý do","Giải trình","Trạng thái xử lý"]];
      Z.dt.filter(X.rcIn).forEach(function(o){var n=N[o.nid]||{};a.push([o.cs,o.pid,o.r.kh,o.r.ngay,o.r.dv,X.rcNum(o.r.sl),o.rowFirst?X.rcNum(o.r.dt):"",o.ten||"",o.first?o.O:"",o.first?o.P:"",o.first?o.Q:"",o.first?o.R:"",o.none?o.T:(o.first?o.T:"Dòng gộp"),o.none?o.T:(o.first?o.fin:""),(o.wrong||[]).map(function(w){return (w.ten||"")+(w.ma?" ("+w.ma+")":"");}).join("; "),n.r||"",n.g||"",n.st||""]);});
      var b=[["Cơ sở","Mã hàng","Tên vật tư","Ngày xuất","Số CT","Diễn giải","ĐVT","Loại CT","SL xuất","Vật tư theo cấu hình","Mã KH","Giá trị","KIỂM TRA XUẤT","Kết quả cuối","Kiểm tra vật tư","Mã lý do","Giải trình","Trạng thái xử lý"]];
      Z.xk.filter(X.rcIn).forEach(function(x){var n=N[x.nid]||{};b.push([x.cs,x.ma,x.ten,x.r.ngay,x.r.so,x.r.dg,x.r.dvt||"",x.r.ct||"",x.sl,x.vname||"",x.pid,x.val,x.P,x.fin,x.vt,n.r||"",n.g||"",n.st||""]);});

      /* ===== SHEET MAP: doanh thu là mốc tham chiếu, phiếu xuất kho gắn vào bên cạnh ===== */
      var MB=X.rcMapBuild(Z,O,N),M=MB.M,cnt=MB.cnt,nG=MB.nG,left=MB.left;
      var HEAD=["STT nhóm","Cơ sở","Mã KH (PID)","Khách hàng","Ngày DV","Dịch vụ","SL DV","Doanh thu (VND)","Vật tư theo định mức","SL cần","Ngày xuất","Số CT","Diễn giải phiếu xuất","Mã hàng","Tên vật tư xuất","SL xuất","Tổng SL xuất","Chênh SL (xuất − cần)","Giá trị lệch (VND)","Kết quả đối chiếu","Diễn giải chênh lệch","Mã lý do","Giải trình của cơ sở","Trạng thái xử lý"];
      var W=[8,16,13,22,12,34,7,15,26,9,12,14,40,12,28,9,10,11,14,26,48,14,32,14];
      var LEFT=[2,4,6,9,13,15,20,21,23],MON=[8,19],NC=HEAD.length;
      var ws=wb.addWorksheet("MAP_DT_XUAT_KHO",{pageSetup:{paperSize:xl,orientation:"landscape",fitToPage:true,fitToWidth:1,fitToHeight:0,margins:{left:0.4,right:0.4,top:0.5,bottom:0.5,header:0.2,footer:0.2}}});
      W.forEach(function(w,i){ws.getColumn(i+1).width=w;});
      var c0;
      ws.mergeCells(1,1,1,NC);c0=ws.getCell(1,1);c0.value="MAP ĐỐI CHIẾU DOANH THU – XUẤT KHO (doanh thu là mốc tham chiếu)";c0.font=F({size:14,bold:true});c0.alignment={horizontal:"center"};
      ws.mergeCells(2,1,2,NC);c0=ws.getCell(2,1);c0.value=per;c0.font=F({italic:true});c0.alignment={horizontal:"center"};
      ws.mergeCells(3,1,3,NC);c0=ws.getCell(3,1);
      c0.value="Nhóm doanh thu: "+nG+"  |  Khớp: "+cnt.match+"  |  Lệch chưa xử lý: "+cnt.bad+"  |  Hợp lệ (đã duyệt): "+cnt.ok+"  |  Chưa đối chiếu được: "+cnt.warn+"  |  Phiếu xuất chưa gắn doanh thu: "+cnt.xbad+"   —   Đỏ = lệch / phiếu xuất chưa khớp · Xanh = đã duyệt · Vàng = thiếu PID hoặc chưa cấu hình dịch vụ · Phiếu chuyển kho / hủy không đưa vào.";
      c0.font=F({bold:true,color:{argb:"FF9C0006"}});c0.alignment={wrapText:true,vertical:"middle"};ws.getRow(3).height=30;
      var bands=[[1,4,"KHÁCH HÀNG","FF1F4E5F"],[5,10,"DOANH THU · MỐC THAM CHIẾU","FF1F6F8B"],[11,16,"XUẤT KHO","FF8A5A1F"],[17,21,"ĐỐI CHIẾU","FF3B3B6B"],[22,24,"GIẢI TRÌNH","FF555555"]];
      bands.forEach(function(q){ws.mergeCells(4,q[0],4,q[1]);var c=ws.getCell(4,q[0]);c.value=q[2];c.font=F({bold:true,color:{argb:"FFFFFFFF"}});c.fill=fill(q[3]);c.alignment={horizontal:"center",vertical:"middle"};for(var k=q[0];k<=q[1];k++){ws.getCell(4,k).border=bd;ws.getCell(4,k).fill=fill(q[3]);}});
      HEAD.forEach(function(t,j){var q=bands.filter(function(z){return j+1>=z[0]&&j+1<=z[1];})[0],c=ws.getCell(5,j+1);c.value=t;c.font=F({bold:true,color:{argb:"FFFFFFFF"}});c.fill=fill(q[3]);c.border=bd;c.alignment={horizontal:"center",vertical:"middle",wrapText:true};});
      ws.getRow(5).height=32;
      var STY={bad:["FFFFC7CE","FF9C0006"],ok:["FFE2F0D9","FF15803D"],warn:["FFFFF2CC","FF7F6000"],none:[null,"FF7F7F7F"],match:[null,null]};
      var top={style:"medium",color:{argb:"FF1F4E5F"}};
      M.forEach(function(w,i){
        var r=6+i;
        if(w.t==="sec"){ws.mergeCells(r,1,r,NC);var sc=ws.getCell(r,1);sc.value=w.v[0];sc.font=F({bold:true,size:11,color:{argb:"FFFFFFFF"}});sc.fill=fill("FFC00000");sc.alignment={vertical:"middle"};ws.getRow(r).height=22;return;}
        var st=STY[w.t]||STY.match,ln=1;
        w.v.forEach(function(v,j){
          var c=ws.getCell(r,j+1),isM=MON.indexOf(j+1)>=0;
          c.value=(v===""||v==null)?null:v;
          c.font=F(st[1]?{color:{argb:st[1]}}:{});
          c.border=w.f?{top:top,left:thin,bottom:thin,right:thin}:bd;
          if(st[0])c.fill=fill(st[0]);
          c.alignment={vertical:"middle",wrapText:true,horizontal:isM?"right":(LEFT.indexOf(j+1)>=0?"left":"center")};
          if(isM)c.numFmt=MONEY;
          ln=Math.max(ln,nlines(v,W[j]));
        });
        var rc=ws.getCell(r,20);rc.font=F(st[1]?{bold:true,color:{argb:st[1]}}:{bold:true});
        ws.getRow(r).height=Math.max(16,ln*13);
      });
      ws.autoFilter={from:{row:5,column:1},to:{row:5+Math.max(1,M.length),column:NC}};
      ws.views=[{state:"frozen",ySplit:5,xSplit:4}];
      ws.pageSetup.printTitlesRow="5:5";

      /* ===== 2 sheet dữ liệu gốc ===== */
      function plain(name,aoa,widths){
        var s2=wb.addWorksheet(name);
        widths.forEach(function(w,i){s2.getColumn(i+1).width=w;});
        aoa.forEach(function(row,i){
          var rr=s2.addRow(row.map(function(v){return (v===""||v==null)?null:v;}));
          if(i===0){rr.eachCell(function(c){c.font={bold:true,color:{argb:"FFFFFFFF"}};c.fill=fill("FF1F4E5F");c.alignment={horizontal:"center",vertical:"middle",wrapText:true};});}
        });
        s2.views=[{state:"frozen",ySplit:1}];
        return s2;
      }
      plain("DOANH_THU",a,[16,14,22,12,34,10,14,26,10,10,9,13,24,24,30,14,30,14]);
      plain("XUAT_KHO",b,[16,12,28,12,14,40,8,12,9,26,13,13,24,24,34,14,30,14]);
      wb.xlsx.writeBuffer().then(function(buf){
        X.shareOrDownload(new Blob([buf],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}),"DoiChieu_DT_XuatKho"+X.rcScopeTag()+".xlsx");
        toast("Đã xuất file: sheet MAP ("+nG+" nhóm doanh thu"+(left.length?", "+left.length+" phiếu xuất chưa khớp":"")+")");
      }).catch(function(e){console.error(e);toast("Không tạo được file: "+e.message);});
    }catch(e){console.error(e);toast("Không xuất được: "+e.message);}
  },
  /* ----- Cập nhật nhanh: đối chiếu lại + nhập bổ sung/điều chỉnh từ file bên ngoài ----- */
  rcRefresh:function(){
    try{
      store.flush();
      rerender();
      var s=X.rcSum();
      toast("Đã đối chiếu lại: "+s.needD.length+" ca doanh thu và "+s.needX.length+" phiếu xuất cần xử lý");
    }catch(e){console.error(e);toast("Không cập nhật được: "+e.message);}
  },
  rcQuick:function(inp){
    var f=inp.files&&inp.files[0];if(!f)return;
    if(!kkNeed(["xlsx"],function(){A.rcQuick(inp);}))return;
    var fr=new FileReader();
    fr.onload=function(){
      try{
        var wb=XLSX.read(fr.result,{type:"array"}),has=function(n){return !!wb.Sheets[n];};
        var kind=has("DOANH_THU")&&has("XUAT_KHO")?0:has("DOANH_THU")?1:has("XUAT_KHO")?2:-1;
        if(kind<0){toast("File không có sheet DOANH_THU / XUAT_KHO. Vào tab Nhập/Xuất để chọn “Chỉ Doanh thu” hoặc “Chỉ Xuất kho”.");X.RC.tab=4;rerender();}
        else{
          X.RC.mode="update";
          rcRunImport(f.name,function(){
            var o={},n1={},n2={};
            if(kind===0||kind===1)o.dt=rcApply("dt",X.rcMk(rcRows(wb,"DOANH_THU"),"dt",kind===0,n1),n1);
            if(kind===0||kind===2)o.xk=rcApply("xk",X.rcMk(rcRows(wb,"XUAT_KHO"),"xk",kind===0,n2),n2);
            return o;
          });
        }
      }catch(e){console.error(e);toast("Không đọc được file: "+e.message);}
      inp.value="";
    };
    fr.readAsArrayBuffer(f);
  },
  /* ----- Xuất Excel các ca CHÊNH LỆCH (doanh thu + xuất kho) làm cơ sở để cơ sở giải trình ----- */
  rcExportDiff:function(){
    if(!kkNeed(["exceljs"],function(){A.rcExportDiff();}))return;
    try{
      S.RC_RES=X.rcCompute();
      var Z=S.RC_RES,R=X.rcDb(),N=R.notes||{};
      var byCs=function(a,b){return String(a.cs||"").localeCompare(String(b.cs||""),"vi");};
      var D=Z.dt.filter(function(o){return o.first&&o.bad&&X.rcIn(o);}).sort(byCs);
      var XD=Z.xk.filter(function(x){return x.bad&&X.rcIn(x);}).sort(byCs);
      if(!D.length&&!XD.length){toast("Không có ca chênh lệch nào theo bộ lọc hiện tại");return;}
      var wb=new ExcelJS.Workbook(),thin={style:"thin",color:{argb:"FF8C96A8"}},bd={top:thin,left:thin,bottom:thin,right:thin};
      var F=function(o){return Object.assign({name:"Times New Roman",size:10},o||{});};
      var fill=function(a){return {type:"pattern",pattern:"solid",fgColor:{argb:a}};};
      var per="Cơ sở: "+X.RC.cs+"  |  Kỳ: "+(X.RC.th==="Tất cả"?"Tất cả các tháng":"Tháng "+X.RC.th)+"  |  Xuất ngày "+X.rcToday();
      var xl=X.prPage("landscape").xl;
      var nlines=function(v,w){return Math.max(1,Math.ceil(String(v==null?"":v).length/Math.max(1,w*1.05)));};
      var MONEY="#,##0;[Red]-#,##0";
      /* tổng doanh thu của cả nhóm (khi nhiều dòng DT cùng khách + cùng vật tư được gộp) */
      var rev={},seenG={};
      Z.dt.forEach(function(c){if(!c.g)return;var k=c.g.k,sn=seenG[k]=seenG[k]||{};if(sn[c.i])return;sn[c.i]=1;rev[k]=(rev[k]||0)+X.rcNum(c.r.dt);});
      function dtDesc(o){
        var t=o.T,vt=o.ten||"vật tư theo định mức";
        if(t==="CHƯA XUẤT KHO")return "Có doanh thu nhưng chưa có phiếu xuất kho «"+vt+"» (cần "+o.O+").";
        if(t==="XUẤT SAI VẬT TƯ")return "Đã xuất vật tư khác ("+(o.wrong||[]).map(function(w){return (w.ten||w.ma||"")+" · SL "+w.sl;}).join("; ")+") thay vì «"+vt+"» (cần "+o.O+").";
        return "Cần "+o.O+" «"+vt+"», thực xuất "+o.P+" → "+(o.Q<0?"THIẾU ":"THỪA ")+Math.abs(o.Q)+".";
      }
      function xkDesc(x){
        var t=x.P;
        if(t==="XUẤT CHƯA CÓ DOANH THU")return "Có phiếu xuất kho nhưng không tìm thấy doanh thu tương ứng"+(x.pid?" của "+x.pid:"")+".";
        if(t==="TRÙNG/THỪA XUẤT")return "Tổng xuất vượt số lượng cần theo doanh thu"+(x.g?" (cần "+x.g.need+", đã xuất "+x.g.got+")":"")+".";
        if(t==="XUẤT SAI VẬT TƯ")return (x.vt||"Vật tư xuất không đúng định mức của dịch vụ").replace(/^✗\s*/,"")+".";
        return "Phiếu xuất chưa có mã KH (PID) nên không đối chiếu được với doanh thu.";
      }
      /* dựng 1 sheet dạng bảng: rows = [{v:[...],ok:bool}] */
      function mkSheet(name,title,heads,widths,rows,o){
        var ws=wb.addWorksheet(name,{pageSetup:{paperSize:xl,orientation:"landscape",fitToPage:true,fitToWidth:1,fitToHeight:0,margins:{left:0.4,right:0.4,top:0.5,bottom:0.5,header:0.2,footer:0.2}}});
        var n=heads.length,HR=4,c;
        widths.forEach(function(w,i){ws.getColumn(i+1).width=w;});
        ws.mergeCells(1,1,1,n);c=ws.getCell(1,1);c.value=title;c.font=F({size:14,bold:true});c.alignment={horizontal:"center"};
        ws.mergeCells(2,1,2,n);c=ws.getCell(2,1);c.value=per;c.font=F({italic:true});c.alignment={horizontal:"center"};
        heads.forEach(function(t,j){c=ws.getCell(HR,j+1);c.value=t;c.font=F({bold:true,color:{argb:"FFFFFFFF"}});c.fill=fill("FF1F4E5F");c.border=bd;c.alignment={horizontal:"center",vertical:"middle",wrapText:true};});
        ws.getRow(HR).height=32;
        rows.forEach(function(w,i){
          var r=HR+1+i,ln=1;
          w.v.forEach(function(v,j){
            c=ws.getCell(r,j+1);c.value=(v===""||v==null)?null:v;c.font=F();c.border=bd;
            var isM=o.money.indexOf(j+1)>=0;
            c.alignment={vertical:"middle",wrapText:true,horizontal:isM?"right":(o.left.indexOf(j+1)>=0?"left":"center")};
            if(isM)c.numFmt=MONEY;
            if(o.note.indexOf(j+1)>=0&&!w.ok&&(v===""||v==null))c.fill=fill("FFFFF2CC");   /* ô cần cơ sở điền */
            ln=Math.max(ln,nlines(v,widths[j]));
          });
          o.kind.forEach(function(k){var kc=ws.getCell(r,k);kc.fill=fill(w.ok?"FFE2F0D9":"FFFCE4E4");kc.font=F({bold:true,color:{argb:w.ok?"FF15803D":"FFC00000"}});});
          ws.getRow(r).height=Math.max(16,ln*13);
        });
        ws.autoFilter={from:{row:HR,column:1},to:{row:HR+Math.max(1,rows.length),column:n}};
        ws.views=[{state:"frozen",ySplit:HR}];
        ws.pageSetup.printTitlesRow=HR+":"+HR;
        return ws;
      }
      /* --- TONG_HOP --- */
      var ts=wb.addWorksheet("TONG_HOP",{pageSetup:{paperSize:xl,orientation:"landscape",fitToPage:true,fitToWidth:1,fitToHeight:0}});
      [26,14,14,18,14,14,18,16].forEach(function(w,i){ts.getColumn(i+1).width=w;});
      var tc=ts.getCell(1,1);ts.mergeCells(1,1,1,8);tc.value="TỔNG HỢP CÁC CA CHÊNH LỆCH DOANH THU – XUẤT KHO CẦN GIẢI TRÌNH";tc.font=F({size:14,bold:true});tc.alignment={horizontal:"center"};
      tc=ts.getCell(2,1);ts.mergeCells(2,1,2,8);tc.value=per;tc.font=F({italic:true});tc.alignment={horizontal:"center"};
      var csSet={};D.concat(XD).forEach(function(o){csSet[o.cs||"(chưa rõ cơ sở)"]=1;});
      var csL=Object.keys(csSet).sort(function(a,b){return a.localeCompare(b,"vi");});
      var H1=["Cơ sở","Ca lệch phía doanh thu","…chưa xử lý","Giá trị lệch DT (VND)","Phiếu xuất lệch","…chưa xử lý","Giá trị phiếu xuất lệch (VND)","Tổng ca cần giải trình"];
      H1.forEach(function(t,j){var c=ts.getCell(4,j+1);c.value=t;c.font=F({bold:true,color:{argb:"FFFFFFFF"}});c.fill=fill("FF1F4E5F");c.border=bd;c.alignment={horizontal:"center",vertical:"middle",wrapText:true};});
      ts.getRow(4).height=34;
      var tot=[0,0,0,0,0,0,0];
      csL.forEach(function(cs,i){
        var d=D.filter(function(o){return (o.cs||"(chưa rõ cơ sở)")===cs;}),x=XD.filter(function(o){return (o.cs||"(chưa rõ cơ sở)")===cs;});
        var vd=0,vx=0;d.forEach(function(o){vd+=Math.abs(o.R||0);});x.forEach(function(o){vx+=o.val||0;});
        var nd=d.filter(function(o){return o.need;}).length,nx=x.filter(function(o){return o.need;}).length;
        var vals=[d.length,nd,vd,x.length,nx,vx,nd+nx];
        vals.forEach(function(v,k){tot[k]+=v;});
        [cs].concat(vals).forEach(function(v,j){var c=ts.getCell(5+i,j+1);c.value=v;c.font=F();c.border=bd;c.alignment={horizontal:j?"center":"left",vertical:"middle"};if(j===3||j===6)c.numFmt=MONEY;});
        if(nd+nx)ts.getCell(5+i,8).font=F({bold:true,color:{argb:"FFC00000"}});
      });
      var rt=5+csL.length;
      ["Tổng cộng"].concat(tot).forEach(function(v,j){var c=ts.getCell(rt,j+1);c.value=v;c.font=F({bold:true});c.border=bd;c.fill=fill("FFD9E2F3");c.alignment={horizontal:j?"center":"left",vertical:"middle"};if(j===3||j===6)c.numFmt=MONEY;});
      /* phân loại theo trạng thái */
      var r0=rt+2,c0=ts.getCell(r0,1);c0.value="Phân loại theo loại chênh lệch";c0.font=F({bold:true,size:11});
      ["Loại chênh lệch","Nguồn","Số ca","Chưa xử lý"].forEach(function(t,j){var c=ts.getCell(r0+1,j+1);c.value=t;c.font=F({bold:true,color:{argb:"FFFFFFFF"}});c.fill=fill("FF1F4E5F");c.border=bd;c.alignment={horizontal:"center",vertical:"middle"};});
      var kinds={};
      D.forEach(function(o){var k="DT|"+o.T;kinds[k]=kinds[k]||{t:o.T,s:"Doanh thu",n:0,u:0};kinds[k].n++;kinds[k].u+=o.need?1:0;});
      XD.forEach(function(x){var k="XK|"+x.P;kinds[k]=kinds[k]||{t:x.P,s:"Xuất kho",n:0,u:0};kinds[k].n++;kinds[k].u+=x.need?1:0;});
      Object.keys(kinds).forEach(function(k,i){var q=kinds[k];[q.t,q.s,q.n,q.u].forEach(function(v,j){var c=ts.getCell(r0+2+i,j+1);c.value=v;c.font=F();c.border=bd;c.alignment={horizontal:j<2?"left":"center",vertical:"middle"};});});
      var nr=r0+3+Object.keys(kinds).length;
      ts.mergeCells(nr,1,nr,8);var nc=ts.getCell(nr,1);
      nc.value="Ghi chú: ô màu vàng ở sheet chi tiết là phần cơ sở cần điền (mã lý do / giải trình / trạng thái xử lý). “Chưa xử lý” = ca lệch chưa được duyệt.";
      nc.font=F({italic:true});nc.alignment={wrapText:true,vertical:"top"};ts.getRow(nr).height=30;
      /* --- chi tiết doanh thu --- */
      if(D.length)mkSheet("CHENH_LECH_DOANH_THU","CÁC CA CHÊNH LỆCH PHÍA DOANH THU (có doanh thu – xuất kho không khớp)",
        ["STT","Cơ sở","Mã KH (PID)","Khách hàng","Bác sĩ","Ngày DV","Dịch vụ","SL DV","Doanh thu (VND)","Vật tư theo định mức","SL cần","SL thực xuất","Chênh SL","Giá trị lệch (VND)","Loại chênh lệch","Diễn giải chênh lệch","Kết quả","Mã lý do","Giải trình của cơ sở","Trạng thái xử lý"],
        [6,16,14,22,14,12,40,8,15,28,9,10,9,15,24,48,16,16,36,14],
        D.map(function(o,i){var n=N[o.nid]||{},r=o.r;
          return {ok:!!o.ok,v:[i+1,o.cs,o.pid,r.kh,r.bs||"",r.ngay,r.dv,X.rcNum(r.sl)||1,(o.g&&rev[o.g.k]!==undefined)?rev[o.g.k]:X.rcNum(r.dt),o.ten||"",o.O,o.P,o.Q,o.R,o.T+(o.g&&o.g.n>1?" (gộp "+o.g.n+" dòng DT)":""),dtDesc(o),o.fin,n.r||"",n.g||"",n.st||""]};}),
        {money:[9,14],left:[2,4,5,7,10,16,17,19],kind:[15,17],note:[18,19,20]});
      /* --- chi tiết xuất kho --- */
      if(XD.length)mkSheet("CHENH_LECH_XUAT_KHO","CÁC CA CHÊNH LỆCH PHÍA XUẤT KHO (phiếu xuất không khớp doanh thu / định mức)",
        ["STT","Cơ sở","Mã KH (PID)","Ngày xuất","Số CT","Diễn giải phiếu xuất","Mã hàng","Tên vật tư","ĐVT","SL xuất","Giá trị (VND)","Loại chênh lệch","Diễn giải chênh lệch","Kết quả","Mã lý do","Giải trình của cơ sở","Trạng thái xử lý"],
        [6,16,14,12,14,44,12,30,8,9,15,26,48,16,16,36,14],
        XD.map(function(x,i){var n=N[x.nid]||{},r=x.r;
          return {ok:!!x.ok,v:[i+1,x.cs,x.pid||"",r.ngay,r.so,r.dg,x.ma,x.ten,r.dvt||"",x.sl,x.val||0,x.P,xkDesc(x),x.fin,n.r||"",n.g||"",n.st||""]};}),
        {money:[11],left:[2,6,8,12,13,14,16],kind:[12,14],note:[15,16,17]});
      var d=new Date(),p=function(n){return String(n).padStart(2,"0");};
      var tag=(X.RC.cs==="Tất cả"?"":"_"+X.RC.cs)+(X.RC.th==="Tất cả"?"":"_T"+X.RC.th);
      var fname=("ChenhLech_DT_XuatKho"+tag).normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/g,"d").replace(/Đ/g,"D").replace(/[^\w-]+/g,"_")+"_"+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+".xlsx";
      wb.xlsx.writeBuffer().then(function(buf){
        X.shareOrDownload(new Blob([buf],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}),fname);
        toast("Đã xuất "+D.length+" ca lệch doanh thu + "+XD.length+" phiếu xuất lệch");
      }).catch(function(e){console.error(e);toast("Không tạo được file: "+e.message);});
    }catch(err){console.error(err);toast("Không xuất được: "+err.message);}
  },
  rcPrint:function(){
    var s=X.rcSum(),Z=S.RC_RES,R=X.rcDb(),k="Cơ sở: "+esc(X.RC.cs)+" | Kỳ: "+(X.RC.th==="Tất cả"?"Tất cả các tháng":"Tháng "+X.RC.th);
    function tb(hd,rows){return '<table border="1" cellspacing="0" cellpadding="4" style="border-collapse:collapse;width:100%;font-size:11pt"><tr>'+hd.map(function(x){return '<th>'+x+'</th>';}).join('')+'</tr>'+rows.map(function(r){return '<tr>'+r.map(function(x){return '<td>'+x+'</td>';}).join('')+'</tr>';}).join('')+'</table>';}
    var g=Z.vids.map(function(p){var F=s.F.filter(function(o){return o.g&&o.g.vid===p.vid;}),c=0,x=0;F.forEach(function(o){c+=o.O;x+=o.P;});return [esc(p.ten),F.length,c,x,x-c,x<c?"⚠ Thiếu":x>c?"⚠ Thừa":"Khớp"];}).filter(function(r){return r[1]>0;}).map(function(r,i){return [i+1].concat(r);});
    var ex=s.needD.map(function(o){var n=R.notes[o.nid]||{};return ["Doanh thu",esc(o.cs),esc(o.pid),esc(o.r.dv+" → "+o.ten),esc(o.T),esc(n.g||"")];}).concat(s.needX.map(function(x){var n=R.notes[x.nid]||{};return ["Xuất kho",esc(x.cs),esc(x.pid),esc(x.ten+" – "+x.r.so),esc(x.P),esc(n.g||"")];}));
    var body='<p style="text-align:center;font-weight:bold">CÔNG TY CỔ PHẦN NỤ CƯỜI MỚI VIỆT NAM</p><h2 style="text-align:center">BIÊN BẢN XÁC NHẬN SẢN LƯỢNG DỊCH VỤ VÀ VẬT TƯ XUẤT KHO</h2><p style="text-align:center">'+k+'</p>'
      +'<p>Tổng doanh thu: <b>'+X.rcF(s.rev)+'</b> đ · Giá trị xuất kho: <b>'+X.rcF(s.val)+'</b> đ · Tỷ lệ khớp: <b>'+(s.F.length?(s.ok/s.F.length*100).toFixed(1):0)+'%</b></p>'
      +tb(["STT","Vật tư","Số ca","SL cần","SL xuất","Chênh","Đánh giá"],g)+'<p><i>Kèm theo: Phụ lục 01 – Chi tiết đối chiếu dịch vụ và phiếu xuất kho của từng cơ sở (in riêng, khổ ngang).</i></p><p><b>Phụ lục 02: các ca chưa xử lý ('+ex.length+')</b></p>'+(ex.length?tb(["Nguồn","Cơ sở","PID","Dịch vụ / Vật tư","Trạng thái","Giải trình"],ex):'<p>Không có.</p>')
      +'<table style="width:100%;margin-top:30px;text-align:center;border:0"><tr><td style="border:0"><b>THỦ KHO</b><br><i>(Ký, ghi rõ họ tên)</i></td><td style="border:0"><b>PHÒNG HÀNH CHÍNH</b><br><i>(Ký, ghi rõ họ tên)</i></td><td style="border:0"><b>GIÁM ĐỐC CƠ SỞ</b><br><i>(Ký, đóng dấu)</i></td></tr></table>';
    X.printPreviewHtml(X.docWrap("Biên bản đối chiếu",body,"portrait"));
  }};
