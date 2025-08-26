import React, { useState } from 'react';
import { 
  Box, 
  Stepper, 
  Step, 
  StepLabel, 
  Typography, 
  useMediaQuery,
  useTheme
} from '@mui/material';
import { Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GradientButton from '../GradientButton';
import { toast } from '../ui/ToastProvider';

/**
 * ModernFormWizard - Componente de formulário wizard baseado no template
 * 
 * @param {Object} props
 * @param {Array} props.steps - Array de etapas do wizard
 * @param {Function} props.onSubmit - Callback do submit final
 * @param {Function} props.onStepChange - Callback quando muda de etapa
 * @param {Object} props.formData - Dados do formulário
 * @param {Function} props.onChange - Callback para mudanças nos dados
 * @param {Function} props.validate - Função de validação por etapa
 * @param {boolean} props.loading - Estado de carregamento
 * @param {Object} props.sx - Estilos customizados
 * 
 * Step structure:
 * {
 *   id: string,
 *   label: string,
 *   optional?: boolean,
 *   title?: string,
 *   description?: string,
 *   content: ReactNode
 * }
 * 
 * @example
 * <ModernFormWizard
 *   steps={[
 *     {
 *       id: 'account',
 *       label: 'Conta',
 *       title: 'Detalhes da Conta',
 *       description: 'Preencha os dados da sua conta',
 *       content: <div>Campos da conta...</div>
 *     },
 *     {
 *       id: 'personal',
 *       label: 'Dados Pessoais',
 *       optional: true,
 *       content: <div>Campos pessoais...</div>
 *     }
 *   ]}
 *   formData={formData}
 *   onChange={setFormData}
 *   onSubmit={(data) => console.log('Submit:', data)}
 *   validate={(stepIndex, data) => ({ isValid: true, errors: {} })}
 * />
 */
const ModernFormWizard = ({
  steps = [],
  onSubmit = () => {},
  onStepChange = () => {},
  formData = {},
  onChange = () => {},
  validate = () => ({ isValid: true, errors: {} }),
  loading = false,
  sx = {}
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [stepErrors, setStepErrors] = useState({});
  
  const theme = useTheme();
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  const handleNext = () => {
    // Validar etapa atual
    const validation = validate(activeStep, formData);
    
    if (!validation.isValid) {
      setStepErrors({ ...stepErrors, [activeStep]: validation.errors });
      return;
    }

    // Limpar erros da etapa atual
    const newErrors = { ...stepErrors };
    delete newErrors[activeStep];
    setStepErrors(newErrors);

    // Marcar etapa como concluída
    setCompletedSteps(prev => new Set([...prev, activeStep]));
    
    // Ir para próxima etapa
    const nextStep = activeStep + 1;
    setActiveStep(nextStep);
    onStepChange(nextStep);
  };

  const handleBack = () => {
    const prevStep = activeStep - 1;
    setActiveStep(prevStep);
    onStepChange(prevStep);
  };

  const handleReset = () => {
    setActiveStep(0);
    setCompletedSteps(new Set());
    setStepErrors({});
    onStepChange(0);
  };

  const handleSubmit = async () => {
    // Validar etapa final
    const validation = validate(activeStep, formData);
    
    if (!validation.isValid) {
      setStepErrors({ ...stepErrors, [activeStep]: validation.errors });
      return;
    }

    try {
      await onSubmit(formData);
      
      // Marcar como concluída e ir para tela final
      setCompletedSteps(prev => new Set([...prev, activeStep]));
      setActiveStep(steps.length);
      
      toast.success('Formulário enviado com sucesso!');
    } catch (error) {
      toast.error('Erro ao enviar formulário: ' + error.message);
    }
  };

  const isStepOptional = (stepIndex) => {
    return steps[stepIndex]?.optional || false;
  };

  const isStepCompleted = (stepIndex) => {
    return completedSteps.has(stepIndex);
  };

  const isStepError = (stepIndex) => {
    return !!stepErrors[stepIndex];
  };

  // Custom StepIcon
  const StepIcon = ({ active, completed, error, icon }) => {
    if (completed) {
      return (
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            backgroundColor: 'var(--color-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}
        >
          <Check size={18} />
        </Box>
      );
    }

    if (error) {
      return (
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            backgroundColor: '#DC2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '0.875rem',
            fontWeight: 600
          }}
        >
          {icon}
        </Box>
      );
    }

    return (
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          backgroundColor: active ? 'var(--color-accent)' : 'var(--bg-secondary)',
          border: active ? '2px solid var(--color-accent)' : '2px solid var(--border-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: active ? 'white' : 'var(--text-secondary)',
          fontSize: '0.875rem',
          fontWeight: 600,
          transition: 'all 0.3s ease'
        }}
      >
        {icon}
      </Box>
    );
  };

  const currentStep = steps[activeStep];

  return (
    <Box sx={{ mt: 4, ...sx }}>
      {/* Stepper */}
      <Stepper 
        activeStep={activeStep} 
        orientation={isTablet ? "vertical" : "horizontal"}
        sx={{
          '& .MuiStepLabel-root': {
            color: 'var(--text-secondary)'
          },
          '& .MuiStepLabel-label': {
            fontSize: '0.875rem',
            fontWeight: 500,
            '&.Mui-active': {
              color: 'var(--color-accent)',
              fontWeight: 600
            },
            '&.Mui-completed': {
              color: 'var(--text-primary)',
              fontWeight: 500
            }
          },
          '& .MuiStepConnector-line': {
            borderColor: 'var(--border-primary)',
            borderWidth: '1px'
          },
          '& .MuiStepConnector-root.Mui-completed .MuiStepConnector-line': {
            borderColor: 'var(--color-accent)'
          }
        }}
      >
        {steps.map((step, index) => (
          <Step key={step.id} completed={isStepCompleted(index)}>
            <StepLabel 
              optional={
                isStepOptional(index) && (
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: 'var(--text-disabled)', 
                      fontSize: '0.75rem' 
                    }}
                  >
                    Opcional
                  </Typography>
                )
              }
              StepIconComponent={(props) => 
                <StepIcon 
                  {...props} 
                  error={isStepError(index)}
                  icon={index + 1} 
                />
              }
            >
              {step.label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box sx={{ mt: 4 }}>
        {activeStep === steps.length ? (
          /* Tela de conclusão */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600, 
                  mb: 2,
                  color: 'var(--text-primary)'
                }}
              >
                Todas as etapas concluídas!
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'var(--text-secondary)', 
                  mb: 4 
                }}
              >
                Seu formulário foi enviado com sucesso.
              </Typography>
              
              <GradientButton
                onClick={handleReset}
                variant="outlined"
                sx={{
                  color: '#DC2626 !important',
                  borderColor: '#DC2626 !important',
                  backgroundColor: 'transparent !important',
                  '&:hover': {
                    borderColor: '#B91C1C !important',
                    backgroundColor: 'rgba(220, 38, 38, 0.04) !important',
                  }
                }}
              >
                Reiniciar
              </GradientButton>
            </Box>
          </motion.div>
        ) : (
          /* Conteúdo das etapas */
          <Box>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Header da etapa */}
                {(currentStep?.title || currentStep?.description) && (
                  <Box sx={{ mb: 4, mt: 3 }}>
                    {currentStep.title && (
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          fontSize: '1.125rem',
                          color: 'var(--text-primary)',
                          mb: 1
                        }}
                      >
                        {currentStep.title}
                      </Typography>
                    )}
                    {currentStep.description && (
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'var(--text-secondary)',
                          fontSize: '0.875rem'
                        }}
                      >
                        {currentStep.description}
                      </Typography>
                    )}
                  </Box>
                )}

                {/* Conteúdo da etapa */}
                <Box sx={{ mb: 4 }}>
                  {React.cloneElement(currentStep?.content || <div />, {
                    formData,
                    onChange,
                    errors: stepErrors[activeStep] || {}
                  })}
                </Box>
              </motion.div>
            </AnimatePresence>

            {/* Botões de navegação */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              pt: 2,
              borderTop: '1px solid var(--border-primary)'
            }}>
              <GradientButton
                onClick={handleBack}
                disabled={activeStep === 0}
                variant="outlined"
                sx={{
                  visibility: activeStep === 0 ? 'hidden' : 'visible',
                  color: 'var(--text-secondary) !important',
                  borderColor: 'var(--border-primary) !important',
                  backgroundColor: 'transparent !important',
                  '&:hover': {
                    borderColor: 'var(--color-accent) !important',
                    backgroundColor: 'rgba(0, 195, 7, 0.04) !important',
                  }
                }}
              >
                Voltar
              </GradientButton>

              <Box sx={{ display: 'flex', gap: 2 }}>
                {activeStep === steps.length - 1 ? (
                  <GradientButton
                    onClick={handleSubmit}
                    loading={loading}
                    sx={{ minWidth: 120 }}
                  >
                    Finalizar
                  </GradientButton>
                ) : (
                  <GradientButton
                    onClick={handleNext}
                    sx={{ minWidth: 100 }}
                  >
                    Próximo
                  </GradientButton>
                )}
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ModernFormWizard;