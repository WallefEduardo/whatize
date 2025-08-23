import React, { useEffect, useState, useContext } from 'react';
import { useHistory } from 'react-router-dom';
import { toast } from '../../components/ui/ToastProvider';
import {
    Box,
    Typography,
    CircularProgress,
    LinearProgress,
    CssBaseline
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { AuthContext } from "../../context/Auth/AuthContext";
import ColorModeContext from "../../layout/themeContext";
import { Helmet } from "react-helmet";

const AutoLoginContainer = styled(Box)(({ theme }) => ({
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #474c4f 0%, #090b11 100%)',
    padding: 16,
}));

const ContentBox = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 24,
    padding: 32,
    borderRadius: '16px',
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
    minWidth: '400px',
    maxWidth: '500px',
    width: '100%',
    "@media (max-width:600px)": {
        minWidth: '300px',
        padding: 24,
    },
}));

const StyledLinearProgress = styled(LinearProgress)(({ theme }) => ({
    borderRadius: '8px',
    height: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    width: '100%',
    '& .MuiLinearProgress-bar': {
        borderRadius: '8px',
        background: 'linear-gradient(90deg, #00C307 0%, #32CD32 100%)',
    },
}));

const AutoLogin = () => {
    const history = useHistory();
    const { handleLogin } = useContext(AuthContext);
    const { colorMode } = useContext(ColorModeContext);
    const { appName } = colorMode;
    
    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState("Preparando login...");
    const [step, setStep] = useState(0);

    const steps = [
        { message: "Recuperando dados de acesso...", duration: 1000, maxProgress: 20 },
        { message: "Conectando ao servidor...", duration: 1500, maxProgress: 40 },
        { message: "Validando credenciais...", duration: 2000, maxProgress: 70 },
        { message: "Finalizando login...", duration: 1000, maxProgress: 90 },
        { message: "Redirecionando...", duration: 500, maxProgress: 100 }
    ];

    const performAutoLogin = async () => {
        try {
            // Recuperar dados do localStorage
            const storedEmail = localStorage.getItem('signup_email');
            const storedPassword = localStorage.getItem('signup_password');

            if (!storedEmail || !storedPassword) {
                throw new Error('Dados de login não encontrados');
            }

            console.log('Dados recuperados:', { email: storedEmail, password: '***' });

            // Simular progresso
            for (let i = 0; i < steps.length - 1; i++) {
                setStep(i);
                setMessage(steps[i].message);
                
                // Progresso gradual
                const startProgress = i === 0 ? 0 : steps[i - 1].maxProgress;
                const targetProgress = steps[i].maxProgress;
                const progressStep = (targetProgress - startProgress) / 20;
                
                for (let j = 0; j < 20; j++) {
                    await new Promise(resolve => setTimeout(resolve, steps[i].duration / 20));
                    setProgress(Math.min(startProgress + (progressStep * (j + 1)), targetProgress));
                }

                // Fazer login na etapa de validação
                if (i === 2) {
                    console.log('Tentando fazer login...');
                    
                    const loginData = {
                        email: storedEmail.toLowerCase().trim(),
                        password: storedPassword
                    };

                    console.log('Dados de login:', loginData);
                    await handleLogin(loginData);
                }
            }

            // Etapa final
            setStep(4);
            setMessage(steps[4].message);
            setProgress(100);

            // Limpar dados temporários
            localStorage.removeItem('signup_email');
            localStorage.removeItem('signup_password');

            await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
            console.error('Erro no login automático:', error);
            
            // Limpar dados temporários
            localStorage.removeItem('signup_email');
            localStorage.removeItem('signup_password');
            
            // Mostrar erro específico
            if (error.message === 'Dados de login não encontrados') {
                toast.error("Sessão expirada. Redirecionando para login...");
            } else if (error.response?.status === 401) {
                toast.error("Credenciais inválidas. Verifique seu email e senha.");
            } else {
                toast.error("Erro ao fazer login automático. Redirecionando...");
            }
            
            // Redirecionar para login após erro
            setTimeout(() => {
                history.push('/login');
            }, 3000);
        }
    };

    useEffect(() => {
        // Verificar se há dados para login automático
        const hasStoredData = localStorage.getItem('signup_email') && localStorage.getItem('signup_password');
        
        if (!hasStoredData) {
            toast.error("Dados de login não encontrados. Redirecionando...");
            setTimeout(() => {
                history.push('/login');
            }, 2000);
            return;
        }

        // Iniciar login automático após um pequeno delay
        const timer = setTimeout(() => {
            performAutoLogin();
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <>
            <Helmet>
                <title>{appName || "Whatize"} - Fazendo Login</title>
                <link rel="icon" href="/favicon.png" />
            </Helmet>
            <CssBaseline enableColorScheme />
            <AutoLoginContainer>
                <ContentBox>
                    {/* Logo */}
                    <Box>
                        <img 
                            src="/logo.svg" 
                            alt="Logo" 
                            style={{ 
                                width: '250px',
                                maxWidth: '100%'
                            }} 
                        />
                    </Box>

                    {/* Título */}
                    <Typography 
                        variant="h4" 
                        sx={{
                            color: 'white',
                            fontWeight: 600,
                            textAlign: 'center',
                            fontSize: 'clamp(1.3rem, 4vw, 1.8rem)'
                        }}
                    >
                        Conta criada com sucesso! 🎉
                    </Typography>

                    {/* Subtitle */}
                    <Typography 
                        variant="body1" 
                        sx={{
                            color: 'rgba(255, 255, 255, 0.8)',
                            textAlign: 'center',
                            fontSize: '1rem'
                        }}
                    >
                        Aguarde enquanto fazemos seu login automaticamente...
                    </Typography>

                    {/* Spinner */}
                    <CircularProgress 
                        size={60} 
                        sx={{ 
                            color: '#00C307'
                        }} 
                    />

                    {/* Mensagem atual */}
                    <Typography 
                        variant="body2" 
                        sx={{
                            color: 'rgba(255, 255, 255, 0.9)',
                            textAlign: 'center',
                            fontSize: '1rem',
                            fontWeight: 500,
                            minHeight: '24px'
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
                                fontSize: '0.9rem'
                            }}
                        >
                            {Math.round(progress)}% concluído
                        </Typography>
                    </Box>

                    {/* Mensagem adicional */}
                    <Typography 
                        variant="caption" 
                        sx={{
                            color: 'rgba(255, 255, 255, 0.6)',
                            textAlign: 'center',
                            fontSize: '0.85rem',
                            fontStyle: 'italic'
                        }}
                    >
                        Isso pode levar alguns segundos...
                    </Typography>
                </ContentBox>
            </AutoLoginContainer>
        </>
    );
};

export default AutoLogin; 