/* Báo cáo kiểm kê: đọc Excel, sinh Word theo thể thức hành chính, lấy dữ liệu từ kỳ (dòng gốc 2182–2423).
   S.BC / S.BCMETA thay cho biến toàn cục BC / BCMETA. Phần sinh văn bản giữ dạng chuỗi HTML. */
import { S, norm, esc, fmt, parseNum, branchCode, toast, kkNeed, X } from '../../core';
import { PR, prPage, docSignHtml4, exportDocHtml } from '../docs/print.js';
/* Hàm của phân hệ khác: sgOf (settings), periodsIn (periods) */
const sgOf = (...a) => X.sgOf(...a);
const periodsIn = (...a) => X.periodsIn(...a);

export var HHTM_CODES=["90000003","90000004","90000008","90000009","90000010","90000012","90000024","90000025","90000026","90000027","90000028","90000029","99000002"];
export function readKiemKeXlsx(file,cb){
    if(!kkNeed(["xlsx"],function(){readKiemKeXlsx(file,cb);}))return;
  var reader=new FileReader();
  reader.onload=function(e){
    try{
      var wb=XLSX.read(new Uint8Array(e.target.result),{type:'array'});
      var result=[];
      wb.SheetNames.forEach(function(sheetName){
        if(norm(sheetName).indexOf('han su dung')!==-1)return; /* bỏ qua sheet phụ HSD, không phải chi nhánh */
        var ws=wb.Sheets[sheetName];
        var rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:''});
        var branchName=sheetName;
        var row2=rows[1]?String(rows[1][0]||''):'';
        var mN=row2.match(/Kho:\s*(.+?),/);
        if(mN)branchName=mN[1].trim();
        var totalClose=0,totalKiem=0,hhtmItems=[];
        for(var r=4;r<rows.length;r++){
          var row=rows[r]||[];
          var code=String(row[1]||'').trim();
          var name=String(row[2]||'').trim();
          if(!name&&!code)continue;
          var nn=norm(name);
          if(nn.indexOf('tong cong')===0||nn==='cong')continue;
          var closeQty=parseNum(row[7]);
          var kiemQty=parseNum(row[8]);
          var note=String(row[10]||'').trim();
          var codeNorm=code.replace(/\.0+$/,'');
          var isHHTM=codeNorm&&HHTM_CODES.indexOf(codeNorm)!==-1;
          if(!isHHTM){
            totalClose+=closeQty;
            if(row[8]!==''&&row[8]!==null&&row[8]!==undefined)totalKiem+=kiemQty;
          }
          /* HHTM: chỉ lấy đúng các mã hàng trong danh sách HHTM_CODES, tính riêng ở mục III, không cộng vào tổng tồn/kiểm kê vật tư */
          if(isHHTM){
            hhtmItems.push({
              stt:String(hhtmItems.length+1),
              ten_hang:name,dvt:String(row[3]||''),
              sl_hang:closeQty?fmt(closeQty):'',
              kiem_ke:row[8]!==''&&row[8]!==null?fmt(kiemQty):''
            });
          }
        }
        result.push({name:branchName,totalClose:totalClose,totalKiem:totalKiem,hhtmItems:hhtmItems,fileName:file.name});
      });
      cb(null,result);
    }catch(err){cb(err,null);}
  };
  reader.readAsArrayBuffer(file);
}

export var DEFAULT_NGUOI=[
  {key:'bui thi xuan',name:'Bà Vũ Hải Vân – Trợ thủ kiêm quản lý kho'},
  {key:'le van luong',name:'Bà Vũ Thị Ngọc Lan – Trưởng trợ thủ kiêm thủ kho'},
  {key:'cat linh',name:'Bà Đỗ Thị Phương Thảo – Trưởng trợ thủ kiêm quản lý kho'},
  {key:'nghia dung',name:'Bà Lê Thị Thủy – Thủ kho kiêm quản lý kho'},
  {key:'quang ninh',name:'Bà Đỗ Thị Quỳnh – Thủ kho kiêm quản lý kho'}
];
export function defaultNguoi(branchName){
  var n=norm(branchName);
  for(var i=0;i<DEFAULT_NGUOI.length;i++){
    if(n.indexOf(DEFAULT_NGUOI[i].key)!==-1)return DEFAULT_NGUOI[i].name;
  }
  return '';
}
export function ensureBCMeta(){
  if(!S.BCMETA)S.BCMETA={soVanBan:'',diaDiem:'Hà Nội',thang:String(new Date().getMonth()+1),nam:String(new Date().getFullYear()),nguyennhan:'',br:{},sig:{}};
  if(S.BCMETA&&!S.BCMETA.sig)S.BCMETA.sig={};
  if(S.BC&&S.BC.branches)S.BC.branches.forEach(function(b){
    if(!S.BCMETA.br[b.name])S.BCMETA.br[b.name]={thoigian:'',nguoi:sgOf(b.name).thuKho,giatri:''};
  });
}

export function generateBaoCao(){
  if(!S.BC||!S.BC.branches.length){toast("Chưa có dữ liệu — hãy chọn file Excel kiểm kê");return;}
  ensureBCMeta();
  try{
    var totC=0,totK=0,totG=0,hasG=false;
    S.BC.branches.forEach(function(br){
      totC+=br.totalClose;totK+=br.totalKiem;
      var m=S.BCMETA.br[br.name];
      var g=m&&m.giatri?parseFloat(String(m.giatri).replace(/[^\d.-]/g,'')):0;
      if(g){hasG=true;totG+=g;}
    });
    var totChenh=totK-totC;
    var totTxt=totChenh===0?'-':(totChenh>0?'+':'')+fmt(totChenh);

    /* ===== Form báo cáo theo thể thức văn bản hành chính (Nghị định 30/2020/NĐ-CP): chỉ đổi cách trình bày, số liệu giữ nguyên ===== */
    var o=PR(),sz=+o.size||13,fz=Math.max(9,sz-2),pgz=prPage(),mg=+o.margin||20;
    var mTop=mg,mBot=mg,mLeft=mg+10,mRight=Math.max(15,mg-5);
    var titleCss={center:'text-align:center;',left:'text-align:left;',box:'text-align:center;border:1.5pt solid #000;padding:5pt;'}[o.title]||'text-align:center;';
    var P=function(t,c,st){return '<p class="'+(c||'t')+'"'+(st?' style="'+st+'"':'')+'>'+t+'</p>';};
    var CB='border:1pt solid #000;padding:3pt 5pt;vertical-align:middle;font-size:'+fz+'pt;';
    var AL={c:'center',n:'right',l:'left'};
    var TD=function(t,c,st){return '<td align="'+AL[c]+'" valign="middle" style="'+CB+'text-align:'+AL[c]+';'+(st||'')+'">'+t+'</td>';};
    var TH=function(t,at){return '<th '+(at||'')+' align="center" valign="middle" bgcolor="#D9D9D9" style="'+CB+'background:#D9D9D9;font-weight:bold;text-align:center;"><p style="margin:0;text-align:center;font-size:'+fz+'pt;page-break-after:avoid">'+t+'</p></th>';};
    var GT='<table class="grid" border="1" cellspacing="0" cellpadding="4" width="100%" style="border-collapse:collapse;width:100%;margin:4pt 0 10pt;border:1pt solid #000">';

    var thoigianList='',thanhphanList='';
    S.BC.branches.forEach(function(br){
      var m=S.BCMETA.br[br.name]||{thoigian:'',nguoi:''};
      thoigianList+=P('- '+(m.thoigian?esc(m.thoigian)+': ':'')+esc(br.name),'li');
      thanhphanList+=P('- Tại cơ sở '+esc(br.name)+(m.nguoi?': '+esc(m.nguoi):''),'li');
    });

    var bodyRows='';
    S.BC.branches.forEach(function(br,i){
      var chenh=br.totalKiem-br.totalClose;
      var chenhTxt=chenh===0?'-':(chenh>0?'+':'')+fmt(chenh);
      var m=S.BCMETA.br[br.name];
      var gNum=m&&m.giatri?parseFloat(String(m.giatri).replace(/[^\d.-]/g,'')):NaN;
      var giaTxt=m&&m.giatri?(isNaN(gNum)?esc(m.giatri):fmt(gNum)):'';
      bodyRows+='<tr>'+TD(i+1,'c')+TD(esc(br.name),'l')+TD(fmt(br.totalClose),'n')+TD(giaTxt,'n')+TD(fmt(br.totalKiem),'n')+TD(chenhTxt,'n')+TD('','l')+'</tr>';
    });
    bodyRows+='<tr class="tot">'+TD('TỔNG CỘNG','c','font-weight:bold;background:#F2F2F2').replace('<td ','<td colspan="2" bgcolor="#F2F2F2" ')+TD('<b>'+fmt(totC)+'</b>','n','background:#F2F2F2')+TD('<b>'+(hasG?fmt(totG):'')+'</b>','n','background:#F2F2F2')+TD('<b>'+fmt(totK)+'</b>','n','background:#F2F2F2')+TD('<b>'+totTxt+'</b>','n','background:#F2F2F2')+TD('','l','background:#F2F2F2')+'</tr>';

    var hhtmSections='';
    S.BC.branches.forEach(function(br){
      var m=S.BCMETA.br[br.name]||{thoigian:''};
      hhtmSections+=P('<b>CHI NHÁNH '+esc(branchCode(br.name))+(m.thoigian?' <span style="font-weight:normal;font-style:italic">(kiểm kê lúc '+esc(m.thoigian)+')</span>':'')+'</b>','s');
      if(br.hhtmItems&&br.hhtmItems.length){
        var itemRows='';
        br.hhtmItems.forEach(function(it){
          itemRows+='<tr>'+TD(esc(it.stt),'c')+TD(esc(it.ten_hang),'l')+TD(esc(it.dvt),'c')+TD(esc(it.sl_hang),'n')+TD(esc(it.kiem_ke),'n')+'</tr>';
        });
        hhtmSections+=GT+'<thead><tr>'+TH('STT','width="8%"')+TH('Tên hàng','width="46%"')+TH('ĐVT','width="12%"')+TH('SL hàng hóa','width="17%"')+TH('Kiểm kê','width="17%"')+'</tr></thead><tbody>'+itemRows+'</tbody></table>';
      }else{
        hhtmSections+=P('<i>(Không có dữ liệu)</i>','li');
      }
    });

    var nguyenNhanHtml='';
    if(S.BCMETA.nguyennhan&&S.BCMETA.nguyennhan.trim()){
      nguyenNhanHtml=P('<b>Nguyên nhân chênh lệch:</b>','s');
      S.BCMETA.nguyennhan.split('\n').forEach(function(line){
        if(line.trim())nguyenNhanHtml+=P(esc(line),'li');
      });
    }

    var today=new Date();
    var ngayLap=today.getDate()+'/'+(today.getMonth()+1)+'/'+today.getFullYear();

    var css=''
      +'@page Section1{size:'+pgz.w+'cm '+pgz.h+'cm;margin:'+mTop+'mm '+mRight+'mm '+mBot+'mm '+mLeft+'mm;mso-header-margin:10mm;mso-footer-margin:10mm;mso-footer:f1;}'
      +'div.Section1{page:Section1;}'
      +'body{font-family:"'+o.font+'",serif;font-size:'+sz+'pt;}'
      +'p{margin:0;font-family:"'+o.font+'",serif;font-size:'+sz+'pt;}'
      +'p.t{margin:0 0 5pt;text-align:justify;line-height:130%;text-indent:28pt;}'
      +'p.li{margin:0 0 3pt 34pt;text-align:justify;line-height:125%;text-indent:-10pt;}'
      +'p.h{margin:14pt 0 6pt;font-weight:bold;text-transform:uppercase;page-break-after:avoid;}'
      +'p.s{margin:8pt 0 4pt;font-weight:bold;page-break-after:avoid;}'
      +'p.ti{margin:20pt 0 2pt;font-size:'+(sz+3)+'pt;font-weight:bold;text-transform:uppercase;'+titleCss+'}'
      +'p.sub{margin:0 0 12pt;font-weight:bold;text-align:center;}'
      +'p.cap{margin:4pt 0 4pt;text-align:left;}'
      +'table{border-collapse:collapse;}'
      +'table.grid{width:100%;margin:4pt 0 10pt;}'
      +'table.grid td,table.grid th{border:1pt solid #000;padding:3pt 5pt;font-size:'+fz+'pt;vertical-align:middle;}'
      +'table.grid th{background:#D9D9D9;font-weight:bold;text-align:center;}'
      +'table.grid tr{page-break-inside:avoid;}'
      +'table.grid tr.tot td{background:#F2F2F2;}'
      +'td.c{text-align:center;}td.n{text-align:right;}td.l{text-align:left;}'
      +'table.hd td{border:none;padding:0;vertical-align:top;font-size:'+sz+'pt;}'
      +'table.ul td{border:none;border-bottom:1pt solid #000;padding:0 4pt 1pt;text-align:center;}'
      +'table.sign td{border:none;text-align:center;padding:6pt 4pt 0;}'
      +'p.nn{font-size:'+Math.max(9,sz-2)+'pt;margin:0;}';

    var html='<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">'
      +'<head><meta charset="utf-8"><title>Báo cáo kiểm kê</title>'
      +'<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->'
      +'<style>'+css+'</style></head><body>'
      +'<div class="Section1">'
      /* Quốc hiệu - tiêu ngữ (phải), tên đơn vị + số văn bản (trái) */
      +'<table class="hd" width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:none"><tr>'
      +'<td width="44%" align="center" valign="top" style="border:none;padding:0"><b>CÔNG TY CỔ PHẦN NỤ CƯỜI MỚI VIỆT NAM</b>'
      +'<hr width="40%" size="1" noshade color="#000" align="center" style="margin:2pt auto 0">'
      +'<p style="text-align:center;margin-top:6pt">Số: '+(esc(S.BCMETA.soVanBan)||'…………')+'/BB/'+S.BCMETA.nam+'/MDT</p></td>'
      +'<td width="56%" align="center" valign="top" style="border:none;padding:0"><b>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</b><br>'
      +'<b>Độc lập - Tự do - Hạnh phúc</b>'
      +'<hr width="55%" size="1" noshade color="#000" align="center" style="margin:2pt auto 0">'
      +'<p style="text-align:center;margin-top:6pt"><i>'+esc(S.BCMETA.diaDiem)+', ngày '+ngayLap.split('/')[0]+' tháng '+ngayLap.split('/')[1]+' năm '+ngayLap.split('/')[2]+'</i></p></td>'
      +'</tr></table>'
      +'<p class="ti">Báo cáo</p>'
      +'<p class="sub">V/v kiểm kê vật tư tháng '+esc(S.BCMETA.thang)+'</p>'
      +P('<b>Kính gửi:</b> ……………………………………………………','t','text-indent:0;text-align:center;margin-bottom:8pt')
      +P('I. Thông tin chung','h')
      +P('<b>1. Thời gian kiểm kê:</b>','t','text-indent:0;margin-left:14pt;margin-bottom:3pt')+thoigianList
      +P('<b>2. Thành phần kiểm kê:</b>','t','text-indent:0;margin-left:14pt;margin-bottom:3pt;margin-top:6pt')+thanhphanList
      +P('<b>3. Nội dung kiểm kê:</b> Chốt số liệu kho vật tư tháng '+esc(S.BCMETA.thang),'t','text-indent:0;margin-left:14pt;margin-top:6pt')
      +P('II. Báo cáo kết quả kiểm kê vật tư','h')
      +P('<b>1. Kiểm kê vật tư tồn kho</b> <i>(theo biên bản kiểm kê đính kèm)</i>','t','text-indent:0;margin-left:14pt')
      +GT+'<thead>'
      +'<tr>'+TH('STT','rowspan="2" width="7%"')+TH('Chi nhánh','rowspan="2" width="27%"')+TH('Cuối kỳ','colspan="2"')+TH('SL kiểm kê','rowspan="2" width="14%"')+TH('Chênh','rowspan="2" width="11%"')+TH('Ghi chú','rowspan="2" width="10%"')+'</tr>'
      +'<tr>'+TH('Số lượng','width="14%"')+TH('Giá trị','width="17%"')+'</tr>'
      +'</thead><tbody>'+bodyRows+'</tbody></table>'
      +nguyenNhanHtml
      +P('III. Kiểm kê số lượng hàng hóa thương mại','h')
      +hhtmSections
      +P('<i>Phòng KT chịu trách nhiệm đối chiếu chênh lệch HHTM với các cơ sở.</i>','t','text-indent:0;margin-top:6pt')
      +P('IV. Phương án đề xuất','h')
      +P('<b>1. Đối với hàng hóa thương mại bị thiếu/thừa:</b>','t','text-indent:0;margin-left:14pt;margin-bottom:3pt')
      +P('<b>- Trường hợp hàng thiếu:</b>','t','text-indent:0;margin-left:24pt;margin-bottom:3pt')
      +P('+ Cơ sở có trách nhiệm bồi hoàn hàng hóa thiếu bằng việc nộp tiền về Phòng Kế toán (giá trị bồi hoàn theo quy định của MDT).','li','margin-left:48pt')
      +P('<b>- Trường hợp hàng thừa:</b>','t','text-indent:0;margin-left:24pt;margin-bottom:3pt;margin-top:4pt')
      +P('+ Phòng Kế toán có trách nhiệm nhập bổ sung số lượng hàng thừa vào kho để theo dõi và quản lý.','li','margin-left:48pt')
      +P('+ Trường hợp kỳ kiểm kê tháng kế tiếp phát hiện chênh lệch âm, số lượng hàng âm sẽ được cấn trừ vào lượng hàng thừa đã ghi nhận trước đó.','li','margin-left:48pt')
      +P('<i>Trân trọng báo cáo!</i>','t','text-indent:28pt;margin-top:10pt;margin-bottom:8pt;page-break-after:avoid')
      +docSignHtml4(['PHÒNG KẾ TOÁN HO','PHÒNG HÀNH CHÍNH HO'],['',''],[(S.BCMETA.sig||{}).keToan,(S.BCMETA.sig||{}).hanhChinh])
      +'<p class="nn" style="margin-top:12pt"><b><i>Nơi nhận:</i></b></p>'
      +'<p class="nn">- ……………………………………;</p>'
      +'<p class="nn">- Lưu: VT.</p>'
      +'</div>'
      /* chân trang: số trang */
      +'<div style="mso-element:footer" id="f1"><p align="center" style="text-align:center;font-size:10pt;margin:0">Trang <span style=\'mso-field-code:" PAGE "\'>1</span> / <span style=\'mso-field-code:" NUMPAGES "\'>1</span></p></div>'
      +'</body></html>';

    exportDocHtml(html,'BaoCao_KiemKe_T'+S.BCMETA.thang+'_'+S.BCMETA.nam+'.doc');
  }catch(err){console.error(err);toast("Lỗi tạo báo cáo: "+err.message);}
}

/* ---- Lấy dữ liệu báo cáo từ hồ sơ kiểm kê có sẵn ---- */
export var BCSRC={sel:{}};
export function periodCounted(p){var n=0;p.items.forEach(function(i){if(i.counted&&i.countQty!==null)n++;});return n;}
export function bcBranchOfPeriod(p){
  if(p.folder)return p.folder;
  var cnt={},best='',bn=0;
  p.items.forEach(function(i){var b=i.branch||'';cnt[b]=(cnt[b]||0)+1;if(cnt[b]>bn){bn=cnt[b];best=b;}});
  return (best||p.name).replace(/^kho\s+/i,'');
}
export function bcFromPeriod(p){
  var totalClose=0,totalKiem=0,hh=[];
  p.items.forEach(function(i){
    var code=String(i.code||'').replace(/\.0+$/,'');
    var done=i.counted&&i.countQty!==null;
    if(code&&HHTM_CODES.indexOf(code)!==-1){
      hh.push({stt:String(hh.length+1),ten_hang:i.name,dvt:i.unit||'',sl_hang:i.close?fmt(i.close):'',kiem_ke:done?fmt(i.countQty):''});
    }else{
      totalClose+=i.close;
      if(done)totalKiem+=i.countQty;
    }
  });
  return {name:bcBranchOfPeriod(p),totalClose:totalClose,totalKiem:totalKiem,hhtmItems:hh,fileName:'Hồ sơ kiểm kê: '+p.name,periodId:p.id};
}
