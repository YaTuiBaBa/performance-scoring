<template>
  <div>
    <el-card>
      <div class="section-title">
        申诉记录
        <el-button type="primary" size="small" :icon="Plus" style="float: right" @click="openCreate">新增申诉</el-button>
      </div>

      <el-form inline class="page-section">
        <el-form-item label="状态">
          <el-select v-model="statusFilter" clearable placeholder="全部" style="width: 150px">
            <el-option v-for="o in statusOptions" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="提交时间">
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
        <el-table-column label="申诉对象" min-width="170">
          <template #default="{ row }">
            <span v-if="row.report_date">{{ row.report_date }} 日报（得分 {{ row.report_score }}）</span>
            <span v-else>整体绩效</span>
          </template>
        </el-table-column>
        <el-table-column label="申诉理由" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">{{ row.reason }}</template>
        </el-table-column>
        <el-table-column label="状态" width="130" align="center">
          <template #default="{ row }">
            <el-tag :type="statusMeta[row.status].type">{{ statusMeta[row.status].text }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="提交时间" width="150">
          <template #default="{ row }">{{ fmt(row.create_time) }}</template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="110">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!filtered.length" description="暂无申诉记录" />
    </el-card>

    <!-- 新增申诉 -->
    <el-dialog v-model="createVis" title="新增申诉" width="560px">
      <el-alert type="info" :closable="false" style="margin-bottom: 14px">
        选择要申诉的日报并填写理由。流程：班站长复核 → 厂级领导（大领导）终审。
      </el-alert>
      <el-form label-width="90px">
        <el-form-item label="申诉日期" required>
          <el-select v-model="createForm.report_id" placeholder="选择要申诉的日报" style="width: 100%">
            <el-option
              v-for="r in appealableReports"
              :key="r.report_id"
              :label="r.report_date + ' 日报（得分 ' + (r.approval?.score_total ?? '—') + '）'"
              :value="r.report_id"
              :disabled="!!appeal.openAppealForReport(uid, r.report_id)"
            />
          </el-select>
          <div v-if="!appealableReports.length" class="text-muted" style="margin-top: 6px">
            暂无可申诉的已审核日报（仅「已评分 / 已驳回」的日报可申诉）。
          </div>
        </el-form-item>
        <el-form-item label="申诉理由" required>
          <el-input
            v-model="createForm.reason"
            type="textarea"
            :rows="4"
            maxlength="300"
            show-word-limit
            placeholder="请说明你认为得分偏低的原因，例如漏计工作量、异常工况占用时间等"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVis = false">取消</el-button>
        <el-button type="primary" :disabled="!createForm.report_id || !createForm.reason.trim()" @click="submitCreate">
          提交申诉
        </el-button>
      </template>
    </el-dialog>

    <!-- 申诉详情 / 审批进程 -->
    <el-dialog v-model="detailVis" title="申诉详情" width="640px">
      <template v-if="detail">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="申诉对象">
            <span v-if="detail.report_date">{{ detail.report_date }} 日报（得分 {{ detail.report_score }}）</span>
            <span v-else>整体绩效</span>
          </el-descriptions-item>
          <el-descriptions-item label="当前状态">
            <el-tag :type="statusMeta[detail.status].type">{{ statusMeta[detail.status].text }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="提交时间" :span="2">{{ fmt(detail.create_time) }}</el-descriptions-item>
          <el-descriptions-item label="申诉理由" :span="2">{{ detail.reason }}</el-descriptions-item>
        </el-descriptions>

        <div class="section-title" style="margin-top: 18px">审批进程</div>
        <el-steps :active="stepActive" align-center finish-status="success">
          <el-step title="提交申诉" :description="fmt(detail.create_time)" />
          <el-step
            :title="detail.station_decision ? (detail.station_decision === 'AGREE' ? '班站长：同意' : '班站长：不同意') : '班站长复核'"
            :description="detail.station_time ? fmt(detail.station_time) + (detail.station_remark ? '｜' + detail.station_remark : '') : '待复核'"
          />
          <el-step
            :title="detail.factory_decision ? (detail.factory_decision === 'ADOPT' ? '厂级：采纳' : '厂级：不采纳') : '厂级领导终审'"
            :description="detail.factory_time ? fmt(detail.factory_time) + (detail.factory_remark ? '｜' + detail.factory_remark : '') : '待终审'"
          />
        </el-steps>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Plus, RefreshLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../../store/auth.js'
import { useReportStore } from '../../store/reports.js'
import { useAppealStore } from '../../store/appeals.js'
import { computeMonthly } from '../../mock/data.js'

const auth = useAuthStore()
const store = useReportStore()
const appeal = useAppealStore()
const uid = auth.user.user_id
const myScore = computed(() => computeMonthly(uid).total_avg_score)

const statusMeta = {
  PENDING_STATION: { text: '待班站长复核', type: 'warning' },
  PENDING_FACTORY: { text: '待厂级终审', type: '' },
  FACTORY_DECIDED: { text: '已终结', type: 'success' }
}
const statusOptions = [
  { value: 'PENDING_STATION', label: '待班站长复核' },
  { value: 'PENDING_FACTORY', label: '待厂级终审' },
  { value: 'FACTORY_DECIDED', label: '已终结' }
]

const defaultMonth = '2026-08'
const today = computed(() => [...appeal.list.map((a) => a.create_time)].sort().slice(-1)[0]?.slice(0, 10) || '2026-08-27')
const statusFilter = ref('')
const range = ref([`${defaultMonth}-01`, today.value])

// 可申诉的已审核日报
const appealableReports = computed(() =>
  store.byUser(uid).filter((r) => ['APPROVED', 'REJECTED'].includes(r.status))
)

const filtered = computed(() => {
  const [start, end] = range.value || []
  return appeal
    .byUser(uid)
    .filter((a) => !statusFilter.value || a.status === statusFilter.value)
    .filter((a) => !start || !end || (a.create_time.slice(0, 10) >= start && a.create_time.slice(0, 10) <= end))
    .slice()
    .sort((a, b) => b.create_time.localeCompare(a.create_time))
})

function reset() {
  statusFilter.value = ''
  range.value = [`${defaultMonth}-01`, today.value]
}

// 新增申诉
const createVis = ref(false)
const createForm = ref({ report_id: '', reason: '' })
function openCreate() {
  createForm.value = { report_id: '', reason: '' }
  createVis.value = true
}
function submitCreate() {
  const r = appealableReports.value.find((x) => x.report_id === createForm.value.report_id)
  if (!r) return
  appeal.submit({
    user_id: uid,
    reason: createForm.value.reason.trim(),
    score: r.approval?.score_total,
    report_id: r.report_id,
    report_date: r.report_date,
    report_score: r.approval?.score_total
  })
  createVis.value = false
  ElMessage.success('申诉已提交，等待班站长复核')
}

// 详情 / 审批进程
const detailVis = ref(false)
const detail = ref(null)
function openDetail(row) {
  detail.value = row
  detailVis.value = true
}
const stepActive = computed(() => {
  const s = detail.value?.status
  if (s === 'PENDING_STATION') return 1
  if (s === 'PENDING_FACTORY') return 2
  if (s === 'FACTORY_DECIDED') return 3
  return 1
})

function fmt(t) {
  const d = new Date(t)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}
</script>

<style scoped>
.el-steps {
  margin-top: 6px;
}
</style>
