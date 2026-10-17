import { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { db } from '../db';
import { supabase, hasSupabase } from '../utils/supabaseClient';
import { syncState, subscribeSync, triggerSync, type SyncStatus, setSyncPrivate, resolveConflict } from '../utils/syncEngine';
import { Settings, Cloud, Database, History, AlertTriangle, Download, Upload, RotateCw, Wifi, WifiOff, Sparkles, ShieldCheck, Lock, CheckCircle2 } from 'lucide-react';

export const SettingsView = () => {
  const exportData = useStore(s => s.exportData);
  const importData = useStore(s => s.importData);
  const undoImport = useStore(s => s.undoImport);
  const seedDefaultData = useStore(s => s.seedDefaultData);

  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [backupDate, setBackupDate] = useState<string>(() => {
    const lastBackup = localStorage.getItem('sankalp_last_backup') || localStorage.getItem('lifeos_last_backup');
    return lastBackup ? new Date(parseInt(lastBackup)).toLocaleString() : 'Never';
  });
  
  const fileRef = useRef<HTMLInputElement>(null);

  const [session, setSession] = useState<any>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authStatus, setAuthStatus] = useState<string>(() => {
    if (typeof window !== 'undefined' && window.location.hash.includes('error_description')) {
      const params = new URLSearchParams(window.location.hash.replace('#', '?'));
      const msg = `Error: ${params.get('error_description')?.replace(/\+/g, ' ')}`;
      window.history.replaceState(null, '', window.location.pathname);
      return msg;
    }
    return '';
  });
  const [status, setStatus] = useState<SyncStatus>('offline');
  const [isPrivateSync, setIsPrivateSync] = useState(syncState.syncPrivate);
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [outboxCount, setOutboxCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState(syncState.lastSyncTime);

  const lastSyncStr = lastSyncTime ? new Date(lastSyncTime).toLocaleString() : 'Never';

  useEffect(() => {
    db.snapshots.toArray().then(setSnapshots);
    db.outbox.count().then(setOutboxCount).catch(() => {});

    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    const timer = setInterval(() => {
      db.outbox.count().then(setOutboxCount).catch(() => {});
      setLastSyncTime(syncState.lastSyncTime);
    }, 2500);

    if (hasSupabase) {
      supabase.auth.getSession().then(({ data }: any) => setSession(data.session));
      const { data: authListener } = supabase.auth.onAuthStateChange((event: any, s: any) => {
        setSession(s);
        if (s && event === 'SIGNED_IN') triggerSync();
      });
      return () => {
        window.removeEventListener('online', onOnline);
        window.removeEventListener('offline', onOffline);
        clearInterval(timer);
        authListener.subscription.unsubscribe();
      };
    }

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    return subscribeSync((st) => {
      setStatus(st);
      db.outbox.count().then(setOutboxCount).catch(() => {});
      setLastSyncTime(syncState.lastSyncTime);
    });
  }, []);

  const handleExport = async () => {
    const data = await exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sankalp-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    const now = Date.now();
    localStorage.setItem('sankalp_last_backup', now.toString());
    localStorage.setItem('lifeos_last_backup', now.toString());
    setBackupDate(new Date(now).toLocaleString());
  };

  const [pendingRestore, setPendingRestore] = useState<any>(null);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      if (ev.target?.result) {
        try {
          const data = JSON.parse(ev.target.result as string);
          if (!data.items) throw new Error();
          setPendingRestore({
            jsonData: ev.target.result as string,
            fileItems: data.items.length,
            fileTasks: data.items.filter((i: any) => i.type === 'task').length,
            fileNotes: data.items.filter((i: any) => i.type === 'note').length,
            fileBatches: data.snapshots?.length || 0
          });
        } catch {
          alert('Failed to read backup: Invalid file format.');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const confirmRestore = async () => {
    if (!pendingRestore) return;
    try {
      await importData(pendingRestore.jsonData);
      alert('Backup restored successfully!');
      setPendingRestore(null);
      db.snapshots.toArray().then(setSnapshots);
    } catch {
      alert('Failed to restore backup: Invalid data.');
    }
  };

  const handleRestoreSnapshot = async (id: string) => {
    if (window.confirm('Undo this batch and move its items to Trash?')) {
      await undoImport(id);
      db.snapshots.toArray().then(setSnapshots);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthStatus('Sending link...');
    try {
      const redirectUrl = window.location.origin + import.meta.env.BASE_URL;
      const { error } = await supabase.auth.signInWithOtp({
        email: authEmail,
        options: { emailRedirectTo: redirectUrl }
      });
      if (error) throw error;
      setAuthStatus('Check your email for the magic sign-in link.');
    } catch (err: any) {
      setAuthStatus(`Error: ${err.message}`);
    }
  };

  const handleSignOutAndClear = async () => {
    if (window.confirm('Sign out and DELETE ALL LOCAL DATA on this device? Ensure your cloud sync is current.')) {
      await db.items.clear();
      await db.outbox.clear();
      await db.snapshots.clear();
      await db.syncMeta.clear();
      await db.store.clear();
      await supabase.auth.signOut();
      window.location.reload();
    }
  };

  const togglePrivateSync = () => {
    const next = !isPrivateSync;
    if (next) {
      if (window.confirm('This will upload all private items to the cloud. Proceed?')) {
        setIsPrivateSync(true);
        setSyncPrivate(true);
      }
    } else {
      if (window.confirm('Stop syncing private items? (Existing items on cloud remain until deleted).')) {
        setIsPrivateSync(false);
        setSyncPrivate(false);
      }
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Settings Header */}
      <div 
        className="glass-panel" 
        style={{ 
          padding: "16px 20px", 
          display: "flex", 
          alignItems: "center", 
          gap: 10,
          background: "var(--bg-surface)"
        }}
      >
        <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Settings size={15} color="var(--text-secondary)" />
        </div>
        <div>
          <div className="card-title" style={{ fontSize: 16 }}>Settings & Storage</div>
          <div className="text-secondary" style={{ fontSize: 12 }}>Manage local IndexedDB database, cloud synchronization, and full backups.</div>
        </div>
      </div>

      {/* Cloud Sync Section */}
      <div className="glass-panel" style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Cloud size={16} color="var(--accent-hover)" />
            <span className="card-title" style={{ fontSize: 15 }}>Cloud Synchronization</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Online / Offline Network Badge */}
            <span 
              className="ui-pill" 
              style={{ 
                color: isOnline ? '#10b981' : '#f59e0b',
                borderColor: isOnline ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)',
                background: isOnline ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
                fontWeight: 500,
                fontSize: 11,
                gap: 5
              }}
            >
              {isOnline ? <Wifi size={11} /> : <WifiOff size={11} />}
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </span>

            {/* Sync State Badge */}
            <span 
              className="ui-pill" 
              style={{ 
                color: status === 'synced' ? '#10b981' : status === 'error' ? '#f43f5e' : status === 'syncing' ? '#3b82f6' : 'var(--text-secondary)',
                borderColor: status === 'synced' ? 'rgba(16,185,129,0.3)' : status === 'error' ? 'rgba(244,63,94,0.3)' : status === 'syncing' ? 'rgba(59,130,246,0.3)' : 'var(--border-subtle)',
                background: status === 'synced' ? 'rgba(16,185,129,0.08)' : status === 'syncing' ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.04)',
                fontWeight: 600,
                fontSize: 11
              }}
            >
              {status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Sync Telemetry Bar */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10, background: "rgba(0,0,0,0.25)", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border-subtle)" }}>
          <div>
            <div className="text-meta" style={{ fontSize: 11 }}>Outbox Queue</div>
            <div style={{ fontSize: 13, fontWeight: 550, color: outboxCount > 0 ? "#f59e0b" : "#10b981", marginTop: 2 }}>
              {outboxCount === 0 ? "0 pending (up to date)" : `${outboxCount} change${outboxCount === 1 ? '' : 's'} queued`}
            </div>
          </div>
          <div>
            <div className="text-meta" style={{ fontSize: 11 }}>Last Cloud Sync</div>
            <div style={{ fontSize: 13, fontWeight: 550, color: "var(--text-primary)", marginTop: 2 }}>
              {lastSyncStr}
            </div>
          </div>
        </div>

        {!hasSupabase ? (
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", borderRadius: 8, padding: 14 }}>
            <div style={{ fontSize: 13.5, color: "var(--text-secondary)" }}>
              Sync is running in <strong style={{ color: "var(--text-primary)" }}>Local-Only Mode</strong>. Your data is stored entirely on this device in IndexedDB. No items, tasks, notes, or telemetry leave this browser. To enable cross-device cloud sync, supply Supabase credentials in your environment.
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {!session ? (
              <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 360 }}>
                <div className="text-secondary" style={{ fontSize: 13 }}>Enter your email to receive a passwordless Magic Link:</div>
                <input 
                  type="email" 
                  placeholder="name@example.com" 
                  value={authEmail} 
                  onChange={e => setAuthEmail(e.target.value)} 
                  required 
                  className="ui-input"
                />
                <button type="submit" className="btn-primary" style={{ padding: "9px 16px" }}>
                  Send Magic Link
                </button>
                {authStatus && <div style={{ fontSize: 12, color: "#f59e0b" }}>{authStatus}</div>}
              </form>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                  Signed in as: <strong style={{ color: "var(--text-primary)" }}>{session.user.email}</strong>
                </div>
                
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button onClick={() => triggerSync()} className="btn-secondary" style={{ gap: 6, fontSize: 12 }}>
                    <RotateCw size={13} />
                    <span>Sync Now</span>
                  </button>
                  <button onClick={() => supabase.auth.signOut()} className="btn-ghost" style={{ fontSize: 12 }}>
                    Sign Out
                  </button>
                  <button onClick={handleSignOutAndClear} className="btn-danger" style={{ fontSize: 12 }}>
                    Sign Out & Clear Device
                  </button>
                </div>

                <div style={{ marginTop: 6, padding: "12px 14px", background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid var(--border-subtle)" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-primary)", cursor: "pointer", fontWeight: 500 }}>
                    <input type="checkbox" checked={isPrivateSync} onChange={togglePrivateSync} style={{ accentColor: "var(--accent-primary)" }} />
                    <span>Sync private items to cloud account</span>
                  </label>
                  <p style={{ margin: "6px 0 0 24px", fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.45 }}>
                    {isPrivateSync
                      ? "Enabled: Items marked 'Private' will be uploaded and synchronized to your personal Supabase account."
                      : "Disabled: Items marked 'Private' remain strictly local on this device and are never sent to the cloud."}
                  </p>
                </div>

                {syncState.pendingConflictResolution && (
                  <div style={{ marginTop: 12, padding: 16, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#f59e0b", fontWeight: 600, fontSize: 14 }}>
                      <AlertTriangle size={16} />
                      <span>Sync Conflict Detected</span>
                    </div>
                    <p style={{ color: "var(--text-secondary)", fontSize: 13, margin: "8px 0 14px 0" }}>
                      This device has {syncState.conflictCounts.local} items, while your cloud account has {syncState.conflictCounts.remote} items. Choose how to synchronize:
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <button onClick={() => { resolveConflict('merge'); setStatus('syncing'); }} className="btn-primary" style={{ textAlign: "left", padding: "10px 14px", display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ fontWeight: 600 }}>Merge (Recommended)</span>
                        <span style={{ fontSize: 12, opacity: 0.85, fontWeight: 400 }}>Combines local and cloud records seamlessly using newest timestamp priority without deleting items.</span>
                      </button>
                      <button onClick={() => { resolveConflict('use_cloud'); setStatus('syncing'); }} className="btn-secondary" style={{ textAlign: "left", padding: "10px 14px", display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ fontWeight: 600 }}>Keep Cloud Data</span>
                        <span style={{ fontSize: 12, opacity: 0.85, fontWeight: 400 }}>Saves a safety snapshot of current local data to Dexie, then replaces local workspace with cloud records.</span>
                      </button>
                      <button onClick={() => { resolveConflict('upload'); setStatus('syncing'); }} className="btn-secondary" style={{ textAlign: "left", padding: "10px 14px", display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ fontWeight: 600 }}>Upload Local Changes</span>
                        <span style={{ fontSize: 12, opacity: 0.85, fontWeight: 400 }}>Queues all local workspace items to sync to your cloud account without deleting existing cloud records.</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Backup & Restore Section */}
      <div className="glass-panel" style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Database size={16} color="#10b981" />
          <span className="card-title" style={{ fontSize: 15 }}>Full Backup & Restore</span>
        </div>

        <div className="text-secondary" style={{ fontSize: 13 }}>
          Export your entire SANKALP workspace (tasks, notes, tags, metadata) to a standalone portable JSON file.
        </div>
        <div className="text-meta" style={{ fontSize: 11 }}>
          Last backup: {backupDate}
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
          <button onClick={handleExport} className="btn-primary" style={{ gap: 6 }}>
            <Download size={14} />
            <span>Export Workspace JSON</span>
          </button>
          
          <input type="file" accept=".json" style={{ display: "none" }} ref={fileRef} onChange={handleImport} />
          <button onClick={() => fileRef.current?.click()} className="btn-secondary" style={{ gap: 6 }}>
            <Upload size={14} />
            <span>Restore from JSON File</span>
          </button>

          <button 
            onClick={async () => {
              if (window.confirm("Seed default SANKALP dataset (Prasad's authentic tasks & notes)? This will merge with your current items.")) {
                await seedDefaultData();
                alert("Seeded default SANKALP dataset successfully!");
              }
            }} 
            className="btn-secondary" 
            style={{ gap: 6, borderColor: "rgba(0, 217, 126, 0.35)", color: "#00d97e" }}
          >
            <Sparkles size={14} color="#00d97e" />
            <span>Load Prasad's SANKALP Data</span>
          </button>
        </div>

        {pendingRestore && (
          <div style={{ marginTop: 12, padding: 16, background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.3)", borderRadius: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#f43f5e", fontWeight: 600, fontSize: 14 }}>
              <AlertTriangle size={16} />
              <span>Confirm Database Overwrite</span>
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: 13, margin: "8px 0 12px 0" }}>
              Restoring will replace current items. A safety snapshot will be created automatically prior to wiping.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 14 }}>
              <div style={{ background: "rgba(0,0,0,0.3)", padding: "6px 10px", borderRadius: 6, fontSize: 12 }}>
                <span className="text-tertiary">Total Items:</span> <strong style={{ color: "#fff" }}>{pendingRestore.fileItems}</strong>
              </div>
              <div style={{ background: "rgba(0,0,0,0.3)", padding: "6px 10px", borderRadius: 6, fontSize: 12 }}>
                <span className="text-tertiary">Tasks:</span> <strong style={{ color: "#fff" }}>{pendingRestore.fileTasks}</strong>
              </div>
              <div style={{ background: "rgba(0,0,0,0.3)", padding: "6px 10px", borderRadius: 6, fontSize: 12 }}>
                <span className="text-tertiary">Notes:</span> <strong style={{ color: "#fff" }}>{pendingRestore.fileNotes}</strong>
              </div>
              <div style={{ background: "rgba(0,0,0,0.3)", padding: "6px 10px", borderRadius: 6, fontSize: 12 }}>
                <span className="text-tertiary">Batches:</span> <strong style={{ color: "#fff" }}>{pendingRestore.fileBatches}</strong>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={confirmRestore} className="btn-danger" style={{ padding: "8px 16px", fontWeight: 600 }}>
                Wipe and Restore
              </button>
              <button onClick={() => setPendingRestore(null)} className="btn-ghost">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Automatic Snapshots Section */}
      <div className="glass-panel" style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <History size={16} color="#a855f7" />
          <span className="card-title" style={{ fontSize: 15 }}>Automatic Snapshots</span>
        </div>
        <div className="text-secondary" style={{ fontSize: 13 }}>
          Snapshots are captured automatically before every batch import and restore operation.
        </div>

        {snapshots.length === 0 ? (
          <div style={{ color: "var(--text-tertiary)", fontSize: 13, padding: "12px 0" }}>
            No snapshots recorded yet.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {snapshots.map(s => (
              <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", padding: "10px 14px", borderRadius: 8 }}>
                <div>
                  <div style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>Import Batch Snapshot</div>
                  <div className="text-meta" style={{ fontSize: 11, marginTop: 2 }}>{new Date(s.timestamp).toLocaleString()}</div>
                </div>
                <button onClick={() => handleRestoreSnapshot(s.id)} className="btn-danger" style={{ fontSize: 11.5, padding: "4px 10px" }}>
                  Undo Batch
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Data Sovereignty, Privacy & Security Posture */}
      <div className="glass-panel" style={{ padding: "22px 26px", display: "flex", flexDirection: "column", gap: 16, border: "1px solid rgba(16, 185, 129, 0.25)", background: "linear-gradient(180deg, rgba(16, 185, 129, 0.03) 0%, var(--bg-surface) 100%)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(16, 185, 129, 0.12)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ShieldCheck size={18} />
            </div>
            <div>
              <div className="card-title" style={{ fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
                <span>Data Sovereignty, Privacy & Security Architecture</span>
                <span className="ui-pill" style={{ fontSize: 10, color: "#10b981", borderColor: "rgba(16, 185, 129, 0.3)" }}>
                  Zero-Telemetry
                </span>
              </div>
              <div className="text-secondary" style={{ fontSize: 12 }}>
                SANKALP is engineered with a strict local-first, privacy-by-design architectural guarantee.
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-tertiary)", fontSize: 11, fontFamily: "var(--font-mono)" }}>
            <Lock size={12} color="#10b981" />
            <span>ENCRYPTED IN TRANSIT & LOCAL AT REST</span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          <div style={{ padding: "14px 16px", borderRadius: 10, background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 650, color: "var(--text-primary)" }}>
              <CheckCircle2 size={14} color="#10b981" />
              <span>100% Client-Side Storage</span>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
              All database records (tasks, notes, pillars, Eisenhower matrix classifications) reside directly in your browser's IndexedDB via Dexie. No data leaves your machine without explicit consent.
            </p>
          </div>

          <div style={{ padding: "14px 16px", borderRadius: 10, background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 650, color: "var(--text-primary)" }}>
              <CheckCircle2 size={14} color="#10b981" />
              <span>Zero Tracking & Ad Pixels</span>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
              SANKALP contains 0 Google Analytics, 0 Facebook pixels, and 0 third-party telemetry beacons. Your thoughts and daily routines remain strictly private.
            </p>
          </div>

          <div style={{ padding: "14px 16px", borderRadius: 10, background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 650, color: "var(--text-primary)" }}>
              <CheckCircle2 size={14} color="#10b981" />
              <span>Row-Level Security (RLS)</span>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
              When cloud sync is active, cross-device communications use TLS 1.3 cryptographic pipes with Supabase Postgres Row-Level Security, preventing unauthorized cross-tenant data access.
            </p>
          </div>

          <div style={{ padding: "14px 16px", borderRadius: 10, background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 650, color: "var(--text-primary)" }}>
              <CheckCircle2 size={14} color="#10b981" />
              <span>Hardened HTTP Headers</span>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Protected against clickjacking and MIME-sniffing with Strict-Transport-Security (HSTS 2-year preload), X-Frame-Options: DENY, and restricted browser hardware permissions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
