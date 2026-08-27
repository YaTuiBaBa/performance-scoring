import { defineStore } from 'pinia'
import { duties } from '../mock/data.js'

// 岗位职责管理：常规职责 + 按日临时/专项必完成职责（演示用，内存 store）
// specials 对应「某个岗位某天需要加一条必完成的职责」
const seedSpecials = [
  { special_id: 'S-1', position_id: 'CYG-001', duty_desc: '参与雨季防汛应急演练', effective_date: '2026-08-28', is_required: 1, created_by: '赵建国', note: '厂部临时下达', status: 1 },
  { special_id: 'S-2', position_id: 'JSG-001', duty_desc: '配合第三方计量器具检定', effective_date: '2026-08-29', is_required: 1, created_by: '赵建国', note: '', status: 1 }
]

export const useDutyStore = defineStore('duties', {
  state: () => ({
    regular: JSON.parse(JSON.stringify(duties)),
    specials: JSON.parse(JSON.stringify(seedSpecials)),
    seq: 100
  }),
  getters: {
    regularByPosition: (s) => (pid) => s.regular.filter((d) => d.position_id === pid && d.status === 1),
    specialByPosition: (s) => (pid) => s.specials.filter((d) => d.position_id === pid && d.status === 1)
  },
  actions: {
    addRegular(payload) {
      this.regular.push({
        duty_id: 'D-NEW-' + this.seq++,
        position_id: payload.position_id,
        duty_category: payload.duty_category,
        duty_desc: payload.duty_desc,
        is_required: payload.is_required ? 1 : 0,
        sort_order: this.regular.filter((d) => d.position_id === payload.position_id).length + 1,
        status: 1
      })
    },
    updateRegular(id, payload) {
      const d = this.regular.find((x) => x.duty_id === id)
      if (!d) return
      Object.assign(d, {
        duty_category: payload.duty_category,
        duty_desc: payload.duty_desc,
        is_required: payload.is_required ? 1 : 0
      })
    },
    removeRegular(id) {
      const i = this.regular.findIndex((x) => x.duty_id === id)
      if (i >= 0) this.regular.splice(i, 1)
    },
    // 某岗位某天新增一条必完成职责
    addSpecial(payload) {
      this.specials.push({
        special_id: 'S-' + this.seq++,
        position_id: payload.position_id,
        duty_desc: payload.duty_desc,
        effective_date: payload.effective_date,
        is_required: 1,
        created_by: payload.created_by,
        note: payload.note || '',
        status: 1
      })
    },
    removeSpecial(id) {
      const i = this.specials.findIndex((x) => x.special_id === id)
      if (i >= 0) this.specials.splice(i, 1)
    }
  }
})
