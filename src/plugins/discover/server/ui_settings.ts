/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

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

import { i18n } from '@osd/i18n';
import { schema } from '@osd/config-schema';

import { UiSettingsParams } from 'opensearch-dashboards/server';
import {
  DEFAULT_COLUMNS_SETTING,
  SAMPLE_SIZE_SETTING,
  AGGS_TERMS_SIZE_SETTING,
  SORT_DEFAULT_ORDER_SETTING,
  SEARCH_ON_PAGE_LOAD_SETTING,
  DOC_HIDE_TIME_COLUMN_SETTING,
  FIELDS_LIMIT_SETTING,
  CONTEXT_DEFAULT_SIZE_SETTING,
  CONTEXT_STEP_SETTING,
  CONTEXT_TIE_BREAKER_FIELDS_SETTING,
  MODIFY_COLUMNS_ON_SWITCH,
  S3_GATEWAY_API,
  S3_GATEWAY_DEV_API,
  S3_GATEWAY_API_LINKS,
  S3_GATEWAY_API_ARCHIVE_LINK,
  S3_GATEWAY_API_ARCHIVE_PROCESS_GET,
  S3_GATEWAY_API_ARCHIVE_PROCESS_CREATE,
  S3_GATEWAY_DEV_API_OPENSEARCH_KEY,
  S3_GATEWAY_API_OPENSEARCH_KEY,
  AMAZON_S3_ARCHIVE_DEV_BUCKET,
  AMAZON_S3_ARCHIVE_BUCKET,
  AMAZON_S3_ARCHIVE_PATH,
  VIEWER_URL,
  DEV_VIEWER_URL,
  S3_GATEWAY_API_OPENSEARCH_OBJECT_STRING_UPDATE,
} from '../common';

export const uiSettings: Record<string, UiSettingsParams> = {
  [DEFAULT_COLUMNS_SETTING]: {
    name: i18n.translate('discover.advancedSettings.defaultColumnsTitle', {
      defaultMessage: 'Default columns',
    }),
    value: ['_source'],
    description: i18n.translate('discover.advancedSettings.defaultColumnsText', {
      defaultMessage: 'Columns displayed by default in the Discovery tab',
    }),
    category: ['discover'],
    schema: schema.arrayOf(schema.string()),
  },
  [SAMPLE_SIZE_SETTING]: {
    name: i18n.translate('discover.advancedSettings.sampleSizeTitle', {
      defaultMessage: 'Number of rows',
    }),
    value: 500,
    description: i18n.translate('discover.advancedSettings.sampleSizeText', {
      defaultMessage: 'The number of rows to show in the table',
    }),
    category: ['discover'],
    schema: schema.number(),
  },
  [AGGS_TERMS_SIZE_SETTING]: {
    name: i18n.translate('discover.advancedSettings.aggsTermsSizeTitle', {
      defaultMessage: 'Number of terms',
    }),
    value: 20,
    type: 'number',
    description: i18n.translate('discover.advancedSettings.aggsTermsSizeText', {
      defaultMessage:
        'Determines how many terms will be visualized when clicking the "visualize" ' +
        'button, in the field drop downs, in the discover sidebar.',
    }),
    category: ['discover'],
    schema: schema.number(),
  },
  [SORT_DEFAULT_ORDER_SETTING]: {
    name: i18n.translate('discover.advancedSettings.sortDefaultOrderTitle', {
      defaultMessage: 'Default sort direction',
    }),
    value: 'desc',
    options: ['desc', 'asc'],
    optionLabels: {
      desc: i18n.translate('discover.advancedSettings.sortOrderDesc', {
        defaultMessage: 'Descending',
      }),
      asc: i18n.translate('discover.advancedSettings.sortOrderAsc', {
        defaultMessage: 'Ascending',
      }),
    },
    type: 'select',
    description: i18n.translate('discover.advancedSettings.sortDefaultOrderText', {
      defaultMessage:
        'Controls the default sort direction for time based index patterns in the Discover app.',
    }),
    category: ['discover'],
    schema: schema.oneOf([schema.literal('desc'), schema.literal('asc')]),
  },
  [SEARCH_ON_PAGE_LOAD_SETTING]: {
    name: i18n.translate('discover.advancedSettings.searchOnPageLoadTitle', {
      defaultMessage: 'Search on page load',
    }),
    value: true,
    type: 'boolean',
    description: i18n.translate('discover.advancedSettings.searchOnPageLoadText', {
      defaultMessage:
        'Controls whether a search is executed when Discover first loads. This setting does not ' +
        'have an effect when loading a saved search.',
    }),
    category: ['discover'],
    schema: schema.boolean(),
  },
  [DOC_HIDE_TIME_COLUMN_SETTING]: {
    name: i18n.translate('discover.advancedSettings.docTableHideTimeColumnTitle', {
      defaultMessage: "Hide 'Time' column",
    }),
    value: false,
    description: i18n.translate('discover.advancedSettings.docTableHideTimeColumnText', {
      defaultMessage: "Hide the 'Time' column in Discover and in all Saved Searches on Dashboards.",
    }),
    category: ['discover'],
    schema: schema.boolean(),
  },
  [FIELDS_LIMIT_SETTING]: {
    name: i18n.translate('discover.advancedSettings.fieldsPopularLimitTitle', {
      defaultMessage: 'Popular fields limit',
    }),
    value: 10,
    description: i18n.translate('discover.advancedSettings.fieldsPopularLimitText', {
      defaultMessage: 'The top N most popular fields to show',
    }),
    schema: schema.number(),
  },
  [CONTEXT_DEFAULT_SIZE_SETTING]: {
    name: i18n.translate('discover.advancedSettings.context.defaultSizeTitle', {
      defaultMessage: 'Context size',
    }),
    value: 5,
    description: i18n.translate('discover.advancedSettings.context.defaultSizeText', {
      defaultMessage: 'The number of surrounding entries to show in the context view',
    }),
    category: ['discover'],
    schema: schema.number(),
  },
  [CONTEXT_STEP_SETTING]: {
    name: i18n.translate('discover.advancedSettings.context.sizeStepTitle', {
      defaultMessage: 'Context size step',
    }),
    value: 5,
    description: i18n.translate('discover.advancedSettings.context.sizeStepText', {
      defaultMessage: 'The step size to increment or decrement the context size by',
    }),
    category: ['discover'],
    schema: schema.number(),
  },
  [CONTEXT_TIE_BREAKER_FIELDS_SETTING]: {
    name: i18n.translate('discover.advancedSettings.context.tieBreakerFieldsTitle', {
      defaultMessage: 'Tie breaker fields',
    }),
    value: ['_doc'],
    description: i18n.translate('discover.advancedSettings.context.tieBreakerFieldsText', {
      defaultMessage:
        'A comma-separated list of fields to use for tie-breaking between documents that have the same timestamp value. ' +
        'From this list the first field that is present and sortable in the current index pattern is used.',
    }),
    category: ['discover'],
    schema: schema.arrayOf(schema.string()),
  },
  [MODIFY_COLUMNS_ON_SWITCH]: {
    name: i18n.translate('discover.advancedSettings.discover.modifyColumnsOnSwitchTitle', {
      defaultMessage: 'Modify columns when changing index patterns',
    }),
    value: true,
    description: i18n.translate('discover.advancedSettings.discover.modifyColumnsOnSwitchText', {
      defaultMessage: 'Remove columns that not available in the new index pattern.',
    }),
    category: ['discover'],
    schema: schema.boolean(),
  },
  [S3_GATEWAY_API]: {
    name: i18n.translate('discover.advancedSettings.viewer.s3GatewayUrlTitle', {
      defaultMessage: 'S3 Gateway DOMAIN',
    }),
    value: 'http://localhost:3600',
    description: i18n.translate('discover.advancedSettings.viewer.s3GatewayUrlText', {
      defaultMessage: 'S3 Gateway DOMAIN URL',
    }),
    category: ['discover'],
    schema: schema.string(),
  },
  [S3_GATEWAY_DEV_API]: {
    name: i18n.translate('discover.advancedSettings.viewer.s3GatewayDevUrlTitle', {
      defaultMessage: 'S3 Gateway Dev DOMAIN',
    }),
    value: 'http://localhost:3600',
    description: i18n.translate('discover.advancedSettings.viewer.s3GatewayDevUrlText', {
      defaultMessage: 'S3 Gateway Dev DOMAIN URL',
    }),
    category: ['discover'],
    schema: schema.string(),
  },
  [S3_GATEWAY_API_LINKS]: {
    name: i18n.translate('discover.advancedSettings.viewer.s3GatewayApiLinksTitle', {
      defaultMessage: 'S3 Gateway API URL for Amazon links',
    }),
    value: '/api/amazon/dicom/links/get',
    description: i18n.translate('discover.advancedSettings.viewer.s3GatewayApiLinksText', {
      defaultMessage: 'Api for S3 Gateway to get Amazon links',
    }),
    category: ['discover'],
    schema: schema.string(),
  },
  [S3_GATEWAY_API_ARCHIVE_LINK]: {
    name: i18n.translate('discover.advancedSettings.viewer.s3GatewayApiArchiveLinkTitle', {
      defaultMessage: 'S3 Gateway API URL for OpenSearch archiver',
    }),
    value: '/api/amazon/archive/link/get',
    description: i18n.translate('discover.advancedSettings.viewer.s3GatewayApiArchiveLinkText', {
      defaultMessage: 'Api for S3 Gateway to get link for zip archive',
    }),
    category: ['discover'],
    schema: schema.string(),
  },
  [S3_GATEWAY_API_ARCHIVE_PROCESS_GET]: {
    name: i18n.translate('discover.advancedSettings.viewer.s3GatewayApiArchiveProcessGetTitle', {
      defaultMessage: 'S3 Gateway API URL for getting Amazon archiver process',
    }),
    value: '/api/amazon/archive/process/get',
    description: i18n.translate(
      'discover.advancedSettings.viewer.s3GatewayApiArchiveProcessGetText',
      {
        defaultMessage: 'Api for S3 Gateway to get process of archiving',
      }
    ),
    category: ['discover'],
    schema: schema.string(),
  },
  [S3_GATEWAY_API_ARCHIVE_PROCESS_CREATE]: {
    name: i18n.translate('discover.advancedSettings.viewer.s3GatewayApiArchiveProcessCreateTitle', {
      defaultMessage: 'S3 Gateway API URL for creating Amazon archiver process',
    }),
    value: '/api/amazon/archive/process/create',
    description: i18n.translate(
      'discover.advancedSettings.viewer.s3GatewayApiArchiveProcessCreateText',
      {
        defaultMessage: 'Api for S3 Gateway to create process of archiving',
      }
    ),
    category: ['discover'],
    schema: schema.string(),
  },
  [S3_GATEWAY_API_OPENSEARCH_OBJECT_STRING_UPDATE]: {
    name: i18n.translate(
      'discover.advancedSettings.viewer.s3GatewayApiOpenSearchObjectStringUpdateTitle',
      {
        defaultMessage: 'S3 Gateway API URL for updating OpenSearch object string fields',
      }
    ),
    value: '/api/opensearch/object-string/update',
    description: i18n.translate(
      'discover.advancedSettings.viewer.s3GatewayApiOpenSearchObjectStringUpdateText',
      {
        defaultMessage: 'Api for S3 Gateway to update OpenSearch object string fields',
      }
    ),
    category: ['discover'],
    schema: schema.string(),
  },
  [S3_GATEWAY_DEV_API_OPENSEARCH_KEY]: {
    name: i18n.translate('discover.advancedSettings.viewer.s3GatewayDevApiKeyTitle', {
      defaultMessage: 'S3 Gateway Dev API Key',
    }),
    value: 'SET_API_KEY',
    description: i18n.translate('discover.advancedSettings.viewer.s3GatewayDevApiKeyText', {
      defaultMessage: 'Dev API key for S3 Gateway',
    }),
    category: ['discover'],
    schema: schema.string(),
  },
  [S3_GATEWAY_API_OPENSEARCH_KEY]: {
    name: i18n.translate('discover.advancedSettings.viewer.s3GatewayApiKeyTitle', {
      defaultMessage: 'S3 Gateway API Key',
    }),
    value: 'SET_API_KEY',
    description: i18n.translate('discover.advancedSettings.viewer.s3GatewayApiKeyText', {
      defaultMessage: 'API key for S3 Gateway',
    }),
    category: ['discover'],
    schema: schema.string(),
  },
  [VIEWER_URL]: {
    name: i18n.translate('discover.advancedSettings.viewer.viewerUrlTitle', {
      defaultMessage: 'OHIF Viewer',
    }),
    value: 'http://localhost:3500',
    description: i18n.translate('discover.advancedSettings.viewer.viewerUrlText', {
      defaultMessage: 'Url to OHIF viewer',
    }),
    category: ['discover'],
    schema: schema.string(),
  },
  [DEV_VIEWER_URL]: {
    name: i18n.translate('discover.advancedSettings.viewer.devViewerUrlTitle', {
      defaultMessage: 'OHIF Viewer (dev)',
    }),
    value: 'http://localhost:3500',
    description: i18n.translate('discover.advancedSettings.viewer.devViewerUrlText', {
      defaultMessage: 'Url to OHIF viewer (dev)',
    }),
    category: ['discover'],
    schema: schema.string(),
  },
  [AMAZON_S3_ARCHIVE_DEV_BUCKET]: {
    name: i18n.translate('discover.advancedSettings.amazons3:archiveDevBucketTitle', {
      defaultMessage: 'Amazon archive bucket (dev)',
    }),
    value: 'archive-upload-dev',
    description: i18n.translate('discover.advancedSettings.viewer.amazons3:archiveDevBucketText', {
      defaultMessage: 'Bucket for storing generated archives in Amazon S3 (dev)',
    }),
    category: ['discover'],
    schema: schema.string(),
  },
  [AMAZON_S3_ARCHIVE_BUCKET]: {
    name: i18n.translate('discover.advancedSettings.amazons3:archiveBucketTitle', {
      defaultMessage: 'Amazon archive bucket',
    }),
    value: 'archive-upload',
    description: i18n.translate('discover.advancedSettings.viewer.amazons3:archiveBucketText', {
      defaultMessage: 'Bucket for storing generated archives in Amazon S3',
    }),
    category: ['discover'],
    schema: schema.string(),
  },
  [AMAZON_S3_ARCHIVE_PATH]: {
    name: i18n.translate('discover.advancedSettings.amazons3:archivePathTitle', {
      defaultMessage: 'Archive path storing',
    }),
    value: '/OSD_ARCHIVES/',
    description: i18n.translate('discover.advancedSettings.amazons3:archivePathText', {
      defaultMessage: 'Path to folder where archive will be stored in Amazon S3',
    }),
    category: ['discover'],
    schema: schema.string(),
  },
};
