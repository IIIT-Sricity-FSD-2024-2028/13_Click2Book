import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import store from './store';
import App from './App';
import './index.css';

const container = document.getElementById('root');
if (container) {
  if (!window.__c2b_support_root__) {
    window.__c2b_support_root__ = createRoot(container);
  }
  window.__c2b_support_root__.render(
    <Provider store={store}>
      <App />
    </Provider>
  );
}
