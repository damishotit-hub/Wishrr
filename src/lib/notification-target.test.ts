import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { notificationTarget } from "./notification-target";

const id = "12345678-1234-1234-1234-123456789abc";
describe("notification destinations", () => {
  it("opens the relevant wish for support and funding alerts", () => {
    assert.deepEqual(notificationTarget(`/wish/${id}`), { to: "/wish/$id", params: { id }, kind: "wish" });
  });
  it("opens the relevant one-to-one chat", () => {
    assert.deepEqual(notificationTarget(`/messages/${id}`), { to: "/messages/$id", params: { id }, kind: "message" });
  });
  it("opens the relevant giveaway", () => {
    assert.deepEqual(notificationTarget(`/giveaways/${id}`), { to: "/giveaways/$id", params: { id }, kind: "giveaway" });
  });
  it("never follows external or unsupported notification links", () => {
    for (const link of [null, "https://example.com", "//example.com", "/admin", `/wish/${id}/extra`]) assert.equal(notificationTarget(link), null);
  });
});