"use client";

let actorUserId: string | undefined;

export function setCurrentActorId(id?: string) {
  actorUserId = id;
}

export function getCurrentActorId() {
  return actorUserId;
}

export function withActor<T extends Record<string, unknown>>(body: T) {
  const id = getCurrentActorId();
  return id ? { ...body, actorUserId: id } : body;
}
