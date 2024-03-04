/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

/* eslint-disable no-console */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/*
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import {
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiModal,
  EuiModalBody,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiOverlayMask,
  EuiSpacer,
  EuiTextArea,
} from '@elastic/eui';
import React, { useState } from 'react';
import { ES3GatewayApiUrl } from '../../../../../../common/api';
import { getServices } from '../../../../../opensearch_dashboards_services';
import { S3_GATEWAY_API, S3_GATEWAY_API_OPENSEARCH_KEY } from '../../../../../../common';
import { ISource } from '../../../../../../common/IRow';

interface Props {
  _id: string;
  index: string;
  source: ISource;
  onClose: (updatedComment?: string) => void;
  title: string;
}

export function StudyCommentsModal(props: Props) {
  const uiSettings = getServices().uiSettings;
  const toastNotifications = getServices().toastNotifications;

  const [newStudyCommentsValue, setNewStudyCommentsValue] = useState(props.source.Comments);

  const onChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewStudyCommentsValue(event.target.value);
  };

  const onSave = () => {
    updateOpensearchDocComments()
      .then(() => {
        toastNotifications.addSuccess({
          title: `Update Study Comments`,
          text: `Study Comments has been updated successfully for _id: ${props._id}`,
        });
        props.onClose(newStudyCommentsValue);
      })
      .catch((error) => {
        toastNotifications.addDanger({
          title: `Error while updating Study Comments`,
          text: error,
        });
      });
  };

  function updateOpensearchDocComments() {
    return new Promise((resolve, reject) => {
      const oReq = new XMLHttpRequest();
      const url = `${
        uiSettings.get(S3_GATEWAY_API) + ES3GatewayApiUrl.OPENSEARCH_DOC_COMMENTS_UPDATE
      }`;

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
          reject('Authentication failed, please verify OPENSEARCH api token');
        }

        if (oReq.status !== 200 && oReq.status !== 201) {
          try {
            const parsedResponseText = JSON.parse(oReq.responseText);
            reject(`${parsedResponseText.message}`);
          } catch {
            reject(`Request failed with status code: ${oReq.status}, ${oReq.responseText}`);
          }
        } else {
          resolve({ response: oReq.responseText });
        }
      });

      console.info(`Sending Request to: ${url}`);
      oReq.open('POST', url + `?openSearchKey=${uiSettings.get(S3_GATEWAY_API_OPENSEARCH_KEY)}`);
      oReq.setRequestHeader('Accept', 'application/json');
      oReq.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');

      const body = {
        id: props._id,
        index: props.index,
        value: newStudyCommentsValue,
      };

      oReq.send(JSON.stringify(body));
    });
  }

  return (
    <EuiOverlayMask style="padding: 0">
      <EuiModal maxWidth={false} onClose={() => props.onClose()}>
        <EuiModalHeader>
          <EuiModalHeaderTitle>
            <span> {props.title} </span>
          </EuiModalHeaderTitle>
        </EuiModalHeader>
        <EuiModalBody>
          <EuiTextArea value={newStudyCommentsValue} onChange={(event) => onChange(event)} />

          <EuiSpacer />

          <EuiFlexGroup justifyContent="flexEnd" gutterSize="s">
            <EuiFlexItem grow={false}>
              <EuiButton color="primary" fill onClick={onSave}>
                Save
              </EuiButton>
            </EuiFlexItem>

            <EuiFlexItem grow={false}>
              <EuiButton color="primary" onClick={() => props.onClose()}>
                Cancel
              </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiModalBody>
      </EuiModal>
    </EuiOverlayMask>
  );
}
