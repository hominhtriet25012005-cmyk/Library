import assert from "node:assert/strict";
import test from "node:test";
import { createFinesApi } from "../src/api/fines.js";
import { canPayFine, filterFines, fineOutstanding, fineSummary, fineStatusLabels, fineTypeLabels } from "../src/pages/Fines/fineRules.js";

test("API tiền phạt chỉ đọc khoản của USER và mã lọc đúng backend", async () => {
  const calls = [];
  const api = createFinesApi({ get: async (path, options) => { calls.push([path, options]); return []; } });
  const options = { signal: "test-signal" };
  await api.mine({}, options);
  await api.mine({ status: "PARTIALLY_PAID", type: "LOSS" }, options);
  assert.deepEqual(calls, [
    ["/api/fines/my", options],
    ["/api/fines/my?status=PARTIALLY_PAID&type=LOSS", options],
  ]);
});

test("trạng thái và loại tiền phạt bám enum backend, không tự suy ra payment PROCESSING", () => {
  assert.deepEqual(Object.keys(fineStatusLabels).sort(), ["PAID", "PARTIALLY_PAID", "PENDING", "WAIVED"]);
  assert.deepEqual(Object.keys(fineTypeLabels).sort(), ["DAMAGE", "LOSS", "OVERDUE", "PROCESSING"]);
  assert.equal(fineTypeLabels.LOSS, "Làm mất sách");
});

test("chỉ khoản còn nợ chưa được miễn hoặc trả hết mới có đường mở thanh toán", () => {
  const pending = { status: "PENDING", amount: 100000, amountPaid: 0, amountOutstanding: 100000 };
  const partial = { status: "PARTIALLY_PAID", amount: 100000, amountPaid: 40000, amountOutstanding: 60000 };
  const paid = { status: "PAID", amount: 100000, amountPaid: 100000, amountOutstanding: 0 };
  const waived = { status: "WAIVED", amount: 100000, amountPaid: 0, amountOutstanding: 0 };
  assert.equal(canPayFine(pending), true);
  assert.equal(canPayFine(partial), true);
  assert.equal(canPayFine(paid), false);
  assert.equal(canPayFine(waived), false);
  assert.equal(fineOutstanding(waived), 0);
  assert.equal(fineOutstanding({ ...partial, amountOutstanding: null }), 60000);
  assert.deepEqual(fineSummary([pending, partial, paid, waived]), { total: 4, payable: 2, outstanding: 160000 });
});

test("lọc trạng thái và loại trên dữ liệu USER mà không sửa danh sách gốc", () => {
  const fines = [
    { id: 1, status: "PENDING", type: "OVERDUE" },
    { id: 2, status: "PAID", type: "OVERDUE" },
    { id: 3, status: "PENDING", type: "DAMAGE" },
  ];
  assert.deepEqual(filterFines(fines, { status: "PENDING", type: "OVERDUE" }).map((fine) => fine.id), [1]);
  assert.deepEqual(filterFines(fines, { status: "ALL", type: "OVERDUE" }).map((fine) => fine.id), [1, 2]);
  assert.equal(fines.length, 3);
});
