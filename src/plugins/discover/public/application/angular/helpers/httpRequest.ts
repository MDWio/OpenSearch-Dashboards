/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export function httpRequestToS3Gateway(apiUrl: string, body?: any) {
  return new Promise((resolve, reject) => {
    const oReq = new XMLHttpRequest();

    oReq.addEventListener('error', (error) => {
      reject(
        `The url: '${apiUrl}' is not reachable. Please, verify the url is correct. You can get more information in console logs (Dev Tools).`
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
    console.info(`Sending Request to: ${apiUrl}`);

    // Enable credentials to send cookies for authentication
    oReq.withCredentials = true;
    oReq.open('POST', apiUrl);
    oReq.setRequestHeader('Accept', 'application/json');
    oReq.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');

    oReq.send(body ? JSON.stringify(body) : undefined);
  });
}
