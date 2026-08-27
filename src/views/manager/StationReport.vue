<template>
  <div>
    <el-row :gutter="16" class="page-section">
      <el-col :span="6"><el-card class="stat-card"><div class="text-muted">下属人数</div><div class="big-number">{{ staff.length }}</div></el-card></el-col>
      <el-col :span="6"><el-card class="stat-card"><div class="text-muted">本月均分</div><div class="big-number">{{ avgAll }}</div></el-card></el-col>
      <el-col :span="6"><el-card class="stat-card"><div class="text-muted">本月提交率</div><div class="big-number" style="color: #67c23a">{{ submitRate }}%</div></el-card></el-col>
      <el-col :span="6"><el-card class="stat-card"><div class="text-muted">最高/最低分</div><div class="big-number">{{ maxAll }} / <span style="color: #f56c6c">{{ minAll }}</span></div></el-card></el-col>
    </el-row>

    <el-row :gutter="16" class="page-section">
      <el-col :span="14">
        <el-card>
          <div class="section-title">员工排名榜（按本月均分）</div>
          <el-table :data="ranking" border stripe @row-click="(r) => goProfile(r.user_id)">
            <el-table-column type="index" label="排名" width="70" align="center" />
            <el-table-column label="姓名" width="100"><template #default="{ row }">{{ employeeMap[row.user_id].real_name }}</template></el-table-column>
            <el-table-column label="岗位" width="100"><template #default="{ row }">{{ posName(row.user_id) }}</template></el-table-column>
            <el-table-column prop="total_avg_score" label="均分" width="90" align="center">
              <template #default="{ row }"><strong>{{ row.total_avg_score }}</strong></template>
            </el-table-column>
            <el-table-column prop="approved_count" label="提交次数" align="center" />
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card>
          <div class="section-title">低分预警（均分 &lt; 6）</div>
          <el-empty v-if="!warning.length" description="无低分预警" :image-size="80" />
          <el-alert v-for="w in warning" :key="w.user_id" type="error" :closable="false" class="page-section">
            {{ employeeMap[w.user_id].real_name }} — 均分 {{ w.total_avg_score }}
          </el-alert>
        </el-card>
      </el-col>
    </el-row>

    <el-card>
      <div class="section-title">本月每日提交率趋势</div>
      <ChartBox :option="trendOption" :height="280" />
    </el-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../store/auth.js'
import { useReportStore } from '../../store/reports.js'
import { employeeMap, positionMap } from '../../mock/data.js'
import ChartBox from '../../components/ChartBox.vue'

const auth = useAuthStore()
const store = useReportStore()
const router = useRouter()

const staff = computed(() => Object.values(employeeMap).filter((e) => e.leader_id === auth.user.user_id))
const scores = computed(() =>
  staff.value
    .map((e) => {
      const list = store.byUser(e.user_id).filter((r) => r.status === 'APPROVED' && r.approval)
      const avg = list.length ? Math.round((list.reduce((s, r) => s + r.approval.score_total, 0) / list.length) * 2) / 2 : 0
      return { user_id: e.user_id, total_avg_score: avg, approved_count: list.length }
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
const warning = computed(() => ranking.value.filter((r) => r.total_avg_score < 6))

function posName(uid) {
  return positionMap[employeeMap[uid].primary_position_id]?.position_name
}
function goProfile(uid) {
  router.push('/dashboard/employee/' + uid)
}

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
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: days },
    yAxis: { type: 'value', min: 0, max: 100, axisLabel: { formatter: '{value}%' } },
    series: [{ type: 'line', data: rates, smooth: true, areaStyle: {}, itemStyle: { color: '#67c23a' } }]
  }
})
</script>
