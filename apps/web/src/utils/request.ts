import axios from 'axios'

/**
 * 统一请求实例。
 * baseURL 用相对路径 /api，开发环境由 vite 代理转发到 server（见 vite.config.ts）。
 * withCredentials 必须开启：验证码文本存放在 express-session 中，
 * 后续登录校验依赖同一个会话 cookie。
 */
const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
  withCredentials: true,
})

// 统一收敛错误提示，业务层只处理成功分支
request.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.message ?? error?.message ?? '请求失败，请稍后重试'
    ElMessage.error(message)
    return Promise.reject(error)
  },
)

export default request
