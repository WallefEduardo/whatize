import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { Plus, X, Code } from 'lucide-react';
import { CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import ModernButton from '../ui/ModernButton';

const Skills = ({ user, onUpdate }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newSkill, setNewSkill] = useState('');

  // Skills padrão ou do usuário
  const [skills, setSkills] = useState(user?.skills || [
    'JavaScript', 'React', 'Node.js', 'TypeScript', 'Python', 'SQL', 
    'HTML/CSS', 'Git', 'REST APIs', 'PostgreSQL'
  ]);

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      const updatedSkills = [...skills, newSkill.trim()];
      setSkills(updatedSkills);
      setNewSkill('');
      setIsAdding(false);
      
      // Atualizar usuário
      if (onUpdate) {
        onUpdate({ ...user, skills: updatedSkills });
      }
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    const updatedSkills = skills.filter(skill => skill !== skillToRemove);
    setSkills(updatedSkills);
    
    // Atualizar usuário
    if (onUpdate) {
      onUpdate({ ...user, skills: updatedSkills });
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
          color: 'var(--text-primary)' 
        }}>
          <Code size={18} />
          Skills
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
              Nenhuma skill adicionada
            </Typography>
          ) : (
            skills.map((skill, index) => (
              <Badge
                key={index}
                variant="muted"
                removable
                onRemove={() => handleRemoveSkill(skill)}
                sx={{
                  cursor: 'default',
                  transition: 'all 0.2s ease'
                }}
              >
                {skill}
              </Badge>
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
              placeholder="Digite uma skill (ex: React)"
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
          <ModernButton
            variant="secondary"
            size="sm"
            onClick={() => setIsAdding(true)}
            sx={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              color: 'var(--color-accent)',
              borderColor: 'var(--border-primary)',
              '&:hover': {
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--color-accent)'
              }
            }}
          >
            <Plus size={16} />
            Adicionar Skill
          </ModernButton>
        )}

        {/* Skills Suggestions */}
        {isAdding && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" sx={{ 
              color: 'var(--text-secondary)', 
              fontSize: '11px',
              fontWeight: 500,
              mb: 1.5,
              display: 'block'
            }}>
              Sugestões populares:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {[
                'JavaScript', 'Python', 'Java', 'React', 'Vue.js', 'Angular',
                'Node.js', 'PHP', 'C#', 'Go', 'Rust', 'TypeScript',
                'HTML/CSS', 'SQL', 'MongoDB', 'PostgreSQL', 'Redis',
                'Docker', 'Kubernetes', 'AWS', 'Azure', 'Git'
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
                      color: 'var(--color-accent)',
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
            : 'Clique nas skills para removê-las'
          }
        </Typography>
      </CardContent>
    </>
  );
};

export default Skills;