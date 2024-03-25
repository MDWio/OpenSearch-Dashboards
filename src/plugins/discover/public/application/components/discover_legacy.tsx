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
import React, { useState, useCallback, useEffect } from 'react';
import classNames from 'classnames';
import {
  EuiBottomBar,
  EuiButton,
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage, I18nProvider } from '@osd/i18n/react';
import { IUiSettingsClient, MountPoint } from 'opensearch-dashboards/public';
import ReactDOM from 'react-dom';
import { HitsCounter } from './hits_counter';
import { TimechartHeader } from './timechart_header';
import { DiscoverSidebar } from './sidebar';
import { getServices, IndexPattern } from '../../opensearch_dashboards_services';
// @ts-ignore
import { DiscoverNoResults } from '../angular/directives/no_results';
import { DiscoverUninitialized } from '../angular/directives/uninitialized';
import { DiscoverHistogram } from '../angular/directives/histogram';
import { LoadingSpinner } from './loading_spinner/loading_spinner';
import { DocTableLegacy } from '../angular/doc_table/create_doc_table_react';
import { SkipBottomButton } from './skip_bottom_button';
import {
  IndexPatternField,
  search,
  ISearchSource,
  TimeRange,
  Query,
  IndexPatternAttributes,
} from '../../../../data/public';
import { Chart } from '../angular/helpers/point_series';
import { AppState } from '../angular/discover_state';
import { SavedSearch } from '../../saved_searches';

import { SavedObject } from '../../../../../core/types';
import { Vis } from '../../../../visualizations/public';
import { TopNavMenuData } from '../../../../navigation/public';
import { ViewerOpenModal } from '../angular/doc_table/components/viewer_modal/viewer_open_modal';
import { ArchiverOpenModal } from '../angular/doc_table/components/archiver_modal/archiver_open_modal';

export interface DiscoverLegacyProps {
  addColumn: (column: string) => void;
  fetch: () => void;
  fetchCounter: number;
  fieldCounts: Record<string, number>;
  histogramData: Chart;
  hits: number;
  indexPattern: IndexPattern;
  minimumVisibleRows: number;
  onAddFilter: (field: IndexPatternField | string, value: string, type: '+' | '-') => void;
  onChangeInterval: (interval: string) => void;
  onMoveColumn: (columns: string, newIdx: number) => void;
  onRemoveColumn: (column: string) => void;
  onSetColumns: (columns: string[]) => void;
  onSkipBottomButtonClick: () => void;
  onSort: (sort: string[][]) => void;
  opts: {
    savedSearch: SavedSearch;
    config: IUiSettingsClient;
    indexPatternList: Array<SavedObject<IndexPatternAttributes>>;
    timefield: string;
    sampleSize: number;
    fixedScroll: (el: HTMLElement) => void;
    setHeaderActionMenu: (menuMount: MountPoint | undefined) => void;
  };
  resetQuery: () => void;
  resultState: string;
  rows: Array<Record<string, unknown>>;
  searchSource: ISearchSource;
  setIndexPattern: (id: string) => void;
  showSaveQuery: boolean;
  state: AppState;
  timefilterUpdateHandler: (ranges: { from: number; to: number }) => void;
  timeRange?: { from: string; to: string };
  topNavMenu: TopNavMenuData[];
  updateQuery: (payload: { dateRange: TimeRange; query?: Query }, isUpdate?: boolean) => void;
  updateSavedQueryId: (savedQueryId?: string) => void;
  vis?: Vis;
}

export function DiscoverLegacy({
  addColumn,
  fetch,
  fetchCounter,
  fieldCounts,
  histogramData,
  hits,
  indexPattern,
  minimumVisibleRows,
  onAddFilter,
  onChangeInterval,
  onMoveColumn,
  onRemoveColumn,
  onSkipBottomButtonClick,
  onSort,
  opts,
  resetQuery,
  resultState,
  rows,
  searchSource,
  setIndexPattern,
  showSaveQuery,
  state,
  timefilterUpdateHandler,
  timeRange,
  topNavMenu,
  updateQuery,
  updateSavedQueryId,
  vis,
}: DiscoverLegacyProps) {
  const [isSidebarClosed, setIsSidebarClosed] = useState(false);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);
  const [showBar, setShowBar] = useState(false);
  const [isViewStudiesButtonDisable, setIsViewStudiesButtonDisable] = useState(true);
  const { TopNavMenu } = getServices().navigation.ui;
  const { savedSearch, indexPatternList } = opts;
  const bucketAggConfig = vis?.data?.aggs?.aggs[1];
  const bucketInterval =
    bucketAggConfig && search.aggs.isDateHistogramBucketAggConfig(bucketAggConfig)
      ? bucketAggConfig.buckets?.getInterval()
      : undefined;
  const [fixedScrollEl, setFixedScrollEl] = useState<HTMLElement | undefined>();

  useEffect(() => (fixedScrollEl ? opts.fixedScroll(fixedScrollEl) : undefined), [
    fixedScrollEl,
    opts,
  ]);

  const fixedScrollRef = useCallback(
    (node: HTMLElement) => {
      if (node !== null) {
        setFixedScrollEl(node);
      }
    },
    [setFixedScrollEl]
  );
  const sidebarClassName = classNames({
    closed: isSidebarClosed,
  });

  const mainSectionClassName = classNames({
    'col-md-10': !isSidebarClosed,
    'col-md-12': isSidebarClosed,
  });

  function openArchiverModal(
    rowsForDownload: Array<Record<string, unknown>>,
    isExportFromHitsCounter = false
  ) {
    const closeModal = () => {
      ReactDOM.unmountComponentAtNode(container);
      document.body.removeChild(container);
    };

    const archiverModal = React.createElement(ArchiverOpenModal, {
      rows: rowsForDownload,
      title: 'Export Studies',
      onClose: closeModal,
      isExportFromHitsCounter,
    });

    const container = document.createElement('div');
    document.body.appendChild(container);
    ReactDOM.render(archiverModal, container);
  }

  function openViewerModal(sources: any, openInNewTab: boolean, isDualMod = false) {
    const closeModal = () => {
      ReactDOM.unmountComponentAtNode(container);
      document.body.removeChild(container);
    };

    const viewerModal = React.createElement(ViewerOpenModal, {
      sources,
      title: 'View DICOM',
      onClose: closeModal,
      openInNewTab,
      isDualMod,
    });

    const container = document.createElement('div');
    document.body.appendChild(container);
    ReactDOM.render(viewerModal, container);
  }

  function onChangeAllSelected(isSelected: boolean) {
    setIsAllSelected(isSelected);
    setShowBar(isSelected);

    for (const row of rows) {
      row.isSelected = isSelected;
    }

    setSelectedCount(isSelected && rows?.length ? rows.length : 0);
  }

  function onChangeRowSelection() {
    const selectedRows = rows?.filter((row) => row.isSelected);

    if (showBar !== selectedRows?.length > 0) {
      setShowBar(selectedRows?.length > 0);
    }

    if (isViewStudiesButtonDisable !== (selectedRows?.length !== 2)) {
      setIsViewStudiesButtonDisable(selectedRows?.length !== 2);
    }

    if (isAllSelected !== (selectedRows?.length === rows?.length)) {
      setIsAllSelected(selectedRows?.length === rows?.length);
    }

    setSelectedCount(selectedRows?.length ?? 0);
  }

  return (
    <I18nProvider>
      <div className="dscAppContainer" data-fetch-counter={fetchCounter}>
        <h1 className="euiScreenReaderOnly">{savedSearch.title}</h1>
        <TopNavMenu
          appName="discover"
          config={topNavMenu}
          indexPatterns={[indexPattern]}
          onQuerySubmit={updateQuery}
          onSavedQueryIdChange={updateSavedQueryId}
          query={state.query}
          setMenuMountPoint={opts.setHeaderActionMenu}
          savedQueryId={state.savedQuery}
          screenTitle={savedSearch.title}
          showDatePicker={indexPattern.isTimeBased()}
          showSaveQuery={showSaveQuery}
          showSearchBar={true}
          useDefaultBehaviors={true}
        />
        <main className="container-fluid">
          <div className="row">
            <div
              className={`col-md-2 dscSidebar__container dscCollapsibleSidebar ${sidebarClassName}`}
              id="discover-sidebar"
              data-test-subj="discover-sidebar"
            >
              {!isSidebarClosed && (
                <div className="dscFieldChooser">
                  <DiscoverSidebar
                    columns={state.columns || []}
                    fieldCounts={fieldCounts}
                    hits={rows}
                    indexPatternList={indexPatternList}
                    onAddField={addColumn}
                    onAddFilter={onAddFilter}
                    onRemoveField={onRemoveColumn}
                    selectedIndexPattern={searchSource && searchSource.getField('index')}
                    setIndexPattern={setIndexPattern}
                  />
                </div>
              )}
              <EuiButtonIcon
                iconType={isSidebarClosed ? 'menuRight' : 'menuLeft'}
                iconSize="m"
                size="s"
                onClick={() => setIsSidebarClosed(!isSidebarClosed)}
                data-test-subj="collapseSideBarButton"
                aria-controls="discover-sidebar"
                aria-expanded={isSidebarClosed ? 'false' : 'true'}
                aria-label="Toggle sidebar"
                className="dscCollapsibleSidebar__collapseButton"
              />
            </div>
            <div className={`dscWrapper ${mainSectionClassName}`}>
              {resultState === 'none' && (
                <DiscoverNoResults
                  timeFieldName={opts.timefield}
                  queryLanguage={state.query ? state.query.language : ''}
                />
              )}
              {resultState === 'uninitialized' && <DiscoverUninitialized onRefresh={fetch} />}
              {/* @TODO: Solved in the Angular way to satisfy functional test - should be improved*/}
              <span style={{ display: resultState !== 'loading' ? 'none' : '' }}>
                <div className="dscOverlay">
                  <LoadingSpinner />
                </div>
              </span>
              {resultState === 'ready' && (
                <div className="dscWrapper__content">
                  <SkipBottomButton onClick={onSkipBottomButtonClick} />
                  <HitsCounter
                    hits={hits > 0 ? hits : 0}
                    rows={rows}
                    showResetButton={!!(savedSearch && savedSearch.id)}
                    onResetQuery={resetQuery}
                    openArchiverModal={openArchiverModal}
                  />
                  {opts.timefield && (
                    <TimechartHeader
                      dateFormat={opts.config.get('dateFormat')}
                      timeRange={timeRange}
                      options={search.aggs.intervalOptions}
                      onChangeInterval={onChangeInterval}
                      stateInterval={state.interval || ''}
                      bucketInterval={bucketInterval}
                    />
                  )}

                  {opts.timefield && (
                    <section
                      aria-label={i18n.translate('discover.histogramOfFoundDocumentsAriaLabel', {
                        defaultMessage: 'Histogram of found documents',
                      })}
                      className="dscTimechart"
                    >
                      {vis && rows.length !== 0 && (
                        <div className="dscHistogram" data-test-subj="discoverChart">
                          <DiscoverHistogram
                            chartData={histogramData}
                            timefilterUpdateHandler={timefilterUpdateHandler}
                          />
                        </div>
                      )}
                    </section>
                  )}

                  <div className="dscResults">
                    <section
                      className="dscTable dscTableFixedScroll"
                      aria-labelledby="documentsAriaLabel"
                      ref={fixedScrollRef}
                    >
                      <h2 className="euiScreenReaderOnly" id="documentsAriaLabel">
                        <FormattedMessage
                          id="discover.documentsAriaLabel"
                          defaultMessage="Documents"
                        />
                      </h2>
                      {rows && rows.length && (
                        <div className="dscDiscover">
                          <DocTableLegacy
                            columns={state.columns || []}
                            indexPattern={indexPattern}
                            minimumVisibleRows={minimumVisibleRows}
                            rows={rows}
                            sort={state.sort || []}
                            searchDescription={opts.savedSearch.description}
                            searchTitle={opts.savedSearch.lastSavedTitle}
                            onAddColumn={addColumn}
                            onFilter={onAddFilter}
                            onMoveColumn={onMoveColumn}
                            onRemoveColumn={onRemoveColumn}
                            onSort={onSort}
                            isAllSelected={isAllSelected}
                            onChangeAllSelected={onChangeAllSelected}
                            onChangeRowSelection={onChangeRowSelection}
                            openViewerModal={openViewerModal}
                          />
                          <a tabIndex={0} id="discoverBottomMarker">
                            &#8203;
                          </a>
                          {rows.length === opts.sampleSize && (
                            <div
                              className="dscTable__footer"
                              data-test-subj="discoverDocTableFooter"
                            >
                              <FormattedMessage
                                id="discover.howToSeeOtherMatchingDocumentsDescription"
                                defaultMessage="These are the first {sampleSize} documents matching
                  your search, refine your search to see others."
                                values={{ sampleSize: opts.sampleSize }}
                              />

                              <EuiButtonEmpty onClick={() => window.scrollTo(0, 0)}>
                                <FormattedMessage
                                  id="discover.backToTopLinkText"
                                  defaultMessage="Back to top."
                                />
                              </EuiButtonEmpty>
                            </div>
                          )}
                        </div>
                      )}
                    </section>
                  </div>
                  {showBar && (
                    <EuiBottomBar>
                      <EuiFlexGroup justifyContent="spaceBetween">
                        <EuiFlexItem grow={false}>
                          <EuiFlexGroup gutterSize="s">
                            <EuiFlexItem grow={false}>
                              <p>{selectedCount} Studies selected</p>
                            </EuiFlexItem>
                          </EuiFlexGroup>
                        </EuiFlexItem>
                        <EuiFlexItem grow={false}>
                          <EuiFlexGroup gutterSize="s">
                            <EuiFlexItem grow={false}>
                              <EuiButton
                                fill
                                color={isViewStudiesButtonDisable ? 'ghost' : 'primary'}
                                size="s"
                                iconType="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBjbGFzcz0iZXVpSWNvbiBldWlJY29uLS1tZWRpdW0gZXVpQnV0dG9uSWNvbl9faWNvbiI+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggc3R5bGU9ImZpbGw6cmdiKDEwMCUsMTAwJSwxMDAlKTsiIGQ9Ik0xNSAxMmMwIDEuNjU0LTEuMzQ2IDMtMyAzcy0zLTEuMzQ2LTMtMyAxLjM0Ni0zIDMtMyAzIDEuMzQ2IDMgM3ptOS0uNDQ5cy00LjI1MiA4LjQ0OS0xMS45ODUgOC40NDljLTcuMTggMC0xMi4wMTUtOC40NDktMTIuMDE1LTguNDQ5czQuNDQ2LTcuNTUxIDEyLjAxNS03LjU1MWM3LjY5NCAwIDExLjk4NSA3LjU1MSAxMS45ODUgNy41NTF6bS03IC40NDljMC0yLjc1Ny0yLjI0My01LTUtNXMtNSAyLjI0My01IDUgMi4yNDMgNSA1IDUgNS0yLjI0MyA1LTV6Ii8+CiAgICAgICAgICAgICAgICA8L3N2Zz4K"
                                isDisabled={isViewStudiesButtonDisable}
                                onClick={() => {
                                  openViewerModal(
                                    rows.filter((row) => row.isSelected).map((row) => row._source),
                                    false,
                                    true
                                  );
                                }}
                              >
                                Compare Studies
                              </EuiButton>
                            </EuiFlexItem>
                            <EuiFlexItem grow={false}>
                              <EuiButton
                                fill
                                color={isViewStudiesButtonDisable ? 'ghost' : 'primary'}
                                size="s"
                                iconType="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiBoZWlnaHQ9IjE4cHgiIHZpZXdCb3g9IjAgMCAxOCAxOCIgY2xhc3M9ImV1aUljb24gZXVpQnV0dG9uSWNvbl9faWNvbiI+CiAgICAgICAgICAgICAgICAgIDxwYXRoIHN0eWxlPSIgc3Ryb2tlOm5vbmU7ZmlsbC1ydWxlOm5vbnplcm87ZmlsbDpyZ2IoMTAwJSwxMDAlLDEwMCUpO2ZpbGwtb3BhY2l0eToxOyIgZD0iTSAxMC40NjQ4NDQgOS42Mjg5MDYgQyAxMC40NjQ4NDQgMTAuNjk5MjE5IDkuNjIxMDk0IDExLjU3MDMxMiA4LjU3ODEyNSAxMS41NzAzMTIgQyA3LjUzNTE1NiAxMS41NzAzMTIgNi42OTE0MDYgMTAuNjk5MjE5IDYuNjkxNDA2IDkuNjI4OTA2IEMgNi42OTE0MDYgOC41NTQ2ODggNy41MzUxNTYgNy42Nzk2ODggOC41NzgxMjUgNy42Nzk2ODggQyA5LjYyMTA5NCA3LjY3OTY4OCAxMC40NjQ4NDQgOC41NTQ2ODggMTAuNDY0ODQ0IDkuNjI4OTA2IFogTSAxNi4xMTMyODEgOS4zMzIwMzEgQyAxNi4xMTMyODEgOS4zMzIwMzEgMTMuNDQxNDA2IDE0LjgxMjUgOC41ODU5MzggMTQuODEyNSBDIDQuMDc4MTI1IDE0LjgxMjUgMS4wNDI5NjkgOS4zMzIwMzEgMS4wNDI5NjkgOS4zMzIwMzEgQyAxLjA0Mjk2OSA5LjMzMjAzMSAzLjgzMjAzMSA0LjQzNzUgOC41ODU5MzggNC40Mzc1IEMgMTMuNDIxODc1IDQuNDM3NSAxNi4xMTMyODEgOS4zMzIwMzEgMTYuMTEzMjgxIDkuMzMyMDMxIFogTSAxMS43MTg3NSA5LjYyODkwNiBDIDExLjcxODc1IDcuODM5ODQ0IDEwLjMwODU5NCA2LjM4NjcxOSA4LjU3ODEyNSA2LjM4NjcxOSBDIDYuODQ3NjU2IDYuMzg2NzE5IDUuNDM3NSA3LjgzOTg0NCA1LjQzNzUgOS42Mjg5MDYgQyA1LjQzNzUgMTEuNDE0MDYyIDYuODQ3NjU2IDEyLjg2NzE4OCA4LjU3ODEyNSAxMi44NjcxODggQyAxMC4zMDg1OTQgMTIuODY3MTg4IDExLjcxODc1IDExLjQxNDA2MiAxMS43MTg3NSA5LjYyODkwNiBaIE0gMTEuNzE4NzUgOS42Mjg5MDYgIi8+CiAgICAgICAgICAgICAgICAgIDxwYXRoIHN0eWxlPSIgc3Ryb2tlOm5vbmU7ZmlsbC1ydWxlOm5vbnplcm87ZmlsbDpyZ2IoMTAwJSwxMDAlLDEwMCUpO2ZpbGwtb3BhY2l0eToxOyIgZD0iTSAxNS43NzM0MzggNS44OTQ1MzEgQyAxNi4wODk4NDQgNS44OTQ1MzEgMTYuMzUxNTYyIDUuNjI4OTA2IDE2LjM1MTU2MiA1LjMwODU5NCBMIDE2LjM1MTU2MiAyLjIxODc1IEMgMTYuMzUxNTYyIDEuOTAyMzQ0IDE2LjA4OTg0NCAxLjY0MDYyNSAxNS43NzM0MzggMS42NDA2MjUgTCAxMi42ODM1OTQgMS42NDA2MjUgQyAxMi4zNjMyODEgMS42NDA2MjUgMTIuMDk3NjU2IDEuOTAyMzQ0IDEyLjA5NzY1NiAyLjIxODc1IEMgMTIuMTE3MTg4IDIuNjUyMzQ0IDEzLjE4NzUgMi44MTI1IDEzLjk1MzEyNSAzLjE0NDUzMSBMIDExLjgwNDY4OCA1LjI5Njg3NSBDIDExLjY1NjI1IDUuNDQ1MzEyIDExLjY1NjI1IDUuNjg3NSAxMS44MDQ2ODggNS44MzU5MzggTCAxMi4yMTg3NSA2LjI1MzkwNiBDIDEyLjM2NzE4OCA2LjQwMjM0NCAxMi42MTMyODEgNi40MDIzNDQgMTIuNzYxNzE5IDYuMjUzOTA2IEwgMTQuODgyODEyIDQuMTI4OTA2IEMgMTUuMTgzNTk0IDQuODc1IDE1LjMzMjAzMSA1LjgzNTkzOCAxNS43NzM0MzggNS44OTQ1MzEgWiBNIDE1Ljc3MzQzOCA1Ljg5NDUzMSAiLz4KICAgICAgICAgICAgICA8L3N2Zz4K"
                                isDisabled={isViewStudiesButtonDisable}
                                onClick={() => {
                                  openViewerModal(
                                    rows.filter((row) => row.isSelected).map((row) => row._source),
                                    true,
                                    true
                                  );
                                }}
                              >
                                Compare Studies in a New Tab
                              </EuiButton>
                            </EuiFlexItem>
                            <EuiFlexItem grow={false}>
                              <EuiButton
                                fill
                                color={!rows.some((row) => row.isSelected) ? 'ghost' : 'primary'}
                                size="s"
                                iconType="data:image/svg+xml;base64,IDxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyNiAyNiIgY2xhc3M9ImV1aUljb24gZXVpQnV0dG9uSWNvbl9faWNvbiI+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggc3R5bGU9ImZpbGw6cmdiKDEwMCUsMTAwJSwxMDAlKTsiIGQ9Ik0gMCAxMyBMIDggMTMgTCA4IC0xIEwgMTggLTEgTCAxOCAxMyBMIDI2IDEzIEwgMTMgMjYgTCAwIDEzIi8+CiAgICAgICAgICAgICAgICA8L3N2Zz4K"
                                isDisabled={!rows.some((row) => row.isSelected)}
                                onClick={() => {
                                  openArchiverModal(rows.filter((row) => row.isSelected));
                                }}
                              >
                                Download Selected Studies
                              </EuiButton>
                            </EuiFlexItem>
                          </EuiFlexGroup>
                        </EuiFlexItem>
                      </EuiFlexGroup>
                    </EuiBottomBar>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </I18nProvider>
  );
}
