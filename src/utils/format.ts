export const formatScoreDisplay = (score: number) => {
    const s = score.toLocaleString('uk-UA');
    if (score >= 1000000000) {
        return s.replace(/[\s\xA0]/, 'B ');
    }
    if (score >= 1000000) {
        return s.replace(/[\s\xA0]/, 'M ');
    }
    return s;
};
