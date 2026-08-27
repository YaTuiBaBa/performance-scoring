<template>
  <el-container class="layout">
    <el-aside width="232px" class="aside">
      <div class="logo">
        <div class="logo-badge"><el-icon><Medal /></el-icon></div>
        <div class="logo-text">
          <div class="logo-title">绩效量化考核</div>
          <div class="logo-sub">Performance Scoring</div>
        </div>
      </div>

      <el-scrollbar class="menu-scroll">
        <div v-for="g in menus" :key="g.group" class="menu-block">
          <div class="menu-group">{{ g.group }}</div>
          <div
            v-for="m in g.items"
            :key="m.path"
            class="nav-item"
            :class="{ active: activeMenu === m.path }"
            @click="nav(m.path)"
          >
            <el-icon class="nav-icon"><component :is="m.icon" /></el-icon>
            <span>{{ m.title }}</span>
          </div>
        </div>
      </el-scrollbar>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="crumb">
          <el-icon class="crumb-icon"><LocationFilled /></el-icon>
          <span>{{ currentTitle }}</span>
        </div>
        <div class="header-right">
          <el-badge :value="unread" :hidden="unread === 0" class="bell">
            <el-popover placement="bottom-end" :width="340" trigger="click">
              <template #reference>
                <div class="bell-btn"><el-icon :size="19"><Bell /></el-icon></div>
              </template>
              <div class="notice-pop">
                <div class="notice-pop-title">通知消息</div>
                <el-empty v-if="!noticeList.length" description="暂无消息" :image-size="60" />
                <div v-for="n in noticeList" :key="n.notice_id" class="notice-item" :class="{ unread: !n.read }">
                  <div class="notice-item-title">{{ n.title }}</div>
                  <div class="notice-item-content">{{ n.content }}</div>
                  <div class="notice-item-time">{{ n.create_time }}</div>
                </div>
              </div>
            </el-popover>
          </el-badge>

          <el-dropdown @command="onCmd" trigger="click">
            <span class="user">
              <el-avatar :size="32" class="user-avatar">{{ initial }}</el-avatar>
              <div class="user-meta">
                <div class="user-name">{{ auth.user?.real_name }}</div>
                <div class="user-role">{{ roleLabel }}</div>
              </div>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">
                  <el-icon><SwitchButton /></el-icon> 退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth.js'
import { useNoticeStore } from '../store/notices.js'
import { menusForRole } from '../menu.config.js'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const roleLabelMap = {
  EMPLOYEE: '一线员工',
  STATION_MASTER: '班站长',
  ZONE_LEADER: '作业区领导',
  FACTORY_LEADER: '厂级领导',
  HR: '考核专员',
  ADMIN: '系统管理员'
}
const roleLabel = computed(() => roleLabelMap[auth.role] || auth.role)
const initial = computed(() => (auth.user?.real_name || '?').charAt(0))
const noticeStore = useNoticeStore()
const noticeList = computed(() => noticeStore.published)
const unread = computed(() => noticeStore.unread)
const activeMenu = computed(() => route.path)
const currentTitle = computed(() => route.meta?.title || '')
const menus = computed(() => menusForRole(auth.role))

function nav(p) {
  router.push(p)
}
function onCmd(cmd) {
  if (cmd === 'logout') {
    auth.logout()
    router.push('/login')
  }
}
</script>

<style scoped>
.layout {
  height: 100vh;
}
/* 侧边栏 */
.aside {
  background: #ffffff;
  border-right: 1px solid #eef0f4;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 12px rgba(31, 35, 41, 0.04);
}
.logo {
  height: 64px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 20px;
  border-bottom: 1px solid #f2f4f7;
}
.logo-badge {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: linear-gradient(135deg, #2f6fed, #36c5f0);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}
.logo-title {
  font-weight: 700;
  font-size: 16px;
  color: #1f2329;
  line-height: 1.2;
}
.logo-sub {
  font-size: 11px;
  color: #9aa3af;
  letter-spacing: 0.5px;
}
.menu-scroll {
  flex: 1;
  padding: 12px 12px 0;
}
.menu-block {
  margin-bottom: 8px;
}
.menu-group {
  color: #a3abb8;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1px;
  padding: 12px 12px 6px;
  text-transform: uppercase;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 42px;
  padding: 0 12px;
  margin-bottom: 4px;
  border-radius: 10px;
  color: #4e5969;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.18s ease;
}
.nav-item:hover {
  background: #f2f6ff;
  color: #2f6fed;
}
.nav-item.active {
  background: linear-gradient(135deg, #2f6fed, #4f8bff);
  color: #fff;
  font-weight: 600;
  box-shadow: 0 6px 14px rgba(47, 111, 237, 0.28);
}
.nav-icon {
  font-size: 17px;
}
/* 顶栏 */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  background: #ffffff;
  border-bottom: 1px solid #eef0f4;
  padding: 0 24px;
  box-shadow: 0 2px 10px rgba(31, 35, 41, 0.03);
}
.crumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 17px;
  color: #1f2329;
}
.crumb-icon {
  color: #2f6fed;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}
.bell-btn {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4e5969;
  cursor: pointer;
  transition: all 0.18s;
}
.bell-btn:hover {
  background: #f2f6ff;
  color: #2f6fed;
}
.user {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  outline: none;
  padding: 4px 8px;
  border-radius: 10px;
}
.user:hover {
  background: #f7f8fa;
}
.user-avatar {
  background: linear-gradient(135deg, #2f6fed, #36c5f0);
  font-weight: 600;
}
.user-meta {
  line-height: 1.2;
}
.user-name {
  font-size: 14px;
  font-weight: 600;
  color: #1f2329;
}
.user-role {
  font-size: 11px;
  color: #9aa3af;
}
.main {
  background: #f5f7fa;
  padding: 22px;
}
.notice-pop-title {
  font-weight: 600;
  margin-bottom: 8px;
}
.notice-item {
  padding: 10px 0;
  border-top: 1px solid #f0f0f0;
}
.notice-item.unread .notice-item-title::after {
  content: '未读';
  color: #f56c6c;
  font-size: 11px;
  margin-left: 6px;
}
.notice-item-title {
  font-weight: 600;
}
.notice-item-content {
  color: #606266;
  font-size: 13px;
  margin: 3px 0;
}
.notice-item-time {
  color: #c0c4cc;
  font-size: 12px;
}
</style>
