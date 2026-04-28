'use client';

import React, { useState, useRef, useEffect } from 'react';

type Props = {
    initialName: string;
    onSave: (name: string) => Promise<void>;
    onCancel: () => void;
};

export function InlineRename({ initialName, onSave, onCancel }: Props) {
    const [value, setValue] = useState(initialName);
    const [saving, setSaving] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Focus and select all text on mount
        inputRef.current?.select();
    }, []);

    const handleKeyDown = async (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if(!value.trim() || value === initialName) {
                onCancel();
                return;
            }
            try {
                await onSave(value.trim());
            } finally {
                setSaving(false);
            }
        }
        if (e.key === 'Escape') onCancel();
    };

    return (
        <input
            ref={inputRef}
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={onCancel}
            disabled={saving}
            className='w-full px-1 py-0.5 text-xs border border-blue-400 rounded outline-none focus:ring-1 focus:ring-blue-400 bg-white text-gray-800'
            onClick={e => e.stopPropagation()}
        />
    );
}