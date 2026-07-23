import { ActionIcon, Flex, Group, SegmentedControl } from "@mantine/core";
import { IconChartBar, IconHome } from "@tabler/icons-react";
import { Link, Outlet } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { type Locale, setLocale } from "./lib/i18n";

export default function Root() {
	const { t, i18n } = useTranslation();

	return (
		<Flex
			mih="100svh"
			direction="column"
			align="center"
			justify="center"
			gap="xl"
			p="md"
			pb={120}
		>
			<Group pos="fixed" top={16} left={16} gap="xs">
				<ActionIcon
					component={Link}
					to="/"
					variant="outline"
					color="gray.4"
					size="md"
				>
					<IconHome size={16} />
				</ActionIcon>
				<ActionIcon
					component={Link}
					to="/stats"
					variant="outline"
					color="gray.4"
					size="md"
					aria-label={t("stats.navLabel")}
				>
					<IconChartBar size={16} />
				</ActionIcon>
			</Group>
			<SegmentedControl
				pos="fixed"
				top={16}
				right={16}
				size="xs"
				value={i18n.language}
				onChange={(value) => setLocale(value as Locale)}
				data={[
					{ label: "🇩🇰", value: "da" },
					{ label: "🇬🇧", value: "en" },
				]}
			/>
			<Outlet />
		</Flex>
	);
}
