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
  MARKETPLACE_API,
  MARKETPLACE_DEV_API,
  MARKETPLACE_API_LINKS,
  MARKETPLACE_API_ARCHIVE_LINK,
  MARKETPLACE_API_ARCHIVE_PROCESS_GET,
  MARKETPLACE_API_ARCHIVE_PROCESS_POST,
  MARKETPLACE_DEV_API_OPENSEARCH_KEY,
  MARKETPLACE_API_OPENSEARCH_KEY,
  REMOVE_AMAZON_ENDPOINT,
  AMAZON_S3_ARCHIVE_PATH,
  VIEWER_URL,
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
  [MARKETPLACE_API]: {
    name: i18n.translate('discover.advancedSettings.viewer.marketplaceUrlTitle', {
      defaultMessage: 'Marketplace DOMAIN',
    }),
    value: 'http://localhost:3000',
    description: i18n.translate('discover.advancedSettings.viewer.marketplaceUrlText', {
      defaultMessage: 'Marketplace DOMAIN URL',
    }),
    category: ['discover'],
    schema: schema.string(),
  },
  [MARKETPLACE_DEV_API]: {
    name: i18n.translate('discover.advancedSettings.viewer.marketplaceDevUrlTitle', {
      defaultMessage: 'Marketplace Dev DOMAIN',
    }),
    value: 'http://localhost:3000',
    description: i18n.translate('discover.advancedSettings.viewer.marketplaceDevUrlText', {
      defaultMessage: 'Marketplace Dev DOMAIN URL',
    }),
    category: ['discover'],
    schema: schema.string(),
  },
  [MARKETPLACE_API_LINKS]: {
    name: i18n.translate('discover.advancedSettings.viewer.marketplaceApiLinksTitle', {
      defaultMessage: 'Marketplace API URL for Amazon links',
    }),
    value: '/api/opensearch/dicom/links/get',
    description: i18n.translate('discover.advancedSettings.viewer.marketplaceApiLinksText', {
      defaultMessage: 'Api for Marketplace to get Amazon links',
    }),
    category: ['discover'],
    schema: schema.string(),
  },
  [MARKETPLACE_API_ARCHIVE_LINK]: {
    name: i18n.translate('discover.advancedSettings.viewer.marketplaceApiArchiveLinkTitle', {
      defaultMessage: 'Marketplace API URL for OpenSearch archiver',
    }),
    value: '/api/opensearch/archive/link/get',
    description: i18n.translate('discover.advancedSettings.viewer.marketplaceApiArchiveLinkText', {
      defaultMessage: 'Api for Marketplace to get link for zip archive',
    }),
    category: ['discover'],
    schema: schema.string(),
  },
  [MARKETPLACE_API_ARCHIVE_PROCESS_GET]: {
    name: i18n.translate('discover.advancedSettings.viewer.marketplaceApiArchiveProcessGetTitle', {
      defaultMessage: 'Marketplace API URL for getting Amazon archiver process',
    }),
    value: '/api/opensearch/archive/process/get',
    description: i18n.translate(
      'discover.advancedSettings.viewer.marketplaceApiArchiveProcessGetText',
      {
        defaultMessage: 'Api for Marketplace to get process of archiving',
      }
    ),
    category: ['discover'],
    schema: schema.string(),
  },
  [MARKETPLACE_API_ARCHIVE_PROCESS_POST]: {
    name: i18n.translate('discover.advancedSettings.viewer.marketplaceApiArchiveProcessPostTitle', {
      defaultMessage: 'Marketplace API URL for creating Amazon archiver process',
    }),
    value: '/api/opensearch/archive/process/create',
    description: i18n.translate(
      'discover.advancedSettings.viewer.marketplaceApiArchiveProcessPostText',
      {
        defaultMessage: 'Api for Marketplace to create process of archiving',
      }
    ),
    category: ['discover'],
    schema: schema.string(),
  },
  [MARKETPLACE_DEV_API_OPENSEARCH_KEY]: {
    name: i18n.translate('discover.advancedSettings.viewer.marketplaceDevApiKeyTitle', {
      defaultMessage: 'Marketplace Dev API Key',
    }),
    value: 'SET_API_KEY',
    description: i18n.translate('discover.advancedSettings.viewer.marketplaceDevApiKeyText', {
      defaultMessage: 'Dev API key for Marketplace',
    }),
    category: ['discover'],
    schema: schema.string(),
  },
  [MARKETPLACE_API_OPENSEARCH_KEY]: {
    name: i18n.translate('discover.advancedSettings.viewer.marketplaceApiKeyTitle', {
      defaultMessage: 'Marketplace API Key',
    }),
    value: 'SET_API_KEY',
    description: i18n.translate('discover.advancedSettings.viewer.marketplaceApiKeyText', {
      defaultMessage: 'API key for Marketplace',
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
  [REMOVE_AMAZON_ENDPOINT]: {
    name: i18n.translate('discover.advancedSettings.viewer.removeAmazonEndpointSubstringTitle', {
      defaultMessage: 'Amazon DOMAIN substring',
    }),
    value: 's3://example.amazon.domain/',
    description: i18n.translate(
      'discover.advancedSettings.viewer.removeAmazonEndpointSubstringText',
      {
        defaultMessage: 'Substring that will be removed from every dicom_filepath',
      }
    ),
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
