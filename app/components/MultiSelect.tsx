"use client";
import React from "react";

export type Option = { label: string; value: string };

export default function MultiSelect({
	label,
	options,
	values,
	onChange,
}: {
	label?: string;
	options: Option[];
	values: string[];
	onChange: (values: string[]) => void;
}) {
	return (
		<div>
			{label && <label className="block text-sm mb-1">{label}</label>}
			<div className="flex flex-wrap gap-2 border rounded p-2">
				{options.map((opt) => {
					const active = values.includes(opt.value);
					return (
						<button
							key={opt.value}
							onClick={(e) => {
								e.preventDefault();
								const next = active
									? values.filter((v) => v !== opt.value)
									: [...values, opt.value];
								onChange(next);
							}}
							className={`text-xs px-2 py-1 rounded border ${active ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-700"}`}
						>
							{opt.label}
						</button>
					);
				})}
			</div>
		</div>
	);
}
