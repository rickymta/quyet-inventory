/* Nhận diện cột Excel + xuất Excel (dòng gốc 1776–2136). Logic thuần, port gần nguyên văn. */
import { esc, norm, parseNum, fmt, normKey, daysTo, fmtDate, diffOf, BUCKETS, toast, kkNeed, klog, X } from '../../core';
/* Hàm của phân hệ khác gọi lúc chạy qua X: xlPrint (docs), sgOf (settings), addUnmSheet (count) */
const xlPrint = (...a) => X.xlPrint(...a);
const sgOf = (...a) => X.sgOf(...a);
const addUnmSheet = (...a) => X.addUnmSheet(...a);

export var FIELDS=[
  {k:"branch",label:"Chi nhánh / Kho"},
  {k:"code",label:"Mã vật tư"},
  {k:"name",label:"Tên vật tư"},
  {k:"unit",label:"ĐVT"},
  {k:"open",label:"Tồn đầu kỳ"},
  {k:"in",label:"Nhập trong kỳ"},
  {k:"out",label:"Xuất trong kỳ"},
  {k:"close",label:"Tồn cuối kỳ"}
];
export var KW={
  unit:[/^dvt$/,/don vi tinh/,/^don vi$/],
  open:[/ton dau/,/dau ky/],
  close:[/ton cuoi/,/cuoi ky/,/du cuoi/],
  "in":[/nhap/],
  out:[/xuat/],
  branch:[/chi nhanh/,/^kho( |$)/,/co so/,/ma kho/,/ten kho/],
  code:[/ma (so )?vat tu/,/ma vt/,/ma hang/,/^ma( so)?$/],
  name:[/ten vat tu/,/ten vt/,/ten hang/,/^ten$/,/ten/]
};
export var ORDER=["unit","open","close","in","out","branch","code","name"];

export function autoMap(headers){
  var H=headers.map(function(h){return norm(h);});
  var used={},map={};
  ORDER.forEach(function(f){
    var best=-1,bestScore=0;
    H.forEach(function(h,i){
      if(used[i]||!h)return;
      var hit=KW[f].some(function(re){return re.test(h);});
      if(hit){
        var sc=1;
        if(/so luong|(^| )sl( |$)/.test(h))sc+=1;
        if(/gia tri|thanh tien|(^| )gt( |$)|don gia|tien/.test(h))sc-=1;
        if(sc>bestScore){bestScore=sc;best=i;}
      }
    });
    if(best>=0&&bestScore>0){map[f]=best;used[best]=true;}
  });
  return map;
}
export function detectHeaderRow(rows){
  var best=0,bestScore=0,n=Math.min(rows.length,20);
  for(var r=0;r<n;r++){
    var sc=0,row=rows[r]||[];
    for(var c=0;c<row.length;c++){
      var h=norm(row[c]);
      if(!h)continue;
      for(var f=0;f<ORDER.length;f++){
        if(KW[ORDER[f]].some(function(re){return re.test(h);})){sc++;break;}
      }
    }
    if(sc>bestScore){bestScore=sc;best=r;}
  }
  return bestScore>=3?best:0;
}
export function colName(i){var s="";i++;while(i>0){s=String.fromCharCode(65+((i-1)%26))+s;i=Math.floor((i-1)/26);}return s;}

/* Kiểm tra dữ liệu nguồn (KHÔNG tự sửa): mã trống/trùng trong cùng kho, thiếu ĐVT, số âm, tồn cuối lệch công thức */
export function validateItems(items){
  var errs=[],seen={},EPS=0.0001;
  items.forEach(function(it,i){
    var ref="#"+(i+1)+" · "+(it.code||"(không mã)")+" · "+String(it.name||"").slice(0,40);
    var code=String(it.code||"").trim().toLowerCase();
    if(!code)errs.push({k:"Thiếu mã",t:ref});
    else{var key=(it.branch||"")+"|"+code;if(seen[key]!==undefined)errs.push({k:"Mã trùng trong cùng kho",t:ref+" (trùng dòng #"+(seen[key]+1)+")"});else seen[key]=i;}
    if(!String(it.unit||"").trim())errs.push({k:"Thiếu đơn vị tính",t:ref});
    ["open","in","out","close"].forEach(function(f){var v=it[f];if(typeof v!=="number"||!isFinite(v)||v<0)errs.push({k:"Số lượng không hợp lệ ("+f+")",t:ref});});
    if([it.open,it["in"],it.out,it.close].every(function(v){return typeof v==="number"&&isFinite(v);})&&Math.abs(it.open+it["in"]-it.out-it.close)>EPS)
      errs.push({k:"Tồn cuối ≠ Đầu + Nhập − Xuất",t:ref+" (sổ: "+fmt(it.close)+" · tính: "+fmt(it.open+it["in"]-it.out)+")"});
  });
  return errs;
}
export function validateHtml(errs){
  if(!errs.length)return '<div class="card mt16" style="border-color:var(--green-ln);background:var(--green-bg);color:var(--green)">Dữ liệu hợp lệ: không phát hiện lỗi.</div>';
  var by={};errs.forEach(function(e){(by[e.k]=by[e.k]||[]).push(e.t);});
  var h='<div class="card mt16" style="border-color:var(--red-ln);background:var(--red-bg)"><div class="lbl" style="color:var(--red)">Phát hiện '+errs.length+' vấn đề dữ liệu (app không tự sửa)</div>';
  Object.keys(by).forEach(function(k){
    h+='<details style="margin-top:6px"><summary style="font-weight:700;cursor:pointer">'+esc(k)+' · '+by[k].length+'</summary><div style="max-height:180px;overflow:auto;font-size:12px;margin-top:4px">'+by[k].slice(0,200).map(esc).join("<br>")+(by[k].length>200?"<br>… và "+(by[k].length-200)+" dòng khác":"")+'</div></details>';
  });
  return h+'<div style="font-size:12px;margin-top:8px">Hãy sửa file nguồn rồi chọn lại, hoặc vẫn tạo kỳ và xác nhận ở bước sau.</div></div>';
}
export function buildItems(rows,start,map,branchManual,hsd){
  var out=[];
  function get(row,k){return map[k]===undefined?"":row[map[k]];}
  for(var r=start;r<rows.length;r++){
    var row=rows[r]||[];
    var name=String(get(row,"name")==null?"":get(row,"name")).trim();
    var code=String(get(row,"code")==null?"":get(row,"code")).trim();
    if(!name&&!code)continue;
    var nn=norm(name);
    if(nn.indexOf("tong cong")===0||nn==="cong"||nn.indexOf("tong so")===0)continue;
    var open=parseNum(get(row,"open"));
    var inn=parseNum(get(row,"in"));
    var outn=parseNum(get(row,"out"));
    var close=map.close!==undefined?parseNum(get(row,"close")):open+inn-outn;
    var branch=(map.branch!==undefined?String(get(row,"branch")==null?"":get(row,"branch")).trim():"")||branchManual.trim()||"Kho chính";
    var reg=hsd[normKey(branch,code,name)];
    
    out.push({
      id:"i"+r+"_"+out.length,branch:branch,code:code,name:name,
      unit:String(get(row,"unit")==null?"":get(row,"unit")).trim(),
      open:open,"in":inn,out:outn,close:close,
      counted:false,countQty:null,note:"",
      batches:reg?reg.batches.map(function(b){return {qty:b.qty,exp:b.exp};}):[],
      boxes:(reg&&reg.boxes)?reg.boxes.map(function(b){var c=Object.assign({},b);c.seen=false;return c;}):[]
    });
  }
  return out;
}

/* ================= Xuất Excel ================= */
export var XLSX_MIME="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
export function fileNameOf(p){return ("KiemKe_"+p.name).normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/g,"d").replace(/Đ/g,"D").replace(/[^\w-]+/g,"_")+".xlsx";}
export function dlAnchor(blob,fname){
  try{
    var url=URL.createObjectURL(blob);
    var a=document.createElement("a");
    a.href=url;a.download=fname;
    document.body.appendChild(a);a.click();
    setTimeout(function(){URL.revokeObjectURL(url);if(a.parentNode)a.parentNode.removeChild(a);},4000);
    toast("Đã tải file — xem trong Tải xuống / app Tệp");
  }catch(e){console.error(e);toast("Trình duyệt chặn tải file — mở lại bằng Chrome/Safari");}
}
export function shareOrDownload(blob,fname){
  var file=null;
  try{file=new File([blob],fname,{type:blob.type});}catch(e){file=null;}
  if(file&&navigator.share&&navigator.canShare&&navigator.canShare({files:[file]})){
    navigator.share({files:[file],title:fname}).then(function(){
      toast("Đã xuất — chọn nơi lưu/gửi trong bảng chia sẻ");
    }).catch(function(err){
      if(err&&err.name==="AbortError"){toast("Đã hủy xuất file");return;}
      dlAnchor(blob,fname);
    });
    return;
  }
  dlAnchor(blob,fname);
}
export function hsdRowsOf(p){
  var rows=[];
  function bk(d){for(var i=0;i<BUCKETS.length;i++)if(BUCKETS[i].test(d))return BUCKETS[i].label;return "Còn > 6 tháng";}
  p.items.forEach(function(it){
    (it.batches||[]).forEach(function(b){
      if(!b.exp)return;
      var d=daysTo(b.exp);
      rows.push([it.branch,it.code,it.name,it.unit,(b.qty===null||b.qty===undefined)?"":b.qty,fmtDate(b.exp),d,bk(d),"",""]);
    });
    (it.boxes||[]).forEach(function(b){
      if(b.st==='out'||!b.exp)return;
      var d=daysTo(b.exp);
      rows.push([it.branch,it.code,it.name,it.unit,b.qty||1,fmtDate(b.exp),d,bk(d),b.label||"",[b.lot?"Lô "+b.lot:"",b.ser?"Seri "+b.ser:"",b.gtin].filter(Boolean).join(" · ")]);
    });
  });
  rows.sort(function(a,b){return a[6]-b[6];});
  return rows;
}
/* Dựng file theo đúng biểu mẫu BIÊN BẢN KIỂM KÊ (mỗi kho 1 sheet) */
export function buildBienBan(p){
  var wb=new ExcelJS.Workbook();
  wb.calcProperties.fullCalcOnLoad=true;
  /* Tạo watermark PNG từ canvas */
  var wmId=null;
  try{
    var wc=document.createElement('canvas');
    wc.width=380;wc.height=210;
    var wctx=wc.getContext('2d');
    wctx.translate(190,105);
    wctx.rotate(-28*Math.PI/180);
    wctx.font='13px Arial,sans-serif';
    wctx.fillStyle='rgba(0,0,0,0.075)';
    wctx.textAlign='center';
    wctx.textBaseline='middle';
    wctx.fillText('Mai Văn Quyết quyetmv',0,0);
    var b64=wc.toDataURL('image/png').split(',')[1];
    wmId=wb.addImage({base64:b64,extension:'png'});
  }catch(e){wmId=null;}
  var d=new Date(p.createdAt);
  var thang=d.getMonth()+1,nam=d.getFullYear();
  var thin={style:"thin"};
  var bAll={top:thin,left:thin,bottom:thin,right:thin};
  var branches=[];
  p.items.forEach(function(it){if(branches.indexOf(it.branch)<0)branches.push(it.branch);});
  var used={};
  branches.forEach(function(br){
    var items=p.items.filter(function(it){return it.branch===br;});
    var sname=String(br||"Kho").replace(/[\[\]\*\?\/\\:']/g," ").replace(/\s+/g," ").trim().substring(0,31)||"Kho";
    var base=sname,k=2;
    while(used[sname.toLowerCase()]){sname=base.substring(0,28)+" "+k;k++;}
    used[sname.toLowerCase()]=1;
    var ws=wb.addWorksheet(sname,{views:[{state:"frozen",ySplit:4}]});xlPrint(ws,null,true);
    if(wmId!==null)try{ws.addBackgroundImage(wmId);}catch(e){klog("ws.addBackgroundImage(wmId);",e)}
    var cwArr=[4.43,14.57,52,12.29,14.57,14.57,14.57,14.57,11.43,11.43,49.29,13];
    cwArr.forEach(function(w,i){ws.getColumn(i+1).width=w;});
    var last=4+items.length;
    ws.mergeCells(1,1,1,11);
    var c=ws.getCell(1,1);
    c.value="BIÊN BẢN KIỂM KÊ";
    c.font={name:"Arial",size:16,bold:true};
    c.alignment={horizontal:"center",vertical:"middle",wrapText:true};
    ws.getRow(1).height=20.1;
    ws.mergeCells(2,1,2,11);
    c=ws.getCell(2,1);
    c.value="Kho: "+br+", Tháng "+thang+" năm "+nam;
    c.font={name:"Arial",size:11,bold:true,italic:true};
    c.alignment={horizontal:"center",vertical:"middle",wrapText:true};
    ws.getRow(2).height=14.1;
    ["E","F","G","H","I","J"].forEach(function(col){
      var cc=ws.getCell(col+"3");
      cc.value={formula:"SUM("+col+"5:"+col+last+")"};
      cc.font={name:"Arial",size:16,bold:true};
      cc.alignment={vertical:"middle"};
      cc.numFmt="#,##0";
    });
    ws.getRow(3).height=20.25;
    ["STT","Mã hàng","Tên hàng","ĐVT","Đầu kỳ","Nhập kho","Xuất kho","Cuối kỳ","Kiểm kê","Chênh","Ghi chú","Ảnh"].forEach(function(t,i){
      var cc=ws.getCell(4,i+1);
      cc.value=t;
      cc.font={name:"Arial",size:10,bold:true};
      cc.fill={type:"pattern",pattern:"solid",fgColor:{argb:"FFD8D8D8"}};
      cc.border=bAll;
      cc.alignment={horizontal:"center",vertical:"middle",wrapText:true};
    });
    ws.getRow(4).height=25.5;
    items.forEach(function(it,i){
      var r=5+i,ci,cc;
      for(ci=1;ci<=11;ci++){
        cc=ws.getCell(r,ci);
        cc.font={name:"Times New Roman",size:11};
        cc.border=bAll;
      }
      ws.getCell(r,1).value=i+1;
      ws.getCell(r,1).alignment={horizontal:"center",wrapText:true};
      ws.getCell(r,2).value=it.code;
      ws.getCell(r,3).value=it.name;
      ws.getCell(r,4).value=it.unit;
      [2,3,4].forEach(function(x){ws.getCell(r,x).alignment={horizontal:"left",wrapText:true};});
      [[5,it.open],[6,it["in"]],[7,it.out],[8,it.close]].forEach(function(pr){
        var c2=ws.getCell(r,pr[0]);
        c2.value=pr[1];
        c2.alignment={horizontal:"right",wrapText:true};
        c2.numFmt="#,##0.00_);(#,##0.00)";
      });
      if(it.counted){
        ws.getCell(r,9).value=it.countQty;
        ws.getCell(r,10).value={formula:"I"+r+"-H"+r};
        ws.getCell(r,10).numFmt="#,##0.00";
      }
      ws.getCell(r,11).value=it.note||"";
      ws.getCell(r,11).alignment={wrapText:true};
      /* Cột 12: Ảnh */
      if(it.photo){
        try{
          var b64=it.photo.split(",")[1];
          if(b64){
            var imgId=wb.addImage({base64:b64,extension:"jpeg"});
            ws.addImage(imgId,{
              tl:{col:11,row:r-1},
              br:{col:12,row:r},
              editAs:"oneCell"
            });
            ws.getRow(r).height=72;
          }
        }catch(imgErr){ws.getCell(r,12).value="(ảnh)";}
      }
    });
    var sr=last+2;
    var s1=ws.getCell(sr,3);
    s1.value="GIÁM ĐỐC CƠ SỞ";s1.font={name:"Times New Roman",size:11,bold:true};s1.alignment={horizontal:"center"};
    ws.mergeCells(sr,6,sr,7);
    var s2=ws.getCell(sr,6);
    s2.value="THỦ KHO CƠ SỞ";s2.font={name:"Times New Roman",size:11,bold:true};s2.alignment={horizontal:"center"};
    ws.mergeCells(sr,10,sr,11);
    var s3=ws.getCell(sr,10);
    s3.value="PHÒNG HÀNH CHÍNH HẬU CẦN";s3.font={name:"Times New Roman",size:11,bold:true};s3.alignment={horizontal:"center"};
    /* Chữ ký điện tử (nếu có): ảnh dưới nhãn, rồi họ tên + thời gian + thiết bị */
    var sgs=p.sig||{};
    var px=cwArr.map(function(w){return w*7+5;});
    function anchorCol(c1,c2,imgW){
      var total=0,i2;
      for(i2=c1-1;i2<=c2-1;i2++)total+=px[i2];
      var off=Math.max(0,(total-imgW)/2),idx=c1-1;
      while(idx<c2-1&&off>px[idx]){off-=px[idx];idx++;}
      return idx+off/px[idx];
    }
    [[3,3,sgs.giamDoc],[6,7,sgs.thuKho],[10,11,sgs.hanhChinh]].forEach(function(z){
      var s=z[2];if(!s||!s.img)return;
      try{
        var hh=48,ww=Math.round(hh*(s.w||300)/(s.h||120));
        if(ww>150){ww=150;hh=Math.round(ww*(s.h||120)/(s.w||300));}
        var imgId=wb.addImage({base64:s.img.split(",")[1],extension:"png"});
        ws.getRow(sr+1).height=Math.round(hh*0.75)+8;
        ws.addImage(imgId,{tl:{col:anchorCol(z[0],z[1],ww),row:sr+0.08},ext:{width:ww,height:hh}});
        if(z[1]>z[0]){ws.mergeCells(sr+2,z[0],sr+2,z[1]);ws.mergeCells(sr+3,z[0],sr+3,z[1]);}
        var nm=ws.getCell(sr+2,z[0]);
        nm.value=s.ten;nm.font={name:"Times New Roman",size:11,bold:true};nm.alignment={horizontal:"center"};
        var tm=ws.getCell(sr+3,z[0]);
        tm.value="Ký điện tử "+s.time+" ("+s.dev+")"+(s.auth?" · "+s.auth:"");tm.font={name:"Arial",size:8,italic:true};
        tm.alignment={horizontal:"center",vertical:"top",wrapText:true};
        ws.getRow(sr+3).height=24;
      }catch(sigErr){klog("var hh=48,ww=Math.round(hh*(s.w||300)/(s.h||120)",sigErr)}
    });
    /* Tên người ký đã thiết lập theo chi nhánh (nếu chưa ký điện tử) */
    var sgn=sgOf(p.folder);
    [[3,3,'giamDoc'],[6,7,'thuKho'],[10,11,'hanhChinh']].forEach(function(z){
      if(sgs[z[2]]&&sgs[z[2]].img)return;
      var nm=sgn[z[2]];if(!nm)return;
      if(z[1]>z[0])ws.mergeCells(sr+5,z[0],sr+5,z[1]);
      var c=ws.getCell(sr+5,z[0]);
      c.value=nm;c.font={name:"Times New Roman",size:11,bold:true};c.alignment={horizontal:"center",wrapText:true};
    });
  });
  var hsd=hsdRowsOf(p);
  if(hsd.length){
    var ws2=wb.addWorksheet("HẠN SỬ DỤNG",{views:[{state:"frozen",ySplit:1}]});xlPrint(ws2,"1:1",true);
    if(wmId!==null)try{ws2.addBackgroundImage(wmId);}catch(e){klog("ws2.addBackgroundImage(wmId);",e)}
    [18,14.57,45,10,10,14,14,18,20,30].forEach(function(w,i){ws2.getColumn(i+1).width=w;});
    ["Chi nhánh/Kho","Mã hàng","Tên hàng","ĐVT","Số lượng","Hạn sử dụng","Còn lại (ngày)","Cảnh báo","Nhãn / Kích thước","Lô · Seri · Mã NSX (GTIN)"].forEach(function(t,i){
      var cc=ws2.getCell(1,i+1);
      cc.value=t;
      cc.font={name:"Arial",size:10,bold:true};
      cc.fill={type:"pattern",pattern:"solid",fgColor:{argb:"FFD8D8D8"}};
      cc.border=bAll;
      cc.alignment={horizontal:"center",vertical:"middle",wrapText:true};
    });
    hsd.forEach(function(rw,i){
      rw.forEach(function(v,ci){
        var cc=ws2.getCell(i+2,ci+1);
        cc.value=v;
        cc.font={name:"Times New Roman",size:11};
        cc.border=bAll;
      });
    });
  }
  addUnmSheet(wb,p);
  return wb;
}
export function exportExcel(p){
  var fname=fileNameOf(p);
  if(!kkNeed(["exceljs"],function(){exportExcel(p);}))return;
  if(typeof ExcelJS!=="undefined"){
    buildBienBan(p).xlsx.writeBuffer().then(function(buf){
      shareOrDownload(new Blob([buf],{type:XLSX_MIME}),fname);
    }).catch(function(e){console.error(e);exportExcelBasic(p,fname);});
    return;
  }
  exportExcelBasic(p,fname);
}
export function exportExcelBasic(p,fname){
  if(!kkNeed(["xlsx"],function(){exportExcelBasic(p,fname);}))return;
  var rows=p.items.map(function(it,i){
    return {"STT":i+1,"Chi nhánh/Kho":it.branch,"Mã hàng":it.code,"Tên hàng":it.name,"ĐVT":it.unit,
      "Đầu kỳ":it.open,"Nhập kho":it["in"],"Xuất kho":it.out,"Cuối kỳ":it.close,
      "Kiểm kê":it.counted?it.countQty:"","Chênh":it.counted?diffOf(it):"","Ghi chú":it.note||""};
  });
  var wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(rows),"Kiem ke");
  var out=XLSX.write(wb,{bookType:"xlsx",type:"array"});
  shareOrDownload(new Blob([out],{type:XLSX_MIME}),fname);
}

