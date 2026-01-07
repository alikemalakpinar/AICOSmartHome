/**
 * AICO Smart Home - Rules-as-Code Engine Types
 *
 * Types for the automation rules DSL and engine.
 */

import type { DeviceId, RoomId, ZoneId, UserId, SceneId, ISOTimestamp } from '@/types/core';

// ============================================================================
// Rule Definition Types
// ============================================================================

export interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  version: number;
  enabled: boolean;
  priority: RulePriority;
  triggers: RuleTrigger[];
  conditions: RuleCondition[];
  actions: RuleAction[];
  metadata: RuleMetadata;
}

export type RulePriority = 'low' | 'normal' | 'high' | 'critical';

export interface RuleMetadata {
  author: UserId | 'system';
  created: ISOTimestamp;
  modified: ISOTimestamp;
  tags: string[];
  category?: string;
  executionCount: number;
  lastExecuted?: ISOTimestamp;
  lastSuccess?: ISOTimestamp;
  lastFailure?: ISOTimestamp;
}

// ============================================================================
// Trigger Types
// ============================================================================

export type RuleTrigger =
  | EventTrigger
  | ScheduleTrigger
  | StateTrigger
  | WebhookTrigger
  | VoiceTrigger;

export interface EventTrigger {
  type: 'event';
  source: TriggerSource;
  event: string;
  filter?: Record<string, unknown>;
}

export type TriggerSource =
  | { type: 'device'; deviceId: DeviceId }
  | { type: 'device_type'; deviceType: string }
  | { type: 'room'; roomId: RoomId }
  | { type: 'zone'; zoneId: ZoneId }
  | { type: 'system' }
  | { type: 'any' };

export interface ScheduleTrigger {
  type: 'schedule';
  schedule: ScheduleDefinition;
}

export type ScheduleDefinition =
  | { type: 'cron'; expression: string }
  | { type: 'time'; time: string; days?: number[] }
  | { type: 'interval'; interval: number; unit: 'seconds' | 'minutes' | 'hours' }
  | { type: 'sun'; event: 'sunrise' | 'sunset'; offset?: number };

export interface StateTrigger {
  type: 'state';
  source: TriggerSource;
  property: string;
  operator: ComparisonOperator;
  value: unknown;
  for?: number; // Duration in seconds
}

export interface WebhookTrigger {
  type: 'webhook';
  path: string;
  method: 'GET' | 'POST' | 'PUT';
}

export interface VoiceTrigger {
  type: 'voice';
  intent: string;
  entities?: Record<string, string>;
}

// ============================================================================
// Condition Types
// ============================================================================

export type RuleCondition =
  | DeviceCondition
  | TimeCondition
  | UserCondition
  | WeatherCondition
  | StateCondition
  | CompoundCondition
  | TemplateCondition;

export interface DeviceCondition {
  type: 'device';
  deviceId: DeviceId;
  property: string;
  operator: ComparisonOperator;
  value: unknown;
}

export interface TimeCondition {
  type: 'time';
  constraint: TimeConstraint;
}

export type TimeConstraint =
  | { type: 'between'; start: string; end: string }
  | { type: 'before'; time: string }
  | { type: 'after'; time: string }
  | { type: 'day_of_week'; days: number[] }
  | { type: 'sun'; relation: 'before' | 'after'; event: 'sunrise' | 'sunset'; offset?: number };

export interface UserCondition {
  type: 'user';
  constraint: UserConstraint;
}

export type UserConstraint =
  | { type: 'present'; users?: UserId[]; all?: boolean }
  | { type: 'absent'; users?: UserId[]; all?: boolean }
  | { type: 'in_room'; roomId: RoomId; users?: UserId[] }
  | { type: 'identified'; userId: UserId };

export interface WeatherCondition {
  type: 'weather';
  property: string;
  operator: ComparisonOperator;
  value: unknown;
}

export interface StateCondition {
  type: 'state';
  path: string; // Dot-notation path to state value
  operator: ComparisonOperator;
  value: unknown;
}

export interface CompoundCondition {
  type: 'compound';
  operator: 'and' | 'or' | 'not';
  conditions: RuleCondition[];
}

export interface TemplateCondition {
  type: 'template';
  expression: string; // JavaScript expression
}

export type ComparisonOperator =
  | 'eq'
  | 'ne'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'contains'
  | 'starts_with'
  | 'ends_with'
  | 'in'
  | 'not_in'
  | 'matches'; // Regex

// ============================================================================
// Action Types
// ============================================================================

export type RuleAction =
  | DeviceAction
  | SceneAction
  | NotificationAction
  | DelayAction
  | WaitAction
  | ConditionalAction
  | LoopAction
  | RuleAction_Enable
  | ServiceAction
  | VariableAction;

export interface DeviceAction {
  type: 'device';
  deviceId: DeviceId | string; // Can be template
  command: string;
  parameters: Record<string, unknown>;
  transition?: number; // ms
}

export interface SceneAction {
  type: 'scene';
  sceneId: SceneId | string;
  transition?: number;
}

export interface NotificationAction {
  type: 'notification';
  recipients: (UserId | 'all' | 'owners')[];
  title: string;
  body: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  sound?: string;
  data?: Record<string, unknown>;
}

export interface DelayAction {
  type: 'delay';
  duration: number; // seconds
}

export interface WaitAction {
  type: 'wait';
  condition: RuleCondition;
  timeout: number; // seconds
}

export interface ConditionalAction {
  type: 'conditional';
  if: RuleCondition;
  then: RuleAction[];
  else?: RuleAction[];
}

export interface LoopAction {
  type: 'loop';
  iterations: number | 'until_condition';
  condition?: RuleCondition;
  actions: RuleAction[];
  delay?: number; // seconds between iterations
}

export interface RuleAction_Enable {
  type: 'rule';
  action: 'enable' | 'disable' | 'trigger';
  ruleId: string;
}

export interface ServiceAction {
  type: 'service';
  service: string;
  method: string;
  parameters: Record<string, unknown>;
}

export interface VariableAction {
  type: 'variable';
  action: 'set' | 'increment' | 'decrement' | 'append' | 'remove';
  name: string;
  value?: unknown;
}

// ============================================================================
// Execution Types
// ============================================================================

export interface RuleExecutionContext {
  ruleId: string;
  executionId: string;
  trigger: RuleTrigger;
  triggerData: Record<string, unknown>;
  timestamp: ISOTimestamp;
  variables: Map<string, unknown>;
  userId?: UserId;
}

export interface RuleExecutionResult {
  executionId: string;
  ruleId: string;
  ruleName: string;
  trigger: RuleTrigger;
  success: boolean;
  startTime: ISOTimestamp;
  endTime: ISOTimestamp;
  duration: number; // ms
  conditionsEvaluated: ConditionEvaluationResult[];
  conditionsMet: boolean;
  actionsExecuted: ActionExecutionResult[];
  error?: string;
}

export interface ConditionEvaluationResult {
  condition: RuleCondition;
  result: boolean;
  evaluatedValue?: unknown;
  error?: string;
}

export interface ActionExecutionResult {
  action: RuleAction;
  success: boolean;
  duration: number;
  result?: unknown;
  error?: string;
}

// ============================================================================
// Template Types
// ============================================================================

export interface RuleTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  variables: TemplateVariable[];
  rule: Omit<AutomationRule, 'id' | 'metadata'>;
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'device' | 'room' | 'scene' | 'user';
  label: string;
  description?: string;
  required: boolean;
  default?: unknown;
  options?: { label: string; value: unknown }[];
}

// ============================================================================
// Rule Engine Configuration
// ============================================================================

export interface RuleEngineConfig {
  maxConcurrentExecutions: number;
  defaultTimeout: number; // seconds
  maxActionsPerRule: number;
  maxConditionsPerRule: number;
  rateLimiting: {
    enabled: boolean;
    maxExecutionsPerMinute: number;
    maxExecutionsPerHour: number;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    retainDays: number;
  };
}
