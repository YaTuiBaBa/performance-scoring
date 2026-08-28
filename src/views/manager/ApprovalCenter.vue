<template>
  <div>
    <!-- 审批概览统计 -->
    <el-card class="stat-strip page-section">
      <div class="stat-item">
        <span class="stat-ico" style="background: var(--ps-warning-soft); color: var(--ps-warning)"><el-icon><Bell /></el-icon></span>
        <div class="stat-text"><div class="stat-num" style="color: var(--ps-warning)">{{ pendingReports.length }}</div><div class="text-muted">待审批日报</div></div>
      </div>
      <div class="stat-item">
        <span class="stat-ico" style="background: var(--ps-danger-soft); color: var(--ps-danger)"><el-icon><ChatLineSquare /></el-icon></span>
        <div class="stat-text"><div class="stat-num" style="color: var(--ps-danger)">{{ pendingAppeals.length }}</div><div class="text-muted">{{ isFactoryLeader ? '待终审申诉' : '待复核申诉' }}</div></div>
      </div>
      <div class="stat-item">
        <span class="stat-ico" style="background: var(--ps-success-soft); color: var(--ps-success)"><el-icon><CircleCheck /></el-icon></span>
        <div class="stat-text"><div class="stat-num" style="color: var(--ps-success)">{{ todayApproved }}</div><div class="text-muted">本月已批</div></div>
      </div>
      <div class="stat-item">
        <span class="stat-ico" style="background: #f0f2f5; color: #909399"><el-icon><Warning /></el-icon></span>
        <div class="stat-text"><div class="stat-num" style="color: #909399">{{ overdue }}</div><div class="text-muted">逾期未报人数</div></div>
      </div>
    </el-card>

    <!-- 按审批类型分 tab -->
    <el-card>
      <el-tabs v-model="activeType">
        <!-- 类型一：日报审批 -->
        <el-tab-pane name="report">
          <template #label><span>日报审批 <el-badge :value="pendingReports.length" :hidden="!pendingReports.length" type="warning" class="tab-badge" /></span></template>

          <el-form inline class="page-section">
            <el-form-item label="时间区间">
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                value-format="YYYY-MM-DD"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                style="width: 260px"
              />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="statusFilter" clearable placeholder="全部" style="width: 140px">
                <el-option v-for="o in statusOptions" :key="o.value" :label="o.label" :value="o.value" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-input v-model="kw" placeholder="搜索员工姓名" clearable style="width: 180px" />
            </el-form-item>
          </el-form>

          <el-table :data="filteredReports" border stripe>
            <el-table-column label="员工姓名" width="110">
              <template #default="{ row }">{{ employeeMap[row.user_id]?.real_name }}</template>
            </el-table-column>
            <el-table-column label="岗位" width="110">
              <template #default="{ row }">{{ posName(row.user_id) }}</template>
            </el-table-column>
            <el-table-column prop="report_date" label="提交日期" width="130" />
            <el-table-column label="提交时间" width="160">
              <template #default="{ row }">{{ row.submit_time ? fmt(row.submit_time) : '—' }}</template>
            </el-table-column>
            <el-table-column prop="work_items_count" label="工作项数" width="100" align="center" />
            <el-table-column label="状态" width="110" align="center">
              <template #default="{ row }">
                <el-tag :type="statusMeta[row.status].type">{{ statusMeta[row.status].text }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="综合得分" width="100" align="center">
              <template #default="{ row }"><strong>{{ row.approval?.score_total ?? '—' }}</strong></template>
            </el-table-column>
            <el-table-column label="操作" fixed="right" width="120">
              <template #default="{ row }">
                <el-button v-if="row.status === 'PENDING'" type="primary" link @click="approve(row)">审批</el-button>
                <el-button v-else type="primary" link @click="openDetail(row)">查看详情</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!filteredReports.length" description="当前筛选条件下暂无日报" />
        </el-tab-pane>

        <!-- 类型二：申诉复核 / 终审 -->
        <el-tab-pane name="appeal">
          <template #label><span>{{ isFactoryLeader ? '申诉终审' : '申诉复核' }} <el-badge :value="pendingAppeals.length" :hidden="!pendingAppeals.length" type="danger" class="tab-badge" /></span></template>
          <el-alert type="info" :closable="false" style="margin-bottom: 12px">
            <template v-if="isFactoryLeader">班站长复核上报后的申诉在此终审，终审后即流程结束。</template>
            <template v-else>员工提交申诉后在此复核；无论同意与否，均上报厂级领导终审。</template>
          </el-alert>
          <el-empty v-if="!pendingAppeals.length" :description="isFactoryLeader ? '暂无待您终审的申诉' : '暂无待您复核的申诉'" />
          <el-table v-else :data="pendingAppeals" border stripe>
            <el-table-column label="申诉人" width="110">
              <template #default="{ row }">{{ employeeMap[row.user_id]?.real_name }}</template>
            </el-table-column>
            <el-table-column label="当前月均分" width="110" align="center">
              <template #default="{ row }">{{ row.score }}</template>
            </el-table-column>
            <el-table-column label="申诉理由" min-width="200">
              <template #default="{ row }">{{ row.reason }}</template>
            </el-table-column>
            <el-table-column label="提交时间" width="150">
              <template #default="{ row }">{{ fmt(row.create_time) }}</template>
            </el-table-column>
            <el-table-column label="操作" fixed="right" width="200">
              <template #default="{ row }">
                <div class="op">
                  <template v-if="isFactoryLeader">
                    <el-button type="success" link @click="review(row, 'ADOPT')">采纳</el-button>
                    <el-button type="danger" link @click="review(row, 'REJECT')">驳回</el-button>
                  </template>
                  <template v-else>
                    <el-button type="success" link @click="review(row, 'AGREE')">同意并上报</el-button>
                    <el-button type="warning" link @click="review(row, 'DISAGREE')">不同意并上报</el-button>
                  </template>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 日报审批弹窗（不跳页） -->
    <el-dialog v-model="approveVis" :title="curReport ? curReport.report_date + ' 日报审批' : '审批'" width="760px" top="5vh">
      <template v-if="curReport">
        <el-descriptions :column="3" border size="small" class="page-section">
          <el-descriptions-item label="员工姓名">{{ emp.real_name }}</el-descriptions-item>
          <el-descriptions-item label="岗位">{{ posName(curReport.user_id) }}</el-descriptions-item>
          <el-descriptions-item label="部门">{{ emp.department }} / {{ emp.station }}</el-descriptions-item>
        </el-descriptions>

        <div class="section-title">当日工作内容</div>
        <div v-for="(d, i) in curReport.details" :key="i" class="detail-item">
          <el-tag size="small" type="info">{{ d.duty_category }}</el-tag>
          <span class="detail-desc">{{ d.duty_desc }}</span>
          <div class="text-muted">完成：{{ d.completion }}</div>
        </div>

        <div class="section-title">多维度评分</div>
        <div class="score-row">
          <span class="score-label">工作质量（权重 40%）</span>
          <el-slider v-model="q" :min="0" :max="10" :step="0.5" show-input class="score-slider" />
        </div>
        <div class="score-row">
          <span class="score-label">工作量/饱和度（35%）</span>
          <el-slider v-model="qu" :min="0" :max="10" :step="0.5" show-input class="score-slider" />
        </div>
        <div class="score-row">
          <span class="score-label">完成及时性（25%）</span>
          <el-slider v-model="ti" :min="0" :max="10" :step="0.5" show-input class="score-slider" />
        </div>
        <div class="score-summary">
          <div class="ss-formula">综合得分 = 质量×40% + 工作量×35% + 及时性×25%</div>
          <div class="ss-total"><span class="ss-num">{{ total }}</span><span class="ss-unit">分</span></div>
        </div>

        <div class="section-title">评语</div>
        <div class="quick">
          <el-tag v-for="c in quickComments" :key="c" class="quick-tag" @click="comment = c">{{ c }}</el-tag>
        </div>
        <el-input v-model="comment" type="textarea" :rows="3" maxlength="500" show-word-limit placeholder="填写评语（500字以内）" />
      </template>
      <template #footer>
        <el-button @click="storeDraft" :disabled="!curReport">暂存</el-button>
        <el-button type="danger" @click="reject" :disabled="!curReport">驳回</el-button>
        <el-button type="primary" @click="pass" :disabled="!curReport">通过并评分</el-button>
      </template>
    </el-dialog>

    <!-- 已审批 / 已驳回 详情（只读） -->
    <el-dialog v-model="detailVis" :title="currentDetail ? currentDetail.report_date + ' 评分详情' : '详情'" width="560px">
      <template v-if="currentDetail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="员工姓名">{{ employeeMap[currentDetail.user_id]?.real_name }}</el-descriptions-item>
          <el-descriptions-item label="工作质量">{{ currentDetail.approval?.score_quality }}</el-descriptions-item>
          <el-descriptions-item label="工作量/饱和度">{{ currentDetail.approval?.score_quantity }}</el-descriptions-item>
          <el-descriptions-item label="完成及时性">{{ currentDetail.approval?.score_timeliness }}</el-descriptions-item>
          <el-descriptions-item label="综合得分"><strong>{{ currentDetail.approval?.score_total }}</strong></el-descriptions-item>
          <el-descriptions-item label="评语">{{ currentDetail.approval?.comment || '—' }}</el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.status === 'REJECTED' && currentDetail.approval?.reject_reason" label="驳回原因">
            <span style="color: #f56c6c">{{ currentDetail.approval.reject_reason }}</span>
          </el-descriptions-item>
        </el-descriptions>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Bell, CircleCheck, Warning, ChatLineSquare } from '@element-plus/icons-vue'
import { useAuthStore } from '../../store/auth.js'
import { useReportStore } from '../../store/reports.js'
import { useAppealStore } from '../../store/appeals.js'
import { employeeMap, positionMap, calcTotal } from '../../mock/data.js'

const auth = useAuthStore()
const store = useReportStore()
const appealStore = useAppealStore()

const activeType = ref('report')

const myStaff = computed(() => Object.values(employeeMap).filter((e) => e.leader_id === auth.user.user_id))
const isFactoryLeader = computed(() => auth.role === 'FACTORY_LEADER')
const pendingReports = computed(() =>
  store.reports.filter((r) => r.status === 'PENDING' && myStaff.value.some((e) => e.user_id === r.user_id))
)
const pendingAppeals = computed(() =>
  isFactoryLeader.value ? appealStore.pendingForFactory() : appealStore.pendingForStation(auth.user.user_id)
)
const todayApproved = computed(() =>
  store.reports.filter(
    (r) => r.status === 'APPROVED' && r.report_date.startsWith('2026-08') && myStaff.value.some((e) => e.user_id === r.user_id)
  ).length
)
const overdue = computed(() => myStaff.value.filter((e) => !store.reports.some((r) => r.user_id === e.user_id && r.report_date === '2026-08-26')).length)

// 日报审批筛选：时间区间（默认当天）+ 状态（默认待审批）
const statusMeta = {
  PENDING: { text: '待审批', type: 'warning' },
  APPROVED: { text: '已评分', type: 'success' },
  REJECTED: { text: '已驳回', type: 'danger' },
  DRAFT: { text: '草稿', type: 'info' }
}
const statusOptions = [
  { value: 'PENDING', label: '待审批' },
  { value: 'APPROVED', label: '已评分' },
  { value: 'REJECTED', label: '已驳回' }
]
const dateRange = ref(['2026-08-01', '2026-08-27'])
const statusFilter = ref('PENDING')
const kw = ref('')

const filteredReports = computed(() => {
  const [start, end] = dateRange.value || []
  return store.reports
    .filter((r) => myStaff.value.some((e) => e.user_id === r.user_id))
    .filter((r) => !statusFilter.value || r.status === statusFilter.value)
    .filter((r) => !start || !end || (r.report_date >= start && r.report_date <= end))
    .filter((r) => !kw.value || employeeMap[r.user_id].real_name.includes(kw.value))
    .sort((a, b) => b.report_date.localeCompare(a.report_date))
})

// 已审批 / 已驳回 详情（只读）
const detailVis = ref(false)
const currentDetail = ref(null)
function openDetail(row) {
  currentDetail.value = row
  detailVis.value = true
}

function posName(uid) {
  return positionMap[employeeMap[uid].primary_position_id]?.position_name
}
function fmt(t) {
  const d = new Date(t)
  return `${d.getMonth() + 1}-${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
function wait(t) {
  if (!t) return '—'
  const diff = Date.now() - new Date(t).getTime()
  const h = Math.floor(diff / 3600000)
  return h > 0 ? `${h} 小时前` : '刚刚'
}
function approve(row) {
  curReport.value = row
  q.value = 8.5
  qu.value = 8
  ti.value = 8.5
  comment.value = ''
  // 回显已有暂存草稿
  if (row.approval_draft) {
    q.value = row.approval_draft.score_quality ?? q.value
    qu.value = row.approval_draft.score_quantity ?? qu.value
    ti.value = row.approval_draft.score_timeliness ?? ti.value
    comment.value = row.approval_draft.comment || ''
  }
  approveVis.value = true
}

// 审批弹窗状态
const approveVis = ref(false)
const curReport = ref(null)
const emp = computed(() => (curReport.value ? employeeMap[curReport.value.user_id] : null))
const q = ref(8.5)
const qu = ref(8)
const ti = ref(8.5)
const comment = ref('')
const total = computed(() => calcTotal(q.value, qu.value, ti.value))
const quickComments = ['工作认真负责，质量高', '效率有待提高', '工作量饱满，表现优秀', '注意安全生产规范', '数据录取准确，值得表扬']

function pass() {
  ElMessageBox.confirm('确认提交评分？提交后不可修改', '提示', { type: 'warning' })
    .then(() => {
      store.approve(curReport.value.report_id, {
        score_quality: q.value,
        score_quantity: qu.value,
        score_timeliness: ti.value,
        score_total: total.value,
        comment: comment.value || '—',
        manager_id: auth.user.user_id,
        approved_time: new Date().toISOString(),
        reject_reason: null
      })
      approveVis.value = false
      ElMessage.success('评分已提交')
    })
    .catch(() => {})
}
function reject() {
  ElMessageBox.prompt('请填写驳回原因', '驳回', { inputType: 'textarea', inputValidator: (v) => (v && v.trim() ? true : '驳回原因必填') })
    .then(({ value }) => {
      store.reject(curReport.value.report_id, value)
      approveVis.value = false
      ElMessage.success('已驳回，员工可重新提交')
    })
    .catch(() => {})
}
function storeDraft() {
  store.saveDraft(curReport.value.report_id, {
    score_quality: q.value,
    score_quantity: qu.value,
    score_timeliness: ti.value,
    comment: comment.value,
    draft_time: new Date().toISOString()
  })
  approveVis.value = false
  ElMessage.success('评分草稿已暂存，可在「暂存」中继续')
}
function review(row, decision) {
  if (isFactoryLeader.value) {
    ElMessageBox.prompt(
      decision === 'ADOPT' ? '请填写终审意见' : '请填写驳回理由',
      '厂级终审',
      { inputType: 'textarea', inputValidator: (v) => (v && v.trim() ? true : '意见必填') }
    )
      .then(({ value }) => {
        appealStore.factoryDecision(row.appeal_id, decision, value)
        ElMessage.success('已终审，流程结束')
      })
      .catch(() => {})
    return
  }
  ElMessageBox.prompt(
    decision === 'AGREE' ? '请填写复核意见（将一并上报厂级）' : '请填写不同意理由',
    '班站长复核',
    { inputType: 'textarea', inputValidator: (v) => (v && v.trim() ? true : '意见必填') }
  )
    .then(({ value }) => {
      appealStore.stationReview(row.appeal_id, decision, value)
      ElMessage.success('已上报厂级领导终审')
    })
    .catch(() => {})
}
</script>

<style scoped>
.stat-strip :deep(.el-card__body) {
  display: flex;
  padding: 14px 8px;
}
.stat-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 26px;
}
.stat-item + .stat-item {
  border-left: 1px solid #eef0f4;
}
.stat-ico {
  width: 42px;
  height: 42px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 21px;
  flex-shrink: 0;
}
.stat-text {
  line-height: 1.2;
}
.stat-num {
  font-size: 24px;
  font-weight: 800;
  line-height: 1.1;
}
.tab-badge {
  margin-left: 4px;
}
.tab-badge :deep(.el-badge__content) {
  border: none;
}
.detail-item {
  border: 1px solid var(--ps-border);
  border-radius: var(--ps-r-md);
  padding: 10px 14px;
  margin-bottom: 10px;
  background: var(--ps-surface);
}
.detail-desc {
  margin: 0 8px;
  font-weight: 500;
}
.score-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 18px;
}
.score-label {
  width: 180px;
  font-weight: 500;
  color: var(--ps-text-2);
  flex-shrink: 0;
}
.score-slider {
  flex: 1;
}
.score-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  padding: 16px 20px;
  border-radius: var(--ps-r-md);
  background: linear-gradient(135deg, #2f6fed, #4f8bff);
  color: #fff;
}
.ss-formula {
  font-size: 13px;
  opacity: 0.92;
}
.ss-total {
  display: flex;
  align-items: baseline;
  gap: 4px;
}
.ss-num {
  font-size: 34px;
  font-weight: 800;
  letter-spacing: -0.5px;
}
.ss-unit {
  font-size: 14px;
  opacity: 0.9;
}
.quick {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}
.quick-tag {
  cursor: pointer;
}
.op {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
</style>
