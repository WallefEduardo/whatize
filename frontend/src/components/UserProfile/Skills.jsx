import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { Plus, X, Headphones } from 'lucide-react';
import { CardContent, CardHeader, CardTitle } from '../ui/Card';
import StatusBadge from '../StatusBadge';
import { Input } from '../ui/Input';
import ModernButton from '../ui/ModernButton';
import api from '../../services/api';
import { toast } from '../ui/ToastProvider';

const Skills = ({ user, onUpdate }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newSkill, setNewSkill] = useState('');

  // Sistema de cores para StatusBadge
  const SKILL_COLORS = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
    '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16',
    '#f97316', '#6366f1', '#14b8a6', '#dc2626'
  ];

  // Habilidades do usuário (sem dados padrão)
  const [skills, setSkills] = useState(user?.skills || []);

  // Atualizar skills quando user prop mudar
  useEffect(() => {
    setSkills(user?.skills || []);
  }, [user]);

  const saveSkills = async (updatedSkills) => {
    try {
      await api.put(`/users/${user.id}`, { skills: updatedSkills });
      toast.success('Habilidades atualizadas com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao salvar habilidades:', error);
      toast.error('Erro ao salvar habilidades');
      return false;
    }
  };

  const handleAddSkill = async () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      const updatedSkills = [...skills, newSkill.trim()];
      
      // Optimistic update
      setSkills(updatedSkills);
      setNewSkill('');
      setIsAdding(false);
      
      // Atualizar usuário local
      if (onUpdate) {
        onUpdate({ ...user, skills: updatedSkills });
      }
      
      // Salvar no backend
      const saved = await saveSkills(updatedSkills);
      if (!saved) {
        // Rollback on error
        setSkills(skills);
        if (onUpdate) {
          onUpdate({ ...user, skills });
        }
      }
    }
  };

  const handleRemoveSkill = async (skillToRemove) => {
    const previousSkills = [...skills];
    const updatedSkills = skills.filter(skill => skill !== skillToRemove);
    
    // Optimistic update
    setSkills(updatedSkills);
    
    // Atualizar usuário local
    if (onUpdate) {
      onUpdate({ ...user, skills: updatedSkills });
    }
    
    // Salvar no backend
    const saved = await saveSkills(updatedSkills);
    if (!saved) {
      // Rollback on error
      setSkills(previousSkills);
      if (onUpdate) {
        onUpdate({ ...user, skills: previousSkills });
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddSkill();
    } else if (e.key === 'Escape') {
      setIsAdding(false);
      setNewSkill('');
    }
  };

  return (
    <>
      <CardHeader sx={{ borderBottom: 'none', paddingBottom: '12px' }}>
        <CardTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          fontSize: '18px', 
          fontWeight: 500, 
          color: 'var(--text-gray-medium)' 
        }}>
          <Headphones size={18} />
          Habilidades
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Skills Grid */}
        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 1.5, 
          mb: 3,
          minHeight: skills.length === 0 ? '60px' : 'auto',
          alignItems: skills.length === 0 ? 'center' : 'flex-start',
          justifyContent: skills.length === 0 ? 'center' : 'flex-start'
        }}>
          {skills.length === 0 ? (
            <Typography variant="body2" sx={{ 
              color: 'var(--text-secondary)', 
              fontStyle: 'italic',
              textAlign: 'center',
              width: '100%'
            }}>
              Nenhuma habilidade adicionada
            </Typography>
          ) : (
            skills.map((skill, index) => (
              <StatusBadge
                key={index}
                label={skill}
                color={SKILL_COLORS[index % SKILL_COLORS.length]}
                variant="filled"
                size="small"
                sx={{
                  cursor: 'default',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  minWidth: '80px',
                  paddingRight: '24px',
                  '&:hover::after': {
                    content: '"✕"',
                    position: 'absolute',
                    right: '6px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }
                }}
                onClick={() => handleRemoveSkill(skill)}
              />
            ))
          )}
        </Box>

        {/* Add Skill Form */}
        {isAdding ? (
          <Box sx={{ 
            display: 'flex', 
            gap: 1.5, 
            alignItems: 'center',
            p: 2,
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '8px',
            border: '1px solid var(--border-primary)'
          }}>
            <Input
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={handleKeyPress}
              autoFocus
              style={{ flex: 1 }}
            />
            <ModernButton
              variant="primary"
              size="sm"
              onClick={handleAddSkill}
              disabled={!newSkill.trim()}
            >
              Adicionar
            </ModernButton>
            <ModernButton
              variant="secondary"
              size="sm"
              onClick={() => {
                setIsAdding(false);
                setNewSkill('');
              }}
            >
              <X size={14} />
            </ModernButton>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <ModernButton
              variant="secondary"
              size="sm"
              onClick={() => setIsAdding(true)}
              sx={{
                width: 'auto',
                minWidth: '160px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                color: 'var(--color-accent)',
                borderColor: 'var(--color-accent)',
                border: '1px solid var(--color-accent)',
                '&:hover': {
                  backgroundColor: 'rgba(0, 195, 7, 0.1)',
                  color: 'var(--color-accent)',
                  borderColor: 'var(--color-accent)'
                }
              }}
            >
              <Plus size={16} />
              Adicionar Habilidade
            </ModernButton>
          </Box>
        )}

        {/* Skills Suggestions */}
        {isAdding && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" sx={{ 
              color: 'var(--text-gray-medium)', 
              fontSize: '11px',
              fontWeight: 500,
              mb: 1.5,
              display: 'block'
            }}>
              Sugestões populares:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {[
                'Atendimento ao Cliente', 'WhatsApp Business', 'Vendas', 'Suporte Técnico',
                'Negociação', 'Resolução de Conflitos', 'CRM', 'Follow-up',
                'Prospecção', 'Comunicação', 'Empatia', 'Paciência',
                'Gestão de Tempo', 'Trabalho em Equipe', 'Multitarefa', 'Fidelização'
              ]
                .filter(suggestion => !skills.includes(suggestion))
                .slice(0, 8)
                .map((suggestion) => (
                  <Typography
                    key={suggestion}
                    variant="caption"
                    sx={{
                      px: 1.5,
                      py: 0.5,
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-gray-medium)',
                      borderRadius: '12px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: 'var(--bg-primary)',
                        transform: 'translateY(-1px)'
                      }
                    }}
                    onClick={() => {
                      setNewSkill(suggestion);
                      handleAddSkill();
                    }}
                  >
                    {suggestion}
                  </Typography>
                ))}
            </Box>
          </Box>
        )}

        {/* Help Text */}
        <Typography variant="caption" sx={{ 
          color: 'var(--text-secondary)', 
          fontSize: '11px',
          mt: 2,
          display: 'block',
          textAlign: 'center'
        }}>
          {isAdding 
            ? 'Pressione Enter para adicionar ou Esc para cancelar'
            : 'Clique nas habilidades para removê-las'
          }
        </Typography>
      </CardContent>
    </>
  );
};

export default Skills;