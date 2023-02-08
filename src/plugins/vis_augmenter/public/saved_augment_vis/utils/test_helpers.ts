/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { cloneDeep } from 'lodash';
import { VisLayerExpressionFn, ISavedAugmentVis } from '../../types';
import { VIS_REFERENCE_NAME } from '../saved_augment_vis_references';

const pluginResourceId = 'test-plugin-resource-id';
const visId = 'test-vis-id';
const version = 1;

export const generateAugmentVisSavedObject = (idArg: string, exprFnArg: VisLayerExpressionFn) => {
  return {
    id: idArg,
    pluginResourceId,
    visLayerExpressionFn: exprFnArg,
    VIS_REFERENCE_NAME,
    visId,
    version,
  } as ISavedAugmentVis;
};

export const getMockAugmentVisSavedObjectClient = (
  augmentVisSavedObjs: ISavedAugmentVis[],
  keepReferences: boolean = true
): any => {
  const savedObjs = (augmentVisSavedObjs = cloneDeep(augmentVisSavedObjs));

  const client = {
    find: jest.fn(() =>
      Promise.resolve({
        total: savedObjs.length,
        savedObjects: savedObjs.map((savedObj) => {
          const objVisId = savedObj.visId;
          const objId = savedObj.id;
          delete savedObj.visId;
          delete savedObj.id;
          return {
            id: objId,
            attributes: savedObj as Record<string, any>,
            references: keepReferences
              ? [
                  {
                    name: savedObj.visName,
                    type: 'visualization',
                    id: objVisId,
                  },
                ]
              : [],
          };
        }),
      })
    ),
  } as any;
  return client;
};
