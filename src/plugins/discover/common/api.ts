/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export enum ES3GatewayApiUrl {
  LINKS_LIST = '/api/amazon/dicom/links/get',

  ARCHIVE_LINK_GET = '/api/amazon/archive/link/get',
  ARCHIVE_PROCESS_CREATE = '/api/amazon/archive/process/create',
  ARCHIVE_PROCESS_GET = '/api/amazon/archive/process/get',

  OPENSEARCH_DOC_COMMENTS_UPDATE = '/api/opensearch/doc/comments/update',
  OPENSEARCH_DOC_TAGS_UPDATE = '/api/opensearch/doc/tags/update',
  OPENSEARCH_SUGGESTED_TAGS_LIST = '/api/opensearch/tags/list',
}
