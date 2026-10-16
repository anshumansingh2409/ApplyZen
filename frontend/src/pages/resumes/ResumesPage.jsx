import React, { useState, useEffect } from 'react';
import { FileText, Upload, Star, Trash2, CheckCircle2, RefreshCw, Plus } from 'lucide-react';
import { resumeService } from '../../services/resume.service';

export default function ResumesPage() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [title, setTitle] = useState('');
  const [versionLabel, setVersionLabel] = useState('v1.0');
  const [isPreferred, setIsPreferred] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchResumes = async () => {
    try {
      const data = await resumeService.list();
      setResumes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('version_label', versionLabel);
    formData.append('is_preferred', isPreferred);
    formData.append('file', file);

    try {
      await resumeService.upload(formData);
      setShowUpload(false);
      setTitle('');
      setFile(null);
      await fetchResumes();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleSetPreferred = async (id) => {
    try {
      await resumeService.setPreferred(id);
      await fetchResumes();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this resume?')) return;
    try {
      await resumeService.delete(id);
      await fetchResumes();
    } catch (err) {
      console.error(err);
    }
  };

  const [isDragging, setIsDragging] = useState(false);

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      if (!title) {
        setTitle(droppedFile.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
      }
      setShowUpload(true);
    }
  };

  const handleFileSelect = (selectedFile) => {
    if (selectedFile) {
      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
      }
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Resume Management</h2>
          <p className="text-sm text-gray-500 mt-1">
            Store multiple targeted resume versions. Drag and drop any PDF/DOCX version to extract skills automatically.
          </p>
        </div>

        <button
          onClick={() => setShowUpload(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#05603a] hover:bg-[#034a27] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Resume Version</span>
        </button>
      </div>

      {/* Interactive Drag & Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleFileDrop}
        onClick={() => setShowUpload(true)}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-emerald-600 bg-emerald-50/70 scale-[1.01]'
            : 'border-gray-200 bg-white hover:border-emerald-300 hover:bg-gray-50/50'
        }`}
      >
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#05603a] flex items-center justify-center mx-auto mb-3">
          <Upload className={`w-6 h-6 ${isDragging ? 'animate-bounce' : ''}`} />
        </div>
        <h4 className="text-sm font-bold text-gray-900">Drag & Drop Your Resume PDF Here</h4>
        <p className="text-xs text-gray-500 mt-1">
          Supports <span className="font-semibold text-gray-700">PDF, DOC, DOCX</span> up to 10MB. Or click to browse files.
        </p>
        <div className="mt-3 flex items-center justify-center gap-2 text-[11px] font-semibold text-emerald-700 bg-emerald-50 w-fit mx-auto px-3 py-1 rounded-full">
          <span>✓ Instant AI Skills Extraction</span>
          <span>•</span>
          <span>✓ Zero Hallucination Ground Truth</span>
        </div>
      </div>

      {/* Resumes Grid */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#05603a]" />
          <p className="text-sm">Loading resumes...</p>
        </div>
      ) : resumes.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-gray-100 shadow-2xs space-y-3">
          <FileText className="w-10 h-10 text-gray-300 mx-auto" />
          <h3 className="text-base font-bold text-gray-800">No resumes uploaded yet</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Upload your master resume or specialized versions (e.g. Frontend, Backend, AI/ML) to maximize match scores.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {resumes.map((r) => (
            <div
              key={r.id || r._id}
              className={`p-6 rounded-2xl bg-white border transition-all shadow-2xs flex flex-col justify-between ${
                r.is_preferred ? 'border-[#05603a] ring-1 ring-[#05603a]/20' : 'border-gray-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#05603a] flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-gray-900">{r.title}</h4>
                      <span className="text-xs text-gray-400 font-mono">{r.file_name} • {r.version_label}</span>
                    </div>
                  </div>

                  {r.is_preferred && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-[#05603a] border border-emerald-200">
                      <Star className="w-3 h-3 fill-current" />
                      Preferred
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-600 mt-4 leading-relaxed">{r.summary}</p>

                {/* Skills Preview */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {(r.skills_extracted || []).map((s, idx) => (
                    <span key={idx} className="text-[11px] px-2 py-0.5 bg-gray-50 border border-gray-200 rounded text-gray-700 font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-gray-400">Times Used: {r.times_used || 0}</span>
                <div className="flex items-center gap-2">
                  {!r.is_preferred && (
                    <button
                      onClick={() => handleSetPreferred(r.id || r._id)}
                      className="text-xs text-[#05603a] font-semibold hover:underline cursor-pointer"
                    >
                      Set as Preferred
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(r.id || r._id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-base">Upload Resume Version</h3>
              <button
                onClick={() => setShowUpload(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Resume Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Full Stack Engineering Resume"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#05603a]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Version Label</label>
                <input
                  type="text"
                  placeholder="e.g. v2.1"
                  value={versionLabel}
                  onChange={(e) => setVersionLabel(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#05603a]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Resume File (PDF / DOC)</label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleFileSelect(e.dataTransfer.files[0]);
                    }
                  }}
                  className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors cursor-pointer ${
                    file ? 'border-emerald-500 bg-emerald-50/40' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <input
                    type="file"
                    id="resumeFileInput"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files[0])}
                  />
                  <label htmlFor="resumeFileInput" className="cursor-pointer block">
                    {file ? (
                      <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="truncate max-w-[220px]">{file.name}</span>
                        <span className="text-[10px] text-gray-400 font-normal">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-5 h-5 mx-auto text-gray-400 mb-1" />
                        <p className="text-xs font-semibold text-gray-700">Drag & drop resume here, or click to browse</p>
                        <p className="text-[10px] text-gray-400">PDF, DOC, DOCX up to 10MB</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="prefCheck"
                  checked={isPreferred}
                  onChange={(e) => setIsPreferred(e.target.checked)}
                  className="rounded text-[#05603a] focus:ring-[#05603a]"
                />
                <label htmlFor="prefCheck" className="text-xs text-gray-700 font-medium">
                  Set as preferred primary resume
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowUpload(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 text-xs font-semibold bg-[#05603a] text-white rounded-lg hover:bg-[#034a27] disabled:opacity-50"
                >
                  {uploading ? 'Processing...' : 'Upload & Extract Skills'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
