import { ActionIcon, Flex, SegmentedControl } from "@mantine/core";
import { IconHome } from "@tabler/icons-react";
import { Link, Outlet } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { type Locale, setLocale } from "./lib/i18n";

export default function Root() {
	const { i18n } = useTranslation();

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
			<ActionIcon
				component={Link}
				to="/"
				variant="outline"
				color="gray.4"
				size="md"
				pos="fixed"
				top={16}
				left={16}
			>
				<IconHome size={16} />
			</ActionIcon>
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
