/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable no-console */
import { IUiSettingsClient } from 'opensearch-dashboards/public';
import {
  S3_GATEWAY_API,
  S3_GATEWAY_API_LINKS,
  S3_GATEWAY_API_OPENSEARCH_KEY,
} from '../../../../../../common';

import { ISource } from '../../../../../../common/IRow';

import { IDicomJson } from '../../../../../../common/IDicomJson';

export function getS3UrlFromPlatform(
  fileNames: string[],
  bucket: string,
  s3path: string,
  uiSettings: IUiSettingsClient
) {
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

export function parseSourceToIDicomJson(source: ISource) {
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
