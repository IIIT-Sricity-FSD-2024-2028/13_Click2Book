"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateId = generateId;
let counters = {};
function generateId(prefix) {
    if (!counters[prefix])
        counters[prefix] = 1;
    const id = `${prefix}${String(counters[prefix]).padStart(3, '0')}`;
    counters[prefix]++;
    return id;
}
//# sourceMappingURL=id.util.js.map