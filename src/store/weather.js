import { defineStore } from 'pinia'
import { WEATHER_TYPES, isBadWeather } from '../mock/data.js'

// 今日天气（全局，员工端可手动模拟）。中雨及以上为恶劣天气，日报自动满分。
export const useWeatherStore = defineStore('weather', {
  state: () => ({
    condition: 'CLEAR',
    date: '2026-08-27'
  }),
  getters: {
    info: (s) => WEATHER_TYPES.find((w) => w.code === s.condition) || WEATHER_TYPES[0],
    isBad: (s) => isBadWeather(s.condition)
  },
  actions: {
    setCondition(code) {
      this.condition = code
    }
  }
})
