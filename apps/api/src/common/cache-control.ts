import { SetMetadata } from '@nestjs/common';

export const CACHE_CONTROL_KEY = 'cache-control';

/**
 * 声明响应的 Cache-Control。
 * 用元数据而不是直接写响应头，是为了让公开接口与后台接口在类级别统一声明，
 * 具体写入由 CacheControlInterceptor 完成。
 */
export const CacheControl = (value: string) => SetMetadata(CACHE_CONTROL_KEY, value);
