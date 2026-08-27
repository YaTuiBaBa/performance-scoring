<template>
  <div>
    <el-card class="page-section">
      <div class="toolbar">
        <div class="section-title" style="margin: 0">人员管理</div>
        <el-button type="primary" :icon="Plus" @click="openAdd">新增员工</el-button>
      </div>
      <el-table :data="paged" border stripe>
        <el-table-column label="姓名" width="100">
          <template #default="{ row }">{{ row.real_name }}</template>
        </el-table-column>
        <el-table-column prop="username" label="账号" width="120" />
        <el-table-column label="岗位" width="120">
          <template #default="{ row }">{{ positionMap[row.primary_position_id]?.position_name || '—' }}</template>
        </el-table-column>
        <el-table-column label="部门/班站" min-width="150">
          <template #default="{ row }">{{ row.department }}{{ row.station ? ' / ' + row.station : '' }}</template>
        </el-table-column>
        <el-table-column prop="phone" label="联系电话" width="140" />
        <el-table-column label="角色" width="110" align="center">
          <template #default="{ row }"><el-tag size="small" :type="roleTag(row.role)">{{ roleLabel(row.role) }}</el-tag></template>
        </el-table-column>
        <el-table-column label="直属上级" width="100">
          <template #default="{ row }">{{ row.leader_id ? idName(row.leader_id) : '—' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="160">
          <template #default="{ row }">
            <el-button type="primary" link @click="openEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        class="page-section"
        layout="total, prev, pager, next"
        :total="store.list.length"
        :page-size="pageSize"
        v-model:current-page="page"
      />
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialog" :title="editing ? '编辑员工' : '新增员工'" width="520px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="92px">
        <el-form-item label="姓名" prop="real_name">
          <el-input v-model="form.real_name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="登录账号" prop="username">
          <el-input v-model="form.username" placeholder="用于演示登录" :disabled="editing" />
        </el-form-item>
        <el-form-item label="岗位" prop="primary_position_id">
          <el-select v-model="form.primary_position_id" placeholder="选择岗位" style="width: 100%">
            <el-option v-for="p in positions" :key="p.position_id" :label="p.position_name" :value="p.position_id" />
          </el-select>
        </el-form-item>
        <el-form-item label="部门" prop="department">
          <el-input v-model="form.department" placeholder="如：采油一队" />
        </el-form-item>
        <el-form-item label="班站">
          <el-input v-model="form.station" placeholder="如：王窑站（可留空）" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="form.role" style="width: 100%">
            <el-option v-for="(l, r) in roleMap" :key="r" :label="l" :value="r" />
          </el-select>
        </el-form-item>
        <el-form-item label="直属上级">
          <el-select v-model="form.leader_id" placeholder="选择上级（可留空）" clearable style="width: 100%">
            <el-option v-for="e in leaderCandidates" :key="e.user_id" :label="e.real_name + '（' + (positionMap[e.primary_position_id]?.position_name || '') + '）'" :value="e.user_id" />
          </el-select>
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="form.phone" placeholder="手机号" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="停用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { usePersonnelStore } from '../../store/personnel.js'
import { positions, positionMap } from '../../mock/data.js'

const store = usePersonnelStore()
const roleMap = {
  EMPLOYEE: '一线员工',
  STATION_MASTER: '班站长',
  ZONE_LEADER: '作业区领导',
  FACTORY_LEADER: '厂级领导',
  HR: '考核专员',
  ADMIN: '系统管理员'
}
const roleLabel = (r) => roleMap[r] || r
const roleTag = (r) => ({ EMPLOYEE: 'info', STATION_MASTER: 'success', ZONE_LEADER: 'warning', FACTORY_LEADER: 'danger', HR: 'warning', ADMIN: 'info' }[r] || 'info')
const idName = (id) => store.byId(id)?.real_name || '—'
const leaderCandidates = computed(() => store.list.filter((e) => e.user_id !== editingId.value))

// 分页
const page = ref(1)
const pageSize = 10
const paged = computed(() => store.list.slice((page.value - 1) * pageSize, page.value * pageSize))

// 弹窗
const dialog = ref(false)
const editing = ref(false)
const editingId = ref('')
const formRef = ref()
const form = reactive({
  real_name: '',
  username: '',
  primary_position_id: '',
  department: '',
  station: '',
  role: 'EMPLOYEE',
  leader_id: '',
  phone: '',
  status: 1
})
const rules = {
  real_name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  username: [{ required: true, message: '请输入登录账号', trigger: 'blur' }],
  primary_position_id: [{ required: true, message: '请选择岗位', trigger: 'change' }],
  department: [{ required: true, message: '请输入部门', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }]
}

function reset() {
  Object.assign(form, {
    real_name: '', username: '', primary_position_id: '', department: '', station: '',
    role: 'EMPLOYEE', leader_id: '', phone: '', status: 1
  })
}
function openAdd() {
  editing.value = false
  editingId.value = ''
  reset()
  dialog.value = true
}
function openEdit(row) {
  editing.value = true
  editingId.value = row.user_id
  Object.assign(form, {
    real_name: row.real_name, username: row.username, primary_position_id: row.primary_position_id,
    department: row.department, station: row.station, role: row.role, leader_id: row.leader_id,
    phone: row.phone, status: row.status
  })
  dialog.value = true
}
function save() {
  formRef.value.validate((ok) => {
    if (!ok) return
    if (editing.value) {
      store.update(editingId.value, { ...form })
      ElMessage.success('已保存修改')
    } else {
      store.add({ ...form })
      ElMessage.success('已新增员工')
    }
    dialog.value = false
  })
}
function remove(row) {
  ElMessageBox.confirm('确定删除「' + row.real_name + '」？删除后不可恢复', '删除员工', { type: 'warning' })
    .then(() => {
      store.remove(row.user_id)
      ElMessage.success('已删除')
    })
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
