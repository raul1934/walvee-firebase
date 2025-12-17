


export function createPageUrl(pageName: string) {
    return '/' + pageName.toLowerCase().replace(/ /g, '-');
}

export function createProfileUrl(userId?: string) {
    if (!userId) {
        return '/profile';
    }
    return `/profile/${userId}`;
}

export function requireAuth(
    user: any,
    openLoginModal: (() => void) | undefined,
    onAuthenticated: () => void
) {
    if (!user && openLoginModal) {
        openLoginModal();
    } else if (user) {
        onAuthenticated();
    }
}