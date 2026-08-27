import { defineStore } from 'pinia'
import { notices as seedNotices } from '../mock/data.js'

// 通知公告：管理者/HR 可发布，员工端工作台与顶栏铃铛实时读取
export const useNoticeStore = defineStore('notices', {
  state: () => ({
    list: JSON.parse(JSON.stringify(seedNotices))
  }),
  getters: {
    unread: (s) => s.list.filter((n) => !n.read).length,
    // 已发布且按时间倒序
    published: (s) => s.list.filter((n) => n.status !== 'DRAFT').slice().sort((a, b) => b.create_time.localeCompare(a.create_time))
  },
  actions: {
    add(payload) {
      const id = 'N-' + (this.list.length + 1) + '-' + Date.now().toString().slice(-4)
      this.list.unshift({
        notice_id: id,
        title: payload.title,
        content: payload.content,
        notice_type: payload.notice_type || 'ANNOUNCEMENT',
        status: payload.status || 'PUBLISHED',
        create_time: nowStr(),
        read: false
      })
    },
    update(id, payload) {
      const n = this.list.find((x) => x.notice_id === id)
      if (!n) return
      n.title = payload.title
      n.content = payload.content
      n.notice_type = payload.notice_type || n.notice_type
      if (payload.status) n.status = payload.status
      if (n.status === 'PUBLISHED' && !n.create_time) n.create_time = nowStr()
    },
    remove(id) {
      this.list = this.list.filter((x) => x.notice_id !== id)
    },
    publish(id) {
      const n = this.list.find((x) => x.notice_id === id)
      if (n) {
        n.status = 'PUBLISHED'
        n.create_time = n.create_time || nowStr()
        n.read = false
      }
    },
    recall(id) {
      const n = this.list.find((x) => x.notice_id === id)
      if (n) n.status = 'DRAFT'
    },
    markAllRead() {
      this.list.forEach((n) => (n.read = true))
    }
  }
})

function nowStr() {
  const d = new Date()
  const p = (x) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}
