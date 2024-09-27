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
import { ES3GatewayApiUrl } from '../../../../../../common/api';
import { getServices } from '../../../../../opensearch_dashboards_services';
import {
  S3_GATEWAY_API,
  S3_GATEWAY_API_OPENSEARCH_KEY,
  VIEWER_URL,
} from '../../../../../../common';

interface Props {
  ids: string[];
  index: string;
  onClose: () => void;
  title: string;
  openInNewTab?: boolean;
  isDualMod?: boolean;
}

enum EViewerState {
  SETTING_URL = 'SETTING_URL',
  LOADING_VIEWER = 'LOADING_VIEWER',
  VIEWER_LOADED = 'VIEWER_LOADED',
  ERROR = 'ERROR',
}

export function ViewerOpenModal(props: Props) {
  const uiSettings = getServices().uiSettings;

  const [state, setState] = useState('');
  const [src, setSrc] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setState(EViewerState.SETTING_URL);

    async function formDataForViewer() {
      try {
        const ids = props.ids;
        const token = uiSettings.get(S3_GATEWAY_API_OPENSEARCH_KEY);
        const baseUrl = `${uiSettings.get(VIEWER_URL)}/viewer`;
        const nestedUrl = uiSettings.get(S3_GATEWAY_API) + ES3GatewayApiUrl.OPENSEARCH_JSON_GET;
        const isDualMod = props.isDualMod;
        const encodedNestedUrl = encodeURIComponent(
          `${nestedUrl}?ids=${ids.join(',')}&index=${props.index}&openSearchKey=${token}`
        );

        const fullUrl =
          `${baseUrl}?url=${encodedNestedUrl}&username=${getServices().username}` +
          `&isDualMod=${isDualMod}`;

        if (props.openInNewTab) {
          const tabOrWindow = window.open(fullUrl, '_blank');
          tabOrWindow!.focus();
          props.onClose();
        } else {
          setState(EViewerState.LOADING_VIEWER);
          setSrc(fullUrl);
        }
      } catch (err: any) {
        setErrorMsg(err);
        setState(EViewerState.ERROR);
      }
    }

    formDataForViewer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // array must be empty to avoid infinite loop

  function onViewerLoaded() {
    setState(EViewerState.VIEWER_LOADED);
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
            {state !== EViewerState.VIEWER_LOADED && state !== EViewerState.ERROR ? (
              <EuiLoadingSpinner title="Loading OHIF Viewer" size="l" />
            ) : (
              ''
            )}
          </EuiModalHeaderTitle>
        </EuiModalHeader>
        <EuiModalBody>
          <div className="iframe-container">
            {state === EViewerState.SETTING_URL ? (
              <h1> Setting URL... </h1>
            ) : state === EViewerState.ERROR ? (
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
