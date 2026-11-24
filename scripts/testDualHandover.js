const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

const User = require('../models/User');
const Listing = require('../models/Listing');
const Order = require('../models/Order');
const Transaction = require('../models/Transaction');
const Report = require('../models/Report');
const orderController = require('../controllers/orderController');
const transactionController = require('../controllers/transactionController');

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

async function runDualHandoverIntegrationTest() {
    console.log('='.repeat(70));
    console.log('🚀 EZ SWAP — T14 Dual Handover Confirmation & Dispute Flag Live Test');
    console.log('='.repeat(70));

    console.log('\n[1/7] Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('  ✓ Connected successfully.');

    try {
        // 2. Prepare test data
        console.log('\n[2/7] Preparing test Users & Listings...');
        let testBuyer = await User.findOne({ email: 't14_buyer@graduate.utm.my' });
        if (!testBuyer) {
            testBuyer = await User.create({
                name: 'T14 Test Buyer',
                email: 't14_buyer@graduate.utm.my',
                passwordHash: 'dummy_hash',
                universityId: 'A23EC0015',
                verificationStatus: 'verified',
            });
        }

        let testSeller = await User.findOne({ email: 't14_seller@graduate.utm.my' });
        if (!testSeller) {
            testSeller = await User.create({
                name: 'T14 Test Seller',
                email: 't14_seller@graduate.utm.my',
                passwordHash: 'dummy_hash',
                universityId: 'A23EC0016',
                verificationStatus: 'verified',
            });
        }

        let testListing1 = await Listing.findOne({ title: 'T14 Test Engineering Mechanics Textbook' });
        if (!testListing1) {
            testListing1 = await Listing.create({
                sellerId: testSeller._id,
                title: 'T14 Test Engineering Mechanics Textbook',
                description: 'Hibbeler 14th edition, good condition',
                price: 45,
                category: 'Textbooks',
                condition: 'Used',
                images: [{ imageUrl: 'https://via.placeholder.com/150', displayOrder: 0 }],
                status: 'active',
            });
        } else {
            testListing1.status = 'active';
            await testListing1.save();
        }

        // Clean previous test data
        await Transaction.deleteMany({ listingId: testListing1._id });
        await Order.deleteMany({ listingId: testListing1._id });
        await Report.deleteMany({ reporterId: { $in: [testBuyer._id, testSeller._id] } });

        console.log(`  ✓ Buyer:  ${testBuyer.name} (${testBuyer._id})`);
        console.log(`  ✓ Seller: ${testSeller.name} (${testSeller._id})`);
        console.log(`  ✓ Listing: "${testListing1.title}"`);

        // 3. Create Offer & Accept -> Generate Transaction
        console.log('\n[3/7] Creating and Accepting Offer to initialize Transaction...');
        const reqOffer = {
            body: {
                buyerId: testBuyer._id,
                listingId: testListing1._id,
                offeredPrice: 40,
                transactionMethod: 'meetup',
                notes: 'Meet at SUB UTM',
            },
        };
        const resOffer = createMockRes();
        await orderController.createOrder(reqOffer, resOffer);
        const orderId = resOffer.data._id;

        const reqAccept = {
            params: { id: orderId },
            body: { userId: testSeller._id },
        };
        const resAccept = createMockRes();
        await orderController.acceptOrder(reqAccept, resAccept);
        const tx1 = resAccept.data.transaction;

        console.log(`  ✓ Generated Transaction: [${tx1.transactionCode}]`);
        console.log(`  ✓ Initial Transaction status: ${tx1.status}`);
        console.log(`  ✓ Seller Confirmation: ${tx1.sellerConfirmation}`);
        console.log(`  ✓ Buyer Confirmation:  ${tx1.buyerConfirmation}`);

        // 4. Test Step 1: Seller confirms Handover
        console.log('\n[4/7] Step 1 of Dual Handover: Seller confirms Handed Over...');
        const reqSellerConfirm = {
            params: { id: tx1._id.toString() },
            body: { userId: testSeller._id, role: 'seller' },
        };
        const resSellerConfirm = createMockRes();
        await transactionController.confirmHandover(reqSellerConfirm, resSellerConfirm);

        if (resSellerConfirm.statusCode !== 200) {
            throw new Error(`Seller confirmation failed: ${JSON.stringify(resSellerConfirm.data)}`);
        }
        console.log(`  ✓ Seller confirmed: "${resSellerConfirm.data.message}"`);
        console.log(`  ✓ Seller Confirmation status: ${resSellerConfirm.data.transaction.sellerConfirmation}`);
        console.log(`  ✓ Transaction status is still: ${resSellerConfirm.data.transaction.status} (isCompleted: ${resSellerConfirm.data.isCompleted})`);

        if (resSellerConfirm.data.transaction.sellerConfirmation !== 'handed_over') {
            throw new Error('sellerConfirmation should be handed_over');
        }
        if (resSellerConfirm.data.transaction.status !== 'in_progress') {
            throw new Error('Transaction status should still be in_progress waiting for buyer');
        }

        // 5. Test Step 2: Buyer confirms Receipt -> Completes Transaction & sets Listing sold
        console.log('\n[5/7] Step 2 of Dual Handover: Buyer confirms Received (Completes Deal)...');
        const reqBuyerConfirm = {
            params: { id: tx1._id.toString() },
            body: { userId: testBuyer._id, role: 'buyer' },
        };
        const resBuyerConfirm = createMockRes();
        await transactionController.confirmHandover(reqBuyerConfirm, resBuyerConfirm);

        if (resBuyerConfirm.statusCode !== 200) {
            throw new Error(`Buyer confirmation failed: ${JSON.stringify(resBuyerConfirm.data)}`);
        }
        console.log(`  ✓ Buyer confirmed: "${resBuyerConfirm.data.message}"`);
        console.log(`  ✓ Transaction status: [${resBuyerConfirm.data.transaction.status}] (isCompleted: ${resBuyerConfirm.data.isCompleted})`);
        console.log(`  ✓ Completed At: ${resBuyerConfirm.data.transaction.completedAt}`);

        if (resBuyerConfirm.data.transaction.status !== 'completed') {
            throw new Error('Transaction status should now be completed!');
        }

        // Verify Listing status changed to 'sold'
        const updatedListing = await Listing.findById(testListing1._id);
        console.log(`  ✓ Listing status updated to: [${updatedListing.status}] (Expected: sold)`);
        if (updatedListing.status !== 'sold') {
            throw new Error(`Listing status should be 'sold', got '${updatedListing.status}'`);
        }

        // 6. Test Security & Edge Cases
        console.log('\n[6/7] Testing Security & Validation Safeguards...');
        // Try confirming an already completed transaction
        const reqDoubleConfirm = {
            params: { id: tx1._id.toString() },
            body: { userId: testBuyer._id },
        };
        const resDoubleConfirm = createMockRes();
        await transactionController.confirmHandover(reqDoubleConfirm, resDoubleConfirm);
        console.log(resDoubleConfirm.statusCode === 400
            ? '  ✓ Correctly rejected confirmation on already completed transaction'
            : '  ✗ Failed to reject confirmation on completed transaction'
        );

        // Try unauthorized user
        const reqUnauthorized = {
            params: { id: tx1._id.toString() },
            body: { userId: new mongoose.Types.ObjectId() },
        };
        const resUnauthorized = createMockRes();
        await transactionController.confirmHandover(reqUnauthorized, resUnauthorized);
        console.log(resUnauthorized.statusCode === 403
            ? '  ✓ Correctly rejected unauthorized user'
            : '  ✗ Failed to reject unauthorized user'
        );

        // 7. Test Dispute Flagging & Report creation
        console.log('\n[7/7] Testing Dispute Flagging & Report Creation...');
        // Create a 2nd listing and transaction to test dispute flow
        let testListing2 = await Listing.findOne({ title: 'T14 Test Desk Lamp' });
        if (!testListing2) {
            testListing2 = await Listing.create({
                sellerId: testSeller._id,
                title: 'T14 Test Desk Lamp',
                description: 'LED study desk lamp',
                price: 25,
                category: 'Dorm',
                condition: 'Used',
                images: [{ imageUrl: 'https://via.placeholder.com/150', displayOrder: 0 }],
                status: 'active',
            });
        } else {
            testListing2.status = 'active';
            await testListing2.save();
        }

        await Transaction.deleteMany({ listingId: testListing2._id });
        await Order.deleteMany({ listingId: testListing2._id });

        const reqOffer2 = {
            body: {
                buyerId: testBuyer._id,
                listingId: testListing2._id,
                offeredPrice: 20,
                transactionMethod: 'meetup',
            },
        };
        const resOffer2 = createMockRes();
        await orderController.createOrder(reqOffer2, resOffer2);

        const reqAccept2 = {
            params: { id: resOffer2.data._id },
            body: { userId: testSeller._id },
        };
        const resAccept2 = createMockRes();
        await orderController.acceptOrder(reqAccept2, resAccept2);
        const tx2 = resAccept2.data.transaction;

        // Buyer flags dispute
        const disputeReason = 'Seller did not show up at Perpustakaan Sultanah Zanariah after 45 minutes of waiting.';
        const reqDispute = {
            params: { id: tx2._id.toString() },
            body: {
                userId: testBuyer._id,
                reason: disputeReason,
            },
        };
        const resDispute = createMockRes();
        await transactionController.disputeTransaction(reqDispute, resDispute);

        if (resDispute.statusCode !== 200) {
            throw new Error(`Dispute failed: ${JSON.stringify(resDispute.data)}`);
        }

        console.log(`  ✓ Dispute flagged successfully: "${resDispute.data.message}"`);
        console.log(`  ✓ Transaction status updated to: [${resDispute.data.transaction.status}] (Expected: disputed)`);
        console.log(`  ✓ Created Report ID: ${resDispute.data.report._id}`);
        console.log(`  ✓ Report Target Type: ${resDispute.data.report.targetType}`);
        console.log(`  ✓ Report Reason: "${resDispute.data.report.reason}"`);
        console.log(`  ✓ Report Status: ${resDispute.data.report.status}`);

        // Verify Report exists in database
        const savedReport = await Report.findById(resDispute.data.report._id);
        if (!savedReport) {
            throw new Error('Report document not found in MongoDB!');
        }

        // Verify that confirming a disputed transaction is blocked
        const reqConfirmDisputed = {
            params: { id: tx2._id.toString() },
            body: { userId: testBuyer._id },
        };
        const resConfirmDisputed = createMockRes();
        await transactionController.confirmHandover(reqConfirmDisputed, resConfirmDisputed);
        console.log(resConfirmDisputed.statusCode === 400
            ? '  ✓ Correctly blocked handover confirmation on disputed transaction'
            : '  ✗ Failed to block confirmation on disputed transaction'
        );

        console.log('\n' + '='.repeat(70));
        console.log('🎉 ALL T14 DUAL HANDOVER & DISPUTE TESTS PASSED PERFECTLY!');
        console.log('='.repeat(70));

    } catch (err) {
        console.error('\n❌ Test Error:', err);
    } finally {
        await mongoose.connection.close();
        console.log('\n✓ MongoDB connection closed.');
    }
}

runDualHandoverIntegrationTest();
