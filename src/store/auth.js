import { defineStore } from 'pinia'
import { employees, employeeMap, demoAccounts } from '../mock/data.js'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('ps_token') || '',
    user: JSON.parse(localStorage.getItem('ps_user') || 'null')
  }),
  getters: {
    isLogin: (s) => !!s.token,
    role: (s) => (s.user ? s.user.role : '')
  },
  actions: {
    loginByUsername(username) {
      const acc = demoAccounts.find((a) => a.username === username) || employees.find((e) => e.username === username)
      if (!acc) return { ok: false, msg: '账号不存在' }
      const user = employeeMap[acc.user_id]
      this.user = user
      this.token = 'mock-token-' + user.user_id
      localStorage.setItem('ps_token', this.token)
      localStorage.setItem('ps_user', JSON.stringify(user))
      return { ok: true, msg: '登录成功', user }
    },
    logout() {
      this.token = ''
      this.user = null
      localStorage.removeItem('ps_token')
      localStorage.removeItem('ps_user')
    },
    homePath() {
      const map = {
        EMPLOYEE: '/employee/dashboard',
        STATION_MASTER: '/employee/dashboard',
        ZONE_LEADER: '/manager/report',
        FACTORY_LEADER: '/employee/dashboard',
        HR: '/dashboard/factory',
        ADMIN: '/admin/positions'
      }
      return map[this.role] || '/employee/dashboard'
    }
  }
})
