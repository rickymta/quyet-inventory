/* Trích nguyên văn từ app gốc (Helpers) — giữ nguyên hành vi */
/* eslint-disable */
function norm(s){return (s==null?"":String(s)).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/g,"d").replace(/\s+/g," ").trim();}
function esc(s){return (s==null?"":String(s)).replace(/[&<>"']/g,function(m){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m];});}
/* Kiểm tra số lượng NGƯỜI DÙNG NHẬP: trống ≠ 0 ≠ không hợp lệ. Không dùng cho đọc Excel (parseNum giữ nguyên). */
function qtyCheck(v){
  var s=String(v==null?"":v).trim().replace(/\s/g,"");
  if(s==="")return {ok:false,empty:true,err:"Nhập số lượng kiểm kê"};
  if(/^-/.test(s))return {ok:false,err:"Số lượng không được âm"};
  if(!/^(\d+|\d{1,3}([.,]\d{3})+)([.,]\d+)?$/.test(s))return {ok:false,err:"Số lượng không hợp lệ: \""+s.slice(0,20)+"\" (chỉ nhập chữ số, ví dụ 12 hoặc 2,5)"};
  var n=parseNum(s);
  if(!isFinite(n)||n<0)return {ok:false,err:"Số lượng không hợp lệ"};
  return {ok:true,n:n};
}
function parseNum(v){
  if(v===null||v===undefined||v==="")return 0;
  if(typeof v==="number")return v;
  var s=String(v).trim().replace(/\s/g,"");
  if(!s)return 0;
  var hasC=s.indexOf(",")>=0, hasD=s.indexOf(".")>=0;
  if(hasC&&hasD){
    if(s.lastIndexOf(",")>s.lastIndexOf("."))s=s.replace(/\./g,"").replace(",",".");
    else s=s.replace(/,/g,"");
  }else if(hasC){
    var p=s.split(",");
    s=(p.length===2&&(p[1].length<=2||/^-?0+$/.test(p[0])))?s.replace(",","."):s.replace(/,/g,"");
  }else if(hasD){
    var q=s.split(".");
    if(q.length>2||(q.length===2&&q[1].length===3&&!/^-?0+$/.test(q[0])))s=s.replace(/\./g,"");
  }
  var n=parseFloat(s);
  return isNaN(n)?0:n;
}
function fmt(n){
  if(n===null||n===undefined||n==="")return "";
  var x=Number(n);
  return isNaN(x)?String(n):new Intl.NumberFormat("vi-VN",{maximumFractionDigits:2}).format(x);
}
function soThanhChu(num){
  if(!num||isNaN(num)||num===0)return 'Không đồng';
  var isNeg=num<0; num=Math.abs(Math.round(num));
  var chuSo=['không','một','hai','ba','bốn','năm','sáu','bảy','tám','chín'];
  var donVi=['','nghìn','triệu','tỷ'];
  function docBaSo(baso,forceTram){
    var tram=Math.floor(baso/100),chuc=Math.floor((baso%100)/10),dv=baso%10;
    var s='';
    if(tram>0){s+=chuSo[tram]+' trăm ';}
    else if(forceTram){s+='không trăm ';}
    if(chuc>1){s+=chuSo[chuc]+' mươi ';if(dv===1)s+='mốt ';else if(dv===5)s+='lăm ';else if(dv>0)s+=chuSo[dv]+' ';}
    else if(chuc===1){s+='mười ';if(dv===1)s+='mốt ';else if(dv===5)s+='lăm ';else if(dv>0)s+=chuSo[dv]+' ';}
    else if(chuc===0&&dv>0){if(tram>0||forceTram)s+='linh ';s+=chuSo[dv]+' ';}
    return s.trim();
  }
  var groups=[];var n=num;
  if(n===0)groups=[0];else{while(n>0){groups.unshift(n%1000);n=Math.floor(n/1000);}}
  var parts=[];
  for(var i=0;i<groups.length;i++){
    var g=groups[i];
    if(g===0)continue;
    var s=docBaSo(g,i>0);
    var unitIdx=groups.length-1-i;
    parts.push(s+(donVi[unitIdx]?(' '+donVi[unitIdx]):''));
  }
  var result=parts.join(' ').replace(/\s+/g,' ').trim();
  result=result.charAt(0).toUpperCase()+result.slice(1);
  return (isNeg?'Âm ':'')+result+' đồng chẵn';
}
function daysTo(iso){
  if(!iso)return null;
  var d=new Date(iso+"T00:00:00");
  if(isNaN(d.getTime()))return null;
  var t=new Date();t.setHours(0,0,0,0);
  return Math.round((d-t)/86400000);
}
function fmtDate(iso){if(!iso)return "";var p=iso.split("-");return p.length===3?p[2]+"/"+p[1]+"/"+p[0]:iso;}
function normKey(branch,code,name){return norm(branch)+"|"+(norm(code)||norm(name));}
function branchCode(name){
  var s=norm(name);
  s=s.replace(/^(kho|mdt|chi nhanh|cn)\s+/,'');
  s=s.split('-')[0];
  s=s.replace(/\d+/g,'');
  var words=s.trim().split(/\s+/).filter(Boolean);
  if(!words.length)return norm(name).slice(0,3).toUpperCase();
  return words.map(function(w){return w[0];}).join('').toUpperCase();
}
function diffOf(it){return (it.counted&&it.countQty!==null)?Math.round((it.countQty-it.close)*100)/100:null;}
function needsCount(it){return !it.counted&&it.close!==0;} /* tab Chưa kiểm, kiểm tuần tự: không gồm mã tồn 0 */
function zeroPending(it){return !it.counted&&it.close===0;} /* mã tồn 0 chưa kiểm: chỉ nhắc khi khoá kỳ */

var BUCKETS=[
  {k:"expired",label:"Đã hết hạn",cls:"c-red",strong:"var(--red)",test:function(d){return d<0;}},
  {k:"m1",label:"Còn ≤ 1 tháng",cls:"c-org",strong:"var(--orange)",test:function(d){return d>=0&&d<=30;}},
  {k:"m3",label:"Còn ≤ 3 tháng",cls:"c-amb",strong:"var(--amber)",test:function(d){return d>30&&d<=90;}},
  {k:"m6",label:"Còn ≤ 6 tháng",cls:"c-green",strong:"var(--green)",test:function(d){return d>90&&d<=180;}}
];

/* Lý do giải trình nhanh — thêm/bớt/sửa câu chữ ngay trong mảng này */
var QUICK_NOTES=["Quên chưa xuất","Giải trình sau bằng văn bản","Check lại với Phòng Kế toán"];

export { norm, esc, qtyCheck, parseNum, fmt, soThanhChu, daysTo, fmtDate, normKey, branchCode, diffOf, needsCount, zeroPending, BUCKETS, QUICK_NOTES };
