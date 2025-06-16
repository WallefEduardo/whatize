import React from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  LinearProgress,
  Fade,
  Backdrop
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { CheckCircle, AccountCircle, Business, Settings } from '@mui/icons-material';

// Animações
const pulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

const slideUp = keyframes`
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

// Componentes estilizados
const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: '20px',
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
    padding: theme.spacing(3),
    minWidth: '400px',
    maxWidth: '500px',
    [theme.breakpoints.down('sm')]: {
      minWidth: '90vw',
      margin: theme.spacing(2),
    },
  },
}));

const StyledBackdrop = styled(Backdrop)({
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  backdropFilter: 'blur(5px)',
});

const ProgressContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(3),
  padding: theme.spacing(2),
}));

const IconContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '80px',
  height: '80px',
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #00C307 0%, #32CD32 100%)',
  boxShadow: '0 10px 30px rgba(0, 195, 7, 0.3)',
  animation: `${pulse} 2s ease-in-out infinite`,
  '& .MuiSvgIcon-root': {
    fontSize: '2.5rem',
    color: 'white',
  },
}));

const StyledLinearProgress = styled(LinearProgress)(({ theme }) => ({
  width: '100%',
  height: '8px',
  borderRadius: '4px',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  '& .MuiLinearProgress-bar': {
    borderRadius: '4px',
    background: 'linear-gradient(90deg, #00C307 0%, #32CD32 100%)',
    boxShadow: '0 2px 10px rgba(0, 195, 7, 0.4)',
  },
}));

const StepContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  width: '100%',
  marginTop: theme.spacing(2),
}));

const StepItem = styled(Box)(({ theme, completed, active }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(1.5),
  borderRadius: '12px',
  background: completed 
    ? 'rgba(0, 195, 7, 0.1)' 
    : active 
      ? 'rgba(255, 255, 255, 0.1)' 
      : 'rgba(255, 255, 255, 0.05)',
  border: `1px solid ${
    completed 
      ? 'rgba(0, 195, 7, 0.3)' 
      : active 
        ? 'rgba(255, 255, 255, 0.2)' 
        : 'rgba(255, 255, 255, 0.1)'
  }`,
  transition: 'all 0.3s ease',
  animation: active ? `${slideUp} 0.5s ease-out` : 'none',
  '& .step-icon': {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: completed 
      ? 'linear-gradient(135deg, #00C307 0%, #32CD32 100%)' 
      : active 
        ? 'rgba(255, 255, 255, 0.2)' 
        : 'rgba(255, 255, 255, 0.1)',
    '& .MuiSvgIcon-root': {
      fontSize: '16px',
      color: completed ? 'white' : 'rgba(255, 255, 255, 0.7)',
      animation: active && !completed ? `${rotate} 2s linear infinite` : 'none',
    },
  },
  '& .step-text': {
    color: completed 
      ? '#00C307' 
      : active 
        ? 'rgba(255, 255, 255, 0.9)' 
        : 'rgba(255, 255, 255, 0.6)',
    fontWeight: active ? 600 : 400,
    fontSize: '0.95rem',
  },
}));

const ProgressModal = ({ open, progress = 0, currentStep = 0, message = "Preparando sua conta..." }) => {
  const steps = [
    { icon: <AccountCircle />, text: "Validando informações" },
    { icon: <Business />, text: "Criando empresa" },
    { icon: <Settings />, text: "Configurando sistema" },
    { icon: <CheckCircle />, text: "Finalizando cadastro" }
  ];

  return (
    <StyledDialog
      open={open}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
      BackdropComponent={StyledBackdrop}
      TransitionComponent={Fade}
      transitionDuration={300}
    >
      <DialogContent>
        <ProgressContainer>
          <IconContainer>
            {currentStep === steps.length - 1 ? (
              <CheckCircle />
            ) : (
              steps[currentStep]?.icon || <Settings />
            )}
          </IconContainer>

          <Box sx={{ textAlign: 'center', width: '100%' }}>
            <Typography 
              variant="h5" 
              sx={{ 
                color: 'white', 
                fontWeight: 600, 
                mb: 1,
                fontSize: 'clamp(1.2rem, 4vw, 1.5rem)'
              }}
            >
              Criando sua conta
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.8)', 
                mb: 3,
                fontSize: '1rem'
              }}
            >
              {message}
            </Typography>

            <StyledLinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{ mb: 2 }}
            />
            
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '0.9rem'
              }}
            >
              {Math.round(progress)}% concluído
            </Typography>
          </Box>

          <StepContainer>
            {steps.map((step, index) => (
              <StepItem 
                key={index}
                completed={index < currentStep}
                active={index === currentStep}
              >
                <div className="step-icon">
                  {index < currentStep ? <CheckCircle /> : step.icon}
                </div>
                <Typography className="step-text">
                  {step.text}
                </Typography>
              </StepItem>
            ))}
          </StepContainer>

          <Typography 
            variant="body2" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.5)', 
              textAlign: 'center',
              mt: 2,
              fontSize: '0.85rem'
            }}
          >
            Por favor, aguarde enquanto preparamos tudo para você...
          </Typography>
        </ProgressContainer>
      </DialogContent>
    </StyledDialog>
  );
};

export default ProgressModal; 