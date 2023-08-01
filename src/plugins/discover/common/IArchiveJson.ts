/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export interface IArchiveJson {
  email?: string;
  archiveName: string;
  archivePath: string;
  s3domain: string;
  studies: IStudyJson[];
}

export interface IStudyJson {
  studyInstanceUid: string;
  s3Path: string;
  reportPath?: string;
  fileNames: string[];
}
