import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // 相对 base：部署到 GitHub Pages 项目页（user.github.io/repo/）时无需硬编码仓库名
  base: './',
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    port: 5173
  }
})
