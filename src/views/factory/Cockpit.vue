<template>
  <div class="cockpit">
    <div class="cockpit-head">
      <div class="ch-title">厂级考核驾驶舱</div>
      <div class="ch-sub">实时绩效概览 · 数据更新于 2026-08-27</div>
    </div>
    <el-row :gutter="16" class="page-section">
      <el-col :span="4"><el-card class="kpi"><div class="kpi-label">全厂总人数</div><div class="kpi-num">{{ staff.length }}</div></el-card></el-col>
      <el-col :span="4"><el-card class="kpi"><div class="kpi-label">本月均分</div><div class="kpi-num" style="color: #2f6fed">{{ avgAll }}</div></el-card></el-col>
      <el-col :span="4"><el-card class="kpi"><div class="kpi-label">提交率</div><div class="kpi-num" style="color: #2faa6a">{{ submitRate }}%</div></el-card></el-col>
      <el-col :span="4"><el-card class="kpi"><div class="kpi-label">最高分</div><div class="kpi-num" style="color: #2faa6a">{{ maxAll }}</div></el-card></el-col>
      <el-col :span="4"><el-card class="kpi"><div class="kpi-label">最低分</div><div class="kpi-num" style="color: #f56c6c">{{ minAll }}</div></el-card></el-col>
      <el-col :span="4"><el-card class="kpi"><div class="kpi-label">待审批/逾期</div><div class="kpi-num" style="color: #e6a23c">{{ pendingTotal }}/{{ overdueTotal }}</div></el-card></el-col>
    </el-row>

    <el-row :gutter="16" class="page-section">
      <el-col :span="12">
        <el-card>
          <div class="section-title">各作业区均分排名</div>
          <ChartBox :option="zoneOption" :height="280" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <div class="section-title">全厂得分分布</div>
          <ChartBox :option="distOption" :height="280" />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="page-section">
      <el-col :span="12">
        <el-card>
          <div class="section-title">每日提交率趋势</div>
          <ChartBox :option="trendOption" :height="280" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <div class="section-title">员工考核档案（点击下钻）</div>
          <el-table :data="ranking" border stripe @row-click="(r) => go(r.user_id)" size="small">
            <el-table-column type="index" label="排名" width="60" align="center" />
            <el-table-column label="姓名" width="90"><template #default="{ row }">{{ employeeMap[row.user_id].real_name }}</template></el-table-column>
            <el-table-column label="岗位" width="90"><template #default="{ row }">{{ posName(row.user_id) }}</template></el-table-column>
            <el-table-column label="部门" width="110"><template #default="{ row }">{{ employeeMap[row.user_id].department }}</template></el-table-column>
            <el-table-column prop="total_avg_score" label="均分" align="center">
              <template #default="{ row }">
                <span :style="{ color: row.total_avg_score < 6 ? '#f56c6c' : '#303133', fontWeight: 700 }">{{ row.total_avg_score }}</span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useReportStore } from '../../store/reports.js'
import { employeeMap, positionMap } from '../../mock/data.js'
import ChartBox from '../../components/ChartBox.vue'

const store = useReportStore()
const router = useRouter()

const staff = computed(() => Object.values(employeeMap).filter((e) => e.role === 'EMPLOYEE'))

const scores = computed(() =>
  staff.value
    .map((e) => {
      const list = store.byUser(e.user_id).filter((r) => r.status === 'APPROVED' && r.approval)
      const avg = list.length ? Math.round((list.reduce((s, r) => s + r.approval.score_total, 0) / list.length) * 2) / 2 : 0
      const dist = list.map((r) => r.approval.score_total)
      return { user_id: e.user_id, total_avg_score: avg, approved_count: list.length, max: dist.length ? Math.max(...dist) : 0, min: dist.length ? Math.min(...dist) : 0 }
    })
    .filter((x) => x.approved_count > 0)
    .sort((a, b) => b.total_avg_score - a.total_avg_score)
)
const ranking = scores
const avgAll = computed(() => (ranking.value.length ? Math.round((ranking.value.reduce((s, r) => s + r.total_avg_score, 0) / ranking.value.length) * 2) / 2 : 0))
const maxAll = computed(() => (ranking.value.length ? Math.max(...ranking.value.map((r) => r.total_avg_score)) : 0))
const minAll = computed(() => (ranking.value.length ? Math.min(...ranking.value.map((r) => r.total_avg_score)) : 0))
const submitRate = computed(() => {
  const total = staff.value.length * 26
  const submitted = staff.value.reduce((s, e) => s + store.byUser(e.user_id).filter((r) => r.status !== 'DRAFT').length, 0)
  return total ? Math.round((submitted / total) * 100) : 0
})
const pendingTotal = computed(() => store.reports.filter((r) => r.status === 'PENDING').length)
const overdueTotal = computed(() => staff.value.filter((e) => !store.byUser(e.user_id).some((r) => r.report_date === '2026-08-26')).length)

function posName(uid) {
  return positionMap[employeeMap[uid].primary_position_id]?.position_name
}
function go(uid) {
  router.push('/dashboard/employee/' + uid)
}

const AXIS_LABEL = '#606266'
const AXIS_LINE = '#dcdfe6'
const SPLIT = '#f0f2f5'
const tooltipStyle = {
  backgroundColor: 'rgba(255,255,255,0.96)',
  borderColor: '#e4e7ed',
  textStyle: { color: '#303133' },
  extraCssText: 'box-shadow:0 6px 20px rgba(0,0,0,0.12);border-radius:8px;'
}

const zoneOption = computed(() => {
  const groups = {}
  staff.value.forEach((e) => {
    const s = ranking.value.find((x) => x.user_id === e.user_id)
    if (!s) return
    groups[e.department] = groups[e.department] || []
    groups[e.department].push(s.total_avg_score)
  })
  const zones = Object.keys(groups)
  const vals = zones.map((z) => Math.round((groups[z].reduce((a, b) => a + b, 0) / groups[z].length) * 2) / 2)
  return {
    textStyle: { color: AXIS_LABEL },
    tooltip: { ...tooltipStyle, trigger: 'axis' },
    grid: { left: 60, right: 36, top: 20, bottom: 30 },
    xAxis: {
      type: 'value',
      max: 10,
      axisLabel: { color: AXIS_LABEL },
      axisLine: { lineStyle: { color: AXIS_LINE } },
      splitLine: { lineStyle: { color: SPLIT } }
    },
    yAxis: {
      type: 'category',
      data: zones,
      axisLabel: { color: AXIS_LABEL },
      axisLine: { lineStyle: { color: AXIS_LINE } },
      splitLine: { show: false }
    },
    series: [{ type: 'bar', data: vals, itemStyle: { color: '#2f6fed', borderRadius: [0, 6, 6, 0] }, barWidth: '50%', label: { show: true, position: 'right', color: '#303133' } }]
  }
})

const distOption = computed(() => {
  const buckets = { '0-3': 0, '3-5': 0, '5-7': 0, '7-9': 0, '9-10': 0 }
  ranking.value.forEach((r) => {
    const v = r.total_avg_score
    if (v < 3) buckets['0-3']++
    else if (v < 5) buckets['3-5']++
    else if (v < 7) buckets['5-7']++
    else if (v < 9) buckets['7-9']++
    else buckets['9-10']++
  })
  return {
    textStyle: { color: AXIS_LABEL },
    tooltip: { ...tooltipStyle, trigger: 'axis' },
    grid: { left: 36, right: 16, top: 20, bottom: 28 },
    xAxis: {
      type: 'category',
      data: Object.keys(buckets),
      axisLabel: { color: AXIS_LABEL },
      axisLine: { lineStyle: { color: AXIS_LINE } },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: AXIS_LABEL },
      axisLine: { lineStyle: { color: AXIS_LINE } },
      splitLine: { lineStyle: { color: SPLIT } }
    },
    series: [{ type: 'bar', data: Object.values(buckets), itemStyle: { color: '#14b8a6', borderRadius: [6, 6, 0, 0] }, barWidth: '50%', label: { show: true, position: 'top', color: '#303133' } }]
  }
})

const trendOption = computed(() => {
  const days = []
  const rates = []
  for (let d = 1; d <= 26; d++) {
    const date = `2026-08-${String(d).padStart(2, '0')}`
    const sub = staff.value.filter((e) => store.byUser(e.user_id).some((r) => r.report_date === date && r.status !== 'DRAFT')).length
    days.push(d)
    rates.push(Math.round((sub / staff.value.length) * 100))
  }
  return {
    textStyle: { color: AXIS_LABEL },
    tooltip: { ...tooltipStyle, trigger: 'axis', valueFormatter: (v) => v + '%' },
    grid: { left: 40, right: 16, top: 20, bottom: 28 },
    xAxis: {
      type: 'category',
      data: days,
      axisLabel: { color: AXIS_LABEL },
      axisLine: { lineStyle: { color: AXIS_LINE } },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: { color: AXIS_LABEL, formatter: '{value}%' },
      axisLine: { lineStyle: { color: AXIS_LINE } },
      splitLine: { lineStyle: { color: SPLIT } }
    },
    series: [{ type: 'line', data: rates, smooth: true, areaStyle: { color: 'rgba(47,111,237,0.22)' }, itemStyle: { color: '#5b8cf2' }, lineStyle: { width: 3, color: '#5b8cf2' }, symbol: 'circle', symbolSize: 6 }]
  }
})
</script>

<style scoped>
.cockpit {
  margin: -18px;
  padding: 18px;
}
.cockpit-head {
  display: flex;
  align-items: baseline;
  gap: 14px;
  padding: 4px 4px 18px;
  border-bottom: 1px solid #eef0f4;
  margin-bottom: 18px;
}
.ch-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2733;
  letter-spacing: 0.5px;
}
.ch-title::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 18px;
  background: linear-gradient(180deg, #2f6fed, #36c5f0);
  border-radius: 2px;
  margin-right: 10px;
  vertical-align: -2px;
}
.ch-sub {
  color: #909399;
  font-size: 13px;
}
.kpi {
  background: #fff;
  border: 1px solid #ebeef5 !important;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(31, 39, 51, 0.05);
}
.kpi::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(180deg, #2f6fed, #36c5f0);
}
.kpi :deep(.el-card__body) {
  padding: 16px 18px;
}
.kpi-label {
  color: #909399;
  font-size: 13px;
}
.kpi-num {
  font-size: 26px;
  font-weight: 700;
  color: #1f2733;
  margin-top: 6px;
  letter-spacing: -0.5px;
}
.cockpit .el-card {
  background: #fff;
  border: 1px solid #ebeef5 !important;
}
</style>
