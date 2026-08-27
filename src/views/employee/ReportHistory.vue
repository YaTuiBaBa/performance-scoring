<template>
  <div>
    <el-card>
      <div class="section-title">我的提交记录</div>
      <el-table :data="rows" border stripe>
        <el-table-column prop="report_date" label="提交日期" width="130" />
        <el-table-column prop="work_items_count" label="工作项数" width="100" align="center" />
        <el-table-column label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="statusMeta[row.status].type">{{ statusMeta[row.status].text }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="综合得分" width="110" align="center">
          <template #default="{ row }">
            <span v-if="row.approval">{{ row.approval.score_total }}</span>
            <span v-else class="text-muted">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="manager" label="审批人" width="120" />
        <el-table-column label="操作" fixed="right" width="120">
          <template #default="{ row }">
            <el-button link type="primary" @click="open(row)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

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
import { useAuthStore } from '../../store/auth.js'
import { useReportStore } from '../../store/reports.js'
import { employeeMap } from '../../mock/data.js'

const auth = useAuthStore()
const store = useReportStore()
const router = useRouter()

const statusMeta = {
  DRAFT: { text: '草稿', type: 'info' },
  PENDING: { text: '待审批', type: 'warning' },
  APPROVED: { text: '已评分', type: 'success' },
  REJECTED: { text: '已驳回', type: 'danger' }
}

const rows = computed(() =>
  store
    .byUser(auth.user.user_id)
    .slice()
    .sort((a, b) => b.report_date.localeCompare(a.report_date))
    .map((r) => ({ ...r, manager: r.approval?.manager_id ? employeeMap[r.approval.manager_id]?.real_name : '—' }))
)

const vis = ref(false)
const current = ref(null)
function open(row) {
  current.value = row
  vis.value = true
}
function resubmit() {
  router.push('/employee/report/create')
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
