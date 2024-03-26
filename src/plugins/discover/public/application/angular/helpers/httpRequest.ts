/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getServices } from '../../../opensearch_dashboards_services';
import { S3_GATEWAY_API, S3_GATEWAY_API_OPENSEARCH_KEY } from '../../../../common';

export function httpRequestToS3Gateway(apiUrl: string, body?: any) {
  const uiSettings = getServices().uiSettings;
  const username = getServices().username;

  return new Promise((resolve, reject) => {
    const oReq = new XMLHttpRequest();
    const url = `${uiSettings.get(S3_GATEWAY_API) + apiUrl}`;

    oReq.addEventListener('error', (error) => {
      reject(
        `The url: '${url}' is not reachable. Please, verify the url is correct. You can get more information in console logs (Dev Tools).`
      );
    });

    oReq.addEventListener('load', () => {
      if (!oReq.responseText) {
        reject(new Error('Response was undefined'));
      }

      if (oReq.status === 401) {
        reject(
          'Authentication failed. Please, verify that valid OPENSEARCH API token and username provided'
        );
      }

      if (oReq.status !== 200 && oReq.status !== 201) {
        try {
          const parsedResponseText = JSON.parse(oReq.responseText);
          reject(`${parsedResponseText.message}`);
        } catch {
          reject(`Request failed with status code: ${oReq.status}, ${oReq.responseText}`);
        }
      } else {
        const data = JSON.parse(oReq.responseText);
        resolve({ data });
      }
    });

    // eslint-disable-next-line no-console
    console.info(`Sending Request to: ${url}`);
    oReq.open('POST', url + `?openSearchKey=${uiSettings.get(S3_GATEWAY_API_OPENSEARCH_KEY)}`);
    oReq.setRequestHeader('Accept', 'application/json');
    oReq.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
    oReq.setRequestHeader('x-username', username);

    oReq.send(body ? JSON.stringify(body) : undefined);
  });
}
