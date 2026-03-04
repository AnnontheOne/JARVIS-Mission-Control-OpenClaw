/**
 * Reports & Files Slide-out Panel (v2.0.2)
 * Replaces the right sidebar Reports section.
 */

let _reportsCurrentDir = 'reports';

async function openReportsPanel() {
    const panel = document.getElementById('reports-panel');
    if (!panel) return;
    panel.style.display = 'flex';
    panel.style.flexDirection = 'column';
    panel.classList.add('open');
    await loadReportsPanelFiles(_reportsCurrentDir);
}

function closeReportsPanel() {
    const panel = document.getElementById('reports-panel');
    if (panel) { panel.classList.remove('open'); panel.style.display = 'none'; }
}

async function switchReportsTab(dir) {
    _reportsCurrentDir = dir;
    // Update tab button styles
    ['reports','logs','archived-tasks'].forEach(d => {
        const btn = document.getElementById(`rtab-${d === 'archived-tasks' ? 'archive' : d}`);
        if (btn) btn.style.opacity = d === dir ? '1' : '0.5';
    });
    await loadReportsPanelFiles(dir);
}

async function loadReportsPanelFiles(dir) {
    const listEl = document.getElementById('reports-panel-list');
    const countEl = document.getElementById('reports-panel-count');
    if (!listEl) return;

    listEl.innerHTML = '<div style="color:var(--text-muted);font-size:13px;padding:16px 0;">Loading…</div>';

    try {
        const result = await window.MissionControlAPI.getFiles(dir);
        const files = result.files || [];

        if (countEl) countEl.textContent = `${files.length} file${files.length !== 1 ? 's' : ''}`;

        if (files.length === 0) {
            listEl.innerHTML = `
            <div style="text-align:center; padding:32px 16px; color:var(--text-muted);">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:10px; opacity:0.3;">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                <p style="margin:0 0 4px; font-weight:500; font-size:13px;">No files in ${DOMPurify.sanitize(dir)}</p>
                <p style="margin:0; font-size:11px;">Reports saved by agents appear here</p>
            </div>`;
            return;
        }

        listEl.innerHTML = files.map(f => {
            const ext = (f.ext || '').replace('.', '').toUpperCase() || 'FILE';
            const size = _formatSize(f.size);
            const date = f.modified ? new Date(f.modified).toLocaleDateString() : '—';
            const safeName = DOMPurify.sanitize(f.name);
            const safePath = DOMPurify.sanitize(f.path);
            return `
            <div style="display:flex; align-items:center; gap:10px; padding:9px 0; border-bottom:1px solid rgba(255,255,255,0.06); cursor:pointer;"
                 onclick="openFileViewer('${DOMPurify.sanitize(dir)}','${safeName}')" title="${safeName}">
                <div style="min-width:36px; height:36px; background:rgba(0,255,65,0.08); border:1px solid rgba(0,255,65,0.2); border-radius:6px; display:flex; align-items:center; justify-content:center; font-size:9px; font-weight:700; color:var(--accent-primary,#4f8ef7); font-family:monospace; flex-shrink:0;">${ext}</div>
                <div style="flex:1; min-width:0;">
                    <div style="font-size:12px; font-weight:500; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${safeName}</div>
                    <div style="font-size:11px; color:var(--text-muted);">${size} · ${date}</div>
                </div>
                <a href="/api/files/${encodeURIComponent(safePath)}?download=true" onclick="event.stopPropagation()"
                   style="color:var(--text-muted); padding:4px; border-radius:4px; hover:background:rgba(255,255,255,0.08);" title="Download" download>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                </a>
            </div>`;
        }).join('');

    } catch (err) {
        listEl.innerHTML = `<div style="color:#e53e3e; font-size:13px; padding:12px 0;">Error: ${DOMPurify.sanitize(err.message)}</div>`;
    }
}

function _formatSize(bytes) {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes/1024).toFixed(1)} KB`;
    return `${(bytes/(1024*1024)).toFixed(1)} MB`;
}
