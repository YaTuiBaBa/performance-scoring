import { defineStore } from 'pinia'
import { employees } from '../mock/data.js'

// 人员管理：员工信息 CRUD（演示用，内存 store）
export const usePersonnelStore = defineStore('personnel', {
  state: () => ({
    list: JSON.parse(JSON.stringify(employees)),
    seq: 9100
  }),
  getters: {
    byId: (s) => (id) => s.list.find((e) => e.user_id === id)
  },
  actions: {
    add(payload) {
      const id = 'U-' + this.seq++
      this.list.push({
        user_id: id,
        username: payload.username,
        real_name: payload.real_name,
        primary_position_id: payload.primary_position_id,
        department: payload.department,
        station: payload.station || '',
        phone: payload.phone || '',
        role: payload.role,
        leader_id: payload.leader_id || null,
        entry_date: payload.entry_date || new Date().toISOString().slice(0, 10),
        status: payload.status ?? 1
      })
      return id
    },
    update(id, payload) {
      const e = this.byId(id)
      if (!e) return
      Object.assign(e, {
        username: payload.username,
        real_name: payload.real_name,
        primary_position_id: payload.primary_position_id,
        department: payload.department,
        station: payload.station || '',
        phone: payload.phone || '',
        role: payload.role,
        leader_id: payload.leader_id || null,
        status: payload.status ?? 1
      })
    },
    remove(id) {
      const i = this.list.findIndex((e) => e.user_id === id)
      if (i >= 0) this.list.splice(i, 1)
    }
  }
})
