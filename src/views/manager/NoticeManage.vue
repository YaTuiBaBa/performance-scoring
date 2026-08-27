<template>
  <div>
    <el-card>
      <div class="page-head">
        <div class="section-title">通知公告管理</div>
        <el-button type="primary" @click="openCreate">发布通知</el-button>
      </div>

      <el-table :data="store.list" border stripe class="page-section">
        <el-table-column label="标题" min-width="180">
          <template #default="{ row }">{{ row.title }}</template>
        </el-table-column>
        <el-table-column label="类型" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="typeMeta[row.notice_type]?.tag || 'info'" effect="light" size="small">
              {{ typeMeta[row.notice_type]?.label || '其他' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="内容" min-width="240" show-overflow-tooltip>
          <template #default="{ row }">{{ row.content }}</template>
        </el-table-column>
        <el-table-column prop="create_time" label="创建时间" width="150" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'DRAFT' ? 'info' : 'success'" effect="plain" size="small">
              {{ row.status === 'DRAFT' ? '草稿' : '已发布' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="220">
          <template #default="{ row }">
            <el-button v-if="row.status === 'DRAFT'" type="primary" link @click="publish(row)">发布</el-button>
            <el-button v-else link @click="recall(row)">撤回</el-button>
            <el-button link @click="openEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增 / 编辑 -->
    <el-dialog v-model="dialog" :title="editing ? '编辑通知' : '发布通知'" width="520px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="标题" required>
          <el-input v-model="form.title" placeholder="如：关于9月月度考核的通知" maxlength="40" show-word-limit />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.notice_type" style="width: 100%">
            <el-option v-for="(m, k) in typeMeta" :key="k" :label="m.label" :value="k" />
          </el-select>
        </el-form-item>
        <el-form-item label="内容" required>
          <el-input v-model="form.content" type="textarea" :rows="4" placeholder="通知正文" maxlength="200" show-word-limit />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio value="PUBLISHED">直接发布</el-radio>
            <el-radio value="DRAFT">存为草稿</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog = false">取消</el-button>
        <el-button type="primary" @click="save">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useNoticeStore } from '../../store/notices.js'

const store = useNoticeStore()
const typeMeta = {
  MONTHLY: { label: '月度考核', tag: 'warning' },
  ANNOUNCEMENT: { label: '公告', tag: 'primary' },
  SCORE: { label: '评分提醒', tag: 'success' },
  REMIND: { label: '催办', tag: 'danger' }
}

const dialog = ref(false)
const editing = ref(false)
const editingId = ref('')
const form = reactive({ title: '', content: '', notice_type: 'ANNOUNCEMENT', status: 'PUBLISHED' })

function resetForm() {
  form.title = ''
  form.content = ''
  form.notice_type = 'ANNOUNCEMENT'
  form.status = 'PUBLISHED'
}
function openCreate() {
  editing.value = false
  editingId.value = ''
  resetForm()
  dialog.value = true
}
function openEdit(row) {
  editing.value = true
  editingId.value = row.notice_id
  form.title = row.title
  form.content = row.content
  form.notice_type = row.notice_type
  form.status = row.status || 'PUBLISHED'
  dialog.value = true
}
function save() {
  if (!form.title.trim() || !form.content.trim()) {
    ElMessage.warning('请填写标题与内容')
    return
  }
  if (editing.value) {
    store.update(editingId.value, { ...form })
    ElMessage.success('已保存')
  } else {
    store.add({ ...form })
    ElMessage.success(form.status === 'PUBLISHED' ? '通知已发布' : '已存为草稿')
  }
  dialog.value = false
}
function publish(row) {
  store.publish(row.notice_id)
  ElMessage.success('已发布，员工端实时可见')
}
function recall(row) {
  store.recall(row.notice_id)
  ElMessage.info('已撤回')
}
function remove(row) {
  ElMessageBox.confirm(`确定删除通知「${row.title}」？`, '删除确认', {
    type: 'warning',
    confirmButtonText: '删除',
    cancelButtonText: '取消'
  })
    .then(() => {
      store.remove(row.notice_id)
      ElMessage.success('已删除')
    })
    .catch(() => {})
}
</script>

<style scoped>
.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
</style>
