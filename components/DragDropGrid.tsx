/**
 * DragDropGrid.tsx — Drag-and-Drop wrapper for the file/folder grid.
 *
 * ─── HOW DRAG-AND-DROP WORKS (conceptual overview) ───
 *
 * @dnd-kit is a toolkit that separates drag-and-drop into 3 concerns:
 *
 *  1. DndContext  — The "provider" that tracks pointer events and converts
 *                   them into drag lifecycle events (start → move → end).
 *  2. useDraggable — A hook you attach to items the user can PICK UP.
 *  3. useDroppable — A hook you attach to items that can RECEIVE drops.
 *
 * In our cloud storage app:
 *  - Every file card and folder card is DRAGGABLE (you can pick them up).
 *  - Every folder card is also DROPPABLE (you can drop things INTO them).
 *  - There's a special "root" drop target (to move items to root level).
 *
 * When a user drags a file onto a folder and releases, DndContext fires
 * an `onDragEnd` event. We inspect the `active` (what was dragged) and
 * `over` (what it was dropped on) to call the appropriate API.
 *
 * ─── KEY CONCEPT: DragOverlay ───
 * Instead of moving the actual DOM element during drag, we render a
 * lightweight "ghost" preview using <DragOverlay>. This avoids layout
 * thrashing and gives a smoother visual experience.
 */
'use client';

import { useState, useMemo, useCallback } from 'react';
import {
    DndContext,
    DragOverlay,
    useDraggable,
    useDroppable,
    PointerSensor,
    useSensor,
    useSensors,
    type DragStartEvent,
    type DragEndEvent,
} from '@dnd-kit/core';
import { Folder as FolderIcon } from 'lucide-react';
import { MimeTypeIcon } from '@/app/lib/mime-type-icon';

// ── Types ──────────────────────────────────────────────────
export type DragItem = {
    id: string;
    type: 'file' | 'folder';
    name: string;
    mimeType?: string; // only for files
};

type Props = {
    children: React.ReactNode;
    onMoveFile: (fileId: string, targetFolderId: string | null) => Promise<void>;
    onMoveFolder: (folderId: string, targetFolderId: string | null) => Promise<void>;
};

// ── Draggable Wrapper ──────────────────────────────────────
// Wrap any card to make it draggable. The hook gives us:
//   - attributes: ARIA attributes for accessibility
//   - listeners:  onPointerDown etc. that start the drag
//   - setNodeRef: ref to attach to the DOM element
//   - isDragging: boolean so we can dim the original
export function DraggableItem({
    id,
    type,
    name,
    mimeType,
    children,
}: DragItem & { children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        // The `id` must be unique across all draggables.
        // We prefix with type to avoid collisions (a file and folder could
        // theoretically have the same UUID).
        id: `${type}:${id}`,
        // `data` is an arbitrary payload we attach to the drag event.
        // We'll read it back in onDragEnd to know WHAT was dragged.
        data: { id, type, name, mimeType } as DragItem,
    });

    return (
        <div
            ref={setNodeRef}
            // Spread listeners (pointer handlers) and attributes (ARIA)
            {...listeners}
            {...attributes}
            style={{
                // When this item is being dragged, make the original semi-transparent
                // so the user sees it "lifted" from its position.
                opacity: isDragging ? 0.35 : 1,
                transition: 'opacity 200ms ease',
                // touch-action: none prevents the browser from scrolling when
                // the user starts a drag on mobile.
                touchAction: 'none',
            }}
        >
            {children}
        </div>
    );
}

// ── Droppable Wrapper ──────────────────────────────────────
// Wrap a folder card to make it a valid drop target.
// When something is dragged over it, `isOver` becomes true and
// we highlight the folder with a visual indicator.
export function DroppableFolder({
    folderId,
    children,
}: {
    folderId: string;
    children: React.ReactNode;
}) {
    const { isOver, setNodeRef } = useDroppable({
        id: `drop-folder:${folderId}`,
        data: { folderId },
    });

    return (
        <div
            ref={setNodeRef}
            className={`rounded-xl transition-all duration-200 ${
                isOver
                    ? 'ring-2 ring-[var(--primary-from)] ring-offset-2 ring-offset-[var(--background)] scale-[1.02]'
                    : ''
            }`}
        >
            {children}
        </div>
    );
}

// ── DragOverlay Content ────────────────────────────────────
// This is the "ghost" that follows the cursor during drag.
// It's rendered in a portal above everything else.
function DragPreview({ item }: { item: DragItem }) {
    return (
        <div className="pointer-events-none flex items-center gap-2 rounded-xl border border-[var(--primary-from)]/40 bg-surface-elevated/95 px-3 py-2 shadow-2xl backdrop-blur-xl">
            {item.type === 'folder' ? (
                <FolderIcon className="size-5 text-primary" strokeWidth={1.5} />
            ) : (
                <MimeTypeIcon mimeType={item.mimeType ?? ''} size={20} />
            )}
            <span className="max-w-[180px] truncate text-sm font-medium text-foreground">
                {item.name}
            </span>
        </div>
    );
}

// ── Main DragDropGrid Component ────────────────────────────
export function DragDropGrid({ children, onMoveFile, onMoveFolder }: Props) {
    const [activeDrag, setActiveDrag] = useState<DragItem | null>(null);

    // PointerSensor with a 10px activation distance prevents accidental drags.
    // Without this, clicking a file would immediately start dragging.
    // The `distance` option means the pointer must move 10px before drag begins.
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 10 },
        })
    );

    const handleDragStart = useCallback((event: DragStartEvent) => {
        // `event.active.data.current` contains the DragItem we passed via `data`
        const item = event.active.data.current as DragItem;
        setActiveDrag(item);
    }, []);

    const handleDragEnd = useCallback(
        async (event: DragEndEvent) => {
            setActiveDrag(null);

            const { active, over } = event;
            // If not dropped on a valid target, do nothing
            if (!over) return;

            const draggedItem = active.data.current as DragItem;
            const dropData = over.data.current as { folderId?: string };
            const targetFolderId = dropData?.folderId ?? null;

            // Don't drop a folder into itself (would create a paradox!)
            if (draggedItem.type === 'folder' && draggedItem.id === targetFolderId) return;

            try {
                if (draggedItem.type === 'file') {
                    await onMoveFile(draggedItem.id, targetFolderId);
                } else {
                    await onMoveFolder(draggedItem.id, targetFolderId);
                }
            } catch (err) {
                console.error('Move failed:', err);
            }
        },
        [onMoveFile, onMoveFolder]
    );

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            {children}
            {/* DragOverlay renders the ghost preview OUTSIDE the normal DOM flow.
                This means it won't affect layout or cause reflows during drag. */}
            <DragOverlay dropAnimation={null}>
                {activeDrag ? <DragPreview item={activeDrag} /> : null}
            </DragOverlay>
        </DndContext>
    );
}
