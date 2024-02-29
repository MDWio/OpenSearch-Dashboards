/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export interface IRow {
  _index: string;
  _type: string;
  _id: string;
  _version: number;
  _score: number;
  _source: ISource;
  fields: IField;
  highlight: IHighlight;
}

export interface ISource {
  AccessionNumber: string;
  AcquisitionDate: string;
  AcquisitionNumber: string;
  AcquisitionTime: string;
  AdditionalPatientHistory: string;
  BitsAllocated: string;
  BitsStored: string;
  BodyPartExamined: string;
  Columns: string[];
  Comments: string;
  ContentDate: string;
  ContentTime: string;
  ContrastBolusAgent: string;
  HighBit: string;
  ImageComments: string;
  InstanceNumber: string[];
  InstitutionName: string;
  IssuerOfPatientID: string;
  LargestImagePixelValue: string;
  Laterality: string;
  Manufacturer: string;
  ManufacturerModelName: string;
  Modality: string;
  NumberOfFrames: number;
  OperatorsName: string;
  PatientAge: number;
  PatientBirthDate: string;
  PatientID: string;
  PatientName: string;
  PatientOrientation: string;
  PatientPosition: string;
  PatientSex: string;
  PerformingPhysicianName: string;
  PhotometricInterpretation: string;
  PixelRepresentation: string;
  PixelSpacing0: string[];
  PixelSpacing1: string[];
  PlateID: string;
  ReferringPhysicianName: string;
  RelativeXRayExposure: string[];
  RescaleIntercept: string;
  RescaleSlope: string;
  RescaleType: string;
  Rows: string[];
  SOPClassUID: string;
  SOPInstanceUID: string[];
  SamplesPerPixel: string;
  Sensitivity: string[];
  SeriesDescription: string;
  SeriesInstanceUID: string;
  SeriesNumber: string;
  SmallestImagePixelValue: string;
  SoftwareVersions: string;
  SpecificCharacterSet: string;
  StationName: string;
  StudyDate: string;
  StudyDescription: string;
  StudyID: string;
  StudyInstanceUID: string;
  StudyTime: string;
  ViewPosition: string;
  WindowCenter: string;
  WindowWidth: string;
  NoError: string;
  PathToFolder: string;
  FileName: string[];
  dicom_filepath: string;
  report_filepath: string;
  report: string;
  patient_id: string;
  case_id: string;
}

export interface IField {
  StudyDate: Date[];
}

export interface IHighlight {
  Modality: string[];
}
