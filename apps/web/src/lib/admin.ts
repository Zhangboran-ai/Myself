import { redirect } from 'next/navigation';
import { ApiError } from './api';

/**
 * 后台页面的统一取数入口。
 *
 * 布局与页面是并行渲染的：页面可能先于布局执行，若直接抛 401，
 * 会在重定向发生前留下一次无意义的错误日志与错误边界渲染。
 * 这里把 401 直接转成跳登录页，其余错误保持原样。
 */
export async function adminData<T>(loader: () => Promise<T>): Promise<T> {
  try {
    return await loader();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect('/admin/login');
    }
    throw error;
  }
}
