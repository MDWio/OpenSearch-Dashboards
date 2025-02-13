/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

/* eslint-disable react-hooks/exhaustive-deps */

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
  EuiButtonEmpty,
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
import { ES3GatewayApiUrl } from '../../../../../../common/api';
import { IArchiveJson } from '../../../../../../common/IArchiveJson';

import { getServices } from '../../../../../opensearch_dashboards_services';
import {
  SAMPLE_SIZE_SETTING,
  AMAZON_S3_ARCHIVE_PATH,
  AMAZON_S3_ARCHIVE_BUCKET,
} from '../../../../../../common';
import { httpRequestToS3Gateway } from '../../../helpers/httpRequest';

interface Props {
  rows: any;
  onClose: () => void;
  title: string;
  isExportFromHitsCounter?: boolean;
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
      getArchiveProcessFromS3Gateway()
        .then((res) => {
          const archivingProcess = (res as any).data;
          setArchiveStatus(archivingProcess.status as EArchiveProcessStatus);

          if (archivingProcess.status === EArchiveProcessStatus.COMPLETED) {
            setArchiveLink(archivingProcess.archiveLink);

            if (archivingProcess.expirationDate) {
              const parsedDate = new Date(archivingProcess.expirationDate);
              if (parsedDate) {
                setExpirationDate(parsedDate.toLocaleDateString());
              }
            }
          } else if (archivingProcess.status === EArchiveProcessStatus.FAILED) {
            setErrorMessage(archivingProcess.errorMessage);
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
    if (!props.isExportFromHitsCounter) {
      setFilesAmount(props.rows.length);
    }

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

    createArchiveProcessToS3Gateway()
      .then((res: any) => {
        setDelayInMs(getMsDelayByFilesAmount());
        const result = res.data;
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
          {props.isExportFromHitsCounter && (
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
          )}
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
      <EuiFlexGroup className="generate-button" justifyContent="flexEnd" gutterSize="s">
        <EuiFlexItem grow={false}>
          <EuiButtonEmpty color="primary" onClick={() => props.onClose()}>
            Cancel
          </EuiButtonEmpty>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton color="primary" fill onClick={startArchiving}>
            Export
          </EuiButton>
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
                    <p className="warning-expiration">{' The link expires on ' + expirationDate}</p>
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

  function createArchiveProcessToS3Gateway() {
    const body = composeBodyFromRows();

    return httpRequestToS3Gateway(ES3GatewayApiUrl.ARCHIVE_PROCESS_CREATE, body);
  }

  function getArchiveProcessFromS3Gateway() {
    const body = { requestUid };

    return httpRequestToS3Gateway(ES3GatewayApiUrl.ARCHIVE_PROCESS_GET, body);
  }

  function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function composeBodyFromRows() {
    const archiveS3Path = uiSettings.get(AMAZON_S3_ARCHIVE_PATH);

    const emailField = email || undefined;
    const index = Array.isArray(props.rows) && props.rows.length > 0 ? props.rows[0]._index : '';

    const body: IArchiveJson = {
      archivePath: archiveS3Path,
      email: emailField,
      archiveName,
      bucket: uiSettings.get(AMAZON_S3_ARCHIVE_BUCKET),
      index,
      studies: [],
    };

    const studies = [];
    for (let i = 0; i < filesAmount; i++) {
      studies.push({ source: props.rows[i]._source });
    }

    for (const study of studies) {
      const bucket = study.source.dicom_filepath.split('/')[2];
      const s3Path = study.source.dicom_filepath.replace(`s3://${bucket}/`, '');

      const reportPath = study.source.report_filepath
        ? study.source.report_filepath.replace(`s3://${bucket}/`, '')
        : undefined;

      body.studies.push({
        studyInstanceUid: study.source.StudyInstanceUID,
        bucket,
        s3Path,
        reportPath,
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
