// 菜单配置：按角色显隐，集中管理，避免员工看到领导端/驾驶舱
// roles 为该菜单组可见的角色集合
export const menuConfig = [
  {
    group: '工作中心',
    roles: ['EMPLOYEE', 'STATION_MASTER', 'FACTORY_LEADER', 'ZONE_LEADER'],
    items: [
      { path: '/employee/dashboard', title: '我的工作台', icon: 'Odometer' },
      { path: '/employee/report/create', title: '每日任务提报', icon: 'EditPen', roles: ['EMPLOYEE', 'STATION_MASTER'] },
      { path: '/employee/report/history', title: '我的提交记录', icon: 'Document', roles: ['EMPLOYEE', 'STATION_MASTER'] },
      { path: '/employee/performance', title: '我的绩效', icon: 'Trophy', roles: ['EMPLOYEE', 'STATION_MASTER'] },
      { path: '/employee/appeal', title: '问题申诉', icon: 'ChatLineSquare', roles: ['EMPLOYEE', 'STATION_MASTER'] },
      { path: '/manager/approval-center', title: '审批中心', icon: 'Bell', roles: ['STATION_MASTER', 'ZONE_LEADER', 'FACTORY_LEADER'] },
      { path: '/manager/overdue', title: '逾期未报', icon: 'AlarmClock', roles: ['STATION_MASTER', 'ZONE_LEADER', 'FACTORY_LEADER'] },
      { path: '/manager/report', title: '班站/作业区报表', icon: 'DataAnalysis', roles: ['STATION_MASTER', 'ZONE_LEADER'] }
    ]
  },
  {
    group: '数据驾驶舱',
    roles: ['FACTORY_LEADER', 'HR', 'ADMIN', 'ZONE_LEADER'],
    items: [
      { path: '/dashboard/factory', title: '厂级考核驾驶舱', icon: 'Histogram' },
      { path: '/dashboard/report-detail', title: '作业区日报查询', icon: 'Document' }
    ]
  },
  {
    group: '基础数据管理',
    roles: ['STATION_MASTER', 'ZONE_LEADER', 'ADMIN', 'HR', 'FACTORY_LEADER'],
    items: [
      { path: '/manager/employees', title: '人员管理', icon: 'User' },
      { path: '/manager/duties', title: '岗位职责', icon: 'List' },
      { path: '/manager/notices', title: '通知管理', icon: 'Bell' }
    ]
  }
]

// 根据角色过滤出当前用户可见的菜单（支持菜单项级 roles 限定）
export function menusForRole(role) {
  return menuConfig
    .filter((g) => g.roles.includes(role))
    .map((g) => ({ ...g, items: g.items.filter((it) => !it.roles || it.roles.includes(role)) }))
}
