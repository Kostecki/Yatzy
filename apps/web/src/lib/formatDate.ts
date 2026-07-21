const dateOptions: Intl.DateTimeFormatOptions = {
	day: "2-digit",
	month: "2-digit",
	year: "numeric",
};

export function formatDate(date: Date): string {
	return date.toLocaleDateString([], dateOptions);
}

export function formatDateTime(date: Date): string {
	return date.toLocaleString([], {
		...dateOptions,
		hour: "2-digit",
		minute: "2-digit",
	});
}
