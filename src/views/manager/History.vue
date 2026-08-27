<template>
  <div>
    <el-card>
      <div class="section-title">已审批记录</div>
      <el-form inline class="page-section">
        <el-form-item label="得分区间">
          <el-select v-model="range" placeholder="全部" clearable style="width: 160px">
            <el-option label="≥9分" value="high" />
            <el-option label="6-8分" value="mid" />
            <el-option label="<6分" value="low" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-input v-model="kw" placeholder="搜索员工姓名" clearable style="width: 180px" />
        </el-form-item>
      </el-form>

      <el-table :data="filtered" border stripe>
        <el-table-column label="员工姓名" width="110">
          <template #default="{ row }">{{ employeeMap[row.user_id]?.real_name }}</template>
        </el-table-column>
        <el-table-column prop="report_date" label="提交日期" width="130" />
        <el-table-column prop="work_items_count" label="工作项数" width="100" align="center" />
        <el-table-column label="综合得分" width="110" align="center">
          <template #default="{ row }"><strong>{{ row.approval?.score_total }}</strong></template>
        </el-table-column>
        <el-table-column label="评语" min-width="200">
          <template #default="{ row }"><span class="text-muted">{{ row.approval?.comment || '—' }}</span></template>
        </el-table-column>
        <el-table-column label="审批时间" width="160">
          <template #default="{ row }">{{ row.approval?.approved_time ? fmt(row.approval.approved_time) : '—' }}</template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="100">
          <template #default="{ row }"><el-button link type="primary" @click="open(row)">查看详情</el-button></template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="vis" :title="current?.report_date + ' 评分详情'" width="560px">
      <el-descriptions :column="1" border v-if="current?.approval">
        <el-descriptions-item label="工作质量">{{ current.approval.score_quality }}</el-descriptions-item>
        <el-descriptions-item label="工作量/饱和度">{{ current.approval.score_quantity }}</el-descriptions-item>
        <el-descriptions-item label="完成及时性">{{ current.approval.score_timeliness }}</el-descriptions-item>
        <el-descriptions-item label="综合得分"><strong>{{ current.approval.score_total }}</strong></el-descriptions-item>
        <el-descriptions-item label="评语">{{ current.approval.comment }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '../../store/auth.js'
import { useReportStore } from '../../store/reports.js'
import { employeeMap } from '../../mock/data.js'

const auth = useAuthStore()
const store = useReportStore()
const range = ref('')
const kw = ref('')
const vis = ref(false)
const current = ref(null)

const rows = computed(() =>
  store.reports.filter((r) => r.status === 'APPROVED' && r.approval?.manager_id === auth.user.user_id)
)
const filtered = computed(() =>
  rows.value
    .filter((r) => {
      if (range.value === 'high') return r.approval.score_total >= 9
      if (range.value === 'mid') return r.approval.score_total >= 6 && r.approval.score_total < 9
      if (range.value === 'low') return r.approval.score_total < 6
      return true
    })
    .filter((r) => !kw.value || employeeMap[r.user_id].real_name.includes(kw.value))
    .sort((a, b) => b.report_date.localeCompare(a.report_date))
)

function fmt(t) {
  const d = new Date(t)
  return `${d.getMonth() + 1}-${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
function open(row) {
  current.value = row
  vis.value = true
}
</script>
