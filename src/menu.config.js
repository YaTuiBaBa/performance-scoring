// 菜单配置：按角色显隐，集中管理，避免员工看到领导端/驾驶舱
// roles 为该菜单组可见的角色集合
export const menuConfig = [
  {
    group: '员工端',
    roles: ['EMPLOYEE'],
    items: [
      { path: '/employee/dashboard', title: '我的工作台', icon: 'Odometer' },
      { path: '/employee/report/create', title: '每日任务提报', icon: 'EditPen' },
      { path: '/employee/report/history', title: '我的提交记录', icon: 'Document' },
      { path: '/employee/performance', title: '我的绩效', icon: 'Trophy' }
    ]
  },
  {
    group: '领导端 · 审批评分',
    roles: ['STATION_MASTER', 'ZONE_LEADER'],
    items: [
      { path: '/manager/pending', title: '待办审批台', icon: 'Bell' },
      { path: '/manager/overdue', title: '逾期未报', icon: 'AlarmClock' },
      { path: '/manager/history', title: '已审批记录', icon: 'Files' },
      { path: '/manager/report', title: '班站/作业区报表', icon: 'DataAnalysis' }
    ]
  },
  {
    group: '数据驾驶舱',
    roles: ['FACTORY_LEADER', 'HR', 'ADMIN', 'ZONE_LEADER'],
    items: [{ path: '/dashboard/factory', title: '厂级考核驾驶舱', icon: 'Histogram' }]
  },
  {
    group: '基础数据管理',
    roles: ['STATION_MASTER', 'ZONE_LEADER', 'ADMIN', 'HR'],
    items: [
      { path: '/manager/employees', title: '人员管理', icon: 'User' },
      { path: '/manager/duties', title: '岗位职责', icon: 'List' },
      { path: '/manager/notices', title: '通知管理', icon: 'Bell' }
    ]
  }
]

// 根据角色过滤出当前用户可见的菜单
export function menusForRole(role) {
  return menuConfig.filter((g) => g.roles.includes(role))
}
