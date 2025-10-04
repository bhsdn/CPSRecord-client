/**
 * 表单管理 Composable
 */

import { ref } from "vue";
import type { FormInstance } from "element-plus";

export interface UseFormReturn<T> {
  formRef: Ref<FormInstance | undefined>;
  formData: Ref<T>;
  validate: () => Promise<boolean>;
  resetFields: () => void;
  clearValidate: () => void;
  setFormData: (data: Partial<T>) => void;
}

/**
 * 表单管理
 */
export function useForm<T extends Record<string, any>>(
  initialData: T
): UseFormReturn<T> {
  const formRef = ref<FormInstance>();
  const formData = ref<T>({ ...initialData } as T);

  /**
   * 验证表单
   */
  const validate = async (): Promise<boolean> => {
    if (!formRef.value) return false;

    try {
      await formRef.value.validate();
      return true;
    } catch (error) {
      return false;
    }
  };

  /**
   * 重置表单
   */
  const resetFields = () => {
    formRef.value?.resetFields();
    formData.value = { ...initialData } as T;
  };

  /**
   * 清除验证
   */
  const clearValidate = () => {
    formRef.value?.clearValidate();
  };

  /**
   * 设置表单数据
   */
  const setFormData = (data: Partial<T>) => {
    formData.value = { ...formData.value, ...data };
  };

  return {
    formRef,
    formData,
    validate,
    resetFields,
    clearValidate,
    setFormData,
  };
}

