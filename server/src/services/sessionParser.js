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
          const parsedMessage = this.messageParser.parseMessage(rawMessage, template);
          
          parsedMessage.lineNumber = lineNumber;
          messages.push(parsedMessage);
          
        } catch (error) {
          console.warn(`Skipping invalid JSON on line ${lineNumber}:`, error.message);
          skippedLines++;
        }
      }

      return {
        messages,
        template,
        stats: {
          totalLines: lineNumber,
          parsedMessages: messages.length,
          skippedLines
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