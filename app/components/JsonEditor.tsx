"use client";
import React, { useEffect, useMemo, useState } from "react";

export type JsonEditorProps = {
	label?: string;
	value: string; // stringified JSON
	onChange: (next: string) => void;
	rows?: number;
	className?: string;
};

export default function JsonEditor({ label, value, onChange, rows = 8, className }: JsonEditorProps) {
	const [text, setText] = useState<string>(value || "{}\n");
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		setText(value || "{}");
	}, [value]);

	useEffect(() => {
		try {
			if (text.trim().length === 0) {
				setError(null);
				return;
			}
			JSON.parse(text);
			setError(null);
			onChange(text);
		} catch (e: any) {
			setError(e?.message || "Invalid JSON");
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [text]);

	return (
		<div className={className}>
			{label && <label className="block text-sm font-medium mb-1">{label}</label>}
			<textarea
				className="w-full border p-2 rounded font-mono text-sm"
				rows={rows}
				value={text}
				onChange={(e) => setText(e.target.value)}
				spellCheck={false}
			/>
			{error && <div className="text-red-600 text-xs mt-1">{error}</div>}
		</div>
	);
}
