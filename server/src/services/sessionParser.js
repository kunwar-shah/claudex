import fs from 'fs';
import readline from 'readline';
import { TemplateDetector } from '../parsers/templateDetector.js';
import { MessageParser } from '../parsers/messageParser.js';

export class SessionParser {
  constructor() {
    this.messageParser = new MessageParser();
  }

  async parseSession(sessionFilePath, sampleMessages = null) {
    try {
      let template = 'unknown';
      
      if (sampleMessages) {
        template = TemplateDetector.detectTemplate(sampleMessages);
      } else {
        const samples = await this.getSampleMessages(sessionFilePath);
        template = TemplateDetector.detectTemplate(samples);
      }

      const messages = [];
      const fileStream = fs.createReadStream(sessionFilePath);
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
      });

      let lineNumber = 0;
      let skippedLines = 0;

      for await (const line of rl) {
        lineNumber++;
        const trimmedLine = line.trim();

        if (!trimmedLine) continue;

        try {
          const rawMessage = JSON.parse(trimmedLine);
          const parsedMessage = this.messageParser.parseMessage(rawMessage, template, lineNumber);

          parsedMessage.lineNumber = lineNumber;
          messages.push(parsedMessage);

        } catch (error) {
          console.warn(`Skipping invalid JSON on line ${lineNumber}:`, error.message);
          skippedLines++;
        }
      }

      const tokenStats = this.aggregateTokenStats(messages);

      return {
        messages,
        template,
        stats: {
          totalLines: lineNumber,
          parsedMessages: messages.length,
          skippedLines,
          tokens: tokenStats
        }
      };

    } catch (error) {
      console.error(`Error parsing session ${sessionFilePath}:`, error);
      throw new Error(`Failed to parse session: ${error.message}`);
    }
  }

  async getSampleMessages(sessionFilePath, sampleSize = 10) {
    const samples = [];
    const fileStream = fs.createReadStream(sessionFilePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    let count = 0;
    for await (const line of rl) {
      if (count >= sampleSize) break;

      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      try {
        const parsed = JSON.parse(trimmedLine);
        samples.push(parsed);
        count++;
      } catch (error) {
        // Skip invalid JSON lines
        continue;
      }
    }

    rl.close();
    return samples;
  }

  aggregateTokenStats(messages) {
    const stats = {
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCacheCreationTokens: 0,
      totalCacheReadTokens: 0,
      ephemeral5mTokens: 0,
      ephemeral1hTokens: 0,
      messagesWithUsage: 0
    };

    for (const message of messages) {
      if (message.metadata?.usage) {
        const usage = message.metadata.usage;

        stats.totalInputTokens += usage.input_tokens || 0;
        stats.totalOutputTokens += usage.output_tokens || 0;
        stats.totalCacheCreationTokens += usage.cache_creation_input_tokens || 0;
        stats.totalCacheReadTokens += usage.cache_read_input_tokens || 0;

        // Handle cache creation breakdown
        if (usage.cache_creation) {
          stats.ephemeral5mTokens += usage.cache_creation.ephemeral_5m_input_tokens || 0;
          stats.ephemeral1hTokens += usage.cache_creation.ephemeral_1h_input_tokens || 0;
        }

        stats.messagesWithUsage++;
      }
    }

    // Calculate cache efficiency metrics
    const totalTokens = stats.totalInputTokens + stats.totalCacheCreationTokens + stats.totalCacheReadTokens;
    const cacheHitRate = totalTokens > 0
      ? ((stats.totalCacheReadTokens / totalTokens) * 100).toFixed(2)
      : '0.00';

    stats.cacheHitRate = parseFloat(cacheHitRate);
    stats.totalTokens = totalTokens + stats.totalOutputTokens;

    return stats;
  }

  async getMessagesPaginated(sessionFilePath, template, page = 1, pageSize = 50) {
    const messages = [];
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    const fileStream = fs.createReadStream(sessionFilePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    let currentIndex = 0;
    let messageIndex = 0;

    for await (const line of rl) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      if (messageIndex >= startIndex && messageIndex < endIndex) {
        try {
          const rawMessage = JSON.parse(trimmedLine);
          const parsedMessage = this.messageParser.parseMessage(rawMessage, template);
          parsedMessage.lineNumber = currentIndex + 1;
          messages.push(parsedMessage);
        } catch (error) {
          // Skip invalid lines
        }
      }

      messageIndex++;
      currentIndex++;
      
      if (messageIndex >= endIndex) break;
    }

    rl.close();
    return messages;
  }
}