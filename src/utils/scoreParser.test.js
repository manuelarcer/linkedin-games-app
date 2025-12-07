
import { parseScore } from './scoreParser.js';

const TEST_CASES = [
    {
        input: "Queens #123 1:30",
        expected: { gameType: 'Queens', puzzleId: 123, timeSeconds: 90 }
    },
    {
        input: "I solved Tango n.º 5 in 2:00",
        expected: { gameType: 'Tango', puzzleId: 5, timeSeconds: 120 }
    },
    {
        input: "Zip #100 0:45",
        expected: { gameType: 'Zip', puzzleId: 100, timeSeconds: 45 }
    },
    {
        input: "Random Text",
        expected: null
    }
];

let passed = 0;
console.log("Running Score Parser Tests...");

TEST_CASES.forEach((test, i) => {
    const result = parseScore(test.input);
    const isMatch = JSON.stringify(result) === JSON.stringify(test.expected) ||
        (result && test.expected &&
            result.gameType === test.expected.gameType &&
            result.puzzleId === test.expected.puzzleId &&
            result.timeSeconds === test.expected.timeSeconds);

    if (isMatch) {
        console.log(`✅ Test ${i + 1} Passed`);
        passed++;
    } else {
        console.error(`❌ Test ${i + 1} Failed`);
        console.error(`   Input: "${test.input}"`);
        console.error(`   Expected:`, test.expected);
        console.error(`   Got:`, result);
    }
});

console.log(`\nResults: ${passed}/${TEST_CASES.length} passed.`);

if (passed === TEST_CASES.length) {
    process.exit(0);
} else {
    process.exit(1);
}
