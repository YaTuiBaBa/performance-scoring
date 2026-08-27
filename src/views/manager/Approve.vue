<template>
  <div v-if="report">
    <!-- 员工信息区 -->
    <el-card class="page-section">
      <el-descriptions :column="4" border>
        <el-descriptions-item label="员工姓名">{{ emp.real_name }}</el-descriptions-item>
        <el-descriptions-item label="岗位">{{ posName }}</el-descriptions-item>
        <el-descriptions-item label="部门">{{ emp.department }} / {{ emp.station }}</el-descriptions-item>
        <el-descriptions-item label="提交日期">{{ report.report_date }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 工作内容区 -->
    <el-card class="page-section">
      <div class="section-title">当日工作内容</div>
      <div v-for="(d, i) in report.details" :key="i" class="detail-item">
        <el-tag size="small" type="info">{{ d.duty_category }}</el-tag>
        <span class="detail-desc">{{ d.duty_desc }}</span>
        <div class="text-muted">完成：{{ d.completion }}</div>
      </div>
    </el-card>

    <!-- 评分区 -->
    <el-card class="page-section">
      <div class="section-title">多维度评分</div>
      <div class="score-row">
        <span class="score-label">工作质量（权重 40%）</span>
        <el-slider v-model="q" :min="0" :max="10" :step="0.5" show-input class="score-slider" />
        <span class="score-val">{{ q }}</span>
      </div>
      <div class="score-row">
        <span class="score-label">工作量/饱和度（35%）</span>
        <el-slider v-model="qu" :min="0" :max="10" :step="0.5" show-input class="score-slider" />
        <span class="score-val">{{ qu }}</span>
      </div>
      <div class="score-row">
        <span class="score-label">完成及时性（25%）</span>
        <el-slider v-model="ti" :min="0" :max="10" :step="0.5" show-input class="score-slider" />
        <span class="score-val">{{ ti }}</span>
      </div>
      <div class="score-summary">
        <div class="ss-formula">综合得分 = 质量×40% + 工作量×35% + 及时性×25%</div>
        <div class="ss-total">
          <span class="ss-num">{{ total }}</span>
          <span class="ss-unit">分</span>
        </div>
      </div>
    </el-card>

    <!-- 评语区 -->
    <el-card class="page-section">
      <div class="section-title">评语</div>
      <div class="quick">
        <el-tag v-for="c in quickComments" :key="c" class="quick-tag" @click="comment = c">{{ c }}</el-tag>
      </div>
      <el-input v-model="comment" type="textarea" :rows="3" maxlength="500" show-word-limit placeholder="填写评语（500字以内）" />
    </el-card>

    <!-- 操作区 -->
    <div class="actions">
      <el-button @click="storeDraft">暂存</el-button>
      <el-button type="danger" @click="reject">驳回</el-button>
      <el-button type="primary" @click="pass">通过并评分</el-button>
    </div>
  </div>
  <el-empty v-else description="未找到该日报" />
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '../../store/auth.js'
import { useReportStore } from '../../store/reports.js'
import { employeeMap, positionMap, calcTotal } from '../../mock/data.js'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const store = useReportStore()

const report = computed(() => store.byId(route.params.reportId))
const emp = computed(() => (report.value ? employeeMap[report.value.user_id] : null))
const posName = computed(() => (emp.value ? positionMap[emp.value.primary_position_id]?.position_name : ''))

const q = ref(8.5)
const qu = ref(8)
const ti = ref(8.5)
const comment = ref('')
// 若该日报已有暂存草稿，则回显，便于领导继续评分
if (report.value?.approval_draft) {
  q.value = report.value.approval_draft.score_quality ?? q.value
  qu.value = report.value.approval_draft.score_quantity ?? qu.value
  ti.value = report.value.approval_draft.score_timeliness ?? ti.value
  comment.value = report.value.approval_draft.comment || ''
}
const total = computed(() => calcTotal(q.value, qu.value, ti.value))
const quickComments = ['工作认真负责，质量高', '效率有待提高', '工作量饱满，表现优秀', '注意安全生产规范', '数据录取准确，值得表扬']

function pass() {
  ElMessageBox.confirm('确认提交评分？提交后不可修改', '提示', { type: 'warning' })
    .then(() => {
      store.approve(report.value.report_id, {
        score_quality: q.value,
        score_quantity: qu.value,
        score_timeliness: ti.value,
        score_total: total.value,
        comment: comment.value || '—',
        manager_id: auth.user.user_id,
        approved_time: new Date().toISOString(),
        reject_reason: null
      })
      ElMessage.success('评分已提交')
      router.push('/manager/pending')
    })
    .catch(() => {})
}
function reject() {
  ElMessageBox.prompt('请填写驳回原因', '驳回', { inputType: 'textarea', inputValidator: (v) => (v && v.trim() ? true : '驳回原因必填') })
    .then(({ value }) => {
      store.reject(report.value.report_id, value)
      ElMessage.success('已驳回，员工可重新提交')
      router.push('/manager/pending')
    })
    .catch(() => {})
}
function storeDraft() {
  store.saveDraft(report.value.report_id, {
    score_quality: q.value,
    score_quantity: qu.value,
    score_timeliness: ti.value,
    comment: comment.value,
    draft_time: new Date().toISOString()
  })
  ElMessage.success('评分草稿已暂存，可在待办审批台「暂存」中继续')
}
</script>

<style scoped>
.detail-item {
  border: 1px solid var(--ps-border);
  border-radius: var(--ps-r-md);
  padding: 10px 14px;
  margin-bottom: 10px;
  background: var(--ps-surface);
}
.detail-item:hover {
  border-color: var(--ps-primary-light-7, #b9d0fb);
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
}
.score-slider {
  flex: 1;
}
.score-val {
  width: 50px;
  text-align: right;
  font-weight: 700;
  color: var(--ps-primary);
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
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
