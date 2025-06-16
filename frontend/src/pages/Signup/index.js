import React, { useState, useEffect, useContext, useCallback, useMemo } from "react";
import qs from 'query-string';
import * as Yup from "yup";
import { useHistory } from "react-router-dom";
import { Link as RouterLink } from "react-router-dom";
import { toast } from "react-toastify";
import { Formik, Form, Field } from "formik";

// Components
import ProgressModal from "../../components/ProgressModal";

// MUI Components
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import { styled } from '@mui/material/styles';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';

// Icons
import { Person, Mail, Lock, Business, Phone } from '@mui/icons-material';
import SendIcon from '@mui/icons-material/Send';

import usePlans from '../../hooks/usePlans';
import { i18n } from "../../translate/i18n";
import { openApi } from "../../services/api";
import toastError from "../../errors/toastError";
import ColorModeContext from "../../layout/themeContext";
import { Helmet } from "react-helmet";

// utils
import { validateCpfCnpj } from "../../utils/validateCpfCnpj";

// Função para formatar telefone
const formatPhone = (value) => {
    if (!value) return value;
    const phoneNumber = value.replace(/[^\d]/g, '');
    const phoneNumberLength = phoneNumber.length;
    
    if (phoneNumberLength < 3) return phoneNumber;
    if (phoneNumberLength < 7) {
        return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2)}`;
    }
    return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 7)}-${phoneNumber.slice(7, 11)}`;
};

// Função para formatar CPF/CNPJ
const formatDocument = (value) => {
    if (!value) return value;
    const cleanValue = value.replace(/[^\d]/g, '');
    
    if (cleanValue.length <= 11) {
        // CPF
        return cleanValue
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
        // CNPJ
        return cleanValue
            .replace(/(\d{2})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1/$2')
            .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
    }
};

const Card = styled(MuiCard)(({ theme }) => ({
    display: 'flex',
    borderRadius: '16px',
    flexDirection: 'column',
    alignSelf: 'center',
    width: '100%',
    padding: theme.spacing(4),
    gap: theme.spacing(2),
    margin: 'auto',
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    [theme.breakpoints.up('sm')]: {
        maxWidth: '600px',
    },
    [theme.breakpoints.up('md')]: {
        maxWidth: '800px',
    },
    boxShadow: '0 8px 32px 0 #090b11',
}));

const SignUpContainer = styled(Stack)(({ theme }) => ({
    minHeight: '100vh',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    padding: theme.spacing(2),
    background: 'linear-gradient(135deg, #474c4f 0%, #090b11 100%)',
    [theme.breakpoints.up('sm')]: {
        padding: theme.spacing(4),
    },
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
    '& .MuiOutlinedInput-root': {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        '& fieldset': {
            borderColor: 'rgba(255, 255, 255, 0.2)',
        },
        '&:hover fieldset': {
            borderColor: 'rgba(255, 255, 255, 0.3)',
        },
    },
    '& .MuiInputBase-input': {
        color: 'rgba(255, 255, 255, 0.9)',
    },
    '& .MuiInputLabel-root': {
        color: 'rgba(255, 255, 255, 0.7)',
    },
}));

const StyledFormLabel = styled(FormLabel)({
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: '8px',
});

const StyledLink = styled(Link)({
    color: 'rgba(255, 255, 255, 0.7)',
    '&:hover': {
        color: 'rgba(255, 255, 255, 0.9)',
    },
});

const StyledSelect = styled(Select)(({ theme }) => ({
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    '& .MuiOutlinedInput-notchedOutline': {
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    '& .MuiSelect-select': {
        color: 'rgba(255, 255, 255, 0.9)',
        padding: '14px',
    },
    '& .MuiSvgIcon-root': {
        color: 'rgba(255, 255, 255, 0.7)',
    },
}));

const StyledMenuItem = styled(MenuItem)(({ theme }) => ({
    '&.MuiMenuItem-root': {
        padding: '16px',
        borderRadius: '8px',
        margin: '4px',
        '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
        },
        '&.Mui-selected': {
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
            },
        },
    },
}));

const PlanCard = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    '& .plan-name': {
        fontWeight: 600,
        color: 'rgba(255, 255, 255, 0.9)',
    },
    '& .plan-details': {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: '0.9rem',
    },
    '& .plan-price': {
        color: '#4CAF50',
        fontWeight: 600,
    },
}));

// Memoizar o schema para evitar recriações desnecessárias
const UserSchema = Yup.object().shape({
    name: Yup.string()
        .min(2, "Nome muito curto!")
        .max(50, "Nome muito longo!")
        .required("Nome é obrigatório"),
    companyName: Yup.string()
        .min(2, "Nome da empresa muito curto!")
        .max(50, "Nome da empresa muito longo!")
        .required("Nome da empresa é obrigatório"),
    password: Yup.string()
        .min(5, "Senha muito curta!")
        .max(50, "Senha muito longa!")
        .required("Senha é obrigatória"),
    document: Yup.string()
        .test('is-cpf-cnpj', 'CPF/CNPJ inválido', (value) => {
            if (!value) return false;
            return validateCpfCnpj(value);
        })
        .required("CPF/CNPJ é obrigatório"),
    email: Yup.string()
        .email("Email inválido")
        .required("Email é obrigatório"),
    phone: Yup.string()
        .min(10, "Telefone inválido")
        .required("Telefone é obrigatório"),
    planId: Yup.string().required("Plano é obrigatório"),
});

const SignUp = () => {
    const history = useHistory();
    const { getPlanList } = usePlans();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const { colorMode } = useContext(ColorModeContext);
    const { appName } = colorMode;
    
    // Estados para o modal de progresso
    const [showProgress, setShowProgress] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentStep, setCurrentStep] = useState(0);
    const [progressMessage, setProgressMessage] = useState("Preparando sua conta...");

    // Memoizar companyId para evitar recálculos
    const companyId = useMemo(() => {
        const params = qs.parse(window.location.search);
        return params.companyId || null;
    }, []);

    // Memoizar estado inicial
    const initialState = useMemo(() => ({
        name: "",
        email: "",
        password: "",
        phone: "",
        companyId,
        document: "",
        companyName: "",
        planId: ""
    }), [companyId]);

    // Simplificar carregamento dos planos
    useEffect(() => {
        const fetchPlans = async () => {
            try {
                // Timeout de 10 segundos para evitar travamento
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout')), 10000)
                );
                
                const planListPromise = getPlanList({ listPublic: "false" });
                
                const planList = await Promise.race([planListPromise, timeoutPromise]);
                setPlans(planList || []);
            } catch (error) {
                // Dados mock para evitar travamento
                const mockPlans = [
                    {
                        id: 1,
                        name: "Plano Básico",
                        users: 2,
                        connections: 1,
                        queues: 3,
                        amount: "49.90"
                    },
                    {
                        id: 2,
                        name: "Plano Profissional",
                        users: 5,
                        connections: 2,
                        queues: 5,
                        amount: "99.90"
                    },
                    {
                        id: 3,
                        name: "Plano Empresarial",
                        users: 10,
                        connections: 5,
                        queues: 10,
                        amount: "199.90"
                    }
                ];
                setPlans(mockPlans);
                toast.warning('Usando planos de demonstração. Verifique a conexão com o servidor.');
            } finally {
                setLoading(false);
            }
        };
        
        fetchPlans();
    }, []); // Removido getPlanList da dependência para evitar loops

    // Função para simular progresso
    const simulateProgress = useCallback(() => {
        const steps = [
            { message: "Validando informações...", duration: 1000 },
            { message: "Criando empresa...", duration: 2000 },
            { message: "Configurando sistema...", duration: 1500 },
            { message: "Finalizando cadastro...", duration: 1000 }
        ];

        let currentProgress = 0;
        let stepIndex = 0;

        const updateProgress = () => {
            if (stepIndex < steps.length) {
                setCurrentStep(stepIndex);
                setProgressMessage(steps[stepIndex].message);
                
                const stepProgress = 100 / steps.length;
                const targetProgress = (stepIndex + 1) * stepProgress;
                
                const progressInterval = setInterval(() => {
                    currentProgress += 2;
                    setProgress(Math.min(currentProgress, targetProgress));
                    
                    if (currentProgress >= targetProgress) {
                        clearInterval(progressInterval);
                        stepIndex++;
                        setTimeout(updateProgress, 200);
                    }
                }, 50);
            }
        };

        updateProgress();
    }, []);

    // Memoizar função de signup
    const handleSignUp = useCallback(async (values) => {
        if (submitting) return;
        
        try {
            setSubmitting(true);
            setShowProgress(true);
            setProgress(0);
            setCurrentStep(0);
            setProgressMessage("Validando informações...");
            
            // Iniciar simulação de progresso
            simulateProgress();
            
            // Timeout de 30 segundos para evitar travamento
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout na requisição')), 30000)
            );
            
            const signupPromise = openApi.post("/auth/signup", values);
            
            const response = await Promise.race([signupPromise, timeoutPromise]);
            
            // Garantir que chegue a 100%
            setProgress(100);
            setCurrentStep(3);
            setProgressMessage("Conta criada com sucesso!");
            
            // Aguardar um pouco para mostrar o sucesso
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            toast.success(i18n.t("signup.toasts.success"));
            history.push("/login");
        } catch (err) {
            if (err.message === 'Timeout na requisição') {
                toast.error('A requisição demorou muito para responder. Tente novamente.');
            } else {
                toastError(err);
            }
        } finally {
            setSubmitting(false);
            setShowProgress(false);
            setProgress(0);
            setCurrentStep(0);
        }
    }, [history, submitting, simulateProgress]);

    return (
        <>
            <Helmet>
                <title>{appName || "Whatize"}</title>
                <link rel="icon" href="/favicon.png" />
            </Helmet>
            <CssBaseline enableColorScheme />
            <SignUpContainer>
                <Card>
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        mb: 4,
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 2
                    }}>
                        <Box>
                            <img src="/logo.svg" alt="Logo" style={{ width: '350px' }} />
                        </Box>
                        <Typography variant="h4" sx={{
                            color: 'white',
                            fontWeight: 600,
                            textAlign: 'center',
                            fontSize: 'clamp(1.5rem, 5vw, 2rem)'
                        }}>
                            {i18n.t("signup.title")}
                        </Typography>
                        <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center' }}>
                        Inicie agora mesmo seu teste gratuito!
                        </Typography>
                    </Box>

                    <Formik
                        initialValues={initialState}
                        validationSchema={UserSchema}
                        onSubmit={async (values, actions) => {
                            await handleSignUp(values);
                            actions.setSubmitting(false);
                        }}
                        validateOnChange={false}
                        validateOnBlur={true}
                    >
                        {({ touched, errors, isSubmitting, values }) => (
                            <Form style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <FormControl>
                                    <StyledFormLabel>Nome da Empresa</StyledFormLabel>
                                    <Field
                                        as={StyledTextField}
                                        name="companyName"
                                        placeholder="Sua empresa"
                                        error={touched.companyName && Boolean(errors.companyName)}
                                        helperText={touched.companyName && errors.companyName}
                                        fullWidth
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Business sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </FormControl>
                                                                    <FormControl>
                                        <StyledFormLabel>Seu CPF ou CNPJ</StyledFormLabel>
                                        <Field name="document">
                                            {({ field, form }) => (
                                                <StyledTextField
                                                    {...field}
                                                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                                                    error={touched.document && Boolean(errors.document)}
                                                    helperText={touched.document && errors.document}
                                                    fullWidth
                                                    onChange={(e) => {
                                                        const formatted = formatDocument(e.target.value);
                                                        form.setFieldValue('document', formatted);
                                                    }}
                                                    InputProps={{
                                                        startAdornment: (
                                                            <InputAdornment position="start">
                                                                <Business sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                                                            </InputAdornment>
                                                        ),
                                                    }}
                                                />
                                            )}
                                        </Field>
                                    </FormControl>
                                <Box sx={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, 
                                    gap: 2 
                                }}>
                                    <FormControl>
                                        <StyledFormLabel>Seu Nome</StyledFormLabel>
                                        <Field
                                            as={StyledTextField}
                                            name="name"
                                            placeholder="Seu nome completo"
                                            error={touched.name && Boolean(errors.name)}
                                            helperText={touched.name && errors.name}
                                            fullWidth
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <Person sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    </FormControl>

                                    <FormControl>
                                        <StyledFormLabel>Telefone</StyledFormLabel>
                                        <Field name="phone">
                                            {({ field, form }) => (
                                                <StyledTextField
                                                    {...field}
                                                    placeholder="(00) 00000-0000"
                                                    error={touched.phone && Boolean(errors.phone)}
                                                    helperText={touched.phone && errors.phone}
                                                    fullWidth
                                                    onChange={(e) => {
                                                        const formatted = formatPhone(e.target.value);
                                                        form.setFieldValue('phone', formatted);
                                                    }}
                                                    InputProps={{
                                                        startAdornment: (
                                                            <InputAdornment position="start">
                                                                <Phone sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                                                            </InputAdornment>
                                                        ),
                                                    }}
                                                />
                                            )}
                                        </Field>
                                    </FormControl>
                                </Box>

                                <Box sx={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, 
                                    gap: 2 
                                }}>
                                    <FormControl>
                                        <StyledFormLabel>E-mail</StyledFormLabel>
                                        <Field
                                            as={StyledTextField}
                                            name="email"
                                            type="email"
                                            placeholder="seu@email.com"
                                            error={touched.email && Boolean(errors.email)}
                                            helperText={touched.email && errors.email}
                                            fullWidth
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <Mail sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                                                    </InputAdornment>
                                                ),
                                                style: { textTransform: 'lowercase' }
                                            }}
                                        />
                                    </FormControl>

                                    <FormControl>
                                        <StyledFormLabel>Senha</StyledFormLabel>
                                        <Field
                                            as={StyledTextField}
                                            type="password"
                                            name="password"
                                            placeholder="••••••"
                                            error={touched.password && Boolean(errors.password)}
                                            helperText={touched.password && errors.password}
                                            fullWidth
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <Lock sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    </FormControl>
                                </Box>

                                <FormControl>
                                    <StyledFormLabel>Plano</StyledFormLabel>
                                    {loading ? (
                                        <Box sx={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: 1, 
                                            p: 2,
                                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                            borderRadius: '12px',
                                            border: '1px solid rgba(255, 255, 255, 0.2)'
                                        }}>
                                            <CircularProgress size={20} sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                                            <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                                Carregando planos...
                                            </Typography>
                                        </Box>
                                    ) : (
                                        <Field
                                            as={StyledSelect}
                                            name="planId"
                                            error={touched.planId && Boolean(errors.planId)}
                                            fullWidth
                                            MenuProps={{
                                                PaperProps: {
                                                    sx: {
                                                        bgcolor: 'rgba(25, 25, 25, 0.95)',
                                                        backdropFilter: 'blur(10px)',
                                                        borderRadius: '12px',
                                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                                        maxHeight: '400px',
                                                    }
                                                }
                                            }}
                                        >
                                            {plans.length === 0 ? (
                                                <StyledMenuItem disabled>
                                                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                                        Nenhum plano disponível
                                                    </Typography>
                                                </StyledMenuItem>
                                            ) : (
                                                plans.map((plan) => (
                                                    <StyledMenuItem key={plan.id} value={plan.id}>
                                                        <PlanCard>
                                                            <Typography className="plan-name">
                                                                {plan.name}
                                                            </Typography>
                                                            <Typography className="plan-details">
                                                                {plan.users} atendentes • {plan.connections} WhatsApp • {plan.queues} filas
                                                            </Typography>
                                                            <Typography className="plan-price">
                                                                R$ {plan.amount}
                                                            </Typography>
                                                        </PlanCard>
                                                    </StyledMenuItem>
                                                ))
                                            )}
                                        </Field>
                                    )}
                                    {touched.planId && errors.planId && (
                                        <Typography sx={{ color: '#f44336', fontSize: '0.75rem', mt: 1 }}>
                                            {errors.planId}
                                        </Typography>
                                    )}
                                </FormControl>

                                <Button
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    disabled={isSubmitting || submitting || loading}
                                    sx={{
                                        borderRadius: '12px',
                                        padding: '12px',
                                        background: '#00C307',
                                        textTransform: 'none',
                                        fontSize: '1rem',
                                        fontWeight: 500,
                                        '&:hover': {
                                            background: '#32CD32',
                                            transition: '0.5s'
                                        },
                                        '&:disabled': {
                                            background: 'rgba(255, 255, 255, 0.3)',
                                            color: 'rgba(255, 255, 255, 0.5)'
                                        }
                                    }}
                                    endIcon={
                                        (isSubmitting || submitting) ? 
                                        <CircularProgress size={20} sx={{ color: 'white' }} /> : 
                                        <SendIcon />
                                    }
                                >
                                    {(isSubmitting || submitting) ? 'Criando conta...' : i18n.t("signup.buttons.submit")}
                                </Button>

                                <Typography sx={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.7)' }}>
                                    Já tem uma conta?{' '}
                                    <StyledLink component={RouterLink} to="/login">
                                        {i18n.t("signup.buttons.login")}
                                    </StyledLink>
                                </Typography>
                            </Form>
                        )}
                    </Formik>
                </Card>
                
                {/* Modal de Progresso */}
                <ProgressModal
                    open={showProgress}
                    progress={progress}
                    currentStep={currentStep}
                    message={progressMessage}
                />
            </SignUpContainer>
        </>
    );
};

export default SignUp;
