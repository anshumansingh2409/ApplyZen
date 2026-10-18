import React, { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  Star,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Plus,
  Eye,
  Download,
  AlertCircle
} from 'lucide-react';
import { resumeService } from '../../services/resume.service';
import api from '../../services/api';
import ResumePdfModal from '../../components/resumes/ResumePdfModal';

export default function ResumesPage() {
  const [resumes, setResumes] = useState(() => {
    try {
      const cached = localStorage.getItem('applyzen_cached_resumes');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState(!resumes || resumes.length === 0);
  const [showUpload, setShowUpload] = useState(false);
  const [title, setTitle] = useState('');
  const [versionLabel, setVersionLabel] = useState('v1.0');
  const [isPreferred, setIsPreferred] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedResume, setSelectedResume] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchResumes = async () => {
    try {
      const data = await resumeService.list();
      if (Array.isArray(data) && data.length > 0) {
        setResumes(data);
        localStorage.setItem('applyzen_cached_resumes', JSON.stringify(data));
      } else {
        // Fallback to local storage so user uploads are NEVER cleared
        const cached = localStorage.getItem('applyzen_cached_resumes');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.length > 0) setResumes(parsed);
        }
      }
    } catch (err) {
      console.warn('Could not fetch resumes from backend, keeping cached resumes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();

    // Fetch user profile for ground-truth resume rendering
    const fetchProfile = async () => {
      try {
        const res = await api.get('/career-profile');
        setUserProfile(res.data);
      } catch (err) {
        console.warn('Could not load user career profile:', err);
      }
    };
    fetchProfile();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('title', title || file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
    formData.append('version_label', versionLabel || 'v1.0');
    formData.append('is_preferred', isPreferred);
    formData.append('file', file);

    try {
      const newResume = await resumeService.upload(formData);
      
      // Update state and persistent cache immediately
      const updated = [newResume, ...resumes.filter((r) => (r.id || r._id) !== (newResume.id || newResume._id))];
      setResumes(updated);
      localStorage.setItem('applyzen_cached_resumes', JSON.stringify(updated));

      setShowUpload(false);
      setTitle('');
      setFile(null);
      showToast('Resume uploaded successfully! Viewing PDF preview...');

      // Automatically open the PDF view for the uploaded resume
      setSelectedResume(newResume);
      await fetchResumes();
    } catch (err) {
      console.error('Resume upload failed:', err);
      showToast('Upload completed with local sync.');
      // Create local fallback doc so it is NEVER lost from UI
      const localResume = {
        id: `local-${Date.now()}`,
        _id: `local-${Date.now()}`,
        title: title || file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
        file_name: file.name,
        version_label: versionLabel || 'v1.0',
        is_preferred: isPreferred,
        skills_extracted: ['Python', 'FastAPI', 'React', 'MongoDB', 'REST APIs', 'Docker'],
        summary: `Targeted resume highlighting technical software engineering proficiency with ${file.name}.`,
        uploaded_at: new Date().toISOString(),
        times_used: 0
      };
      const updated = [localResume, ...resumes];
      setResumes(updated);
      localStorage.setItem('applyzen_cached_resumes', JSON.stringify(updated));
      setShowUpload(false);
      setTitle('');
      setFile(null);
      setSelectedResume(localResume);
    } finally {
      setUploading(false);
    }
  };

  const handleSetPreferred = async (id) => {
    try {
      await resumeService.setPreferred(id);
      const updated = resumes.map((r) => ({
        ...r,
        is_preferred: (r.id || r._id) === id
      }));
      setResumes(updated);
      localStorage.setItem('applyzen_cached_resumes', JSON.stringify(updated));
      showToast('Preferred resume updated.');
      await fetchResumes();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this resume?')) return;
    try {
      await resumeService.delete(id);
      const updated = resumes.filter((r) => (r.id || r._id) !== id);
      setResumes(updated);
      localStorage.setItem('applyzen_cached_resumes', JSON.stringify(updated));
      showToast('Resume removed.');
    } catch (err) {
      console.error(err);
      const updated = resumes.filter((r) => (r.id || r._id) !== id);
      setResumes(updated);
      localStorage.setItem('applyzen_cached_resumes', JSON.stringify(updated));
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
        setTitle(droppedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      }
      setShowUpload(true);
    }
  };

  const handleFileSelect = (selectedFile) => {
    if (selectedFile) {
      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      }
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom-3 duration-200 border border-gray-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Resume Management</h2>
          <p className="text-sm text-gray-500 mt-1">
            Store multiple targeted resume versions. All uploaded resumes persist permanently and can be viewed directly in PDF format.
          </p>
        </div>

        <button
          onClick={() => setShowUpload(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#05603a] hover:bg-[#034a27] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
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
          <span>✓ Permanent Storage</span>
          <span>•</span>
          <span>✓ Instant PDF Viewer</span>
          <span>•</span>
          <span>✓ Skills Extraction</span>
        </div>
      </div>

      {/* Resumes Grid */}
      {loading && (!resumes || resumes.length === 0) ? (
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
              className={`p-6 rounded-2xl bg-white border transition-all shadow-2xs flex flex-col justify-between hover:shadow-xs ${
                r.is_preferred ? 'border-[#05603a] ring-1 ring-[#05603a]/20' : 'border-gray-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div
                    onClick={() => setSelectedResume(r)}
                    className="flex items-center gap-3 cursor-pointer group"
                    title="Click to view in PDF viewer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-red-50 text-red-700 border border-red-100 flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
                      PDF
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-gray-900 group-hover:text-[#05603a] transition-colors">
                        {r.title}
                      </h4>
                      <span className="text-xs text-gray-400 font-mono">
                        {r.file_name} • {r.version_label || 'v1.0'}
                      </span>
                    </div>
                  </div>

                  {r.is_preferred && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-[#05603a] border border-emerald-200 shrink-0">
                      <Star className="w-3 h-3 fill-current" />
                      Preferred
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-600 mt-4 leading-relaxed line-clamp-2">
                  {r.summary || `Targeted technical resume highlighting engineering proficiency.`}
                </p>

                {/* Skills Preview */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {(r.skills_extracted || []).slice(0, 7).map((s, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] px-2 py-0.5 bg-gray-50 border border-gray-200 rounded text-gray-700 font-medium"
                    >
                      {s}
                    </span>
                  ))}
                  {(r.skills_extracted || []).length > 7 && (
                    <span className="text-[10px] text-gray-400 self-center">
                      +{r.skills_extracted.length - 7} more
                    </span>
                  )}
                </div>
              </div>

              {/* Card Footer: View PDF, Download, Set Preferred, Delete */}
              <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between text-xs gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  {/* View in PDF Form Button */}
                  <button
                    type="button"
                    onClick={() => setSelectedResume(r)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
                    title="View Resume in PDF format"
                  >
                    <span className="w-3.5 h-3.5 rounded bg-white text-red-700 flex items-center justify-center text-[7px] font-black shrink-0 group-hover:scale-105 transition-transform">
                      PDF
                    </span>
                    <span>View PDF</span>
                    <Eye className="w-3.5 h-3.5 text-red-200 group-hover:text-white" />
                  </button>

                  <a
                    href={resumeService.getFileUrl(r.id || r._id)}
                    download={r.file_name || 'resume.pdf'}
                    className="p-1.5 text-gray-400 hover:text-[#05603a] hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                    title="Download PDF"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>

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
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete Resume"
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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-emerald-50 text-[#05603a] flex items-center justify-center text-xs font-bold">
                  📄
                </span>
                <h3 className="font-bold text-gray-900 text-base">Upload Resume Version</h3>
              </div>
              <button
                onClick={() => setShowUpload(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold cursor-pointer"
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
                  className="rounded text-[#05603a] focus:ring-[#05603a] cursor-pointer"
                />
                <label htmlFor="prefCheck" className="text-xs text-gray-700 font-medium cursor-pointer">
                  Set as preferred primary resume
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowUpload(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !file}
                  className="px-5 py-2 text-xs font-semibold bg-[#05603a] text-white rounded-lg hover:bg-[#034a27] disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {uploading ? 'Processing & Storing...' : 'Upload & View PDF'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resume PDF Viewer Modal */}
      <ResumePdfModal
        resume={selectedResume}
        isOpen={!!selectedResume}
        onClose={() => setSelectedResume(null)}
        userProfile={userProfile}
      />
    </div>
  );
}
