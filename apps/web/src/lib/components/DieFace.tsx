import { Box } from "@mantine/core";

const PIP_LAYOUTS: Record<number, [number, number][]> = {
	1: [[1, 1]],
	2: [
		[0, 0],
		[2, 2],
	],
	3: [
		[0, 0],
		[1, 1],
		[2, 2],
	],
	4: [
		[0, 0],
		[0, 2],
		[2, 0],
		[2, 2],
	],
	5: [
		[0, 0],
		[0, 2],
		[1, 1],
		[2, 0],
		[2, 2],
	],
	6: [
		[0, 0],
		[0, 2],
		[1, 0],
		[1, 2],
		[2, 0],
		[2, 2],
	],
};

export function DieFace({
	value,
	size = 32,
	active,
}: {
	value: number;
	size?: number;
	active?: boolean;
}) {
	const pips = PIP_LAYOUTS[value] ?? [];

	return (
		<Box
			style={{
				width: size,
				height: size,
				flexShrink: 0,
				borderRadius: size * 0.22,
				border: `1px solid var(--mantine-color-${active ? "blue-5" : "gray-4"})`,
				background: active
					? "var(--mantine-color-blue-0)"
					: "var(--mantine-color-body)",
				boxShadow: "0 1px 2px rgba(0, 0, 0, 0.12)",
				display: "grid",
				gridTemplateColumns: "repeat(3, 1fr)",
				gridTemplateRows: "repeat(3, 1fr)",
				padding: size * 0.14,
				boxSizing: "border-box",
				transition: "background 0.15s, border-color 0.15s",
			}}
		>
			{Array.from({ length: 9 }, (_, i) => {
				const row = Math.floor(i / 3);
				const col = i % 3;
				const isPip = pips.some(([r, c]) => r === row && c === col);
				return (
					<Box
						key={`${row}-${col}`}
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						{isPip && (
							<Box
								style={{
									width: size * 0.16,
									height: size * 0.16,
									borderRadius: "50%",
									background: active
										? "var(--mantine-color-blue-7)"
										: "var(--mantine-color-text)",
								}}
							/>
						)}
					</Box>
				);
			})}
		</Box>
	);
}
