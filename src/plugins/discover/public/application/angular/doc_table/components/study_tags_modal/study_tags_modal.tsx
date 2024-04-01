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

import {
  EuiButton,
  EuiButtonEmpty,
  EuiComboBox,
  EuiComboBoxOptionOption,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiModal,
  EuiModalBody,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiOverlayMask,
  EuiSpacer,
  euiPaletteColorBlindBehindText,
} from '@elastic/eui';
import React, { useEffect, useState } from 'react';
import { ES3GatewayApiUrl } from '../../../../../../common/api';
import { getServices } from '../../../../../opensearch_dashboards_services';
import { ISource } from '../../../../../../common/IRow';
import { httpRequestToS3Gateway } from '../../../helpers/httpRequest';

interface Props {
  _id: string;
  index: string;
  source: ISource;
  onClose: (updatedTags?: string[]) => void;
  title: string;
}

const visColorsBehindText = euiPaletteColorBlindBehindText();

interface Option {
  label: string;
  color?: string;
}

export function StudyTagsModal(props: Props) {
  const toastNotifications = getServices().toastNotifications;

  const [isLoading, setLoading] = useState(false);
  const [tagOptions, setTagOptions] = useState(
    props.source.Tags ? (props.source.Tags.map((t) => ({ label: t })) as Option[] | []) : []
  );
  const [selectedTagOptions, setSelectedOptions] = useState(tagOptions);

  useEffect(() => {
    setLoading(true);
    listSuggestedTags()
      .then((res: any) => {
        const tags = res.data as string[];
        const suggestedTags = tags.map((t) => ({ label: t } as Option));
        const fileteredSuggestedTags = suggestedTags.filter(
          (suggestedTag) => !tagOptions.find((tagOption) => tagOption.label === suggestedTag.label)
        );
        setTagOptions([...tagOptions, ...fileteredSuggestedTags]);

        setLoading(false);
      })
      .catch((error) => {
        toastNotifications.addDanger({
          title: `Error while getting suggested tags`,
          text: error,
        });
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // array must be empty to avoid infinite loop

  const onTagChange = (newSelectedOptions: Option[]) => {
    for (let i = 0; i < newSelectedOptions.length; i++) {
      if (
        !selectedTagOptions.find(
          (selectedOption) => selectedOption.label === newSelectedOptions[i].label
        )
      ) {
        newSelectedOptions[i].color = visColorsBehindText[0]; // green color for new option
      }
    }
    setSelectedOptions(newSelectedOptions);
  };

  const onSave = () => {
    updateOpensearchDocTags()
      .then(() => {
        toastNotifications.addSuccess({
          title: `Update Study Tags`,
          text: `Study Tags has been updated successfully for studyInstanceUID: ${props.source.StudyInstanceUID}`,
        });
        props.onClose(selectedTagOptions.map((option) => option.label));
      })
      .catch((error) => {
        toastNotifications.addDanger({
          title: `Error while updating Study Tags`,
          text: error,
        });
      });
  };

  function updateOpensearchDocTags() {
    const body = {
      id: props._id,
      index: props.index,
      studyInstanceUID: props.source.StudyInstanceUID,
      value: selectedTagOptions.map((option) => option.label),
    };

    return httpRequestToS3Gateway(ES3GatewayApiUrl.OPENSEARCH_DOC_TAGS_UPDATE, body);
  }

  function listSuggestedTags() {
    return httpRequestToS3Gateway(ES3GatewayApiUrl.OPENSEARCH_SUGGESTED_TAGS_LIST);
  }

  const onCreateOption = (
    searchValue: string,
    flattenedOptions: Array<EuiComboBoxOptionOption<unknown>>
  ) => {
    const normalizedSearchValue = searchValue.trim().toLowerCase();

    if (!normalizedSearchValue) {
      return;
    }

    const newOption: Option = {
      label: searchValue,
      color: visColorsBehindText[0], // green
    };

    // Create the option if it doesn't exist.
    if (
      flattenedOptions.findIndex(
        (option) => option.label.trim().toLowerCase() === normalizedSearchValue
      ) === -1
    ) {
      setTagOptions([...tagOptions, newOption]);
    }

    setSelectedOptions([...selectedTagOptions, newOption]);
  };

  return (
    <EuiOverlayMask style="padding: 0">
      <EuiModal maxWidth={350} onClose={() => props.onClose()}>
        <EuiModalHeader>
          <EuiModalHeaderTitle>
            <span> {props.title} </span>
          </EuiModalHeaderTitle>
        </EuiModalHeader>
        <EuiModalBody>
          <EuiFormRow label="Study tags">
            <EuiComboBox
              options={tagOptions}
              selectedOptions={selectedTagOptions}
              onChange={onTagChange}
              onCreateOption={onCreateOption}
              isClearable={true}
              isLoading={isLoading}
            />
          </EuiFormRow>

          <EuiSpacer />

          <EuiFlexGroup justifyContent="flexEnd" gutterSize="s">
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty color="primary" onClick={() => props.onClose()}>
                Cancel
              </EuiButtonEmpty>
            </EuiFlexItem>

            <EuiFlexItem grow={false}>
              <EuiButton color="primary" fill onClick={onSave}>
                Save
              </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiModalBody>
      </EuiModal>
    </EuiOverlayMask>
  );
}
