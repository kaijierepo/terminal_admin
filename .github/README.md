# GitHub Actions 工作流说明

本项目包含多个 GitHub Actions 工作流，用于自动化构建、测试和部署。

## 📁 工作流文件

### 1. `.github/workflows/build.yml`
- **触发条件**: 推送到 main/master/develop 分支，或创建 PR
- **功能**: 基础构建和打包
- **特点**: 
  - 支持多 Node.js 版本测试
  - 自动安装依赖
  - 运行代码检查
  - 构建项目
  - 上传构建产物

### 2. `.github/workflows/ci-cd.yml`
- **触发条件**: 推送到 main/master/develop 分支，或手动触发
- **功能**: 完整的 CI/CD 流水线
- **特点**:
  - 代码质量检查
  - 多版本构建测试
  - 创建发布包
  - 可选的环境部署
  - 构建状态通知

### 3. `.github/workflows/vite-build.yml`
- **触发条件**: 推送到 main/master/develop 分支，或创建 PR
- **功能**: 专门针对 Vite 项目的构建
- **特点**:
  - Vite 构建优化
  - 构建完整性检查
  - PR 预览功能
  - 可选 GitHub Pages 部署

### 4. `.github/workflows/deploy.yml`
- **触发条件**: 推送到 main/master 分支，或手动触发
- **功能**: 生产环境部署
- **特点**:
  - 简化的部署流程
  - 创建部署包
  - 生成构建信息

## 🚀 使用方法

### 自动触发
1. 推送代码到 `main` 或 `master` 分支
2. 创建 Pull Request
3. 工作流会自动运行

### 手动触发
1. 进入 GitHub 仓库的 Actions 页面
2. 选择对应的工作流
3. 点击 "Run workflow" 按钮

## 📦 构建产物

### 构建文件
- `dist/` 目录包含构建后的静态文件
- 支持多种格式的部署包

### 构建信息
- 构建时间
- Git 提交信息
- 分支信息
- 构建大小

## 🔧 自定义配置

### 环境变量
可以在工作流中设置以下环境变量：
```yaml
env:
  NODE_VERSION: '18.x'
  BUILD_MODE: 'production'
```

### 构建脚本
项目支持以下构建命令：
```bash
npm run build          # 标准构建
npm run build:prod     # 生产环境构建
npm run build:staging  # 测试环境构建
npm run analyze        # 构建分析
```

## 📋 工作流状态

### 成功状态
- ✅ 代码检查通过
- ✅ 构建成功
- ✅ 测试通过
- ✅ 部署完成

### 失败状态
- ❌ 代码检查失败
- ❌ 构建失败
- ❌ 测试失败
- ❌ 部署失败

## 🛠️ 故障排除

### 常见问题

1. **构建失败**
   - 检查 Node.js 版本兼容性
   - 确认所有依赖已正确安装
   - 查看构建日志中的错误信息

2. **依赖安装失败**
   - 检查 `package.json` 和 `package-lock.json`
   - 确认网络连接正常
   - 尝试清除缓存

3. **部署失败**
   - 检查部署权限
   - 确认目标环境配置
   - 查看部署日志

### 调试步骤

1. 查看 Actions 日志
2. 检查构建产物
3. 验证环境配置
4. 测试本地构建

## 📚 相关文档

- [GitHub Actions 官方文档](https://docs.github.com/en/actions)
- [Vite 构建文档](https://vitejs.dev/guide/build.html)
- [Node.js 版本管理](https://nodejs.org/en/download/package-manager/)

## 🤝 贡献

如需修改工作流配置，请：
1. 创建新的分支
2. 修改工作流文件
3. 提交 Pull Request
4. 等待代码审查
