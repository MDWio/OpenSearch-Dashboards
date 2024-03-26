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
  EuiErrorBoundary,
  EuiLoadingSpinner,
  EuiModal,
  EuiModalBody,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiOverlayMask,
} from '@elastic/eui';
import React, { useEffect, useState } from 'react';
import { IDicomJson } from 'src/plugins/discover/common/IDicomJson';
import { getServices } from '../../../../../opensearch_dashboards_services';
import { IDicomFile } from '../../../../../../common/getS3KeysByFileNames';
import { VIEWER_URL } from '../../../../../../common';
import { ISource } from '../../../../../../common/IRow';
import { getS3UrlViaS3Gateway, parseSourceToIDicomJson } from './utils';

interface Props {
  sources: ISource[];
  onClose: () => void;
  title: string;
  openInNewTab?: boolean;
  isDualMod?: boolean;
}

export function ViewerOpenModal(props: Props) {
  const uiSettings = getServices().uiSettings;

  const [state, setState] = useState('');
  const [src, setSrc] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setState('gettingS3Links');
    const parsedLinksToImages = new Array<IDicomFile[]>();
    const parsedSource = new Array<IDicomJson>();

    async function formDataForViewer() {
      try {
        for (const source of props.sources) {
          const bucket = source.dicom_filepath.split('/')[2];
          const s3path = source.dicom_filepath.replace(`s3://${bucket}/`, '');

          const res = await getS3UrlViaS3Gateway(source.FileName, bucket, s3path, uiSettings);
          parsedLinksToImages.push(res as IDicomFile[]);
          parsedSource.push(parseSourceToIDicomJson(source));
        }

        let encodedUrl =
          `${uiSettings.get(VIEWER_URL)}/viewer?json=` +
          encodeURIComponent(JSON.stringify(parsedSource)) +
          '&images=' +
          encodeURIComponent(JSON.stringify(parsedLinksToImages));

        if (props.isDualMod) {
          encodedUrl += '&isDualMod=true';
        }

        if (props.openInNewTab) {
          const tabOrWindow = window.open(encodedUrl, '_blank');
          tabOrWindow!.focus();
          props.onClose();
        } else {
          setSrc(encodedUrl);
          setState('s3LinksRetrieved');
        }
      } catch (err: any) {
        setErrorMsg(err);
        setState('error');
      }
    }

    formDataForViewer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // array must be empty to avoid infinite loop

  function onViewerLoaded() {
    setState('viewerLoaded');
  }

  const HttpApiError = () => {
    throw new Error('While retrieving S3 links from S3 gateway: ' + JSON.stringify(errorMsg));
  };

  return !props.openInNewTab ? (
    <EuiOverlayMask id="ViewerOverlay" style="padding: 0">
      <EuiModal id="ViewerModal" maxWidth="false" onClose={props.onClose}>
        <EuiModalHeader>
          <EuiModalHeaderTitle>
            <span> {props.title} </span>
            {state !== 'viewerLoaded' && state !== 'error' ? (
              <EuiLoadingSpinner title="Loading OHIF Viewer" size="l" />
            ) : (
              ''
            )}
          </EuiModalHeaderTitle>
        </EuiModalHeader>
        <EuiModalBody>
          <div className="iframe-container">
            {state === 'gettingS3Links' ? (
              <h1> Getting links from S3... </h1>
            ) : state === 'error' ? (
              <h1>
                <EuiErrorBoundary>
                  <HttpApiError />
                </EuiErrorBoundary>
              </h1>
            ) : (
              <iframe onLoad={onViewerLoaded} src={src} className="iframe" title="View DICOM" />
            )}
          </div>
        </EuiModalBody>
      </EuiModal>
    </EuiOverlayMask>
  ) : (
    <></>
  );
}
