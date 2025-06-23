import { useState, useCallback } from 'react';

type ValidationRule<T> = {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: T) => string | null;
};

type ValidationSchema<T> = {
  [K in keyof T]?: ValidationRule<T[K]>;
};

type FormErrors<T> = {
  [K in keyof T]?: string;
};

interface UseFormOptions<T> {
  initialValues: T;
  validationSchema?: ValidationSchema<T>;
  onSubmit?: (values: T) => Promise<void> | void;
}

interface UseFormReturn<T> {
  values: T;
  errors: FormErrors<T>;
  isSubmitting: boolean;
  isDirty: boolean;
  isValid: boolean;
  handleChange: (name: keyof T, value: any) => void;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  setFieldValue: (name: keyof T, value: any) => void;
  setFieldError: (name: keyof T, error: string) => void;
  resetForm: (newValues?: Partial<T>) => void;
  validate: () => boolean;
  clearErrors: () => void;
  getFieldProps: (name: keyof T) => {
    name: string;
    value: any;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    error?: string;
  };
}

export const useForm = <T extends Record<string, any>>({
  initialValues,
  validationSchema = {},
  onSubmit
}: UseFormOptions<T>): UseFormReturn<T> => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors<T>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const validateField = useCallback((name: keyof T, value: any): string | null => {
    const rule = validationSchema[name];
    if (!rule) return null;

    if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return 'This field is required';
    }

    if (typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        return `Minimum length is ${rule.minLength} characters`;
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        return `Maximum length is ${rule.maxLength} characters`;
      }
      if (rule.pattern && !rule.pattern.test(value)) {
        return 'Invalid format';
      }
    }

    if (typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        return `Minimum value is ${rule.min}`;
      }
      if (rule.max !== undefined && value > rule.max) {
        return `Maximum value is ${rule.max}`;
      }
    }

    if (rule.custom) {
      return rule.custom(value);
    }

    return null;
  }, [validationSchema]);

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors<T> = {};
    let isValid = true;

    Object.keys(validationSchema).forEach((key) => {
      const fieldName = key as keyof T;
      const error = validateField(fieldName, values[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [values, validateField, validationSchema]);

  const handleChange = useCallback((name: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
    setIsDirty(true);
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  }, [errors]);

  const setFieldValue = useCallback((name: keyof T, value: any) => {
    handleChange(name, value);
  }, [handleChange]);

  const setFieldError = useCallback((name: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  }, []);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!validate()) {
      return;
    }

    if (onSubmit) {
      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } catch (error) {
        console.error('Form submission error:', error);
        // You might want to set a general form error here
        setFieldError('general' as keyof T, 'An error occurred while submitting the form');
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [values, validate, onSubmit, setFieldError]);

  const resetForm = useCallback((newValues?: Partial<T>) => {
    setValues(newValues ? { ...initialValues, ...newValues } : initialValues);
    setErrors({});
    setIsSubmitting(false);
    setIsDirty(false);
  }, [initialValues]);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const getFieldProps = useCallback((name: keyof T) => {
    return {
      name: String(name),
      value: values[name] || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const target = e.target;
        let value: any = target.value;

        // Handle different input types
        if (target.type === 'checkbox') {
          value = (target as HTMLInputElement).checked;
        } else if (target.type === 'number') {
          value = target.value === '' ? '' : Number(target.value);
        } else if (target.type === 'file') {
          value = (target as HTMLInputElement).files?.[0] || null;
        }

        handleChange(name, value);
      },
      error: errors[name]
    };
  }, [values, errors, handleChange]);

  // Check if form is valid (no errors and all required fields are filled)
  const isValid = Object.keys(errors).length === 0 && Object.keys(validationSchema).every(key => {
    const rule = validationSchema[key as keyof T];
    if (rule?.required) {
      const value = values[key as keyof T];
      return value !== undefined && value !== null && value !== '';
    }
    return true;
  });

  return {
    values,
    errors,
    isSubmitting,
    isDirty,
    isValid,
    handleChange,
    handleSubmit,
    setFieldValue,
    setFieldError,
    resetForm,
    validate,
    clearErrors,
    getFieldProps
  };
}; 