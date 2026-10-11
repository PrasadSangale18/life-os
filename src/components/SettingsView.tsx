import { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { db } from '../db';
import { supabase, hasSupabase } from '../utils/supabaseClient';
import { syncState, subscribeSync, triggerSync, type SyncStatus, setSyncPrivate, resolveConflict } from '../utils/syncEngine';

export const SettingsView = () => {
  const exportData = useStore(s => s.exportData);
  const importData = useStore(s => s.importData);
  const undoImport = useStore(s => s.undoImport);

  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [backupDate, setBackupDate] = useState<string>(() => {
    const lastBackup = localStorage.getItem('lifeos_last_backup');
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

  useEffect(() => {
    db.snapshots.toArray().then(setSnapshots);
    
    if (hasSupabase) {
      supabase.auth.getSession().then(({ data }: any) => setSession(data.session));
      const { data: authListener } = supabase.auth.onAuthStateChange((event: any, s: any) => {
        setSession(s);
        if (s && event === 'SIGNED_IN') triggerSync();
      });
      return () => authListener.subscription.unsubscribe();
    }
  }, []);

  useEffect(() => {
    return subscribeSync((st) => {
      setStatus(st);
    });
  }, []);

  const handleExport = async () => {
    const data = await exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `life-os-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    const now = Date.now();
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
          alert('Failed to read backup: Invalid file.');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
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
    setAuthStatus('Loading...');
    try {
      const redirectUrl = window.location.origin + import.meta.env.BASE_URL;
      const { error } = await supabase.auth.signInWithOtp({
        email: authEmail,
        options: { emailRedirectTo: redirectUrl }
      });
      if (error) throw error;
      setAuthStatus('Check your email for the login link.');
    } catch (err: any) {
      setAuthStatus(`Error: ${err.message}`);
    }
  };

  const handleSignOutAndClear = async () => {
    if (window.confirm('Sign out and DELETE ALL LOCAL DATA on this device? Ensure you are synced.')) {
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
      if (window.confirm('Stop syncing private items? (Note: existing items on the cloud will stay there unless deleted).')) {
        setIsPrivateSync(false);
        setSyncPrivate(false);
      }
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, padding: 24, color: "#fff", background: "rgba(0,0,0,0.2)", borderRadius: 16 }}>
      <h2>Settings</h2>
      
      {!hasSupabase ? (
        <div style={{ background: "rgba(255,255,255,0.05)", padding: 16, borderRadius: 8 }}>
          <h3 style={{ margin: 0, color: "#a0a0c0" }}>Sync is OFF: data is stored only on this device</h3>
        </div>
      ) : (
        <div style={{ background: "rgba(255,255,255,0.05)", padding: 16, borderRadius: 8 }}>
          <h3>Cloud Sync</h3>
          
          <div style={{ marginBottom: 16 }}>
            Status: <span style={{ fontWeight: 'bold', color: status === 'synced' ? '#00d97e' : status === 'error' ? '#ff4d7e' : '#fbbf24' }}>{status.toUpperCase()}</span>
            {status === 'error' && <button onClick={() => triggerSync()} style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 4, border: '1px solid #fff', background: 'transparent', color: '#fff' }}>Retry</button>}
          </div>

          {!session ? (
            <form onSubmit={handleLogin} style={{ display: 'flex', gap: 8, flexDirection: 'column', maxWidth: 300 }}>
              <input type="email" placeholder="Email for Magic Link" value={authEmail} onChange={e => setAuthEmail(e.target.value)} required style={{ padding: 8, borderRadius: 4, border: '1px solid #444', background: '#000', color: '#fff' }} />
              <button type="submit" style={{ padding: 8, borderRadius: 4, background: '#4d9eff', color: '#000', fontWeight: 'bold', border: 'none' }}>Send Magic Link</button>
              {authStatus && <div style={{ fontSize: 13, color: '#fbbf24' }}>{authStatus}</div>}
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>Signed in as: <strong>{session.user.email}</strong></div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => supabase.auth.signOut()} style={{ padding: '8px 16px', background: 'transparent', color: '#fff', border: '1px solid #fff', borderRadius: 8, cursor: 'pointer' }}>Sign Out</button>
                <button onClick={handleSignOutAndClear} style={{ padding: '8px 16px', background: 'transparent', color: '#ff4d7e', border: '1px solid #ff4d7e', borderRadius: 8, cursor: 'pointer' }}>Sign out and clear this device</button>
              </div>

              <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" id="privateSync" checked={isPrivateSync} onChange={togglePrivateSync} />
                <label htmlFor="privateSync">Sync private items</label>
              </div>

              {syncState.pendingConflictResolution && (
                <div style={{ marginTop: 16, padding: 16, background: "rgba(255,191,36,0.1)", border: "1px solid #fbbf24", borderRadius: 8 }}>
                  <h4 style={{ color: "#fbbf24", margin: "0 0 12px 0" }}>⚠️ Sync Conflict</h4>
                  <p style={{ color: "#e0e0e0", fontSize: 13, marginBottom: 16 }}>
                    This device has {syncState.conflictCounts.local} items, but your cloud account already has {syncState.conflictCounts.remote} items. How would you like to proceed?
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <button onClick={() => { resolveConflict('merge'); setStatus('syncing'); }} style={{ padding: "8px 12px", background: "#fbbf24", color: "#000", border: "none", borderRadius: 6, fontWeight: "bold", cursor: "pointer", textAlign: "left" }}>
                      1. Merge (Recommended)<br/>
                      <span style={{ fontSize: 11, fontWeight: "normal" }}>Combines data from this device and the cloud.</span>
                    </button>
                    <button onClick={() => { resolveConflict('use_cloud'); setStatus('syncing'); }} style={{ padding: "8px 12px", background: "transparent", color: "#fbbf24", border: "1px solid #fbbf24", borderRadius: 6, cursor: "pointer", textAlign: "left" }}>
                      2. Use Cloud Data<br/>
                      <span style={{ fontSize: 11 }}>Wipes this device and downloads cloud data (creates local backup first).</span>
                    </button>
                    <button onClick={() => { resolveConflict('upload'); setStatus('syncing'); }} style={{ padding: "8px 12px", background: "transparent", color: "#fbbf24", border: "1px solid #fbbf24", borderRadius: 6, cursor: "pointer", textAlign: "left" }}>
                      3. Upload Device Data<br/>
                      <span style={{ fontSize: 11 }}>Pushes all local data to the cloud.</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div style={{ background: "rgba(255,255,255,0.05)", padding: 16, borderRadius: 8 }}>
        <h3>Backup & Restore</h3>
        <p style={{ color: "#a0a0c0", marginBottom: 16 }}>Last backup: {backupDate}</p>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={handleExport} style={{ padding: "8px 16px", background: "#4d9eff", color: "#000", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold" }}>Export JSON</button>
          
          <input type="file" accept=".json" style={{ display: "none" }} ref={fileRef} onChange={handleImport} />
          <button onClick={() => fileRef.current?.click()} style={{ padding: "8px 16px", background: "rgba(255,77,126,0.2)", color: "#ff4d7e", border: "1px solid #ff4d7e", borderRadius: 8, cursor: "pointer" }}>Restore from JSON</button>
        </div>

        {pendingRestore && (
          <div style={{ marginTop: 16, padding: 16, background: "rgba(255,77,126,0.1)", border: "1px solid #ff4d7e", borderRadius: 8 }}>
            <h4 style={{ color: "#ff4d7e", marginTop: 0 }}>⚠️ Confirm Restore</h4>
            <p style={{ color: "#e0e0e0", fontSize: 13, marginBottom: 12 }}>This will wipe your current database completely. A local snapshot will be taken before wiping.</p>
            <ul style={{ color: "#a0a0c0", fontSize: 13, marginBottom: 16 }}>
              <li>Total Items in file: {pendingRestore.fileItems}</li>
              <li>Tasks in file: {pendingRestore.fileTasks}</li>
              <li>Notes in file: {pendingRestore.fileNotes}</li>
              <li>Snapshots in file: {pendingRestore.fileBatches}</li>
            </ul>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={confirmRestore} style={{ padding: "6px 12px", background: "#ff4d7e", color: "#000", border: "none", borderRadius: 6, fontWeight: "bold", cursor: "pointer" }}>Wipe and Restore</button>
              <button onClick={() => setPendingRestore(null)} style={{ padding: "6px 12px", background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 6, cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      <div style={{ background: "rgba(255,255,255,0.05)", padding: 16, borderRadius: 8 }}>
        <h3>Automatic Snapshots</h3>
        <p style={{ color: "#a0a0c0", marginBottom: 16 }}>Snapshots are created automatically before every mass import.</p>
        {snapshots.length === 0 ? (
          <p style={{ color: "#666" }}>No snapshots found.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {snapshots.map(s => (
              <li key={s.id} style={{ display: "flex", justifyContent: "space-between", background: "rgba(0,0,0,0.3)", padding: "8px 12px", borderRadius: 6, alignItems: "center" }}>
                <span>Import Batch: {new Date(s.timestamp).toLocaleString()}</span>
                <button onClick={() => handleRestoreSnapshot(s.id)} style={{ padding: "4px 8px", background: "rgba(255,77,126,0.2)", color: "#ff4d7e", border: "1px solid #ff4d7e", borderRadius: 4, cursor: "pointer", fontSize: 12 }}>Undo Batch</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
