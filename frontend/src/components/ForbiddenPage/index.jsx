import React from 'react';
import { Container, Typography, Button, Box } from '@mui/material';

const ForbiddenPage = () => {
  return (
    <Container sx={{
      textAlign: 'center',
      marginTop: (theme) => 8,    
      flex: 1,
    }}>
      <Box sx={{
        background: (theme) => "#1976d2", 
        borderRadius: 2.5,
        display: 'flex',
        padding: 2.5,
        alignItems: 'center',
        width: '80%',
        justifyContent: 'center',
        margin: 'auto',
      }}>
        <Box>
          <Typography variant="h1" sx={{
            marginBottom: (theme) => 32,
          }} color="error">
            403
          </Typography>
          <Typography variant="h5" color="textSecondary">
            Oops! Acesso Negado!
          </Typography>
          <Button
            sx={{
              marginTop: (theme) => 16,
              color: '#fff !important',
              boxShadow: 'none',
              borderRadius: 2.5
            }}
            variant="contained"
            color="primary"
            href="/tickets"
          >
            Voltar
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default ForbiddenPage;
