/**
 * dsh-done-pill — client 半身入口（对话完成胶囊）。
 *
 * 注册 shell.overlay 顶部悬浮胶囊 + 通用设置里的 5 行（显隐 / 休息提醒 /
 * 凌晨提醒 / 尺寸 / 字体）。全部 UI 在 ./pill.tsx（自 webui done-pill 移植）。
 *
 * 服务依赖：只有 slots 是硬依赖；sessions（点击跳会话）在 applyDonePill
 * 内 try/catch 获取，不可用时降级为「不可跳转」。
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import { applyDonePill } from './pill'

/** 顶层服务依赖（client boot graph 用）。 */
export const inject = ['slots']

/** 单个模块失败不拖垮插件整体（本插件只有胶囊一个模块，仍保持惯例）。 */
function guarded(ctx: ClientContext, label: string, mount: () => void): void {
  try {
    mount()
  } catch (error) {
    console.warn(`[dsh-done-pill] ${label} 挂载失败：${error instanceof Error ? error.message : String(error)}`)
  }
}

export function apply(ctx: ClientContext): void {
  guarded(ctx, 'done pill', () => applyDonePill(ctx))
}
