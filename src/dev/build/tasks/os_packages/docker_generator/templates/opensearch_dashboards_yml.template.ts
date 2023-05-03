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

import dedent from 'dedent';

import { TemplateContext } from '../template_context';

function generator({ imageFlavor }: TemplateContext) {
  return dedent(`
  server.host: 'localhost'

  opensearch.hosts: ['OPENSEARCH_HOST']

  # opensearch.ssl.verificationMode: none # if not using HTTPS

  opensearch_security.auth.type: basicauth
  opensearch_security.auth.anonymous_auth_enabled: false
  opensearch_security.cookie.secure: false # set to true when using HTTPS
  opensearch_security.cookie.ttl: 3600000
  opensearch_security.session.ttl: 3600000
  opensearch_security.session.keepalive: false
  opensearch_security.multitenancy.enabled: false
  opensearch_security.readonly_mode.roles: [opensearch_dashboards_read_only']
  opensearch_security.auth.unauthenticated_routes: []
  opensearch_security.basicauth.login.title: 'Please log in using your username and password'

  opensearch.username: 'OPENSEARCH_USERNAME'
  opensearch.password: 'OPENSEARCH_PASSWORD'
  opensearch.requestHeadersWhitelist: [ authorization, securitytenant, security_tenant ]

  # server.cors: true is normally the default value but required in case you you need to access Opensearch from JS code (e.g. XHR requests) along with the opensearch configuration next section.
  server.cors: true

  csp.strict: false
  csp.warnLegacyBrowsers: false
  csp.rules:
    - "script-src 'unsafe-eval' 'unsafe-inline' https://www.gstatic.com/ https://d3js.org/ https://cdn.jsdelivr.net/ https://cdnjs.cloudflare.com/ https://cdn.datatables.net/ 'self'"
    - "worker-src blob: *"
    - "child-src data: * blob: *"
  `);
}

export const opensearchDashboardsYMLTemplate = {
  name: 'config/opensearch_dashboards.yml',
  generator,
};
