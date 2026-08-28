<template>
  <div>
    <el-card>
      <div class="section-title">员工申诉复核（复核后均提交厂级领导终审）</div>
      <el-empty v-if="!list.length" description="暂无待复核申诉" />
      <el-table v-else :data="list" border stripe>
        <el-table-column label="申诉人" width="110">
          <template #default="{ row }">{{ employeeMap[row.user_id]?.real_name }}</template>
        </el-table-column>
        <el-table-column label="针对日报" width="180">
          <template #default="{ row }">
            <span v-if="row.report_date">{{ row.report_date }}（得分 {{ row.report_score }}）</span>
            <span v-else>整体绩效</span>
          </template>
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
            <el-button type="success" link @click="review(row, 'AGREE')">同意并上报</el-button>
            <el-button type="warning" link @click="review(row, 'DISAGREE')">不同意并上报</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '../../store/auth.js'
import { useAppealStore } from '../../store/appeals.js'
import { employeeMap } from '../../mock/data.js'

const auth = useAuthStore()
const store = useAppealStore()
const list = computed(() => store.pendingForStation(auth.user.user_id))

function review(row, decision) {
  ElMessageBox.prompt(
    decision === 'AGREE' ? '请填写复核意见（将一并上报厂级）' : '请填写不同意理由',
    '班站长复核',
    { inputType: 'textarea', inputValidator: (v) => (v && v.trim() ? true : '意见必填') }
  )
    .then(({ value }) => {
      store.stationReview(row.appeal_id, decision, value)
      ElMessage.success('已上报厂级领导终审')
    })
    .catch(() => {})
}
function fmt(t) {
  const d = new Date(t)
  return `${d.getMonth() + 1}-${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>
