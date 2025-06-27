import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { calculateTextSimilarity, levenshteinDistance } = require('./fileUtils.js');
export { calculateTextSimilarity, levenshteinDistance };
