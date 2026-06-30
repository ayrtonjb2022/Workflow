import { EventEmitter } from "node:events";

/**
 * DomainEvent represents an event that occurred within a bounded context.
 *
 * Every event carries a tenantId for multi-tenant routing and filtering,
 * a timestamp for ordering, and a payload whose shape is defined by the event name.
 */
export interface DomainEvent {
  name: string;
  payload: unknown;
  tenantId: string;
  timestamp: Date;
}

/**
 * EventBus provides an in-process pub/sub mechanism using Node.js EventEmitter.
 *
 * Services emit domain events; listeners react. This decouples modules — they
 * communicate through events rather than direct imports.
 *
 * v1 notes:
 * - In-process only — events are LOST on crash. No durability.
 * - Migration path: swap the EventEmitter internals for RabbitMQ/NATS.
 *   The emit/on interface stays identical; module code does not change.
 */
export class EventBus {
  private emitter = new EventEmitter();

  emit(event: DomainEvent): void {
    this.emitter.emit(event.name, event);
  }

  on(eventName: string, handler: (event: DomainEvent) => void): void {
    this.emitter.on(eventName, handler);
  }

  off(eventName: string, handler: (event: DomainEvent) => void): void {
    this.emitter.off(eventName, handler);
  }
}

/** Application-wide singleton event bus instance. */
export const bus = new EventBus();
