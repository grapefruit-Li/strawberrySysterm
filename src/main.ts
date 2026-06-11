import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/main.css'
import './style.css'

/* 创建应用实例 */
const app = createApp(App)

/* 注册 Pinia 状态管理 */
const pinia = createPinia()
app.use(pinia)

/* 注册路由 */
app.use(router)

/* 挂载应用 */
app.mount('#app')
