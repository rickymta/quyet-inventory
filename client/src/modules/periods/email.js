/* Gửi email kết quả kiểm kê (dòng gốc 3453–3544). Sinh chuỗi nên giữ nguyên dạng chuỗi. */
import { X, diffOf, needsCount, fmt, kkLoad, klog, toast } from '../../core';

/* ================= Gửi email kết quả kiểm kê ================= */
/* Cấu hình câu chữ trong email xác nhận chữ ký. QUY_CHE_TEXT chỉ điền khi công ty đã thực sự ban hành quy chế,
   ví dụ: "Các bên đã thống nhất dùng phương thức này theo Quy chế kiểm kê số .../QĐ-...". Để trống thì email không nêu. */
export let QUY_CHE_TEXT='';
export const XAC_NHAN_HAN_NGAY=3;
export function sigConfirmBlock(p,ky){
  var sg=p.sig||{},done=[],todo=[];
  X.SIG_KEYS.pe.forEach(function(k){
    var s=sg[k],t=X.SIG_TITLES['pe.'+k];
    if(s&&s.img)done.push('- '+t+': '+s.ten+', ký lúc '+s.time+' ('+s.dev+')');else todo.push(t);
  });
  if(!done.length)return '';
  var b=['✍ XÁC NHẬN CHỮ KÝ ĐIỆN TỬ','Biên bản kiểm kê đính kèm đã được ký xác nhận bằng chữ ký điện tử ngay trên ứng dụng Kiểm kê kho (thiết bị của người lập biên bản) bởi:'].concat(done);
  if(todo.length)b.push('Chưa ký điện tử: '+todo.join(', ')+'.');
  if(QUY_CHE_TEXT)b.push(QUY_CHE_TEXT);
  b.push('Đề nghị Quý anh/chị trả lời email này bằng câu: "Tôi xác nhận đã ký và đồng ý nội dung biên bản kiểm kê kỳ '+ky+'" trong vòng '+XAC_NHAN_HAN_NGAY+' ngày. Nếu không ký hoặc có ý kiến khác, vui lòng nêu rõ trong phản hồi.');
  return b.join('\n');
}
export function exportKiemKeEmail(p){
  var now=new Date();
  var dateStr=String(now.getDate()).padStart(2,"0")+"/"+String(now.getMonth()+1).padStart(2,"0")+"/"+now.getFullYear();
  var ky=String(now.getMonth()+1).padStart(2,"0")+"/"+now.getFullYear();
  /* Thống kê */
  var counted=p.items.filter(function(i){return i.counted;});
  var diffs=p.items.filter(function(i){return i.counted&&diffOf(i)!==0;});
  var matched=counted.length-diffs.length;
  var matchPct=counted.length?Math.round(matched/counted.length*100):0;
  var unchecked=p.items.filter(function(i){return needsCount(i);});
  var totalClose=0,totalKK=0,totalDiff=0;
  counted.forEach(function(i){totalClose+=i.close;totalKK+=i.countQty;});
  totalDiff=Math.round((totalKK-totalClose)*100)/100;
  /* Tên cơ sở */
  var branches=[];
  p.items.forEach(function(i){if(i.branch&&branches.indexOf(i.branch)<0)branches.push(i.branch);});
  var branchStr=branches.length?branches.join(", "):"cơ sở";
  var fname2=("KiemKe_"+p.name).replace(/[^\w-]+/g,"_")+".xlsx";
  var hanXuLyDate=new Date(now.getTime()+5*24*60*60*1000);
  var hanXuLy=String(hanXuLyDate.getDate()).padStart(2,"0")+"/"+String(hanXuLyDate.getMonth()+1).padStart(2,"0")+"/"+hanXuLyDate.getFullYear();
  var lines=[];
  lines.push("Kính gửi: Ban Giám đốc cơ sở "+branchStr+" & Thủ kho,\nPhòng Hành chính Hậu cần gửi kết quả kiểm kê kho kỳ "+ky+" để Quý đơn vị xem xét và xử lý:");
  var sumBlock=[];
  sumBlock.push("📊 TỔNG KẾT KIỂM KÊ");
  sumBlock.push("Tổng mã kiểm kê    : "+counted.length+" mã");
  sumBlock.push("Khớp sổ sách       : "+matched+" mã ("+matchPct+"%)");
  sumBlock.push("Chênh lệch         : "+diffs.length+" mã"+(diffs.length?" (cần xử lý)":""));
  sumBlock.push("Tồn cuối kỳ        : "+fmt(totalClose)+" | Thực tế: "+fmt(totalKK)+" | Chênh: "+(totalDiff>0?"+":"")+fmt(totalDiff));
  lines.push(sumBlock.join("\n"));
  if(diffs.length){
    var diffBlock=["🔍 DANH SÁCH VẬT TƯ CHÊNH LỆCH"];
    diffs.forEach(function(it,i){
      var d=diffOf(it);
      var dStr=(d>0?"+":"")+fmt(d)+(d>0?" (THỪA)":" (THIẾU)");
      diffBlock.push(String(i+1)+". "+it.name+" ("+it.code+") — Tồn sổ: "+fmt(it.close)+" | Thực tế: "+fmt(it.countQty)+" | Chênh: "+dStr+" | Giải trình: "+(it.note||"Chưa có"));
    });
    lines.push(diffBlock.join("\n"));
    lines.push("👉 Đề nghị Thủ kho: Xác minh nguyên nhân chênh lệch và hoàn tất điều chỉnh số liệu trước ngày "+hanXuLy+". Trường hợp mất mát vật tư, lập biên bản và xử lý theo quy định.");
  }else{
    lines.push("✅ Kết quả kiểm kê: Toàn bộ vật tư đã kiểm đều KHỚP sổ sách — không có chênh lệch.");
  }
  var sigBlock=sigConfirmBlock(p,ky);
  if(sigBlock)lines.push(sigBlock);
  lines.push((sigBlock?"Trân trọng,":"(Email tự động, vui lòng không phản hồi trực tiếp)")+"\nMAI VĂN QUYẾT - CHUYÊN VIÊN HÀNH CHÍNH\nCÔNG TY CỔ PHẦN NỤ CƯỜI MỚI VIỆT NAM");
  var subject="[MedDental] Kết quả kiểm kê kho – "+p.name+" – "+dateStr;
  var body=lines.join("\n");
  var fname=("KiemKe_"+p.name).replace(/[^\w-]+/g,"_")+".xlsx";
  if(typeof window.ExcelJS==="undefined"){
    kkLoad("exceljs").then(function(ok){if(ok)exportKiemKeEmail(p);else X.openMailtoSafe(subject,body);});
    return;
  }
  X.buildBienBan(p).xlsx.writeBuffer().then(function(buf){
    var blob=new Blob([buf],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
    var file=null;
    try{file=new File([blob],fname,{type:blob.type});}catch(e){klog("file=new File([blob],fname,{type:blob.type});",e)}
    var shared=false;
    if(file&&navigator.share&&navigator.canShare&&navigator.canShare({files:[file]})){
      shared=true;
      var shareText=subject+"\n\n"+body;
      navigator.share({files:[file],title:subject,text:shareText}).then(function(){
        toast("✉ Đã mở soạn email — kiểm tra tiêu đề và nội dung trước khi gửi");
      }).catch(function(err){
        if(err&&err.name==="AbortError")return;
        X.dlAnchor(blob,fname);
        setTimeout(function(){X.openMailtoSafe(subject,body);},600);
      });
    }
    if(!shared){
      X.dlAnchor(blob,fname);
      setTimeout(function(){X.openMailtoSafe(subject,body);},900);
    }
  }).catch(function(e){console.error(e);toast("Không tạo được file báo cáo");});
}

