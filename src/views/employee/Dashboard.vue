<template>
  <div>
    <!-- 欢迎横幅（含今日状态 / 天气 / 考勤） -->
    <el-card class="hero">
      <div class="hero-head">
        <div class="hero-left">
          <div class="hero-top">
            <div class="hero-greet">下午好，{{ auth.user.real_name }} 👋</div>
            <div class="hero-status" v-if="!isFactoryLeader" :style="{ color: todayStatus.color, background: todayStatus.bg }">
              <el-icon><Clock /></el-icon> 今日日报：{{ todayStatus.text }}
            </div>
            <div class="hero-badge" v-if="weather.isBad">
              <el-icon class="hb-ic"><Warning /></el-icon>
              <span>恶劣天气（中雨及以上）提交日报将 <b>自动满分、免审批</b></span>
            </div>
          </div>
          <div class="hero-sub">{{ posName }} · {{ auth.user.department }} / {{ auth.user.station || '—' }}　|　{{ today }}</div>
        </div>
        <div class="hero-weather">
          <div class="weather-main">
            <el-icon class="weather-ic"><component :is="weather.info.icon" /></el-icon>
            <div class="weather-text">
              <div class="weather-label">{{ weather.info.label }}</div>
              <div class="weather-tip">演示可模拟切换</div>
            </div>
          </div>
          <el-dropdown trigger="click" @command="onWeather" popper-class="weather-pop">
            <span class="weather-btn" title="切换天气（演示）">
              <el-icon class="weather-btn-ic"><component :is="weather.info.icon" /></el-icon>
              <el-icon class="weather-btn-caret"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="w in weatherOptions"
                  :key="w.code"
                  :command="w.code"
                  :class="{ 'is-active': w.code === weather.condition }"
                >
                  <el-icon><component :is="w.icon" /></el-icon>{{ w.label }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <!-- 指标区：均分 + 待办 + 考勤（厂长不填报、无个人绩效，整体隐藏） -->
      <div class="metrics" v-if="!isFactoryLeader">
        <div class="metric" @click="go('/employee/performance')" title="查看我的绩效">
          <div class="metric-v">{{ monthly.total_avg_score }}</div>
          <div class="metric-l">本月均分</div>
        </div>
        <div class="metric" @click="go('/employee/report/history')" title="查看我的提交记录">
          <div class="metric-v" style="color: var(--ps-warning)">{{ pendingCount }}</div>
          <div class="metric-l">待办（待审批/被驳回）</div>
        </div>
        <div class="metric no-link">
          <div class="metric-attend">
            <div class="ma-item">
              <div class="ma-num" style="color: #8be0a8">{{ attendance.present_days }}</div>
              <div class="text-muted">出勤（天）</div>
            </div>
            <div class="ma-divider"></div>
            <div class="ma-item">
              <div class="ma-num" style="color: #ffd08a">{{ attendance.leave_days }}</div>
              <div class="text-muted">休假（天）</div>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 核心入口：显眼置顶（厂长不填报、无提交记录/绩效/申诉，整体隐藏） -->
    <div class="entry-row" v-if="!isFactoryLeader">
      <div class="entry-card primary" v-if="!isFactoryLeader" @click="go('/employee/report/create')">
        <div class="entry-icon"><el-icon><EditPen /></el-icon></div>
        <div class="entry-body">
          <div class="entry-title">提报今日工作</div>
          <div class="entry-desc">勾选岗位职责，填写完成情况并提交审批</div>
        </div>
        <el-icon class="entry-arrow"><ArrowRight /></el-icon>
      </div>
      <div class="entry-card" @click="go('/employee/report/history')">
        <div class="entry-icon soft"><el-icon><Document /></el-icon></div>
        <div class="entry-body">
          <div class="entry-title">我的提交记录</div>
          <div class="entry-desc">查看历史日报、领导评分与评语</div>
        </div>
        <el-icon class="entry-arrow"><ArrowRight /></el-icon>
      </div>
      <div class="entry-card" @click="go('/employee/performance')">
        <div class="entry-icon soft2"><el-icon><Trophy /></el-icon></div>
        <div class="entry-body">
          <div class="entry-title">我的绩效</div>
          <div class="entry-desc">月度汇总、趋势与高光/待改进</div>
        </div>
        <el-icon class="entry-arrow"><ArrowRight /></el-icon>
      </div>
      <div class="entry-card" @click="go('/employee/appeal')">
        <div class="entry-icon soft3"><el-icon><ChatLineSquare /></el-icon></div>
        <div class="entry-body">
          <div class="entry-title">申诉记录</div>
          <div class="entry-desc">对评分有异议可发起申诉，跟踪审批进程</div>
        </div>
        <el-icon class="entry-arrow"><ArrowRight /></el-icon>
      </div>
    </div>

    <!-- 班站长管理待办：体现待审批与逾期催办 -->
    <div v-if="isStationMaster || isFactoryLeader" class="mgr-todo">
      <div class="todo-card todo-approve" @click="go('/manager/approval-center')">
        <div class="todo-ico"><el-icon><Bell /></el-icon></div>
        <div class="todo-body">
          <div class="todo-nums">
            <span class="todo-num" style="color: var(--ps-warning)">{{ pendingReports.length }}</span>
            <span class="todo-sep">待审日报</span>
            <span class="todo-num" style="color: var(--ps-danger)">{{ pendingAppeals.length }}</span>
            <span class="todo-sep">待审申诉</span>
          </div>
          <div class="todo-title">待审批事项 · 点击进入审批中心</div>
        </div>
        <el-icon class="todo-arrow"><ArrowRight /></el-icon>
      </div>
      <div class="todo-card todo-overdue" @click="go('/manager/overdue')">
        <div class="todo-ico" style="background: var(--ps-danger-soft); color: var(--ps-danger)"><el-icon><Warning /></el-icon></div>
        <div class="todo-body">
          <div class="todo-nums">
            <span class="todo-num" style="color: var(--ps-danger)">{{ overdueCount }}</span>
            <span class="todo-sep">逾期未报</span>
          </div>
          <div class="todo-title">逾期催办 · 点击查看并催办</div>
        </div>
        <el-icon class="todo-arrow"><ArrowRight /></el-icon>
      </div>
    </div>

    <el-row :gutter="18" class="page-section">
      <el-col v-if="!isFactoryLeader" :span="14">
        <el-card>
          <div class="section-title">最近 7 天得分趋势</div>
          <ChartBox :option="trendOption" :height="180" />
        </el-card>
      </el-col>
      <el-col :span="isFactoryLeader ? 24 : 10">
        <el-card>
          <div class="section-title">通知公告</div>
          <el-timeline>
            <el-timeline-item v-for="n in noticeList" :key="n.notice_id" :timestamp="n.create_time" :type="n.read ? '' : 'primary'" :hollow="n.read">
              <div style="font-weight: 600">{{ n.title }}</div>
              <div class="text-muted">{{ n.content }}</div>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../store/auth.js'
import { useReportStore } from '../../store/reports.js'
import { useWeatherStore } from '../../store/weather.js'
import { useAppealStore } from '../../store/appeals.js'
import { positionMap, WEATHER_TYPES, getAttendance, employeeMap } from '../../mock/data.js'
import { useNoticeStore } from '../../store/notices.js'
import ChartBox from '../../components/ChartBox.vue'

const auth = useAuthStore()
const store = useReportStore()
const weather = useWeatherStore()
const router = useRouter()
const uid = auth.user.user_id
const posName = positionMap[auth.user.primary_position_id]?.position_name
const today = '2026-08-27'
const weatherOptions = WEATHER_TYPES
const attendance = getAttendance(uid)

const myReports = computed(() => store.byUser(uid))
const approvedReports = computed(() => store.reports.filter((r) => r.user_id === uid && r.status === 'APPROVED' && r.approval))
const monthly = computed(() => {
  const s = approvedReports.value
  return {
    total_avg_score: s.length ? Math.round((s.reduce((a, r) => a + r.approval.score_total, 0) / s.length) * 2) / 2 : 0,
    approved_count: s.length
  }
})
const pendingCount = computed(() => myReports.value.filter((r) => r.status === 'PENDING' || r.status === 'REJECTED').length)
const noticeStore = useNoticeStore()
const noticeList = computed(() => noticeStore.published)

// 班站长管理待办（仅班站长展示）
const appealStore = useAppealStore()
const isStationMaster = computed(() => auth.role === 'STATION_MASTER')
const isFactoryLeader = computed(() => auth.role === 'FACTORY_LEADER')
const myStaff = computed(() => Object.values(employeeMap).filter((e) => e.leader_id === auth.user.user_id))
const pendingReports = computed(() =>
  store.reports.filter((r) => r.status === 'PENDING' && myStaff.value.some((e) => e.user_id === r.user_id))
)
const pendingAppeals = computed(() =>
  isFactoryLeader.value ? appealStore.pendingForFactory() : appealStore.pendingForStation(auth.user.user_id)
)
const overdueCount = computed(() =>
  myStaff.value.filter((e) => !store.reports.some((r) => r.user_id === e.user_id && r.report_date === '2026-08-27')).length
)

const todayStatus = computed(() => {
  const t = myReports.value.find((r) => r.report_date === today)
  if (!t) return { text: '待提交', color: '#e6a23c', bg: '#fdf6ec' }
  if (t.status === 'APPROVED') return { text: '已评分', color: '#67c23a', bg: '#f0f9eb' }
  if (t.status === 'PENDING') return { text: '待审批', color: '#2f6fed', bg: '#f2f6ff' }
  if (t.status === 'REJECTED') return { text: '已驳回', color: '#f56c6c', bg: '#fef0f0' }
  return { text: '草稿待完善', color: '#909399', bg: '#f4f4f5' }
})

const last7 = computed(() => {
  const days = []
  for (let d = 20; d <= 26; d++) days.push(`2026-08-${String(d).padStart(2, '0')}`)
  return days.map((date) => {
    const r = myReports.value.find((x) => x.report_date === date && x.approval)
    return r ? r.approval.score_total : null
  })
})
const trendOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: 36, right: 16, top: 20, bottom: 28 },
  xAxis: { type: 'category', data: ['08-20', '08-21', '08-22', '08-23', '08-24', '08-25', '08-26'], boundaryGap: false },
  yAxis: { type: 'value', min: 0, max: 10, splitLine: { lineStyle: { color: '#f0f2f5' } } },
  series: [{ type: 'line', data: last7.value, smooth: true, areaStyle: { color: 'rgba(47,111,237,0.12)' }, itemStyle: { color: '#2f6fed' }, lineStyle: { width: 3 }, connectNulls: true }]
}))

function go(p) {
  router.push(p)
}
function onWeather(code) {
  weather.setCondition(code)
}
</script>

<style scoped>
.hero {
  margin-bottom: 14px;
  background: linear-gradient(120deg, #2f6fed 0%, #4f8bff 55%, #36c5f0 100%);
  color: #fff;
}
.hero :deep(.el-card__body) {
  padding: 10px 18px 12px;
}
.hero-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.hero-top {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}
.hero-greet {
  font-size: 20px;
  font-weight: 700;
}
.hero-sub {
  margin-top: 4px;
  font-size: 13px;
  opacity: 0.9;
}
.hero-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}
.hero-weather {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
  text-align: right;
}
.weather-main {
  display: flex;
  align-items: center;
  gap: 10px;
}
.weather-ic {
  font-size: 36px;
  color: #fff;
}
.weather-label {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  line-height: 1.2;
}
.weather-tip {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.85);
}
.weather-btn {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 3px 6px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.3);
  cursor: pointer;
  color: #fff;
  line-height: 1;
}
.weather-btn:hover {
  background: rgba(255, 255, 255, 0.26);
}
.weather-btn-ic {
  font-size: 18px;
}
.weather-btn-caret {
  font-size: 11px;
  opacity: 0.85;
}
.weather-pop .el-dropdown-menu__item.is-active {
  color: var(--ps-primary);
  font-weight: 700;
  background: var(--ps-primary-soft);
}
.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: #7a4b00;
  background: #fff3d6;
  border: 1px solid #ffd591;
  box-shadow: 0 2px 8px rgba(250, 140, 22, 0.25);
}
.hero-badge b {
  color: #d4380d;
}
.hero-badge .hb-ic {
  color: #fa8c16;
  font-size: 14px;
}
.entry-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
  gap: 18px;
  margin-bottom: 18px;
}
.entry-card {
  background: #fff;
  border-radius: 14px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  box-shadow: var(--ps-shadow);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
  border: 1px solid #eef0f4;
}
.entry-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 26px rgba(31, 35, 41, 0.12);
}
.entry-card.primary {
  background: var(--ps-primary-tint);
  border-color: #d6e4ff;
}
.entry-icon {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background: var(--ps-primary-soft);
  color: var(--ps-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}
.entry-icon.soft {
  background: var(--ps-success-soft);
  color: var(--ps-success);
}
.entry-icon.soft2 {
  background: var(--ps-warning-soft);
  color: var(--ps-warning);
}
.entry-icon.soft3 {
  background: var(--ps-danger-soft);
  color: var(--ps-danger);
}
.entry-body {
  flex: 1;
}
.entry-title {
  font-size: 14px;
  font-weight: 700;
  color: #1f2329;
}
.entry-desc {
  font-size: 12px;
  color: #909399;
  margin-top: 3px;
}
.entry-arrow {
  color: #c0c4cc;
  font-size: 18px;
}
.page-section {
  align-items: stretch;
}
.page-section > .el-col {
  display: flex;
}
.page-section > .el-col > .el-card {
  flex: 1;
  width: 100%;
}
.page-section :deep(.el-card__body) {
  height: 100%;
  box-sizing: border-box;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
}
.metrics {
  margin-top: 8px;
  display: flex;
  gap: 8px;
}
.metric {
  flex: 1;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 14px;
  padding: 8px 12px;
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 8px;
  color: #fff;
  cursor: pointer;
  transition: background 0.18s ease;
}
.metric:hover {
  background: rgba(255, 255, 255, 0.22);
}
.metric.no-link {
  cursor: default;
}
.metric :deep(.text-muted) {
  color: rgba(255, 255, 255, 0.85);
}
.metric-v {
  font-size: 22px;
  font-weight: 800;
  line-height: 1.1;
}
.metric-l {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
}
.metric-attend {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
}
.ma-item {
  display: flex;
  align-items: baseline;
  gap: 4px;
  white-space: nowrap;
}
.ma-num {
  font-size: 22px;
  font-weight: 800;
  line-height: 1.1;
}
.ma-divider {
  width: 1px;
  height: 26px;
  background: rgba(255, 255, 255, 0.3);
}
.mgr-todo {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 14px;
}
.todo-card {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fff;
  border-radius: 14px;
  padding: 12px 16px;
  cursor: pointer;
  box-shadow: var(--ps-shadow);
  border: 1px solid #eef0f4;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}
.todo-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 26px rgba(31, 35, 41, 0.12);
}
.todo-approve {
  background: linear-gradient(120deg, #fff7e6 0%, #fffdf8 100%);
  border-color: #ffe2b3;
}
.todo-overdue {
  background: linear-gradient(120deg, #fef0f0 0%, #fffbfb 100%);
  border-color: #ffc9c9;
}
.todo-ico {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--ps-warning-soft);
  color: var(--ps-warning);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}
.todo-body {
  flex: 1;
}
.todo-nums {
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex-wrap: wrap;
}
.todo-num {
  font-size: 24px;
  font-weight: 800;
  line-height: 1.1;
}
.todo-sep {
  font-size: 12px;
  color: #909399;
  margin-right: 6px;
}
.todo-title {
  font-size: 13px;
  font-weight: 700;
  color: #1f2329;
  margin-top: 3px;
}
.todo-arrow {
  color: #c0c4cc;
  font-size: 18px;
}
</style>

