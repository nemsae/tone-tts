import {
  CreateRoomSchema,
  GameSettingsSchema,
  GenerateTwistersSchema,
  JoinRoomSchema,
  MAX_CUSTOM_LENGTH,
  MAX_PLAYER_NAME_LENGTH,
  MAX_ROUND_TIME_LIMIT,
  MAX_ROUNDS,
  MAX_TOPIC_LENGTH,
  MAX_TRANSCRIPT_LENGTH,
  MIN_ROUND_TIME_LIMIT,
  PlayerNameSchema,
  SubmitAnswerSchema,
  TopicSchema,
  sanitizeInput,
  type GenerateTwistersDto,
} from '@jaysonder/tts-validation';
import { z } from 'zod';

export {
  MAX_CUSTOM_LENGTH,
  MAX_PLAYER_NAME_LENGTH,
  MAX_ROUND_TIME_LIMIT,
  MAX_ROUNDS,
  MAX_TOPIC_LENGTH,
  MAX_TRANSCRIPT_LENGTH,
  MIN_ROUND_TIME_LIMIT,
};

export const MIN_CUSTOM_LENGTH = 1;
export const TOPIC_MIN_LENGTH = 1;
export const ROOM_CODE_LENGTH = 4;

// The current multiplayer UI supports "no timer" while the published schema requires a number.
// Keep the client payload compatible with the existing UI without duplicating the rest of the DTO rules.
const ClientMultiplayerGameSettingsSchema = GameSettingsSchema.extend({
  roundTimeLimit: GameSettingsSchema.shape.roundTimeLimit.nullable(),
});

const ClientJoinRoomSchema = JoinRoomSchema.extend({
  roomCode: JoinRoomSchema.shape.roomCode
    .transform((roomCode) => roomCode.trim().toUpperCase())
    .pipe(z.string().length(ROOM_CODE_LENGTH, `Room code must be ${ROOM_CODE_LENGTH} characters`)),
});

const ClientCreateRoomSchema = CreateRoomSchema.extend({
  settings: ClientMultiplayerGameSettingsSchema,
});

export type ClientMultiplayerGameSettings = z.infer<typeof ClientMultiplayerGameSettingsSchema>;
export type ClientCreateRoomDto = z.infer<typeof ClientCreateRoomSchema>;
export type ClientJoinRoomDto = z.infer<typeof ClientJoinRoomSchema>;

function getValidationErrorMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Invalid request payload';
}

function parseWithSchema<TOutput>(schema: z.ZodType<TOutput>, payload: unknown): TOutput {
  const result = schema.safeParse(payload);
  if (!result.success) {
    throw new Error(getValidationErrorMessage(result.error));
  }

  return result.data;
}

export function sanitizeTopicInput(topic: string): string {
  return sanitizeInput(topic);
}

export function validateTopicInput(topic: string): string | null {
  const result = TopicSchema.safeParse(topic);
  return result.success ? null : getValidationErrorMessage(result.error);
}

export function parsePlayerNameInput(playerName: string): string {
  return parseWithSchema(PlayerNameSchema, playerName);
}

export function parseGenerateTwistersPayload(payload: unknown): GenerateTwistersDto {
  return parseWithSchema(GenerateTwistersSchema, payload);
}

export function parseCreateRoomPayload(payload: unknown): ClientCreateRoomDto {
  return parseWithSchema(ClientCreateRoomSchema, payload);
}

export function parseJoinRoomPayload(payload: unknown): ClientJoinRoomDto {
  return parseWithSchema(ClientJoinRoomSchema, payload);
}

export function parseSubmitAnswerPayload(payload: unknown) {
  return parseWithSchema(SubmitAnswerSchema, payload);
}
