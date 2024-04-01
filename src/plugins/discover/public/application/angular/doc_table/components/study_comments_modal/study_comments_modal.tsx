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
  EuiFlexGroup,
  EuiFlexItem,
  EuiModal,
  EuiModalBody,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiOverlayMask,
  EuiSpacer,
  EuiTextArea,
} from '@elastic/eui';
import React, { useState } from 'react';
import { ES3GatewayApiUrl } from '../../../../../../common/api';
import { getServices } from '../../../../../opensearch_dashboards_services';
import { ISource } from '../../../../../../common/IRow';
import { httpRequestToS3Gateway } from '../../../helpers/httpRequest';

interface Props {
  _id: string;
  index: string;
  source: ISource;
  onClose: (updatedComment?: string) => void;
  title: string;
}

export function StudyCommentsModal(props: Props) {
  const toastNotifications = getServices().toastNotifications;

  const [newStudyCommentsValue, setNewStudyCommentsValue] = useState(props.source.Comments);

  const onChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewStudyCommentsValue(event.target.value);
  };

  const onSave = () => {
    updateOpensearchDocComments()
      .then(() => {
        toastNotifications.addSuccess({
          title: `Update Study Comments`,
          text: `Study Comments has been updated successfully for studyInstanceUID: ${props.source.StudyInstanceUID}`,
        });
        props.onClose(newStudyCommentsValue);
      })
      .catch((error) => {
        toastNotifications.addDanger({
          title: `Error while updating Study Comments`,
          text: error,
        });
      });
  };

  function updateOpensearchDocComments() {
    const body = {
      id: props._id,
      studyInstanceUID: props.source.StudyInstanceUID,
      index: props.index,
      value: newStudyCommentsValue,
    };

    return httpRequestToS3Gateway(ES3GatewayApiUrl.OPENSEARCH_DOC_COMMENTS_UPDATE, body);
  }

  return (
    <EuiOverlayMask style="padding: 0">
      <EuiModal maxWidth={false} onClose={() => props.onClose()}>
        <EuiModalHeader>
          <EuiModalHeaderTitle>
            <span> {props.title} </span>
          </EuiModalHeaderTitle>
        </EuiModalHeader>
        <EuiModalBody>
          <EuiTextArea value={newStudyCommentsValue} onChange={(event) => onChange(event)} />

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
