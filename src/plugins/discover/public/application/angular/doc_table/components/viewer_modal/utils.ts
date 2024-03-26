/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { ISource } from '../../../../../../common/IRow';

import { IDicomJson } from '../../../../../../common/IDicomJson';
import { ES3GatewayApiUrl } from '../../../../../../common/api';
import { httpRequestToS3Gateway } from '../../../helpers/httpRequest';

export function getS3UrlViaS3Gateway(
  fileNames: string[],
  bucket: string,
  s3path: string,
  studyInstanceUID: string
) {
  const fileNamesArray = Array.isArray(fileNames) ? fileNames : [fileNames];
  const body = { fileNames: fileNamesArray, s3path, bucket, studyInstanceUID };

  return httpRequestToS3Gateway(ES3GatewayApiUrl.LINKS_LIST, body);
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
