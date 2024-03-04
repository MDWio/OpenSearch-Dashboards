/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

/* eslint-disable no-console */

/* eslint-disable no-unsanitized/property */

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

import { find, template } from 'lodash';
import { stringify } from 'query-string';
import $ from 'jquery';
import rison from 'rison-node';
import '../../doc_viewer';

import ng from 'angular';
import React from 'react';
import ReactDOM from 'react-dom';
import { IArchiveJson } from 'src/plugins/discover/common/IArchiveJson';
import { ES3GatewayApiUrl } from '../../../../../common/api';
import openRowHtml from './table_row/open.html';
import detailsHtml from './table_row/details.html';

import { dispatchRenderComplete, url } from '../../../../../../opensearch_dashboards_utils/public';
import {
  DOC_HIDE_TIME_COLUMN_SETTING,
  S3_GATEWAY_API,
  S3_GATEWAY_API_OPENSEARCH_KEY,
  AMAZON_S3_ARCHIVE_PATH,
  AMAZON_S3_ARCHIVE_BUCKET,
} from '../../../../../common';
import cellTemplateHtml from '../components/table_row/cell.html';
import cellActionsTemplateHtml from '../components/table_row/cell-actions.html';
import downloadTemplateHtml from '../components/table_row/download.html';
import loaderTemplateHtml from '../components/table_row/loader.html';
import truncateByHeightTemplateHtml from '../components/table_row/truncate_by_height.html';
import { opensearchFilters } from '../../../../../../data/public';
import { getServices } from '../../../../opensearch_dashboards_services';
import { ViewerOpenModal } from './viewer_modal/viewer_open_modal';
import { StudyCommentsModal } from './study_comments_modal/study_comments_modal';

const TAGS_WITH_WS = />\s+</g;

/**
 * Remove all of the whitespace between html tags
 * so that inline elements don't have extra spaces.
 */
export function noWhiteSpace(html: string): string {
  return html.replace(TAGS_WITH_WS, '><');
}

// guesstimate at the minimum number of chars wide cells in the table should be
const MIN_LINE_LENGTH = 20;

interface LazyScope extends ng.IScope {
  [key: string]: any;
}

export function createTableRowDirective($compile: ng.ICompileService) {
  const uiSettings = getServices().uiSettings;
  const toastNotifications = getServices().toastNotifications;

  const cellTemplate = template(noWhiteSpace(cellTemplateHtml));
  const cellActionsTemplate = template(noWhiteSpace(cellActionsTemplateHtml));
  const truncateByHeightTemplate = template(noWhiteSpace(truncateByHeightTemplateHtml));

  return {
    restrict: 'A',
    scope: {
      columns: '=',
      filter: '=',
      indexPattern: '=',
      row: '=osdTableRow',
      onAddColumn: '=?',
      onRemoveColumn: '=?',
    },
    link: ($scope: LazyScope, $el: JQuery) => {
      $el.after('<tr data-test-subj="docTableDetailsRow" class="osdDocTableDetails__row">');
      $el.empty();

      // when we compile the details, we use this $scope
      let $detailsScope: LazyScope;

      // when we compile the toggle button in the summary, we use this $scope
      let $toggleScope;

      // toggle display of the rows details, a full list of the fields from each row
      $scope.toggleRow = () => {
        const $detailsTr = $el.next();

        $scope.open = !$scope.open;

        ///
        // add/remove $details children
        ///

        $detailsTr.toggle($scope.open);

        if (!$scope.open) {
          // close the child scope if it exists
          $detailsScope.$destroy();
          // no need to go any further
          return;
        } else {
          $detailsScope = $scope.$new();
        }

        // empty the details and rebuild it
        $detailsTr.html(detailsHtml);
        $detailsScope.row = $scope.row;
        $detailsScope.hit = $scope.row;
        $detailsScope.uriEncodedId = encodeURIComponent($detailsScope.hit._id);

        $compile($detailsTr)($detailsScope);
      };

      $scope.openViewer = () => {
        const closeModal = () => {
          ReactDOM.unmountComponentAtNode(container);
          document.body.removeChild(container);
        };

        const viewerModal = React.createElement(ViewerOpenModal, {
          source: $scope.row._source,
          title: 'View DICOM',
          onClose: closeModal,
        });

        const container = document.createElement('div');
        document.body.appendChild(container);
        ReactDOM.render(viewerModal, container);
      };

      $scope.editStudyComments = () => {
        const closeModal = (updatedComment?: string) => {
          ReactDOM.unmountComponentAtNode(container);
          document.body.removeChild(container);

          if (updatedComment || updatedComment === '') {
            $scope.row._source.Comments = updatedComment;
          }
        };

        const studyCommentsModal = React.createElement(StudyCommentsModal, {
          _id: $scope.row._id,
          index: $scope.row._index,
          source: $scope.row._source,
          title: 'Edit study comments',
          onClose: (updatedComment?: string) => closeModal(updatedComment),
        });

        const container = document.createElement('div');
        document.body.appendChild(container);
        ReactDOM.render(studyCommentsModal, container);
      };

      $scope.isAvailableCommenting = () => {
        return !!$scope.indexPattern.fields.getByName('Comments');
      };

      $scope.downloadStudy = () => {
        const downloadButton = document.getElementById(`${$scope.row._id}`);

        if (downloadButton) {
          downloadButton.replaceChildren('');
          downloadButton.innerHTML = loaderTemplateHtml;

          getArchiveLinkFromPlatform($scope.row._source)
            .then((res) => {
              downloadButton.replaceChildren('');
              downloadButton.innerHTML = downloadTemplateHtml;

              const result = JSON.parse((res as any).response);
              const newLink = document.createElement('a');
              newLink.href = result.archiveLink;
              newLink.click();
            })
            .catch((err) => {
              downloadButton.replaceChildren('');
              downloadButton.innerHTML = downloadTemplateHtml;

              toastNotifications.addDanger({
                title: 'Error while downloading study',
                text: err,
              });
            });
        }
      };

      $scope.$watchMulti(['indexPattern.timeFieldName', 'row.highlight', '[]columns'], () => {
        createSummaryRow($scope.row);
      });

      $scope.inlineFilter = function inlineFilter($event: any, type: string) {
        const column = $($event.currentTarget).data().column;
        const field = $scope.indexPattern.fields.getByName(column);
        $scope.filter(field, $scope.flattenedRow[column], type);
      };

      $scope.getContextAppHref = () => {
        const globalFilters: any = getServices().filterManager.getGlobalFilters();
        const appFilters: any = getServices().filterManager.getAppFilters();

        const hash = stringify(
          url.encodeQuery({
            _g: rison.encode({
              filters: globalFilters || [],
            }),
            _a: rison.encode({
              columns: $scope.columns,
              filters: (appFilters || []).map(opensearchFilters.disableFilter),
            }),
          }),
          { encode: false, sort: false }
        );

        return `#/context/${encodeURIComponent($scope.indexPattern.id)}/${encodeURIComponent(
          $scope.row._id
        )}?${hash}`;
      };

      // create a tr element that lists the value for each *column*
      function createSummaryRow(row: any) {
        const indexPattern = $scope.indexPattern;
        $scope.flattenedRow = indexPattern.flattenHit(row);

        // We just create a string here because its faster.
        const newHtmls = [openRowHtml];

        const mapping = indexPattern.fields.getByName;
        const hideTimeColumn = getServices().uiSettings.get(DOC_HIDE_TIME_COLUMN_SETTING, false);
        if (indexPattern.timeFieldName && !hideTimeColumn) {
          newHtmls.push(
            cellTemplate({
              timefield: true,
              formatted: _displayField(row, indexPattern.timeFieldName),
              filterable: mapping(indexPattern.timeFieldName).filterable && $scope.filter,
              column: indexPattern.timeFieldName,
            })
          );
        }

        $scope.columns.forEach(function (column: any) {
          const isFilterable = mapping(column) && mapping(column).filterable && $scope.filter;

          newHtmls.push(
            cellTemplate({
              timefield: false,
              sourcefield: column === '_source',
              formatted: _displayField(row, column, true),
              filterable: isFilterable,
              column,
            })
          );
        });

        newHtmls.push(
          cellActionsTemplate({
            downloadButtonName: row._id,
            column: 'Action',
          })
        );

        let $cells = $el.children();
        newHtmls.forEach(function (html, i) {
          const $cell = $cells.eq(i);
          if ($cell.data('discover:html') === html) return;

          const reuse = find($cells.slice(i + 1), function (cell: any) {
            return $.data(cell, 'discover:html') === html;
          });

          const $target = reuse ? $(reuse).detach() : $(html);
          $target.data('discover:html', html);
          const $before = $cells.eq(i - 1);
          if ($before.length) {
            $before.after($target);
          } else {
            $el.append($target);
          }

          // rebuild cells since we modified the children
          $cells = $el.children();

          if (!reuse) {
            $toggleScope = $scope.$new();
            $compile($target)($toggleScope);
          }
        });

        if ($scope.open) {
          $detailsScope.row = row;
        }

        // trim off cells that were not used rest of the cells
        $cells.filter(':gt(' + (newHtmls.length - 1) + ')').remove();
        dispatchRenderComplete($el[0]);
      }

      /**
       * Fill an element with the value of a field
       */
      function _displayField(row: any, fieldName: string, truncate = false) {
        const indexPattern = $scope.indexPattern;
        const text = indexPattern.formatField(row, fieldName);

        if (truncate && text.length > MIN_LINE_LENGTH) {
          return truncateByHeightTemplate({
            body: text,
          });
        }

        return text;
      }

      function getArchiveLinkFromPlatform(rowSource: any) {
        return new Promise((resolve, reject) => {
          const oReq = new XMLHttpRequest();
          const urlPlatform = `${
            uiSettings.get(S3_GATEWAY_API) + ES3GatewayApiUrl.ARCHIVE_LINK_GET
          }`;

          oReq.addEventListener('error', (error) => {
            reject(
              `The url: '${urlPlatform}' is not reachable. Please, verify the url is correct. You can get more information in console logs (Dev Tools).`
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
              resolve({ response: oReq.responseText });
            }
          });

          console.info(`Sending Request to: ${urlPlatform}`);
          oReq.open(
            'POST',
            urlPlatform + `?openSearchKey=${uiSettings.get(S3_GATEWAY_API_OPENSEARCH_KEY)}`
          );
          oReq.setRequestHeader('Accept', 'application/json');
          oReq.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');

          const body = composeBodyFromRow(rowSource);

          oReq.send(JSON.stringify(body));
        });
      }

      function composeBodyFromRow(rowSource: any) {
        const archiveS3Path = uiSettings.get(AMAZON_S3_ARCHIVE_PATH);
        const archiveName = rowSource.StudyInstanceUID;

        const body: IArchiveJson = {
          archivePath: archiveS3Path,
          archiveName,
          bucket: uiSettings.get(AMAZON_S3_ARCHIVE_BUCKET),
          studies: [],
        };

        const bucket = rowSource.dicom_filepath.split('/')[2];
        const s3Path = rowSource.dicom_filepath.replace(`s3://${bucket}/`, '');

        const reportPath = rowSource.report_filepath
          ? rowSource.report_filepath.replace(`s3://${bucket}/`, '')
          : undefined;

        body.studies.push({
          studyInstanceUid: rowSource.StudyInstanceUID,
          bucket,
          s3Path,
          reportPath,
        });

        return body;
      }
    },
  };
}
