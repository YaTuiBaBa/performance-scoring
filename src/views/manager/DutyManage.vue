<template>
  <div>
    <el-card class="page-section">
      <div class="toolbar">
        <div class="section-title" style="margin: 0">岗位职责列表</div>
        <el-select v-model="posId" placeholder="选择岗位" style="width: 200px">
          <el-option v-for="p in positions" :key="p.position_id" :label="p.position_name" :value="p.position_id" />
        </el-select>
      </div>
      <el-alert type="info" :closable="false" class="page-section">
        当前岗位：<b>{{ posName }}</b>。下方「常规职责」为该岗位长期固定的职责项；「临时/专项职责」为按指定日期下发的必完成任务（如某天需加一条必做项）。
      </el-alert>
    </el-card>

    <!-- 常规职责 -->
    <el-card class="page-section">
      <div class="toolbar">
        <div class="section-title" style="margin: 0">常规职责</div>
        <el-button type="primary" :icon="Plus" @click="openRegularAdd">新增常规职责</el-button>
      </div>
      <el-table :data="regularList" border stripe>
        <el-table-column prop="duty_category" label="分类" width="130" />
        <el-table-column prop="duty_desc" label="职责描述" min-width="260" />
        <el-table-column label="是否必完成" width="120" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="row.is_required ? 'danger' : 'info'">{{ row.is_required ? '必完成' : '选做' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="160">
          <template #default="{ row }">
            <el-button type="primary" link @click="openRegularEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="removeRegular(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!regularList.length" description="该岗位暂无常规职责" />
    </el-card>

    <!-- 临时/专项职责（按日必完成） -->
    <el-card class="page-section">
      <div class="toolbar">
        <div class="section-title" style="margin: 0">临时 / 专项职责（按日必完成）</div>
        <el-button type="primary" :icon="Plus" @click="openSpecialAdd">按日新增必完成职责</el-button>
      </div>
      <el-table :data="specialList" border stripe>
        <el-table-column prop="duty_desc" label="职责描述" min-width="240" />
        <el-table-column label="生效日期" width="140" align="center">
          <template #default="{ row }"><el-tag size="small" type="warning" effect="plain">{{ row.effective_date }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="created_by" label="下发人" width="110" />
        <el-table-column prop="note" label="备注" min-width="160" />
        <el-table-column label="操作" fixed="right" width="120">
          <template #default="{ row }">
            <el-button type="danger" link @click="removeSpecial(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!specialList.length" description="暂无临时/专项职责" />
    </el-card>

    <!-- 常规职责新增/编辑 -->
    <el-dialog v-model="regularDialog" :title="regularEditing ? '编辑常规职责' : '新增常规职责'" width="480px">
      <el-form :model="regularForm" :rules="regularRules" ref="regularRef" label-width="84px">
        <el-form-item label="所属岗位">
          <el-input :model-value="posName" disabled />
        </el-form-item>
        <el-form-item label="分类" prop="duty_category">
          <el-input v-model="regularForm.duty_category" placeholder="如：巡回检查" />
        </el-form-item>
        <el-form-item label="职责描述" prop="duty_desc">
          <el-input v-model="regularForm.duty_desc" type="textarea" :rows="3" placeholder="描述该职责的具体内容与标准" />
        </el-form-item>
        <el-form-item label="是否必完成">
          <el-switch v-model="regularForm.is_required" active-text="必完成" inactive-text="选做" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="regularDialog = false">取消</el-button>
        <el-button type="primary" @click="saveRegular">保存</el-button>
      </template>
    </el-dialog>

    <!-- 按日新增必完成职责 -->
    <el-dialog v-model="specialDialog" title="按日新增必完成职责" width="480px">
      <el-form :model="specialForm" :rules="specialRules" ref="specialRef" label-width="84px">
        <el-form-item label="所属岗位">
          <el-input :model-value="posName" disabled />
        </el-form-item>
        <el-form-item label="生效日期" prop="effective_date">
          <el-date-picker v-model="specialForm.effective_date" type="date" value-format="YYYY-MM-DD" placeholder="选择哪一天必完成" style="width: 100%" />
        </el-form-item>
        <el-form-item label="职责描述" prop="duty_desc">
          <el-input v-model="specialForm.duty_desc" type="textarea" :rows="3" placeholder="如：参与雨季防汛应急演练" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="specialForm.note" placeholder="可填下发依据，如厂部临时通知" />
        </el-form-item>
        <el-alert type="success" :closable="false" title="该职责将作为指定日期的「必完成」项，员工当天提报时须勾选。" />
      </el-form>
      <template #footer>
        <el-button @click="specialDialog = false">取消</el-button>
        <el-button type="primary" @click="saveSpecial">确定新增</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useDutyStore } from '../../store/duties.js'
import { useAuthStore } from '../../store/auth.js'
import { positions, positionMap } from '../../mock/data.js'

const store = useDutyStore()
const auth = useAuthStore()
const posId = ref(positions[0].position_id)
const posName = computed(() => positionMap[posId.value]?.position_name || '—')

const regularList = computed(() => store.regularByPosition(posId.value))
const specialList = computed(() => store.specialByPosition(posId.value))

// ---- 常规职责弹窗 ----
const regularDialog = ref(false)
const regularEditing = ref(false)
const regularEditId = ref('')
const regularRef = ref()
const regularForm = reactive({ duty_category: '', duty_desc: '', is_required: true })
const regularRules = {
  duty_category: [{ required: true, message: '请输入分类', trigger: 'blur' }],
  duty_desc: [{ required: true, message: '请输入职责描述', trigger: 'blur' }]
}
function openRegularAdd() {
  regularEditing.value = false
  regularEditId.value = ''
  Object.assign(regularForm, { duty_category: '', duty_desc: '', is_required: true })
  regularDialog.value = true
}
function openRegularEdit(row) {
  regularEditing.value = true
  regularEditId.value = row.duty_id
  Object.assign(regularForm, { duty_category: row.duty_category, duty_desc: row.duty_desc, is_required: !!row.is_required })
  regularDialog.value = true
}
function saveRegular() {
  regularRef.value.validate((ok) => {
    if (!ok) return
    if (regularEditing.value) {
      store.updateRegular(regularEditId.value, { ...regularForm })
      ElMessage.success('已保存')
    } else {
      store.addRegular({ position_id: posId.value, ...regularForm })
      ElMessage.success('已新增常规职责')
    }
    regularDialog.value = false
  })
}
function removeRegular(row) {
  ElMessageBox.confirm('确定删除该常规职责？', '删除', { type: 'warning' })
    .then(() => { store.removeRegular(row.duty_id); ElMessage.success('已删除') })
    .catch(() => {})
}

// ---- 按日必完成职责弹窗 ----
const specialDialog = ref(false)
const specialRef = ref()
const specialForm = reactive({ effective_date: '', duty_desc: '', note: '' })
const specialRules = {
  effective_date: [{ required: true, message: '请选择生效日期', trigger: 'change' }],
  duty_desc: [{ required: true, message: '请输入职责描述', trigger: 'blur' }]
}
function openSpecialAdd() {
  Object.assign(specialForm, { effective_date: '', duty_desc: '', note: '' })
  specialDialog.value = true
}
function saveSpecial() {
  specialRef.value.validate((ok) => {
    if (!ok) return
    store.addSpecial({
      position_id: posId.value,
      effective_date: specialForm.effective_date,
      duty_desc: specialForm.duty_desc,
      created_by: auth.user?.real_name || '管理员',
      note: specialForm.note
    })
    ElMessage.success('已为 ' + posName.value + ' 在 ' + specialForm.effective_date + ' 新增必完成职责')
    specialDialog.value = false
  })
}
function removeSpecial(row) {
  ElMessageBox.confirm('确定删除该临时职责？', '删除', { type: 'warning' })
    .then(() => { store.removeSpecial(row.special_id); ElMessage.success('已删除') })
    .catch(() => {})
}
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}
</style>
