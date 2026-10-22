import request from '@/utils/request'

/**
 * 获取图形验证码
 */
export const getCaptcha = () =>
  request
    .get<Blob>('/user/code', { responseType: 'blob' })
    .then((response) => response.data)
