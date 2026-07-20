import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { common as daCommon } from "./locales/da/common";
import { content as daContent } from "./locales/da/content";
import { common as enCommon } from "./locales/en/common";
import { content as enContent } from "./locales/en/content";

export type Locale = "da" | "en";

const STORAGE_KEY = "yatzy:locale";

function detectLocale(): Locale {
	const stored = localStorage.getItem(STORAGE_KEY);
	if (stored === "da" || stored === "en") return stored;
	return navigator.language.toLowerCase().startsWith("en") ? "en" : "da";
}

export function setLocale(locale: Locale) {
	localStorage.setItem(STORAGE_KEY, locale);
	i18n.changeLanguage(locale);
}

const initialLocale = detectLocale();

i18n.use(initReactI18next).init({
	resources: {
		da: { common: daCommon, content: daContent },
		en: { common: enCommon, content: enContent },
	},
	lng: initialLocale,
	fallbackLng: "da",
	defaultNS: "common",
	ns: ["common", "content"],
	interpolation: { escapeValue: false },
});

document.documentElement.lang = initialLocale;

i18n.on("languageChanged", (locale) => {
	document.documentElement.lang = locale;
});

export default i18n;
