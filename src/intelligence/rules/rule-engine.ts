/**
 * AICO Smart Home - Rules-as-Code Engine
 *
 * Core automation engine for executing rules.
 */

import { EventEmitter } from 'eventemitter3';
import type { DeviceId, RoomId, UserId, ISOTimestamp } from '@/types/core';
import type {
  AutomationRule,
  RuleTrigger,
  RuleCondition,
  RuleAction,
  RuleExecutionContext,
  RuleExecutionResult,
  ConditionEvaluationResult,
  ActionExecutionResult,
  ComparisonOperator,
  RuleEngineConfig,
} from './types';

// ============================================================================
// Engine Events
// ============================================================================

interface RuleEngineEvents {
  'rule:triggered': (ruleId: string, trigger: RuleTrigger) => void;
  'rule:executing': (ruleId: string, executionId: string) => void;
  'rule:completed': (result: RuleExecutionResult) => void;
  'rule:failed': (ruleId: string, error: Error) => void;
  'action:executing': (ruleId: string, action: RuleAction) => void;
  'action:completed': (ruleId: string, action: RuleAction, result: unknown) => void;
  'action:failed': (ruleId: string, action: RuleAction, error: Error) => void;
}

// ============================================================================
// Rule Engine
// ============================================================================

export class RuleEngine extends EventEmitter<RuleEngineEvents> {
  private rules = new Map<string, AutomationRule>();
  private config: RuleEngineConfig;
  private executionQueue: RuleExecutionContext[] = [];
  private activeExecutions = new Map<string, Promise<RuleExecutionResult>>();
  private executionHistory: RuleExecutionResult[] = [];
  private variables = new Map<string, unknown>();
  private scheduledTriggers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(config: RuleEngineConfig) {
    super();
    this.config = config;
  }

  // ============================================================================
  // Rule Management
  // ============================================================================

  registerRule(rule: AutomationRule): void {
    this.rules.set(rule.id, rule);

    // Set up scheduled triggers
    for (const trigger of rule.triggers) {
      if (trigger.type === 'schedule') {
        this.setupScheduleTrigger(rule.id, trigger);
      }
    }
  }

  unregisterRule(ruleId: string): void {
    this.rules.delete(ruleId);

    // Cancel scheduled triggers
    const scheduled = this.scheduledTriggers.get(ruleId);
    if (scheduled) {
      clearTimeout(scheduled);
      this.scheduledTriggers.delete(ruleId);
    }
  }

  getRule(ruleId: string): AutomationRule | undefined {
    return this.rules.get(ruleId);
  }

  getAllRules(): AutomationRule[] {
    return Array.from(this.rules.values());
  }

  enableRule(ruleId: string): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = true;
    }
  }

  disableRule(ruleId: string): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = false;
    }
  }

  // ============================================================================
  // Trigger Handling
  // ============================================================================

  handleEvent(eventType: string, eventData: Record<string, unknown>): void {
    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      for (const trigger of rule.triggers) {
        if (trigger.type === 'event' && this.matchesEventTrigger(trigger, eventType, eventData)) {
          this.triggerRule(rule.id, trigger, eventData);
        } else if (trigger.type === 'state' && this.matchesStateTrigger(trigger, eventData)) {
          this.triggerRule(rule.id, trigger, eventData);
        }
      }
    }
  }

  handleVoiceCommand(intent: string, entities: Record<string, string>): void {
    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      for (const trigger of rule.triggers) {
        if (trigger.type === 'voice' && trigger.intent === intent) {
          this.triggerRule(rule.id, trigger, { intent, entities });
        }
      }
    }
  }

  async triggerRule(
    ruleId: string,
    trigger: RuleTrigger,
    triggerData: Record<string, unknown> = {}
  ): Promise<RuleExecutionResult | null> {
    const rule = this.rules.get(ruleId);
    if (!rule || !rule.enabled) {
      return null;
    }

    const executionId = crypto.randomUUID();
    const context: RuleExecutionContext = {
      ruleId,
      executionId,
      trigger,
      triggerData,
      timestamp: new Date().toISOString() as ISOTimestamp,
      variables: new Map(this.variables),
    };

    this.emit('rule:triggered', ruleId, trigger);
    return this.executeRule(rule, context);
  }

  // ============================================================================
  // Rule Execution
  // ============================================================================

  private async executeRule(
    rule: AutomationRule,
    context: RuleExecutionContext
  ): Promise<RuleExecutionResult> {
    const startTime = new Date().toISOString() as ISOTimestamp;
    const startMs = performance.now();

    this.emit('rule:executing', rule.id, context.executionId);

    const conditionResults: ConditionEvaluationResult[] = [];
    const actionResults: ActionExecutionResult[] = [];

    try {
      // Evaluate conditions
      let conditionsMet = true;
      for (const condition of rule.conditions) {
        const result = await this.evaluateCondition(condition, context);
        conditionResults.push(result);

        if (!result.result) {
          conditionsMet = false;
          break; // Short-circuit on first false condition
        }
      }

      // Execute actions if conditions met
      if (conditionsMet) {
        for (const action of rule.actions) {
          const result = await this.executeAction(action, context);
          actionResults.push(result);

          if (!result.success) {
            // Continue or stop based on configuration
            // For now, continue executing remaining actions
          }
        }
      }

      // Update rule metadata
      rule.metadata.executionCount++;
      rule.metadata.lastExecuted = new Date().toISOString() as ISOTimestamp;
      if (actionResults.every(r => r.success)) {
        rule.metadata.lastSuccess = rule.metadata.lastExecuted;
      }

      const result: RuleExecutionResult = {
        executionId: context.executionId,
        ruleId: rule.id,
        ruleName: rule.name,
        trigger: context.trigger,
        success: true,
        startTime,
        endTime: new Date().toISOString() as ISOTimestamp,
        duration: performance.now() - startMs,
        conditionsEvaluated: conditionResults,
        conditionsMet,
        actionsExecuted: actionResults,
      };

      this.executionHistory.unshift(result);
      this.trimExecutionHistory();

      this.emit('rule:completed', result);
      return result;
    } catch (error) {
      rule.metadata.lastFailure = new Date().toISOString() as ISOTimestamp;

      const result: RuleExecutionResult = {
        executionId: context.executionId,
        ruleId: rule.id,
        ruleName: rule.name,
        trigger: context.trigger,
        success: false,
        startTime,
        endTime: new Date().toISOString() as ISOTimestamp,
        duration: performance.now() - startMs,
        conditionsEvaluated: conditionResults,
        conditionsMet: false,
        actionsExecuted: actionResults,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      this.emit('rule:failed', rule.id, error as Error);
      return result;
    }
  }

  // ============================================================================
  // Condition Evaluation
  // ============================================================================

  private async evaluateCondition(
    condition: RuleCondition,
    context: RuleExecutionContext
  ): Promise<ConditionEvaluationResult> {
    try {
      const result = await this.evaluateConditionInternal(condition, context);
      return {
        condition,
        result,
      };
    } catch (error) {
      return {
        condition,
        result: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async evaluateConditionInternal(
    condition: RuleCondition,
    context: RuleExecutionContext
  ): Promise<boolean> {
    switch (condition.type) {
      case 'device':
        return this.evaluateDeviceCondition(condition, context);

      case 'time':
        return this.evaluateTimeCondition(condition);

      case 'user':
        return this.evaluateUserCondition(condition);

      case 'weather':
        return this.evaluateWeatherCondition(condition);

      case 'state':
        return this.evaluateStateCondition(condition, context);

      case 'compound':
        return this.evaluateCompoundCondition(condition, context);

      case 'template':
        return this.evaluateTemplateCondition(condition, context);

      default:
        return false;
    }
  }

  private evaluateDeviceCondition(
    condition: { deviceId: DeviceId; property: string; operator: ComparisonOperator; value: unknown },
    context: RuleExecutionContext
  ): boolean {
    // Get device state from store
    // const deviceState = deviceStore.getState(condition.deviceId);
    // const actualValue = deviceState?.values?.[condition.property];
    const actualValue = context.triggerData[condition.property]; // Simplified

    return this.compareValues(actualValue, condition.operator, condition.value);
  }

  private evaluateTimeCondition(
    condition: { constraint: { type: string; [key: string]: unknown } }
  ): boolean {
    const now = new Date();
    const constraint = condition.constraint;

    switch (constraint.type) {
      case 'between': {
        const [startH, startM] = (constraint.start as string).split(':').map(Number);
        const [endH, endM] = (constraint.end as string).split(':').map(Number);
        const current = now.getHours() * 60 + now.getMinutes();
        const start = startH * 60 + startM;
        const end = endH * 60 + endM;

        if (start <= end) {
          return current >= start && current <= end;
        } else {
          // Overnight range (e.g., 22:00 - 06:00)
          return current >= start || current <= end;
        }
      }

      case 'day_of_week':
        return (constraint.days as number[]).includes(now.getDay());

      case 'before': {
        const [h, m] = (constraint.time as string).split(':').map(Number);
        const current = now.getHours() * 60 + now.getMinutes();
        return current < h * 60 + m;
      }

      case 'after': {
        const [h, m] = (constraint.time as string).split(':').map(Number);
        const current = now.getHours() * 60 + now.getMinutes();
        return current > h * 60 + m;
      }

      default:
        return true;
    }
  }

  private evaluateUserCondition(
    condition: { constraint: { type: string; [key: string]: unknown } }
  ): boolean {
    // In production, check user presence store
    // const presence = presenceStore.getState();
    // ... evaluate based on constraint.type

    return true; // Simplified
  }

  private evaluateWeatherCondition(
    condition: { property: string; operator: ComparisonOperator; value: unknown }
  ): boolean {
    // In production, get weather data
    // const weather = weatherStore.getState();
    // const actualValue = weather[condition.property];

    return true; // Simplified
  }

  private evaluateStateCondition(
    condition: { path: string; operator: ComparisonOperator; value: unknown },
    context: RuleExecutionContext
  ): boolean {
    // Get value from state path
    const actualValue = this.getValueByPath(context.triggerData, condition.path);
    return this.compareValues(actualValue, condition.operator, condition.value);
  }

  private async evaluateCompoundCondition(
    condition: { operator: 'and' | 'or' | 'not'; conditions: RuleCondition[] },
    context: RuleExecutionContext
  ): Promise<boolean> {
    switch (condition.operator) {
      case 'and':
        for (const c of condition.conditions) {
          if (!(await this.evaluateConditionInternal(c, context))) {
            return false;
          }
        }
        return true;

      case 'or':
        for (const c of condition.conditions) {
          if (await this.evaluateConditionInternal(c, context)) {
            return true;
          }
        }
        return false;

      case 'not':
        return !(await this.evaluateConditionInternal(condition.conditions[0], context));

      default:
        return false;
    }
  }

  private evaluateTemplateCondition(
    condition: { expression: string },
    context: RuleExecutionContext
  ): boolean {
    // WARNING: eval is dangerous. In production, use a safe expression evaluator
    // like expr-eval or math.js
    try {
      const func = new Function(
        'trigger',
        'variables',
        'devices',
        'time',
        `return ${condition.expression}`
      );
      return !!func(
        context.triggerData,
        Object.fromEntries(context.variables),
        {}, // devices
        new Date()
      );
    } catch {
      return false;
    }
  }

  // ============================================================================
  // Action Execution
  // ============================================================================

  private async executeAction(
    action: RuleAction,
    context: RuleExecutionContext
  ): Promise<ActionExecutionResult> {
    const startMs = performance.now();
    this.emit('action:executing', context.ruleId, action);

    try {
      const result = await this.executeActionInternal(action, context);

      this.emit('action:completed', context.ruleId, action, result);

      return {
        action,
        success: true,
        duration: performance.now() - startMs,
        result,
      };
    } catch (error) {
      this.emit('action:failed', context.ruleId, action, error as Error);

      return {
        action,
        success: false,
        duration: performance.now() - startMs,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async executeActionInternal(
    action: RuleAction,
    context: RuleExecutionContext
  ): Promise<unknown> {
    switch (action.type) {
      case 'device':
        return this.executeDeviceAction(action, context);

      case 'scene':
        return this.executeSceneAction(action, context);

      case 'notification':
        return this.executeNotificationAction(action, context);

      case 'delay':
        await new Promise(resolve => setTimeout(resolve, action.duration * 1000));
        return;

      case 'wait':
        return this.executeWaitAction(action, context);

      case 'conditional':
        return this.executeConditionalAction(action, context);

      case 'loop':
        return this.executeLoopAction(action, context);

      case 'rule':
        return this.executeRuleAction(action);

      case 'variable':
        return this.executeVariableAction(action, context);

      default:
        throw new Error(`Unknown action type: ${(action as RuleAction).type}`);
    }
  }

  private async executeDeviceAction(
    action: { deviceId: DeviceId | string; command: string; parameters: Record<string, unknown>; transition?: number },
    context: RuleExecutionContext
  ): Promise<unknown> {
    const deviceId = this.resolveTemplate(action.deviceId, context);

    // Send command via bridge manager
    // const result = await bridgeManager.sendCommand({
    //   deviceId: deviceId as DeviceId,
    //   command: action.command,
    //   parameters: this.resolveTemplateObject(action.parameters, context),
    //   priority: 'normal',
    // });

    console.log(`Execute device action: ${deviceId} ${action.command}`, action.parameters);
    return { success: true };
  }

  private async executeSceneAction(
    action: { sceneId: string; transition?: number },
    context: RuleExecutionContext
  ): Promise<unknown> {
    const sceneId = this.resolveTemplate(action.sceneId, context);
    console.log(`Activate scene: ${sceneId}`);
    return { success: true };
  }

  private async executeNotificationAction(
    action: { recipients: (UserId | 'all' | 'owners')[]; title: string; body: string; priority: string; sound?: string },
    context: RuleExecutionContext
  ): Promise<unknown> {
    const title = this.resolveTemplate(action.title, context);
    const body = this.resolveTemplate(action.body, context);

    console.log(`Send notification: ${title} - ${body}`);
    return { success: true };
  }

  private async executeWaitAction(
    action: { condition: RuleCondition; timeout: number },
    context: RuleExecutionContext
  ): Promise<unknown> {
    const startTime = Date.now();
    const timeout = action.timeout * 1000;

    while (Date.now() - startTime < timeout) {
      if (await this.evaluateConditionInternal(action.condition, context)) {
        return { waitedFor: Date.now() - startTime };
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    throw new Error('Wait timeout exceeded');
  }

  private async executeConditionalAction(
    action: { if: RuleCondition; then: RuleAction[]; else?: RuleAction[] },
    context: RuleExecutionContext
  ): Promise<unknown> {
    const conditionMet = await this.evaluateConditionInternal(action.if, context);
    const actionsToExecute = conditionMet ? action.then : (action.else ?? []);

    for (const act of actionsToExecute) {
      await this.executeAction(act, context);
    }

    return { conditionMet };
  }

  private async executeLoopAction(
    action: { iterations: number | 'until_condition'; condition?: RuleCondition; actions: RuleAction[]; delay?: number },
    context: RuleExecutionContext
  ): Promise<unknown> {
    let iteration = 0;
    const maxIterations = typeof action.iterations === 'number' ? action.iterations : 100;

    while (iteration < maxIterations) {
      if (action.iterations === 'until_condition' && action.condition) {
        if (await this.evaluateConditionInternal(action.condition, context)) {
          break;
        }
      }

      for (const act of action.actions) {
        await this.executeAction(act, context);
      }

      if (action.delay) {
        await new Promise(resolve => setTimeout(resolve, action.delay * 1000));
      }

      iteration++;
    }

    return { iterations: iteration };
  }

  private async executeRuleAction(
    action: { action: 'enable' | 'disable' | 'trigger'; ruleId: string }
  ): Promise<unknown> {
    switch (action.action) {
      case 'enable':
        this.enableRule(action.ruleId);
        break;
      case 'disable':
        this.disableRule(action.ruleId);
        break;
      case 'trigger':
        await this.triggerRule(action.ruleId, { type: 'event', source: { type: 'system' }, event: 'manual_trigger' });
        break;
    }
    return { success: true };
  }

  private executeVariableAction(
    action: { action: 'set' | 'increment' | 'decrement' | 'append' | 'remove'; name: string; value?: unknown },
    context: RuleExecutionContext
  ): unknown {
    switch (action.action) {
      case 'set':
        context.variables.set(action.name, action.value);
        this.variables.set(action.name, action.value);
        break;
      case 'increment':
        const incVal = (context.variables.get(action.name) as number || 0) + (action.value as number || 1);
        context.variables.set(action.name, incVal);
        this.variables.set(action.name, incVal);
        break;
      case 'decrement':
        const decVal = (context.variables.get(action.name) as number || 0) - (action.value as number || 1);
        context.variables.set(action.name, decVal);
        this.variables.set(action.name, decVal);
        break;
    }
    return { value: context.variables.get(action.name) };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private setupScheduleTrigger(ruleId: string, trigger: { type: 'schedule'; schedule: any }): void {
    const schedule = trigger.schedule;

    if (schedule.type === 'time') {
      const [hours, minutes] = schedule.time.split(':').map(Number);
      const now = new Date();
      let next = new Date(now);
      next.setHours(hours, minutes, 0, 0);

      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }

      const delay = next.getTime() - now.getTime();
      const timeout = setTimeout(() => {
        this.triggerRule(ruleId, trigger, {});
        // Reschedule for next day
        this.setupScheduleTrigger(ruleId, trigger);
      }, delay);

      this.scheduledTriggers.set(ruleId, timeout);
    } else if (schedule.type === 'interval') {
      const ms = schedule.interval * (
        schedule.unit === 'seconds' ? 1000 :
        schedule.unit === 'minutes' ? 60000 :
        3600000
      );
      const timeout = setInterval(() => {
        this.triggerRule(ruleId, trigger, {});
      }, ms);

      this.scheduledTriggers.set(ruleId, timeout);
    }
  }

  private matchesEventTrigger(
    trigger: { source: any; event: string; filter?: Record<string, unknown> },
    eventType: string,
    eventData: Record<string, unknown>
  ): boolean {
    if (trigger.event !== eventType && trigger.event !== '*') {
      return false;
    }

    if (trigger.filter) {
      for (const [key, value] of Object.entries(trigger.filter)) {
        if (eventData[key] !== value) {
          return false;
        }
      }
    }

    return true;
  }

  private matchesStateTrigger(
    trigger: { source: any; property: string; operator: ComparisonOperator; value: unknown },
    eventData: Record<string, unknown>
  ): boolean {
    const actualValue = eventData[trigger.property];
    return this.compareValues(actualValue, trigger.operator, trigger.value);
  }

  private compareValues(actual: unknown, operator: ComparisonOperator, expected: unknown): boolean {
    switch (operator) {
      case 'eq':
        return actual === expected;
      case 'ne':
        return actual !== expected;
      case 'gt':
        return (actual as number) > (expected as number);
      case 'gte':
        return (actual as number) >= (expected as number);
      case 'lt':
        return (actual as number) < (expected as number);
      case 'lte':
        return (actual as number) <= (expected as number);
      case 'contains':
        return String(actual).includes(String(expected));
      case 'starts_with':
        return String(actual).startsWith(String(expected));
      case 'ends_with':
        return String(actual).endsWith(String(expected));
      case 'in':
        return Array.isArray(expected) && expected.includes(actual);
      case 'not_in':
        return Array.isArray(expected) && !expected.includes(actual);
      case 'matches':
        return new RegExp(String(expected)).test(String(actual));
      default:
        return false;
    }
  }

  private getValueByPath(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((current: any, key) => current?.[key], obj);
  }

  private resolveTemplate(template: string, context: RuleExecutionContext): string {
    return template.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, expr) => {
      try {
        const value = this.evaluateExpression(expr.trim(), context);
        return String(value);
      } catch {
        return '';
      }
    });
  }

  private resolveTemplateObject(
    obj: Record<string, unknown>,
    context: RuleExecutionContext
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        result[key] = this.resolveTemplate(value, context);
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  private evaluateExpression(expr: string, context: RuleExecutionContext): unknown {
    // Simple variable lookup
    if (expr.startsWith('trigger.')) {
      return this.getValueByPath(context.triggerData, expr.substring(8));
    }
    if (expr.startsWith('variables.')) {
      return context.variables.get(expr.substring(10));
    }
    return expr;
  }

  private trimExecutionHistory(): void {
    if (this.executionHistory.length > 1000) {
      this.executionHistory = this.executionHistory.slice(0, 500);
    }
  }

  getExecutionHistory(): RuleExecutionResult[] {
    return [...this.executionHistory];
  }

  clearExecutionHistory(): void {
    this.executionHistory = [];
  }
}

// Export singleton factory
export function createRuleEngine(config?: Partial<RuleEngineConfig>): RuleEngine {
  const defaultConfig: RuleEngineConfig = {
    maxConcurrentExecutions: 10,
    defaultTimeout: 30,
    maxActionsPerRule: 50,
    maxConditionsPerRule: 20,
    rateLimiting: {
      enabled: true,
      maxExecutionsPerMinute: 100,
      maxExecutionsPerHour: 1000,
    },
    logging: {
      level: 'info',
      retainDays: 30,
    },
  };

  return new RuleEngine({ ...defaultConfig, ...config });
}
