import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Upload,
  Database,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Play,
  RotateCcw,
  Download,
  Table,
  Filter,
  Check,
  XCircle,
  HelpCircle,
  Clock
} from 'lucide-react';
import { formatNumber } from '../utils/formatters';

export default function EtlPage({ onEtlCompleted }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [sampleType, setSampleType] = useState('dirty');
  const [missingStrategy, setMissingStrategy] = useState('impute');
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); // 0: Idle, 1: Extract, 2: Transform, 3: Load, 4: Done
  const [etlSummary, setEtlSummary] = useState(null);
  const [rejectedSample, setRejectedSample] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);
  const [etlLogs, setEtlLogs] = useState([]);

  useEffect(() => {
    // Initial preview of dirty sample to demonstrate ETL capabilities
    handleLoadSample('dirty');
    fetchEtlLogs();
  }, []);

  const fetchEtlLogs = async () => {
    try {
      const res = await axios.get('/api/etl/logs');
      setEtlLogs(res.data.runs || []);
    } catch (err) {
      console.error('Failed to load ETL logs:', err);
    }
  };

  const handleLoadSample = async (type) => {
    setSelectedFile(null);
    setSampleType(type);
    setPreviewLoading(true);
    setErrorMsg(null);
    try {
      const res = await axios.post('/api/etl/preview', { sample_type: type });
      setPreviewData(res.data);
    } catch (err) {
      setErrorMsg('Failed to load sample dataset preview.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewLoading(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('/api/etl/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPreviewData(res.data);
    } catch (err) {
      setErrorMsg('Failed to read and parse uploaded CSV file.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const runEtlPipeline = async () => {
    setExecuting(true);
    setErrorMsg(null);
    setEtlSummary(null);
    setRejectedSample([]);

    // Stepped animation simulation to demonstrate DWDM ETL stages
    setCurrentStep(1); // Extraction
    await new Promise(r => setTimeout(r, 600));

    setCurrentStep(2); // Transformation
    await new Promise(r => setTimeout(r, 800));

    setCurrentStep(3); // Loading
    try {
      let res;
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('missing_value_strategy', missingStrategy);
        res = await axios.post('/api/etl/execute', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        res = await axios.post('/api/etl/execute', {
          sample_type: sampleType,
          missing_value_strategy: missingStrategy
        });
      }

      await new Promise(r => setTimeout(r, 500));
      setCurrentStep(4); // Done
      setEtlSummary(res.data.summary);
      setRejectedSample(res.data.rejected_sample || []);
      fetchEtlLogs();
      if (onEtlCompleted) onEtlCompleted();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'ETL execution failed');
      setCurrentStep(0);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Data Import & ETL Processing Engine</h2>
          <p className="text-xs text-slate-500">
            Enterprise pipeline for Extracting raw retail streams, Transforming schemas & cleaning dirty rows, and Loading into the Star/Snowflake schemas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
            Automated Audit & Quality Control
          </span>
        </div>
      </div>

      {/* Step 1: Ingestion & Configuration Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Dataset Selection & Upload */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/90 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <h3 className="text-sm font-bold text-slate-800 mb-1">1. Select Data Source</h3>
          <p className="text-[11px] text-slate-400 mb-4">Choose a demonstration dataset or upload your custom CSV file</p>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            <button
              onClick={() => handleLoadSample('clean')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                sampleType === 'clean' && !selectedFile
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Load Clean Dataset (12,893 rows)
            </button>
            <button
              onClick={() => handleLoadSample('dirty')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                sampleType === 'dirty' && !selectedFile
                  ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Load Dirty Test Sample (Contains Errors)
            </button>
          </div>

          {/* Upload Dropzone */}
          <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-5 text-center bg-slate-50/50 transition-colors cursor-pointer relative">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div className="flex flex-col items-center justify-center">
              <Upload className="w-7 h-7 text-blue-600 mb-2" />
              <p className="text-xs font-semibold text-slate-700">
                {selectedFile ? selectedFile.name : 'Drag & drop a custom CSV file here, or click to browse'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Accepted format: UTF-8 CSV with sales transaction attributes
              </p>
            </div>
          </div>
        </div>

        {/* Transformation Policies & Execution */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/90 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">2. Data Cleaning & Loading Strategy</h3>
            <p className="text-[11px] text-slate-400 mb-4">Define how the ETL engine should handle anomalies</p>

            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Missing Values Treatment:
                </label>
                <select
                  value={missingStrategy}
                  onChange={(e) => setMissingStrategy(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 outline-none"
                >
                  <option value="impute">Impute / Fill Defaults (e.g. "Guest Customer", 0 disc)</option>
                  <option value="drop">Strict: Reject rows with missing critical attributes</option>
                </select>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Duplicate Transaction ID Filter Active
                </div>
                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Negative Quantity & Amount Integrity Check
                </div>
                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Automated Dim_Date Calendar Key Generator
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100">
            <button
              onClick={runEtlPipeline}
              disabled={executing || previewLoading}
              className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all"
            >
              {executing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Running Pipeline...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Execute ETL Pipeline</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Stepped ETL Process Tracker */}
      {currentStep > 0 && (
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Pipeline Execution Stages</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className={`p-3 rounded-lg border ${currentStep >= 1 ? 'border-blue-500 bg-blue-50/50 text-blue-900' : 'border-slate-200 bg-slate-50 text-slate-400'}`}>
              <div className="flex items-center gap-2 font-bold text-xs">
                {currentStep > 1 ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <div className="w-4 h-4 rounded-full border-2 border-blue-600 flex items-center justify-center text-[10px]">1</div>}
                <span>Extraction</span>
              </div>
              <p className="text-[11px] mt-1 text-slate-500">Ingesting raw CSV records into DataFrame stream</p>
            </div>

            <div className={`p-3 rounded-lg border ${currentStep >= 2 ? 'border-blue-500 bg-blue-50/50 text-blue-900' : 'border-slate-200 bg-slate-50 text-slate-400'}`}>
              <div className="flex items-center gap-2 font-bold text-xs">
                {currentStep > 2 ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <div className="w-4 h-4 rounded-full border-2 border-blue-600 flex items-center justify-center text-[10px]">2</div>}
                <span>Transformation</span>
              </div>
              <p className="text-[11px] mt-1 text-slate-500">Validating types, parsing dates, filtering anomalies</p>
            </div>

            <div className={`p-3 rounded-lg border ${currentStep >= 3 ? 'border-blue-500 bg-blue-50/50 text-blue-900' : 'border-slate-200 bg-slate-50 text-slate-400'}`}>
              <div className="flex items-center gap-2 font-bold text-xs">
                {currentStep > 3 ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <div className="w-4 h-4 rounded-full border-2 border-blue-600 flex items-center justify-center text-[10px]">3</div>}
                <span>Loading</span>
              </div>
              <p className="text-[11px] mt-1 text-slate-500">Upserting Dimensions & inserting Fact_Sales batch</p>
            </div>

            <div className={`p-3 rounded-lg border ${currentStep === 4 ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900' : 'border-slate-200 bg-slate-50 text-slate-400'}`}>
              <div className="flex items-center gap-2 font-bold text-xs">
                {currentStep === 4 ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-300 flex items-center justify-center text-[10px]">4</div>}
                <span>Audit & Log</span>
              </div>
              <p className="text-[11px] mt-1 text-slate-500">Logging execution stats and archiving rejected rows</p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Metrics (when complete) */}
      {etlSummary && (
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">ETL Execution Summary</h3>
              <p className="text-[11px] text-slate-400">Timestamp: {etlSummary.timestamp}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                etlSummary.rows_rejected > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {etlSummary.status}
              </span>
              {etlSummary.rows_rejected > 0 && (
                <a
                  href="/api/etl/rejected/download"
                  download
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Download Rejected Records (CSV)
                </a>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[11px] text-slate-500 block">Total Records Read</span>
              <span className="text-xl font-bold text-slate-800">{formatNumber(etlSummary.rows_processed)}</span>
            </div>
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <span className="text-[11px] text-emerald-700 block">Successfully Loaded</span>
              <span className="text-xl font-bold text-emerald-800">{formatNumber(etlSummary.rows_loaded)}</span>
            </div>
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200">
              <span className="text-[11px] text-rose-700 block">Rejected Records</span>
              <span className="text-xl font-bold text-rose-800">{formatNumber(etlSummary.rows_rejected)}</span>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <span className="text-[11px] text-blue-700 block">Execution Time</span>
              <span className="text-xl font-bold text-blue-800">{etlSummary.execution_time_sec}s</span>
            </div>
          </div>

          {/* Rejected Records Sample List */}
          {rejectedSample.length > 0 && (
            <div className="mt-5 pt-4 border-t border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5 text-rose-600">
                <AlertTriangle className="w-4 h-4" /> Validation Failure Log (Showing first {rejectedSample.length} rejected rows)
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50">
                      <th className="p-2">Row #</th>
                      <th className="p-2">Validation Rejection Reason</th>
                      <th className="p-2">Transaction ID</th>
                      <th className="p-2">Product</th>
                      <th className="p-2">Quantity</th>
                      <th className="p-2">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rejectedSample.map((rej, i) => (
                      <tr key={i} className="hover:bg-rose-50/40">
                        <td className="p-2 font-mono font-bold text-slate-600">{rej.row_index}</td>
                        <td className="p-2 font-semibold text-rose-600">{rej.reason}</td>
                        <td className="p-2 font-mono text-slate-600">{rej.data?.transaction_id || '-'}</td>
                        <td className="p-2 text-slate-600">{rej.data?.product_name || '(empty)'}</td>
                        <td className="p-2 text-slate-600">{rej.data?.quantity || '-'}</td>
                        <td className="p-2 text-slate-600">{rej.data?.transaction_date || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dataset Preview & Column Schema Inspection */}
      {previewData && (
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Source Dataset Preview ({previewData.filename})</h3>
              <p className="text-[11px] text-slate-400">
                Total Rows: {formatNumber(previewData.total_rows)} | Attributes: {previewData.total_columns}
              </p>
            </div>
          </div>

          {/* Column metadata chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            {previewData.columns.map((col) => (
              <div key={col.name} className="px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
                <span className="font-semibold text-slate-800">{col.name}</span>
                <span className="text-slate-400 ml-1">({col.data_type})</span>
                {col.null_count > 0 && (
                  <span className="ml-1 text-rose-600 font-bold">[{col.null_count} nulls]</span>
                )}
              </div>
            ))}
          </div>

          <div className="overflow-x-auto max-h-64 overflow-y-auto">
            <table className="w-full text-xs text-left">
              <thead className="sticky top-0 bg-slate-100">
                <tr className="border-b border-slate-200 text-slate-600 font-semibold">
                  {previewData.columns.map(c => (
                    <th key={c.name} className="p-2 whitespace-nowrap">{c.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {previewData.preview_records.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    {previewData.columns.map(c => (
                      <td key={c.name} className="p-2 whitespace-nowrap text-slate-600">
                        {String(row[c.name] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Historical ETL Audit Run Logs */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <h3 className="text-sm font-bold text-slate-800 mb-1">Historical ETL Audit Logs</h3>
        <p className="text-[11px] text-slate-400 mb-3">Audit trail stored in table `etl_runs` for governance and compliance</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400">
                <th className="pb-2">Run ID</th>
                <th className="pb-2">Timestamp</th>
                <th className="pb-2">Source File</th>
                <th className="pb-2 text-right">Processed</th>
                <th className="pb-2 text-right">Loaded</th>
                <th className="pb-2 text-right">Rejected</th>
                <th className="pb-2 text-right">Duration</th>
                <th className="pb-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {etlLogs.map(run => (
                <tr key={run.run_id} className="hover:bg-slate-50">
                  <td className="py-2.5 font-mono font-bold text-slate-500">#{run.run_id}</td>
                  <td className="py-2.5 text-slate-600">{run.run_timestamp}</td>
                  <td className="py-2.5 text-slate-800 font-medium">{run.source_file}</td>
                  <td className="py-2.5 text-right text-slate-600">{formatNumber(run.rows_processed)}</td>
                  <td className="py-2.5 text-right font-semibold text-emerald-600">{formatNumber(run.rows_loaded)}</td>
                  <td className="py-2.5 text-right font-semibold text-rose-600">{formatNumber(run.rows_rejected)}</td>
                  <td className="py-2.5 text-right text-slate-500">{run.execution_time_sec}s</td>
                  <td className="py-2.5 text-right">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {run.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
