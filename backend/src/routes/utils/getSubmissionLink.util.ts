export function getSubmissionLink(integrationType: string): string {
	switch (integrationType) {
	case 'telegramGoogleCalendarIntegration':
		return '/integration/addTelegramGoogleCalendarIntegration';
	case 'telegramGoogleClassroomAnnouncementIntegration':
		return '/integration/addTelegramGoogleClassroomAnnouncementIntegration';
	case 'telegramGoogleDriveIntegration':
		return '/integration/addTelegramGoogleDriveIntegration';
	case 'telegramTwitterPost':
		return '/integration/addTelegramTwitterPostIntegration';
	case 'telegramTwitterImagePost':
		return '/integration/addTelegramTwitterImagePostIntegration';
	case 'telegramRedditPost':
		return '/integration/addTelegramRedditPostIntegration';
	default: {
		throw new Error('getSubmissionLink: integrationType not supported')
	}
	}
}