import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { Save, User } from 'lucide-react';
import { CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { DatePicker } from '../ui/DatePicker';
import ModernButton from '../ui/ModernButton';
import { toast } from '../ui/ToastProvider';
import api from '../../services/api';

const PersonalDetails = ({ user, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    telefone: user?.telefone || '',
    cargo: user?.cargo || '',
    departamento: user?.departamento || '',
    dataAdmissao: user?.dataAdmissao || null,
    sobre: user?.sobre || '',
    // Endereço
    cep: user?.cep || '',
    endereco: user?.endereco || '',
    numero: user?.numero || '',
    complemento: user?.complemento || '',
    bairro: user?.bairro || '',
    cidade: user?.cidade || '',
    estado: user?.estado || '',
    // Configurações
    startWork: user?.startWork || '08:00',
    endWork: user?.endWork || '18:00',
    defaultTheme: user?.defaultTheme || 'light',
    defaultMenu: user?.defaultMenu || 'open',
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const response = await api.put(`/users/${user.id}`, formData);
      
      if (onUpdate) {
        onUpdate({ ...user, ...formData });
      }
      
      toast.success('Dados atualizados com sucesso!');
      
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar os dados. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <CardContent className="rounded-t-none pt-6">
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 4 }}>
        
        {/* Dados Básicos */}
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1e293b' }}>
            Dados Básicos
          </Typography>
          
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
            gap: 3, 
            mb: 3 
          }}>
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#374151' }}>
                Nome Completo
              </Typography>
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Digite seu nome completo"
              />
            </Box>
            
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#374151' }}>
                Email
              </Typography>
              <Input
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                type="email"
                placeholder="seu.email@exemplo.com"
              />
            </Box>
            
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#374151' }}>
                Telefone
              </Typography>
              <Input
                value={formData.telefone}
                onChange={(e) => handleInputChange('telefone', e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </Box>
            
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#374151' }}>
                Data de Admissão
              </Typography>
              <DatePicker
                value={formData.dataAdmissao}
                onChange={(date) => handleInputChange('dataAdmissao', date)}
                placeholder="Selecione a data"
              />
            </Box>
          </Box>
        </Box>

        {/* Dados Profissionais */}
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1e293b' }}>
            Dados Profissionais
          </Typography>
          
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
            gap: 3, 
            mb: 3 
          }}>
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#374151' }}>
                Cargo
              </Typography>
              <Input
                value={formData.cargo}
                onChange={(e) => handleInputChange('cargo', e.target.value)}
                placeholder="Ex: Desenvolvedor, Gerente, etc."
              />
            </Box>
            
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#374151' }}>
                Departamento
              </Typography>
              <Input
                value={formData.departamento}
                onChange={(e) => handleInputChange('departamento', e.target.value)}
                placeholder="Ex: TI, Vendas, Marketing, etc."
              />
            </Box>
            
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#374151' }}>
                Horário de Início
              </Typography>
              <Input
                type="time"
                value={formData.startWork}
                onChange={(e) => handleInputChange('startWork', e.target.value)}
              />
            </Box>
            
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#374151' }}>
                Horário de Fim
              </Typography>
              <Input
                type="time"
                value={formData.endWork}
                onChange={(e) => handleInputChange('endWork', e.target.value)}
              />
            </Box>
          </Box>
        </Box>

        {/* Endereço */}
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1e293b' }}>
            Endereço
          </Typography>
          
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: '1fr 2fr 1fr', md: '1fr 2fr 1fr' }, 
            gap: 3, 
            mb: 3 
          }}>
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#374151' }}>
                CEP
              </Typography>
              <Input
                value={formData.cep}
                onChange={(e) => handleInputChange('cep', e.target.value)}
                placeholder="00000-000"
              />
            </Box>
            
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#374151' }}>
                Endereço
              </Typography>
              <Input
                value={formData.endereco}
                onChange={(e) => handleInputChange('endereco', e.target.value)}
                placeholder="Rua, Avenida, etc."
              />
            </Box>
            
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#374151' }}>
                Número
              </Typography>
              <Input
                value={formData.numero}
                onChange={(e) => handleInputChange('numero', e.target.value)}
                placeholder="123"
              />
            </Box>
            
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#374151' }}>
                Complemento
              </Typography>
              <Input
                value={formData.complemento}
                onChange={(e) => handleInputChange('complemento', e.target.value)}
                placeholder="Apto, Sala, etc. (opcional)"
              />
            </Box>
            
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#374151' }}>
                Bairro
              </Typography>
              <Input
                value={formData.bairro}
                onChange={(e) => handleInputChange('bairro', e.target.value)}
                placeholder="Nome do bairro"
              />
            </Box>
            
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#374151' }}>
                Cidade
              </Typography>
              <Input
                value={formData.cidade}
                onChange={(e) => handleInputChange('cidade', e.target.value)}
                placeholder="Nome da cidade"
              />
            </Box>
            
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#374151' }}>
                Estado
              </Typography>
              <Select
                value={formData.estado}
                onChange={(e) => handleInputChange('estado', e.target.value)}
              >
                <option value="">Selecione</option>
                <option value="AC">Acre</option>
                <option value="AL">Alagoas</option>
                <option value="AP">Amapá</option>
                <option value="AM">Amazonas</option>
                <option value="BA">Bahia</option>
                <option value="CE">Ceará</option>
                <option value="DF">Distrito Federal</option>
                <option value="ES">Espírito Santo</option>
                <option value="GO">Goiás</option>
                <option value="MA">Maranhão</option>
                <option value="MT">Mato Grosso</option>
                <option value="MS">Mato Grosso do Sul</option>
                <option value="MG">Minas Gerais</option>
                <option value="PA">Pará</option>
                <option value="PB">Paraíba</option>
                <option value="PR">Paraná</option>
                <option value="PE">Pernambuco</option>
                <option value="PI">Piauí</option>
                <option value="RJ">Rio de Janeiro</option>
                <option value="RN">Rio Grande do Norte</option>
                <option value="RS">Rio Grande do Sul</option>
                <option value="RO">Rondônia</option>
                <option value="RR">Roraima</option>
                <option value="SC">Santa Catarina</option>
                <option value="SP">São Paulo</option>
                <option value="SE">Sergipe</option>
                <option value="TO">Tocantins</option>
              </Select>
            </Box>
          </Box>
        </Box>

        {/* Configurações */}
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1e293b' }}>
            Configurações
          </Typography>
          
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
            gap: 3, 
            mb: 3 
          }}>
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#374151' }}>
                Tema Padrão
              </Typography>
              <Select
                value={formData.defaultTheme}
                onChange={(e) => handleInputChange('defaultTheme', e.target.value)}
              >
                <option value="light">Claro</option>
                <option value="dark">Escuro</option>
              </Select>
            </Box>
            
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#374151' }}>
                Menu Padrão
              </Typography>
              <Select
                value={formData.defaultMenu}
                onChange={(e) => handleInputChange('defaultMenu', e.target.value)}
              >
                <option value="open">Aberto</option>
                <option value="closed">Fechado</option>
              </Select>
            </Box>
          </Box>
        </Box>

        {/* Sobre */}
        <Box>
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#374151' }}>
            Sobre você
          </Typography>
          <Textarea
            value={formData.sobre}
            onChange={(e) => handleInputChange('sobre', e.target.value)}
            placeholder="Conte um pouco sobre você, sua experiência e objetivos..."
            rows={4}
          />
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 2 }}>
          <ModernButton
            variant="secondary"
            onClick={() => {
              // Reset form
              setFormData({
                name: user?.name || '',
                email: user?.email || '',
                telefone: user?.telefone || '',
                cargo: user?.cargo || '',
                departamento: user?.departamento || '',
                dataAdmissao: user?.dataAdmissao || null,
                sobre: user?.sobre || '',
                cep: user?.cep || '',
                endereco: user?.endereco || '',
                numero: user?.numero || '',
                complemento: user?.complemento || '',
                bairro: user?.bairro || '',
                cidade: user?.cidade || '',
                estado: user?.estado || '',
                startWork: user?.startWork || '08:00',
                endWork: user?.endWork || '18:00',
                defaultTheme: user?.defaultTheme || 'light',
                defaultMenu: user?.defaultMenu || 'open',
              });
            }}
          >
            Cancelar
          </ModernButton>
          
          <ModernButton
            variant="primary"
            onClick={handleSave}
            disabled={isSaving}
            icon={isSaving ? null : <Save size={16} />}
          >
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </ModernButton>
        </Box>
      </Box>
    </CardContent>
  );
};

export default PersonalDetails;