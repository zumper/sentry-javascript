/*
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { bindReporter } from './lib/bindReporter';
import { getVisibilityWatcher } from './lib/getVisibilityWatcher';
import { initMetric } from './lib/initMetric';
import { observe, PerformanceEntryHandler } from './lib/observe';
import { onHidden } from './lib/onHidden';
import { PerformanceEventTiming, ReportHandler } from './types';

export const getFID = (onReport: ReportHandler, reportAllChanges?: boolean): void => {
  const visibilityWatcher = getVisibilityWatcher();
  const metric = initMetric('FID');
  let report: ReturnType<typeof bindReporter>;

  const entryHandler = (entry: PerformanceEventTiming): void => {
    // Only report if the page wasn't hidden prior to the first input.
    if (report && entry.startTime < visibilityWatcher.firstHiddenTime) {
      metric.value = entry.processingStart - entry.startTime;
      metric.entries.push(entry);
      report(true);
    }
  };

  const po = observe('first-input', entryHandler as PerformanceEntryHandler);
  if (po) {
    report = bindReporter(onReport, metric, reportAllChanges);
    onHidden(() => {
      po.takeRecords().map(entryHandler as PerformanceEntryHandler);
      po.disconnect();
    }, true);
  }
};
