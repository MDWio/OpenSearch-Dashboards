/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

/* eslint-disable react-hooks/exhaustive-deps */

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
  EuiIcon,
  EuiLink,
  EuiLoadingSpinner,
  EuiModal,
  EuiModalBody,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiOverlayMask,
  EuiSpacer,
  EuiTextColor,
} from '@elastic/eui';
import React, { useEffect, useState } from 'react';
import { setTimeout } from 'timers';
import { IArchiveJson } from '../../../../../../common/IArchiveJson';

import { getServices } from '../../../../../opensearch_dashboards_services';
import {
  SAMPLE_SIZE_SETTING,
  MARKETPLACE_API,
  MARKETPLACE_API_ARCHIVE_PROCESS_GET,
  MARKETPLACE_API_ARCHIVE_PROCESS_CREATE,
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
  enum EArchiveRequestStatus {
    UNKNOWN = 'Unknown',
    LOADING = 'Loading...',
    ERROR = 'Error',
    SUCCESS = 'Success',
  }

  enum EArchiveProcessStatus {
    NOT_SUBMITTED = 'NOT_SUBMITTED',
    PENDING = 'PENDING',
    DOWNLOADING = 'DOWNLOADING',
    ARCHIVING = 'ARCHIVING',
    UPLOADING = 'UPLOADING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
  }

  const ARCHIVE_PROCESS_ACTIVE_STATUSES = [
    EArchiveProcessStatus.PENDING,
    EArchiveProcessStatus.DOWNLOADING,
    EArchiveProcessStatus.ARCHIVING,
    EArchiveProcessStatus.UPLOADING,
  ];

  const ARCHIVE_PROCESS_VISIBLE_STATUSES = [
    EArchiveProcessStatus.PENDING,
    EArchiveProcessStatus.DOWNLOADING,
    EArchiveProcessStatus.ARCHIVING,
    EArchiveProcessStatus.UPLOADING,
    EArchiveProcessStatus.COMPLETED,
  ];

  // Forms attributes
  const [archiveName, setArchiveName] = useState('');
  const [filesAmount, setFilesAmount] = useState(1);
  const [email, setEmail] = useState('');

  // Api fields
  const [requestStatus, setRequestStatus] = useState(EArchiveRequestStatus.UNKNOWN);
  const [archiveStatus, setArchiveStatus] = useState(EArchiveProcessStatus.NOT_SUBMITTED);
  const [requestUid, setRequestUid] = useState('');
  const [loopMutex, setLoopMutex] = useState(true);
  const [archiveLink, setArchiveLink] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [expirationDate, setExpirationDate] = useState('');

  const [delayInMs, setDelayInMs] = useState(2500);

  const getArchiveStatus = async () => {
    if (ARCHIVE_PROCESS_ACTIVE_STATUSES.includes(archiveStatus)) {
      getArchiveProcessFromPlatform()
        .then((res) => {
          const archivingProcess = (res as any).response;
          const archivingProcessObj = JSON.parse(archivingProcess);
          setArchiveStatus(archivingProcessObj.status as EArchiveProcessStatus);

          if (archivingProcessObj.status === EArchiveProcessStatus.COMPLETED) {
            setArchiveLink(archivingProcessObj.archiveLink);

            if (archivingProcessObj.expirationDate) {
              const parsedDate = new Date(archivingProcessObj.expirationDate);
              if (parsedDate) {
                setExpirationDate(parsedDate.toLocaleDateString());
              }
            }
          } else if (archivingProcessObj.status === EArchiveProcessStatus.FAILED) {
            setErrorMessage(archivingProcessObj.errorMessage);
          } else {
            delay(delayInMs).then(() => {
              setLoopMutex(!loopMutex);
            });
          }
        })
        .catch((err) => {
          setRequestStatus(EArchiveRequestStatus.ERROR);
          setErrorMessage(err);
        });
    } else {
      setRequestUid('');
    }
  };

  useEffect(() => {
    if (requestUid) {
      getArchiveStatus();
    }
  }, [loopMutex]);

  const maxRows =
    uiSettings.get(SAMPLE_SIZE_SETTING) > props.rows.length
      ? props.rows.length
      : uiSettings.get(SAMPLE_SIZE_SETTING);

  const startArchiving = async () => {
    setRequestStatus(EArchiveRequestStatus.LOADING);

    createArchiveProcessToPlatform()
      .then((res) => {
        setDelayInMs(getMsDelayByFilesAmount());
        const result = JSON.parse((res as any).response);
        setRequestStatus(EArchiveRequestStatus.SUCCESS);
        setArchiveStatus(EArchiveProcessStatus.PENDING);
        setRequestUid(result.requestUid);
        setLoopMutex(!loopMutex);
      })
      .catch((err) => {
        setRequestStatus(EArchiveRequestStatus.ERROR);
        setErrorMessage(err);
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

          {requestStatus === EArchiveRequestStatus.ERROR ||
          archiveStatus === EArchiveProcessStatus.FAILED ? (
            <>
              <p className="response">
                <EuiTextColor className="word-break" color="danger">
                  Error: {errorMessage}
                </EuiTextColor>
              </p>
              <GenerateZipButton />
            </>
          ) : requestStatus !== EArchiveRequestStatus.LOADING &&
            !ARCHIVE_PROCESS_VISIBLE_STATUSES.includes(archiveStatus) ? (
            <GenerateZipButton />
          ) : (
            <ArchiveStatusProcessArea />
          )}
        </EuiModalBody>
      </EuiModal>
    </EuiOverlayMask>
  );

  function GenerateZipButton() {
    return (
      <EuiFlexGroup
        className="generate-button"
        responsive={false}
        wrap
        gutterSize="m"
        alignItems="center"
      >
        <EuiFlexItem grow={false}>
          <EuiButton onClick={startArchiving}> Generate zip and get link </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  function ArchiveStatusProcessArea() {
    return (
      <div>
        {archiveStatus === EArchiveProcessStatus.PENDING ? (
          <>
            <p>
              <EuiTextColor color="default">
                <EuiLoadingSpinner size="m" /> Pending on queue
              </EuiTextColor>
            </p>
            <p>
              <EuiTextColor color="subdued"> Downloading studies </EuiTextColor>
            </p>
            <p>
              <EuiTextColor color="subdued"> Archiving studies </EuiTextColor>
            </p>
            <p>
              <EuiTextColor color="subdued"> Uploading archive to S3 </EuiTextColor>
            </p>
            <p>
              <EuiTextColor color="subdued"> Getting link to archive from S3 </EuiTextColor>
            </p>
          </>
        ) : archiveStatus === EArchiveProcessStatus.DOWNLOADING ? (
          <>
            <p>
              <EuiTextColor color="default">
                <EuiIcon size="m" type="check" /> Pending on queue
              </EuiTextColor>
            </p>
            <p>
              <EuiTextColor color="default">
                <EuiLoadingSpinner size="m" /> Downloading studies
              </EuiTextColor>
            </p>
            <p>
              <EuiTextColor color="subdued"> Archiving studies </EuiTextColor>
            </p>
            <p>
              <EuiTextColor color="subdued"> Uploading archive to S3 </EuiTextColor>
            </p>
            <p>
              <EuiTextColor color="subdued"> Getting link to archive from S3 </EuiTextColor>
            </p>
          </>
        ) : archiveStatus === EArchiveProcessStatus.ARCHIVING ? (
          <>
            <p>
              <EuiTextColor color="default">
                <EuiIcon size="m" type="check" /> Pending on queue
              </EuiTextColor>
            </p>
            <p>
              <EuiTextColor color="default">
                <EuiIcon size="m" type="check" /> Downloading studies
              </EuiTextColor>
            </p>
            <p>
              <EuiTextColor color="default">
                <EuiLoadingSpinner size="m" /> Archiving studies
              </EuiTextColor>
            </p>
            <p>
              <EuiTextColor color="subdued"> Uploading archive to S3 </EuiTextColor>
            </p>
            <p>
              <EuiTextColor color="subdued"> Getting link to archive from S3 </EuiTextColor>
            </p>
          </>
        ) : archiveStatus === EArchiveProcessStatus.UPLOADING ? (
          <>
            <p>
              <EuiTextColor color="default">
                <EuiIcon size="m" type="check" /> Pending on queue
              </EuiTextColor>
            </p>
            <p>
              <EuiTextColor color="default">
                <EuiIcon size="m" type="check" /> Downloading studies
              </EuiTextColor>
            </p>
            <p>
              <EuiTextColor color="default">
                <EuiIcon size="m" type="check" /> Archiving studies
              </EuiTextColor>
            </p>
            <p>
              <EuiTextColor color="default">
                <EuiLoadingSpinner size="m" /> Uploading archive to S3
              </EuiTextColor>
            </p>
            <p>
              <EuiTextColor color="subdued"> Getting link to archive from S3 </EuiTextColor>
            </p>
          </>
        ) : archiveStatus === EArchiveProcessStatus.COMPLETED ? (
          <>
            <p>
              <EuiTextColor color="default">
                <EuiIcon size="m" type="check" /> Pending on queue
              </EuiTextColor>
            </p>
            <p>
              <EuiTextColor color="default">
                <EuiIcon size="m" type="check" /> Downloading studies
              </EuiTextColor>
            </p>
            <p>
              <EuiTextColor color="default">
                <EuiIcon size="m" type="check" /> Archiving studies
              </EuiTextColor>
            </p>
            <p>
              <EuiTextColor color="default">
                <EuiIcon size="m" type="check" /> Uploading archive to S3
              </EuiTextColor>
            </p>
            <p>
              <EuiTextColor color="default">
                <EuiIcon size="m" type="check" /> Getting link to archive from S3
              </EuiTextColor>
            </p>
            <EuiFlexGroup responsive={false} wrap gutterSize="s" alignItems="center">
              <EuiFlexItem grow={false}>
                {isValidUrl(archiveLink) ? (
                  <div className="response">
                    <EuiLink className="download-link" href={archiveLink}>
                      Download
                    </EuiLink>
                    <p className="warning-expiration">{' It expires on ' + expirationDate}</p>
                  </div>
                ) : (
                  <p className="response"> {archiveLink} </p>
                )}
              </EuiFlexItem>
            </EuiFlexGroup>
            <GenerateZipButton />
          </>
        ) : (
          ''
        )}
      </div>
    );
  }

  function createArchiveProcessToPlatform() {
    return new Promise((resolve, reject) => {
      const oReq = new XMLHttpRequest();
      const url = `${
        uiSettings.get(MARKETPLACE_API) + uiSettings.get(MARKETPLACE_API_ARCHIVE_PROCESS_CREATE)
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
      oReq.open('POST', url + `?openSearchKey=${uiSettings.get(MARKETPLACE_API_OPENSEARCH_KEY)}`);
      oReq.setRequestHeader('Accept', 'application/json');
      oReq.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');

      const replacedS3Domain = uiSettings.get(REMOVE_AMAZON_ENDPOINT);
      const body = composeBodyFromRows(replacedS3Domain);

      oReq.send(JSON.stringify(body));
    });
  }

  function getArchiveProcessFromPlatform() {
    return new Promise((resolve, reject) => {
      const oReq = new XMLHttpRequest();
      const url = `${
        uiSettings.get(MARKETPLACE_API) + uiSettings.get(MARKETPLACE_API_ARCHIVE_PROCESS_GET)
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
      oReq.open('POST', url + `?openSearchKey=${uiSettings.get(MARKETPLACE_API_OPENSEARCH_KEY)}`);
      oReq.setRequestHeader('Accept', 'application/json');
      oReq.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');

      const body = { requestUid };

      oReq.send(JSON.stringify(body));
    });
  }

  function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function composeBodyFromRows(s3domain: string) {
    const archiveS3Path = uiSettings.get(AMAZON_S3_ARCHIVE_PATH);
    const emailField = email || undefined;

    const body: IArchiveJson = {
      archivePath: archiveS3Path,
      email: emailField,
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

      const reportPath = study.source.report_filepath
        ? study.source.report_filepath.replace(s3domain, '')
        : undefined;

      body.studies.push({
        studyInstanceUid: study.source.StudyInstanceUID,
        s3Path,
        reportPath,
        fileNames,
      });
    }

    return body;
  }

  function getMsDelayByFilesAmount() {
    if (filesAmount < 10) {
      return 2500;
    } else if (filesAmount < 50) {
      return 3500;
    } else if (filesAmount < 100) {
      return 5000;
    } else {
      return 10000;
    }
  }
}
