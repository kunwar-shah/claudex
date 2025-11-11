import { z } from 'zod';

/**
 * Zod schemas for Claude Code JSONL message templates
 *
 * Purpose: Validate JSONL message structure and detect breaking changes
 * when Claude Code updates their template format.
 *
 * Benefits:
 * - Type-safe parsing with automatic validation
 * - Clear error messages when template format changes
 * - Early detection of breaking changes
 * - Self-documenting message structure
 */

// ============================================================================
// V1 Template Schema (Claude Code V1.0.x)
// ============================================================================

export const V1MessageSchema = z.object({
  uuid: z.string().uuid(),
  sessionId: z.string().uuid(),
  type: z.enum(['user', 'assistant', 'system', 'summary']),
  timestamp: z.string().datetime(),
  content: z.union([
    z.string(),
    z.array(z.any()),  // Content blocks
    z.null()
  ]).optional(),
  text: z.string().optional(),
  // Additional fields
  role: z.string().optional(),
  model: z.string().optional(),
  stop_reason: z.string().optional(),
  usage: z.record(z.number()).optional(),
});

// ============================================================================
// V2 New Format Schema (Claude Code V2.0+ with role field)
// ============================================================================

export const V2NewMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.union([
    z.string(),
    z.array(z.any())
  ]),
  // V2 specific fields
  model: z.string().optional(),
  stop_reason: z.string().optional(),
  usage: z.record(z.number()).optional(),
  timestamp: z.string().optional(),
}).refine(
  (data) => !data.type,  // V2 new format does NOT have 'type' field
  { message: "V2 new format should not have 'type' field" }
);

// ============================================================================
// File History Snapshot Schema (Claude Code V2.0+)
// ============================================================================

export const FileHistorySnapshotSchema = z.object({
  type: z.literal('file-history-snapshot'),
  timestamp: z.string(),
  files: z.array(z.object({
    path: z.string(),
    content: z.string(),
    encoding: z.string().optional(),
  })),
  sessionId: z.string().optional(),
  uuid: z.string().optional(),
});

// ============================================================================
// V2 Mixed Edge Case Schema (summary-only with leafUuid)
// ============================================================================

export const V2MixedSummarySchema = z.object({
  type: z.literal('summary'),
  leafUuid: z.string().uuid(),
  content: z.union([z.string(), z.array(z.any())]).optional(),
  text: z.string().optional(),
  timestamp: z.string().optional(),
  sessionId: z.string().optional(),
});

// ============================================================================
// V3 Universal Schema (Superset of all formats)
// ============================================================================

export const V3UniversalMessageSchema = z.union([
  V1MessageSchema,
  V2NewMessageSchema,
  FileHistorySnapshotSchema,
  V2MixedSummarySchema,
  // Generic fallback for unknown structures
  z.object({
    role: z.string().optional(),
    type: z.string().optional(),
    content: z.any().optional(),
    text: z.string().optional(),
    timestamp: z.string().optional(),
  }).passthrough(),  // Allow additional fields
]);

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate a message against a specific template schema
 * @param {object} message - The message to validate
 * @param {string} templateId - Template ID ('claude-code-v1', 'claude-code-v3', etc.)
 * @returns {{success: boolean, data?: object, error?: object}}
 */
export function validateMessage(message, templateId = 'claude-code-v3') {
  const schemaMap = {
    'claude-code-v1': V1MessageSchema,
    'claude-code-v2-mixed': V2MixedSummarySchema,
    'claude-code-v3': V3UniversalMessageSchema,
  };

  const schema = schemaMap[templateId] || V3UniversalMessageSchema;

  try {
    const result = schema.parse(message);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error.message,
        issues: error.errors,
        path: error.errors?.[0]?.path?.join('.'),
      },
    };
  }
}

/**
 * Validate multiple messages and return validation report
 * @param {object[]} messages - Array of messages to validate
 * @param {string} templateId - Template ID
 * @returns {{valid: number, invalid: number, errors: object[]}}
 */
export function validateMessages(messages, templateId = 'claude-code-v3') {
  const results = {
    valid: 0,
    invalid: 0,
    errors: [],
  };

  messages.forEach((message, index) => {
    const validation = validateMessage(message, templateId);
    if (validation.success) {
      results.valid++;
    } else {
      results.invalid++;
      results.errors.push({
        index,
        message: validation.error.message,
        issues: validation.error.issues,
      });
    }
  });

  return results;
}

/**
 * Safe parse with automatic template detection
 * Returns parsed data or detailed error for debugging
 * @param {object} message - The message to parse
 * @returns {{success: boolean, data?: object, error?: object, template?: string}}
 */
export function safeParse(message) {
  // Try V3 Universal first (most permissive)
  const v3Result = V3UniversalMessageSchema.safeParse(message);
  if (v3Result.success) {
    return {
      success: true,
      data: v3Result.data,
      template: 'claude-code-v3',
    };
  }

  // Try V1 format
  const v1Result = V1MessageSchema.safeParse(message);
  if (v1Result.success) {
    return {
      success: true,
      data: v1Result.data,
      template: 'claude-code-v1',
    };
  }

  // Try V2 new format
  const v2Result = V2NewMessageSchema.safeParse(message);
  if (v2Result.success) {
    return {
      success: true,
      data: v2Result.data,
      template: 'claude-code-v2-new',
    };
  }

  // Failed all validations
  return {
    success: false,
    error: {
      message: 'Message does not match any known Claude Code template',
      v3Errors: v3Result.error?.errors,
      v1Errors: v1Result.error?.errors,
      v2Errors: v2Result.error?.errors,
    },
  };
}

/**
 * Check if a message matches expected schema for a template
 * Returns true/false for quick validation
 * @param {object} message - The message to check
 * @param {string} templateId - Template ID
 * @returns {boolean}
 */
export function isValidMessage(message, templateId = 'claude-code-v3') {
  const validation = validateMessage(message, templateId);
  return validation.success;
}

// Export all schemas for direct use if needed
export const schemas = {
  V1: V1MessageSchema,
  V2New: V2NewMessageSchema,
  V2Mixed: V2MixedSummarySchema,
  FileSnapshot: FileHistorySnapshotSchema,
  V3Universal: V3UniversalMessageSchema,
};
