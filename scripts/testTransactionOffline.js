// Offline unit test for T13 Transaction generation and Handover logic
const assert = require('assert');
const mongoose = require('mongoose');

// Mock response creator
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

async function testT13Offline() {
    console.log('='.repeat(60));
    console.log('🧪 EZ SWAP — T13 Transaction Model & Logic Unit Test');
    console.log('='.repeat(60));

    const Transaction = require('../models/Transaction');

    // 1. Test Transaction Code Generation
    console.log('\n[1/4] Testing Transaction Model Code Generation...');
    const dummyOrderId = new mongoose.Types.ObjectId();
    const dummyListingId = new mongoose.Types.ObjectId();
    const dummyBuyerId = new mongoose.Types.ObjectId();
    const dummySellerId = new mongoose.Types.ObjectId();

    const tx = new Transaction({
        orderId: dummyOrderId,
        listingId: dummyListingId,
        buyerId: dummyBuyerId,
        sellerId: dummySellerId,
        handoverMethod: 'meetup',
    });

    await tx.validate();
    console.log(`  ✓ Auto-generated Transaction Code: [${tx.transactionCode}]`);
    assert(tx.transactionCode.startsWith('TRX-'), 'transactionCode should start with TRX-');
    assert(tx.status === 'in_progress', 'Initial status should be in_progress');
    assert(tx.sellerConfirmation === 'pending', 'Seller confirmation should default to pending');
    assert(tx.buyerConfirmation === 'pending', 'Buyer confirmation should default to pending');

    // 2. Test Meetup Schedule fields
    console.log('\n[2/4] Testing Meetup Schedule Field Setters...');
    const testTime = new Date('2026-11-26T14:30:00Z');
    tx.meetupLocation = 'UTM Perpustakaan Sultanah Zanariah (PSZ)';
    tx.meetupTime = testTime;
    tx.meetupNotes = 'Meet near ground floor entrance';
    await tx.validate();

    assert.strictEqual(tx.meetupLocation, 'UTM Perpustakaan Sultanah Zanariah (PSZ)');
    assert.strictEqual(tx.meetupTime.toISOString(), testTime.toISOString());
    console.log(`  ✓ Scheduled Location: "${tx.meetupLocation}"`);
    console.log(`  ✓ Scheduled Time:     ${tx.meetupTime.toISOString()}`);
    console.log(`  ✓ Notes:              "${tx.meetupNotes}"`);

    // 3. Test Invalid Handover Method Validation
    console.log('\n[3/4] Testing Validation Safeguards...');
    tx.handoverMethod = 'teleportation';
    let caughtErr = null;
    try {
        await tx.validate();
    } catch (e) {
        caughtErr = e;
    }
    assert(caughtErr !== null, 'Should fail validation on invalid handoverMethod');
    console.log(`  ✓ Correctly rejected invalid handoverMethod: "${caughtErr.message}"`);

    // Reset valid method
    tx.handoverMethod = 'delivery';
    await tx.validate();
    console.log(`  ✓ Correctly accepted valid handoverMethod: "${tx.handoverMethod}"`);

    // 4. Test Controller Signature and Routing Export Checks
    console.log('\n[4/4] Verifying Controller & Route Exports...');
    const txController = require('../controllers/transactionController');
    assert(typeof txController.getTransactions === 'function', 'getTransactions must be exported');
    assert(typeof txController.getTransactionById === 'function', 'getTransactionById must be exported');
    assert(typeof txController.getTransactionByOrderId === 'function', 'getTransactionByOrderId must be exported');
    assert(typeof txController.updateHandoverDetails === 'function', 'updateHandoverDetails must be exported');
    console.log('  ✓ All 4 transactionController methods properly exported.');

    const txRoutes = require('../routes/transactionRoutes');
    assert(typeof txRoutes === 'function', 'transactionRoutes must be Express router');
    console.log('  ✓ transactionRoutes properly defined as Express router.');

    console.log('\n' + '='.repeat(60));
    console.log('🎉 ALL OFFLINE UNIT CHECKS PASSED SUCCESSFULLY!');
    console.log('='.repeat(60));
}

testT13Offline().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
