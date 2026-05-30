import fs from 'fs';
import readline from 'readline';
import { TemplateDetector } from '../parsers/templateDetector.js';
import { MessageParser } from '../parsers/messageParser.js';
import { validateMessage, safeParse } from '../parsers/templateSchemas.js';

export class SessionParser {
  constructor() {
    this.messageParser = new MessageParser();
    this.validationStats = {
      totalValidated: 0,
      validMessages: 0,
      invalidMessages: 0,
      validationErrors: [],
    };
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

          // Zod validation - detect template format changes
          this.validationStats.totalValidated++;
          const validation = validateMessage(rawMessage, template);

          if (!validation.success) {
            this.validationStats.invalidMessages++;
            this.validationStats.validationErrors.push({
              line: lineNumber,
              template,
              error: validation.error.message,
              issues: validation.error.issues,
            });

            // Log warning for breaking changes
            console.warn(
              `⚠️  Template validation failed on line ${lineNumber}:`,
              `\n   Template: ${template}`,
              `\n   Error: ${validation.error.message}`,
              `\n   This may indicate Claude Code changed their template format.`
            );
          } else {
            this.validationStats.validMessages++;
          }

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
          validation: {
            totalValidated: this.validationStats.totalValidated,
            validMessages: this.validationStats.validMessages,
            invalidMessages: this.validationStats.invalidMessages,
            validationRate: this.validationStats.totalValidated > 0
              ? ((this.validationStats.validMessages / this.validationStats.totalValidated) * 100).toFixed(2)
              : '0.00',
          },
          tokens: tokenStats
        },
        // Include validation errors if any (for debugging)
        validationErrors: this.validationStats.invalidMessages > 0
          ? this.validationStats.validationErrors
          : undefined,
      };

    } catch (error) {
      console.error(`Error parsing session ${sessionFilePath}:`, error);
      throw new Error(`Failed to parse session: ${error.message}`);
    }
  }

  /**
   * Parse only the portion of a session file starting at `startByte`, continuing
   * line numbering from `startLineNumber`. Used by incremental indexing to read
   * just the lines appended since the last pass.
   *
   * Reads the byte slice [startByte, EOF) and only consumes up to the LAST
   * newline, so a partial final line (a record still being written) is deferred
   * to the next pass rather than indexed half-formed. Returns the byte offset
   * actually consumed so the caller can advance its watermark precisely.
   *
   * Line numbers and message ids are produced identically to parseSession() as
   * long as `startLineNumber` is the last fully-indexed physical line, because
   * MessageParser bakes the line number into each message id.
   */
  async parseSessionFrom(sessionFilePath, startByte = 0, startLineNumber = 0) {
    // Detect template from the file head, same source parseSession uses.
    const samples = await this.getSampleMessages(sessionFilePath);
    const template = TemplateDetector.detectTemplate(samples);

    const empty = {
      messages: [],
      template,
      bytesConsumed: 0,
      endByte: startByte,
      lastLineNumber: startLineNumber,
      skippedLines: 0,
    };

    const fh = await fs.promises.open(sessionFilePath, 'r');
    try {
      const { size } = await fh.stat();
      if (startByte >= size) return empty;

      const length = size - startByte;
      const buffer = Buffer.allocUnsafe(length);
      await fh.read(buffer, 0, length, startByte);

      // Consume only through the last complete line (terminated by \n).
      const lastNewline = buffer.lastIndexOf(0x0a);
      if (lastNewline === -1) return empty; // no complete line available yet

      const completeBytes = lastNewline + 1;
      const text = buffer.toString('utf8', 0, completeBytes);

      const messages = [];
      let lineNumber = startLineNumber;
      let skippedLines = 0;

      const lines = text.split('\n');
      lines.pop(); // drop the empty string after the trailing newline

      for (const rawLine of lines) {
        lineNumber++; // count every physical line (incl. blanks), like parseSession
        const trimmedLine = rawLine.trim();
        if (!trimmedLine) continue;

        try {
          const rawMessage = JSON.parse(trimmedLine);
          const parsedMessage = this.messageParser.parseMessage(rawMessage, template, lineNumber);
          parsedMessage.lineNumber = lineNumber;
          messages.push(parsedMessage);
        } catch (error) {
          skippedLines++;
        }
      }

      return {
        messages,
        template,
        bytesConsumed: completeBytes,
        endByte: startByte + completeBytes,
        lastLineNumber: lineNumber,
        skippedLines,
      };
    } finally {
      await fh.close();
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