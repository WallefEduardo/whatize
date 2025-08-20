import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Hook de migração que oferece compatibilidade entre Formik e React Hook Form
export const useFormMigration = (options = {}) => {
  // Se receber configuração no estilo Formik
  if (options.initialValues || options.validationSchema || options.onSubmit) {
    const {
      initialValues = {},
      validationSchema,
      onSubmit,
      enableReinitialize = true,
      ...restOptions
    } = options;

    // Configuração React Hook Form
    const formConfig = {
      defaultValues: initialValues,
      mode: 'onChange',
      resolver: validationSchema ? zodResolver(validationSchema) : undefined,
      ...restOptions,
    };

    const form = useForm(formConfig);
    
    // Wrapper para manter API similar ao Formik
    return {
      ...form,
      values: form.watch(),
      errors: form.formState.errors,
      isSubmitting: form.formState.isSubmitting,
      isValid: form.formState.isValid,
      dirty: form.formState.isDirty,
      touched: form.formState.touchedFields,
      
      // Método handleSubmit compatível
      handleSubmit: (onValidSubmit) => 
        form.handleSubmit((data) => onValidSubmit(data)),
      
      // Setters compatíveis
      setFieldValue: form.setValue,
      setFieldError: (field, error) => 
        form.setError(field, { type: 'manual', message: error }),
      
      // Reset compatível
      resetForm: (values) => form.reset(values || initialValues),
      
      // Validação manual
      validateForm: () => form.trigger(),
      
      // Legacy Formik methods que podem ser usados durante migração
      _isFormikCompatible: true,
    };
  }

  // Se receber configuração no estilo React Hook Form
  return useForm(options);
};

// Hook simplificado para casos básicos
export const useSimpleForm = (schema, defaultValues = {}) => {
  return useForm({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onChange',
  });
};

export default useFormMigration;