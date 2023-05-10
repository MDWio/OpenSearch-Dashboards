/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export function getS3KeysByFileNames(fileNames: string[] | string, s3path: string) {
  let fileUrls: string[];

  // add s3 path to each file name
  if (Array.isArray(fileNames)) {
    fileUrls = fileNames.map((fileName) => {
      return s3path + fileName;
    });
  } else {
    fileUrls = [s3path + fileNames];
  }

  return fileUrls;
}

export interface IDicomFile {
  url: string;
  seriesInstanceUID: string;
}
