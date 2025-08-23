import React from 'react';
import { Box, Typography, Button, Card, CardContent } from '@mui/material';
import { Error as ErrorIcon, Refresh as RefreshIcon } from '@mui/icons-material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Atualiza o state para mostrar a UI de erro
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log do erro para debugging
    console.error('ErrorBoundary capturou um erro:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Aqui você pode enviar o erro para um serviço de logging
    // Ex: Sentry, LogRocket, etc.
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  }

  handleReload = () => {
    window.location.reload();
  }

  render() {
    if (this.state.hasError) {
      // UI customizada de erro
      return (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
          p={3}
        >
          <Card sx={{ maxWidth: 600, width: '100%' }}>
            <CardContent sx={{ textAlign: 'center', p: 4 }}>
              <ErrorIcon 
                sx={{ fontSize: 64, color: 'error.main', mb: 2 }} 
              />
              
              <Typography variant="h5" gutterBottom color="error">
                Oops! Algo deu errado
              </Typography>
              
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {this.props.fallbackMessage || 
                  'Ocorreu um erro inesperado. Por favor, tente novamente.'}
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={this.handleReset}
                >
                  Tentar Novamente
                </Button>
                
                <Button
                  variant="contained"
                  color="primary"
                  onClick={this.handleReload}
                >
                  Recarregar Página
                </Button>
              </Box>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <Box sx={{ mt: 3, textAlign: 'left' }}>
                  <Typography variant="subtitle2" color="error" gutterBottom>
                    Informações do erro (desenvolvimento):
                  </Typography>
                  <Box
                    component="pre"
                    sx={{
                      backgroundColor: '#f5f5f5',
                      p: 2,
                      borderRadius: 1,
                      overflow: 'auto',
                      fontSize: '0.875rem',
                      maxHeight: '200px'
                    }}
                  >
                    {this.state.error.toString()}
                    {this.state.errorInfo.componentStack}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      );
    }

    return this.props.children;
  }
}

// Wrapper funcional para usar hooks se necessário
export const ErrorBoundaryWrapper = ({ children, fallbackMessage, onError }) => {
  return (
    <ErrorBoundary fallbackMessage={fallbackMessage} onError={onError}>
      {children}
    </ErrorBoundary>
  );
};

export default ErrorBoundary;