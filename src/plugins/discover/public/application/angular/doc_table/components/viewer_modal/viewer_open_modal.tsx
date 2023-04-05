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
  EuiModal,
  EuiModalBody,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiOverlayMask,
} from '@elastic/eui';
import React, { useEffect, useState } from 'react';
import { getServices } from '../../../../../opensearch_dashboards_services';
import { IDicomJson } from '../../../../../../common/IDicomJson';
import {
  MARKETPLACE_API,
  MARKETPLACE_API_AMAZON,
  MARKETPLACE_API_SECRET_KEY,
  REMOVE_AMAZON_ENDPOINT,
  VIEWER_URL,
} from '../../../../../../common';

interface Props {
  source: any;
  onClose: () => void;
  title: string;
}

export function ViewerOpenModal(props: Props) {
  const uiSettings = getServices().uiSettings;

  const [state, setState] = useState('');
  const [src, setSrc] = useState('');

  const s3keys = getFileUrlsByFilenames([props.source.FileName]);

  useEffect(() => {
    setState('loading');
    getS3UrlFromPlatform(s3keys[0])
      .then((res) => {
        const parsedLink = String((res as any).link);

        const parsedSource = parseSourceToIDicomJson(props.source);
        const stringSource = JSON.stringify(parsedSource);

        const encodedUrl =
          `${uiSettings.get(VIEWER_URL)}/viewer?json=` +
          encodeURIComponent(stringSource) +
          '&url=' +
          encodeURIComponent(parsedLink);

        setSrc(encodedUrl);
        setState('success');
      })
      .catch((err) => {
        console.error('Error:', err);
        setState('error');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // array must be empty to avoid infinite loop

  return (
    <EuiOverlayMask>
      <EuiModal className="osdViewerOpenModal" onClose={props.onClose}>
        <EuiModalHeader>
          <EuiModalHeaderTitle> View Dicom </EuiModalHeaderTitle>
        </EuiModalHeader>
        <EuiModalBody>
          <div className="iframe-container">
            {/* <div> {JSON.stringify(urls)} </div> */}
            {state === 'loading' ? (
              <h1> Loading... </h1>
            ) : (
              <iframe src={src} className="iframe" title="View DICOM" />
            )}
          </div>
        </EuiModalBody>
      </EuiModal>
    </EuiOverlayMask>
  );

  function getFileUrlsByFilenames(filenames: string[]) {
    const s3path = props.source.dicom_filepath.replace(
      `${uiSettings.get(REMOVE_AMAZON_ENDPOINT)}`,
      ''
    );

    const fileUrls = filenames.map((filename) => {
      return s3path + filename;
    });

    return fileUrls;
  }

  function getS3UrlFromPlatform(s3Key: string) {
    return new Promise((resolve, reject) => {
      const oReq = new XMLHttpRequest();
      const url = `${uiSettings.get(MARKETPLACE_API) + uiSettings.get(MARKETPLACE_API_AMAZON)}`;

      oReq.addEventListener('error', (error) => {
        console.error('An error occurred while retrieving s3 keys from platform');
        reject(error);
      });

      oReq.addEventListener('load', () => {
        if (!oReq.responseText) {
          console.warn('Response was undefined');
          reject(new Error('Response was undefined'));
        }

        const data = JSON.parse(oReq.responseText);
        console.log('data from req: ', data);

        resolve({ link: data });
      });

      console.info(`Sending Request to: ${url}`);
      oReq.open(
        'GET',
        url +
          `?pathToFile=${s3Key}` +
          `&openSearchKey=${uiSettings.get(MARKETPLACE_API_SECRET_KEY)}`
      );
      oReq.setRequestHeader('Accept', 'application/json');

      oReq.send();
    });
  }

  function parseSourceToIDicomJson(source: any) {
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
                    InstanceNumber: Number(source.InstanceNumber),
                    SOPClassUID: String(source.SOPClassUID),
                    PhotometricInterpretation: String(source.PhotometricInterpretation),
                    BitsAllocated: Number(source.BitsAllocated),
                    BitsStored: Number(source.BitsStored),
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
