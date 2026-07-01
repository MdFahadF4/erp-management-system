import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { I18nProvider } from './i18n/I18nProvider.jsx';
import App from './App.jsx';
import { installGlobalNumberInputWheelGuard } from './lib/recordHelpers.js';
import { installSearchableSelectSystem, setTomSelectLoader } from '../../js/searchable-select.js';
import TomSelect from 'tom-select';
import './index.css';

setTomSelectLoader(async () => TomSelect);
installGlobalNumberInputWheelGuard();
installSearchableSelectSystem(document).catch((err) => {
  console.warn('Searchable selects init failed', err);
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <I18nProvider>
        <App />
      </I18nProvider>
    </BrowserRouter>
  </StrictMode>
);
