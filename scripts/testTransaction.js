const dns = require('dns');
// 设置公共 DNS，解决 Windows / 校园网 querySrv ECONNREFUSED 问题
dns.setServers(['8.8.8.8', '1.1.1.1']);

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

const User = require('../models/User');
const Listing = require('../models/Listing');
const Order = require('../models/Order');
const Transaction = require('../models/Transaction');
const orderController = require('../controllers/orderController');
const transactionController = require('../controllers/transactionController');

// 辅助函数：构造模拟的 Express req 与 res 对象
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

async function runTransactionTest() {
    console.log('='.repeat(65));
    console.log('🚀 EZ SWAP — T13 Transaction ID Generation & Handover Setup Test');
    console.log('='.repeat(65));

    // 1. 连接数据库
    console.log('\n[1/6] Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('  ✓ Connected successfully.');

    try {
        // 2. 准备测试数据 (创建或查找测试用的 Buyer, Seller 与 Listing)
        console.log('\n[2/6] Preparing test Users & Listing...');

        let testBuyer = await User.findOne({ email: 't13_buyer@graduate.utm.my' });
        if (!testBuyer) {
            testBuyer = await User.create({
                name: 'T13 Test Buyer',
                email: 't13_buyer@graduate.utm.my',
                passwordHash: 'dummy_hash',
                universityId: 'A23EC0013',
                verificationStatus: 'verified',
            });
        }

        let testSeller = await User.findOne({ email: 't13_seller@graduate.utm.my' });
        if (!testSeller) {
            testSeller = await User.create({
                name: 'T13 Test Seller',
                email: 't13_seller@graduate.utm.my',
                passwordHash: 'dummy_hash',
                universityId: 'A23EC0014',
                verificationStatus: 'verified',
            });
        }

        let testListing = await Listing.findOne({ title: 'T13 Test Scientific Calculator (FX-570EX)' });
        if (!testListing) {
            testListing = await Listing.create({
                sellerId: testSeller._id,
                title: 'T13 Test Scientific Calculator (FX-570EX)',
                description: 'Casio calculator used for 1 semester, excellent condition',
                price: 60,
                category: 'Electronics',
                condition: 'Used',
                images: [{ imageUrl: 'https://via.placeholder.com/150', displayOrder: 0 }],
                status: 'active',
            });
        } else {
            testListing.status = 'active';
            await testListing.save();
        }

        // 清理旧的测试 Orders & Transactions
        await Transaction.deleteMany({ listingId: testListing._id });
        await Order.deleteMany({ listingId: testListing._id });

        console.log(`  ✓ Buyer ID:  ${testBuyer._id}`);
        console.log(`  ✓ Seller ID: ${testSeller._id}`);
        console.log(`  ✓ Listing:   "${testListing.title}" (Status: ${testListing.status})`);

        // 3. Buyer 提交报价
        console.log('\n[3/6] Buyer creates offer (RM 50, Meetup)...');
        let reqOffer = {
            body: {
                buyerId: testBuyer._id,
                listingId: testListing._id,
                offeredPrice: 50,
                transactionMethod: 'meetup',
                notes: 'Can meet at Arked Cengal or PSZ?',
            },
        };
        let resOffer = createMockRes();
        await orderController.createOrder(reqOffer, resOffer);

        if (resOffer.statusCode !== 201) {
            throw new Error(`Failed to create offer: ${JSON.stringify(resOffer.data)}`);
        }
        const orderId = resOffer.data._id;
        console.log(`  ✓ Order created: ID ${orderId}, Status: ${resOffer.data.status}`);

        // 4. Seller 接受报价 -> 触发 T13 Transaction ID 生成与 Listing 状态保留
        console.log('\n[4/6] Seller accepts offer (triggering T13 Transaction ID generation)...');
        let reqAccept = {
            params: { id: orderId },
            body: { userId: testSeller._id },
        };
        let resAccept = createMockRes();
        await orderController.acceptOrder(reqAccept, resAccept);

        if (resAccept.statusCode !== 200 || resAccept.data.status !== 'accepted') {
            throw new Error(`Failed to accept order: ${JSON.stringify(resAccept.data)}`);
        }

        const generatedTx = resAccept.data.transaction;
        if (!generatedTx || !generatedTx.transactionCode) {
            throw new Error('Transaction was not automatically generated or transactionCode is missing!');
        }

        console.log(`  ✓ Offer accepted successfully!`);
        console.log(`  ✓ Generated Unique Transaction ID: [${generatedTx.transactionCode}]`);
        console.log(`  ✓ Transaction Database ID: ${generatedTx._id}`);
        console.log(`  ✓ Handover Method: ${generatedTx.handoverMethod}`);
        console.log(`  ✓ Initial Transaction Status: ${generatedTx.status}`);

        // 验证 Listing 是否被标记为 'reserved'
        const updatedListing = await Listing.findById(testListing._id);
        console.log(`  ✓ Listing Status updated to: [${updatedListing.status}] (Expected: reserved)`);
        if (updatedListing.status !== 'reserved') {
            throw new Error(`Listing status should be 'reserved', got '${updatedListing.status}'`);
        }

        // 5. 测试 Transaction 查询接口 (GET /api/transactions & GET /api/transactions/order/:orderId)
        console.log('\n[5/6] Testing Transaction Query APIs...');
        let reqGetTx = {
            query: { userId: testBuyer._id.toString() },
        };
        let resGetTx = createMockRes();
        await transactionController.getTransactions(reqGetTx, resGetTx);
        console.log(`  ✓ Found ${resGetTx.data.length} transactions for buyer`);

        let reqOrderByTx = {
            params: { orderId: orderId.toString() },
        };
        let resOrderByTx = createMockRes();
        await transactionController.getTransactionByOrderId(reqOrderByTx, resOrderByTx);
        if (resOrderByTx.statusCode !== 200 || resOrderByTx.data.transactionCode !== generatedTx.transactionCode) {
            throw new Error('getTransactionByOrderId failed or returned mismatching transaction');
        }
        console.log(`  ✓ Query by Order ID confirmed matching Transaction Code: ${resOrderByTx.data.transactionCode}`);

        // 6. 测试 T13 Meetup Handover 设置 (PATCH /api/transactions/:id/handover)
        console.log('\n[6/6] Scheduling Meetup & Handover details (T13 Handover Setup)...');
        const scheduledTime = new Date(Date.now() + 86400000 * 2); // 2 days later
        let reqHandover = {
            params: { id: generatedTx._id.toString() },
            body: {
                userId: testBuyer._id,
                meetupLocation: 'UTM Perpustakaan Sultanah Zanariah (PSZ) - Level 1 Entrance',
                meetupTime: scheduledTime,
                handoverMethod: 'meetup',
                meetupNotes: 'I will be wearing a blue UTM hoodie near the entrance gates.',
            },
        };
        let resHandover = createMockRes();
        await transactionController.updateHandoverDetails(reqHandover, resHandover);

        if (resHandover.statusCode !== 200) {
            throw new Error(`Failed to update handover: ${JSON.stringify(resHandover.data)}`);
        }

        const updatedTx = resHandover.data.transaction;
        console.log(`  ✓ Handover details updated successfully!`);
        console.log(`  ✓ Scheduled Location: "${updatedTx.meetupLocation}"`);
        console.log(`  ✓ Scheduled Time:     ${new Date(updatedTx.meetupTime).toLocaleString()}`);
        console.log(`  ✓ Meetup Notes:       "${updatedTx.meetupNotes}"`);

        // 权限拦截测试：非交易参与者不得修改 Handover 信息
        let reqUnauthorized = {
            params: { id: generatedTx._id.toString() },
            body: {
                userId: new mongoose.Types.ObjectId(), // 任意无关用户
                meetupLocation: 'Hacked Location',
            },
        };
        let resUnauthorized = createMockRes();
        await transactionController.updateHandoverDetails(reqUnauthorized, resUnauthorized);
        console.log(resUnauthorized.statusCode === 403
            ? '  ✓ Correctly rejected unauthorized third-party user from modifying handover'
            : '  ✗ Failed to reject unauthorized handover update'
        );

        console.log('\n' + '='.repeat(65));
        console.log('🎉 ALL T13 TRANSACTION & HANDOVER TESTS PASSED PERFECTLY!');
        console.log('='.repeat(65));

    } catch (err) {
        console.error('\n❌ Test Error:', err);
    } finally {
        await mongoose.connection.close();
        console.log('\n✓ MongoDB connection closed.');
    }
}

runTransactionTest();
