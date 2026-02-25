import WebApp from '@twa-dev/sdk'

export function useTelegram() {
    const tg = WebApp;
    return {
        tg,
        initDataUnsafe: tg.initDataUnsafe,
        user: tg.initDataUnsafe?.user,
        queryId: tg.initDataUnsafe?.query_id,
        BackButton: tg.BackButton,
        MainButton: tg.MainButton,
        HapticFeedback: tg.HapticFeedback,
        close: () => tg.close(),
    }
}
