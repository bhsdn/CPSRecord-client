/**
 * 全局指令注册
 */

import type { App } from "vue";
import lazyload from "./lazyload";

/**
 * 注册所有全局指令
 */
export function setupDirectives(app: App): void {
  app.directive("lazyload", lazyload);
}

export { lazyload };

