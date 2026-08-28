import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '../store/auth.js'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: () => import('../views/Login.vue'), meta: { public: true } },
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    children: [
      // 员工端
      { path: 'employee/dashboard', component: () => import('../views/employee/Dashboard.vue'), meta: { roles: ['EMPLOYEE', 'STATION_MASTER', 'FACTORY_LEADER'], title: '我的工作台' } },
      { path: 'employee/report/create', component: () => import('../views/employee/ReportCreate.vue'), meta: { roles: ['EMPLOYEE', 'STATION_MASTER'], title: '每日任务提报' } },
      { path: 'employee/report/history', component: () => import('../views/employee/ReportHistory.vue'), meta: { roles: ['EMPLOYEE', 'STATION_MASTER'], title: '我的提交记录' } },
      { path: 'employee/performance', component: () => import('../views/employee/Performance.vue'), meta: { roles: ['EMPLOYEE', 'STATION_MASTER'], title: '我的绩效' } },
      { path: 'employee/appeal', component: () => import('../views/employee/Appeal.vue'), meta: { roles: ['EMPLOYEE', 'STATION_MASTER'], title: '问题申诉' } },
      // 领导端
      { path: 'manager/approval-center', component: () => import('../views/manager/ApprovalCenter.vue'), meta: { roles: ['STATION_MASTER', 'ZONE_LEADER', 'FACTORY_LEADER'], title: '审批中心' } },
      { path: 'manager/overdue', component: () => import('../views/manager/Overdue.vue'), meta: { roles: ['STATION_MASTER', 'ZONE_LEADER', 'FACTORY_LEADER'], title: '逾期未报' } },
      { path: 'manager/approve/:reportId', component: () => import('../views/manager/Approve.vue'), meta: { roles: ['STATION_MASTER', 'ZONE_LEADER'], title: '审批评分' } },
      { path: 'manager/report', component: () => import('../views/manager/StationReport.vue'), meta: { roles: ['STATION_MASTER', 'ZONE_LEADER'], title: '班站/作业区报表' } },
      { path: 'manager/employees', component: () => import('../views/manager/EmployeeManage.vue'), meta: { roles: ['STATION_MASTER', 'ZONE_LEADER', 'ADMIN', 'HR', 'FACTORY_LEADER'], title: '人员管理' } },
      { path: 'manager/duties', component: () => import('../views/manager/DutyManage.vue'), meta: { roles: ['STATION_MASTER', 'ZONE_LEADER', 'ADMIN', 'HR', 'FACTORY_LEADER'], title: '岗位职责' } },
      { path: 'manager/notices', component: () => import('../views/manager/NoticeManage.vue'), meta: { roles: ['STATION_MASTER', 'ZONE_LEADER', 'ADMIN', 'HR', 'FACTORY_LEADER'], title: '通知管理' } },
      // 班站长：兼填报与申诉复核
      { path: 'manager/report/create', component: () => import('../views/employee/ReportCreate.vue'), meta: { roles: ['STATION_MASTER'], title: '工作填报' } },
      { path: 'manager/appeal-review', component: () => import('../views/manager/AppealReview.vue'), meta: { roles: ['STATION_MASTER'], title: '申诉复核' } }, // 保留旧路由，入口已合并至审批中心

      // 驾驶舱
      { path: 'dashboard/factory', component: () => import('../views/factory/Cockpit.vue'), meta: { roles: ['FACTORY_LEADER', 'HR', 'ADMIN', 'ZONE_LEADER'], title: '厂级考核驾驶舱' } },
      { path: 'dashboard/employee/:userId', component: () => import('../views/factory/EmployeeProfile.vue'), meta: { roles: ['FACTORY_LEADER', 'HR', 'ZONE_LEADER'], title: '员工考核档案' } },
      { path: 'dashboard/report-detail', component: () => import('../views/factory/ReportDetail.vue'), meta: { roles: ['FACTORY_LEADER', 'HR', 'ADMIN', 'ZONE_LEADER'], title: '作业区日报查询' } }
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/login' }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.public) return true
  if (!auth.isLogin) return '/login'
  if (to.meta.roles && !to.meta.roles.includes(auth.role)) {
    return auth.homePath()
  }
  return true
})

export default router
