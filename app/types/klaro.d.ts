import type { KlaroManager } from '../lib/klaro'

declare module 'klaro/dist/klaro-no-css.js' {
  export function setup(config?: Record<string, unknown>): void
  export function getManager(config?: Record<string, unknown>): KlaroManager
  export function show(config?: Record<string, unknown>, modal?: boolean): void
}
