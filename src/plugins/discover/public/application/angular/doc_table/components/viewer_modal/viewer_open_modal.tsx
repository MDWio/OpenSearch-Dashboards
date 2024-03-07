/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

/* eslint-disable no-console */

/* eslint-disable no-shadow */

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
import { getServices } from '../../../../../opensearch_dashboards_services';
import { IDicomJson } from '../../../../../../common/IDicomJson';
import { IDicomFile } from '../../../../../../common/getS3KeysByFileNames';
import {
  S3_GATEWAY_API,
  S3_GATEWAY_API_LINKS,
  S3_GATEWAY_API_OPENSEARCH_KEY,
  VIEWER_URL,
} from '../../../../../../common';
import { ISource } from '../../../../../../common/IRow';

interface Props {
  sources: ISource[];
  onClose: () => void;
  title: string;
  isDualMod?: boolean;
}

export function ViewerOpenModal(props: Props) {
  const uiSettings = getServices().uiSettings;

  const [state, setState] = useState('');
  const [src, setSrc] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setState('gettingS3Links');
    const parsedLinksToImages = [] as IDicomFile[][];
    const parsedSource = [] as IDicomJson[];

    async function formDataForViewer() {
      try {
        for (const source of props.sources) {
          const bucket = source.dicom_filepath.split('/')[2];
          const s3path = source.dicom_filepath.replace(`s3://${bucket}/`, '');

          const res = await getS3UrlViaS3Gateway(source.FileName, bucket, s3path);
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

        setSrc(encodedUrl);
        setState('s3LinksRetrieved');
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
    throw new Error('While retrieving S3 links from Marketplace: ' + JSON.stringify(errorMsg));
  };

  return (
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
  );

  function getS3UrlViaS3Gateway(fileNames: string[], bucket: string, s3path: string) {
    return new Promise((resolve, reject) => {
      const oReq = new XMLHttpRequest();
      const url = `${uiSettings.get(S3_GATEWAY_API) + uiSettings.get(S3_GATEWAY_API_LINKS)}`;

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
          const data = JSON.parse(oReq.responseText);

          resolve({ data });
        }
      });

      console.info(`Sending Request to: ${url}`);
      oReq.open('POST', url + `?openSearchKey=${uiSettings.get(S3_GATEWAY_API_OPENSEARCH_KEY)}`);
      oReq.setRequestHeader('Accept', 'application/json');
      oReq.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');

      const fileNamesArray = Array.isArray(fileNames) ? fileNames : [fileNames];

      oReq.send(JSON.stringify({ fileNames: fileNamesArray, s3path, bucket }));
    });
  }

  function parseSourceToIDicomJson(source: ISource) {
    const example: IDicomJson = {
      studies: [
        {
          StudyInstanceUID: String(source.StudyInstanceUID),
          StudyDate: String(source.StudyDate),
          StudyTime: String(source.StudyTime),
          PatientName: String(source.PatientName),
          PatientID: String(source.PatientID),
          AccessionNumber: String(source.AccessionNumber),
          PatientAge: String(source.PatientAge),
          PatientSex: String(source.PatientSex),
          series: [
            {
              SeriesInstanceUID: String(source.SeriesInstanceUID),
              SeriesNumber: Number(source.SeriesNumber),
              Modality: String(source.Modality),
              instances: [
                {
                  metadata: {
                    Columns: Number(source.Columns),
                    Rows: Number(source.Rows),
                    InstanceNumber: source.InstanceNumber,
                    SOPClassUID: String(source.SOPClassUID),
                    PhotometricInterpretation: String(source.PhotometricInterpretation),
                    BitsAllocated: Number(source.BitsAllocated),
                    BitsStored: Number(source.BitsStored),
                    NumberOfFrames: Number(source.NumberOfFrames),
                    PixelRepresentation: Number(source.PixelRepresentation),
                    PixelSpacing: [Number(source.PixelSpacing0), Number(source.PixelSpacing1)],
                    HighBit: Number(source.HighBit),
                    Modality: String(source.Modality),
                    SamplesPerPixel: Number(source.SamplesPerPixel),
                    SOPInstanceUID: String(source.SOPInstanceUID),
                    SeriesInstanceUID: String(source.SeriesInstanceUID),
                    StudyInstanceUID: String(source.StudyInstanceUID),
                  },
                  url: 'dicomweb:',
                },
              ],
            },
          ],
        },
      ],
    };
    return example;
  }
}
