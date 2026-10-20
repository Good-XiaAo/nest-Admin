import request from '@/utils/request'

/**
 * 获取图形验证码。
 * 服务端直接返回 SVG（image/svg+xml），验证码文本写入 session；
 * 这里按 Blob 取回，交给调用方转成可展示的 URL。
 */
export const getCaptcha = () =>
  request
    .get<Blob>('/user/code', { responseType: 'blob' })
    .then((response) => response.data)
