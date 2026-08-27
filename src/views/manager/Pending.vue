<template>
  <div>
    <el-card class="stat-strip page-section">
      <div class="stat-item">
        <span class="stat-ico" style="background: var(--ps-warning-soft); color: var(--ps-warning)"><el-icon><Bell /></el-icon></span>
        <div class="stat-text"><div class="stat-num" style="color: var(--ps-warning)">{{ pending.length }}</div><div class="text-muted">待审批总数</div></div>
      </div>
      <div class="stat-item">
        <span class="stat-ico" style="background: var(--ps-success-soft); color: var(--ps-success)"><el-icon><CircleCheck /></el-icon></span>
        <div class="stat-text"><div class="stat-num" style="color: var(--ps-success)">{{ todayApproved }}</div><div class="text-muted">今日已批</div></div>
      </div>
      <div class="stat-item">
        <span class="stat-ico" style="background: var(--ps-danger-soft); color: var(--ps-danger)"><el-icon><Warning /></el-icon></span>
        <div class="stat-text"><div class="stat-num" style="color: var(--ps-danger)">{{ overdue }}</div><div class="text-muted">逾期未报人数</div></div>
      </div>
    </el-card>

    <el-card>
      <el-tabs v-model="activeTab">
        <el-tab-pane name="pending">
          <template #label><span>待审批 <el-badge :value="pending.length" :hidden="!pending.length" type="warning" class="tab-badge" /></span></template>
          <el-form inline class="page-section">
            <el-form-item label="部门/班站">
              <el-select v-model="dept" placeholder="全部" clearable style="width: 160px">
                <el-option v-for="d in deptOptions" :key="d" :label="d" :value="d" />
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
            <el-table-column label="岗位" width="110">
              <template #default="{ row }">{{ posName(row.user_id) }}</template>
            </el-table-column>
            <el-table-column prop="report_date" label="提交日期" width="130" />
            <el-table-column label="提交时间" width="160">
              <template #default="{ row }">{{ row.submit_time ? fmt(row.submit_time) : '—' }}</template>
            </el-table-column>
            <el-table-column prop="work_items_count" label="工作项数" width="100" align="center" />
            <el-table-column label="等待时长" width="120">
              <template #default="{ row }">{{ wait(row.submit_time) }}</template>
            </el-table-column>
            <el-table-column label="操作" fixed="right" width="120">
              <template #default="{ row }">
                <el-button type="primary" link @click="approve(row)">审批</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane name="draft">
          <template #label><span>暂存 <el-badge :value="drafts.length" :hidden="!drafts.length" type="info" class="tab-badge" /></span></template>
          <el-alert type="info" :closable="false" class="page-section">
            此处展示您已暂存、尚未提交的评分草稿。点击「继续审批」可回到评分页，已填的分数与评语会自动回显。
          </el-alert>
          <el-table :data="drafts" border stripe>
            <el-table-column label="员工姓名" width="110">
              <template #default="{ row }">{{ employeeMap[row.user_id]?.real_name }}</template>
            </el-table-column>
            <el-table-column label="岗位" width="110">
              <template #default="{ row }">{{ posName(row.user_id) }}</template>
            </el-table-column>
            <el-table-column prop="report_date" label="提交日期" width="130" />
            <el-table-column label="暂存得分" width="120" align="center">
              <template #default="{ row }">
                <el-tag type="info" effect="plain">{{ draftTotal(row) }} 分</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="暂存时间" width="170">
              <template #default="{ row }">{{ row.approval_draft?.draft_time ? fmt(row.approval_draft.draft_time) : '—' }}</template>
            </el-table-column>
            <el-table-column label="操作" fixed="right" width="160">
              <template #default="{ row }">
                <el-button type="primary" link @click="approve(row)">继续审批</el-button>
                <el-button link type="danger" @click="dropDraft(row)">放弃</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!drafts.length" description="暂无评分草稿" />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Bell, CircleCheck, Warning } from '@element-plus/icons-vue'
import { useAuthStore } from '../../store/auth.js'
import { useReportStore } from '../../store/reports.js'
import { employeeMap, positionMap, calcTotal } from '../../mock/data.js'

const auth = useAuthStore()
const store = useReportStore()
const router = useRouter()

const myStaff = computed(() => Object.values(employeeMap).filter((e) => e.leader_id === auth.user.user_id))
const pending = computed(() =>
  store.reports.filter((r) => r.status === 'PENDING' && myStaff.value.some((e) => e.user_id === r.user_id))
)
const todayApproved = computed(() => store.reports.filter((r) => r.status === 'APPROVED' && r.approval?.manager_id === auth.user.user_id && (r.approval.approved_time || '').includes('2026-08-26')).length)
const overdue = computed(() => myStaff.value.filter((e) => !store.reports.some((r) => r.user_id === e.user_id && r.report_date === '2026-08-26')).length)

const dept = ref('')
const kw = ref('')
const activeTab = ref('pending')
const deptOptions = computed(() => [...new Set(myStaff.value.map((e) => e.department + ' / ' + e.station))])

// 评分草稿：状态仍为待审批、但已保存评分草稿的报告
const drafts = computed(() =>
  store.reports
    .filter((r) => r.status === 'PENDING' && r.approval_draft && myStaff.value.some((e) => e.user_id === r.user_id))
    .sort((a, b) => b.report_date.localeCompare(a.report_date))
)
function draftTotal(row) {
  const d = row.approval_draft
  return d ? calcTotal(d.score_quality, d.score_quantity, d.score_timeliness) : '—'
}
function dropDraft(row) {
  ElMessageBox.confirm('确定放弃该评分草稿？此操作不可恢复', '放弃草稿', { type: 'warning' })
    .then(() => {
      const r = store.byId(row.report_id)
      if (r) delete r.approval_draft
      ElMessage.success('已放弃草稿')
    })
    .catch(() => {})
}

const filtered = computed(() =>
  pending.value
    .filter((r) => !dept.value || employeeMap[r.user_id].department + ' / ' + employeeMap[r.user_id].station === dept.value)
    .filter((r) => !kw.value || employeeMap[r.user_id].real_name.includes(kw.value))
    .sort((a, b) => b.report_date.localeCompare(a.report_date))
)

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
  router.push('/manager/approve/' + row.report_id)
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
</style>
