/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export interface IDicomJson {
  studies: IStudyJson[];
}

export interface IStudyJson {
  StudyInstanceUID: string;
  StudyDate: string;
  StudyTime?: string;
  PatientName?: string;
  PatientID: string;
  AccessionNumber?: string;
  PatientAge?: string;
  PatientSex?: string;
  series: ISeriesJson[];
}

export interface ISeriesJson {
  SeriesInstanceUID: string;
  SeriesNumber: number;
  Modality: string;
  SliceThickness?: number;
  instances: IInstanceJson[];
}

export interface IInstanceJson {
  metadata: IDicomInfo;
  url: string;
}

export interface IDicomInfo {
  BitsAllocated: number;
  BitsStored: number;
  Columns: number;
  HighBit: number;
  InstanceNumber: string[];
  Modality: string;
  PhotometricInterpretation: string;
  PixelRepresentation: number;
  PixelSpacing: number[];
  Rows: number;
  SOPClassUID: string;
  SOPInstanceUID: string;
  SamplesPerPixel: number;
  SeriesInstanceUID: string;
  StudyInstanceUID: string;
}
