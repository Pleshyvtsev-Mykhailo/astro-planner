import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Alert, AlertTitle, Box, Button } from '@mui/material';

interface Props {
  children: ReactNode;
}

interface State {
  failed: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Помилка відображення:', error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <Box sx={{ p: 3, maxWidth: 560, mx: 'auto' }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => window.location.assign('/')}>
              На головну
            </Button>
          }
        >
          <AlertTitle>Щось пішло не так</AlertTitle>
          Сталася неочікувана помилка. Спробуйте оновити сторінку.
        </Alert>
      </Box>
    );
  }
}