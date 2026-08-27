<template>
  <div>
    <el-card>
      <div class="section-title">今日工作选择（请勾选今日完成的工作项）</div>

      <el-alert type="info" :closable="false" style="margin-bottom: 14px">
        岗位：{{ posName }}　|　提交日期：{{ date }}
      </el-alert>

      <!-- 岗位职责勾选区 -->
      <div v-for="(items, cat) in grouped" :key="cat" class="duty-group">
        <div class="cat-title">{{ cat }}</div>
        <div v-for="d in items" :key="d.duty_id" class="duty-row">
          <div class="duty-head">
            <el-checkbox v-model="checked[d.duty_id]" :disabled="d.is_required === 1 && false">
              {{ d.duty_desc }}
              <el-tag v-if="d.is_required === 1" size="small" type="danger" style="margin-left: 6px">必选</el-tag>
            </el-checkbox>
          </div>
          <el-input
            v-if="checked[d.duty_id]"
            v-model="completion[d.duty_id]"
            type="textarea"
            :rows="2"
            maxlength="200"
            show-word-limit
            placeholder="请填写完成情况（必填，200字以内）"
            size="small"
            class="completion"
          />
        </div>
      </div>

      <!-- 自定义任务区 -->
      <div class="section-title" style="margin-top: 18px">其他工作事项（清单外的临时工作）</div>
      <div v-for="(c, i) in customs" :key="i" class="custom-row">
        <el-input v-model="c.name" placeholder="工作事项名称" style="width: 240px" size="small" />
        <el-input v-model="c.desc" type="textarea" :rows="2" maxlength="200" show-word-limit placeholder="完成情况说明" size="small" style="flex: 1" />
        <el-button type="danger" text :icon="Delete" @click="removeCustom(i)" />
      </div>
      <el-button v-if="customs.length < 5" :icon="Plus" plain size="small" @click="addCustom">添加自定义任务</el-button>

      <el-divider />

      <div class="actions">
        <el-button @click="saveDraft">保存草稿</el-button>
        <el-button type="primary" @click="submit">提交审批</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Delete, Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../../store/auth.js'
import { useReportStore } from '../../store/reports.js'
import { getDutiesGrouped, positionMap } from '../../mock/data.js'

const auth = useAuthStore()
const store = useReportStore()
const router = useRouter()

const pid = auth.user.primary_position_id
const posName = positionMap[pid]?.position_name
const date = '2026-08-27'
const reportId = `R-${auth.user.user_id}-27`

const grouped = getDutiesGrouped(pid)
const checked = reactive({})
const completion = reactive({})
const customs = ref([])

onMounted(() => {
  const draft = localStorage.getItem('ps_draft_' + reportId)
  if (draft) {
    const d = JSON.parse(draft)
    d.checked && Object.assign(checked, d.checked)
    d.completion && Object.assign(completion, d.completion)
    customs.value = d.customs || []
  }
})

function addCustom() {
  customs.value.push({ name: '', desc: '' })
}
function removeCustom(i) {
  customs.value.splice(i, 1)
}

function collectDetails() {
  const details = []
  for (const cat in grouped) {
    for (const d of grouped[cat]) {
      if (checked[d.duty_id]) {
        details.push({
          detail_id: `${reportId}-${d.duty_id}`,
          duty_id: d.duty_id,
          duty_category: cat,
          duty_desc: d.duty_desc,
          completion: completion[d.duty_id] || '',
          is_custom: 0
        })
      }
    }
  }
  customs.value.forEach((c, i) => {
    if (c.name) {
      details.push({
        detail_id: `${reportId}-C${i}`,
        duty_id: null,
        duty_category: '其他',
        duty_desc: c.name,
        completion: c.desc || '',
        is_custom: 1
      })
    }
  })
  return details
}

function validate(details) {
  const required = Object.values(grouped).flat().filter((d) => d.is_required === 1)
  for (const d of required) {
    if (!checked[d.duty_id]) return `必选职责未完成勾选：${d.duty_desc}`
  }
  for (const dt of details) {
    if (!dt.completion || !dt.completion.trim()) return '勾选的工作项必须填写完成情况'
  }
  return null
}

function saveDraft() {
  const details = collectDetails()
  localStorage.setItem(
    'ps_draft_' + reportId,
    JSON.stringify({ checked: { ...checked }, completion: { ...completion }, customs: customs.value })
  )
  store.submit({ report_id: reportId, user_id: auth.user.user_id, report_date: date, status: 'DRAFT', details, submit_time: null })
  ElMessage.success('草稿已保存')
}

function submit() {
  const details = collectDetails()
  const err = validate(details)
  if (err) return ElMessage.warning(err)
  store.submit({ report_id: reportId, user_id: auth.user.user_id, report_date: date, status: 'PENDING', details, submit_time: new Date().toISOString() })
  localStorage.removeItem('ps_draft_' + reportId)
  ElMessage.success('已提交，等待领导审批')
  router.push('/employee/report/history')
}
</script>

<style scoped>
.duty-group {
  margin-bottom: 10px;
}
.cat-title {
  font-weight: 600;
  color: #409eff;
  margin: 8px 0 4px;
}
.duty-head {
  padding: 4px 0;
}
.completion {
  margin: 4px 0 8px 26px;
  max-width: 720px;
}
.custom-row {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  margin-bottom: 10px;
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
