'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/app/providers/AuthProvider';
import { foldersApi, Folder, BreadcrumbItem} from '@/app/lib/folders';
import { filesApi, DriveFile } from '@/app/lib/files';
import { trashApi } from '@/app/lib/folders';
import { searchApi, SearchResults } from '@/app/lib/search';
import { storageApi, StorageUsage } from '@/app/lib/storage';
import { shareApi } from '@/app/lib/share';
import { starsApi } from '@/app/lib/stars';
import { useUpload } from '@/hooks/useUpload';
import { UploadDropzone } from '@/components/UploadDropzone';
import { UploadQueue } from '@/components/UploadQueue';
import { InlineRename } from '@/components/InlineRename';
import { FilePreview } from '@/components/FilePreview';
import { AppLogo } from '@/components/AppLogo';
import { DragDropGrid, DraggableItem, DroppableFolder } from '@/components/DragDropGrid';
import { MimeTypeIcon } from '@/app/lib/mime-type-icon';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconButton } from '@/components/ui/icon-button';
import {
  Folder as FolderIcon,
  Star,
  Clock,
  Trash2,
  MoreVertical,
  Pencil,
  Trash,
  Link2,
  Search as SearchIcon,
  Menu,
  LogOut,
  Loader2,
  FolderOpen,
  ChevronRight,
  X,
  Square,
  CheckSquare,
  Move,
  Settings,
} from 'lucide-react';

import { bulkApi } from '@/app/lib/bulk';
import { profileApi, UserProfile } from '@/app/lib/profile';

const STAGGER_CONTAINER = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.055, delayChildren: 0.03 },
  },
};

const STAGGER_ITEM = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 380, damping: 28 },
  },
};

const MENU_PANEL =
  'elevated-popover absolute z-10 min-w-[148px] rounded-xl border border-white/12 bg-surface-elevated/90 py-1 shadow-2xl backdrop-blur-2xl';
const MENU_ITEM = 'flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-foreground transition-colors hover:bg-white/10';
const MENU_ITEM_DANGER = `${MENU_ITEM} text-red-400 hover:bg-red-500/15`;

function formatBytes(bytes: number): string {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3)   return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}

// ── Share Modal ───────────────────────────────────────────────
function ShareModal({
  file,
  onClose,
}: {
  file: DriveFile;
  onClose: () => void;
}) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const result = await shareApi.create(file.id);
      const fullUrl = `${window.location.origin}${result.shareUrl}`;
      setShareUrl(fullUrl);
    } catch {
      alert('Failed to create share link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Modal open={true} onClose={onClose} title="Share file" panelClassName="max-w-md">
      <div className="px-6 py-5 space-y-5">
        <div className="flex items-center gap-3 rounded-xl border border-white/12 bg-white/[0.04] p-3 backdrop-blur-md">
          <MimeTypeIcon mimeType={file.mime_type} size={36} className="text-primary" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
            <p className="text-xs text-muted">{formatBytes(file.size_bytes)}</p>
          </div>
        </div>

        {!shareUrl ? (
          <Button className="w-full" onClick={handleCreate} disabled={loading}>
            {loading ? (
              <Loader2 className="size-4 animate-spin" strokeWidth={1.5} />
            ) : (
              <Link2 className="size-4" strokeWidth={1.5} />
            )}
            Generate share link
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={shareUrl}
                className="min-w-0 flex-1 rounded-lg border border-white/12 bg-white/[0.04] px-3 py-2 text-xs text-foreground outline-none backdrop-blur-sm"
              />
              <Button type="button" size="sm" variant="primary" onClick={handleCopy} className="shrink-0">
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <p className="text-center text-xs text-muted">
              Link expires in 7 days. Anyone with this link can download the file.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ── Storage Bar ───────────────────────────────────────────────
function StorageBar() {
  const { data } = useQuery({
    queryKey: ['storage'],
    queryFn: storageApi.getUsage,
    staleTime: 60_000,
  });

  if (!data) return null;

  const pct = Math.min(data.percentUsed, 100);
  const barTint =
    data.percentUsed > 90
      ? 'from-red-400 to-rose-500'
      : data.percentUsed > 70
        ? 'from-amber-400 to-orange-500'
        : 'from-[var(--primary-from)] to-[var(--primary-to)]';

  return (
    <div className="glow-border mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          Storage
        </span>
        <span className="bg-gradient-to-r from-[var(--primary-from)] to-[var(--primary-to)] bg-clip-text text-sm font-semibold tabular-nums text-transparent">
          {data.percentUsed.toFixed(1)}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${barTint}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
        />
      </div>
      <p className="mt-2 text-xs text-muted">
        <span className="text-foreground/90">{formatBytes(data.usedBytes)}</span>
        {' · '}
        {formatBytes(data.limitBytes)} total
      </p>
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────
type SidebarView = 'drive' | 'trash' | 'starred' | 'recent' | 'settings';

function Sidebar({
  activeView,
  onViewChange,
}: {
  activeView: SidebarView;
  onViewChange: (v: SidebarView) => void;
}) {
  const { logout, user } = useAuth();

  const navItems: { Icon: typeof FolderIcon; label: string; view: SidebarView }[] = [
    { Icon: FolderIcon, label: 'My Drive', view: 'drive' },
    { Icon: Star, label: 'Starred', view: 'starred' },
    { Icon: Clock, label: 'Recent', view: 'recent' },
    { Icon: Trash2, label: 'Trash', view: 'trash' },
  ];

  return (
    <aside className="glass-panel flex h-full w-64 shrink-0 flex-col rounded-none border-0 px-4 py-6 shadow-none md:my-4 md:ml-4 md:h-[calc(100vh-2rem)] md:rounded-2xl md:border md:border-white/10 md:shadow-2xl">
      <div className="mb-7 px-0">
        <AppLogo />
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map(({ Icon, label, view }) => {
          const active = activeView === view;
          return (
            <button
              key={view}
              type="button"
              onClick={() => onViewChange(view)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-200
                ${active
                  ? 'bg-gradient-to-r from-[var(--primary-from)]/18 to-[var(--primary-to)]/12 text-foreground shadow-[0_0_0_1px_rgba(255,255,255,0.08)]'
                  : 'text-muted hover:bg-white/[0.06] hover:text-foreground'
                }`}
            >
              <Icon
                className={`size-5 shrink-0 transition-transform ${active ? 'scale-105 text-primary' : ''}`}
                strokeWidth={1.5}
              />
              <span className="tracking-tight">{label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-2 mb-4 px-2">
        <button
          type="button"
          onClick={() => onViewChange('settings')}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-200
            ${activeView === 'settings'
              ? 'bg-gradient-to-r from-[var(--primary-from)]/18 to-[var(--primary-to)]/12 text-foreground shadow-[0_0_0_1px_rgba(255,255,255,0.08)]'
              : 'text-muted hover:bg-white/[0.06] hover:text-foreground'
            }`}
        >
          <Settings
            className={`size-5 shrink-0 transition-transform ${activeView === 'settings' ? 'scale-105 text-primary' : ''}`}
            strokeWidth={1.5}
          />
          <span className="tracking-tight">Settings</span>
        </button>
      </div>

      <StorageBar />

      <div className="mt-4 border-t border-white/10 pt-4">
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-2.5 backdrop-blur-sm">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--primary-from)] to-[var(--primary-to)] text-sm font-bold text-primary-foreground shadow-lg shadow-indigo-500/20">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <span className="flex-1 truncate text-sm font-medium tracking-tight text-foreground">{user?.name}</span>
          <IconButton label="Sign out" onClick={logout} className="shrink-0 text-muted hover:text-foreground">
            <LogOut className="size-4" strokeWidth={1.5} />
          </IconButton>
        </div>
      </div>
    </aside>
  );
}

// ── Breadcrumbs ───────────────────────────────────────────────
function Breadcrumbs({
  path,
  onNavigate,
}: {
  path: BreadcrumbItem[];
  onNavigate: (folderId: string | null) => void;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-1 text-sm">
      <button
        type="button"
        onClick={() => onNavigate(null)}
        className="font-medium tracking-tight text-primary hover:underline"
      >
        My Drive
      </button>
      {path.map((item, i) => (
        <span key={item.id} className="flex items-center gap-1">
          <ChevronRight className="size-3.5 text-muted" strokeWidth={1.5} aria-hidden />
          <button
            type="button"
            onClick={() => onNavigate(item.id)}
            className={`tracking-tight ${
              i === path.length - 1
                ? 'font-medium text-foreground'
                : 'text-primary hover:underline'
            }`}
          >
            {item.name}
          </button>
        </span>
      ))}
    </div>
  );
}

// ── Folder Card ───────────────────────────────────────────────
// Multi-select props explained:
//   selected      — is this card currently in the selection set?
//   onToggleSelect — flip this card in/out of the selection
//   showSelect    — true when ANY card is selected (shows checkbox on all cards)
function FolderCard({
  folder,
  onOpen,
  onRename,
  onDelete,
  isStarred,
  onToggleStar,
  canWrite,
  canDelete,
  selected = false,
  onToggleSelect,
  showSelect = false,
}: {
  folder: Folder;
  onOpen: () => void;
  onRename: (name: string) => Promise<void>;
  onDelete: () => void;
  isStarred: boolean;
  onToggleStar: () => void;
  canWrite: boolean;
  canDelete: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  showSelect?: boolean;
}) {
  const [renaming, setRenaming] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  return (
    <Card
      interactive
      className={`group relative flex min-h-[84px] select-none flex-row items-center gap-4 px-4 py-3 ${selected ? 'ring-2 ring-primary/60' : ''}`}
      onDoubleClick={onOpen}
    >
      {/* Multi-select checkbox: visible when any item is selected, or on hover */}
      {onToggleSelect && (
        <button
          type="button"
          className={`absolute left-2 bottom-2 z-20 text-muted transition-opacity ${
            showSelect || selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
          onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}
          aria-label={selected ? 'Deselect' : 'Select'}
        >
          {selected
            ? <CheckSquare className="size-4 text-primary" strokeWidth={1.5} />
            : <Square className="size-4" strokeWidth={1.5} />
          }
        </button>
      )}
      <IconButton
        label={isStarred ? 'Remove star' : 'Star'}
        className={`absolute left-2 top-2 z-20 ${isStarred ? 'text-amber-400' : 'text-muted opacity-0 group-hover:opacity-100'}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggleStar();
        }}
      >
        <Star className={`size-4 ${isStarred ? 'fill-amber-400' : ''}`} strokeWidth={1.5} />
      </IconButton>
      <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--primary-from)]/25 to-[var(--primary-to)]/20 ring-1 ring-white/10">
        <FolderIcon className="size-7 text-primary" strokeWidth={1.5} />
      </div>

      <div className="min-w-0 flex-1 pr-6">
        {renaming ? (
          <InlineRename
            initialName={folder.name}
            onSave={async (name) => { await onRename(name); setRenaming(false); }}
            onCancel={() => setRenaming(false)}
          />
        ) : (
          <>
            <span className="line-clamp-2 text-sm font-medium tracking-tight text-foreground">
              {folder.name}
            </span>
            <span className="mt-0.5 block text-[11px] text-muted">Folder</span>
          </>
        )}
      </div>

      <IconButton
        label="More actions"
        className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
        onClick={(e) => { e.stopPropagation(); setShowMenu(v => !v); }}
      >
        <MoreVertical className="size-4" strokeWidth={1.5} />
      </IconButton>

      {showMenu && (canWrite || canDelete) && (
        <div
          className={`${MENU_PANEL} right-2 top-12`}
          onMouseLeave={() => setShowMenu(false)}
        >
          {canWrite && (
            <button
              type="button"
              className={MENU_ITEM}
              onClick={(e) => {
                e.stopPropagation();
                setRenaming(true);
                setShowMenu(false);
              }}
            >
              <Pencil className="size-3.5" strokeWidth={1.5} /> Rename
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              className={MENU_ITEM_DANGER}
              onClick={(e) => { e.stopPropagation(); onDelete(); setShowMenu(false); }}
            >
              <Trash className="size-3.5" strokeWidth={1.5} /> Delete
            </button>
          )}
        </div>
      )}
    </Card>
  );
}

// ── File Card ─────────────────────────────────────────────────
function FileCard({
  file,
  onDownload,
  onRename,
  onDelete,
  onShare,
  isStarred,
  onToggleStar,
  canWrite,
  canDelete,
  showShare,
  selected = false,
  onToggleSelect,
  showSelect = false,
}: {
  file: DriveFile;
  onDownload: () => void;
  onRename: (name: string) => Promise<void>;
  onDelete: () => void;
  onShare: () => void;
  isStarred: boolean;
  onToggleStar: () => void;
  canWrite: boolean;
  canDelete: boolean;
  showShare: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  showSelect?: boolean;
}) {
  const [renaming, setRenaming] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  return (
    <Card
      interactive
      className={`group relative flex min-h-[196px] cursor-pointer select-none flex-col overflow-hidden p-0 ${selected ? 'ring-2 ring-primary/60' : ''}`}
      onClick={onDownload}
    >
      {/* Multi-select checkbox */}
      {onToggleSelect && (
        <button
          type="button"
          className={`absolute left-2 bottom-2 z-20 text-muted transition-opacity ${
            showSelect || selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
          onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}
          aria-label={selected ? 'Deselect' : 'Select'}
        >
          {selected
            ? <CheckSquare className="size-4 text-primary" strokeWidth={1.5} />
            : <Square className="size-4" strokeWidth={1.5} />
          }
        </button>
      )}
      <IconButton
        label={isStarred ? 'Remove star' : 'Star'}
        className={`absolute left-2 top-2 z-20 ${isStarred ? 'text-amber-400' : 'text-muted opacity-0 group-hover:opacity-100'}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggleStar();
        }}
      >
        <Star className={`size-4 ${isStarred ? 'fill-amber-400' : ''}`} strokeWidth={1.5} />
      </IconButton>

      <div className="flex flex-1 items-center justify-center bg-white/[0.04] px-3 pb-2 pt-8">
        <MimeTypeIcon mimeType={file.mime_type} size={48} />
      </div>

      <div className="space-y-0.5 border-t border-white/10 px-3 py-3">
        {renaming ? (
          <InlineRename
            initialName={file.name}
            onSave={async (name) => { await onRename(name); setRenaming(false); }}
            onCancel={() => setRenaming(false)}
          />
        ) : (
          <span className="line-clamp-2 text-xs font-medium tracking-tight text-foreground">
            {file.name}
          </span>
        )}
        <span className="text-[11px] text-muted">{formatBytes(file.size_bytes)}</span>
      </div>

      <IconButton
        label="More actions"
        className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
        onClick={(e) => { e.stopPropagation(); setShowMenu(v => !v); }}
      >
        <MoreVertical className="size-4" strokeWidth={1.5} />
      </IconButton>

      {showMenu && (canWrite || showShare || canDelete) && (
        <div
          className={`${MENU_PANEL} right-2 top-11`}
          onMouseLeave={() => setShowMenu(false)}
        >
          {canWrite && (
            <button
              type="button"
              className={MENU_ITEM}
              onClick={(e) => {
                e.stopPropagation();
                setRenaming(true);
                setShowMenu(false);
              }}
            >
              <Pencil className="size-3.5" strokeWidth={1.5} /> Rename
            </button>
          )}
          {showShare && (
            <button
              type="button"
              className={MENU_ITEM}
              onClick={(e) => {
                e.stopPropagation();
                onShare();
                setShowMenu(false);
              }}
            >
              <Link2 className="size-3.5" strokeWidth={1.5} /> Share
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              className={MENU_ITEM_DANGER}
              onClick={(e) => { e.stopPropagation(); onDelete(); setShowMenu(false); }}
            >
              <Trash className="size-3.5" strokeWidth={1.5} /> Delete
            </button>
          )}
        </div>
      )}
    </Card>
  );
}

// ── Search Results View ───────────────────────────────────────
function SearchResultsView({
  results,
  onNavigateFolder,
  onDownloadFile,
  onClearSearch,
}: {
  results: SearchResults;
  onNavigateFolder: (id: string) => void;
  onDownloadFile: (file: DriveFile) => void;
  onClearSearch: () => void;
}) {
  const isEmpty = results.files.length === 0 && results.folders.length === 0;

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          Search results for &ldquo;{results.query}&rdquo;
        </h2>
        <Button type="button" variant="ghost" size="sm" onClick={onClearSearch} className="gap-1">
          <X className="size-3.5" strokeWidth={1.5} /> Clear
        </Button>
      </div>

      {isEmpty ? (
        <div className="relative overflow-hidden rounded-2xl border border-white/10 py-20">
          <div className="empty-state-blobs" aria-hidden>
            <span />
            <span />
            <span />
          </div>
          <div className="relative z-[1] flex flex-col items-center text-muted">
            <SearchIcon className="mb-4 size-14 text-primary/80" strokeWidth={1.5} />
            <p className="font-semibold tracking-tight text-foreground">No results found</p>
            <p className="mt-1 text-sm">Try a different search term</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {results.folders.length > 0 && (
            <div>
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted">
                Folders ({results.folders.length})
              </h3>
              <motion.div
                variants={STAGGER_CONTAINER}
                initial="hidden"
                animate="show"
                className="grid gap-3 md:grid-cols-2"
              >
                {results.folders.map(folder => (
                  <motion.div key={folder.id} variants={STAGGER_ITEM}>
                    <Card
                      interactive
                      className="flex min-h-[76px] cursor-pointer flex-row items-center gap-4 px-4 py-3"
                      onClick={() => onNavigateFolder(folder.id)}
                    >
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--primary-from)]/25 to-[var(--primary-to)]/20 ring-1 ring-white/10">
                        <FolderIcon className="size-6 text-primary" strokeWidth={1.5} />
                      </div>
                      <span className="line-clamp-2 min-w-0 flex-1 text-sm font-medium tracking-tight text-foreground">
                        {folder.name}
                      </span>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          )}

          {results.files.length > 0 && (
            <div>
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted">
                Files ({results.files.length})
              </h3>
              <motion.div
                variants={STAGGER_CONTAINER}
                initial="hidden"
                animate="show"
                className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
              >
                {results.files.map(file => (
                  <motion.div key={file.id} variants={STAGGER_ITEM}>
                    <Card
                      interactive
                      className="flex min-h-[180px] cursor-pointer select-none flex-col overflow-hidden p-0"
                      onClick={() => onDownloadFile(file)}
                    >
                      <div className="flex flex-1 items-center justify-center bg-white/[0.04] px-3 pb-2 pt-8">
                        <MimeTypeIcon mimeType={file.mime_type} size={44} />
                      </div>
                      <div className="space-y-0.5 border-t border-white/10 px-3 py-3">
                        <span className="line-clamp-2 text-xs font-medium tracking-tight text-foreground">
                          {file.name}
                        </span>
                        <span className="text-[11px] text-muted">{formatBytes(file.size_bytes)}</span>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Starred / Recent (sidebar views) ──────────────────────────
function StarredGridView({
  onOpenFolder,
}: {
  onOpenFolder: (id: string) => void;
}) {
  const queryClient = useQueryClient();
  const [previewFile, setPreviewFile] = useState<{ file: DriveFile; url: string } | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ['stars'],
    queryFn: starsApi.list,
  });

  const openFile = async (file: DriveFile) => {
    const url = await filesApi.getSignedUrl(file.id);
    const previewable =
      file.mime_type.startsWith('image/') ||
      file.mime_type.startsWith('video/') ||
      file.mime_type.startsWith('audio/') ||
      file.mime_type === 'application/pdf';
    if (previewable) setPreviewFile({ file, url });
    else window.open(url, '_blank');
  };

  const toggleStar = useMutation({
    mutationFn: async (p: { type: 'file' | 'folder'; id: string }) => {
      await starsApi.unstar(p.type, p.id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stars'] }),
  });

  const starredSet = useMemo(() => {
    const s = new Set<string>();
    data?.files.forEach((f) => s.add(`file:${f.id}`));
    data?.folders.forEach((f) => s.add(`folder:${f.id}`));
    return s;
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex-1 p-6">
        <div className="space-y-6">
          <div className="grid gap-3 md:grid-cols-2">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-white/10" />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-xl bg-white/10" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const empty = (data?.folders.length ?? 0) === 0 && (data?.files.length ?? 0) === 0;

  return (
    <div className="flex-1 overflow-auto p-6">
      <h2 className="mb-6 text-xl font-semibold tracking-tight text-foreground">Starred</h2>
      {empty ? (
        <div className="relative overflow-hidden rounded-2xl border border-white/10 py-24">
          <div className="empty-state-blobs" aria-hidden>
            <span />
            <span />
            <span />
          </div>
          <div className="relative z-[1] flex flex-col items-center text-center text-muted">
            <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-amber-500/15 ring-1 ring-amber-400/25">
              <Star className="size-8 text-amber-400" strokeWidth={1.5} />
            </div>
            <p className="text-lg font-semibold tracking-tight text-foreground">No starred items</p>
            <p className="mt-2 max-w-sm text-sm">Star files and folders from My Drive.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {(data?.folders.length ?? 0) > 0 && (
            <div>
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted">Folders</h3>
              <motion.div
                variants={STAGGER_CONTAINER}
                initial="hidden"
                animate="show"
                className="grid gap-3 md:grid-cols-2"
              >
                {data?.folders.map((folder) => (
                  <motion.div key={folder.id} variants={STAGGER_ITEM} layout>
                    <FolderCard
                      folder={folder}
                      onOpen={() => onOpenFolder(folder.id)}
                      onRename={async () => {}}
                      onDelete={() => {}}
                      isStarred={starredSet.has(`folder:${folder.id}`)}
                      onToggleStar={() => toggleStar.mutate({ type: 'folder', id: folder.id })}
                      canWrite={false}
                      canDelete={false}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </div>
          )}
          {(data?.files.length ?? 0) > 0 && (
            <div>
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted">Files</h3>
              <motion.div
                variants={STAGGER_CONTAINER}
                initial="hidden"
                animate="show"
                className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
              >
                {data?.files.map((file) => (
                  <motion.div key={file.id} variants={STAGGER_ITEM} layout>
                    <FileCard
                      file={file}
                      onDownload={() => openFile(file)}
                      onRename={async () => {}}
                      onDelete={() => {}}
                      onShare={() => {}}
                      isStarred={starredSet.has(`file:${file.id}`)}
                      onToggleStar={() => toggleStar.mutate({ type: 'file', id: file.id })}
                      canWrite={false}
                      canDelete={false}
                      showShare={false}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </div>
          )}
        </div>
      )}
      {previewFile && (
        <FilePreview
          file={{
            name: previewFile.file.name,
            mimeType: previewFile.file.mime_type,
            sizeBytes: previewFile.file.size_bytes,
          }}
          downloadUrl={previewFile.url}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
}

function RecentListView() {
  const [previewFile, setPreviewFile] = useState<{ file: DriveFile; url: string } | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ['files', 'recent'],
    queryFn: () => filesApi.recent(50),
  });

  if (isLoading) {
    return (
      <div className="flex-1 space-y-2 p-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-xl bg-white/10" />
        ))}
      </div>
    );
  }

  const empty = !data?.length;

  const openFile = async (file: DriveFile) => {
    const url = await filesApi.getSignedUrl(file.id);
    const previewable =
      file.mime_type.startsWith('image/') ||
      file.mime_type.startsWith('video/') ||
      file.mime_type.startsWith('audio/') ||
      file.mime_type === 'application/pdf';
    if (previewable) setPreviewFile({ file, url });
    else window.open(url, '_blank');
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      <h2 className="mb-6 text-xl font-semibold tracking-tight text-foreground">Recent</h2>
      {empty ? (
        <div className="relative overflow-hidden rounded-2xl border border-white/10 py-24">
          <div className="empty-state-blobs" aria-hidden>
            <span />
            <span />
            <span />
          </div>
          <div className="relative z-[1] flex flex-col items-center text-muted">
            <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-white/[0.06] ring-1 ring-white/10">
              <Clock className="size-8 text-primary" strokeWidth={1.5} />
            </div>
            <p className="text-lg font-semibold tracking-tight text-foreground">No recent files</p>
          </div>
        </div>
      ) : (
        <motion.div
          variants={STAGGER_CONTAINER}
          initial="hidden"
          animate="show"
          className="space-y-2"
        >
          {data?.map((file) => (
            <motion.div key={file.id} variants={STAGGER_ITEM}>
              <button
                type="button"
                onClick={() => openFile(file)}
                className="elevated-popover flex w-full items-center gap-3 rounded-xl border border-white/10 bg-surface-elevated/80 p-3 text-left shadow-sm backdrop-blur-md transition-colors hover:border-[var(--primary-from)]/35"
              >
                <MimeTypeIcon mimeType={file.mime_type} size={28} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium tracking-tight text-foreground">{file.name}</p>
                  <p className="text-xs text-muted">{formatBytes(file.size_bytes)}</p>
                </div>
              </button>
            </motion.div>
          ))}
        </motion.div>
      )}
      {previewFile && (
        <FilePreview
          file={{
            name: previewFile.file.name,
            mimeType: previewFile.file.mime_type,
            sizeBytes: previewFile.file.size_bytes,
          }}
          downloadUrl={previewFile.url}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
}

// ── Settings View ─────────────────────────────────────────────
function SettingsView() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [name, setName] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');

  useEffect(() => {
    profileApi.getProfile().then(data => {
      setProfileData(data);
      setName(data.name);
    }).catch(console.error);
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await profileApi.updateProfile({ name });
      setProfileData(updated);
      setSuccessMsg('Profile updated successfully');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch {
      alert('Failed to update profile');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg('');
    try {
      await profileApi.changePassword(currentPassword, newPassword);
      setPasswordMsg('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setPasswordMsg(''), 3000);
    } catch {
      setPasswordMsg('Failed to change password. Please check your current password.');
    }
  };

  if (!profileData) return <div className="p-6 text-muted">Loading settings...</div>;

  return (
    <div className="flex-1 overflow-auto p-6 md:p-10">
      <div className="mx-auto max-w-2xl space-y-10">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Settings</h2>
          <p className="text-sm text-muted">Manage your profile and account preferences.</p>
        </div>

        {/* Profile Card */}
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-medium text-foreground">Profile Information</h3>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-muted">Email address</label>
              <input
                type="email"
                disabled
                value={profileData.email}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-muted outline-none"
              />
              <p className="mt-1 text-xs text-muted/70">Your email cannot be changed here.</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-muted">Full Name</label>
              <input
                type="text"
                required
                minLength={2}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground outline-none focus:border-[var(--primary-from)] transition-colors"
              />
            </div>
            <div className="pt-2 flex items-center gap-4">
              <Button type="submit" variant="primary">Save Changes</Button>
              {successMsg && <span className="text-sm text-green-400">{successMsg}</span>}
            </div>
          </form>
        </Card>

        {/* Security Card */}
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-medium text-foreground">Security</h3>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-muted">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground outline-none focus:border-[var(--primary-from)] transition-colors"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-muted">New Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground outline-none focus:border-[var(--primary-from)] transition-colors"
              />
              <p className="mt-1 text-xs text-muted/70">Must be at least 8 characters.</p>
            </div>
            <div className="pt-2 flex items-center gap-4">
              <Button type="submit" variant="secondary">Change Password</Button>
              {passwordMsg && <span className={`text-sm ${passwordMsg.includes('Failed') ? 'text-red-400' : 'text-green-400'}`}>{passwordMsg}</span>}
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

// ── Drive View ────────────────────────────────────────────────
function DriveView({
  jumpToFolderId,
  onJumpConsumed,
}: {
  jumpToFolderId: string | null;
  onJumpConsumed: () => void;
}) {
  // ── Multi-select state ─────────────────────────────────
  // We track which items are selected by their id + type.
  // Using a Set<string> with format "file:id" or "folder:id" lets us
  // quickly check membership and avoids maintaining two separate sets.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [sharingFile, setSharingFile] = useState<DriveFile | null>(null);
  const [previewFile, setPreviewFile] = useState<{ file: DriveFile; url: string } | null>(null);
  const { uploads, uploadFiles, clearCompleted } = useUpload(currentFolderId);

  useEffect(() => {
    if (jumpToFolderId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentFolderId(jumpToFolderId);
      onJumpConsumed();
    }
  }, [jumpToFolderId, onJumpConsumed]);

  // Fetch folder contents
  const { data, isLoading } = useQuery({
    queryKey: ['folder', currentFolderId],
    queryFn: () => foldersApi.getContents(currentFolderId),
  });

  const { data: starsData } = useQuery({
    queryKey: ['stars'],
    queryFn: starsApi.list,
  });

  const starredSet = useMemo(() => {
    const s = new Set<string>();
    starsData?.files.forEach((f) => s.add(`file:${f.id}`));
    starsData?.folders.forEach((f) => s.add(`folder:${f.id}`));
    return s;
  }, [starsData]);

  const toggleStar = useMutation({
    mutationFn: async (p: { type: 'file' | 'folder'; id: string; starred: boolean }) => {
      if (p.starred) await starsApi.unstar(p.type, p.id);
      else await starsApi.star(p.type, p.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stars'] });
    },
  });

  const access = data?.access ?? 'owner';
  const canWrite = access === 'owner' || access === 'editor';
  const canDelete = access === 'owner';
  const showShare = access === 'owner';

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['folder', currentFolderId] });
    queryClient.invalidateQueries({ queryKey: ['storage'] });
  };

  // Create folder mutation
  const createFolder = useMutation({
    mutationFn: () => foldersApi.create(newFolderName.trim(), currentFolderId),
    onSuccess: () => {
      setNewFolderName('');
      setShowNewFolder(false);
      invalidate();
    },
  });

  // Rename folder
  const renameFolder = async (folderId: string, name: string) => {
    await foldersApi.rename(folderId, name);
    invalidate();
  };

  // Delete folder
  const deleteFolder = useMutation({
    mutationFn: (folderId: string) => foldersApi.delete(folderId),
    onSuccess: invalidate,
  });

  // Rename file
  const renameFile = async (fileId: string, name: string) => {
    await filesApi.rename(fileId, name);
    invalidate();
  };

  // ── Drag-and-drop move handlers ─────────────────────────
  // These are called by DragDropGrid when a drag-and-drop completes.
  const handleMoveFile = async (fileId: string, targetFolderId: string | null) => {
    await filesApi.move(fileId, targetFolderId);
    invalidate();
  };

  const handleMoveFolder = async (folderId: string, targetFolderId: string | null) => {
    await foldersApi.move(folderId, targetFolderId);
    invalidate();
  };

  // ── Multi-select helpers ────────────────────────────────
  // toggleSelect: called when user clicks a checkbox on a card.
  // If Shift is held, we could extend to range selection later.
  const toggleSelect = useCallback((key: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  // When navigating to a different folder, clear selections
  const prevFolderRef = useRef(currentFolderId);
  useEffect(() => {
    if (prevFolderRef.current !== currentFolderId) {
      prevFolderRef.current = currentFolderId;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (selectedIds.size > 0) clearSelection();
    }
  }, [clearSelection, currentFolderId, selectedIds.size]);

  // Delete file
  const deleteFile = useMutation({
    mutationFn: (fileId: string) => filesApi.delete(fileId),
    onSuccess: invalidate,
  });

  // Preview / download file
  const handleFileClick = async (file: DriveFile) => {
    const url = await filesApi.getSignedUrl(file.id);
    const previewable = file.mime_type.startsWith('image/') ||
      file.mime_type.startsWith('video/') ||
      file.mime_type.startsWith('audio/') ||
      file.mime_type === 'application/pdf';
    if (previewable) {
      setPreviewFile({ file, url });
    } else {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="flex-1 overflow-auto p-6">

      {/* Breadcrumbs */}
      <Breadcrumbs
        path={data?.path ?? []}
        onNavigate={setCurrentFolderId}
      />

      {/* Toolbar */}
      {canWrite && (
      <div className="mb-4 flex items-center gap-2">
        <Button type="button" size="sm" onClick={() => setShowNewFolder(true)} className="gap-1.5">
          <FolderIcon className="size-3.5" strokeWidth={1.5} />
          New folder
        </Button>
      </div>
      )}

      {/* New folder input */}
      {showNewFolder && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] p-3 backdrop-blur-md">
          <FolderIcon className="size-5 shrink-0 text-primary" strokeWidth={1.5} />
          <input
            autoFocus
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && newFolderName.trim()) createFolder.mutate();
              if (e.key === 'Escape') { setShowNewFolder(false); setNewFolderName(''); }
            }}
            placeholder="Folder name"
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
          />
          <button
            type="button"
            onClick={() => newFolderName.trim() && createFolder.mutate()}
            className="text-xs font-medium text-primary hover:underline"
          >
            Create
          </button>
          <button
            type="button"
            onClick={() => { setShowNewFolder(false); setNewFolderName(''); }}
            className="text-xs text-muted hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Upload dropzone */}
      {canWrite && (
      <div className="mb-6">
        <UploadDropzone onFiles={uploadFiles} />
      </div>
      )}

      {/* Loading skeletons */}
      {isLoading && (
        <div className="space-y-6">
          <div className="grid gap-3 md:grid-cols-2">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-white/10" />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-xl bg-white/10" />
            ))}
          </div>
        </div>
      )}

      {/* Bento: folder band + file grid */}
      {!isLoading && (
        <>
          {(data?.folders.length ?? 0) === 0 && (data?.files.length ?? 0) === 0 ? (
            <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/10 py-24">
              <div className="empty-state-blobs" aria-hidden>
                <span />
                <span />
                <span />
              </div>
              <div className="relative z-[1] flex flex-col items-center px-6 text-center">
                <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--primary-from)]/30 to-[var(--primary-to)]/25 ring-1 ring-white/15">
                  <FolderOpen className="size-8 text-primary" strokeWidth={1.5} />
                </div>
                <p className="text-lg font-semibold tracking-tight text-foreground">This folder is empty</p>
                <p className="mt-2 max-w-sm text-sm text-muted">
                  {canWrite ? 'Upload files or create a folder to get started.' : 'No items shared here.'}
                </p>
              </div>
            </div>
          ) : (
            <DragDropGrid
              onMoveFile={handleMoveFile}
              onMoveFolder={handleMoveFolder}
            >
            <div key={currentFolderId ?? 'root'} className="space-y-8">
              {(data?.folders.length ?? 0) > 0 && (
                <div>
                  <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted">
                    Folders
                  </h3>
                  <motion.div
                    variants={STAGGER_CONTAINER}
                    initial="hidden"
                    animate="show"
                    className="grid gap-3 md:grid-cols-2"
                  >
                    {data?.folders.map((folder: Folder) => {
                      const selectKey = `folder:${folder.id}`;
                      return (
                      <motion.div key={folder.id} variants={STAGGER_ITEM} layout>
                        <DroppableFolder folderId={folder.id}>
                        <DraggableItem id={folder.id} type="folder" name={folder.name}>
                        <FolderCard
                          folder={folder}
                          onOpen={() => setCurrentFolderId(folder.id)}
                          onRename={(name) => renameFolder(folder.id, name)}
                          onDelete={() => deleteFolder.mutate(folder.id)}
                          isStarred={starredSet.has(`folder:${folder.id}`)}
                          onToggleStar={() =>
                            toggleStar.mutate({
                              type: 'folder',
                              id: folder.id,
                              starred: starredSet.has(`folder:${folder.id}`),
                            })
                          }
                          canWrite={canWrite}
                          canDelete={canDelete}
                          selected={selectedIds.has(selectKey)}
                          onToggleSelect={() => toggleSelect(selectKey)}
                          showSelect={selectedIds.size > 0}
                        />
                        </DraggableItem>
                        </DroppableFolder>
                      </motion.div>
                      );
                    })}
                  </motion.div>
                </div>
              )}
              {(data?.files.length ?? 0) > 0 && (
                <div>
                  <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted">
                    Files
                  </h3>
                  <motion.div
                    variants={STAGGER_CONTAINER}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
                  >
                    {data?.files.map((file: DriveFile) => {
                      const selectKey = `file:${file.id}`;
                      return (
                      <motion.div key={file.id} variants={STAGGER_ITEM} layout>
                        <DraggableItem id={file.id} type="file" name={file.name} mimeType={file.mime_type}>
                        <FileCard
                          file={file}
                          onDownload={() => handleFileClick(file)}
                          onRename={(name) => renameFile(file.id, name)}
                          onDelete={() => deleteFile.mutate(file.id)}
                          onShare={() => setSharingFile(file)}
                          isStarred={starredSet.has(`file:${file.id}`)}
                          onToggleStar={() =>
                            toggleStar.mutate({
                              type: 'file',
                              id: file.id,
                              starred: starredSet.has(`file:${file.id}`),
                            })
                          }
                          canWrite={canWrite}
                          canDelete={canDelete}
                          showShare={showShare}
                          selected={selectedIds.has(selectKey)}
                          onToggleSelect={() => toggleSelect(selectKey)}
                          showSelect={selectedIds.size > 0}
                        />
                        </DraggableItem>
                      </motion.div>
                      );
                    })}
                  </motion.div>
                </div>
              )}
            </div>
            </DragDropGrid>
          )}
        </>
      )}

      {canWrite && <UploadQueue uploads={uploads} onClear={clearCompleted} />}

      {/* ── Floating Bulk Action Bar ──────────────────────────
          This bar appears when the user has selected ≥1 item via the
          checkbox on each card.  It "floats" at the bottom of the
          viewport using fixed positioning + framer-motion slide-up.

          WHY a floating bar instead of a toolbar?
          → The user may scroll deep into a folder. A fixed bar is
            always visible, so they never lose access to bulk actions.
      */}
      {selectedIds.size > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-white/15 bg-surface-elevated/95 px-5 py-3 shadow-2xl backdrop-blur-2xl"
        >
          <span className="text-sm font-medium text-foreground">
            {selectedIds.size} selected
          </span>
          <div className="mx-1 h-5 w-px bg-white/10" />
            <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg bg-red-500/15 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/25"
            onClick={async () => {
              // Parse the selected keys back into typed ids
              const fileIds: string[] = [];
              const folderIds: string[] = [];
              selectedIds.forEach(key => {
                const [type, id] = key.split(':');
                if (type === 'file') fileIds.push(id);
                else folderIds.push(id);
              });
              
              try {
                await bulkApi.delete(fileIds, folderIds);
                clearSelection();
                invalidate(); // Refresh the list
              } catch (err) {
                console.error("Bulk delete failed", err);
                alert("Failed to delete selected items");
              }
            }}
          >
            <Trash className="size-3.5" strokeWidth={1.5} /> Delete
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-white/[0.1] hover:text-foreground"
            onClick={clearSelection}
          >
            <X className="size-3.5" strokeWidth={1.5} /> Clear
          </button>
        </motion.div>
      )}

      {/* Share modal */}
      {sharingFile && (
        <ShareModal file={sharingFile} onClose={() => setSharingFile(null)} />
      )}

      {/* File preview */}
      {previewFile && (
        <FilePreview
          file={{
            name: previewFile.file.name,
            mimeType: previewFile.file.mime_type,
            sizeBytes: previewFile.file.size_bytes,
          }}
          downloadUrl={previewFile.url}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
}

// ── Trash View ────────────────────────────────────────────────
function TrashView() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['trash'],
    queryFn: trashApi.list,
  });

  const restore = useMutation({
    mutationFn: ({ type, id }: { type: 'file' | 'folder'; id: string }) =>
      trashApi.restore(type, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trash'] });
      queryClient.invalidateQueries({ queryKey: ['storage'] });
    },
  });

  const purge = useMutation({
    mutationFn: ({ type, id }: { type: 'file' | 'folder'; id: string }) =>
      trashApi.purge(type, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trash'] });
      queryClient.invalidateQueries({ queryKey: ['storage'] });
    },
  });

  const isEmpty =
    (data?.files.length ?? 0) === 0 &&
    (data?.folders.length ?? 0) === 0;

  return (
    <div className="flex-1 overflow-auto p-6">
      <h2 className="mb-6 text-xl font-semibold tracking-tight text-foreground">Trash</h2>

      {isLoading && (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-white/10" />
          ))}
        </div>
      )}

      {!isLoading && isEmpty && (
        <div className="relative overflow-hidden rounded-2xl border border-white/10 py-24">
          <div className="empty-state-blobs" aria-hidden>
            <span />
            <span />
            <span />
          </div>
          <div className="relative z-[1] flex flex-col items-center text-muted">
            <Trash2 className="mb-4 size-14 text-muted" strokeWidth={1.5} />
            <p className="text-lg font-semibold tracking-tight text-foreground">Trash is empty</p>
          </div>
        </div>
      )}

      {!isLoading && !isEmpty && (
        <div className="space-y-2">
          {data?.folders.map(folder => (
            <div
              key={folder.id}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-surface-elevated/80 p-3 backdrop-blur-md"
            >
              <div className="flex min-w-0 items-center gap-2">
                <FolderIcon className="size-5 shrink-0 text-primary" strokeWidth={1.75} />
                <span className="truncate text-sm text-foreground">{folder.name}</span>
                <span className="shrink-0 text-xs text-muted">Folder</span>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => restore.mutate({ type: 'folder', id: folder.id })}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Restore
                </button>
                <button
                  type="button"
                  onClick={() => purge.mutate({ type: 'folder', id: folder.id })}
                  className="text-xs font-medium text-red-600 hover:underline"
                >
                  Delete forever
                </button>
              </div>
            </div>
          ))}

          {data?.files.map(file => (
            <div
              key={file.id}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-surface-elevated/80 p-3 backdrop-blur-md"
            >
              <div className="flex min-w-0 items-center gap-2">
                <MimeTypeIcon mimeType={file.mime_type} size={22} className="shrink-0" />
                <span className="truncate text-sm text-foreground">{file.name}</span>
                <span className="shrink-0 text-xs text-muted">
                  {formatBytes(file.size_bytes)}
                </span>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => restore.mutate({ type: 'file', id: file.id })}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Restore
                </button>
                <button
                  type="button"
                  onClick={() => purge.mutate({ type: 'file', id: file.id })}
                  className="text-xs font-medium text-red-600 hover:underline"
                >
                  Delete forever
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Top Bar ───────────────────────────────────────────────────
function TopBar({
  onSearchResults,
  onClearSearch,
}: {
  onSearchResults: (results: SearchResults) => void;
  onClearSearch: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [mimeFilter, setMimeFilter] = useState('');
  const [starredFilter, setStarredFilter] = useState<'all' | 'starred' | 'unstarred'>('all');
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const searchQueryRef = useRef(searchQuery);
  searchQueryRef.current = searchQuery;

  const buildParams = useCallback(() => {
    const extra: import('@/app/lib/search').SearchParams = {};
    const t = mimeFilter.trim();
    if (t) extra.type = t;
    if (starredFilter === 'starred') extra.starred = true;
    if (starredFilter === 'unstarred') extra.starred = false;
    return extra;
  }, [mimeFilter, starredFilter]);

  const handleSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      onClearSearch();
      return;
    }
    setIsSearching(true);
    try {
      const results = await searchApi.search(q, buildParams());
      onSearchResults(results);
    } catch {
      // silently fail on search errors
    } finally {
      setIsSearching(false);
    }
  }, [onSearchResults, onClearSearch, buildParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => handleSearch(value), 350);
  };

  const handleClear = () => {
    setSearchQuery('');
    onClearSearch();
  };

  useEffect(() => {
    const q = searchQueryRef.current;
    if (!q.trim()) return;
    handleSearch(q);
  }, [mimeFilter, starredFilter, handleSearch]);

  return (
    <header className="flex min-h-14 flex-1 flex-col gap-2 py-2 md:flex-row md:items-center md:py-0">
      <div className="relative max-w-xl flex-1">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" strokeWidth={1.5} />
        <input
          id="search-files"
          type="text"
          placeholder="Search files and folders..."
          value={searchQuery}
          onChange={handleChange}
          className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-10 text-sm text-foreground outline-none backdrop-blur-md transition-all placeholder:text-muted focus:border-[var(--primary-from)]/35 focus:bg-white/[0.06] focus:ring-2 focus:ring-[var(--primary-from)]/20"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted" strokeWidth={1.5} />
        )}
        {searchQuery && !isSearching && (
          <IconButton
            label="Clear search"
            onClick={handleClear}
            className="absolute right-1.5 top-1/2 -translate-y-1/2"
          >
            <X className="size-4" strokeWidth={1.5} />
          </IconButton>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <input
          type="text"
          placeholder="MIME filter"
          value={mimeFilter}
          onChange={(e) => setMimeFilter(e.target.value)}
          className="w-28 rounded-xl border border-white/10 bg-white/[0.04] px-2 py-1.5 text-xs text-foreground outline-none backdrop-blur-sm focus:ring-2 focus:ring-[var(--primary-from)]/20 md:w-32"
          title="Filter by MIME substring (e.g. image or pdf)"
        />
        <select
          value={starredFilter}
          onChange={(e) => setStarredFilter(e.target.value as 'all' | 'starred' | 'unstarred')}
          className="rounded-xl border border-white/10 bg-white/[0.04] px-2 py-1.5 text-xs text-foreground outline-none backdrop-blur-sm focus:ring-2 focus:ring-[var(--primary-from)]/20"
        >
          <option value="all">All items</option>
          <option value="starred">Starred only</option>
          <option value="unstarred">Not starred</option>
        </select>
      </div>
    </header>
  );
}

// ── App Shell (root) ──────────────────────────────────────────
export function AppShell() {
  const [activeView, setActiveView] = useState<SidebarView>('drive');
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [driveJumpFolderId, setDriveJumpFolderId] = useState<string | null>(null);

  const handleSearchResults = useCallback((results: SearchResults) => {
    setSearchResults(results);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchResults(null);
  }, []);

  const handleDownloadFile = async (file: DriveFile) => {
    const url = await filesApi.getSignedUrl(file.id);
    window.open(url, '_blank');
  };

  const handleNavigateFolder = (folderId: string) => {
    setSearchResults(null);
    setActiveView('drive');
    setDriveJumpFolderId(folderId);
  };

  const renderMainContent = () => {
    if (searchResults) {
      return (
        <SearchResultsView
          results={searchResults}
          onNavigateFolder={handleNavigateFolder}
          onDownloadFile={handleDownloadFile}
          onClearSearch={handleClearSearch}
        />
      );
    }
    if (activeView === 'starred') {
      return (
        <StarredGridView
          onOpenFolder={(id) => {
            setActiveView('drive');
            setDriveJumpFolderId(id);
          }}
        />
      );
    }
    if (activeView === 'recent') {
      return <RecentListView />;
    }
    if (activeView === 'settings') {
      return <SettingsView />;
    }
    if (activeView === 'drive') {
      return (
        <DriveView
          jumpToFolderId={driveJumpFolderId}
          onJumpConsumed={() => setDriveJumpFolderId(null)}
        />
      );
    }
    return <TrashView />;
  };

  return (
    <div className="flex min-h-0 h-screen overflow-hidden bg-background">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      <div
        className={`
        fixed inset-y-0 left-0 z-40 flex transition-transform duration-300 ease-out
        md:static md:inset-auto md:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}
      >
        <Sidebar
          activeView={activeView}
          onViewChange={(v) => {
            setActiveView(v);
            setSearchResults(null);
            setSidebarOpen(false);
          }}
        />
      </div>

      <div className="app-canvas flex min-h-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-20 flex min-h-14 shrink-0 items-start gap-3 border-b border-white/10 bg-background/75 px-4 py-2 backdrop-blur-2xl md:items-center md:px-6 md:py-0">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-1 text-muted transition-colors hover:text-foreground md:hidden"
            aria-label="Open menu"
          >
            <Menu className="size-6" strokeWidth={1.5} />
          </button>
          <TopBar onSearchResults={handleSearchResults} onClearSearch={handleClearSearch} />
        </header>
        {renderMainContent()}
      </div>
    </div>
  );
}