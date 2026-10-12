import { useState, useRef, useEffect } from 'react';
import type { User } from '../types';
import { 
  Settings, 
  LogOut, 
  Download, 
  Sparkles, 
  ChevronDown 
} from 'lucide-react';

interface UserProfileMenuProps {
  user: User;
  onSignOut: () => void;
  onOpenSettings: () => void;
  onOpenExport: () => void;
  onOpenPrompt: () => void;
}

export const UserProfileMenu = ({
  user,
  onSignOut,
  onOpenSettings,
  onOpenExport,
  onOpenPrompt
}: UserProfileMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const initials = user.name
    .split(' ')
    .map(n => n.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'PR';

  return (
    <div style={{ position: "relative" }} ref={dropdownRef}>
      {/* Profile Pill matching Prahari Header (media_1791716917550.png) */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          padding: "4px 10px 4px 6px",
          borderRadius: 9999,
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          color: "var(--text-primary)",
          cursor: "pointer",
          transition: "all 0.15s ease",
          boxShadow: "var(--shadow-sm)"
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = "var(--border-strong)";
          e.currentTarget.style.background = "var(--bg-surface-elevated)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = "var(--border-default)";
          e.currentTarget.style.background = "var(--bg-surface)";
        }}
        title="Account & System Profile"
      >
        {/* Avatar Badge */}
        <div 
          style={{
            width: 26,
            height: 26,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
            color: "#ffffff",
            fontSize: 11,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            letterSpacing: "0.02em",
            boxShadow: "0 2px 5px rgba(37, 99, 235, 0.35)",
            flexShrink: 0
          }}
        >
          {initials}
        </div>

        {/* Name & Subtitle */}
        <div style={{ display: "flex", flexDirection: "column", textAlign: "left", lineHeight: 1.15 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap" }}>
            {user.name}
          </span>
          <span style={{ fontSize: 9.5, color: "var(--text-tertiary)", letterSpacing: "-0.01em" }}>
            Life OS Executive
          </span>
        </div>

        <ChevronDown size={12} color="var(--text-tertiary)" style={{ marginLeft: 2 }} />
      </button>

      {/* Floating Dropdown Card matching Prahari (media_1791717165817.png) */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 260,
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
            borderRadius: 14,
            boxShadow: "var(--shadow-modal)",
            zIndex: 90,
            padding: 8,
            display: "flex",
            flexDirection: "column",
            gap: 4,
            animation: "fadeIn 0.15s ease-out"
          }}
        >
          {/* User Details Header */}
          <div 
            style={{
              padding: "10px 12px",
              background: "var(--bg-surface-elevated)",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 4
            }}
          >
            <div 
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                color: "#ffffff",
                fontSize: 13,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}
            >
              {initials}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 650, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user.name}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user.email}
              </div>
              <div 
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 9,
                  fontWeight: 600,
                  padding: "1px 6px",
                  borderRadius: 4,
                  background: "rgba(59, 130, 246, 0.1)",
                  color: "#3b82f6",
                  border: "1px solid rgba(59, 130, 246, 0.2)",
                  marginTop: 4
                }}
              >
                <span>ID: LIFEOS-EXECUTIVE</span>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <button
            type="button"
            onClick={() => { setIsOpen(false); onOpenExport(); }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              padding: "8px 10px",
              borderRadius: 7,
              background: "transparent",
              border: "none",
              color: "var(--text-secondary)",
              fontSize: 12.5,
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.12s ease"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "var(--bg-surface-hover)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            <Download size={14} color="#3b82f6" />
            <span>Export & Data Backup</span>
          </button>

          <button
            type="button"
            onClick={() => { setIsOpen(false); onOpenPrompt(); }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              padding: "8px 10px",
              borderRadius: 7,
              background: "transparent",
              border: "none",
              color: "var(--text-secondary)",
              fontSize: 12.5,
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.12s ease"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "var(--bg-surface-hover)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            <Sparkles size={14} color="#ea580c" />
            <span>Prompt-Wise AI Decomposition</span>
          </button>

          <button
            type="button"
            onClick={() => { setIsOpen(false); onOpenSettings(); }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              padding: "8px 10px",
              borderRadius: 7,
              background: "transparent",
              border: "none",
              color: "var(--text-secondary)",
              fontSize: 12.5,
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.12s ease"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "var(--bg-surface-hover)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            <Settings size={14} color="var(--text-tertiary)" />
            <span>System Settings</span>
          </button>

          <div style={{ height: 1, background: "var(--border-subtle)", margin: "4px 0" }} />

          {/* Secure Sign Out */}
          <button
            type="button"
            onClick={() => { setIsOpen(false); onSignOut(); }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              padding: "8px 10px",
              borderRadius: 7,
              background: "transparent",
              border: "none",
              color: "#f43f5e",
              fontSize: 12.5,
              fontWeight: 500,
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.12s ease"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "rgba(244, 63, 94, 0.08)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <LogOut size={14} />
            <span>Secure Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
};
