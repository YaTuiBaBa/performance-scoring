<template>
  <div>
    <el-row :gutter="16" class="page-section">
      <el-col :span="6"><el-card class="stat-card"><div class="text-muted">当前月均分</div><div class="big-number">{{ m.total_avg_score }}</div></el-card></el-col>
      <el-col :span="6"><el-card class="stat-card"><div class="text-muted">最高分</div><div class="big-number" style="color: #67c23a">{{ m.max_score }}</div></el-card></el-col>
      <el-col :span="6"><el-card class="stat-card"><div class="text-muted">最低分</div><div class="big-number" style="color: #f56c6c">{{ m.min_score }}</div></el-card></el-col>
      <el-col :span="6"><el-card class="stat-card"><div class="text-muted">提交次数</div><div class="big-number">{{ m.approved_count }}</div></el-card></el-col>
    </el-row>

    <el-row :gutter="16" class="page-section">
      <el-col :span="14">
        <el-card>
          <div class="section-title">本月每日得分</div>
          <ChartBox :option="trendOption" :height="280" />
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card>
          <div class="section-title">高光 & 待改进</div>
          <el-alert type="success" :closable="false" class="page-section">
            <template #title>高光时刻</template>
            {{ highlight.text || '暂无数据' }}
          </el-alert>
          <el-alert type="warning" :closable="false">
            <template #title>待改进项</template>
            {{ low.text || '暂无数据' }}
          </el-alert>
        </el-card>
      </el-col>
    </el-row>

    <el-card>
      <div class="section-title">月度对比</div>
      <el-statistic title="较上月均分" :value="diff" :precision="1" :value-style="{ color: diff >= 0 ? '#67c23a' : '#f56c6c' }">
        <template #suffix>{{ diff >= 0 ? '↑' : '↓' }}</template>
      </el-statistic>
    </el-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '../../store/auth.js'
import { useReportStore } from '../../store/reports.js'
import ChartBox from '../../components/ChartBox.vue'

const auth = useAuthStore()
const store = useReportStore()
const uid = auth.user.user_id

const m = computed(() => {
  const list = store.byUser(uid).filter((r) => r.status === 'APPROVED' && r.approval)
  const scores = list.map((r) => r.approval.score_total)
  const avg = scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 2) / 2 : 0
  return {
    total_avg_score: avg,
    max_score: scores.length ? Math.max(...scores) : 0,
    min_score: scores.length ? Math.min(...scores) : 0,
    approved_count: scores.length
  }
})

const highlight = computed(() => {
  const list = store.byUser(uid).filter((r) => r.status === 'APPROVED' && r.approval)
  if (!list.length) return { text: '' }
  const best = list.reduce((a, b) => (b.approval.score_total > a.approval.score_total ? b : a))
  return { text: `${best.report_date} 得分 ${best.approval.score_total}，评语：${best.approval.comment}` }
})
const low = computed(() => {
  const list = store.byUser(uid).filter((r) => r.status === 'APPROVED' && r.approval)
  if (!list.length) return { text: '' }
  const worst = list.reduce((a, b) => (b.approval.score_total < a.approval.score_total ? b : a))
  return { text: `${worst.report_date} 得分 ${worst.approval.score_total}，评语：${worst.approval.comment}` }
})

const diff = computed(() => Math.round((m.value.total_avg_score - 8.3) * 10) / 10)

const trendOption = computed(() => {
  const days = []
  for (let d = 1; d <= 26; d++) {
    const date = `2026-08-${String(d).padStart(2, '0')}`
    const r = store.byUser(uid).find((x) => x.report_date === date && x.approval)
    days.push(r ? r.approval.score_total : null)
  }
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: days.map((_, i) => i + 1) },
    yAxis: { type: 'value', min: 0, max: 10 },
    series: [{ type: 'bar', data: days, itemStyle: { color: '#409eff' }, barWidth: '55%' }]
  }
})
</script>
