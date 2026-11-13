/* Phần 2 · hành động điều khiển màn hình + cấu hình (dòng gốc 9170–9334). */
/* eslint-disable */
import { A, X, S, db, store, audit, saveSoon, toast, rerender, norm, esc, kkNeed } from '../../core';
import { rcRows, rcWbOut, rcWs } from './p2-import.js';

export const actions = {
  rcTab:function(i){X.RC.tab=i;X.RC.lim=40;X.RC.q="";X.RC.from=0;rerender();window.scrollTo(0,0);},
  rcTile:function(side,only,q){X.RC.tab=1;X.RC.side=side;X.RC.only=only;X.RC.q=q||"";X.RC.lim=40;X.RC.from=1;rerender();window.scrollTo(0,0);},
  rcBackSum:function(){X.RC.tab=0;X.RC.from=0;X.RC.q="";rerender();window.scrollTo(0,0);},
  rcS:function(k,v){X.RC[X.RC_KEYS[k]]=(k===3||k===4)?+v:v;X.RC.lim=40;if(k===6)X.RC.q="";rerender();},
  rcSearch:function(v){X.RC.q=v;X.RC.lim=40;clearTimeout(A._rcT);A._rcT=setTimeout(rerender,220);},
  rcClr:function(){X.RC.cs="Tất cả";X.RC.th="Tất cả";X.RC.lim=40;rerender();},
  rcGoList:function(side){X.RC.tab=1;X.RC.side=side;X.RC.only=1;X.RC.q="";X.RC.lim=40;X.RC.from=1;rerender();window.scrollTo(0,0);},
  rcMore:function(){X.RC.lim+=40;rerender();},
  rcMapF:function(v){X.RC.mf=v;X.RC.mlim=60;rerender();},
  kyGo:function(i){var k=X.RC_KYL[i];if(!k)return;X.RC.cs=k.cs;X.RC.th=String(k.mo);X.RC.lim=40;rerender();},
  kyAct:function(a){
    if(X.RC.cs==='Tất cả'||X.RC.th==='Tất cả'){toast('Chọn 1 cơ sở và 1 tháng trước');return;}
    var R=X.rcDb(),cs=X.RC.cs,mo=+X.RC.th,g=X.rcKyGet(cs,mo),key=X.kyKey(cs,mo),S=g.S;
    var who=(db.profile&&db.profile.ten)||'';
    if(!who){toast('Nhập họ tên ở Cài đặt → Hồ sơ trước, để ghi người thực hiện');return;}
    var to='',note='';
    if(a==='submit'){
      if(g.st!=='Đang xử lý'){toast('Kỳ không ở trạng thái Đang xử lý');return;}
      if(S.need>0){toast('Còn '+S.need+' ca cần xử lý, chưa gửi xác nhận được');return;}
      to='Chờ xác nhận';
    }else if(a==='confirm'){
      if(g.st!=='Chờ xác nhận'&&!(g.st==='Hoàn thành'&&g.stale)){toast('Kỳ chưa ở trạng thái chờ xác nhận');return;}
      if(S.need>0){toast('Còn '+S.need+' ca cần xử lý, chưa xác nhận được');return;}
      if(!confirm('Xác nhận kỳ '+cs+' · Tháng '+mo+' đã đối chiếu xong?\n\n'+S.n+' lượt doanh thu · '+S.x+' phiếu xuất · 0 ca cần xử lý\nNgười xác nhận: '+who))return;
      to='Hoàn thành';
    }else if(a==='return'||a==='reopen'){
      if(a==='return'&&g.st!=='Chờ xác nhận'){toast('Kỳ không ở trạng thái chờ xác nhận');return;}
      if(a==='reopen'&&g.st!=='Hoàn thành'){toast('Kỳ chưa hoàn thành');return;}
      var n=prompt(a==='return'?'Lý do trả lại xử lý:':'Lý do mở lại kỳ đã hoàn thành:');
      if(n===null)return;n=String(n).trim();
      if(!n){toast('Cần nhập lý do');return;}
      note=n;to='Đang xử lý';
    }else return;
    var kyst=R.kyst||(R.kyst={}),rec=kyst[key]||(kyst[key]={st:'',hist:[]});
    if(!Array.isArray(rec.hist))rec.hist=[];
    rec.hist.push({st:to,from:g.st,by:who,at:Date.now(),note:note,sig:S.sig});
    if(rec.hist.length>50)rec.hist.splice(0,rec.hist.length-50);
    rec.st=to;rec.by=who;rec.at=Date.now();rec.sig=S.sig;
    audit('recon-ky',key,g.st,to);saveSoon();rerender();
  },
  rcMapMore:function(){X.RC.mlim=(X.RC.mlim||60)+60;A.rcMapRe();},
  /* gốc: vẽ lại riêng #mpbody và giữ vị trí cuộn; bản React: vẽ lại toàn màn hình (DOM được giữ nguyên nên vị trí cuộn không đổi) */
  rcMapRe:function(){rerender();},
  rcMapX:function(k){X.RC.mx=(X.RC.mx===k)?"":k;A.rcMapRe();},
  rcMapQ:function(v){X.RC.mq=v;X.RC.mlim=60;clearTimeout(A._mpT);A._mpT=setTimeout(A.rcMapRe,250);},
  rcOpt:function(k,v){var R=X.rcDb();R.opt[k]=v?1:0;audit("recon-opt",k,null,R.opt[k]);saveSoon();rerender();},
  rcNote:function(side,j,k,v){
    var R=X.rcDb(),o=(side?S.RC_RES.xk:S.RC_RES.dt)[j],f=["r","g","st"][k];if(!o)return;
    var n=R.notes[o.nid]||(R.notes[o.nid]={}),b=n[f];if(b===v)return;n[f]=v;
    if(f!=="r"){n.by=(db.profile&&db.profile.ten)||n.by||"";n.at=X.rcToday();}
    if(f==="st"||f==="g")delete n.chg;
    audit("recon",o.nid+"/"+f,b,v);saveSoon();rerender();
  },
  /* chấp nhận vật tư xuất khác tên (cùng loại) cho dịch vụ: thêm vào "mã / tên thay thế" */
  rcAcc:function(side,j,k){
    var Z=S.RC_RES,R=X.rcDb(),ri,toks=[];
    if(!side){var c=Z.dt[j],w=c&&c.wrong&&c.wrong[k];if(!w)return;ri=c.ri;toks=[w.ma,w.ten];}
    else{var x=Z.xk[j],e=x&&x.exp&&x.exp[k];if(!e)return;ri=e.ri;toks=[x.ma,x.ten];}
    var row=R.cfg[ri];if(!row){toast("Không tìm thấy dòng cấu hình");return;}
    var have=X.rcTok(row),add=[];
    toks.forEach(function(t){t=String(t||"").trim();var n=norm(t);if(n&&!have[n]&&add.indexOf(t)<0)add.push(t);});
    if(!add.length){toast("Vật tư này đã nằm trong cấu hình");return;}
    var before=row.alt||"";row.alt=(before?before+"; ":"")+add.join("; ");
    audit("recon-cfg","alt/"+ri,before,row.alt);saveSoon();rerender();toast("Đã chấp nhận: "+add.join(", "));
  },
  /* ----- cấu hình dịch vụ → vật tư ----- */
  rcPick:function(k){
    var m=S.RC_RES.svcMiss[k];if(!m)return;var el=document.getElementById("rcm0");if(!el)return;
    el.value=m[0];el.scrollIntoView({block:"center",behavior:"smooth"});var t=document.getElementById("rcm2");if(t)t.focus();
  },
  rcCfgAdd:function(){
    var R=X.rcDb(),v=X.RC_CF.map(function(f,i){return document.getElementById("rcm"+i).value.trim();});
    if(!v[0]){toast("Nhập tên dịch vụ / từ khóa");return;}
    var row={dv:v[0],ma:v[1],ten:v[2],dm:v[3]===""?1:X.rcNum(v[3]),alt:v[4],gia:X.rcNum(v[5])};
    R.cfg.push(row);X.RC.co[norm(row.dv)]=true;audit("recon-cfg","add",null,row.dv+" → "+(row.ma||row.ten||"(không dùng vật tư)"));saveSoon();rerender();
    toast(row.ma||row.ten?"Đã thêm vào cấu hình":"Đã thêm: dịch vụ này không đối chiếu vật tư");
  },
  rcCfgEdit:function(i,f,v){
    var R=X.rcDb(),row=R.cfg[i];if(!row)return;v=String(v).trim();
    X.RC._rev=(X.RC._rev||0)+1;
    if(f==="dv"&&!v){toast("Dịch vụ không được để trống");rerender();return;}
    var old=row[f];if(f==="dm")v=v===""?1:X.rcNum(v);else if(f==="gia")v=X.rcNum(v);
    row[f]=v;audit("recon-cfg",f+"/"+i,old,v);saveSoon();rerender();
  },
  rcCfgDel:function(i){if(!confirm("Xóa dòng cấu hình này?"))return;X.rcDb().cfg.splice(i,1);saveSoon();rerender();},
  rcCfgReset:function(){if(!confirm("Khôi phục cấu hình dịch vụ → vật tư về mặc định? Các dòng bạn đã thêm/sửa sẽ mất."))return;X.rcDb().cfg=X.rcSeedCfg(X.RC_SEED);saveSoon();rerender();},
  rcCfgTpl:function(){
    if(!kkNeed(["xlsx"],function(){A.rcCfgTpl();}))return;
    var R=X.rcDb(),wb=XLSX.utils.book_new(),a=[X.RC_CF.map(function(f){return f[1];})];
    R.cfg.forEach(function(c){a.push([c.dv,c.ma||"",c.ten||"",X.rcDm(c),c.alt||"",+c.gia||0]);});
    if(a.length===1)a.push(["VÍ DỤ: Phẫu thuật cấy ghép Implant (Neodent Neoporos + abutment)","13000170","Trụ Neodent Neoporos",1,"Trụ neodent Neoporos; 13000171",2900000]);
    var g=[["HƯỚNG DẪN CẤU HÌNH ĐỊNH MỨC DỊCH VỤ → VẬT TƯ XUẤT"],[""],
      ["Mỗi dòng = 1 dịch vụ cần 1 loại vật tư. Dịch vụ cần nhiều vật tư → thêm nhiều dòng cùng tên dịch vụ."],
      ["Cột A – Dịch vụ: tên đầy đủ (ưu tiên cao nhất) HOẶC từ khóa nằm trong tên dịch vụ (từ khóa dài hơn thắng)."],
      ["Cột B – Mã vật tư xuất: mã hàng ở phiếu xuất kho (khuyên dùng, ổn định hơn tên)."],
      ["Cột C – Tên vật tư xuất: tên hiển thị trên báo cáo. Để trống cả B và C = dịch vụ không đối chiếu vật tư."],
      ["Cột D – Định mức: số vật tư cần cho 1 lần dịch vụ (mặc định 1). SL cần = Định mức × SL dịch vụ."],
      ["Cột E – Mã / tên thay thế: các mã/tên khác mà kho có thể xuất cho cùng dịch vụ (cùng loại, chỉ khác tên). Cách nhau bằng dấu ;"],
      ["Cột F – Đơn giá: tuỳ chọn, chỉ dùng để tính giá trị lệch."],
      [""],["Khớp khi: đúng mã khách hàng (PID) + đúng vật tư (B/C/E) + đúng số lượng."],
      ["Dòng có chữ “VÍ DỤ” ở cột A sẽ bị bỏ qua khi nhập."]];
    XLSX.utils.book_append_sheet(wb,rcWs(a,[58,16,34,14,40,16]),"CAU_HINH");
    XLSX.utils.book_append_sheet(wb,rcWs(g,[120]),"HUONG_DAN");
    rcWbOut(wb,"CauHinh_DinhMuc_DichVu.xlsx");
  },
  rcCfgFile:function(inp,mode){
    if(!kkNeed(["xlsx"],function(){A.rcCfgFile(inp,mode);}))return;
    var f=inp.files&&inp.files[0];if(!f)return;
    var fr=new FileReader();
    fr.onload=function(){
      try{
        var R=X.rcDb(),wb=XLSX.read(fr.result,{type:"array"}),nm=wb.SheetNames.indexOf("CAU_HINH")>=0?"CAU_HINH":wb.SheetNames[0],rows=rcRows(wb,nm),st=0,i,out=[],seen={};
        for(i=0;i<Math.min(rows.length,6);i++)if(norm(rows[i][0]).indexOf("dich vu")===0){st=i+1;break;}
        for(i=st;i<rows.length;i++){
          var c=rows[i],dv=String(c[0]||"").trim();if(!dv||/^vi du/.test(norm(dv)))continue;
          var row={dv:dv,ma:String(c[1]||"").trim(),ten:String(c[2]||"").trim(),dm:(c[3]===""||c[3]==null)?1:X.rcNum(c[3]),alt:String(c[4]||"").trim(),gia:X.rcNum(c[5])};
          var k=norm(row.dv)+"|"+norm(row.ma)+"|"+norm(row.ten);if(seen[k])continue;seen[k]=1;out.push(row);
        }
        if(!out.length){toast("Không có dòng cấu hình hợp lệ trong file");inp.value="";return;}
        if(mode==="replace"){
          if(!confirm("Thay thế toàn bộ "+R.cfg.length+" dòng cấu hình hiện tại bằng "+out.length+" dòng trong file?")){inp.value="";return;}
          R.cfg=out;
        }else{
          var ex={};R.cfg.forEach(function(r){ex[norm(r.dv)+"|"+norm(r.ma)+"|"+norm(r.ten)]=1;});
          out=out.filter(function(r){return !ex[norm(r.dv)+"|"+norm(r.ma)+"|"+norm(r.ten)];});
          R.cfg=R.cfg.concat(out);
        }
        audit("recon-cfg","import-"+mode,null,out.length);saveSoon();rerender();toast("Đã nhập "+out.length+" dòng cấu hình");
      }catch(e){console.error(e);toast("Không đọc được file: "+e.message);}
      inp.value="";
    };
    fr.readAsArrayBuffer(f);
  },
  rcCfgOpen:function(gi,o){var k=X.RC.cfgG[gi];if(k!=null)X.RC.co[k]=!!o;},
  rcCfgAll:function(o){X.RC.cfgG.forEach(function(k){X.RC.co[k]=!!o;});rerender();},
  rcCfgRows:function(gi){var k=X.RC.cfgG[gi],a=[];X.rcDb().cfg.forEach(function(c,i){if((norm(c.dv)||"(trống)")===k)a.push(i);});return a;},
  rcCfgAddIn:function(gi){
    var R=X.rcDb(),ix=A.rcCfgRows(gi);if(!ix.length)return;
    R.cfg.splice(ix[ix.length-1]+1,0,{dv:R.cfg[ix[0]].dv,ma:"",ten:"",dm:1,alt:"",gia:0});
    X.RC.co[X.RC.cfgG[gi]]=true;audit("recon-cfg","addIn",null,R.cfg[ix[0]].dv);saveSoon();rerender();toast("Đã thêm dòng vật tư mới — điền mã/tên vật tư");
  },
  rcCfgRen:function(gi){
    var R=X.rcDb(),ix=A.rcCfgRows(gi);if(!ix.length)return;
    var cur=R.cfg[ix[0]].dv,nv=prompt("Tên dịch vụ / từ khóa mới:",cur);if(nv===null)return;nv=nv.trim();
    if(!nv){toast("Tên dịch vụ không được để trống");return;}if(nv===cur)return;
    ix.forEach(function(i){R.cfg[i].dv=nv;});X.RC.co[norm(nv)]=true;audit("recon-cfg","rename",cur,nv);saveSoon();rerender();
  },
  rcCfgDelG:function(gi){
    var R=X.rcDb(),ix=A.rcCfgRows(gi);if(!ix.length)return;
    if(!confirm('Xóa dịch vụ "'+R.cfg[ix[0]].dv+'" cùng '+ix.length+' dòng vật tư của nó?'))return;
    audit("recon-cfg","delGroup",R.cfg[ix[0]].dv,ix.length);R.cfg=R.cfg.filter(function(c,i){return ix.indexOf(i)<0;});saveSoon();rerender();
  },
  /* ----- bảng phụ: định mức theo từ khóa, chuẩn hóa cơ sở ----- */
  rcMapAdd:function(){
    var m=X.RC.map,L=X.RC_MAPS[m],row=[],i;
    for(i=0;i<L.length-1;i++)row.push(document.getElementById("rcm"+i).value.trim());
    if(!row[0]){toast("Nhập ô đầu tiên");return;}
    if(m==="dm")row[1]=X.rcNum(row[1]);
    X.rcDb().maps[m].push(row);saveSoon();rerender();toast("Đã thêm vào danh mục");
  },
  rcMapEdit:function(i,j,v){
    var m=X.RC.map,M=X.rcDb().maps,row=M[m][i];if(!row)return;v=String(v).trim();
    X.RC._rev=(X.RC._rev||0)+1;
    if(j===0&&!v){toast("Ô đầu tiên không được để trống");rerender();return;}
    var old=row[j];if(m==="dm"&&j===1)v=X.rcNum(v);
    row[j]=v;audit("recon-map",m+"/"+i+"/"+j,old,v);saveSoon();rerender();
  },
  rcMapDel:function(i){if(!confirm("Xóa dòng này khỏi danh mục?"))return;X.rcDb().maps[X.RC.map].splice(i,1);saveSoon();rerender();},
  rcMapReset:function(){if(!confirm("Khôi phục bảng này về bản gốc? Các dòng bạn đã thêm sẽ mất."))return;X.rcDb().maps[X.RC.map]=JSON.parse(JSON.stringify(X.RC_SEED[X.RC.map]));saveSoon();rerender();},
  /* ----- mẫu nhập liệu chuẩn ----- */};
