/* Copyright 2019 The TensorFlow Authors. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
==============================================================================*/
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {
  Alert,
  DebuggerRunListing,
  Execution,
  ExecutionDigest,
  StackFrame,
} from '../store/debugger_types';
import {TBHttpClient} from '../../../../webapp/webapp_data_source/tb_http_client';

/** @typehack */ import * as _typeHackRxjs from 'rxjs';

// The backend route for source-file list responds with an array
// of 2-tuples: <host_name, file_path>.
export type SourceFileListResponse = Array<[string, string]>;

export interface StackFramesResponse {
  stack_frames: StackFrame[];
}

export interface ExecutionDigestsResponse {
  begin: number;

  end: number;

  num_digests: number;

  execution_digests: ExecutionDigest[];
}

export interface ExecutionDataResponse {
  begin: number;

  end: number;

  executions: Execution[];
}

export interface AlertsResponse {
  begin: number;

  end: number;

  num_alerts: number;

  alerts_breakdown: {[alert_type: string]: number};

  per_type_alert_limit: number;

  alert_type?: string;

  alerts: Alert[];
}

export abstract class Tfdbg2DataSource {
  abstract fetchRuns(): Observable<DebuggerRunListing>;

  abstract fetchExecutionDigests(
    run: string,
    begin: number,
    end: number
  ): Observable<ExecutionDigestsResponse>;

  abstract fetchExecutionData(
    run: string,
    begin: number,
    end: number
  ): Observable<ExecutionDataResponse>;

  abstract fetchSourceFileList(run: string): Observable<SourceFileListResponse>;

  abstract fetchStackFrames(
    run: string,
    stackFrameIds: string[]
  ): Observable<StackFramesResponse>;

  /**
   * Fetch alerts.
   *
   * @param run Run name.
   * @param begin Beginning index, inclusive.
   * @param end Ending index, exclusive. Can use `begin=0` and `end=0`
   *   to retrieve only the number of alerts and their breakdown by type.
   *   Use `end=-1` to retrieve all alerts (for all alert types or only
   *   a specific alert type, depending on whether `alert_type` is specified.)
   * @param alert_type Optional filter for alert type. If specified,
   *   `begin` and `end` refer to the beginning and indices in the
   *   specific alert type.
   */
  abstract fetchAlerts(
    run: string,
    begin: number,
    end: number,
    alert_type?: string
  ): Observable<AlertsResponse>;
}

@Injectable()
export class Tfdbg2HttpServerDataSource implements Tfdbg2DataSource {
  private readonly httpPathPrefix = 'data/plugin/debugger-v2';

  constructor(private http: TBHttpClient) {}

  fetchRuns() {
    // TODO(cais): Once the backend uses an DataProvider that unifies tfdbg and
    // non-tfdbg plugins, switch to using `tf_backend.runStore.refresh()`.
    return this.http.get<DebuggerRunListing>(this.httpPathPrefix + '/runs');
  }

  fetchExecutionDigests(run: string, begin: number, end: number) {
    return this.http.get<ExecutionDigestsResponse>(
      this.httpPathPrefix + '/execution/digests',
      {
        params: {
          run,
          begin: String(begin),
          end: String(end),
        },
      }
    );
  }

  fetchExecutionData(run: string, begin: number, end: number) {
    return this.http.get<ExecutionDataResponse>(
      this.httpPathPrefix + '/execution/data',
      {
        params: {
          run,
          begin: String(begin),
          end: String(end),
        },
      }
    );
  }

  fetchSourceFileList(run: string): Observable<SourceFileListResponse> {
    return this.http.get<SourceFileListResponse>(
      this.httpPathPrefix + '/source_files/list',
      {
        params: {
          run,
        },
      }
    );
  }

  fetchStackFrames(run: string, stackFrameIds: string[]) {
    return this.http.get<StackFramesResponse>(
      this.httpPathPrefix + '/stack_frames/stack_frames',
      {
        params: {
          run,
          stack_frame_ids: stackFrameIds.join(','),
        },
      }
    );
  }

  fetchAlerts(run: string, begin: number, end: number, alert_type?: string) {
    const params: {[param: string]: string} = {
      run,
      begin: String(begin),
      end: String(end),
    };
    if (alert_type !== undefined) {
      params['alert_type'] = alert_type;
    }
    return this.http.get<AlertsResponse>(this.httpPathPrefix + '/alerts', {
      params,
    });
  }

  // TODO(cais): Implement fetchEnvironments().
}
