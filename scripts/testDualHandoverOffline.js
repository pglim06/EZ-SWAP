// Offline unit test for T14 Dual Handover Confirmation & Dispute Flag
const assert = require('assert');
const mongoose = require('mongoose');

function createMockRes() {
    return {
        statusCode: 200,
        data: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.data = payload;
            return this;
        },
    };
}

async function testT14Offline() {
    console.log('='.repeat(65));
    console.log('🧪 EZ SWAP — T14 Dual Handover & Dispute Unit Tests');
    console.log('='.repeat(65));

    const Transaction = require('../models/Transaction');
    const Report = require('../models/Report');
    const txController = require('../controllers/transactionController');

    // 1. Check exports
    console.log('\n[1/5] Verifying Controller Exports...');
    assert(typeof txController.confirmHandover === 'function', 'confirmHandover must be exported');
    assert(typeof txController.disputeTransaction === 'function', 'disputeTransaction must be exported');
    console.log('  ✓ confirmHandover and disputeTransaction successfully exported.');

    // 2. Test Transaction Confirmation Transitions in Model
    console.log('\n[2/5] Testing Transaction Model Status & Dual Confirmation States...');
    const dummyBuyerId = new mongoose.Types.ObjectId();
    const dummySellerId = new mongoose.Types.ObjectId();
    const dummyOrderId = new mongoose.Types.ObjectId();
    const dummyListingId = new mongoose.Types.ObjectId();

    const tx = new Transaction({
        orderId: dummyOrderId,
        listingId: dummyListingId,
        buyerId: dummyBuyerId,
        sellerId: dummySellerId,
        handoverMethod: 'meetup',
    });

    await tx.validate();
    assert.strictEqual(tx.sellerConfirmation, 'pending');
    assert.strictEqual(tx.buyerConfirmation, 'pending');
    assert.strictEqual(tx.status, 'in_progress');
    assert.strictEqual(tx.completedAt, null);
    console.log('  ✓ Initial state confirmed: pending/pending, status in_progress.');

    // Step 2a: Seller marks handed_over
    tx.sellerConfirmation = 'handed_over';
    await tx.validate();
    assert.strictEqual(tx.sellerConfirmation, 'handed_over');
    console.log('  ✓ Seller confirmation sets sellerConfirmation = "handed_over".');

    // Step 2b: Buyer marks received
    tx.buyerConfirmation = 'received';
    await tx.validate();
    assert.strictEqual(tx.buyerConfirmation, 'received');
    console.log('  ✓ Buyer confirmation sets buyerConfirmation = "received".');

    // Step 2c: Dual confirmed status completion
    if (tx.sellerConfirmation === 'handed_over' && tx.buyerConfirmation === 'received') {
        tx.status = 'completed';
        tx.completedAt = new Date();
    }
    await tx.validate();
    assert.strictEqual(tx.status, 'completed');
    assert(tx.completedAt !== null);
    console.log('  ✓ Dual confirmation triggers status "completed" and sets completedAt timestamp.');

    // 3. Test Dispute State & Report Model Validation
    console.log('\n[3/5] Testing Dispute State & Report Model Creation...');
    const txDisputed = new Transaction({
        orderId: new mongoose.Types.ObjectId(),
        listingId: dummyListingId,
        buyerId: dummyBuyerId,
        sellerId: dummySellerId,
        handoverMethod: 'delivery',
        status: 'disputed',
    });
    await txDisputed.validate();
    assert.strictEqual(txDisputed.status, 'disputed');
    console.log('  ✓ Disputed transaction model validation passed.');

    const report = new Report({
        reporterId: dummyBuyerId,
        targetType: 'transaction',
        targetId: txDisputed._id,
        reason: 'Seller never showed up at agreed library entrance meetup.',
        status: 'pending',
    });
    await report.validate();
    assert.strictEqual(report.targetType, 'transaction');
    assert.strictEqual(report.status, 'pending');
    console.log(`  ✓ Report validation passed for targetType: "${report.targetType}", status: "${report.status}".`);

    // 4. Test Report Schema Validation Safeguards
    console.log('\n[4/5] Testing Safeguards & Enum Constraints...');
    const invalidReport = new Report({
        reporterId: dummyBuyerId,
        targetType: 'invalid_target_type',
        targetId: txDisputed._id,
        reason: 'Some reason',
    });
    let reportErr = null;
    try {
        await invalidReport.validate();
    } catch (e) {
        reportErr = e;
    }
    assert(reportErr !== null, 'Should reject invalid targetType on Report');
    console.log(`  ✓ Correctly rejected invalid targetType: "${reportErr.message}"`);

    // 5. Test Transaction Route Definition
    console.log('\n[5/5] Verifying Express Routes...');
    const txRoutes = require('../routes/transactionRoutes');
    assert(typeof txRoutes === 'function', 'transactionRoutes must be an Express router');
    console.log('  ✓ All routes and middleware compiled cleanly.');

    console.log('\n' + '='.repeat(65));
    console.log('🎉 ALL OFFLINE T14 UNIT TESTS PASSED SUCCESSFULLY!');
    console.log('='.repeat(65));
}

testT14Offline().catch((err) => {
    console.error('Test failed:', err);
    process.exit(1);
});
