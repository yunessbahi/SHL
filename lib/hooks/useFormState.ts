"use client";

import { useState, useCallback } from "react";

export interface FormFieldState<T = any> {
  value: T;
  error: string | null;
  touched: boolean;
  isValid: boolean;
}

export interface FormState<T extends Record<string, any>> {
  fields: Record<keyof T, FormFieldState>;
  isValid: boolean;
  isDirty: boolean;
  errors: string[];
}

export interface FormActions<T extends Record<string, any>> {
  setField: (name: keyof T, value: any) => void;
  setFieldError: (name: keyof T, error: string | null) => void;
  setFieldTouched: (name: keyof T, touched: boolean) => void;
  reset: (initialValues?: Partial<T>) => void;
  validateField: (
    name: keyof T,
    validator?: (value: any) => string | null,
  ) => boolean;
  validateForm: (
    validators: Record<keyof T, (value: any) => string | null>,
  ) => boolean;
  submit: (onSubmit: () => Promise<void> | void) => Promise<void>;
  clearErrors: () => void;
}

/**
 * Generic form state management hook
 * Provides clean, predictable form state with validation
 */
export function useFormState<T extends Record<string, any>>(
  initialValues: T,
  validators?: Partial<Record<keyof T, (value: any) => string | null>>,
): [FormState<T>, FormActions<T>] {
  const [fields, setFields] = useState<Record<keyof T, FormFieldState>>(() => {
    const initialFields: Record<keyof T, FormFieldState> = {} as Record<
      keyof T,
      FormFieldState
    >;

    Object.entries(initialValues).forEach(([key, value]) => {
      initialFields[key as keyof T] = {
        value,
        error: null,
        touched: false,
        isValid: true,
      };
    });

    return initialFields;
  });

  const validateField = useCallback(
    (name: keyof T, validator?: (value: any) => string | null): boolean => {
      const field = fields[name];
      if (!field) return true;

      const fieldValidator = validator || validators?.[name];
      const error = fieldValidator ? fieldValidator(field.value) : null;

      setFields((prev) => ({
        ...prev,
        [name]: {
          ...prev[name],
          error,
          isValid: !error,
        },
      }));

      return !error;
    },
    [fields, validators],
  );

  const validateForm = useCallback(
    (
      formValidators: Record<keyof T, (value: any) => string | null>,
    ): boolean => {
      let isFormValid = true;

      Object.keys(formValidators).forEach((name) => {
        const fieldName = name as keyof T;
        const isValid = validateField(fieldName, formValidators[fieldName]);
        if (!isValid) isFormValid = false;
      });

      return isFormValid;
    },
    [validateField],
  );

  const setField = useCallback((name: keyof T, value: any) => {
    setFields((prev) => ({
      ...prev,
      [name]: {
        ...prev[name],
        value,
        touched: true,
      },
    }));
  }, []);

  const setFieldError = useCallback((name: keyof T, error: string | null) => {
    setFields((prev) => ({
      ...prev,
      [name]: {
        ...prev[name],
        error,
        isValid: !error,
      },
    }));
  }, []);

  const setFieldTouched = useCallback((name: keyof T, touched: boolean) => {
    setFields((prev) => ({
      ...prev,
      [name]: {
        ...prev[name],
        touched,
      },
    }));
  }, []);

  const reset = useCallback(
    (newInitialValues?: Partial<T>) => {
      const resetValues = newInitialValues || initialValues;

      setFields(() => {
        const resetFields: Record<keyof T, FormFieldState> = {} as Record<
          keyof T,
          FormFieldState
        >;

        Object.entries(resetValues).forEach(([key, value]) => {
          resetFields[key as keyof T] = {
            value,
            error: null,
            touched: false,
            isValid: true,
          };
        });

        return resetFields;
      });
    },
    [initialValues],
  );

  const clearErrors = useCallback(() => {
    setFields((prev) => {
      const cleared: Record<keyof T, FormFieldState> = {} as Record<
        keyof T,
        FormFieldState
      >;

      Object.entries(prev).forEach(([key, field]) => {
        cleared[key as keyof T] = {
          ...field,
          error: null,
          isValid: true,
        };
      });

      return cleared;
    });
  }, []);

  const submit = useCallback(
    async (onSubmit: () => Promise<void> | void) => {
      // Mark all fields as touched
      setFields((prev) => {
        const touched: Record<keyof T, FormFieldState> = {} as Record<
          keyof T,
          FormFieldState
        >;

        Object.entries(prev).forEach(([key, field]) => {
          touched[key as keyof T] = {
            ...field,
            touched: true,
          };
        });

        return touched;
      });

      // Validate all fields if validators provided
      if (validators) {
        Object.keys(validators).forEach((name) => {
          const fieldName = name as keyof T;
          validateField(fieldName, validators[fieldName]);
        });
      }

      // Check if form is valid
      const isFormValid = Object.values(fields).every((field) => field.isValid);
      if (!isFormValid) return;

      // Submit form
      try {
        await onSubmit();
      } catch (error) {
        console.error("Form submission error:", error);
        throw error;
      }
    },
    [fields, validators, validateField],
  );

  // Calculate form state
  const formState: FormState<T> = {
    fields,
    isValid: Object.values(fields).every((field) => field.isValid),
    isDirty: Object.values(fields).some((field) => field.touched),
    errors: Object.values(fields)
      .filter((field) => field.error)
      .map((field) => field.error!) as string[],
  };

  const actions: FormActions<T> = {
    setField,
    setFieldError,
    setFieldTouched,
    reset,
    validateField,
    validateForm,
    submit,
    clearErrors,
  };

  return [formState, actions];
}

/**
 * Hook for managing modal and loading states
 */
export function useModalState(initialOpen = false) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [isLoading, setIsLoading] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  const withLoading = useCallback(
    async <T extends any[], R>(asyncFn: (...args: T) => Promise<R>) => {
      return async (...args: T): Promise<R> => {
        try {
          setIsLoading(true);
          return await asyncFn(...args);
        } finally {
          setIsLoading(false);
        }
      };
    },
    [],
  );

  return {
    isOpen,
    isLoading,
    open,
    close,
    toggle,
    withLoading,
  };
}

/**
 * Hook for managing async operations with proper loading and error states
 */
export function useAsyncState<T = any>() {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(
    async (
      asyncFn: () => Promise<T>,
      options?: {
        onSuccess?: (data: T) => void;
        onError?: (error: string) => void;
        resetOnExecute?: boolean;
      },
    ) => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await asyncFn();
        setData(result);

        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An unexpected error occurred";
        setError(errorMessage);
        options?.onError?.(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    data,
    error,
    isLoading,
    execute,
    reset,
  };
}
