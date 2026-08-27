# 采油厂绩效量化考核系统 · 前端 Demo

一个面向采油厂「岗位职责 + 绩效量化考核」场景的**纯前端演示系统**。所有数据均为前端 Mock,无需后端,开箱即跑,适合汇报演示与原型验证。

---

## 一、环境依赖

| 依赖 | 版本要求 | 说明 |
| --- | --- | --- |
| Node.js | **≥ 18**(推荐 20) | Vite 5 运行所需;Netlify 构建已通过 `netlify.toml` 锁定为 20 |
| npm | 随 Node 自带 | 包管理工具 |

> 验证:`node -v` 应显示 v18.x / v20.x 及以上。

---

## 二、技术栈

| 类别 | 选型 | 用途 |
| --- | --- | --- |
| 框架 | Vue 3.4 | 组合式 API |
| 构建 | Vite 5.2 | 开发服务器 / 生产打包 |
| 路由 | Vue Router 4.3 | Hash 模式(`createWebHashHistory`),`base: './'` 适配子路径部署 |
| 状态 | Pinia 2.1 | 登录态与各业务 store |
| UI | Element Plus 2.7 | 组件库 |
| 图表 | ECharts 5.5 | 考核驾驶舱可视化 |

---

## 三、安装与运行

```bash
# 1. 安装依赖(首次)
npm install

# 2. 本地开发(默认 http://localhost:5173)
npm run dev

# 3. 生产构建(产物输出到 dist/)
npm run build

# 4. 预览构建产物
npm run preview
```

---

## 四、目录结构

```
performance-scoring-demo/
├── index.html              # Vite 入口(引用 /src/main.js)
├── vite.config.js          # Vite 配置(base: './')
├── netlify.toml            # Netlify 部署配置(构建+发布 dist)
├── package.json
├── .github/
│   └── workflows/          # GitHub Pages 自动部署工作流
└── src/
    ├── main.js             # 应用入口,挂载 app / router / pinia
    ├── App.vue             # 根组件
    ├── style.css           # 全局样式
    ├── menu.config.js      # 菜单配置
    ├── router/
    │   └── index.js        # 路由表 + 全局登录守卫(beforeEach)
    ├── store/              # Pinia stores
    │   ├── auth.js         # 登录态、角色、token(localStorage 持久化)
    │   ├── reports.js      # 任务提报 / 审批
    │   ├── personnel.js    # 人员管理
    │   ├── duties.js       # 岗位职责
    │   └── notices.js      # 通知管理
    ├── mock/
    │   └── data.js         # 全量 Mock 数据 + 演示账号
    ├── layouts/
    │   └── MainLayout.vue   # 登录后主框架(侧边栏 + 顶栏)
    ├── components/
    │   └── ChartBox.vue     # ECharts 封装组件
    ├── views/
    │   ├── Login.vue            # 登录页
    │   ├── employee/            # 员工端:工作台/提报/记录/绩效
    │   ├── manager/             # 班站长端:待办/逾期/审批/报表/人员/职责/通知
    │   └── factory/             # 厂级:考核驾驶舱/员工档案
    └── (其余资源)
```

---

## 五、角色与路由

系统按角色划分权限,路由守卫见 `src/router/index.js`:

- 未登录访问任何业务页 → 自动跳转 `/login`
- 登录后按角色跳转对应首页,越权访问会被重定向回本角色首页

| 角色 | 代码 | 首页 | 对应演示账号 |
| --- | --- | --- | --- |
| 员工 | `EMPLOYEE` | 我的工作台 | `zhangwei` |
| 班站长 | `STATION_MASTER` | 待办审批台 | `zhaojg` |
| 作业区/厂级领导 | `FACTORY_LEADER` 等 | 考核驾驶舱 | `chenhong` |

---

## 六、演示账号

> 登录**只校验用户名**,密码任意填写即可(见 `src/store/auth.js` 的 `loginByUsername`)。

| 用户名 | 角色 | 可看内容 |
| --- | --- | --- |
| `zhangwei` | 员工 | 我的工作台、每日任务提报、提交记录、我的绩效 |
| `zhaojg` | 班站长 | 待办审批、逾期未报、审批评分、班站报表、人员/职责/通知管理 |
| `chenhong` | 厂级领导 | 厂级考核驾驶舱、员工考核档案 |

---

## 七、部署

### 方式 A:Netlify(推荐,自动部署)
仓库已含 `netlify.toml`,在 Netlify 关联 Git 仓库后:
- 构建命令:`npm run build`
- 发布目录:`dist`
- 推送 `main` 即自动重新部署。

### 方式 B:GitHub Pages
`.github/workflows/` 提供 Actions 工作流,推送 `main` 后在仓库 **Settings → Pages → Source 选 GitHub Actions** 即可。

> 两种方式均发布 `dist/`(打包产物)。**切勿直接发布源码根目录**,否则浏览器会因裸模块名(`import 'vue'`)报错白屏。

---

## 八、说明

- 本系统为 **Demo / 原型**,数据全部来自 `src/mock/data.js`,刷新页面后新增的提报/审批等本地变更会随 Mock 重置(登录态因存 `localStorage` 会保留)。
- 如需接入真实后端,替换 `src/mock/` 与各 `store` 中的 `action` 为接口调用即可。
