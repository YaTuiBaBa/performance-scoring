<template>
  <div>
    <!-- 欢迎横幅 + 今日状态 -->
    <el-card class="hero">
      <div class="hero-left">
        <div class="hero-greet">下午好，{{ auth.user.real_name }} 👋</div>
        <div class="hero-sub">{{ posName }} · {{ auth.user.department }} / {{ auth.user.station || '—' }}　|　{{ today }}</div>
        <div class="hero-status" :style="{ color: todayStatus.color, background: todayStatus.bg }">
          <el-icon><Clock /></el-icon> 今日日报：{{ todayStatus.text }}
        </div>
      </div>
      <div class="hero-right">
        <div class="hero-num" @click="go('/employee/performance')" title="查看我的绩效">
          <div class="hero-num-v">{{ monthly.total_avg_score }}</div>
          <div class="hero-num-l">本月均分</div>
        </div>
        <div class="hero-num" @click="go('/employee/report/history')" title="查看我的提交记录">
          <div class="hero-num-v" style="color: var(--ps-warning)">{{ pendingCount }}</div>
          <div class="hero-num-l">待办（待审批/被驳回）</div>
        </div>
      </div>
    </el-card>

    <!-- 核心入口：显眼置顶 -->
    <div class="entry-row">
      <div class="entry-card primary" @click="go('/employee/report/create')">
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
    </div>

    <el-row :gutter="18" class="page-section">
      <el-col :span="14">
        <el-card>
          <div class="section-title">最近 7 天得分趋势</div>
          <ChartBox :option="trendOption" :height="260" />
        </el-card>
      </el-col>
      <el-col :span="10">
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
import { positionMap } from '../../mock/data.js'
import { useNoticeStore } from '../../store/notices.js'
import ChartBox from '../../components/ChartBox.vue'

const auth = useAuthStore()
const store = useReportStore()
const router = useRouter()
const uid = auth.user.user_id
const posName = positionMap[auth.user.primary_position_id]?.position_name
const today = '2026-08-27'

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
</script>

<style scoped>
.hero {
  margin-bottom: 18px;
  background: linear-gradient(120deg, #2f6fed 0%, #4f8bff 55%, #36c5f0 100%);
  color: #fff;
}
.hero :deep(.el-card__body) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 28px;
}
.hero-greet {
  font-size: 22px;
  font-weight: 700;
}
.hero-sub {
  margin-top: 6px;
  font-size: 13px;
  opacity: 0.9;
}
.hero-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 14px;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}
.hero-right {
  display: flex;
  gap: 28px;
}
.hero-num {
  text-align: center;
  color: #fff;
  cursor: pointer;
  padding: 4px 10px;
  border-radius: 10px;
  transition: background 0.18s ease;
}
.hero-num:hover {
  background: rgba(255, 255, 255, 0.14);
}
.hero-num-v {
  font-size: 30px;
  font-weight: 800;
  line-height: 1.1;
}
.hero-num-l {
  font-size: 12px;
  opacity: 0.85;
  margin-top: 2px;
}
.entry-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
  margin-bottom: 18px;
}
.entry-card {
  background: #fff;
  border-radius: 14px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 14px;
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
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: var(--ps-primary-soft);
  color: var(--ps-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
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
.entry-body {
  flex: 1;
}
.entry-title {
  font-size: 16px;
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
</style>

