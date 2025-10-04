/**
 * 确认对话框 Composable
 */

import { ElMessageBox } from "element-plus";
import type { ElMessageBoxOptions } from "element-plus";

export interface ConfirmOptions extends ElMessageBoxOptions {
  title?: string;
  message?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  type?: "success" | "warning" | "info" | "error";
}

/**
 * 确认对话框
 */
export function useConfirm() {
  /**
   * 显示确认对话框
   */
  const confirm = async (options: string | ConfirmOptions): Promise<boolean> => {
    const defaultOptions: ConfirmOptions = {
      title: "提示",
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    };

    const finalOptions: ConfirmOptions =
      typeof options === "string"
        ? { ...defaultOptions, message: options }
        : { ...defaultOptions, ...options };

    try {
      await ElMessageBox.confirm(
        finalOptions.message || "确定执行此操作吗？",
        finalOptions.title,
        {
          confirmButtonText: finalOptions.confirmButtonText,
          cancelButtonText: finalOptions.cancelButtonText,
          type: finalOptions.type,
          ...finalOptions,
        }
      );
      return true;
    } catch (error) {
      return false;
    }
  };

  /**
   * 删除确认
   */
  const confirmDelete = async (itemName?: string): Promise<boolean> => {
    return confirm({
      title: "确认删除",
      message: itemName ? `确定要删除"${itemName}"吗？此操作不可恢复。` : "确定要删除吗？此操作不可恢复。",
      type: "warning",
      confirmButtonText: "删除",
      confirmButtonClass: "el-button--danger",
    });
  };

  /**
   * 警告确认
   */
  const confirmWarning = async (message: string): Promise<boolean> => {
    return confirm({
      title: "警告",
      message,
      type: "warning",
    });
  };

  /**
   * 信息确认
   */
  const confirmInfo = async (message: string): Promise<boolean> => {
    return confirm({
      title: "提示",
      message,
      type: "info",
    });
  };

  return {
    confirm,
    confirmDelete,
    confirmWarning,
    confirmInfo,
  };
}

