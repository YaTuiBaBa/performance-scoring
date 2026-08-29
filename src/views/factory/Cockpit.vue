<template>
  <div class="cockpit">
    <div class="cockpit-head">
      <div class="ch-head-left">
        <div class="ch-title">厂级考核驾驶舱</div>
        <div class="ch-sub">统计月份 {{ selectedMonth }} · 数据更新于 2026-08-27</div>
        <div class="ch-user">当前用户：{{ auth.user?.real_name }} · {{ posName(auth.user?.user_id) }} · {{ auth.user?.department }} / {{ auth.user?.station || '—' }}</div>
      </div>
      <el-date-picker
        v-model="selectedMonth"
        type="month"
        value-format="YYYY-MM"
        format="YYYY年MM月"
        placeholder="选择月份"
        :clearable="false"
        class="month-picker"
      />
    </div>
    <div class="kpi-cards">
      <el-card class="kpi-card">
        <div class="kpi-card-title">规模与提交</div>
        <div class="kpi-card-list">
          <div class="kpi-item"><span class="kpi-item-label">全厂总人数</span><span class="kpi-item-num">{{ staff.length }}</span></div>
          <div class="kpi-item"><span class="kpi-item-label">提交率</span><span class="kpi-item-num" style="color: #2faa6a">{{ submitRate }}%</span></div>
        </div>
      </el-card>
      <el-card class="kpi-card">
        <div class="kpi-card-title">绩效概览</div>
        <div class="kpi-card-list">
          <div class="kpi-item"><span class="kpi-item-label">本月均分</span><span class="kpi-item-num" style="color: #2f6fed">{{ avgAll }}</span></div>
          <div class="kpi-item"><span class="kpi-item-label">最高分</span><span class="kpi-item-num" style="color: #2faa6a">{{ maxAll }}</span></div>
          <div class="kpi-item"><span class="kpi-item-label">最低分</span><span class="kpi-item-num" style="color: #f56c6c">{{ minAll }}</span></div>
        </div>
      </el-card>
      <el-card class="kpi-card">
        <div class="kpi-card-title">评分维度</div>
        <div class="kpi-card-list">
          <div class="kpi-item"><span class="kpi-item-label">平均质量分</span><span class="kpi-item-num" style="color: #2f6fed">{{ avgQuality }}</span></div>
          <div class="kpi-item"><span class="kpi-item-label">平均数量分</span><span class="kpi-item-num" style="color: #2f6fed">{{ avgQuantity }}</span></div>
          <div class="kpi-item"><span class="kpi-item-label">平均时效分</span><span class="kpi-item-num" style="color: #2f6fed">{{ avgTimeliness }}</span></div>
        </div>
      </el-card>
      <el-card class="kpi-card">
        <div class="kpi-card-title">审批与申诉</div>
        <div class="kpi-card-list">
          <div class="kpi-item"><span class="kpi-item-label">待审批/逾期</span><span class="kpi-item-num" style="color: #e6a23c">{{ pendingTotal }}/{{ overdueTotal }}</span></div>
          <div class="kpi-item"><span class="kpi-item-label">申诉总数</span><span class="kpi-item-num" style="color: #e6a23c">{{ appealTotal }}</span></div>
          <div class="kpi-item"><span class="kpi-item-label">已审日报</span><span class="kpi-item-num" style="color: #2faa6a">{{ approvedCount }}</span></div>
          <div class="kpi-item"><span class="kpi-item-label">恶劣天气满分</span><span class="kpi-item-num" style="color: #909399">{{ autoFullCount }}</span></div>
        </div>
      </el-card>
    </div>

    <el-row :gutter="16" class="page-section">
      <el-col :span="12">
        <el-card>
          <div class="section-title">每日提交率趋势</div>
          <ChartBox :option="trendOption" :height="280" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <div class="section-title">各作业区提交率与逾期人数</div>
          <ChartBox :option="zoneSubmitOption" :height="280" />
        </el-card>
      </el-col>
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
      <el-col :span="12">
        <el-card>
          <div class="section-title">各岗位均分对比</div>
          <ChartBox :option="positionOption" :height="280" />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="page-section">
      <el-col :span="12">
        <el-card>
          <div class="section-title">本月日均分趋势</div>
          <ChartBox :option="dailyScoreOption" :height="280" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <div class="section-title">评分三维度雷达（质量 / 数量 / 时效）</div>
          <ChartBox :option="radarOption" :height="280" />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="page-section">
      <el-col :span="12">
        <el-card>
          <div class="section-title">各作业区评分维度构成</div>
          <ChartBox :option="dimByZoneOption" :height="280" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <div class="section-title">申诉流转分布</div>
          <ChartBox :option="appealPieOption" :height="280" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useReportStore } from '../../store/reports.js'
import { useAppealStore } from '../../store/appeals.js'
import { employeeMap, positionMap } from '../../mock/data.js'
import { useAuthStore } from '../../store/auth.js'
import ChartBox from '../../components/ChartBox.vue'

const store = useReportStore()
const appealStore = useAppealStore()
const auth = useAuthStore()
const router = useRouter()

const selectedMonth = ref('2026-08')
const ym = computed(() => selectedMonth.value)
const inMonth = (date) => !!date && date.startsWith(ym.value + '-')
const daysInMonth = computed(() => {
  const [y, m] = ym.value.split('-').map(Number)
  return new Date(y, m, 0).getDate()
})
// 数据月中最后有日报的日期，作为「逾期」判定基准日
const lastDay = computed(() => {
  const days = store.reports.filter((r) => inMonth(r.report_date)).map((r) => Number(r.report_date.slice(8, 10)))
  return days.length ? Math.max(...days) : daysInMonth.value
})
const lastDayStr = computed(() => `${ym.value}-${String(lastDay.value).padStart(2, '0')}`)

const staff = computed(() => Object.values(employeeMap).filter((e) => e.role === 'EMPLOYEE'))

const scores = computed(() =>
  staff.value
    .map((e) => {
      const list = store.byUser(e.user_id).filter((r) => r.status === 'APPROVED' && r.approval && inMonth(r.report_date))
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
  const total = staff.value.length * daysInMonth.value
  const submitted = staff.value.reduce((s, e) => s + store.byUser(e.user_id).filter((r) => r.status !== 'DRAFT' && inMonth(r.report_date)).length, 0)
  return total ? Math.round((submitted / total) * 100) : 0
})
const pendingTotal = computed(() => store.reports.filter((r) => r.status === 'PENDING' && inMonth(r.report_date)).length)
const overdueTotal = computed(() => staff.value.filter((e) => !store.byUser(e.user_id).some((r) => r.report_date === lastDayStr.value)).length)

// —— 新增维度指标 ——
const approvedReports = computed(() => store.reports.filter((r) => r.status === 'APPROVED' && r.approval && inMonth(r.report_date)))
const approvedCount = computed(() => approvedReports.value.length)
const avgQuality = computed(() => (approvedReports.value.length ? Math.round((approvedReports.value.reduce((s, r) => s + r.approval.score_quality, 0) / approvedReports.value.length) * 100) / 100 : 0))
const avgQuantity = computed(() => (approvedReports.value.length ? Math.round((approvedReports.value.reduce((s, r) => s + r.approval.score_quantity, 0) / approvedReports.value.length) * 100) / 100 : 0))
const avgTimeliness = computed(() => (approvedReports.value.length ? Math.round((approvedReports.value.reduce((s, r) => s + r.approval.score_timeliness, 0) / approvedReports.value.length) * 100) / 100 : 0))
const autoFullCount = computed(() => approvedReports.value.filter((r) => r.approval.manager_id === null || (r.approval.comment || '').includes('自动满分')).length)
const appealTotal = computed(() => appealStore.list.length)

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
  for (let d = 1; d <= daysInMonth.value; d++) {
    const date = `${ym.value}-${String(d).padStart(2, '0')}`
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

// 各岗位均分对比
const positionOption = computed(() => {
  const map = {}
  ranking.value.forEach((r) => {
    const p = posName(r.user_id)
    map[p] = map[p] || []
    map[p].push(r.total_avg_score)
  })
  const names = Object.keys(map)
  const vals = names.map((p) => Math.round((map[p].reduce((a, b) => a + b, 0) / map[p].length) * 2) / 2)
  return {
    textStyle: { color: AXIS_LABEL },
    tooltip: { ...tooltipStyle, trigger: 'axis' },
    grid: { left: 60, right: 36, top: 20, bottom: 30 },
    xAxis: { type: 'value', max: 10, axisLabel: { color: AXIS_LABEL }, axisLine: { lineStyle: { color: AXIS_LINE } }, splitLine: { lineStyle: { color: SPLIT } } },
    yAxis: { type: 'category', data: names, axisLabel: { color: AXIS_LABEL }, axisLine: { lineStyle: { color: AXIS_LINE } }, splitLine: { show: false } },
    series: [{ type: 'bar', data: vals, itemStyle: { color: '#7c5cff', borderRadius: [0, 6, 6, 0] }, barWidth: '50%', label: { show: true, position: 'right', color: '#303133' } }]
  }
})

// 评分三维度雷达
const radarOption = computed(() => ({
  textStyle: { color: AXIS_LABEL },
  tooltip: { ...tooltipStyle },
  radar: {
    indicator: [
      { name: '质量', max: 10 },
      { name: '数量', max: 10 },
      { name: '时效', max: 10 }
    ],
    axisName: { color: AXIS_LABEL },
    splitLine: { lineStyle: { color: SPLIT } },
    splitArea: { areaStyle: { color: ['rgba(47,111,237,0.04)', 'rgba(47,111,237,0.08)'] } },
    axisLine: { lineStyle: { color: AXIS_LINE } }
  },
  series: [{ type: 'radar', data: [{ value: [avgQuality.value, avgQuantity.value, avgTimeliness.value], name: '全厂平均', areaStyle: { color: 'rgba(47,111,237,0.25)' }, lineStyle: { color: '#2f6fed' }, itemStyle: { color: '#2f6fed' } }] }]
}))

// 各作业区提交率与逾期
const zoneSubmitOption = computed(() => {
  const zones = [...new Set(staff.value.map((e) => e.department))]
  const submitRates = []
    const overdueArr = []
  zones.forEach((z) => {
    const emps = staff.value.filter((e) => e.department === z)
    const total = emps.length * daysInMonth.value
    const submitted = emps.reduce((s, e) => s + store.byUser(e.user_id).filter((r) => r.status !== 'DRAFT' && inMonth(r.report_date)).length, 0)
    submitRates.push(total ? Math.round((submitted / total) * 100) : 0)
    overdueArr.push(emps.filter((e) => !store.byUser(e.user_id).some((r) => r.report_date === lastDayStr.value)).length)
  })
  return {
    textStyle: { color: AXIS_LABEL },
    tooltip: { ...tooltipStyle, trigger: 'axis' },
    legend: { data: ['提交率(%)', '逾期人数'], textStyle: { color: AXIS_LABEL }, top: 0 },
    grid: { left: 40, right: 16, top: 36, bottom: 28 },
    xAxis: { type: 'category', data: zones, axisLabel: { color: AXIS_LABEL }, axisLine: { lineStyle: { color: AXIS_LINE } }, splitLine: { show: false } },
    yAxis: [
      { type: 'value', max: 100, axisLabel: { color: AXIS_LABEL, formatter: '{value}%' }, axisLine: { lineStyle: { color: AXIS_LINE } }, splitLine: { lineStyle: { color: SPLIT } } },
      { type: 'value', axisLabel: { color: AXIS_LABEL }, axisLine: { lineStyle: { color: AXIS_LINE } }, splitLine: { show: false } }
    ],
    series: [
      { name: '提交率(%)', type: 'bar', data: submitRates, itemStyle: { color: '#2f6fed', borderRadius: [6, 6, 0, 0] }, barWidth: '40%' },
      { name: '逾期人数', type: 'line', yAxisIndex: 1, data: overdueArr, itemStyle: { color: '#f56c6c' }, lineStyle: { width: 3 }, symbol: 'circle', symbolSize: 7 }
    ]
  }
})

// 本月日均分趋势
const dailyScoreOption = computed(() => {
  const days = []
  const vals = []
  for (let d = 1; d <= daysInMonth.value; d++) {
    const date = `${ym.value}-${String(d).padStart(2, '0')}`
    const dayScores = approvedReports.value.filter((r) => r.report_date === date).map((r) => r.approval.score_total)
    days.push(d)
    vals.push(dayScores.length ? Math.round((dayScores.reduce((a, b) => a + b, 0) / dayScores.length) * 2) / 2 : null)
  }
  return {
    textStyle: { color: AXIS_LABEL },
    tooltip: { ...tooltipStyle, trigger: 'axis' },
    grid: { left: 40, right: 16, top: 20, bottom: 28 },
    xAxis: { type: 'category', data: days, axisLabel: { color: AXIS_LABEL }, axisLine: { lineStyle: { color: AXIS_LINE } }, splitLine: { show: false } },
    yAxis: { type: 'value', min: 0, max: 10, axisLabel: { color: AXIS_LABEL }, axisLine: { lineStyle: { color: AXIS_LINE } }, splitLine: { lineStyle: { color: SPLIT } } },
    series: [{ type: 'line', data: vals, smooth: true, connectNulls: true, areaStyle: { color: 'rgba(20,184,166,0.18)' }, itemStyle: { color: '#14b8a6' }, lineStyle: { width: 3, color: '#14b8a6' }, symbol: 'circle', symbolSize: 6 }]
  }
})

// 申诉流转分布
const appealPieOption = computed(() => {
  const pending = appealStore.pendingForFactory().length
  const decided = appealStore.list.filter((a) => a.status === 'FACTORY_DECIDED').length
  return {
    textStyle: { color: AXIS_LABEL },
    tooltip: { ...tooltipStyle, trigger: 'item' },
    legend: { bottom: 0, textStyle: { color: AXIS_LABEL } },
    series: [
      {
        type: 'pie',
        radius: ['42%', '66%'],
        center: ['50%', '45%'],
        data: [
          { name: '待厂级终审', value: pending, itemStyle: { color: '#e6a23c' } },
          { name: '已终结', value: decided, itemStyle: { color: '#2faa6a' } }
        ],
        label: { color: '#303133', formatter: '{b}: {c}' }
      }
    ]
  }
})

// 各作业区评分维度构成（质量/数量/时效 分组柱）
const dimByZoneOption = computed(() => {
  const zones = [...new Set(staff.value.map((e) => e.department))]
  const q = [], qu = [], ti = []
  zones.forEach((z) => {
    const reps = approvedReports.value.filter((r) => employeeMap[r.user_id]?.department === z)
    const avg = (arr, key) => (arr.length ? Math.round((arr.reduce((s, r) => s + r.approval[key], 0) / arr.length) * 100) / 100 : 0)
    q.push(avg(reps, 'score_quality'))
    qu.push(avg(reps, 'score_quantity'))
    ti.push(avg(reps, 'score_timeliness'))
  })
  return {
    textStyle: { color: AXIS_LABEL },
    tooltip: { ...tooltipStyle, trigger: 'axis' },
    legend: { data: ['质量', '数量', '时效'], textStyle: { color: AXIS_LABEL }, top: 0 },
    grid: { left: 40, right: 16, top: 36, bottom: 28 },
    xAxis: { type: 'category', data: zones, axisLabel: { color: AXIS_LABEL }, axisLine: { lineStyle: { color: AXIS_LINE } }, splitLine: { show: false } },
    yAxis: { type: 'value', max: 10, axisLabel: { color: AXIS_LABEL }, axisLine: { lineStyle: { color: AXIS_LINE } }, splitLine: { lineStyle: { color: SPLIT } } },
    series: [
      { name: '质量', type: 'bar', data: q, itemStyle: { color: '#2f6fed' }, barWidth: '22%' },
      { name: '数量', type: 'bar', data: qu, itemStyle: { color: '#36c5f0' }, barWidth: '22%' },
      { name: '时效', type: 'bar', data: ti, itemStyle: { color: '#14b8a6' }, barWidth: '22%' }
    ]
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
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 4px 4px 18px;
  border-bottom: 1px solid #eef0f4;
  margin-bottom: 18px;
}
.ch-head-left {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.month-picker {
  width: 150px;
}
.month-picker :deep(.el-input__wrapper) {
  box-shadow: 0 2px 10px rgba(31, 39, 51, 0.06);
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
.ch-user {
  color: #5b6b7f;
  font-size: 13px;
  font-weight: 500;
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
.kpi-cards {
  display: flex;
  flex-wrap: nowrap;
  gap: 16px;
  margin-bottom: 20px;
}
.kpi-cards > .kpi-card {
  flex: 1 1 0;
  min-width: 0;
  background: #fff;
  border: 1px solid #ebeef5 !important;
  box-shadow: 0 2px 10px rgba(31, 39, 51, 0.05);
}
.kpi-card :deep(.el-card__body) {
  padding: 16px 18px;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}
.kpi-card-title {
  font-size: 15px;
  font-weight: 700;
  color: #1f2733;
  padding-bottom: 10px;
  margin-bottom: 12px;
  border-bottom: 1px solid #f0f2f5;
}
.kpi-card-title::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 14px;
  background: linear-gradient(180deg, #2f6fed, #36c5f0);
  border-radius: 2px;
  margin-right: 8px;
  vertical-align: -1px;
}
.kpi-card-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.kpi-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.kpi-item-label {
  color: #606266;
  font-size: 13px;
}
.kpi-item-num {
  font-size: 20px;
  font-weight: 700;
  color: #1f2733;
  letter-spacing: -0.5px;
  white-space: nowrap;
}
.cockpit .el-card {
  background: #fff;
  border: 1px solid #ebeef5 !important;
}
.cockpit .page-section {
  display: flex;
  flex-wrap: wrap;
}
.cockpit .page-section > .el-col {
  display: flex;
}
.cockpit .page-section > .el-col > .el-card {
  flex: 1;
  width: 100%;
}
.cockpit .page-section :deep(.el-card__body) {
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}
</style>
