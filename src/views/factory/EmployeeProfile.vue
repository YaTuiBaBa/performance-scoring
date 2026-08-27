<template>
  <div v-if="emp">
    <el-card class="page-section">
      <el-descriptions :column="4" border>
        <el-descriptions-item label="姓名">{{ emp.real_name }}</el-descriptions-item>
        <el-descriptions-item label="岗位">{{ posName }}</el-descriptions-item>
        <el-descriptions-item label="部门">{{ emp.department }}</el-descriptions-item>
        <el-descriptions-item label="入职日期">{{ emp.entry_date }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-row :gutter="16" class="page-section">
      <el-col :span="6"><el-card class="stat-card"><div class="text-muted">总提交次数</div><div class="big-number">{{ approved.length }}</div></el-card></el-col>
      <el-col :span="6"><el-card class="stat-card"><div class="text-muted">总均分</div><div class="big-number">{{ totalAvg }}</div></el-card></el-col>
      <el-col :span="6"><el-card class="stat-card"><div class="text-muted">最高分</div><div class="big-number" style="color: #67c23a">{{ maxS }}</div></el-card></el-col>
      <el-col :span="6"><el-card class="stat-card"><div class="text-muted">最低分</div><div class="big-number" style="color: #f56c6c">{{ minS }}</div></el-card></el-col>
    </el-row>

    <el-row :gutter="16" class="page-section">
      <el-col :span="12">
        <el-card>
          <div class="section-title">近 12 个月均分趋势</div>
          <ChartBox :option="trendOption" :height="260" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <div class="section-title">每日明细</div>
          <el-timeline>
            <el-timeline-item v-for="r in details" :key="r.report_id" :timestamp="r.report_date" :type="r.status === 'APPROVED' ? 'success' : r.status === 'REJECTED' ? 'danger' : 'warning'">
              <span v-if="r.approval">综合 {{ r.approval.score_total }} 分 · {{ r.approval.comment }}</span>
              <span v-else class="text-muted">待审批 / {{ statusText[r.status] }}</span>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>
  </div>
  <el-empty v-else description="未找到该员工" />
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useReportStore } from '../../store/reports.js'
import { employeeMap, positionMap } from '../../mock/data.js'
import ChartBox from '../../components/ChartBox.vue'

const route = useRoute()
const store = useReportStore()
const uid = route.params.userId
const emp = computed(() => employeeMap[uid])
const posName = computed(() => (emp.value ? positionMap[emp.value.primary_position_id]?.position_name : ''))
const list = computed(() => store.byUser(uid).filter((r) => r.status === 'APPROVED' && r.approval))
const approved = list
const totalAvg = computed(() => (approved.value.length ? Math.round((approved.value.reduce((s, r) => s + r.approval.score_total, 0) / approved.value.length) * 2) / 2 : 0))
const maxS = computed(() => (approved.value.length ? Math.max(...approved.value.map((r) => r.approval.score_total)) : 0))
const minS = computed(() => (approved.value.length ? Math.min(...approved.value.map((r) => r.approval.score_total)) : 0))
const details = computed(() => store.byUser(uid).slice().sort((a, b) => b.report_date.localeCompare(a.report_date)))
const statusText = { DRAFT: '草稿', PENDING: '待审批', REJECTED: '已驳回' }

const trendOption = computed(() => {
  // 演示：将本月数据复制为近12月示意
  const months = []
  const data = []
  for (let i = 11; i >= 0; i--) {
    const m = new Date(2026, 7 - i, 1)
    months.push(`${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`)
    const base = totalAvg.value || 8
    data.push(Math.round((base + (i % 3 === 0 ? -0.4 : i % 2 ? 0.3 : 0)) * 2) / 2)
  }
  return {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: months },
    yAxis: { type: 'value', min: 0, max: 10 },
    series: [{ type: 'line', data, smooth: true, areaStyle: { color: 'rgba(47,111,237,0.12)' }, itemStyle: { color: '#2f6fed' }, lineStyle: { width: 3, color: '#2f6fed' }, symbol: 'circle', symbolSize: 6 }]
  }
})
</script>
