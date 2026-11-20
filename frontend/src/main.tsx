import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import App from './App';
import { AuthProvider } from './auth/AuthProvider';
import ErrorBoundary from './components/ErrorBoundary';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#90caf9' },
    background: { default: '#0b1020', paper: '#131a2e' },
  },
  shape: { borderRadius: 8 },
  // Системні шрифти: без зовнішніх завантажень
  typography: {
    fontFamily: '"Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif',
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline enableColorScheme />
        <ErrorBoundary>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);