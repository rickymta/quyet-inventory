import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import './styles/app.css';
import { boot } from './core';
import { installDomPatches } from './core/domPatches.js';
import Shell from './core/Shell.jsx';
import './modules';
import './core/permGuards.js';

function Root() {
  return (
    <>
      <Shell />
      <div id="toast" role="status" aria-live="polite"><div className="in" id="toastin" /></div>
      <div id="netbar" hidden>Đang ngoại tuyến · thay đổi sẽ được gửi lên máy chủ khi có mạng</div>
    </>
  );
}

createRoot(document.getElementById('root')).render(<Root />);
installDomPatches();
boot();
