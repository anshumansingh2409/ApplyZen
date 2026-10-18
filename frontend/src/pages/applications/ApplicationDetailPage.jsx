import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  Sparkles,
  Bot,
  ExternalLink,
  Save,
  Plus,
  Trash2,
  Building2,
  Calendar,
  FileText,
  HelpCircle
} from 'lucide-react';
import { applicationService } from '../../services/application.service';

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const [application, setApplication] = useState(null);
  const [fields, setFields] = useState([]);
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionNotice, setActionNotice] = useState('');

  // Add custom field modal state
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');

  const fetchApp = async () => {
    try {
      const data = await applicationService.get(id);
      setApplication(data);
      setFields(data.form_fields || []);
      setSubmissionNotes(data.submission_notes || '');
    } catch (err) {
      console.error('Failed to load application:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApp();
  }, [id]);

  const showNotification = (msg) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(''), 4500);
  };

  const handleFieldChange = (idx, val) => {
    const updated = [...fields];
    updated[idx] = {
      ...updated[idx],
      user_edited_value: val,
      value: val
    };
    setFields(updated);
  };

  const handleRemoveField = (idx) => {
    const updated = fields.filter((_, i) => i !== idx);
    setFields(updated);
  };

  const handleAddNewField = (e) => {
    e.preventDefault();
    if (!newFieldLabel.trim()) return;

    const newField = {
      field_name: newFieldLabel.trim().toLowerCase().replace(/\s+/g, '_'),
      field_label: newFieldLabel.trim(),
      value: newFieldValue.trim(),
      user_edited_value: newFieldValue.trim(),
      source: 'user_custom_input',
      confidence: 1.0,
      confidence_level: 'HIGH'
    };

    setFields([...fields, newField]);
    setNewFieldLabel('');
    setNewFieldValue('');
    setShowAddFieldModal(false);
    showNotification(`Added field "${newField.field_label}". Click "Save Changes" to store permanently.`);
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    setActionNotice('');
    try {
      await applicationService.update(id, {
        form_fields: fields,
        submission_notes: submissionNotes,
        note: 'Candidate checked and updated application credentials & notes.'
      });
      showNotification('Changes saved successfully! All application data updated.');
      await fetchApp();
    } catch (err) {
      console.error('Failed to save changes:', err);
      showNotification('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-gray-400">
        <Sparkles className="w-8 h-8 animate-spin mx-auto text-[#05603a] mb-2" />
        <p className="text-sm">Loading application telemetry...</p>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="p-10 text-center">
        <p className="text-gray-500">Application not found.</p>
        <Link to="/applications" className="text-[#05603a] font-semibold text-sm mt-2 inline-block">
          ← Back to Applications
        </Link>
      </div>
    );
  }

  const formUrl = application.google_form_url || application.application_url;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Back Link */}
      <Link
        to="/applications"
        className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Applications</span>
      </Link>

      {/* Header Banner */}
      <div className="bg-white p-7 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 text-[#05603a] flex items-center justify-center font-bold text-2xl shrink-0">
            {application.company?.charAt(0) || 'C'}
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{application.company}</h2>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-[#05603a] border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#05603a]" />
                <span>Submitted</span>
              </span>
            </div>
            <p className="text-sm font-medium text-gray-600 mt-1">{application.role}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Targeted Resume: <strong className="font-semibold text-gray-700">{application.resume_used_name || 'Anshuman_Resume.pdf'}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          <div className="text-right px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-100">
            <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">AI Match</span>
            <span className="text-2xl font-black text-[#05603a]">{application.match_score || 92}%</span>
          </div>

          {formUrl && (
            <a
              href={formUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-colors"
              title="Open Google Form in new tab"
            >
              <span>📝 Open Form</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          <button
            type="button"
            onClick={handleSaveChanges}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#05603a] hover:bg-[#034a27] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* TWO COLUMNS: Form Fields Review vs Timeline/Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Form Fields Review, Editing & Adding */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 gap-2 flex-wrap">
            <div>
              <h3 className="text-base font-bold text-gray-900">Auto-Filled Form Details</h3>
              <p className="text-xs text-gray-500">
                You can review values, edit any field, or add custom fields below.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddFieldModal(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#05603a] border border-emerald-200 text-xs font-bold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Field</span>
              </button>

              <button
                type="button"
                onClick={handleSaveChanges}
                disabled={saving}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#05603a] hover:bg-[#034a27] text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>
          </div>

          {/* Form Fields List */}
          <div className="space-y-3.5">
            {fields.map((f, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-gray-50/70 border border-gray-200 space-y-1.5 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-bold text-gray-800">
                    {f.field_label || f.field_name}
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-gray-400">
                      {f.source || 'ground_truth'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveField(idx)}
                      className="text-gray-400 hover:text-red-600 transition-colors p-1"
                      title="Remove this field"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  value={f.user_edited_value !== null && f.user_edited_value !== undefined ? f.user_edited_value : (f.value || '')}
                  onChange={(e) => handleFieldChange(idx, e.target.value)}
                  className="w-full text-xs bg-white px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-[#05603a] font-medium text-gray-900"
                  placeholder="Enter value..."
                />
              </div>
            ))}
          </div>

          {/* Submission Notes & Remarks */}
          <div className="pt-4 border-t border-gray-100 space-y-2">
            <label className="block text-xs font-bold text-gray-800">
              Candidate Notes & Remarks
            </label>
            <textarea
              rows={3}
              value={submissionNotes}
              onChange={(e) => setSubmissionNotes(e.target.value)}
              placeholder="Add any extra notes, roll number, drive updates, or remarks..."
              className="w-full text-xs bg-gray-50 p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#05603a] font-medium text-gray-900 resize-none"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveChanges}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#05603a] hover:bg-[#034a27] text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save All Updates</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Timeline & Activity Logs */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Timeline View */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-gray-900">Application Timeline</h3>
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
              {(application.timeline || []).map((ev, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-[#05603a] border-2 border-white shadow-2xs" />
                  <div>
                    <h5 className="text-xs font-bold text-gray-900">{ev.title}</h5>
                    <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{ev.description}</p>
                    <span className="text-[10px] text-gray-400 mt-1 block font-mono">
                      {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(ev.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Activity Log */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Bot className="w-4 h-4 text-[#05603a]" />
              AI Activity Audit Log
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {(application.ai_activity_log || []).map((log, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-gray-50 text-xs border border-gray-100">
                  <div className="flex items-center justify-between text-gray-500 text-[10px]">
                    <span className="font-semibold text-emerald-800">{log.agent_name}</span>
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-gray-800 mt-1">{log.activity}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Add Custom Field Modal */}
      {showAddFieldModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-base">Add Custom Field / Answer</h3>
              <button
                type="button"
                onClick={() => setShowAddFieldModal(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddNewField} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Field Name / Label
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alternate Phone, Roll Number, GitHub Repo"
                  value={newFieldLabel}
                  onChange={(e) => setNewFieldLabel(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#05603a]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Field Value / Answer
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 210101099, https://github.com/..."
                  value={newFieldValue}
                  onChange={(e) => setNewFieldValue(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#05603a]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddFieldModal(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-[#05603a] text-white rounded-lg hover:bg-[#034a27] cursor-pointer shadow-xs"
                >
                  Add Field
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
