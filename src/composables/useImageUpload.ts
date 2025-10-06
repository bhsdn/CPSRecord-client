import { ref } from 'vue';
import axios from 'axios';
import { ElMessage } from 'element-plus';
import { api, unwrap } from '@/utils/api';
import type { ApiResponse } from '@/types/api';
import type { UploadedImage } from '@/types';

interface PicUIUploadResponse {
  status: boolean;
  message: string;
  data: {
    key: string;
    name: string;
    pathname: string;
    origin_name: string;
    size: number;
    width?: number;
    height?: number;
    mimetype: string;
    extension: string;
    md5: string;
    sha1: string;
    links: {
      url: string;
      html: string;
      bbcode: string;
      markdown: string;
      markdown_with_link: string;
      thumbnail_url: string;
      delete_url: string;
    };
  };
}

export function useImageUpload() {
  const uploading = ref(false);
  const uploadProgress = ref(0);

  const PICUI_API_URL = import.meta.env.VITE_PICUI_API_URL || 'https://picui.cn/api/v1';
  const PICUI_TOKEN = import.meta.env.VITE_PICUI_TOKEN || '';

  /**
   * 上传图片到 PICUI 图床
   * @param file 图片文件
   * @param options 上传选项
   * @returns 图片完整信息
   */
  const uploadImage = async (
    file: File,
    options: {
      permission?: number; // 1=公开，0=私有
      albumId?: number;
      expiryAt?: string; // yyyy-MM-dd HH:mm:ss
    } = {
      permission: 1,
      albumId: 1761,
    }
  ): Promise<UploadedImage> => {
    uploading.value = true;
    uploadProgress.value = 0;

    try {
      // 构建 FormData
      const formData = new FormData();
      formData.append('file', file);

      const { permission = 1, albumId = 1761, expiryAt } = options;

      if (permission !== undefined) {
        formData.append('permission', String(permission));
      }
      if (albumId) {
        formData.append('album_id', String(albumId));
      }
      if (expiryAt) {
        formData.append('expired_at', expiryAt);
      }

      // 构建请求头
      const headers: Record<string, string> = {
        Accept: 'application/json',
        'Content-Type': 'multipart/form-data',
      };

      // 如果有 Token，添加 Authorization
      if (PICUI_TOKEN) {
        headers.Authorization = `Bearer ${PICUI_TOKEN}`;
      }

      // 发送上传请求
      const response = await axios.post<PicUIUploadResponse>(`${PICUI_API_URL}/upload`, formData, {
        headers,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            uploadProgress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          }
        },
      });

      if (!response.data.status) {
        throw new Error(response.data.message || '上传失败');
      }

      const picuiData = response.data.data;

      // 将图片信息保存到后端数据库
      try {
        const saveResponse = await api.post<ApiResponse<UploadedImage>>('/uploaded-images', {
          key: picuiData.key,
          name: picuiData.name,
          pathname: picuiData.pathname,
          originName: picuiData.origin_name,
          size: picuiData.size,
          width: picuiData.width,
          height: picuiData.height,
          mimetype: picuiData.mimetype,
          extension: picuiData.extension,
          md5: picuiData.md5,
          sha1: picuiData.sha1,
          links: picuiData.links,
          albumId: albumId || undefined,
          permission: permission || undefined,
        });

        const savedImage = unwrap(saveResponse).data;

        // 如果后端返回的 key 和刚上传的 key 不同，说明是已存在的图片
        if (savedImage.key !== picuiData.key) {
          ElMessage.info({
            message: '检测到相同图片，已使用现有图片链接（避免重复上传）',
            duration: 3000,
          });
        }

        // 返回完整的图片信息
        return savedImage;
      } catch (error) {
        // 如果保存到后端失败，构造一个临时的图片对象返回
        console.warn('保存图片信息到后端失败，但图片已上传:', error);
        return {
          id: 0,
          key: picuiData.key,
          name: picuiData.name,
          pathname: picuiData.pathname,
          originName: picuiData.origin_name,
          size: picuiData.size,
          width: picuiData.width,
          height: picuiData.height,
          mimetype: picuiData.mimetype,
          extension: picuiData.extension,
          md5: picuiData.md5,
          sha1: picuiData.sha1,
          links: picuiData.links,
          albumId: albumId,
          permission: permission,
        };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '图片上传失败';
      ElMessage.error(message);
      throw error;
    } finally {
      uploading.value = false;
      uploadProgress.value = 0;
    }
  };

  /**
   * 批量上传图片
   * @param files 图片文件数组
   * @returns 图片信息数组
   */
  const uploadImages = async (files: File[]): Promise<UploadedImage[]> => {
    const images: UploadedImage[] = [];

    for (const file of files) {
      try {
        const imageInfo = await uploadImage(file);
        images.push(imageInfo);
      } catch (error) {
        console.error(`上传文件 ${file.name} 失败:`, error);
      }
    }

    return images;
  };

  /**
   * 获取图片的宽高信息
   * @param file 图片文件
   * @returns 图片宽高对象
   */
  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        
        img.onload = () => {
          resolve({
            width: img.width,
            height: img.height,
          });
        };
        
        img.onerror = () => {
          reject(new Error('无法读取图片尺寸'));
        };
        
        img.src = e.target?.result as string;
      };
      
      reader.onerror = () => {
        reject(new Error('文件读取失败'));
      };
      
      reader.readAsDataURL(file);
    });
  };

  /**
   * 验证图片文件
   * @param file 图片文件
   * @param maxSize 最大文件大小（MB），默认 1.5MB
   * @returns 是否通过验证
   */
  const validateImage = (file: File, maxSize = 1.5): boolean => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      ElMessage.error('只能上传图片文件');
      return false;
    }

    const isLtMaxSize = file.size / 1024 / 1024 < maxSize;
    if (!isLtMaxSize) {
      ElMessage.error(`图片大小不能超过 ${maxSize}MB`);
      return false;
    }

    return true;
  };

  return {
    uploading,
    uploadProgress,
    uploadImage,
    uploadImages,
    validateImage,
    getImageDimensions,
  };
}

