
/**
 * Parses score text from LinkedIn Games share messages.
 * Supported games: Queens, Tango, Zip, Sudoku.
 */

// Regex patterns derived from notebook
// "Game #123 ... 1:23" or "Game n.º123 ... 1:23"
const PATTERNS = {
    Queens: /Queens\s*(?:#|n\.º)\s*(\d+)[^\d\n]*?(\d+:\d+)/i,
    Tango: /Tango\s*(?:#|n\.º)\s*(\d+)[^\d\n]*?(\d+:\d+)/i,
    Zip: /Zip\s*(?:#|n\.º)\s*(\d+)[^\d\n]*?(\d+:\d+)/i,
    Sudoku: /Sudoku\s*(?:#|n\.º)\s*(\d+)[^\d\n]*?(\d+:\d+)/i,
};

export function parseScore(text) {
    if (!text) return null;

    let result = null;

    for (const [game, regex] of Object.entries(PATTERNS)) {
        const match = text.match(regex);
        if (match) {
            const [_, puzzleIdStr, timeStr] = match;
            const puzzleId = parseInt(puzzleIdStr, 10);
            const [mins, secs] = timeStr.split(':').map(s => parseInt(s, 10));
            const timeSeconds = (mins * 60) + secs;

            // We found a match, let's return it.
            // Priority handling: If text contains multiple, we might return the first one found 
            // or we could support returning all of them. For now, let's assuming one per paste 
            // or return the first valid one.

            result = {
                gameType: game,
                puzzleId,
                timeSeconds,
                formattedTime: timeStr,
            };
            break;
        }
    }

    return result;
}

/**
 * Calculates points based on rank.
 * 1st -> 3pts
 * 2nd -> 2pts
 * 3rd -> 1pts
 * 4th+ -> 0pts
 */
export function calculatePoints(rank) {
    if (rank === 1) return 3;
    if (rank === 2) return 2;
    if (rank === 3) return 1;
    return 0;
}
