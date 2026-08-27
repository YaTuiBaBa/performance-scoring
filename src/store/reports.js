import { defineStore } from 'pinia'
import { dailyReports } from '../mock/data.js'

// 运行时可变的日报列表（提交/评分等操作会修改它），以 mock 数据为初始种子
export const useReportStore = defineStore('reports', {
  state: () => ({
    reports: JSON.parse(JSON.stringify(dailyReports))
  }),
  getters: {
    byUser: (s) => (uid) => s.reports.filter((r) => r.user_id === uid),
    byId: (s) => (id) => s.reports.find((r) => r.report_id === id),
    pending: (s) => (leaderId) =>
      s.reports.filter((r) => r.status === 'PENDING' && r.user?.leader_id === leaderId)
  },
  actions: {
    // 员工提交日报（含草稿）
    submit(payload) {
      const r = this.byId(payload.report_id)
      if (r) {
        r.status = payload.status
        r.details = payload.details
        r.work_items_count = payload.details.length
        r.submit_time = payload.status === 'PENDING' ? new Date().toISOString() : r.submit_time
      } else {
        this.reports.unshift({ ...payload, create_time: new Date().toISOString() })
      }
    },
    // 领导评分通过
    approve(reportId, scores) {
      const r = this.byId(reportId)
      if (!r) return
      r.status = 'APPROVED'
      r.approval = scores
    },
    // 领导驳回
    reject(reportId, reason) {
      const r = this.byId(reportId)
      if (!r) return
      r.status = 'REJECTED'
      r.approval = r.approval || {}
      r.approval.reject_reason = reason
    },
    // 领导暂存评分草稿（报告仍为待审批，附 approval_draft 供后续继续）
    saveDraft(reportId, draft) {
      const r = this.byId(reportId)
      if (!r) return
      r.status = 'PENDING'
      r.approval_draft = draft
    }
  }
})
