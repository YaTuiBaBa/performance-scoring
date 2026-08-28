import { defineStore } from 'pinia'
import { employeeMap } from '../mock/data.js'

// 问题申诉流程：
// 员工提交 -> PENDING_STATION(班站长复核, 同意/不同意) -> PENDING_FACTORY(厂级领导终审) -> FACTORY_DECIDED
// 班站长无论同意与否，都升级到厂级领导终审批。
export const useAppealStore = defineStore('appeals', {
  state: () => ({
    list: [
      {
        appeal_id: 'A-1001',
        user_id: 'U-1001',
        score: 7.5,
        reason: '8月23日配合班组应急演练占用巡检时间，当日得分偏低；实际工作量饱满、巡检到位，申请复核上调。',
        status: 'PENDING_STATION',
        station_decision: null,
        station_remark: '',
        station_time: null,
        factory_decision: null,
        factory_remark: '',
        factory_time: null,
        create_time: '2026-08-27T09:12:00'
      },
      {
        appeal_id: 'A-1002',
        user_id: 'U-1003',
        score: 7.0,
        reason: '注水站夜间配水间巡检数据未计入当日评分，认为应补录计分，请求复核。',
        status: 'PENDING_STATION',
        station_decision: null,
        station_remark: '',
        station_time: null,
        factory_decision: null,
        factory_remark: '',
        factory_time: null,
        create_time: '2026-08-27T10:40:00'
      },
      {
        appeal_id: 'A-1003',
        user_id: 'U-1004',
        score: 8.0,
        reason: '8月20日设备异响上报及时但未计入当日工作量，申请补正加分。',
        status: 'PENDING_STATION',
        station_decision: null,
        station_remark: '',
        station_time: null,
        factory_decision: null,
        factory_remark: '',
        factory_time: null,
        create_time: '2026-08-27T11:05:00'
      },
      {
        appeal_id: 'A-1004',
        user_id: 'U-1002',
        score: 7.8,
        reason: '8月19日配合设备检修加班未及时录入，当日评分偏低，申请补正加分。',
        status: 'PENDING_FACTORY',
        station_decision: 'AGREE',
        station_remark: '情况属实，同意上报厂级',
        station_time: '2026-08-27T14:20:00',
        factory_decision: null,
        factory_remark: '',
        factory_time: null,
        create_time: '2026-08-27T09:40:00'
      }
    ]
  }),
  getters: {
    byUser: (s) => (uid) => s.list.filter((a) => a.user_id === uid),
    // 某条日报是否已存在未终结的申诉（用于提交记录里禁止重复申诉）
    openAppealForReport: (s) => (uid, reportId) =>
      s.list.find((a) => a.user_id === uid && a.report_id === reportId && a.status !== 'FACTORY_DECIDED'),
    pendingForStation: (s) => (stationId) =>
      s.list.filter((a) => a.status === 'PENDING_STATION' && employeeMap[a.user_id]?.leader_id === stationId),
    pendingForFactory: (s) => () => s.list.filter((a) => a.status === 'PENDING_FACTORY')
  },
  actions: {
    submit({ user_id, reason, score, report_id = null, report_date = null, report_score = null }) {
      this.list.unshift({
        appeal_id: 'A-' + Date.now(),
        user_id,
        reason,
        score,
        report_id,
        report_date,
        report_score,
        status: 'PENDING_STATION',
        station_decision: null,
        station_remark: '',
        station_time: null,
        factory_decision: null,
        factory_remark: '',
        factory_time: null,
        create_time: new Date().toISOString()
      })
    },
    // 班站长复核：无论同意/不同意，均升级到厂级领导
    stationReview(appealId, decision, remark) {
      const a = this.list.find((x) => x.appeal_id === appealId)
      if (!a) return
      a.station_decision = decision // 'AGREE' | 'DISAGREE'
      a.station_remark = remark
      a.station_time = new Date().toISOString()
      a.status = 'PENDING_FACTORY'
    },
    // 厂级领导终审
    factoryDecision(appealId, decision, remark) {
      const a = this.list.find((x) => x.appeal_id === appealId)
      if (!a) return
      a.factory_decision = decision // 'ADOPT' | 'REJECT'
      a.factory_remark = remark
      a.factory_time = new Date().toISOString()
      a.status = 'FACTORY_DECIDED'
    }
  }
})
