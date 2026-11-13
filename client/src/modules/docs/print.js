/* Mẫu biểu dùng chung: cài đặt in, xuất Word, xem trước & in (dòng gốc 2504–2636). Giữ dạng chuỗi HTML. */
import { db, esc, klog, toast, X } from '../../core';
import { dlAnchor } from '../excel/excel.js';
/* dot() thuộc phân hệ forms */
const dot = (...a) => X.dot(...a);

export var PR_DEF={paper:'A4',orient:'portrait',margin:20,font:'Times New Roman',size:13,title:'center'};
export var PAPER={A3:{w:29.7,h:42,xl:8},A4:{w:21,h:29.7,xl:9},A5:{w:14.8,h:21,xl:11}};
export function PR(){return Object.assign({},PR_DEF,db.print||{});}
export function prPage(ori){var o=PR(),pp=PAPER[o.paper]||PAPER.A4,l=ori==='landscape';return {w:l?pp.h:pp.w,h:l?pp.w:pp.h,xl:pp.xl};}
export function docStyle(ori){
  var o=PR(),pg=prPage(ori),sz=+o.size||13;
  var t={center:'text-align:center;text-transform:uppercase;',left:'text-align:left;text-transform:uppercase;',box:'text-align:center;text-transform:uppercase;border:2px solid #000;padding:6pt;'}[o.title]||'text-align:center;text-transform:uppercase;';
  return '@page{size:'+pg.w+'cm '+pg.h+'cm;margin:'+(+o.margin||20)+'mm;}'
    +'body{font-family:"'+o.font+'",serif;font-size:'+sz+'pt;}'
    +'h1{font-size:'+(sz+3)+'pt;'+t+'margin-top:18pt;margin-bottom:2pt;}'
    +'h2{font-size:'+sz+'pt;margin-top:16pt;}'
    +'table{border-collapse:collapse;width:100%;margin:8pt 0 12pt;}'
    +'th,td{border:1px solid #000;padding:4pt 6pt;font-size:'+Math.max(8,sz-2)+'pt;}'
    +'thead{display:table-header-group;}tr{page-break-inside:avoid;}'
    +'th{background:#dbe5f1;font-weight:bold;text-align:center;text-transform:uppercase;}'
    +'.hdrtbl td{border:none;padding:0;vertical-align:top;}'
    +'.center{text-align:center;}'
    +'.sign td{border:none;text-align:center;font-weight:bold;padding-top:8pt;}';
}
/* bảng in nhanh: tiêu đề + bảng + khối ký, theo cài đặt in */
export function printTableHtml(title,subs,heads,rows,sigs,ori,widths){
  var cg=widths?'<colgroup>'+widths.map(function(w){return '<col style="width:'+w+'%">';}).join('')+'</colgroup>':'';
  var h='<style>@page{margin:10mm 12mm;}table.lst{table-layout:fixed;margin:6pt 0 8pt;}table.lst th,table.lst td{font-size:9pt;line-height:1.2;padding:2pt 4pt;word-wrap:break-word;}h1.lst{margin-top:0;}</style>'
    +'<h1 class="lst">'+esc(title)+'</h1>'+(subs||[]).map(function(x){return '<div style="text-align:center">'+esc(x)+'</div>';}).join('')
    +'<table class="lst">'+cg+'<thead><tr>'+heads.map(function(x){return '<th>'+esc(x)+'</th>';}).join('')+'</tr></thead><tbody>'
    +rows.map(function(r){return '<tr>'+r.map(function(v,i){var c=(i===0||/^[+\-−]?[\d.,]+$/.test(String(v))||String(v).length<=4);return '<td style="text-align:'+(c?'center':'left')+'">'+esc(v)+'</td>';}).join('')+'</tr>';}).join('')
    +'</tbody></table>';
  if(sigs)h+=docSignHtml(sigs);
  return docWrap(title,h,ori);
}
/* Excel: khổ giấy, lề, lặp dòng tiêu đề, số trang → mở file là in được ngay */
export function xlPrint(ws,titleRows,wide){
  try{
    var o=PR(),pg=prPage(),m=(+o.margin||20)/25.4;
    ws.pageSetup=Object.assign(ws.pageSetup||{},{paperSize:pg.xl,orientation:wide?'landscape':'portrait',fitToPage:true,fitToWidth:1,fitToHeight:0,horizontalCentered:true,margins:{left:m,right:m,top:m,bottom:m,header:0.3,footer:0.3}});
    if(titleRows)ws.pageSetup.printTitlesRow=titleRows;
    ws.headerFooter={oddFooter:'&C&8Trang &P / &N&R&8In ngày &D'};
  }catch(e){klog("var o=PR(),pg=prPage(),m=(+o.margin||20)/25.4; w",e)}
}
export function docHeaderHtml(diaDiem,soVanBan,loaiVanBan){
  var today=new Date();
  var ngay=today.getDate()+'/'+(today.getMonth()+1)+'/'+today.getFullYear();
  return '<table class="hdrtbl"><tr>'
    +'<td width="50%"><b>CÔNG TY CỔ PHẦN NỤ CƯỜI MỚI VIỆT NAM</b>'+(soVanBan?'<br>Số: '+esc(soVanBan)+'/'+esc(loaiVanBan||'BB')+'/MDT':'')+'</td>'
    +'<td width="50%" class="center"><b>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</b><br><b>Độc lập - Tự do - Hạnh phúc</b><br><i>'+esc(diaDiem||'Hà Nội')+', ngày '+ngay.split('/')[0]+' tháng '+ngay.split('/')[1]+' năm '+ngay.split('/')[2]+'</i></td>'
    +'</tr></table>';
}
export function docSignHtml(cols){
  var h='<table class="sign" width="100%"><tr>';
  cols.forEach(function(c){h+='<td width="'+Math.round(100/cols.length)+'%">'+esc(c)+'</td>';});
  h+='</tr><tr>';
  cols.forEach(function(){h+='<td>&nbsp;<br>&nbsp;<br>&nbsp;<br>&nbsp;</td>';});
  h+='</tr></table>';
  return h;
}
export function docSignHtml4(cols,subs,sigs,names){
  /* Một hàng duy nhất để khối ký không bị tách đôi giữa 2 trang */
  var h='<table class="sign" width="100%" style="page-break-inside:avoid"><tr style="page-break-inside:avoid">';
  cols.forEach(function(x,k){
    var s=sigs&&sigs[k];
    h+='<td width="'+Math.round(100/cols.length)+'%" align="center" valign="top"><b>'+esc(x)+'</b>'
      +((subs[k]||'')?'<br><span style="font-weight:400;font-style:italic;font-size:10pt">'+esc(subs[k])+'</span>':'')+'<br>';
    if(s&&s.img){
      var hh=56,ww=Math.round(hh*(s.w||300)/(s.h||120));
      if(ww>170){ww=170;hh=Math.round(ww*(s.h||120)/(s.w||300));}
      h+='<img src="'+s.img+'" width="'+ww+'" height="'+hh+'"><br><b>'+esc(s.ten)+'</b>'
        +'<br><span style="font-size:9pt;font-weight:400;font-style:italic">Ký điện tử '+esc(s.time)+' ('+esc(s.dev)+')'+(s.auth?' · '+esc(s.auth):'')+'</span>';
    }else{
      h+='&nbsp;<br>&nbsp;<br>&nbsp;<br>&nbsp;'+(names&&names[k]?'<br><b>'+esc(names[k])+'</b>':'');
    }
    h+='</td>';
  });
  return h+'</tr></table>';
}
export function docHeaderHtmlBP(boPhan,soVanBan,loaiVanBan){
  return '<table class="hdrtbl"><tr>'
    +'<td width="50%"><b>CÔNG TY CP NỤ CƯỜI MỚI VIỆT NAM</b><br>Bộ phận / Chi nhánh: '+dot(boPhan)+'</td>'
    +'<td width="50%" class="center"><b>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</b><br><b>Độc lập – Tự do – Hạnh phúc</b></td>'
    +'</tr></table>';
}
export function docWrap(title,bodyHtml,ori){
  return '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">'
    +'<head><meta charset="utf-8"><title>'+esc(title)+'</title>'
    +'<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->'
    +'<style>'+docStyle(ori)+'</style></head><body>'+bodyHtml+'</body></html>';
}
export function toMhtml(html){
  var imgs=[];
  var out=html.replace(/src="data:(image\/[a-z+]+);base64,([^"]+)"/g,function(m,mime,b64){
    var n=imgs.length+1,ext=mime.split('/')[1].replace('jpeg','jpg');
    var loc='file:///C:/chuky'+n+'.'+ext;
    imgs.push({mime:mime,b64:b64,loc:loc});
    return 'src="'+loc+'"';
  });
  if(!imgs.length)return null;
  function wrap76(s){return s.replace(/(.{76})/g,'$1\r\n');}
  var bytes=new TextEncoder().encode(out),bin='';
  for(var i=0;i<bytes.length;i+=8192)bin+=String.fromCharCode.apply(null,bytes.subarray(i,i+8192));
  var B='----=_NextPart_MD'+Date.now().toString(36);
  var s='MIME-Version: 1.0\r\nContent-Type: multipart/related; boundary="'+B+'"; type="text/html"\r\n\r\n';
  s+='--'+B+'\r\nContent-Type: text/html; charset="utf-8"\r\nContent-Transfer-Encoding: base64\r\nContent-Location: file:///C:/baocao.htm\r\n\r\n'+wrap76(btoa(bin))+'\r\n\r\n';
  imgs.forEach(function(im){
    s+='--'+B+'\r\nContent-Type: '+im.mime+'\r\nContent-Transfer-Encoding: base64\r\nContent-Location: '+im.loc+'\r\n\r\n'+wrap76(im.b64)+'\r\n\r\n';
  });
  return s+'--'+B+'--\r\n';
}
export function exportDocHtml(html,fname){
  try{
    var mh=toMhtml(html);
    var blob=new Blob([mh!==null?mh:'\ufeff'+html],{type:'application/msword'+(mh!==null?'':';charset=utf-8')});
    var file=null;try{file=new File([blob],fname,{type:blob.type});}catch(er){klog("file=new File([blob],fname,{type:blob.type});",er)}
    if(file&&navigator.share&&navigator.canShare&&navigator.canShare({files:[file]})){
      navigator.share({files:[file],title:fname}).catch(function(){dlAnchor(blob,fname);});
    }else{dlAnchor(blob,fname);}
    toast("✅ Đã tạo file — kiểm tra file vừa tải");
  }catch(err){console.error(err);toast("Lỗi tạo file: "+err.message);}
}
export function printPreviewHtml(html){
  try{
    var mw=html.match(/@page\{size:([\d.]+)cm/),pg={w:mw?mw[1]:prPage().w};
    var mst=html.match(/<style>(@page[^<]*)<\/style>/),st=mst?mst[1]:docStyle();
    var bar='<div class="noprint" style="position:sticky;top:0;background:#fff;padding:8px;text-align:center;border-bottom:1px solid #ddd"><button onclick="window.print()" style="font:inherit;font-size:16px;font-weight:700;padding:10px 18px;border-radius:10px;border:none;background:#1e3a6b;color:#fff">In / Lưu PDF</button></div>';
    var printable=html.replace('<style>'+st,'<style>body{margin:0 auto;max-width:'+pg.w+'cm;padding:0 8px;}@media print{body{padding:0;max-width:none}.noprint{display:none!important}}'+st).replace('<body>','<body>'+bar);
    var blob=new Blob([printable],{type:'text/html;charset=utf-8'});
    var url=URL.createObjectURL(blob);
    var w=window.open(url,'_blank');
    if(!w){toast('Trình duyệt chặn mở tab mới — cho phép popup rồi thử lại');return;}
    setTimeout(function(){URL.revokeObjectURL(url);},60000);
  }catch(err){console.error(err);toast('Không mở được bản xem trước: '+err.message);}
}

