/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

export function openInNewTab(url: string): void {
  const newWindow = window.open(url, '_blank', 'noopener,noreferrer');

  if (newWindow) {
    newWindow.opener = null;
  }
}
