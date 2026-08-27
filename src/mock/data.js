// ============================================================================
// 采油厂绩效量化考核系统 - Mock 数据层（纯前端，无后端）
// 数据结构对齐 PRD 中的数据库设计（t_position / t_position_duty / t_user /
// t_daily_report / t_report_detail / t_approval / t_monthly_score / t_notice）
// ============================================================================

// 简单可复现伪随机（保证每次刷新数据一致，便于演示）
function makeRng(seed) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

// ---------------------------------------------------------------------------
// 1. 岗位表
// ---------------------------------------------------------------------------
export const positions = [
  { position_id: 'CYG-001', position_name: '采油工', position_category: 'OPERATION', dept_type: '采油队', parent_position_id: 'BZZ-001', sort_order: 1, status: 1 },
  { position_id: 'ZSG-001', position_name: '注水工', position_category: 'OPERATION', dept_type: '注水队', parent_position_id: 'BZZ-001', sort_order: 2, status: 1 },
  { position_id: 'JSG-001', position_name: '集输工', position_category: 'OPERATION', dept_type: '集输队', parent_position_id: 'BZZ-001', sort_order: 3, status: 1 },
  { position_id: 'WXG-001', position_name: '维修工', position_category: 'OPERATION', dept_type: '维修队', parent_position_id: 'BZZ-001', sort_order: 4, status: 1 },
  { position_id: 'BZZ-001', position_name: '班站长', position_category: 'MANAGEMENT', dept_type: '采油队', parent_position_id: 'ZQL-001', sort_order: 5, status: 1 },
  { position_id: 'ZQL-001', position_name: '作业区领导', position_category: 'MANAGEMENT', dept_type: '作业区', parent_position_id: 'CGL-001', sort_order: 6, status: 1 },
  { position_id: 'CGL-001', position_name: '厂级领导', position_category: 'MANAGEMENT', dept_type: '厂部', parent_position_id: null, sort_order: 7, status: 1 },
  { position_id: 'HR-001', position_name: '考核专员', position_category: 'MANAGEMENT', dept_type: '机关科室', parent_position_id: 'CGL-001', sort_order: 8, status: 1 }
]

export const positionMap = Object.fromEntries(positions.map((p) => [p.position_id, p]))

// ---------------------------------------------------------------------------
// 2. 岗位职责清单
// ---------------------------------------------------------------------------
export const duties = [
  // 采油工
  { duty_id: 'D-CYG-1', position_id: 'CYG-001', duty_category: '巡回检查', duty_desc: '负责抽油机井巡回检查，检查设备运行状态、井口压力、温度等参数', is_required: 1, sort_order: 1, status: 1 },
  { duty_id: 'D-CYG-2', position_id: 'CYG-001', duty_category: '资料录取', duty_desc: '负责量油、取样、测压等资料的录取与填报', is_required: 1, sort_order: 2, status: 1 },
  { duty_id: 'D-CYG-3', position_id: 'CYG-001', duty_category: '设备维保', duty_desc: '负责抽油机、电路、输油泵等设备的日常维护保养', is_required: 0, sort_order: 3, status: 1 },
  { duty_id: 'D-CYG-4', position_id: 'CYG-001', duty_category: '安全生产', duty_desc: '负责井场安全巡检、隐患发现与上报', is_required: 1, sort_order: 4, status: 1 },
  { duty_id: 'D-CYG-5', position_id: 'CYG-001', duty_category: '现场管理', duty_desc: '负责井场标准化建设与维护', is_required: 0, sort_order: 5, status: 1 },
  // 注水工
  { duty_id: 'D-ZSG-1', position_id: 'ZSG-001', duty_category: '巡回检查', duty_desc: '负责注水井巡回检查、配水间巡检', is_required: 1, sort_order: 1, status: 1 },
  { duty_id: 'D-ZSG-2', position_id: 'ZSG-001', duty_category: '设备操作', duty_desc: '负责注水泵、喂水泵等设备操作与维护', is_required: 0, sort_order: 2, status: 1 },
  { duty_id: 'D-ZSG-3', position_id: 'ZSG-001', duty_category: '安全生产', duty_desc: '负责注水站安全巡检、隐患上报', is_required: 1, sort_order: 3, status: 1 },
  // 集输工
  { duty_id: 'D-JSG-1', position_id: 'JSG-001', duty_category: '原油集输', duty_desc: '负责原油集输（拉运）、计量工作', is_required: 1, sort_order: 1, status: 1 },
  { duty_id: 'D-JSG-2', position_id: 'JSG-001', duty_category: '化学药剂', duty_desc: '负责化学药剂使用量控制与投加', is_required: 0, sort_order: 2, status: 1 },
  { duty_id: 'D-JSG-3', position_id: 'JSG-001', duty_category: '安全生产', duty_desc: '负责集输站安全巡检、隐患上报', is_required: 1, sort_order: 3, status: 1 }
]

export function getDutiesByPosition(positionId) {
  return duties.filter((d) => d.position_id === positionId && d.status === 1)
}

// 按分类分组
export function getDutiesGrouped(positionId) {
  const list = getDutiesByPosition(positionId)
  const map = {}
  list.forEach((d) => {
    if (!map[d.duty_category]) map[d.duty_category] = []
    map[d.duty_category].push(d)
  })
  return map
}

// ---------------------------------------------------------------------------
// 3. 员工表（含演示登录账号）
// ---------------------------------------------------------------------------
export const employees = [
  { user_id: 'U-1001', username: 'zhangwei', real_name: '张伟', primary_position_id: 'CYG-001', department: '采油一队', station: '王窑站', phone: '13800001001', role: 'EMPLOYEE', leader_id: 'U-2001', entry_date: '2019-03-01', status: 1 },
  { user_id: 'U-1002', username: 'liqiang', real_name: '李强', primary_position_id: 'CYG-001', department: '采油一队', station: '王窑站', phone: '13800001002', role: 'EMPLOYEE', leader_id: 'U-2001', entry_date: '2021-07-15', status: 1 },
  { user_id: 'U-1003', username: 'wangfang', real_name: '王芳', primary_position_id: 'ZSG-001', department: '注水队', station: '注水一站', phone: '13800001003', role: 'EMPLOYEE', leader_id: 'U-2001', entry_date: '2020-05-20', status: 1 },
  { user_id: 'U-1004', username: 'liuyang', real_name: '刘洋', primary_position_id: 'JSG-001', department: '集输站', station: '集输一班', phone: '13800001004', role: 'EMPLOYEE', leader_id: 'U-2001', entry_date: '2018-11-02', status: 1 },
  { user_id: 'U-2001', username: 'zhaojg', real_name: '赵建国', primary_position_id: 'BZZ-001', department: '采油一队', station: '王窑站', phone: '13800002001', role: 'STATION_MASTER', leader_id: 'U-3001', entry_date: '2012-09-10', status: 1 },
  { user_id: 'U-3001', username: 'qiangang', real_name: '钱刚', primary_position_id: 'ZQL-001', department: '作业区', station: '', phone: '13800003001', role: 'ZONE_LEADER', leader_id: 'U-4001', entry_date: '2009-04-01', status: 1 },
  { user_id: 'U-4001', username: 'chenhong', real_name: '陈红', primary_position_id: 'CGL-001', department: '厂部', station: '', phone: '13800004001', role: 'FACTORY_LEADER', leader_id: null, entry_date: '2005-02-01', status: 1 },
  { user_id: 'U-9001', username: 'admin', real_name: '系统管理员', primary_position_id: 'HR-001', department: '机关科室', station: '', phone: '13800009001', role: 'ADMIN', leader_id: null, entry_date: '2016-01-01', status: 1 }
]

export const employeeMap = Object.fromEntries(employees.map((e) => [e.user_id, e]))

// 演示账号 -> 角色（登录页一键进入）
export const demoAccounts = [
  { username: 'zhangwei', label: '张伟 · 采油工（员工端）', role: 'EMPLOYEE', user_id: 'U-1001' },
  { username: 'zhaojg', label: '赵建国 · 班站长（领导端）', role: 'STATION_MASTER', user_id: 'U-2001' },
  { username: 'chenhong', label: '陈红 · 厂级领导（驾驶舱）', role: 'FACTORY_LEADER', user_id: 'U-4001' }
]

// ---------------------------------------------------------------------------
// 4. 日报 + 评分（生成近 26 天数据）
// ---------------------------------------------------------------------------
const completionSamples = [
  '按标准完成，设备运行正常',
  '发现抽油机异响，已上报维修班',
  '资料填写规范，与现场一致',
  '按时巡检，无异常情况',
  '协助完成临时抢修任务',
  '标准化井场保持良好'
]
const comments = [
  '工作认真负责，质量高',
  '效率有待提高',
  '工作量饱满，表现优秀',
  '注意安全生产规范',
  '数据录取准确，值得表扬',
  '巡检到位，继续保持'
]

function round05(v) {
  return Math.round(v * 2) / 2
}

function genReports() {
  const reports = []
  const today = new Date(2026, 7, 27) // 2026-08-27
  // 为 4 名一线员工生成日报
  const staffList = employees.filter((e) => e.role === 'EMPLOYEE')
  let idx = 0
  for (const emp of staffList) {
    const rng = makeRng(1000 + idx * 97)
    const empDuties = getDutiesByPosition(emp.primary_position_id)
    const required = empDuties.filter((d) => d.is_required)
    const optional = empDuties.filter((d) => !d.is_required)
    for (let day = 1; day <= 26; day++) {
      const date = new Date(2026, 7, day)
      const reportId = `R-${emp.user_id}-${day}`
      // 最近 2 天（25/26）留给领导审批，作为待办；1 号某员工留一份草稿/驳回
      let status = 'APPROVED'
      if (day >= 25) status = 'PENDING'
      if (emp.user_id === 'U-1001' && day === 24) status = 'REJECTED'
      if (emp.user_id === 'U-1003' && day === 26) status = 'DRAFT'

      // 选职责项
      const picked = [...required]
      if (optional.length && rng() > 0.4) picked.push(optional[Math.floor(rng() * optional.length)])
      // 偶尔加一条自定义任务
      const custom = []
      if (rng() > 0.6) {
        custom.push({
          duty_desc: '临时配合应急演练',
          completion: '参与班组安全应急演练，完成既定科目'
        })
      }
      const details = picked.map((d, i) => ({
        detail_id: `${reportId}-D${i}`,
        duty_id: d.duty_id,
        duty_category: d.duty_category,
        duty_desc: d.duty_desc,
        completion: completionSamples[Math.floor(rng() * completionSamples.length)],
        is_custom: 0
      }))
      custom.forEach((c, i) => {
        details.push({
          detail_id: `${reportId}-C${i}`,
          duty_id: null,
          duty_category: '其他',
          duty_desc: c.duty_desc,
          completion: c.completion,
          is_custom: 1
        })
      })

      let approval = null
      if (status === 'APPROVED') {
        const q = round05(7 + rng() * 3)
        const qu = round05(6 + rng() * 3.5)
        const ti = round05(7 + rng() * 3)
        const total = round05(q * 0.4 + qu * 0.35 + ti * 0.25)
        approval = {
          score_quality: q,
          score_quantity: qu,
          score_timeliness: ti,
          score_total: total,
          comment: comments[Math.floor(rng() * comments.length)],
          manager_id: emp.leader_id,
          approved_time: new Date(2026, 7, day, 19 + Math.floor(rng() * 3), 10).toISOString(),
          reject_reason: null
        }
      } else if (status === 'REJECTED') {
        approval = {
          score_quality: 5,
          score_quantity: 5,
          score_timeliness: 5,
          score_total: 5,
          comment: '完成情况说明过于简略，请补充',
          manager_id: emp.leader_id,
          approved_time: new Date(2026, 7, day, 20).toISOString(),
          reject_reason: '完成情况说明过于简略，请补充具体数据与现场情况'
        }
      }

      reports.push({
        report_id: reportId,
        user_id: emp.user_id,
        report_date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        status,
        submit_time:
          status === 'DRAFT'
            ? null
            : new Date(2026, 7, day, 17 + Math.floor(rng() * 2), Math.floor(rng() * 59)).toISOString(),
        work_items_count: details.length,
        details,
        approval
      })
    }
    idx++
  }
  return reports
}

export const dailyReports = genReports()

// ---------------------------------------------------------------------------
// 5. 月度汇总（演示用，按已评分日报聚合）
// ---------------------------------------------------------------------------
export function computeMonthly(userId, yearMonth = '2026-08') {
  const list = dailyReports.filter(
    (r) => r.user_id === userId && r.report_date.startsWith(yearMonth) && r.status === 'APPROVED' && r.approval
  )
  const total = list.reduce((s, r) => s + r.approval.score_total, 0)
  const avg = list.length ? round05(total / list.length) : 0
  const scores = list.map((r) => r.approval.score_total)
  return {
    user_id: userId,
    year_month: yearMonth,
    total_avg_score: avg,
    submit_count: dailyReports.filter((r) => r.user_id === userId && r.report_date.startsWith(yearMonth)).length,
    approved_count: list.length,
    max_score: scores.length ? Math.max(...scores) : 0,
    min_score: scores.length ? Math.min(...scores) : 0,
    status: 'PENDING'
  }
}

export const monthlyScores = employees
  .filter((e) => e.role === 'EMPLOYEE')
  .map((e) => computeMonthly(e.user_id))

// ---------------------------------------------------------------------------
// 6. 通知消息
// ---------------------------------------------------------------------------
export const notices = [
  { notice_id: 'N-1', title: '关于8月月度考核汇总的通知', content: '请各班站长于本月底前完成本月考核确认。', notice_type: 'MONTHLY', create_time: '2026-08-26 09:00', read: false },
  { notice_id: 'N-2', title: '安全巡检专项要求', content: '近期雷雨天气增多，请加强井场安全巡检。', notice_type: 'ANNOUNCEMENT', create_time: '2026-08-25 14:30', read: false },
  { notice_id: 'N-3', title: '您的日报已评分', content: '赵建国 已对您 8月23日 的日报完成评分（9.2分）。', notice_type: 'SCORE', create_time: '2026-08-23 20:10', read: true },
  { notice_id: 'N-4', title: '催办提醒', content: '您 8月26日 日报尚未提交，请尽快补录。', notice_type: 'REMIND', create_time: '2026-08-26 18:30', read: false }
]

// ---------------------------------------------------------------------------
// 7. 评分维度权重（系统配置，对应 PRD 9.1）
// ---------------------------------------------------------------------------
export const scoreWeights = { quality: 0.4, quantity: 0.35, timeliness: 0.25 }

export function calcTotal(q, qu, ti) {
  return round05(q * scoreWeights.quality + qu * scoreWeights.quantity + ti * scoreWeights.timeliness)
}
