/* Phần 2 · nhập tay từng dòng doanh thu / xuất kho, dán từ MISA, xoá dữ liệu (dòng gốc 9619–9651). */
/* eslint-disable */
import { A, X, S, db, audit, saveSoon, toast, rerender, closeModal, openModal, norm, esc, st } from '../../core';
import { rcRunImport, rcApply } from './p2-import.js';

export var RC_FD=[["cs","Cơ sở"],["pid","Mã KH (PID)"],["kh","Khách hàng"],["bs","Bác sĩ"],["ngay","Ngày DV (dd/mm/yyyy)"],["dv","Dịch vụ"],["sl","SL dịch vụ"],["dt","Giá trị DT (VND)"]];
export var RC_FX=[["cs","Cơ sở"],["pid","Mã KH (PID) – điền để khớp tay, ưu tiên hơn PID trong diễn giải"],["ma","Mã vật tư (mã hàng)"],["ten","Tên vật tư"],["ngay","Ngày xuất (dd/mm/yyyy)"],["so","Số CT"],["dg","Diễn giải"],["dvt","ĐVT"],["ct","Loại CT"],["sl","SL xuất"]];

/* hộp thoại sửa / thêm dòng: ô nhập đọc DOM lúc bấm Lưu như app gốc (id rcf0..), key theo bản ghi để ô được tạo lại */
function rcRowOpen(side, i) {
  var R = X.rcDb(), r = i >= 0 ? (side ? R.xk : R.dt)[i] : {}, F = (side ? RC_FX : RC_FD).concat(side ? [['tenm', 'Vật tư gán tay (mã/tên vật tư để khớp với ca doanh thu)']] : [['ov', 'Chọn VẬT TƯ (nếu vật tư theo định mức tự nhảy sai)']]), nm = X.rcNames();
  openModal(() => (
    <div style={st('position:fixed;inset:0;background:rgba(16,24,40,.5);z-index:90;display:flex;align-items:flex-end;justify-content:center')}>
      <div style={st('background:#fff;width:100%;max-width:520px;max-height:90vh;overflow-y:auto;border-radius:18px 18px 0 0;padding:16px')}>
        <div className="sec">{(i >= 0 ? 'Sửa dòng' : 'Thêm dòng') + (side ? ' xuất kho' : ' doanh thu')}</div>
        {F.map((f, k) => {
          var v = r[f[0]] == null ? '' : r[f[0]]; if (side && f[0] === 'pid' && !v) v = r.pidm || '';
          var kk = side + '|' + i + '|' + k;
          if (f[0] === 'ov' || f[0] === 'tenm') {
            var o = nm.slice(); if (v && o.indexOf(v) < 0) o.push(v);
            return (
              <div key={kk}>
                <label className="lbl">{f[1]}</label>
                <select className="inp" id={'rcf' + k} style={st('margin-bottom:8px')} defaultValue={v}>
                  <option value="">{side ? '(không gán)' : '(tự động theo dịch vụ)'}</option>
                  {o.map((x) => <option key={x} value={x}>{x}</option>)}
                </select>
              </div>
            );
          }
          return (
            <div key={kk}>
              <label className="lbl">{f[1]}</label>
              <input className="inp" id={'rcf' + k} defaultValue={v} style={st('margin-bottom:8px')} />
            </div>
          );
        })}
        <div style={st('display:flex;gap:8px;margin-top:6px')}>
          <button className="btn btn-outline" onClick={() => A.rcRowClose()}>Hủy</button>
          <button className="btn btn-primary" onClick={() => A.rcRowSave(side, i)}>Lưu</button>
        </div>
      </div>
    </div>
  ));
}

export const actions = {
  rcGo:function(k){var g=X.RC_GO[k];if(!g)return;X.RC.tab=g.t;if(g.side!=null)X.RC.side=g.side;if(g.map)X.RC.map=g.map;X.RC.q=g.q||"";if(g.only!=null)X.RC.only=g.only;X.RC.lim=40;rerender();window.scrollTo(0,0);},
  rcRow:function(side,i){rcRowOpen(side,i);},
  rcRowSave:function(side,i){
    var R=X.rcDb(),arr=side?R.xk:R.dt,F=(side?RC_FX:RC_FD).concat(side?[["tenm"]]:[["ov"]]),r=i>=0?arr[i]:{},v={},k;
    if(!r)return;
    F.forEach(function(f,j){var x=document.getElementById("rcf"+j).value.trim();v[f[0]]=(f[0]==="sl"||f[0]==="dt")?X.rcNum(x):x;});
    if(!v.cs||!(side?(v.ten||v.ma):(v.dv||v.pid))){toast(side?"Cần nhập Cơ sở và Tên hoặc Mã vật tư":"Cần nhập Cơ sở và Dịch vụ hoặc PID");return;}
    for(k in v){if(v[k]===""&&(k==="ov"||k==="pid"||k==="tenm"))delete r[k];else r[k]=v[k];}
    if(side)delete r.pidm;
    if(i<0){r.id="new|"+Date.now().toString(36)+Math.random().toString(36).slice(2,5);arr.push(r);}
    audit("recon-row",r.id,null,i<0?"thêm":"sửa");saveSoon();A.rcRowClose();rerender();toast("Đã lưu");
  },
  rcRowDel:function(side,i){if(!confirm("Xóa dòng dữ liệu này?"))return;var R=X.rcDb();(side?R.xk:R.dt).splice(i,1);saveSoon();rerender();},
  rcRowClose:function(){closeModal();},
  rcPaste:function(kind){
    var t=document.getElementById("rcpaste").value;if(!t.trim()){toast("Chưa có dữ liệu để dán");return;}
    var sd=kind?"xk":"dt";
    rcRunImport("Dán từ MISA / Excel",function(){var nt={},o={};o[sd]=rcApply(sd,X.rcMk(t.split(/\r?\n/).map(function(l){return l.split("\t");}),sd,false,nt),nt);return o;});
  },
  rcClear:function(kind){if(!confirm("Xóa toàn bộ dữ liệu "+(kind?"xuất kho":"doanh thu")+"? Giải trình đã nhập vẫn được giữ."))return;X.rcDb()[kind?"xk":"dt"]=[];saveSoon();rerender();}
};
