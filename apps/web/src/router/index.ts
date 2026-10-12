import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // 目前只有登录页，根路径先重定向过去。
    // 登录成功后的跳转目标页、以及未登录拦截的路由守卫，留到后续接入接口时再加。
    { path: '/', redirect: '/login' },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/login/index.vue'),
      meta: { title: '登录' },
    },
  ],
})

export default router
