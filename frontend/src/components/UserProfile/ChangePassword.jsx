import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { Lock, Eye, EyeOff, Shield, CheckCircle } from 'lucide-react';
import { CardContent } from '../ui/Card';
import { PasswordInput } from '../ui/PasswordInput';
import FormButtons from '../ui/FormButtons';
import { toast } from '../ui/ToastProvider';
import api from '../../services/api';

const ChangePassword = ({ user, onCancel }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [isChanging, setIsChanging] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const togglePasswordVisibility = (field) => {
    setPasswordVisible(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Validação de senha
  const passwordRequirements = [
    {
      text: 'Mínimo de 8 caracteres',
      valid: formData.newPassword.length >= 8
    },
    {
      text: 'Pelo menos uma letra minúscula',
      valid: /[a-z]/.test(formData.newPassword)
    },
    {
      text: 'Pelo menos uma letra maiúscula',
      valid: /[A-Z]/.test(formData.newPassword)
    },
    {
      text: 'Pelo menos um número',
      valid: /\d/.test(formData.newPassword)
    },
    {
      text: 'Pelo menos um caractere especial',
      valid: /[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword)
    }
  ];

  const isValidPassword = passwordRequirements.every(req => req.valid);
  const passwordsMatch = formData.newPassword === formData.confirmPassword && formData.confirmPassword.length > 0;

  const handleChangePassword = async () => {
    if (!formData.currentPassword) {
      toast.error('Digite sua senha atual');
      return;
    }

    if (!isValidPassword) {
      toast.error('A nova senha não atende aos requisitos');
      return;
    }

    if (!passwordsMatch) {
      toast.error('As senhas não coincidem');
      return;
    }

    setIsChanging(true);

    try {
      await api.put(`/users/${user.id}/password`, {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });

      toast.success('Senha alterada com sucesso!');
      
      // Limpar formulário
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      
      if (error.response?.status === 400) {
        toast.error('Senha atual incorreta');
      } else {
        toast.error('Erro ao alterar senha. Tente novamente.');
      }
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <CardContent className="rounded-t-none pt-6">
      <Box sx={{ width: '100%' }}>
        
        {/* Título */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <Shield size={24} color="var(--text-gray-medium)" />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--text-gray-medium)' }}>
              Alterar Senha
            </Typography>
            <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
              Mantenha sua conta segura com uma senha forte
            </Typography>
          </Box>
        </Box>

        {/* Form Fields */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 4 }}>
          
          {/* Current Password */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: 'var(--text-gray-medium)' }}>
                Senha Atual
              </Typography>
              <PasswordInput
                value={formData.currentPassword}
                onChange={(e) => handleInputChange('currentPassword', e.target.value)}
              />
            </Box>
            <Box></Box>
          </Box>

          {/* New Password */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: 'var(--text-gray-medium)' }}>
                Nova Senha
              </Typography>
              <PasswordInput
                value={formData.newPassword}
                onChange={(e) => handleInputChange('newPassword', e.target.value)}
              />
            </Box>

            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: 'var(--text-gray-medium)' }}>
                Confirmar Nova Senha
              </Typography>
              <PasswordInput
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              />
            </Box>
          </Box>
        </Box>

        {/* Password Requirements */}
        {formData.newPassword && (
          <Box sx={{ 
            p: 3, 
            backgroundColor: 'var(--bg-secondary)', 
            borderRadius: '8px',
            border: '1px solid var(--border-primary)',
            mb: 4 
          }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 2, color: 'var(--text-gray-medium)' }}>
              Requisitos da senha:
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {passwordRequirements.map((req, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CheckCircle 
                    size={16} 
                    color={req.valid ? '#10b981' : '#d1d5db'}
                    fill={req.valid ? '#10b981' : 'none'}
                  />
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: req.valid ? '#10b981' : '#6b7280',
                      fontSize: '13px'
                    }}
                  >
                    {req.text}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Passwords Match Indicator */}
            {formData.confirmPassword && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2, pt: 2, borderTop: '1px solid var(--border-primary)' }}>
                <CheckCircle 
                  size={16} 
                  color={passwordsMatch ? '#10b981' : '#ef4444'}
                  fill={passwordsMatch ? '#10b981' : 'none'}
                />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: passwordsMatch ? '#10b981' : '#ef4444',
                    fontSize: '13px'
                  }}
                >
                  {passwordsMatch ? 'Senhas coincidem' : 'Senhas não coincidem'}
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Action Buttons */}
        <FormButtons
          showSave={true}
          showCancel={true}
          showBack={false}
          saveText="Alterar Senha"
          cancelText="Cancelar"
          onSave={handleChangePassword}
          onCancel={() => {
            if (onCancel) {
              onCancel(); // Chama função para voltar à listagem de usuários
            } else {
              // Reset form se não houver onCancel
              setFormData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
              });
            }
          }}
          saveLoading={isChanging}
          saveDisabled={!formData.currentPassword || !isValidPassword || !passwordsMatch}
          saveIcon={<Lock size={16} />}
          justifyContent="flex-end"
          gap={2}
        />

        {/* Security Tips */}
        <Box sx={{ 
          mt: 4, 
          p: 3, 
          backgroundColor: 'var(--bg-secondary)', 
          borderRadius: '8px',
          border: '1px solid var(--border-primary)' 
        }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: 'var(--text-primary)' }}>
            💡 Dicas de Segurança:
          </Typography>
          <Box component="ul" sx={{ margin: 0, paddingLeft: 2, color: 'var(--text-secondary)' }}>
            <Typography component="li" variant="body2" sx={{ fontSize: '13px', mb: 0.5 }}>
              Use uma senha única que você não usa em outros sites
            </Typography>
            <Typography component="li" variant="body2" sx={{ fontSize: '13px', mb: 0.5 }}>
              Considere usar um gerenciador de senhas
            </Typography>
            <Typography component="li" variant="body2" sx={{ fontSize: '13px', mb: 0.5 }}>
              Altere sua senha regularmente
            </Typography>
            <Typography component="li" variant="body2" sx={{ fontSize: '13px' }}>
              Nunca compartilhe sua senha com outras pessoas
            </Typography>
          </Box>
        </Box>
      </Box>
    </CardContent>
  );
};

export default ChangePassword;