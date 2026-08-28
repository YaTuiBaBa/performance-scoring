<template>
  <div>
    <el-row :gutter="16" class="page-section">
      <el-col :span="8">
        <el-card class="stat-card">
          <div class="stat-ico" style="background: var(--ps-primary-soft); color: var(--ps-primary)"><el-icon><User /></el-icon></div>
          <div class="stat-meta"><div class="text-muted">应报人数</div><div class="big-number" style="color: var(--ps-primary)">{{ myStaff.length }}</div></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="stat-card">
          <div class="stat-ico" style="background: var(--ps-success-soft); color: var(--ps-success)"><el-icon><CircleCheck /></el-icon></div>
          <div class="stat-meta"><div class="text-muted">已报</div><div class="big-number" style="color: var(--ps-success)">{{ submittedCount }}</div></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="stat-card">
          <div class="stat-ico" style="background: var(--ps-danger-soft); color: var(--ps-danger)"><el-icon><Warning /></el-icon></div>
          <div class="stat-meta"><div class="text-muted">逾期未报/未提交</div><div class="big-number" style="color: var(--ps-danger)">{{ overdue.length }}</div></div>
        </el-card>
      </el-col>
    </el-row>

    <el-card>
      <div class="toolbar">
        <div class="section-title" style="margin: 0">逾期未报 / 未提交清单</div>
        <el-date-picker v-model="theDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width: 180px" @change="recompute" />
      </div>
      <el-alert type="info" :closable="false" class="page-section">
        展示 <b>{{ theDate }}</b> 当天下属中未正式提交日报的人员。点击「催办」可向该员工发送补报提醒。
      </el-alert>

      <el-table :data="overdue" border stripe>
        <el-table-column label="姓名" width="110">
          <template #default="{ row }">{{ row.emp.real_name }}</template>
        </el-table-column>
        <el-table-column label="岗位" width="110">
          <template #default="{ row }">{{ positionMap[row.emp.primary_position_id]?.position_name }}</template>
        </el-table-column>
        <el-table-column label="部门/班站" min-width="160">
          <template #default="{ row }">{{ row.emp.department }}{{ row.emp.station ? ' / ' + row.emp.station : '' }}</template>
        </el-table-column>
        <el-table-column label="最近提交日期" width="150">
          <template #default="{ row }">{{ row.lastDate }}</template>
        </el-table-column>
        <el-table-column label="状态" width="130" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="row.status === 'draft' ? 'warning' : 'danger'">{{ row.status === 'draft' ? '仅草稿未提交' : '未提交' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="140">
          <template #default="{ row }">
            <el-button type="primary" link @click="urge(row)">催办</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!overdue.length" description="当日下属均已提交，无逾期未报" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { User, CircleCheck, Warning } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../../store/auth.js'
import { useReportStore } from '../../store/reports.js'
import { useNoticeStore } from '../../store/notices.js'
import { employeeMap, positionMap } from '../../mock/data.js'

const auth = useAuthStore()
const store = useReportStore()
const noticeStore = useNoticeStore()
const theDate = ref('2026-08-27')

const myStaff = computed(() => Object.values(employeeMap).filter((e) => e.leader_id === auth.user.user_id))

function buildRows() {
  return myStaff.value
    .map((e) => {
      const reps = store.byUser(e.user_id)
      const onDate = reps.find((r) => r.report_date === theDate.value)
      const submitted = onDate && onDate.status !== 'DRAFT'
      const lastDate = reps.filter((r) => r.status !== 'DRAFT').map((r) => r.report_date).sort().slice(-1)[0] || '从未提交'
      return { emp: e, status: submitted ? 'ok' : onDate ? 'draft' : 'none', lastDate }
    })
    .filter((r) => r.status !== 'ok')
}
const overdue = computed(buildRows)
const submittedCount = computed(() => myStaff.value.length - overdue.value.length)
function recompute() {}

function urge(row) {
  const tip = row.status === 'draft' ? '请尽快将草稿正式提交' : '请补录当日日报'
  noticeStore.add({
    title: '催办提醒',
    content: `【${auth.user.real_name}】提醒您：请于 ${theDate.value} 前${tip}。`,
    notice_type: 'REMIND',
    status: 'PUBLISHED'
  })
  ElMessage.success('已向 ' + row.emp.real_name + ' 发送催报通知：' + tip)
}
</script>

<style scoped>
.stat-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 22px;
}
.stat-ico {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}
.stat-meta {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}
</style>
