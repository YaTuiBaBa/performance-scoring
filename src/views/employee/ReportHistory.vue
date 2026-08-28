<template>
  <div>
    <el-card>
      <div class="section-title">我的提交记录</div>

      <el-form inline class="page-section">
        <el-form-item label="状态">
          <el-select v-model="statusFilter" clearable placeholder="全部" style="width: 140px">
            <el-option v-for="o in statusOptions" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间区间">
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

      <el-table :data="rows" border stripe>
        <el-table-column prop="report_date" label="提交日期" min-width="130" />
        <el-table-column prop="work_items_count" label="工作项数" min-width="100" align="center" />
        <el-table-column label="状态" min-width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="statusMeta[row.status].type">{{ statusMeta[row.status].text }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="综合得分" min-width="110" align="center">
          <template #default="{ row }">
            <span v-if="row.approval">{{ row.approval.score_total }}</span>
            <span v-else class="text-muted">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="manager" label="审批人" min-width="120" />
        <el-table-column label="操作" fixed="right" width="180">
          <template #default="{ row }">
            <el-button link type="primary" @click="open(row)">查看详情</el-button>
            <el-button
              v-if="(row.status === 'APPROVED' || row.status === 'REJECTED') && !appeal.openAppealForReport(auth.user.user_id, row.report_id)"
              link
              type="warning"
              @click="openAppeal(row)"
            >申诉</el-button>
            <el-tag v-else-if="row.status === 'APPROVED' || row.status === 'REJECTED'" type="info" size="small">已申诉</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 对单条日报发起申诉 -->
    <el-dialog v-model="appealVis" title="对日报发起申诉" width="560px">
      <template v-if="appealCurrent">
        <el-alert type="info" :closable="false" style="margin-bottom: 14px">
          申诉对象：{{ appealCurrent.report_date }} 的日报（综合得分 {{ appealCurrent.approval?.score_total }}）。
          流程：班站长复核 → 厂级领导终审。
        </el-alert>
        <el-input
          v-model="appealForm.reason"
          type="textarea"
          :rows="4"
          maxlength="300"
          show-word-limit
          placeholder="请说明你认为得分偏低的原因，例如漏计工作量、异常工况占用时间等"
        />
      </template>
      <template #footer>
        <el-button @click="appealVis = false">取消</el-button>
        <el-button type="primary" :disabled="!appealForm.reason.trim()" @click="submitAppeal">提交申诉</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="vis" :title="current?.report_date + ' 日报详情'" width="640px">
      <template v-if="current">
        <el-descriptions :column="2" border size="small" class="page-section">
          <el-descriptions-item label="状态">
            <el-tag :type="statusMeta[current.status].type">{{ statusMeta[current.status].text }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="综合得分">{{ current.approval?.score_total || '—' }}</el-descriptions-item>
        </el-descriptions>

        <div class="section-title">工作内容</div>
        <div v-for="(d, i) in current.details" :key="i" class="detail-item">
          <el-tag size="small" type="info">{{ d.duty_category }}</el-tag>
          <span class="detail-desc">{{ d.duty_desc }}</span>
          <div class="text-muted">完成：{{ d.completion }}</div>
        </div>

        <template v-if="current.approval">
          <div class="section-title">评分详情</div>
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="工作质量">{{ current.approval.score_quality }}</el-descriptions-item>
            <el-descriptions-item label="工作量/饱和度">{{ current.approval.score_quantity }}</el-descriptions-item>
            <el-descriptions-item label="完成及时性">{{ current.approval.score_timeliness }}</el-descriptions-item>
            <el-descriptions-item label="领导评语">{{ current.approval.comment || '—' }}</el-descriptions-item>
            <el-descriptions-item v-if="current.approval.reject_reason" label="驳回原因">
              <span style="color: #f56c6c">{{ current.approval.reject_reason }}</span>
            </el-descriptions-item>
          </el-descriptions>
        </template>
      </template>
      <template #footer>
        <el-button v-if="current?.status === 'REJECTED'" type="primary" @click="resubmit">重新提交</el-button>
        <el-button @click="vis = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { RefreshLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../../store/auth.js'
import { useReportStore } from '../../store/reports.js'
import { useAppealStore } from '../../store/appeals.js'
import { employeeMap } from '../../mock/data.js'

const auth = useAuthStore()
const store = useReportStore()
const appeal = useAppealStore()
const router = useRouter()

const statusMeta = {
  DRAFT: { text: '草稿', type: 'info' },
  PENDING: { text: '待审批', type: 'warning' },
  APPROVED: { text: '已评分', type: 'success' },
  REJECTED: { text: '已驳回', type: 'danger' }
}
const statusOptions = [
  { value: 'DRAFT', label: '草稿' },
  { value: 'PENDING', label: '待审批' },
  { value: 'APPROVED', label: '已评分' },
  { value: 'REJECTED', label: '已驳回' }
]

const defaultMonth = '2026-08'
const today = computed(() => [...store.reports.map((r) => r.report_date)].sort().slice(-1)[0] || '2026-08-27')
const statusFilter = ref('')
const range = ref([`${defaultMonth}-01`, today.value])

const rows = computed(() => {
  const [start, end] = range.value || []
  return store
    .byUser(auth.user.user_id)
    .filter((r) => !statusFilter.value || r.status === statusFilter.value)
    .filter((r) => !start || !end || (r.report_date >= start && r.report_date <= end))
    .slice()
    .sort((a, b) => b.report_date.localeCompare(a.report_date))
    .map((r) => ({ ...r, manager: r.approval?.manager_id ? employeeMap[r.approval.manager_id]?.real_name : '—' }))
})

function reset() {
  statusFilter.value = ''
  range.value = [`${defaultMonth}-01`, today.value]
}

const vis = ref(false)
const current = ref(null)
function open(row) {
  current.value = row
  vis.value = true
}
function resubmit() {
  router.push('/employee/report/create')
}

// 对单条日报发起申诉
const appealVis = ref(false)
const appealCurrent = ref(null)
const appealForm = ref({ reason: '' })
function openAppeal(row) {
  appealCurrent.value = row
  appealForm.value.reason = ''
  appealVis.value = true
}
function submitAppeal() {
  const r = appealCurrent.value
  if (!appealForm.value.reason.trim()) return
  appeal.submit({
    user_id: auth.user.user_id,
    reason: appealForm.value.reason.trim(),
    score: r.approval?.score_total,
    report_id: r.report_id,
    report_date: r.report_date,
    report_score: r.approval?.score_total
  })
  appealVis.value = false
  ElMessage.success('申诉已提交，等待班站长复核')
}
</script>

<style scoped>
.detail-item {
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 8px 12px;
  margin-bottom: 8px;
}
.detail-desc {
  margin: 0 8px;
  font-weight: 500;
}
</style>
