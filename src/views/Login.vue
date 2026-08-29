<template>
  <div class="login-page">
    <div class="login-card">
      <!-- 品牌区 -->
      <div class="brand">
        <div class="brand-badge"><el-icon :size="30"><Medal /></el-icon></div>
        <div>
          <div class="brand-title">绩效量化考核系统</div>
          <div class="brand-sub">采油厂岗位职责 · 多维度评分</div>
        </div>
      </div>

      <el-form :model="form" @submit.prevent class="login-form">
        <el-form-item>
          <el-input v-model="form.username" placeholder="登录账号（建议用工号）" size="large" :prefix-icon="User" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.password" type="password" placeholder="密码（演示环境任意填写）" size="large" :prefix-icon="Lock" show-password />
        </el-form-item>
        <el-button type="primary" size="large" class="btn" @click="doLogin">登录</el-button>
      </el-form>

      <div class="demo-head">
        <span class="demo-line" />
        <span class="demo-text">演示账号 · 一键进入</span>
        <span class="demo-line" />
      </div>
      <div class="demo-accounts">
        <button
          v-for="a in demoAccounts"
          :key="a.username"
          class="role-card"
          :style="{ '--rc': a.color }"
          @click="quickLogin(a.username)"
        >
          <span class="role-avatar" :style="{ background: a.color }">
            <el-icon :size="20"><component :is="a.icon" /></el-icon>
          </span>
          <span class="role-meta">
            <span class="role-name">{{ a.label }}</span>
            <span class="role-desc">{{ a.desc }}</span>
          </span>
          <el-icon class="role-arrow"><ArrowRight /></el-icon>
        </button>
      </div>

      <div class="hint">纯前端 Demo · 数据均为本地 Mock，未连接后端服务</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock, ArrowRight, Medal, Odometer, Bell, Histogram } from '@element-plus/icons-vue'
import { useAuthStore } from '../store/auth.js'
import { demoAccounts } from '../mock/data.js'
import { ElMessage } from 'element-plus'

const auth = useAuthStore()
const router = useRouter()
const form = ref({ username: 'zhangwei', password: '123456' })

// 为演示账号补充图标与配色，渲染为角色卡片
const icons = { zhangwei: Odometer, zhaojg: Bell, chenhong: Histogram }
const colors = { zhangwei: '#2f6fed', zhaojg: '#14b8a6', chenhong: '#8b5cf6' }
const descs = {
  zhangwei: '一线员工 · 提报与查看绩效',
  zhaojg: '班站长 · 审批与评分',
  chenhong: '作业区领导 · 考核驾驶舱'
}
const demoAccountsRich = demoAccounts.map((a) => ({
  ...a,
  icon: icons[a.username] || Odometer,
  color: colors[a.username] || '#2f6fed',
  desc: descs[a.username] || ''
}))

function afterLogin(user) {
  ElMessage.success('登录成功，欢迎 ' + user.real_name)
  router.push(auth.homePath())
}
function doLogin() {
  const r = auth.loginByUsername(form.value.username)
  if (!r.ok) return ElMessage.error(r.msg)
  afterLogin(r.user)
}
function quickLogin(username) {
  const r = auth.loginByUsername(username)
  if (!r.ok) return ElMessage.error(r.msg)
  afterLogin(r.user)
}
</script>

<style scoped>
.login-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(1200px 600px at 80% -10%, #e7f0ff 0%, transparent 60%),
    radial-gradient(1000px 500px at -10% 110%, #e6fbf6 0%, transparent 55%), var(--ps-bg);
}
.login-card {
  width: 420px;
  background: var(--ps-surface);
  border-radius: var(--ps-r-xl);
  padding: 32px 34px 26px;
  box-shadow: var(--ps-sh-3);
  border: 1px solid rgba(255, 255, 255, 0.6);
}
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 26px;
}
.brand-badge {
  width: 46px;
  height: 46px;
  border-radius: 13px;
  background: linear-gradient(135deg, #2f6fed, #36c5f0);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--ps-sh-primary);
}
.brand-title {
  font-weight: 700;
  font-size: 18px;
  color: var(--ps-text-1);
}
.brand-sub {
  color: var(--ps-text-3);
  font-size: 12px;
  margin-top: 3px;
}
.login-form {
  margin-bottom: 8px;
}
.btn {
  width: 100%;
}
.demo-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 22px 0 14px;
  color: var(--ps-text-3);
  font-size: 12px;
}
.demo-line {
  flex: 1;
  height: 1px;
  background: var(--ps-border-strong);
}
.demo-text {
  white-space: nowrap;
}
.demo-accounts {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.role-card {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 14px;
  background: var(--ps-surface);
  border: 1px solid var(--ps-border);
  border-radius: var(--ps-r-md);
  cursor: pointer;
  text-align: left;
  transition: all 0.18s ease;
  font-family: inherit;
}
.role-card:hover {
  border-color: var(--rc);
  background: var(--ps-primary-tint);
  transform: translateY(-1px);
  box-shadow: var(--ps-sh-2);
}
.role-avatar {
  width: 38px;
  height: 38px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}
.role-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}
.role-name {
  font-weight: 600;
  font-size: 14px;
  color: var(--ps-text-1);
}
.role-desc {
  font-size: 12px;
  color: var(--ps-text-3);
}
.role-arrow {
  color: var(--ps-text-4);
  font-size: 16px;
}
.hint {
  margin-top: 18px;
  color: var(--ps-text-4);
  font-size: 12px;
  text-align: center;
}
</style>
