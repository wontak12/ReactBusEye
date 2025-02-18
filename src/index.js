import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './css/gnb.css';
import './css/sidebar/sidedown.css';
import './css/sidebar/sideup.css';
import './css/kakaomap.css';
import Gnb from './component/gnb.js';
import Sidebar from './component/sidebar.js';
import KakaoMap from './component/kakaomap.js';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <>
    <Gnb />
    <div className="contentsBox">
      <Sidebar />
      <KakaoMap />
    </div>
  </>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
