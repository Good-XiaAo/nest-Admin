<template>
  <div
    class="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-900 px-4 py-10"
  >
    <!-- 背景装饰：两团模糊光斑，纯装饰不参与交互 -->
    <div
      class="pointer-events-none absolute -top-32 -left-24 h-96 w-96 rounded-full bg-brand-500/30 blur-3xl"
      aria-hidden="true"
    />
    <div
      class="pointer-events-none absolute -right-24 -bottom-32 h-96 w-96 rounded-full bg-sky-400/20 blur-3xl"
      aria-hidden="true"
    />

    <section
      class="login-card relative w-full max-w-md rounded-2xl border border-white/60 bg-white/95 p-8 shadow-2xl backdrop-blur-sm sm:p-10"
    >
      <!-- 品牌区 -->
      <header class="mb-8 text-center">
        <div
          class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg shadow-brand-600/30"
        >
          <svg
            class="h-7 w-7 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M12 2 3 7v10l9 5 9-5V7z" />
            <path d="M12 22V12M3 7l9 5 9-5" />
          </svg>
        </div>
        <h1 class="text-2xl font-semibold tracking-tight text-slate-800">Nest Admin</h1>
        <p class="mt-1.5 text-sm text-slate-500">欢迎回来，请登录你的账号</p>
      </header>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        :disabled="loading"
        size="large"
        label-position="top"
        hide-required-asterisk
        @submit.prevent="handleSubmit"
      >
        <el-form-item label="用户名" prop="userName">
          <el-input
            v-model.trim="form.userName"
            placeholder="请输入用户名"
            autocomplete="username"
            clearable
            :prefix-icon="User"
          />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            autocomplete="current-password"
            show-password
            :prefix-icon="Lock"
          />
        </el-form-item>

        <el-form-item label="验证码" prop="captcha">
          <div class="flex w-full items-stretch gap-2">
            <el-input
              class="min-w-0 flex-1"
              v-model.trim="form.captcha"
              placeholder="请输入验证码"
              autocomplete="one-time-code"
              :disabled="loading || !captchaReady"
              clearable
            />
            <button
              class="h-10 w-32 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-0 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-wait disabled:opacity-70"
              type="button"
              :disabled="captchaLoading || loading"
              :aria-busy="captchaLoading"
              aria-label="点击刷新验证码"
              @click="refreshCaptcha"
            >
              <img
                v-if="captchaUrl"
                :src="captchaUrl"
                alt="验证码，点击刷新"
                class="block h-full w-full object-contain"
              />
              <span v-else class="block px-2 text-sm text-slate-500">
                {{ captchaLoading ? '加载中...' : '点击刷新' }}
              </span>
            </button>
          </div>
        </el-form-item>

        <div class="mb-6 flex items-center justify-between">
          <el-checkbox v-model="form.remember">记住我</el-checkbox>
          <button
            type="button"
            class="text-sm font-medium text-brand-600 transition-colors hover:text-brand-700 hover:underline"
            @click="handleForgotPassword"
          >
            忘记密码？
          </button>
        </div>

        <el-button
          type="primary"
          size="large"
          class="w-full"
          :loading="loading"
          :disabled="loading || !captchaReady"
          native-type="submit"
        >
          {{ loading ? '登录中...' : '登 录' }}
        </el-button>
      </el-form>

      <p class="mt-8 text-center text-xs text-slate-400">© 2026 Nest Admin · 仅用于内部管理</p>
    </section>
  </div>
</template>
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { Lock, User } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { getCaptcha } from '@/api/user'

interface LoginForm {
  userName: string
  password: string
  remember: boolean
  captcha: string
}

const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive<LoginForm>({
  userName: '',
  password: '',
  remember: false,
  captcha: '',
})

const captchaUrl = ref('')
const captchaLoading = ref(false)
const captchaReady = computed(() => !captchaLoading.value && Boolean(captchaUrl.value))
let captchaObjectUrl = ''
let isUnmounted = false

/** 释放上一次的 Blob URL，并清除已失效的图片。 */
const revokeCaptchaUrl = () => {
  if (captchaObjectUrl) {
    URL.revokeObjectURL(captchaObjectUrl)
    captchaObjectUrl = ''
  }
  captchaUrl.value = ''
}

/**
 * 拉取并展示验证码。
 * 只负责「展示 + 刷新」，不校验、不提交；
 * 验证码文本由服务端写入 session，等登录接口接入时再一起校验。
 */
const refreshCaptcha = async () => {
  if (isUnmounted || captchaLoading.value || loading.value) return
  captchaLoading.value = true
  try {
    // 刷新会替换服务端 session 中的验证码，旧输入和旧图不能继续使用。
    form.captcha = ''
    formRef.value?.clearValidate('captcha')
    revokeCaptchaUrl()

    const blob = await getCaptcha()
    // 请求可能晚于组件卸载完成，此时不能再创建无人释放的 Blob URL。
    if (isUnmounted) return

    captchaObjectUrl = URL.createObjectURL(blob)
    captchaUrl.value = captchaObjectUrl
  } catch {
    if (isUnmounted) return
    // 错误提示已由 request 拦截器统一处理，保留刷新入口供用户重试。
    revokeCaptchaUrl()
  } finally {
    if (!isUnmounted) captchaLoading.value = false
  }
  
}

onMounted(refreshCaptcha)
onBeforeUnmount(() => {
  isUnmounted = true
  revokeCaptchaUrl()
})

/*
 * 校验规则只约束「格式是否可能是合法输入」，故意不做密码复杂度校验：
 * 登录时不该复刻注册的强度规则（例如后端 CreateUserDto 的大小写+数字+特殊字符），
 * 否则历史上改过策略的老账号将永远无法登录。复杂度校验属于注册/改密环节。
 * 长度上下限与后端 CreateUserDto 保持一致。
 */
const rules: FormRules = {
  userName: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 32, message: '用户名长度为 2 到 32 位', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度为 6 到 20 位', trigger: 'blur' },
  ],
  captcha: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { min: 4, max: 4, message: '验证码长度为 4 位', trigger: 'blur' },
  ],
}

/** 先加锁再校验，防重覆盖校验和提交；校验不通过时统一解锁。 */
const handleSubmit = async () => {
  if (isUnmounted || !formRef.value || loading.value || !captchaReady.value) return

  loading.value = true
  try {
    const valid = await formRef.value.validate().catch(() => false)
    if (!valid || isUnmounted) return

    // 静态页面阶段：后端尚无登录接口（server 端只有 user 的 CRUD，
    // 且没有任何 /auth/login 路由），这里先模拟请求耗时。
    // 接入接口时把这段替换成 request.post('/auth/login', form) 即可。
    await new Promise((resolve) => setTimeout(resolve, 800))
    if (isUnmounted) return

    ElMessage.success('校验通过。登录接口尚未接入，下一轮再补。')
  } finally {
    if (!isUnmounted) loading.value = false
  }
}

const handleForgotPassword = () => {
  ElMessage.info('请联系管理员重置密码')
}
</script>
<style scoped>
/* 卡片入场：轻微上浮 + 淡入，尊重用户的「减弱动态效果」系统偏好 */
.login-card {
  animation: card-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes card-in {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .login-card {
    animation: none;
  }
}

/* 让 Element Plus 的输入框边框更柔和，与卡片风格统一 */
:deep(.el-form-item__label) {
  font-weight: 500;
  color: var(--color-slate-600);
}

:deep(.el-input__wrapper) {
  border-radius: 0.5rem;
}
</style>
