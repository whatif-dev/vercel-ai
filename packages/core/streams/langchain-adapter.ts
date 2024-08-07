import {
  AIStreamCallbacksAndOptions,
  createCallbacksTransformer,
} from './ai-stream';
import { createStreamDataTransformer } from './stream-data';

type LangChainImageDetail = 'auto' | 'low' | 'high';

type LangChainMessageContentText = {
  type: 'text';
  text: string;
};

type LangChainMessageContentImageUrl = {
  type: 'image_url';
  image_url:
    | string
    | {
        url: string;
        detail?: LangChainImageDetail;
      };
};

type LangChainMessageContentComplex =
  | LangChainMessageContentText
  | LangChainMessageContentImageUrl
  | (Record<string, any> & {
      type?: 'text' | 'image_url' | string;
    })
  | (Record<string, any> & {
      type?: never;
    });

type LangChainMessageContent = string | LangChainMessageContentComplex[];

type LangChainAIMessageChunk = {
  content: LangChainMessageContent;
};

// LC stream event v2
type LangChainStreamEvent = {
  event: string;
  data: any;
};

/**
Converts LangChain output streams to AIStream. 

The following streams are supported:
- `LangChainAIMessageChunk` streams (LangChain `model.stream` output)
- `string` streams (LangChain `StringOutputParser` output)
 */
export function toAIStream(
  stream:
    | ReadableStream<LangChainStreamEvent>
    | ReadableStream<LangChainAIMessageChunk>
    | ReadableStream<string>,
  callbacks?: AIStreamCallbacksAndOptions,
) {
  return stream
    .pipeThrough(
      new TransformStream<
        LangChainStreamEvent | LangChainAIMessageChunk | string
      >({
        transform: async (value, controller) => {
          // text stream:
          if (typeof value === 'string') {
            controller.enqueue(value);
            return;
          }

          // LC stream events v2:
          if ('event' in value) {
            // chunk is AIMessage Chunk for on_chat_model_stream event:
            if (value.event === 'on_chat_model_stream') {
              forwardAIMessageChunk(
                value.data?.chunk as LangChainAIMessageChunk,
                controller,
              );
            }
            return;
          }

          // AI Message chunk stream:
          forwardAIMessageChunk(value, controller);
        },
      }),
    )
    .pipeThrough(createCallbacksTransformer(callbacks))
    .pipeThrough(createStreamDataTransformer());
}

function forwardAIMessageChunk(
  chunk: LangChainAIMessageChunk,
  controller: TransformStreamDefaultController<any>,
) {
  if (typeof chunk.content === 'string') {
    controller.enqueue(chunk.content);
  } else {
    const content: LangChainMessageContentComplex[] = chunk.content;
    for (const item of content) {
      if (item.type === 'text') {
        controller.enqueue(item.text);
      }
    }
  }
}
