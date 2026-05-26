# FindLens

镜头选型与 3D 视场模拟服务

## 开发

```bash
cd code/FindLens
npm install
npm run dev
```

打开浏览器访问 http://localhost:3000

## 构建

```bash
npm run build
```

## 运行生产版本

```bash
node .output/server/index.mjs
```

## 测试

```bash
npm test
```

## 部署到 Orin

```bash
cd deploy
chmod +x deploy.sh
sudo ./deploy.sh
```

## 功能

- 传感器参数输入（手动/按像元计算）
- 正向镜头计算（视场角、覆盖范围、画面占比、像素覆盖）
- 反向焦距计算（完整入镜/指定占比）
- 标准焦距推荐
- 3D 场景展示（相机、视锥、可拖动人物、距离标尺）
- 镜头画面预览
- URL 分享