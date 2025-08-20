import { z } from 'zod';

// Schemas de validação Zod para migração de Yup → Zod
// Padrões comuns reutilizáveis

export const commonValidations = {
  // Validações de string
  requiredString: (message = 'Este campo é obrigatório') => 
    z.string().min(1, message),
  
  email: (message = 'Email inválido') => 
    z.string().email(message),
  
  phone: (message = 'Telefone inválido') => 
    z.string().min(10, message).max(15, 'Telefone muito longo'),
  
  password: (message = 'Senha deve ter pelo menos 6 caracteres') => 
    z.string().min(6, message),
  
  // Validações de número
  positiveNumber: (message = 'Deve ser um número positivo') => 
    z.number().positive(message),
  
  requiredNumber: (message = 'Este campo é obrigatório') => 
    z.number({ required_error: message }),
};

// Schema para User (migração de UserModal)
export const userSchema = z.object({
  name: commonValidations.requiredString('Nome é obrigatório'),
  email: commonValidations.email(),
  password: z.string().min(5, 'Senha deve ter pelo menos 5 caracteres'),
  profile: commonValidations.requiredString('Perfil é obrigatório'),
  whatsappId: z.number().optional(),
  queueIds: z.array(z.number()).optional(),
});

// Schema para Company (migração de CompaniesManager)
export const companySchema = z.object({
  name: commonValidations.requiredString('Nome da empresa é obrigatório'),
  email: commonValidations.email().optional(),
  phone: commonValidations.phone().optional(),
  planId: z.number().optional(),
  campaignsEnabled: z.boolean().default(true),
  dueDate: z.string().optional(),
  recurrence: z.string().optional(),
});

// Schema para Tag (migração de TagModal)
export const tagSchema = z.object({
  name: commonValidations.requiredString('Nome da tag é obrigatório'),
  color: commonValidations.requiredString('Cor é obrigatória'),
  companyId: z.number().optional(),
});

// Schema para Signup (migração de Signup)
export const signupSchema = z.object({
  name: commonValidations.requiredString('Nome é obrigatório'),
  email: commonValidations.email(),
  password: commonValidations.password(),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword'],
});

// Schema para Login
export const loginSchema = z.object({
  email: commonValidations.email(),
  password: commonValidations.requiredString('Senha é obrigatória'),
});

// Schema para Contact
export const contactSchema = z.object({
  name: commonValidations.requiredString('Nome é obrigatório'),
  number: commonValidations.phone(),
  email: commonValidations.email().optional(),
  extraInfo: z.array(z.object({
    name: z.string(),
    value: z.string(),
  })).optional(),
});

// Schema para Queue
export const queueSchema = z.object({
  name: commonValidations.requiredString('Nome da fila é obrigatório'),
  color: commonValidations.requiredString('Cor é obrigatória'),
  greetingMessage: z.string().optional(),
});

// Schema para Quick Message
export const quickMessageSchema = z.object({
  shortcode: commonValidations.requiredString('Atalho é obrigatório'),
  message: commonValidations.requiredString('Mensagem é obrigatória'),
});

// Schema para Settings
export const settingsSchema = z.object({
  key: commonValidations.requiredString('Chave é obrigatória'),
  value: z.string().optional(),
});

// Helper para converter erro Yup para formato compatível
export const convertYupToZodError = (yupError) => {
  if (!yupError?.inner) return {};
  
  return yupError.inner.reduce((acc, err) => {
    acc[err.path] = { message: err.message };
    return acc;
  }, {});
};

export default {
  userSchema,
  companySchema,
  tagSchema,
  signupSchema,
  loginSchema,
  contactSchema,
  queueSchema,
  quickMessageSchema,
  settingsSchema,
  commonValidations,
};