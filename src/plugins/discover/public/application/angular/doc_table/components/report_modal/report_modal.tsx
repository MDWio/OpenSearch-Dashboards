/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */

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
  EuiErrorBoundary,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLoadingSpinner,
  EuiModal,
  EuiModalBody,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiOverlayMask,
  EuiText,
  EuiTextAlign,
} from '@elastic/eui';
import React, { useEffect, useState } from 'react';
import { ES3GatewayApiUrl } from '../../../../../../common/api';
import { httpRequestToS3Gateway } from '../../../helpers/httpRequest';

export interface INlpReport {
  url: string;
  title: string;
}

interface Props {
  reports: INlpReport[];
  studyInstanceUID: string;
  index: string;
  title: string;
  onClose: () => void;
}

interface HttpResponse {
  data: {
    reportLink: string;
  };
}

export function ReportModal(props: Props) {
  const [state, setState] = useState('');
  const [src, setSrc] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [currentReportIndex, setCurrentReportIndex] = useState(0);

  useEffect(() => {
    setReport(currentReportIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // array must be empty to avoid infinite loop

  function setReport(index: number) {
    setCurrentReportIndex(index);
    setState('gettingS3Link');

    async function formDataForReport() {
      try {
        const response = ((await getSignedReportLink(props.reports[index].url)) as HttpResponse)
          .data;

        if (response.reportLink) {
          setSrc(response.reportLink);
          setState('s3LinksRetrieved');

          return;
        }
      } catch (err: any) {
        setErrorMsg(err);
        setState('error');
      }
    }

    formDataForReport();
  }

  function getSignedReportLink(reportPath: string) {
    const bucket = reportPath.split('/')[2];
    const s3path = reportPath.replace(`s3://${bucket}/`, '');

    const body = {
      s3path,
      bucket,
      studyInstanceUID: props.studyInstanceUID,
      index: props.index,
    };

    return httpRequestToS3Gateway(ES3GatewayApiUrl.REPORT_LINK_GET, body);
  }

  function onReportLoaded() {
    setState('reportLoaded');
  }

  const HttpApiError = () => {
    throw new Error('While retrieving S3 links from S3 gateway: ' + JSON.stringify(errorMsg));
  };

  return (
    <EuiOverlayMask id="ReportOverlay" style="padding: 0">
      <EuiModal id="ReportModal" maxWidth="false" onClose={() => props.onClose()}>
        <EuiModalHeader>
          <EuiFlexGroup justifyContent="spaceBetween">
            <EuiFlexItem grow={1}>
              <EuiModalHeaderTitle>
                <span> {props.title} </span>
                {state !== 'reportLoaded' && state !== 'error' ? (
                  <EuiLoadingSpinner title="Loading NLP Report" size="l" />
                ) : (
                  ''
                )}
              </EuiModalHeaderTitle>
            </EuiFlexItem>
            <EuiFlexItem grow={1}>
              <EuiText className="reports-pager">
                <EuiTextAlign textAlign="center">
                  <span>{props.reports[currentReportIndex].title}</span>
                </EuiTextAlign>
              </EuiText>
            </EuiFlexItem>
            <EuiFlexItem grow={1}>
              <EuiFlexGroup>
                <EuiFlexItem>
                  <EuiButton
                    fill
                    onClick={
                      currentReportIndex > 0 ? () => setReport(currentReportIndex - 1) : undefined
                    }
                  >
                    Previous
                  </EuiButton>
                </EuiFlexItem>
                <EuiFlexItem>
                  <EuiButton
                    fill
                    onClick={
                      currentReportIndex !== props.reports.length - 1
                        ? () => setReport(currentReportIndex + 1)
                        : undefined
                    }
                  >
                    Next
                  </EuiButton>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiModalHeader>
        <EuiModalBody>
          <div className="iframe-container">
            {state === 'gettingS3Link' ? (
              <h1> Getting link from S3... </h1>
            ) : state === 'error' ? (
              <h1>
                <EuiErrorBoundary>
                  <HttpApiError />
                </EuiErrorBoundary>
              </h1>
            ) : (
              <iframe onLoad={onReportLoaded} src={src} className="iframe" title="NLP Report" />
            )}
          </div>
        </EuiModalBody>
      </EuiModal>
    </EuiOverlayMask>
  );
}
