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
  EuiFieldNumber,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiModal,
  EuiModalBody,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiOverlayMask,
  EuiSpacer,
} from '@elastic/eui';
import React, { useState } from 'react';
import { IArchiveJson } from '../../../../../../common/IArchiveJson';

import { getServices } from '../../../../../opensearch_dashboards_services';
import {
  SAMPLE_SIZE_SETTING,
  MARKETPLACE_API,
  MARKETPLACE_API_AMAZON_ARCHIVE,
  MARKETPLACE_API_OPENSEARCH_KEY,
  AMAZON_S3_ARCHIVE_PATH,
  REMOVE_AMAZON_ENDPOINT,
} from '../../../../../../common';

interface Props {
  rows: any;
  onClose: () => void;
  title: string;
}

export function ArchiverOpenModal(props: Props) {
  const uiSettings = getServices().uiSettings;
  enum EStatus {
    UNKNOWN = 'Unknown',
    LOADING = 'Loading...',
    ERROR = 'Error',
    SUCCESS = 'Success',
  }

  // Forms attributes
  const [archiveName, setArchiveName] = useState('');
  const [filesAmount, setFilesAmount] = useState(1);
  const [email, setEmail] = useState('');

  const [status, setStatus] = useState(EStatus.UNKNOWN);
  const [responseMessage, setResponseMessage] = useState('');
  const [expirationDate, setExpirationDate] = useState('');

  const maxRows =
    uiSettings.get(SAMPLE_SIZE_SETTING) > props.rows.length
      ? props.rows.length
      : uiSettings.get(SAMPLE_SIZE_SETTING);

  const getLinks = async () => {
    setStatus(EStatus.LOADING);
    setResponseMessage('');

    getArchiveLinkFromPlatform()
      .then((res) => {
        const result = JSON.parse((res as any).response);
        setStatus(EStatus.SUCCESS);
        setResponseMessage(result.archiveLink);
        setExpirationDate(result.expirationDate);
      })
      .catch((err) => {
        setStatus(EStatus.ERROR);
        setResponseMessage(err);
      });
  };

  const isValidUrl = (urlString: string) => {
    try {
      return Boolean(new URL(urlString));
    } catch (e) {
      return false;
    }
  };

  return (
    <EuiOverlayMask style="padding: 0">
      <EuiModal maxWidth="false" onClose={props.onClose}>
        <EuiModalHeader>
          <EuiModalHeaderTitle>
            <span> {props.title} </span>
          </EuiModalHeaderTitle>
        </EuiModalHeader>
        <EuiModalBody>
          <EuiFormRow label="Archive name *" helpText="without .zip">
            <EuiFieldText
              placeholder="Siemens_DX_Chest_Tubes_500"
              value={archiveName}
              onChange={(event) => {
                setArchiveName(event.target.value);
              }}
            />
          </EuiFormRow>
          <EuiFormRow
            label="Studies amount *"
            helpText={maxRows + ' max, it depends on setting: ' + SAMPLE_SIZE_SETTING}
          >
            <EuiFieldNumber
              placeholder="1"
              value={filesAmount}
              onChange={(event) => {
                setFilesAmount(Number(event.target.value));
              }}
              min={1}
              max={maxRows}
            />
          </EuiFormRow>
          <EuiFormRow label="Email" helpText="optional">
            <EuiFieldText
              placeholder="example@mail.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
              }}
            />
          </EuiFormRow>

          <EuiSpacer />

          <EuiFlexGroup responsive={false} wrap gutterSize="s" alignItems="center">
            <EuiFlexItem grow={false}>
              <EuiButton isLoading={status === EStatus.LOADING} onClick={getLinks}>
                Generate zip and get Link &hellip;
              </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>

          <EuiSpacer />

          {status !== EStatus.LOADING && status !== EStatus.UNKNOWN ? (
            <EuiFlexGroup responsive={false} wrap gutterSize="s" alignItems="center">
              <EuiFlexItem grow={false}>
                {isValidUrl(responseMessage) ? (
                  <div className="response">
                    <a className="archive-link" href={responseMessage}>
                      {responseMessage}
                    </a>
                    <p className="warning-expiration">{' It expires on ' + expirationDate}</p>
                  </div>
                ) : (
                  <p className="response"> {responseMessage} </p>
                )}
              </EuiFlexItem>
            </EuiFlexGroup>
          ) : (
            ''
          )}
        </EuiModalBody>
      </EuiModal>
    </EuiOverlayMask>
  );

  function getArchiveLinkFromPlatform() {
    return new Promise((resolve, reject) => {
      const oReq = new XMLHttpRequest();
      const url = `${
        uiSettings.get(MARKETPLACE_API) + uiSettings.get(MARKETPLACE_API_AMAZON_ARCHIVE)
      }`;

      oReq.addEventListener('error', (error) => {
        reject(
          `The url: '${url}' is not reachable. Please, verify the url is correct. You can get more information in console logs (Dev Tools).`
        );
      });

      oReq.addEventListener('load', () => {
        if (!oReq.responseText) {
          console.warn('Response was undefined');
          reject(new Error('Response was undefined'));
        }

        if (oReq.status === 401) {
          reject('Authentication failed, please verify OPENSEARCH api token');
        }

        if (oReq.status !== 200 && oReq.status !== 201) {
          reject(`Request failed with status code: ${oReq.status}, ${oReq.responseText}`);
        } else {
          resolve({ response: oReq.responseText });
        }
      });

      console.info(`Sending Request to: ${url}`);
      oReq.open('POST', url + `?openSearchKey=${uiSettings.get(MARKETPLACE_API_OPENSEARCH_KEY)}`);
      oReq.setRequestHeader('Accept', 'application/json');
      oReq.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');

      const replacedS3Domain = uiSettings.get(REMOVE_AMAZON_ENDPOINT);
      const body = composeBodyFromRows(replacedS3Domain);

      oReq.send(JSON.stringify(body));
    });
  }

  function composeBodyFromRows(s3domain: string) {
    const archiveS3Path = uiSettings.get(AMAZON_S3_ARCHIVE_PATH);

    const body: IArchiveJson = {
      archivePath: archiveS3Path,
      email,
      archiveName,
      s3domain,
      studies: [],
    };

    const studies = [];
    for (let i = 0; i < filesAmount; i++) {
      studies.push({ source: props.rows[i]._source });
    }

    for (const study of studies) {
      const s3Path = study.source.dicom_filepath.replace(s3domain, '');
      const fileNames = Array.isArray(study.source.FileName)
        ? study.source.FileName
        : [study.source.FileName];

      body.studies.push({
        studyInstanceUid: study.source.StudyInstanceUID,
        s3Path,
        fileNames,
      });
    }

    return body;
  }
}
