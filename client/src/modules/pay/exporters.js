/* Đề nghị thanh toán NCC — xuất Excel (ExcelJS), HTML in (Giấy đề nghị + Bảng kê), file mẫu (dòng gốc 10485–10805).
   Giữ nguyên dạng chuỗi/ExcelJS như bản gốc. */
/* eslint-disable */
import { A, X, esc, toast, soThanhChu, kkNeed } from '../../core';
import {
  PAY, PAY_NGUONG_BK, PAY_LOI, payDb, payCsCodes, payCsLabel, payCsFull, payF, payDs, payInM, payMLab,
  payNguoiLap, payContent, paySoHd, payCheck, payNoteErrs,
} from './logic.js';

const shareOrDownload = (...a) => X.shareOrDownload(...a);
const printPreviewHtml = (...a) => X.printPreviewHtml(...a);
const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/* ----- Xuất Excel đúng bố cục file mẫu ----- (printArea viết dạng "A$1:H$37" vì ExcelJS tự thêm $ đầu mỗi vế) */
export function payFont(o){return Object.assign({name:"Times New Roman",size:10.5},o||{});}
export function payToday(){var d=new Date();return {d:d.getDate(),m:d.getMonth()+1,y:d.getFullYear()};}
export function payPut(ws,addr,val,font,al,merge,bd,fill){
  if(merge)ws.mergeCells(merge);
  var c=ws.getCell(addr);c.value=val;c.font=payFont(font);
  if(al)c.alignment=al;if(bd)c.border=bd;if(fill)c.fill={type:"pattern",pattern:"solid",fgColor:{argb:fill}};
  return c;
}
export function paySname(wb,s){
  var b=String(s).replace(/[\[\]\*\?\/\\:']/g," ").replace(/\s+/g," ").trim().substring(0,31),nm=b,k=2;
  while(wb.getWorksheet(nm)){nm=b.substring(0,28)+" "+k;k++;}
  return nm;
}
export function payAddDn(wb,g,sn){
  var C=payDb().cfg,T=payToday(),thin={style:"thin"},bd={top:thin,left:thin,bottom:thin,right:thin};
  var ws=wb.addWorksheet(sn,{pageSetup:{paperSize:9,orientation:"portrait",fitToPage:true,fitToWidth:1,fitToHeight:0,printArea:"A$1:H$37",margins:{left:.5,right:.5,top:.5,bottom:.5,header:.3,footer:.3}}});
  [10.9,32.1,6.9,10.1,11.1,13.1,16.4,18.7,9,2,3,30,34].forEach(function(w,i){ws.getColumn(i+1).width=w;});
  var H={1:15,2:15,3:27.75,4:15,5:27.75,6:15,7:27.75,8:18.75,9:15,10:15,11:15,12:21.75,13:40.5,21:15,22:15,23:15,24:15,25:15,26:25.5,27:15,28:15,29:15,30:15,31:24,32:54.75,33:15,34:15,35:15,36:15,37:54.75};
  for(var r=14;r<=20;r++)H[r]=27;
  for(var k in H)ws.getRow(+k).height=H[k];
  for(var hr=14;hr<=20;hr++)ws.getRow(hr).hidden=true; /* chi tiết chỉ 1 dòng, dòng 14-20 ẩn như file mẫu */
  var L={horizontal:"left",vertical:"middle",wrapText:true},Ct={horizontal:"center",vertical:"middle",wrapText:true},ci=C.ht==="Chuyển khoản";
  var dt="Hà Nội, ngày "+T.d+" tháng "+T.m+" năm "+T.y;
  payPut(ws,"A1","MEDDENTAL",{size:12,bold:true});
  payPut(ws,"F1","Mã CT: ……………………",{},null,"F1:H1");payPut(ws,"F2","Số phiếu:",{},null,"G2:H2");
  payPut(ws,"A3","GIẤY ĐỀ NGHỊ THANH TOÁN",{size:16,bold:true},Ct,"A3:H3");
  payPut(ws,"A4","Tháng "+("0"+T.m).slice(-2)+" năm "+T.y,{size:11,italic:true},Ct,"A4:H4");
  [[5,"Họ và tên người dự trù:",payNguoiLap()],[6,"Phòng/Ban:",C.pb],[7,"CHỌN NHÀ CUNG CẤP  ▼",g.short],[8,"Lý do thanh toán:",payContent(g)],[9,"Hình thức thanh toán:",C.ht],[10,"Đơn vị:",C.dv]].forEach(function(x){
    payPut(ws,"A"+x[0],x[1],{},L,"A"+x[0]+":C"+x[0]);payPut(ws,"D"+x[0],x[2],{},L,"D"+x[0]+":H"+x[0]);
  });
  payPut(ws,"A11","CHI TIẾT CÁC NỘI DUNG:",{bold:true});
  ["STT","Nội dung","ĐVT","SL","Đơn giá","Thành tiền","Số HĐ","ĐVCP"].forEach(function(t,j){payPut(ws,String.fromCharCode(65+j)+"12",t,{bold:true},Ct,null,bd);});
  for(var i=13;i<=20;i++)for(var j=0;j<8;j++){var c=ws.getCell(i,j+1);c.border=bd;c.font=payFont();c.alignment=Ct;}
  payPut(ws,"A13",1,{},Ct,null,bd);payPut(ws,"B13",payContent(g),{},L,null,bd);
  payPut(ws,"F13",g.tong,{},Ct,null,bd).numFmt="#,##0";payPut(ws,"G13",paySoHd(g),{},Ct,null,bd);payPut(ws,"H13",C.dvcp,{},Ct,null,bd);
  payPut(ws,"B21","TỔNG CỘNG",{bold:true},Ct,"B21:C21",bd);["A21","D21","E21","G21","H21"].forEach(function(a){ws.getCell(a).border=bd;});
  payPut(ws,"F21",{formula:"SUM(F13:F20)",result:g.tong},{bold:true},null,null,bd).numFmt="#,##0";
  payPut(ws,"A22","Bằng chữ:",{bold:true});payPut(ws,"B22",soThanhChu(g.tong)+"./.",{italic:true},L,"B22:H22");
  payPut(ws,"A23","Người thụ hưởng: "+g.full,{bold:true},L,"A23:H23");
  payPut(ws,"A24","CMND (Nếu thanh toán TM):");
  payPut(ws,"A25","Số tài khoản ngân hàng (Nếu thanh toán CK): "+(ci?g.stk:""),{},L,"A25:H25");
  payPut(ws,"A26","Tại ngân hàng: "+g.bank,{bold:true},L,"A26:F26");payPut(ws,"G26","Chi nhánh: "+g.cn,{bold:true},Ct,"G26:H26");
  payPut(ws,"A27","Chứng từ kèm theo: (Ghi số lượng cho từng loại chứng từ):");payPut(ws,"A28","1. Hóa đơn VAT:");payPut(ws,"A29","2. Biên bản giao nhận:");payPut(ws,"A30","3. Phiếu nhập kho:");
  payPut(ws,"E30",dt,{italic:true},Ct,"E30:H30");
  payPut(ws,"A31","Tổng giám đốc               Phụ trách Phòng Kế toán",{bold:true},L,"A31:C31");
  payPut(ws,"D31","Kế toán thanh toán",{bold:true},Ct,"D31:E31");payPut(ws,"F31","Quản lý khoa/phòng",{bold:true},Ct,"F31:G31");payPut(ws,"H31","Người dự trù",{bold:true},Ct);
  payPut(ws,"A33",C.tgd,{},L,"A33:C33");payPut(ws,"D33",C.ktt,{},Ct,"D33:E33");payPut(ws,"F33",C.ql,{},Ct,"F33:G33");payPut(ws,"H33",payNguoiLap(),{},Ct);
  payPut(ws,"E35",dt,{italic:true},Ct,"E35:H35");payPut(ws,"C36","Thủ Quỹ",{bold:true},Ct,"C36:D36");payPut(ws,"E36","Người nhận tiền",{bold:true},Ct,"E36:H36");
  /* khối kiểm tra ngoài vùng in (cột L-M) */
  var ck=payCheck(g);
  payPut(ws,"L1","⚠ KIỂM TRA TRƯỚC KHI TRÌNH KÝ",{bold:true,color:{argb:"FFC00000"}},Ct,"L1:M1");
  ck.items.forEach(function(c,i){payPut(ws,"L"+(i+2),c[1],{},L);payPut(ws,"M"+(i+2),c[2],{color:{argb:c[0]?"FF15803D":"FFC00000"}},L);});
  payPut(ws,"L6","KẾT LUẬN",{bold:true},L);payPut(ws,"M6",ck.end,{bold:true,color:{argb:ck.ok?"FF15803D":"FFC00000"}},L);
  return ws;
}
export function payAddBk(wb,g,sn){
  var thin={style:"thin"},bd={top:thin,left:thin,bottom:thin,right:thin},Ct={horizontal:"center",vertical:"middle",wrapText:true},R={horizontal:"right",vertical:"middle"};
  var ws=wb.addWorksheet(sn,{pageSetup:{paperSize:9,orientation:"portrait",fitToPage:true,fitToWidth:1,fitToHeight:0,margins:{left:.5,right:.5,top:.5,bottom:.5,header:.3,footer:.3}}});
  [13.6,17.9,14,13,17,15,17].forEach(function(w,i){ws.getColumn(i+1).width=w;});
  ws.getRow(2).height=24;ws.getRow(3).height=30;ws.getRow(6).height=24;
  payPut(ws,"A1","MEDDENTAL",{size:12,bold:true});
  payPut(ws,"A2","BẢNG KÊ HÓA ĐƠN",{size:16,bold:true},Ct,"A2:G2");
  payPut(ws,"A3","Nhà cung cấp: "+g.full,{size:11,bold:true},{horizontal:"left",vertical:"middle",wrapText:true},"A3:G3");
  payPut(ws,"A4","Kỳ thanh toán: tháng "+g.thang+"/"+g.nam+"  |  Đơn vị tính: VNĐ",{size:10,italic:true},{horizontal:"left"},"A4:G4");
  ["STT","Số hóa đơn","Ký hiệu","Ngày HĐ","Giá trị trước VAT","Thuế GTGT","Tổng tiền"].forEach(function(t,j){payPut(ws,String.fromCharCode(65+j)+"6",t,{size:11,color:{argb:"FFFFFFFF"}},Ct,null,bd,"FF1F4E79");});
  var s=[0,0,0];
  g.rows.forEach(function(x,i){
    var r=7+i,dd=x.d?new Date(Math.floor(x.d/10000),Math.floor(x.d/100)%100-1,x.d%100):null,F={size:10};
    payPut(ws,"A"+r,i+1,F,Ct,null,bd);payPut(ws,"B"+r,x.r[2],F,Ct,null,bd);payPut(ws,"C"+r,null,F,Ct,null,bd);
    payPut(ws,"D"+r,dd,F,Ct,null,bd).numFmt="dd/mm/yyyy";
    payPut(ws,"E"+r,x.pre,F,R,null,bd).numFmt="#,##0";payPut(ws,"F"+r,x.vat,F,R,null,bd).numFmt="#,##0";payPut(ws,"G"+r,x.tong,F,R,null,bd).numFmt="#,##0";
    if(x.st!=="ok")ws.getCell("B"+r).font=payFont({size:10,color:{argb:"FFFF0000"}});
    s[0]+=x.pre;s[1]+=x.vat;s[2]+=x.tong;
  });
  var e=7+g.rows.length,n=g.rows.length;
  payPut(ws,"A"+e,"TỔNG CỘNG",{bold:true},Ct,"A"+e+":D"+e,bd);
  [["E",s[0],"E"],["F",s[1],"F"],["G",s[2],"G"]].forEach(function(x){payPut(ws,x[0]+e,{formula:"SUM("+x[2]+"7:"+x[2]+(e-1)+")",result:x[1]},{bold:true},R,null,bd).numFmt="#,##0";});
  payPut(ws,"A"+(e+1),"Tổng số HĐ:",{bold:true});payPut(ws,"B"+(e+1),n+" hóa đơn",{bold:true});
  ws.pageSetup.printArea="A$1:G$"+(e+1);
  return ws;
}
export function payAddDs(wb,L,sn){
  var thin={style:"thin"},bd={top:thin,left:thin,bottom:thin,right:thin},Ct={horizontal:"center",vertical:"middle",wrapText:true},Lf={horizontal:"left",vertical:"middle",wrapText:true},R={horizontal:"right",vertical:"middle"};
  var ws=wb.addWorksheet(sn,{pageSetup:{paperSize:9,orientation:"landscape",fitToPage:true,fitToWidth:1,fitToHeight:0,margins:{left:.4,right:.4,top:.5,bottom:.5,header:.3,footer:.3}}});
  [5,73.1,10,18,20,16,8,10,13].forEach(function(w,i){ws.getColumn(i+1).width=w;});
  payPut(ws,"A1","MEDDENTAL",{size:12,bold:true});
  payPut(ws,"A2","DANH SÁCH ĐỀ NGHỊ THANH TOÁN — NCC ĐÃ KHỚP CÔNG NỢ",{size:15,bold:true},Ct,"A2:I2");ws.getRow(2).height=18.6;
  payPut(ws,"A3","(Danh sách nhà cung cấp đã đối chiếu khớp, đủ điều kiện thanh toán. In trình ký một lượt.)",{size:10,italic:true},Ct,"A3:I3");
  ["STT","Nhà cung cấp","Ưu tiên","Số tài khoản","Ngân hàng","Số tiền chốt","Số HĐ","Tình trạng","Còn phải trả"].forEach(function(t,j){payPut(ws,String.fromCharCode(65+j)+"5",t,{size:11,bold:true,color:{argb:"FFFFFFFF"}},Ct,null,bd,"FF1F4E79");});
  ws.getRow(5).height=28.5;
  var rk={"① CAO":0,"② T.Bình":1,"③ Thấp":2},S=L.filter(function(g){return g.chot>0;}).sort(function(a,b){return rk[a.pri]-rk[b.pri]||b.chot-a.chot;}),tot=0,part=0,giu=0;
  S.forEach(function(g,i){
    var r=6+i,F={size:10};tot+=g.chot;if(!g.khop){part++;giu+=g.tong-g.chot+g.extraSum;}
    payPut(ws,"A"+r,i+1,F,Ct,null,bd);payPut(ws,"B"+r,g.full,F,Lf,null,bd);payPut(ws,"C"+r,g.pri,F,Ct,null,bd);payPut(ws,"D"+r,g.stk,F,Lf,null,bd);payPut(ws,"E"+r,g.bank,F,Lf,null,bd);
    payPut(ws,"F"+r,g.chot,F,R,null,bd).numFmt="#,##0";payPut(ws,"G"+r,g.nOk,F,Ct,null,bd);payPut(ws,"H"+r,"Chưa trả",F,Ct,null,bd);payPut(ws,"I"+r,g.chot,F,R,null,bd).numFmt="#,##0";
    if(!g.stk)ws.getCell("D"+r).fill={type:"pattern",pattern:"solid",fgColor:{argb:"FFFFF2CC"}};
    ws.getRow(r).height=Math.max(18,Math.max(Math.ceil(g.full.length/68),Math.ceil(g.bank.length/17),Math.ceil(g.stk.length/17))*13.5+4);
  });
  var e=6+S.length;
  payPut(ws,"A"+e,"TỔNG CỘNG",{bold:true},Ct,"A"+e+":E"+e,bd);
  payPut(ws,"F"+e,{formula:"SUM(F6:F"+(e-1)+")",result:tot},{bold:true},R,null,bd).numFmt="#,##0";
  payPut(ws,"G"+e,null,{},null,null,bd);payPut(ws,"H"+e,null,{},null,null,bd);
  payPut(ws,"I"+e,{formula:"SUM(I6:I"+(e-1)+")",result:tot},{bold:true},R,null,bd).numFmt="#,##0";
  payPut(ws,"A"+(e+1),"Tổng số NCC:",{bold:true},null,"A"+(e+1)+":B"+(e+1));payPut(ws,"C"+(e+1),S.length,{bold:true});
  payPut(ws,"A"+(e+2),'Ghi chú: Chỉ gồm NCC có phần đã đối chiếu KHỚP. NCC "thiếu STK" (tô vàng) cần bổ sung số tài khoản trước khi chuyển khoản.'+(part?" "+part+" NCC chốt từng phần, còn "+payF(giu)+" đ giữ lại xử lý (không nằm trong danh sách).":""),{size:10,italic:true},Lf,"A"+(e+2)+":I"+(e+2));
  ws.getRow(e+2).height=part?30:15;
  var sg=e+4;
  payPut(ws,"B"+sg,"Người lập",{bold:true},Ct,"B"+sg+":C"+sg);payPut(ws,"E"+sg,"Kế toán trưởng",{bold:true},Ct,"E"+sg+":F"+sg);payPut(ws,"H"+sg,"Tổng giám đốc",{bold:true},Ct,"H"+sg+":I"+sg);
  ws.pageSetup.printArea="A$1:I$"+sg;
  return ws;
}
/* ----- Tổng hợp đối chiếu HĐ MISA ⇄ Mua hàng, khớp từng phiếu (1 file, 2 sheet) ----- */
export var PAY_ST_LB={ok:"Khớp",diff:"Lệch tiền",dup:"Trùng số HĐ ở nhiều phiếu",missing:"Chưa có HĐ MISA",noHd:"Phiếu thiếu số HĐ",extra:"HĐ MISA chưa có phiếu mua"};
export var PAY_ST_FILL={ok:"FFE2F0D9",diff:"FFFCE4D6",dup:"FFFFF2CC",missing:"FFFCE4D6",noHd:"FFFFF2CC",extra:"FFDDEBF7"};
export function payDObj(d){return d?new Date(Math.floor(d/10000),Math.floor(d/100)%100-1,d%100):null;}
export function payAddRecon(wb,L){
  var thin={style:"thin",color:{argb:"FF8C96A8"}},bd={top:thin,left:thin,bottom:thin,right:thin};
  var Ct={horizontal:"center",vertical:"middle",wrapText:true},Lf={horizontal:"left",vertical:"middle",wrapText:true},R={horizontal:"right",vertical:"middle"};
  var used=new Set();L.forEach(function(g){g.hd.forEach(function(h){used.add(h);});});
  var orphan=payDb().hd.filter(function(h){return !used.has(h)&&h[6]&&payInM(h[0]);});
  function head(ws,row,cols){
    cols.forEach(function(c,j){var cell=ws.getCell(row,j+1);cell.value=c[0];ws.getColumn(j+1).width=c[1];
      cell.font=payFont({bold:true,color:{argb:"FFFFFFFF"}});cell.alignment=Ct;cell.border=bd;cell.fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF1F4E79"}};});
    ws.getRow(row).height=34;
  }
  function put(ws,r,c,v,al,fmt,fill){var cell=ws.getCell(r,c);cell.value=v;cell.font=payFont({size:10});cell.alignment=al||Lf;cell.border=bd;if(fmt)cell.numFmt=fmt;if(fill)cell.fill={type:"pattern",pattern:"solid",fgColor:{argb:fill}};return cell;}
  /* ===== Sheet 1: TỔNG HỢP theo NCC ===== */
  var w1=wb.addWorksheet("TONG HOP",{views:[{state:"frozen",ySplit:5}],pageSetup:{paperSize:9,orientation:"landscape",fitToPage:true,fitToWidth:1,fitToHeight:0}});
  var t=payToday();
  w1.getCell("A1").value="ĐỐI CHIẾU HÓA ĐƠN MISA ⇄ MUA HÀNG — TỔNG HỢP THEO NHÀ CUNG CẤP";w1.getCell("A1").font=payFont({size:14,bold:true});
  w1.getCell("A2").value=(PAY.m==="all"?"Phạm vi: tất cả các tháng · ":"Phạm vi: THÁNG "+payMLab(PAY.m)+" · ")+"Ngày lập: "+("0"+t.d).slice(-2)+"/"+("0"+t.m).slice(-2)+"/"+t.y+" · Khóa khớp: NCC → số hóa đơn → giá trị (chênh > 0,5 đ là lệch). Chi tiết từng phiếu ở sheet TUNG PHIEU.";w1.getCell("A2").font=payFont({size:10,italic:true});
  head(w1,5,[["STT",6],["Nhà cung cấp",44],["Số phiếu mua",11],["Tổng tiền phiếu mua",19],["Số HĐ MISA (đã gắn phiếu)",14],["Tổng tiền HĐ MISA (đã gắn phiếu)",20],["Số phiếu khớp",11],["Số phiếu lỗi",11],["HĐ MISA chưa có phiếu (số)",14],["HĐ MISA chưa có phiếu (tiền)",19],["Kết luận",30]]);
  var r=6,S=[0,0,0,0,0,0,0,0];
  L.forEach(function(g,i){
    var seen={},nh=0,th=0;g.rows.forEach(function(x){if(x.h&&!seen[x.h[7]]){seen[x.h[7]]=1;nh++;th+=x.h[6];}});
    var nBad=g.rows.length-g.nOk,ex=g.extra.length,vals=[i+1,g.full,g.rows.length,g.tong,nh,th,g.nOk,nBad,ex,g.extraSum];
    var ket=g.khop?"Khớp toàn bộ":(g.nOk?"Khớp "+g.nOk+"/"+g.rows.length+" phiếu — còn "+(nBad+ex)+" mục cần xử lý":"Chưa khớp phiếu nào");
    vals.forEach(function(v,j){put(w1,r,j+1,v,j===1?Lf:(j===3||j===5||j===9?R:Ct),(j===3||j===5||j===9)?"#,##0":null,g.khop?PAY_ST_FILL.ok:null);});
    put(w1,r,11,ket,Lf,null,g.khop?PAY_ST_FILL.ok:PAY_ST_FILL.diff);
    [2,3,4,5,6,7,8,9].forEach(function(k,j){S[j]+=vals[k]||0;});r++;
  });
  put(w1,r,1,"TỔNG CỘNG",Ct);w1.mergeCells(r,1,r,2);
  [3,4,5,6,7,8,9,10].forEach(function(c,j){var col=String.fromCharCode(64+c);put(w1,r,c,{formula:"SUM("+col+"6:"+col+(r-1)+")",result:S[j]},c===4||c===6||c===10?R:Ct,c===4||c===6||c===10?"#,##0":null).font=payFont({size:10,bold:true});});
  put(w1,r,11,"",Lf);
  w1.autoFilter={from:{row:5,column:1},to:{row:Math.max(5,r-1),column:11}};
  /* ===== Sheet 2: TỪNG PHIẾU ===== */
  var w2=wb.addWorksheet("TUNG PHIEU",{views:[{state:"frozen",ySplit:4,xSplit:2}],pageSetup:{paperSize:9,orientation:"landscape",fitToPage:true,fitToWidth:1,fitToHeight:0}});
  w2.getCell("A1").value="ĐỐI CHIẾU TỪNG PHIẾU MUA HÀNG ⇄ HÓA ĐƠN MISA";w2.getCell("A1").font=payFont({size:14,bold:true});
  w2.getCell("A2").value="Lọc theo cột Trạng thái / Nhà cung cấp / Cơ sở để xử lý. Dòng xanh dương = HĐ MISA chưa có phiếu mua.";w2.getCell("A2").font=payFont({size:10,italic:true});
  head(w2,4,[["STT",6],["Nhà cung cấp",34],["Cơ sở",9],["Ngày hạch toán (phiếu)",13],["Số chứng từ (phiếu)",20],["Số HĐ ghi trên phiếu",16],["Tiền phiếu mua",16],["Số HĐ MISA",16],["Ngày HĐ MISA",13],["Số CT MISA",18],["Tiền HĐ MISA",16],["Chênh lệch (phiếu − HĐ)",16],["Trạng thái",24],["Ghi chú / lỗi cơ sở",46]]);
  var rr=5,n=0,sumP=0,sumH=0;
  L.forEach(function(g){
    var grp={};g.rows.forEach(function(x){if(x.r[6]){var o=grp[x.r[6]]=grp[x.r[6]]||{n:0,s:0};o.n++;o.s+=x.r[4];}});
    g.rows.slice().sort(function(a,b){return (a.r[0]||0)-(b.r[0]||0);}).forEach(function(x){
      var h=x.h,f=PAY_ST_FILL[x.st],note=[];
      var nt=x.note;if(nt)payNoteErrs(nt).forEach(function(e){note.push(e.d);});
      if(x.st==="dup"&&h)note.unshift(grp[x.r[6]].n+" phiếu cùng số HĐ; tổng các phiếu "+payF(grp[x.r[6]].s)+" · HĐ MISA "+payF(h[6]));
      n++;put(w2,rr,1,n,Ct,null,f);put(w2,rr,2,g.full,Lf,null,f);put(w2,rr,3,x.r[7]||"",Ct,null,f);
      put(w2,rr,4,payDObj(x.r[0]),Ct,"dd/mm/yyyy",f);put(w2,rr,5,x.r[1],Lf,null,f);put(w2,rr,6,x.r[2],Lf,null,f);put(w2,rr,7,x.r[4],R,"#,##0",f);
      put(w2,rr,8,h?h[2]:"",Lf,null,f);put(w2,rr,9,h?payDObj(h[0]):null,Ct,"dd/mm/yyyy",f);put(w2,rr,10,h?h[1]:"",Lf,null,f);put(w2,rr,11,h?h[6]:null,R,"#,##0",f);
      put(w2,rr,12,h?{formula:"G"+rr+"-K"+rr,result:x.r[4]-h[6]}:null,R,"#,##0;[Red]-#,##0",f);
      put(w2,rr,13,PAY_ST_LB[x.st],Ct,null,f);put(w2,rr,14,note.join("; "),Lf,null,f);
      sumP+=x.r[4];if(h)sumH+=h[6];rr++;
    });
    g.extra.forEach(function(h){
      n++;var f=PAY_ST_FILL.extra;put(w2,rr,1,n,Ct,null,f);put(w2,rr,2,g.full,Lf,null,f);put(w2,rr,3,"",Ct,null,f);put(w2,rr,4,null,Ct,null,f);put(w2,rr,5,"",Lf,null,f);put(w2,rr,6,"",Lf,null,f);put(w2,rr,7,null,R,null,f);
      put(w2,rr,8,h[2],Lf,null,f);put(w2,rr,9,payDObj(h[0]),Ct,"dd/mm/yyyy",f);put(w2,rr,10,h[1],Lf,null,f);put(w2,rr,11,h[6],R,"#,##0",f);put(w2,rr,12,null,R,null,f);put(w2,rr,13,PAY_ST_LB.extra,Ct,null,f);put(w2,rr,14,"",Lf,null,f);sumH+=h[6];rr++;
    });
  });
  orphan.forEach(function(h){
    n++;var f=PAY_ST_FILL.extra;put(w2,rr,1,n,Ct,null,f);put(w2,rr,2,h[8],Lf,null,f);[3,5,6].forEach(function(c){put(w2,rr,c,"",Lf,null,f);});put(w2,rr,4,null,Ct,null,f);put(w2,rr,7,null,R,null,f);
    put(w2,rr,8,h[2],Lf,null,f);put(w2,rr,9,payDObj(h[0]),Ct,"dd/mm/yyyy",f);put(w2,rr,10,h[1],Lf,null,f);put(w2,rr,11,h[6],R,"#,##0",f);put(w2,rr,12,null,R,null,f);put(w2,rr,13,PAY_ST_LB.extra,Ct,null,f);put(w2,rr,14,"NCC chưa có phiếu mua nào",Lf,null,f);sumH+=h[6];rr++;
  });
  put(w2,rr,1,"TỔNG CỘNG",Ct);w2.mergeCells(rr,1,rr,6);
  put(w2,rr,7,{formula:"SUM(G5:G"+(rr-1)+")",result:sumP},R,"#,##0").font=payFont({size:10,bold:true});
  put(w2,rr,11,{formula:"SUM(K5:K"+(rr-1)+")",result:sumH},R,"#,##0").font=payFont({size:10,bold:true});
  w2.autoFilter={from:{row:4,column:1},to:{row:Math.max(4,rr-1),column:14}};
}
export function payOut(wb,fname){
  wb.xlsx.writeBuffer().then(function(buf){shareOrDownload(new Blob([buf],{type:XLSX_MIME}),fname);}).catch(function(e){console.error(e);toast("Không xuất được file Excel");});
}
export function payAscii(s){return String(s).normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/g,"d").replace(/Đ/g,"D").replace(/[^\w-]+/g,"_");}
export function payNeed(fn,args){return kkNeed(["exceljs"],fn?function(){A[fn].apply(A,args||[]);}:null);}

/* ----- In trực tiếp từ app: Giấy đề nghị thanh toán + Bảng kê hóa đơn (A4 dọc, mỗi NCC 2 trang) ----- */
export var PAY_PCSS='@page{size:21cm 29.7cm;margin:12mm 14mm;}body{font-family:"Times New Roman",serif;font-size:11pt;color:#000;}'
  +'.pg{page-break-after:always;}.pg:last-child{page-break-after:auto;}'
  +'.hd{display:flex;justify-content:space-between;font-size:10.5pt;}.hd b{font-size:12pt;}'
  +'.t{text-align:center;font-weight:bold;font-size:16pt;margin:6pt 0 2pt;}.ct{text-align:center;}.it{font-style:italic;}'
  +'table{border-collapse:collapse;width:100%;}table.f td{padding:4pt 0;vertical-align:top;font-size:10.5pt;}table.f td:first-child{width:34%;}'
  +'table.b th,table.b td{border:1px solid #000;padding:3pt 4pt;font-size:10.5pt;}table.b th{text-align:center;}'
  +'table.b td.e{height:20pt;}table.k th{background:#1f4e79;color:#fff;font-weight:normal;font-size:11pt;border:1px solid #000;padding:4pt;}'
  +'table.k td{border:1px solid #000;padding:2pt 4pt;font-size:10pt;}.r{text-align:right;}.c{text-align:center;}'
  +'table.s td{text-align:center;font-size:10.5pt;width:20%;padding-top:2pt;}.sp{height:48pt;}p{margin:4pt 0;font-size:10.5pt;}';
export function payPrintDn(g){
  var C=payDb().cfg,T=payToday(),dt="Hà Nội, ngày "+T.d+" tháng "+T.m+" năm "+T.y,ci=C.ht==="Chuyển khoản",e=esc;
  var rw=function(l,v){return '<tr><td>'+l+'</td><td>'+e(v)+'</td></tr>';},tr='';
    return '<div class="pg"><div class="hd"><b>MEDDENTAL</b><div>Mã CT: ……………………<br>Số phiếu:</div></div>'
    +'<div class="t">GIẤY ĐỀ NGHỊ THANH TOÁN</div><div class="ct it" style="margin-bottom:6pt">Tháng '+("0"+T.m).slice(-2)+' năm '+T.y+'</div>'
    +'<table class="f">'+rw("Họ và tên người dự trù:",payNguoiLap())+rw("Phòng/Ban:",C.pb)+rw("CHỌN NHÀ CUNG CẤP  ▼",g.short)+rw("Lý do thanh toán:",payContent(g))+rw("Hình thức thanh toán:",C.ht)+rw("Đơn vị:",C.dv)+'</table>'
    +'<p><b>CHI TIẾT CÁC NỘI DUNG:</b></p><table class="b"><tr><th style="width:7%">STT</th><th>Nội dung</th><th style="width:7%">ĐVT</th><th style="width:7%">SL</th><th style="width:10%">Đơn giá</th><th style="width:14%">Thành tiền</th><th style="width:14%">Số HĐ</th><th style="width:9%">ĐVCP</th></tr>'
    +'<tr><td class="c">1</td><td>'+e(payContent(g))+'</td><td></td><td></td><td></td><td class="c">'+payF(g.tong)+'</td><td class="c">'+e(paySoHd(g))+'</td><td class="c">'+e(C.dvcp)+'</td></tr>'
    +'<tr><td></td><td colspan="2" class="c"><b>TỔNG CỘNG</b></td><td></td><td></td><td class="r"><b>'+payF(g.tong)+'</b></td><td></td><td></td></tr></table>'
    +'<p><b>Bằng chữ:</b> <i>'+e(soThanhChu(g.tong))+'./.</i></p><p><b>Người thụ hưởng: '+e(g.full)+'</b></p><p>CMND (Nếu thanh toán TM):</p>'
    +'<p>Số tài khoản ngân hàng (Nếu thanh toán CK): '+e(ci?g.stk:"")+'</p><p><b>Tại ngân hàng: '+e(g.bank)+'</b><span style="float:right"><b>Chi nhánh: '+e(g.cn)+'</b></span></p>'
    +'<p style="margin-top:8pt">Chứng từ kèm theo: (Ghi số lượng cho từng loại chứng từ):<br>1. Hóa đơn VAT:<br>2. Biên bản giao nhận:<br>3. Phiếu nhập kho:</p>'
    +'<p class="r it" style="margin-right:20pt">'+dt+'</p>'
    +'<table class="s"><tr><td><b>Tổng giám đốc</b></td><td><b>Phụ trách Phòng Kế toán</b></td><td><b>Kế toán thanh toán</b></td><td><b>Quản lý khoa/phòng</b></td><td><b>Người dự trù</b></td></tr>'
    +'<tr><td class="sp"></td><td></td><td></td><td></td><td></td></tr><tr><td>'+e(C.tgd)+'</td><td></td><td>'+e(C.ktt)+'</td><td>'+e(C.ql)+'</td><td>'+e(payNguoiLap())+'</td></tr></table>'
    +'<p class="r it" style="margin:14pt 20pt 0 0">'+dt+'</p><table class="s"><tr><td></td><td></td><td><b>Thủ Quỹ</b></td><td><b>Người nhận tiền</b></td><td></td></tr></table></div>';
}
export function payPrintBk(g){
  var e=esc,s=[0,0,0],r=g.rows.map(function(x,i){
    s[0]+=x.pre;s[1]+=x.vat;s[2]+=x.tong;
    return '<tr><td class="c">'+(i+1)+'</td><td class="c">'+e(x.r[2])+'</td><td></td><td class="c">'+payDs(x.d)+'</td><td class="r">'+payF(x.pre)+'</td><td class="r">'+payF(x.vat)+'</td><td class="r">'+payF(x.tong)+'</td></tr>';
  }).join("");
  return '<div class="pg"><div class="hd"><b>MEDDENTAL</b></div><div class="t">BẢNG KÊ HÓA ĐƠN</div>'
    +'<p style="font-size:11pt"><b>Nhà cung cấp: '+e(g.full)+'</b></p><p class="it" style="font-size:10pt">Kỳ thanh toán: tháng '+g.thang+'/'+g.nam+'  |  Đơn vị tính: VNĐ</p>'
    +'<table class="k"><tr><th>STT</th><th>Số hóa đơn</th><th>Ký hiệu</th><th>Ngày HĐ</th><th>Giá trị trước VAT</th><th>Thuế GTGT</th><th>Tổng tiền</th></tr>'+r
    +'<tr><td colspan="4" class="c"><b>TỔNG CỘNG</b></td><td class="r"><b>'+payF(s[0])+'</b></td><td class="r"><b>'+payF(s[1])+'</b></td><td class="r"><b>'+payF(s[2])+'</b></td></tr></table>'
    +'<p><b>Tổng số HĐ: &nbsp; '+g.rows.length+' hóa đơn</b></p></div>';
}
export function payPrintOpen(L,title){
  var h='<!doctype html><html><head><meta charset="utf-8"><meta name="format-detection" content="telephone=no"><title>'+esc(title)+'</title><style>'+PAY_PCSS+'</style></head><body>'
    +L.map(function(g){return payPrintDn(g)+payPrintBk(g);}).join("")+'</body></html>';
  printPreviewHtml(h);
}

/* ----- File Excel mẫu để nhập dữ liệu ----- */
export function payTpl(){
  var wb=new ExcelJS.Workbook(),thin={style:"thin"},bd={top:thin,left:thin,bottom:thin,right:thin};
  var hdr=function(ws,row,cols,color){cols.forEach(function(t,j){var c=ws.getCell(row,j+1);c.value=t;c.font=payFont({bold:true,color:{argb:"FFFFFFFF"}});c.fill={type:"pattern",pattern:"solid",fgColor:{argb:color}};c.border=bd;c.alignment={horizontal:"center",vertical:"middle",wrapText:true};});ws.getRow(row).height=30;};
  var note=function(ws,t,n){ws.mergeCells(1,1,1,n);var c=ws.getCell(1,1);c.value=t;c.font=payFont({bold:true,size:11,color:{argb:"FFC00000"}});c.alignment={wrapText:true,vertical:"middle"};ws.getRow(1).height=34;};
  var hd=wb.addWorksheet("HUONG DAN");hd.getColumn(1).width=110;
  ["HƯỚNG DẪN NHẬP DỮ LIỆU — ĐỀ NGHỊ THANH TOÁN NCC","",
   "1. Giữ nguyên tên 3 sheet và dòng tiêu đề (xanh). Xóa các dòng MẪU rồi dán dữ liệu thật từ dòng ngay dưới tiêu đề. Dán giá trị, không dán công thức.",
   "2. DANH MUC NCC: mỗi NCC 1 dòng. Cột STK để dạng Text để không mất số 0 đầu. NCC thiếu STK vẫn đối chiếu được nhưng phiếu để trống ô STK.",
   "3. MUA_HANG: dữ liệu phiếu nhập/mua từ phần mềm kế toán. Cột 'Nhà cung cấp' phải GIỐNG 'Tên đầy đủ' hoặc 'Tên đối chiếu' trong DANH MUC NCC (không phân biệt hoa thường, dấu cách).",
   "4. HOA_DON_MISA: danh sách hóa đơn từ MISA. Số HĐ ở 2 sheet được so theo số (00003324 = 3324). Cột Thuế GTGT có thể để trống nếu HĐ không chịu thuế.",
   "5. Mã cơ sở lấy từ Số chứng từ dạng NK-<mã>-… (ND, BTX, CL, LVL, QN, HO). Có thể gõ thêm cột 'Mã cơ sở' ở MUA_HANG nếu số chứng từ không đúng dạng.",
   "6. Dòng hóa đơn 0 đồng vẫn nhập bình thường (app đếm vào số HĐ như file Excel cũ).",
   "7. MUA_HANG cột I 'Ghi chú lỗi (cơ sở)' (không bắt buộc): ghi lỗi cơ sở cần sửa, vd 'Thiếu nhập kho', 'Thiếu phiếu giao hàng'. App đọc cột này và gom theo cơ sở; cũng có thể ghi thẳng trong app ở từng phiếu.",
   "8. Vào app → Biểu mẫu → Đề nghị thanh toán NCC → Chọn file Excel."].forEach(function(t,i){var c=hd.getCell(i+1,1);c.value=t;c.font=payFont({bold:i===0,size:i===0?14:11});c.alignment={wrapText:true,vertical:"top"};});
  var d=wb.addWorksheet("DANH MUC NCC");[6,26,48,22,34,22,26,48].forEach(function(w,i){d.getColumn(i+1).width=w;});
  note(d,"DANH MỤC NHÀ CUNG CẤP — xóa dòng MẪU rồi nhập thật",8);
  hdr(d,2,["STT","Tên gọi tắt (chọn trên form)","Tên đầy đủ / Người thụ hưởng","Số tài khoản","Ngân hàng","Chi nhánh","Ghi chú","Tên đối chiếu (Map_NCC)"],"FF1F4E79");
  [[1,"VÍ DỤ A (MẪU)","CÔNG TY TNHH VÍ DỤ A","0123456789","Vietcombank","Thành Công","","CÔNG TY TNHH VÍ DỤ A"],[2,"VÍ DỤ B (MẪU)","CÔNG TY CỔ PHẦN VÍ DỤ B","","","","Thiếu STK - cần bổ sung","CÔNG TY CỔ PHẦN VÍ DỤ B"]].forEach(function(r,i){r.forEach(function(v,j){var c=d.getCell(3+i,j+1);c.value=v;c.font=payFont({italic:true,color:{argb:"FF7F7F7F"}});c.border=bd;if(j===3)c.numFmt="@";});});
  var m=wb.addWorksheet("MUA_HANG");[6,14,18,14,48,18,18,12,34].forEach(function(w,i){m.getColumn(i+1).width=w;});
  note(m,"① MUA HÀNG — xóa dòng MẪU từ dòng 4 rồi dán dữ liệu thật vào các cột A–G (cột H 'Mã cơ sở', I 'Ghi chú lỗi (cơ sở)' không bắt buộc)",9);
  hdr(m,3,["STT","Ngày hạch toán","Số chứng từ","Số hóa đơn","Nhà cung cấp","Tổng tiền thanh toán","Giá trị nhập kho","Mã cơ sở","Ghi chú lỗi (cơ sở)"],"FFBF9000");
  var dm=function(day){return new Date(2026,9,day);};
  [[1,dm(2),"NK-ND-10-001","00001001","CÔNG TY TNHH VÍ DỤ A",5500000,5000000,"",""],[2,dm(5),"NK-CL-10-002","00001002","CÔNG TY TNHH VÍ DỤ A",3000000,3000000,"","Thiếu nhập kho; thiếu phiếu giao hàng"],[3,dm(8),"NK-QN-10-003","00002001","CÔNG TY CỔ PHẦN VÍ DỤ B",1200000,1200000,"",""]].forEach(function(r,i){r.forEach(function(v,j){var c=m.getCell(4+i,j+1);c.value=v;c.font=payFont({italic:true,color:{argb:"FF7F7F7F"}});c.border=bd;if(j===1)c.numFmt="dd/mm/yyyy";if(j===5||j===6)c.numFmt="#,##0";});});
  var h=wb.addWorksheet("HOA_DON_MISA");[14,18,14,48,20,18,20].forEach(function(w,i){h.getColumn(i+1).width=w;});
  note(h,"② HÓA ĐƠN MISA — xóa dòng MẪU từ dòng 4 rồi dán dữ liệu thật vào các cột A–G",7);
  hdr(h,3,["Ngày hạch toán","Số chứng từ","Số hóa đơn","Nhà cung cấp","Giá trị hóa đơn (VND)","Thuế GTGT (VND)","Tổng tiền thanh toán"],"FFBF9000");
  [[dm(2),"NK-ND-10-001","1001","CÔNG TY TNHH VÍ DỤ A",5000000,500000,5500000],[dm(5),"NK-CL-10-002","1002","CÔNG TY TNHH VÍ DỤ A",3000000,0,3000000],[dm(8),"NK-QN-10-003","2001","CÔNG TY CỔ PHẦN VÍ DỤ B",1200000,0,1200000]].forEach(function(r,i){r.forEach(function(v,j){var c=h.getCell(4+i,j+1);c.value=v;c.font=payFont({italic:true,color:{argb:"FF7F7F7F"}});c.border=bd;if(j===0)c.numFmt="dd/mm/yyyy";if(j>=4)c.numFmt="#,##0";});});
  return wb;
}
export function payCL(i){var s="";i++;while(i>0){var m=(i-1)%26;s=String.fromCharCode(65+m)+s;i=Math.floor((i-1)/26);}return s;}
export var PAY_KCAT=PAY_LOI.concat(["Thiếu số hóa đơn","HĐ chưa có trong MISA","Số HĐ trùng","Sai giá trị","Thiếu ngày hạch toán","Thiếu mã cơ sở","HĐ MISA thừa","Khác"]);
export function payAddErr(wb,E,only){
  var thin={style:"thin"},bd={top:thin,left:thin,bottom:thin,right:thin},Ct={horizontal:"center",vertical:"middle",wrapText:true},Lf={horizontal:"left",vertical:"middle",wrapText:true},R={horizontal:"right",vertical:"middle"};
  var rows=[],T=payToday(),P=payDb(),dts=("0"+T.d).slice(-2)+"/"+("0"+T.m).slice(-2)+"/"+T.y;
  E.forEach(function(B){B.items.forEach(function(it){it.e.forEach(function(z){rows.push({cs:payCsLabel(B.cs),ncc:it.ncc,d:it.d,ct:it.ct||"",hd:it.hd||"",t:it.t||0,k:z.k,dt:z.d,s:z.s});});});});
  var N=rows.length,last=4+N,SN="LOI CO SO",hf={size:11,bold:true,color:{argb:"FFFFFFFF"}};
  var ws=wb.addWorksheet(SN,{pageSetup:{paperSize:9,orientation:"landscape",fitToPage:true,fitToWidth:1,fitToHeight:0,margins:{left:.4,right:.4,top:.5,bottom:.5,header:.3,footer:.3}}});
  [5,24,34,12,18,14,16,24,58,13,14].forEach(function(w,i){ws.getColumn(i+1).width=w;});
  payPut(ws,"A1","MEDDENTAL",{size:12,bold:true});
  payPut(ws,"A2",only&&only!=="all"?"BÁO LỖI MUA HÀNG — CƠ SỞ "+(only==="?"?"CHƯA RÕ":payCsFull(only).toUpperCase()):"TỔNG HỢP LỖI MUA HÀNG THEO CƠ SỞ",{size:15,bold:true},Ct,"A2:K2");ws.getRow(2).height=20;
  payPut(ws,"A3","Ngày lập "+dts+" · "+N+" lỗi · File nguồn: "+(P.file||"—")+" · Dùng mũi tên lọc ở dòng tiêu đề để chọn Cơ sở / Loại lỗi / Trạng thái.",{size:10,italic:true},Lf,"A3:K3");
  ["STT","Cơ sở","Nhà cung cấp","Ngày hạch toán","Số chứng từ","Số hóa đơn","Số tiền (đ)","Loại lỗi","Chi tiết lỗi","Nguồn","Trạng thái"].forEach(function(t,j){payPut(ws,payCL(j)+"4",t,hf,Ct,null,bd,"FF1F4E79");});
  ws.getRow(4).height=28.5;
  rows.forEach(function(x,i){
    var r=5+i,F={size:10};
    payPut(ws,"A"+r,i+1,F,Ct,null,bd);payPut(ws,"B"+r,x.cs,{size:10,bold:true},Ct,null,bd);payPut(ws,"C"+r,x.ncc,F,Lf,null,bd);
    var c=payPut(ws,"D"+r,x.d?new Date(Date.UTC(Math.floor(x.d/10000),Math.floor(x.d/100)%100-1,x.d%100)):null,F,Ct,null,bd);c.numFmt="dd/mm/yyyy";
    payPut(ws,"E"+r,x.ct,F,Lf,null,bd);payPut(ws,"F"+r,x.hd,F,Lf,null,bd);payPut(ws,"G"+r,x.t,F,R,null,bd).numFmt="#,##0";
    payPut(ws,"H"+r,x.k,F,Lf,null,bd);payPut(ws,"I"+r,x.dt,F,Lf,null,bd);payPut(ws,"J"+r,x.s,F,Ct,null,bd);
    var k=payPut(ws,"K"+r,"Chưa xử lý",F,Ct,null,bd);
    k.dataValidation={type:"list",allowBlank:true,formulae:['"Chưa xử lý,Đang xử lý,Đã xử lý"']};
    ws.getRow(r).height=Math.max(18,Math.max(Math.ceil(String(x.dt).length/52),Math.ceil(String(x.ncc).length/30))*13.5+4);
  });
  ws.autoFilter="A4:K"+last;
  ws.views=[{state:"frozen",xSplit:3,ySplit:4}];
  ws.pageSetup.printTitlesRow="4:4";
  /* Sheet tổng hợp: cơ sở × loại lỗi (COUNTIFS sống theo sheet LOI CO SO, lọc/sửa trạng thái thì số tự cập nhật) */
  var cats=PAY_KCAT.filter(function(k){return rows.some(function(x){return x.k===k;});});
  rows.forEach(function(x){if(cats.indexOf(x.k)<0)cats.push(x.k);});
  var css=payCsCodes().map(payCsLabel).filter(function(c){return rows.some(function(x){return x.cs===c;});});
  rows.forEach(function(x){if(x.cs!=="Chưa rõ"&&css.indexOf(x.cs)<0)css.push(x.cs);});
  if(rows.some(function(x){return x.cs==="Chưa rõ";}))css.push("Chưa rõ");
  var s2=wb.addWorksheet("TONG HOP",{pageSetup:{paperSize:9,orientation:"landscape",fitToPage:true,fitToWidth:1,fitToHeight:0}});
  var nc=cats.length,cT=nc+1,cU=nc+2,lc=payCL(nc);
  s2.getColumn(1).width=14;for(var q=0;q<nc;q++)s2.getColumn(q+2).width=15;s2.getColumn(cT+1).width=11;s2.getColumn(cU+1).width=13;
  payPut(s2,"A1","MEDDENTAL",{size:12,bold:true});
  payPut(s2,"A2","TỔNG HỢP LỖI THEO CƠ SỞ × LOẠI LỖI",{size:15,bold:true},Ct,"A2:"+payCL(cU)+"2");s2.getRow(2).height=20;
  payPut(s2,"A3","Số liệu tự tính từ sheet LOI CO SO (đổi Trạng thái bên đó thì cột \"Chưa xử lý\" tự cập nhật).",{size:10,italic:true},Lf,"A3:"+payCL(cU)+"3");
  payPut(s2,"A4","Cơ sở",hf,Ct,null,bd,"FF1F4E79");
  cats.forEach(function(k,j){payPut(s2,payCL(j+1)+"4",k,hf,Ct,null,bd,"FF1F4E79");});
  payPut(s2,payCL(cT)+"4","Tổng lỗi",hf,Ct,null,bd,"FF1F4E79");payPut(s2,payCL(cU)+"4","Chưa xử lý",hf,Ct,null,bd,"FF1F4E79");
  s2.getRow(4).height=42;
  var rngB="'"+SN+"'!$B$5:$B$"+last,rngH="'"+SN+"'!$H$5:$H$"+last,rngK="'"+SN+"'!$K$5:$K$"+last,colTot=new Array(nc).fill(0),gt=0;
  css.forEach(function(cs,i){
    var r=5+i,tot=0;
    payPut(s2,"A"+r,cs,{size:10,bold:true},Ct,null,bd);
    cats.forEach(function(k,j){
      var v=rows.filter(function(x){return x.cs===cs&&x.k===k;}).length;tot+=v;colTot[j]+=v;
      payPut(s2,payCL(j+1)+r,{formula:"COUNTIFS("+rngB+",$A"+r+","+rngH+","+payCL(j+1)+"$4)",result:v},{size:10},Ct,null,bd);
    });
    gt+=tot;
    payPut(s2,payCL(cT)+r,{formula:"SUM(B"+r+":"+lc+r+")",result:tot},{size:10,bold:true},Ct,null,bd);
    payPut(s2,payCL(cU)+r,{formula:"COUNTIFS("+rngB+",$A"+r+","+rngK+",\"<>Đã xử lý\")",result:tot},{size:10,bold:true},Ct,null,bd);
  });
  var tr=5+css.length;
  payPut(s2,"A"+tr,"TỔNG",{bold:true},Ct,null,bd,"FFDDEBF7");
  cats.forEach(function(k,j){var L=payCL(j+1);payPut(s2,L+tr,{formula:"SUM("+L+"5:"+L+(tr-1)+")",result:colTot[j]},{bold:true},Ct,null,bd,"FFDDEBF7");});
  [cT,cU].forEach(function(j,ix){var L=payCL(j);payPut(s2,L+tr,{formula:"SUM("+L+"5:"+L+(tr-1)+")",result:gt},{bold:true},Ct,null,bd,"FFDDEBF7");});
  s2.views=[{state:"frozen",xSplit:1,ySplit:4}];
  return ws;
}
