# PICUI 图床配置说明

## 环境变量配置

在项目根目录创建 `.env.local` 文件（此文件已在 `.gitignore` 中，不会提交到仓库）：

```env
# 后端 API 地址
VITE_API_BASE_URL=http://localhost:3000

# PICUI 图床配置
VITE_PICUI_API_URL=https://picui.cn/api/v1
VITE_PICUI_TOKEN=your_token_here
```

## 获取 PICUI Token

1. 访问 [PICUI 图床官网](https://picui.cn)
2. 注册并登录账号
3. 进入「个人中心」
4. 复制 API Token
5. 将 Token 填入 `.env.local` 的 `VITE_PICUI_TOKEN` 配置项

## 游客上传模式

如果不配置 `VITE_PICUI_TOKEN`，图片将以游客模式上传：

- 功能完全可用
- 无法在个人中心管理图片
- 适合测试和临时使用

## 上传配置

- 默认上传相册：ID 1761
- 默认权限：公开（permission: 1）
- 单个文件最大 1.5MB
- 支持格式：jpg, jpeg, png, gif, webp, bmp

## 图片去重机制

系统会自动检测重复图片（基于 MD5 值）：

1. **上传流程**：
   - 图片先上传到 PICUI 图床
   - PICUI 返回图片信息（包含 MD5、SHA1）
   - 系统将信息保存到后端数据库

2. **去重检测**：
   - 后端检查数据库中是否已有相同 MD5 的图片
   - 如果已存在，返回已有图片信息
   - 前端提示"检测到相同图片，已使用现有图片链接"

3. **优势**：
   - 避免数据库存储重复图片记录
   - 节省管理成本
   - 统一图片链接，便于维护

## 修改默认相册

如需修改默认上传相册，编辑 `src/components/content/ContentEditor.vue`：

```typescript
const imageUrl = await uploadImage(uploadFile.raw, {
  permission: 1,
  albumId: 1761, // 修改此处的相册 ID
});
```

## API 文档

详细接口文档：<https://picui.cn/page/api-docs.html>
