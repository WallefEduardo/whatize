import React from 'react';
import {
    Dialog,
    DialogContent,
    Box,
    Typography,
    CircularProgress,
    LinearProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledDialog = styled(Dialog)(({ theme }) => ({
    '& .MuiDialog-paper': {
        borderRadius: '16px',
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
        padding: 24,
        minWidth: '320px',
        maxWidth: '400px',
    },
});

const StyledLinearProgress = styled(LinearProgress)(({ theme }) => ({
    borderRadius: '8px',
    height: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    '& .MuiLinearProgress-bar': {
        borderRadius: '8px',
        background: 'linear-gradient(90deg, #00C307 0%, #32CD32 100%)',
    },
});

const AutoLoginModal = ({ open, progress = 0, message = "Fazendo login..." }) => {
    return (
        <StyledDialog
            open={open}
            disableEscapeKeyDown={true}
            BackdropProps={{
                style: { pointerEvents: 'none' }
            }}
        >
            <DialogContent>
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 3,
                    py: 2
                }}>
                    {/* Logo */}
                    <Box>
                        <img 
                            src="/logo.svg" 
                            alt="Logo" 
                            style={{ 
                                width: '200px',
                                maxWidth: '100%'
                            }} 
                        />
                    </Box>

                    {/* Título */}
                    <Typography 
                        variant="h6" 
                        sx={{
                            color: 'white',
                            fontWeight: 600,
                            textAlign: 'center',
                            fontSize: '1.1rem'
                        }}
                    >
                        Conta criada com sucesso! 🎉
                    </Typography>

                    {/* Spinner */}
                    <CircularProgress 
                        size={50} 
                        sx={{ 
                            color: '#00C307'
                        }} 
                    />

                    {/* Mensagem */}
                    <Typography 
                        variant="body2" 
                        sx={{
                            color: 'rgba(255, 255, 255, 0.8),
                            textAlign: 'center',
                            fontSize: '0.95rem'
                        }}
                    >
                        {message}
                    </Typography>

                    {/* Barra de progresso */}
                    <Box sx={{ width: '100%' }}>
                        <StyledLinearProgress 
                            variant="determinate" 
                            value={progress} 
                        />
                        <Typography 
                            variant="caption" 
                            sx={{
                                color: 'rgba(255, 255, 255, 0.6)',
                                textAlign: 'center',
                                display: 'block',
                                mt: 1,
                                fontSize: '0.8rem'
                            }}
                        >
                            {Math.round(progress)}%
                        </Typography>
                    </Box>

                    {/* Mensagem adicional */}
                    <Typography 
                        variant="caption" 
                        sx={{
                            color: 'rgba(255, 255, 255, 0.6)',
                            textAlign: 'center',
                            fontSize: '0.8rem',
                            fontStyle: 'italic'
                        }}
                    >
                        Aguarde um momento...
                    </Typography>
                </Box>
            </DialogContent>
        </StyledDialog>
    );
};

export default AutoLoginModal; 