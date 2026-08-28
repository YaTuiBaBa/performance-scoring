<template>
  <div>
    <el-card>
      <div class="section-title">作业区日报查询</div>
      <el-alert type="info" :closable="false" style="margin-bottom: 14px">
        按「作业区 / 日期范围」筛选一线员工日报；默认展示本月 1 号至今天（{{ range[0] }} 至 {{ range[1] }}）。点击「查看详情」可下钻当日工作项与领导评分。
      </el-alert>

      <el-form inline class="page-section">
        <el-form-item label="作业区">
          <el-select v-model="zone" placeholder="全部" clearable style="width: 160px">
            <el-option v-for="d in zoneOptions" :key="d" :label="d" :value="d" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="range"
            type="daterange"
            value-format="YYYY-MM-DD"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 260px"
          />
        </el-form-item>
        <el-form-item>
          <el-button :icon="RefreshLeft" @click="reset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="filtered" border stripe>
        <el-table-column prop="report_date" label="日期" width="130" />
        <el-table-column label="员工" width="100">
          <template #default="{ row }">{{ employeeMap[row.user_id]?.real_name }}</template>
        </el-table-column>
        <el-table-column label="岗位" width="110">
          <template #default="{ row }">{{ posName(row.user_id) }}</template>
        </el-table-column>
        <el-table-column label="部门/班站" min-width="150">
          <template #default="{ row }">{{ employeeMap[row.user_id]?.department }} / {{ employeeMap[row.user_id]?.station }}</template>
        </el-table-column>
        <el-table-column prop="work_items_count" label="工作项数" width="100" align="center" />
        <el-table-column label="得分" width="100" align="center">
          <template #default="{ row }">
            <span v-if="row.status === 'APPROVED'" :style="{ color: row.approval.score_total < 6 ? '#f56c6c' : '#303133', fontWeight: 700 }">{{ row.approval.score_total }}</span>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="statusMeta(row.status).type" size="small">{{ statusMeta(row.status).text }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="100">
          <template #default="{ row }">
            <el-button type="primary" link @click="openDetail(row)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!filtered.length" description="该条件下暂无日报" />
    </el-card>

    <!-- 日报详情弹窗 -->
    <el-dialog v-model="detailVisible" title="日报详情" width="640px">
      <template v-if="current">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="员工">{{ employeeMap[current.user_id]?.real_name }}</el-descriptions-item>
          <el-descriptions-item label="日期">{{ current.report_date }}</el-descriptions-item>
          <el-descriptions-item label="岗位">{{ posName(current.user_id) }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusMeta(current.status).type" size="small">{{ statusMeta(current.status).text }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <div class="block-title">工作项明细</div>
        <el-table :data="current.details || []" border size="small">
          <el-table-column prop="duty_category" label="类别" width="110" />
          <el-table-column prop="duty_desc" label="职责/事项" min-width="180" />
          <el-table-column prop="completion" label="完成情况" min-width="200" />
        </el-table>

        <template v-if="current.approval">
          <div class="block-title">领导评分</div>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="质量分">{{ current.approval.score_quality }}</el-descriptions-item>
            <el-descriptions-item label="数量分">{{ current.approval.score_quantity }}</el-descriptions-item>
            <el-descriptions-item label="时效分">{{ current.approval.score_timeliness }}</el-descriptions-item>
            <el-descriptions-item label="合计">{{ current.approval.score_total }}</el-descriptions-item>
            <el-descriptions-item label="评语" :span="2">{{ current.approval.comment || '—' }}</el-descriptions-item>
            <el-descriptions-item v-if="current.approval.reject_reason" label="驳回原因" :span="2">{{ current.approval.reject_reason }}</el-descriptions-item>
          </el-descriptions>
        </template>
        <el-alert v-else type="warning" :closable="false" style="margin-top: 12px">该日报尚未评分。</el-alert>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { RefreshLeft } from '@element-plus/icons-vue'
import { useReportStore } from '../../store/reports.js'
import { employeeMap, positionMap } from '../../mock/data.js'

const store = useReportStore()

const staff = computed(() => Object.values(employeeMap).filter((e) => e.role === 'EMPLOYEE'))
const defaultMonth = '2026-08'
const today = computed(() =>
  [...store.reports.map((r) => r.report_date)].sort().slice(-1)[0] || '2026-08-27'
)
const range = ref([`${defaultMonth}-01`, today.value])
const zone = ref('')

const zoneOptions = computed(() => [...new Set(staff.value.map((e) => e.department))])

const filtered = computed(() => {
  const [start, end] = range.value || []
  return store.reports
    .filter((r) => !start || !end || (r.report_date >= start && r.report_date <= end))
    .filter((r) => !zone.value || employeeMap[r.user_id]?.department === zone.value)
    .sort((a, b) => b.report_date.localeCompare(a.report_date))
})

function reset() {
  zone.value = ''
  range.value = [`${defaultMonth}-01`, today.value]
}
function posName(uid) {
  return positionMap[employeeMap[uid].primary_position_id]?.position_name
}
function statusMeta(s) {
  return (
    {
      APPROVED: { text: '已评分', type: 'success' },
      PENDING: { text: '待审批', type: 'warning' },
      REJECTED: { text: '已驳回', type: 'danger' },
      DRAFT: { text: '草稿', type: 'info' }
    }[s] || { text: s, type: 'info' }
  )
}

const detailVisible = ref(false)
const current = ref(null)
function openDetail(row) {
  current.value = row
  detailVisible.value = true
}
</script>

<style scoped>
.block-title {
  font-weight: 700;
  color: #1f2329;
  margin: 16px 0 8px;
}
</style>
