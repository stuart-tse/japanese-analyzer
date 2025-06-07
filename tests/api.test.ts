import assert from 'assert';
import { getApiEndpoint } from '../app/services/api';

assert.strictEqual(getApiEndpoint('/analyze'), '/api/analyze');
console.log('All tests passed');
