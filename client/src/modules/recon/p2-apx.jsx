/* Phần 2 · V6 — Phụ lục 01 theo từng cơ sở (dòng gốc 9654–9787).
   rcApxCard / rcViewApx trả JSX (màn hình); rcApxRow / rcApxBuild giữ nguyên thuật toán. */
/* eslint-disable */
import { Fragment } from 'react';
import { A, X, S, db, norm, esc, I, st } from '../../core';

export var RC_KQ={"KHỚP":"Khớp","CHƯA XUẤT KHO":"Chưa xuất kho","XUẤT SAI VẬT TƯ":"Xuất sai vật tư","XUẤT SAI SỐ LƯỢNG (THIẾU)":"Xuất thiếu","XUẤT SAI SỐ LƯỢNG (THỪA)":"Xuất thừa","CHƯA CẤU HÌNH DỊCH VỤ":"Chưa cấu hình DV","THIẾU MÃ KH (PID)":"Thiếu mã KH","KHÔNG CÓ DỊCH VỤ":"Thiếu tên DV","KHÔNG DÙNG VẬT TƯ":"Không dùng vật tư"};
export var RC_KQX={"XUẤT CHƯA CÓ DOANH THU":"Xuất chưa có DT","TRÙNG/THỪA XUẤT":"Trùng/thừa xuất","XUẤT SAI VẬT TƯ":"Xuất sai vật tư"};
export var RC_APX_HEAD=["STT","Mã BN","Họ tên khách hàng","Ngày điều trị","Dịch vụ","Phiếu xuất kho","Vật tư","SL định mức","SL xuất thực","Kết quả","Giải trình","Đã xác nhận"];
export var RC_APX_CLS={g:["#E2F0D9","#15803d","green"],b:["#DDEBF7","#0B5394","sky"],r:["#FCE4E4","#C00000","red"],n:["#F2F2F2","#595959","gray"]};
export function rcYears(){var a=[];S.RC_RES.rows.forEach(function(o){var d=X.rcDate(o.r.ngay);if(d&&a.indexOf(d.y)<0)a.push(d.y);});return a.sort(function(x,y){return y-x;});}
export function rcYrOk(v){if(!X.RC.yr||X.RC.yr==="Tất cả")return true;var d=X.rcDate(v);return !!d&&String(d.y)===String(X.RC.yr);}
/* 1 dòng phụ lục = 1 dịch vụ × 1 vật tư theo định mức. Các dịch vụ cùng khách + cùng vật tư được gộp: SL xuất tính ở dòng đầu. */
export function rcApxRow(o,N){
  var r=o.r,n=N[o.nid]||{},d=X.rcDate(r.ngay),g=o.g,gt=[n.r,n.g].filter(Boolean).join(" – ");
  var row={pid:o.pid||"",kh:r.kh||"",ngay:X.rcDStr(r.ngay)||"",dk:d?d.y*10000+d.m*100+d.d:0,dv:r.dv||"",so:"—",vt:"—",nd:"",xt:"",kq:"",cls:"n",gt:gt,lech:false,cnt:false,j:o.j};
  if(o.none){
    row.cnt=true;row.kq=RC_KQ[o.T]||o.T;row.lech=o.T!=="KHÔNG DÙNG VẬT TƯ";row.cls=row.lech?"r":"n";
    if(!row.lech)row.vt="(dịch vụ không đối chiếu vật tư)";
    return row;
  }
  var hd=g.head;
  row.vt=o.ten||"";row.lech=hd.T!=="KHỚP";
  var kq=hd.T==="KHỚP"?"Khớp":hd.ok?"Hợp lệ (đã duyệt)":(RC_KQ[hd.T]||hd.T),cls=hd.T==="KHỚP"?"g":hd.ok?"b":"r";
  row.cls=cls;
  if(o.first){
    row.cnt=true;row.nd=g.need;row.xt=g.got;row.kq=kq;
    var sos=[];
    g.xs.forEach(function(x){var s=String(x.r.so||"").trim()||"(không số CT)";if(sos.indexOf(s)<0)sos.push(s);});
    if(!sos.length&&o.wrong&&o.wrong.length)o.wrong.forEach(function(w){var s=String(w.so||"").trim()||"(không số CT)";if(sos.indexOf(s)<0)sos.push(s);});
    row.so=sos.length?sos.join("; "):"(chưa xuất)";
    row.xl=g.xs.length?g.xs.map(function(x){return {ten:x.ten,ma:x.ma,so:String(x.r.so||"").trim(),ngay:X.rcDStr(x.r.ngay)||"",sl:x.sl};}):(o.wrong||[]).map(function(w2){return {ten:w2.ten,ma:w2.ma,so:String(w2.so||"").trim(),ngay:"",sl:w2.sl,bad:1};});
    if(o.wrong&&o.wrong.length){var au="Đã xuất vật tư khác: "+o.wrong.map(function(w){return (w.ten||w.ma)+" ×"+w.sl;}).join("; ");row.gt=row.gt?row.gt+" | "+au:au;}
    if(g.n>1)row.vt+=" (gộp "+g.n+" dòng DV)";
  }else{
    row.nd=o.nd;row.xt="↑";row.so="↑ tính ở dòng gộp";row.kq=kq+" (gộp)";row.gt="";
  }
  return row;
}
export function rcApxBuild(){
  var Z=S.RC_RES,N=X.rcDb().notes,mode=X.RC.ap||"mat",by={};
  function box(cs){var B=by[cs];if(!B)B=by[cs]={cs:cs,rows:[],orph:[],st:{tot:0,ok:0,ap:0,bad:0,nov:0,orph:0}};return B;}
  Z.dt.forEach(function(o){
    if(!X.rcIn(o)||!rcYrOk(o.r.ngay))return;
    var row=rcApxRow(o,N);
    if(mode==="mat"&&o.none&&!row.lech)return;
    if(mode==="bad"&&!row.lech)return;
    box(o.cs||"(chưa rõ cơ sở)").rows.push(row);
  });
  /* phiếu xuất không gắn được dịch vụ nào (xuất chưa có DT, trùng/thừa, thiếu PID) */
  Z.xk.forEach(function(x){
    if(!X.rcIn(x)||!rcYrOk(x.r.ngay)||!x.bad||(x.P==="XUẤT SAI VẬT TƯ"&&x.inWrong))return;
    var n=N[x.nid]||{},d=X.rcDate(x.r.ngay);
    box(x.cs||"(chưa rõ cơ sở)").orph.push({ngay:X.rcDStr(x.r.ngay)||"",dk:d?d.y*10000+d.m*100+d.d:0,so:String(x.r.so||"").trim(),pid:x.pid||"",vt:x.ten||x.ma||"",ma:x.ma||"",sl:x.sl,
      kq:x.ok?"Hợp lệ (đã duyệt)":(RC_KQX[x.P]||(String(x.P).indexOf("THIẾU MÃ KH")===0?"Thiếu mã KH":x.P)),cls:x.ok?"b":"r",gt:[n.r,n.g].filter(Boolean).join(" – "),i:x.i});
  });
  var list=[],seen={},yrs={};
  function push(cs){if(by[cs]&&!seen[cs]){seen[cs]=1;list.push(by[cs]);}}
  X.rcCsList().forEach(push);Object.keys(by).forEach(push);
  list.forEach(function(B){
    B.rows.sort(function(a,b){return (a.dk-b.dk)||(a.pid<b.pid?-1:a.pid>b.pid?1:0)||(a.j-b.j);});
    B.orph.sort(function(a,b){return (a.dk-b.dk)||(a.i-b.i);});
    B.rows.forEach(function(w){
      if(w.dk)yrs[Math.floor(w.dk/10000)]=1;
      if(!w.cnt)return;
      B.st.tot++;
      if(w.kq==="Khớp")B.st.ok++;else if(w.cls==="b")B.st.ap++;else if(w.cls==="r")B.st.bad++;else B.st.nov++;
    });
    B.st.orph=B.orph.length;
  });
  var yk=Object.keys(yrs).sort(),yt=(X.RC.yr&&X.RC.yr!=="Tất cả")?String(X.RC.yr):(yk.length>1?yk[0]+" – "+yk[yk.length-1]:(yk[0]||""));
  var per=(X.RC.th==="Tất cả"||!X.RC.th)?"Tất cả các tháng":"Tháng "+X.RC.th;
  return {list:list,per:per+(yt?" / "+yt:""),th:X.RC.th==="Tất cả"?"":X.RC.th,yr:yt};
}
export function rcApxCard(w, k) {
  var c = RC_APX_CLS[w.cls] || RC_APX_CLS.n, cl = { g: 'g', b: 'a', r: 'r', n: 'n' }[w.cls] || 'n', l, rt, ft;
  l = (
    <>
      <div className="rcx-sv"><b>{w.dv || '—'}</b></div>
      {w.nd === '' ? X.rcCell(w.vt || '—', 'Không đối chiếu vật tư') : X.rcCell(w.vt || '—', 'Vật tư theo định mức', 'SL cần', X.rcQ(w.nd))}
    </>
  );
  if (!w.cnt) rt = X.rcEmpty('Tính ở dòng gộp đầu tiên của nhóm');
  else if (w.xl && w.xl.length) {
    rt = w.xl.map(function (x, xi) {
      return (
        <Fragment key={xi}>
          {X.rcCell(x.ten || x.ma || '—', (x.ma || x.so || x.ngay) ? <>{x.ma ? <>Mã <b>{x.ma}</b></> : null}{x.so ? ' · CT ' + x.so : ''}{x.ngay ? ' · ' + x.ngay : ''}</> : '', 'SL xuất', X.rcQ(x.sl), x.bad ? 'rcx-bad' : '')}
        </Fragment>
      );
    });
  } else rt = X.rcEmpty(w.nd === '' ? 'Không đối chiếu xuất kho' : 'Chưa xuất kho', w.nd !== '');
  ft = (w.cnt && w.nd !== '') ? X.rcFoot(w.nd, w.xt, cl, w.kq) : X.rcFootMsg(cl, w.kq || '—');
  return (
    <div className="apxr" key={'r' + k}>
      <div className="apxr-h"><div className="apxr-n">{k}</div>
        <div style={st('flex:1;min-width:0')}><b>{w.kh || '—'}</b><div className="apxr-m">{(w.pid || 'không có PID') + ' · ' + w.ngay}</div></div>
        <span className={'rcb rcb-' + c[2]}>{w.kq}</span></div>
      {X.rcCmpBox(l, rt, ft)}
      {w.gt ? <div className="apxr-gt"><b>Giải trình:</b> {w.gt}</div> : null}
    </div>
  );
}

export function rcViewApx() {
  var D = rcApxBuild(), ys = [['Tất cả', 'Mọi năm']].concat(rcYears().map(function (y) { return [String(y), 'Năm ' + y]; }));
  var RC = X.RC;
  RC.apxK = D.list.map(function (B) { return 'apx|' + B.cs; });
  var more = false;
  return (
    <>
      {X.rcFilter()}
      <div style={st('display:flex;gap:8px;margin-bottom:12px')}>{X.rcSel(7, ys, RC.yr || 'Tất cả')}{X.rcSel(8, [['mat', 'Dịch vụ có vật tư'], ['bad', 'Chỉ ca lệch'], ['all', 'Tất cả dịch vụ']], RC.ap || 'mat')}</div>
      <div className="card" style={st('margin-bottom:14px')}>
        <div className="rcsec">Phụ lục 01 – Chi tiết đối chiếu dịch vụ và phiếu xuất kho</div>
        <div className="rcnote" style={st('margin-bottom:10px')}>Lấy <b>dịch vụ làm gốc</b>: mỗi dòng = 1 dịch vụ × 1 vật tư theo định mức, đối chiếu với phiếu xuất kho của đúng khách (mã BN). Lập riêng cho từng cơ sở / kho theo bộ lọc phía trên. Dịch vụ cùng khách + cùng vật tư được gộp, SL xuất tính ở dòng đầu.</div>
        <div style={st('display:grid;grid-template-columns:1fr 1fr;gap:8px')}>
          <button className="btn btn-primary" style={st('padding:10px')} onClick={() => A.rcApxXlsx()}>{I('download', 16)}Excel (mỗi kho 1 sheet)</button>
          <button className="btn btn-outline" style={st('padding:10px')} onClick={() => A.rcApxPrint()}>{I('file', 16)}In / PDF (khổ ngang)</button>
        </div>
      </div>
      {!D.list.length ? <div className="empty">Không có dòng nào theo bộ lọc hiện tại.</div> : (
        <>
          {D.list.map(function (B, bi) {
            var s = B.st, key = RC.apxK[bi], open = RC.co[key] !== undefined ? RC.co[key] : (RC.cs !== 'Tất cả' || D.list.length === 1);
            if (B.rows.length > RC.lim) more = true;
            if (B.orph.length > RC.lim) more = true;
            return (
              <details className="apxk" key={key} open={!!open} onToggle={(e) => A.rcApxOpen(bi, e.currentTarget.open)}>
                <summary><div className="apxk-t">Cơ sở: {B.cs}</div><div className="apxk-s">
                  <span className="rcb rcb-gray">{s.tot} dịch vụ</span><span className="rcb rcb-green">Khớp {s.ok}</span>
                  {s.ap ? <span className="rcb rcb-sky">Hợp lệ {s.ap}</span> : null}
                  <span className={'rcb rcb-' + (s.bad ? 'red' : 'green')}>Lệch {s.bad}</span>
                  {s.orph ? <span className="rcb rcb-amber">Xuất chưa gắn DV {s.orph}</span> : null}
                </div></summary>
                <div className="apxk-b">
                  <div className="apxh2">I. Chi tiết theo dịch vụ ({B.rows.length} dòng)</div>
                  {!B.rows.length ? <div className="rcnote">Không có dòng nào.</div> : null}
                  {B.rows.slice(0, RC.lim).map(function (w, i) { return rcApxCard(w, i + 1); })}
                  {B.rows.length > RC.lim ? <div className="rcnote" style={st('text-align:center;padding:4px 0 8px')}>… còn {B.rows.length - RC.lim} dòng, xem đủ trong Excel / PDF.</div> : null}
                  {B.orph.length ? (
                    <>
                      <div className="apxh2">II. Phiếu xuất kho chưa gắn được dịch vụ ({B.orph.length})</div>
                      {B.orph.slice(0, RC.lim).map(function (w, oi) {
                        var c = RC_APX_CLS[w.cls];
                        return (
                          <div className="apxr" key={'o' + oi}>
                            <div className="apxr-h"><div style={st('flex:1;min-width:0')}><b>{w.so || '(không số CT)'}</b><div className="apxr-m">{(w.pid || 'không có PID') + ' · ' + w.ngay}</div></div>
                              <span className={'rcb rcb-' + c[2]}>{w.kq}</span></div>
                            {X.rcCmpBox(X.rcEmpty('Chưa gắn được dịch vụ / doanh thu', 1), X.rcCell(w.vt || '—', w.ma ? <>Mã <b>{w.ma}</b></> : '', 'SL xuất', X.rcQ(w.sl), 'rcx-bad'), X.rcFootMsg(w.cls === 'b' ? 'a' : 'r', w.kq))}
                            {w.gt ? <div className="apxr-gt"><b>Giải trình:</b> {w.gt}</div> : null}
                          </div>
                        );
                      })}
                    </>
                  ) : null}
                </div>
              </details>
            );
          })}
          {more ? <button className="btn btn-outline" onClick={() => A.rcMore()}>Xem thêm</button> : null}
        </>
      )}
    </>
  );
}
