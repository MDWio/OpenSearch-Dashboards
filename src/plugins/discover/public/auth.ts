/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpStart, HttpHandler } from 'opensearch-dashboards/public';

export const API_PREFIX = '/api/v1';
export const API_ENDPOINT_ACCOUNT_INFO = API_PREFIX + '/configuration/account';

export interface AccountInfo {
  data: {
    user_name: string;
    is_internal_user: boolean;
    user_requested_tenant?: string;
    backend_roles: string[];
    roles: string[];
    tenants: {
      [tenant: string]: true;
    };
  };
}

export async function httpGetWithIgnores<T>(
  http: HttpStart,
  url: string,
  ignores: number[]
): Promise<T | undefined> {
  return await requestWithIgnores<T>(http.get, url, ignores);
}

/**
 * Send a request but ignore some error codes (suppress exception)
 * @param requestFunc
 * @param url
 * @param ignores the error codes to be ignored
 */
export async function requestWithIgnores<T>(
  requestFunc: HttpHandler,
  url: string,
  ignores: number[],
  body?: object
): Promise<T | undefined> {
  try {
    return await request<T>(requestFunc, url, body);
  } catch (e) {
    if (!ignores.includes(e?.response?.status)) {
      throw e;
    }
  }
}

export async function request<T>(requestFunc: HttpHandler, url: string, body?: object): Promise<T> {
  if (body) {
    return (await requestFunc(url, { body: JSON.stringify(body) })) as T;
  }
  return (await requestFunc(url)) as T;
}

export async function fetchAccountInfoSafe(http: HttpStart): Promise<AccountInfo | undefined> {
  return httpGetWithIgnores<AccountInfo>(http, API_ENDPOINT_ACCOUNT_INFO, [401]);
}
