import assert from 'node:assert';
import {
  MockEmbeddingModelV1,
  mockEmbed,
} from '../test/mock-embedding-model-v1';
import { embed } from './embed';

const dummyEmbedding = [0.1, 0.2, 0.3];
const testValue = 'sunny day at the beach';

describe('result.embedding', () => {
  it('should generate embedding', async () => {
    const result = await embed({
      model: new MockEmbeddingModelV1({
        doEmbed: mockEmbed([testValue], [dummyEmbedding]),
      }),
      value: testValue,
    });

    assert.deepStrictEqual(result.embedding, dummyEmbedding);
  });
});

describe('result.value', () => {
  it('should include value in the result', async () => {
    const result = await embed({
      model: new MockEmbeddingModelV1({
        doEmbed: mockEmbed([testValue], [dummyEmbedding]),
      }),
      value: testValue,
    });

    assert.deepStrictEqual(result.value, testValue);
  });
});

describe('result.usage', () => {
  it('should include usage in the result', async () => {
    const result = await embed({
      model: new MockEmbeddingModelV1({
        doEmbed: mockEmbed([testValue], [dummyEmbedding], { tokens: 10 }),
      }),
      value: testValue,
    });

    assert.deepStrictEqual(result.usage, { tokens: 10 });
  });
});

describe('options.headers', () => {
  it('should set headers', async () => {
    const result = await embed({
      model: new MockEmbeddingModelV1({
        doEmbed: async ({ headers }) => {
          assert.deepStrictEqual(headers, {
            'custom-request-header': 'request-header-value',
          });

          return { embeddings: [dummyEmbedding] };
        },
      }),
      value: testValue,
      headers: { 'custom-request-header': 'request-header-value' },
    });

    assert.deepStrictEqual(result.embedding, dummyEmbedding);
  });
});
