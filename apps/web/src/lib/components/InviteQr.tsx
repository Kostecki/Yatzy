import { ActionIcon, Box, Popover, Stack, Text } from "@mantine/core";
import { IconQrcode } from "@tabler/icons-react";
import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import QRCode from "react-qr-code";

export function InviteQr({
	sessionCode,
	position = "bottom-end",
}: {
	sessionCode: string;
	position?: ComponentProps<typeof Popover>["position"];
}) {
	const { t } = useTranslation();

	const joinUrl = `${location.origin}/s/${sessionCode}/view`;

	return (
		<Popover withArrow shadow="md" position={position}>
			<Popover.Target>
				<ActionIcon
					variant="outline"
					color="gray"
					size="lg"
					aria-label={t("inviteQr.showQr")}
				>
					<IconQrcode size={20} />
				</ActionIcon>
			</Popover.Target>
			<Popover.Dropdown>
				<Stack align="center" gap="xs">
					<Box
						style={{
							background: "white",
							padding: 12,
							borderRadius: 8,
							lineHeight: 0,
						}}
					>
						<QRCode value={joinUrl} size={160} />
					</Box>
					<Text size="xs" c="dimmed" ta="center" maw={160}>
						{t("inviteQr.instructions", { host: location.host })}
					</Text>
				</Stack>
			</Popover.Dropdown>
		</Popover>
	);
}
