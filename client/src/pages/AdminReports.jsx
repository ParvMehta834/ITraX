import { useEffect, useState } from 'react';
import { Download, Eye, ChevronDown } from 'lucide-react';
import reportsService from '../services/reportsService';

export default function AdminReports() {
  const [expandedReport, setExpandedReport] = useState(null);
  const [reportData, setReportData] = useState({});
  const [loading, setLoading] = useState(null);
  const [issues, setIssues] = useState([]);
  const [issuesLoading, setIssuesLoading] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState('OPEN');
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [toast, setToast] = useState(null);

  const reports = [
    {
      id: 'assets-master',
      name: 'Asset Master List',
      description: 'Complete list of all assets with detailed information',
      icon: '📋'
    },
    {
      id: 'assets-by-status',
      name: 'Assets by Status',
      description: 'Assets grouped and summarized by their current status',
      icon: '🏷️'
    },
    {
      id: 'assets-by-location',
      name: 'Assets by Location',
      description: 'Asset distribution and count by location',
      icon: '📍'
    },
    {
      id: 'assets-by-category',
      name: 'Assets by Category',
      description: 'Asset breakdown by category with availability',
      icon: '📂'
    },
    {
      id: 'assets-by-department',
      name: 'Assets by Department',
      description: 'Assets assigned to each department',
      icon: '🏢'
    },
    {
      id: 'warranty-expiring',
      name: 'Warranty Expiring',
      description: 'Assets with upcoming warranty expirations',
      icon: '⚠️'
    }
  ];

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchIssueReports = async () => {
    setIssuesLoading(true);
    try {
      const payload = await reportsService.getIssueReports();
      setIssues(payload?.data || []);
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to load employee reports', 'error');
    } finally {
      setIssuesLoading(false);
    }
  };

  useEffect(() => {
    fetchIssueReports();
  }, []);

  const handlePreview = async (reportId) => {
    setLoading(reportId);
    try {
      const payload = await reportsService.getReport(reportId);
      const data = payload.data || payload || [];
      setReportData(prev => ({
        ...prev,
        [reportId]: data
      }));
      showToast(`${reportId} preview loaded`, 'success');
    } catch (error) {
      showToast('Failed to load report preview', 'error');
    } finally {
      setLoading(null);
    }
  };

  const handleExport = async (reportId) => {
    try {
      const response = await reportsService.exportReport(reportId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast('Report exported successfully', 'success');
    } catch (error) {
      showToast('Failed to export report', 'error');
    }
  };

  const toggleExpand = (reportId) => {
    if (expandedReport === reportId) {
      setExpandedReport(null);
    } else {
      setExpandedReport(reportId);
      if (!reportData[reportId]) {
        handlePreview(reportId);
      }
    }
  };

  const openFeedback = (issue) => {
    setFeedbackModal(issue);
    setFeedbackText(issue.adminFeedback || '');
    setFeedbackStatus(issue.status || 'OPEN');
  };

  const submitFeedback = async () => {
    if (!feedbackModal) return;
    if (!feedbackText.trim()) {
      showToast('Please write feedback first', 'error');
      return;
    }

    setSavingFeedback(true);
    try {
      await reportsService.updateIssueFeedback(feedbackModal._id, {
        adminFeedback: feedbackText.trim(),
        status: feedbackStatus
      });
      showToast('Feedback updated successfully', 'success');
      setFeedbackModal(null);
      setFeedbackText('');
      setFeedbackStatus('OPEN');
      fetchIssueReports();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to save feedback', 'error');
    } finally {
      setSavingFeedback(false);
    }
  };

  const renderPreviewTable = (data, reportId) => {
    if (!Array.isArray(data) || data.length === 0) {
      return <p className="py-4 text-gray-500 text-center">No data available</p>;
    }

    if (reportId === 'assets-by-status' || reportId === 'assets-by-location' || 
        reportId === 'assets-by-category' || reportId === 'assets-by-department') {
      // Summary reports
      const headers = Object.keys(data[0]);
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b">
              <tr>
                {headers.map(header => (
                  <th key={header} className="px-4 py-2 text-left font-medium text-gray-700">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 10).map((row, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  {headers.map(header => (
                    <td key={`${idx}-${header}`} className="px-4 py-2 text-gray-600">
                      {row[header]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {data.length > 10 && (
            <p className="py-2 text-gray-500 text-sm">Showing 10 of {data.length} records</p>
          )}
        </div>
      );
    } else {
      // Asset detail reports
      const headers = ['_id', 'name', 'assetTag', 'category', 'location', 'status']
        .filter(h => data[0] && typeof data[0][h] !== 'object');
      
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b">
              <tr>
                {headers.map(header => (
                  <th key={header} className="px-4 py-2 text-left font-medium text-gray-700">
                    {header === '_id' ? 'ID' : header.replace(/([A-Z])/g, ' $1').trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 10).map((row, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  {headers.map(header => (
                    <td key={`${idx}-${header}`} className="px-4 py-2 text-gray-600">
                      {row[header] || '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {data.length > 10 && (
            <p className="py-2 text-gray-500 text-sm">Showing 10 of {data.length} records</p>
          )}
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600 mt-2">
          Generate and export comprehensive asset reports for analysis and auditing.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {reports.map(report => (
          <div
            key={report.id}
            className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
          >
            <button
              onClick={() => toggleExpand(report.id)}
              className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start gap-4 text-left">
                <span className="text-2xl">{report.icon}</span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{report.name}</h3>
                  <p className="text-gray-600 text-sm mt-1">{report.description}</p>
                </div>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-gray-400 transition-transform ${
                  expandedReport === report.id ? 'transform rotate-180' : ''
                }`}
              />
            </button>

            {expandedReport === report.id && (
              <div className="border-t border-gray-200 p-6 space-y-4">
                <div className="flex gap-3">
                  <button
                    onClick={() => handlePreview(report.id)}
                    disabled={loading === report.id}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 disabled:opacity-50 font-medium text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    {loading === report.id ? 'Loading...' : 'Preview'}
                  </button>
                  <button
                    onClick={() => handleExport(report.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 font-medium text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                </div>

                {reportData[report.id] && (
                  <div className="mt-4 bg-gray-50 rounded-md p-4 border border-gray-200">
                    {renderPreviewTable(reportData[report.id], report.id)}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900">Employee Submitted Reports</h2>
        <p className="text-sm text-gray-600 mt-1">All employee issue descriptions appear here. You can mark them solved and send feedback.</p>

        <div className="mt-4 rounded-lg border border-gray-200 overflow-x-auto">
          {issuesLoading ? (
            <div className="p-6 text-sm text-gray-500">Loading employee reports...</div>
          ) : issues.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">No employee reports yet.</div>
          ) : (
            <table className="w-full min-w-[980px] text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Employee</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Description</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Feedback</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Submitted</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {issues.map((issue) => (
                  <tr key={issue._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900 font-medium">{issue.employeeName || 'Employee'}</td>
                    <td className="px-4 py-3 text-gray-600">{issue.employeeEmail || '—'}</td>
                    <td className="px-4 py-3 text-gray-900 max-w-[320px] whitespace-pre-wrap">{issue.description}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${issue.status === 'SOLVED' ? 'bg-green-100' : 'bg-amber-100'} text-gray-900`}>
                        {issue.status === 'SOLVED' ? 'Solved' : 'Open'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-900 max-w-[250px] whitespace-pre-wrap">{issue.adminFeedback || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{issue.createdAt ? new Date(issue.createdAt).toLocaleString() : '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => openFeedback(issue)}
                        className="px-3 py-1.5 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs font-medium"
                      >
                        Edit Feedback
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {feedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900">Update Employee Report</h3>
            <p className="text-sm text-gray-600 mt-1">{feedbackModal.employeeName} - {feedbackModal.employeeEmail}</p>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={feedbackStatus}
                  onChange={(e) => setFeedbackStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="OPEN">Open</option>
                  <option value="SOLVED">Solved</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Feedback</label>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  rows={4}
                  placeholder="Write feedback for employee"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setFeedbackModal(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={submitFeedback}
                disabled={savingFeedback}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {savingFeedback ? 'Saving...' : 'Save Feedback'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-md text-white text-sm z-40 ${toast.type === 'success' ? 'bg-green-600' : toast.type === 'error' ? 'bg-red-600' : 'bg-blue-600'}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
