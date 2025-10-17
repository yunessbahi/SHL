"use client";
import React from "react";

export default function DateTimePicker({ label, value, onChange }: { label?: string; value: string; onChange: (v: string) => void }) {
	return (
		<div>
			{label && <label className="block text-sm mb-1">{label}</label>}
			<input
				type="datetime-local"
				className="w-full border p-2 rounded"
				value={value ? value.replace("Z", "") : ""}
				onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : "")}
			/>
		</div>
	);
}
