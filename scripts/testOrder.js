const dns = require('dns');
// 设置公共 DNS，解决 Windows / 校园网 querySrv ECONNREFUSED 问题
dns.setServers(['8.8.8.8', '1.1.1.1']);

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

const User = require('../models/User');
const Listing = require('../models/Listing');
const Order = require('../models/Order');
const orderController = require('../controllers/orderController');

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

async function runOrderWorkflowTest() {
    console.log('='.repeat(60));
    console.log('🚀 EZ SWAP — T12 Send Offer & Order Negotiation Test');
    console.log('='.repeat(60));

    // 1. 连接数据库
    console.log('\n[1/7] Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('  ✓ Connected successfully.');

    try {
        // 2. 准备测试数据 (创建或查找测试用的 Buyer 和 Seller)
        console.log('\n[2/7] Preparing test Users & Listing...');

        // 查找或创建测试买家
        let testBuyer = await User.findOne({ email: 't12_buyer@graduate.utm.my' });
        if (!testBuyer) {
            testBuyer = await User.create({
                name: 'T12 Test Buyer',
                email: 't12_buyer@graduate.utm.my',
                passwordHash: 'dummy_hash',
                universityId: 'A23EC0001',
                verificationStatus: 'verified',
            });
        }

        // 查找或创建测试卖家
        let testSeller = await User.findOne({ email: 't12_seller@graduate.utm.my' });
        if (!testSeller) {
            testSeller = await User.create({
                name: 'T12 Test Seller',
                email: 't12_seller@graduate.utm.my',
                passwordHash: 'dummy_hash',
                universityId: 'A23EC0002',
                verificationStatus: 'verified',
            });
        }

        // 查找或创建测试 Listing
        let testListing = await Listing.findOne({ title: 'T12 Test Textbook (Calculus)' });
        if (!testListing) {
            testListing = await Listing.create({
                sellerId: testSeller._id,
                title: 'T12 Test Textbook (Calculus)',
                description: 'Used Calculus book for test purposes',
                price: 80,
                category: 'Textbooks',
                condition: 'Used',
                images: [{ imageUrl: 'https://via.placeholder.com/150', displayOrder: 0 }],
                status: 'active',
            });
        }

        // 清理旧的测试 Orders 避免唯一性干扰
        await Order.deleteMany({ listingId: testListing._id });
        console.log(`  ✓ Buyer ID:  ${testBuyer._id}`);
        console.log(`  ✓ Seller ID: ${testSeller._id}`);
        console.log(`  ✓ Listing:   "${testListing.title}" (Original Price: RM ${testListing.price})`);

        // 3. Scenario 1: Buyer 发起有效 Offer (RM 65, Meetup at PSZ)
        console.log('\n[3/7] Scenario 1: Buyer creates a new Offer (RM 65, Meetup)...');
        let req1 = {
            body: {
                buyerId: testBuyer._id,
                listingId: testListing._id,
                offeredPrice: 65,
                transactionMethod: 'meetup',
                notes: 'Can we meet at UTM Library PSZ tomorrow afternoon?',
            },
        };
        let res1 = createMockRes();
        await orderController.createOrder(req1, res1);

        if (res1.statusCode !== 201 || res1.data.status !== 'pending') {
            throw new Error(`Failed to create offer: ${JSON.stringify(res1.data)}`);
        }
        const createdOrder = res1.data;
        console.log(`  ✓ Offer created successfully! Order ID: ${createdOrder._id}`);
        console.log(`  ✓ Status: [${createdOrder.status}], Offered Price: RM ${createdOrder.offeredPrice}`);
        console.log(`  ✓ Notes: "${createdOrder.notes}"`);

        // 4. Scenario 2 & 3: 边界校验拦截测试 (Validation Checks)
        console.log('\n[4/7] Scenario 2 & 3: Testing security & duplicate rules...');

        // 卖家出价自己商品 -> 应该被拒绝
        let reqSelf = {
            body: {
                buyerId: testSeller._id,
                listingId: testListing._id,
                offeredPrice: 50,
                transactionMethod: 'meetup',
            },
        };
        let resSelf = createMockRes();
        await orderController.createOrder(reqSelf, resSelf);
        console.log(resSelf.statusCode === 400
            ? '  ✓ Correctly prevented seller from offering on their own listing'
            : '  ✗ Failed to prevent self-offer'
        );

        // 买家重复出价同一商品 -> 应该被拦截
        let reqDup = {
            body: {
                buyerId: testBuyer._id,
                listingId: testListing._id,
                offeredPrice: 60,
                transactionMethod: 'meetup',
            },
        };
        let resDup = createMockRes();
        await orderController.createOrder(reqDup, resDup);
        console.log(resDup.statusCode === 400
            ? '  ✓ Correctly prevented duplicate active pending offers'
            : '  ✗ Failed to prevent duplicate offer'
        );

        // 5. Scenario 4: Seller 还价 (Counter Offer RM 72)
        console.log('\n[5/7] Scenario 4: Seller counters offer (RM 72)...');
        let reqCounter = {
            params: { id: createdOrder._id },
            body: {
                userId: testSeller._id,
                counterPrice: 72,
                notes: 'How about RM 72? PSZ Library works for me.',
            },
        };
        let resCounter = createMockRes();
        await orderController.counterOrder(reqCounter, resCounter);

        if (resCounter.statusCode !== 200 || resCounter.data.status !== 'countered') {
            throw new Error(`Failed to counter offer: ${JSON.stringify(resCounter.data)}`);
        }
        console.log(`  ✓ Offer successfully countered!`);
        console.log(`  ✓ New Status: [${resCounter.data.status}], Counter Price: RM ${resCounter.data.counterPrice}`);
        console.log(`  ✓ Counter Notes: "${resCounter.data.notes}"`);

        // 6. Scenario 5: Buyer 接受还价 (Accept Counter Offer)
        console.log('\n[6/7] Scenario 5: Buyer accepts the counter offer...');
        let reqAccept = {
            params: { id: createdOrder._id },
            body: { userId: testBuyer._id },
        };
        let resAccept = createMockRes();
        await orderController.acceptOrder(reqAccept, resAccept);

        if (resAccept.statusCode !== 200 || resAccept.data.status !== 'accepted') {
            throw new Error(`Failed to accept counter offer: ${JSON.stringify(resAccept.data)}`);
        }
        console.log(`  ✓ Offer successfully ACCEPTED! Deal agreed.`);
        console.log(`  ✓ Final Status: [${resAccept.data.status}]`);

        // 7. Scenario 6: 取消流程测试 (Cancel Offer)
        console.log('\n[7/7] Scenario 6: Testing cancellation flow...');
        // 重新创建一个 pending order
        let reqNew = {
            body: {
                buyerId: testBuyer._id,
                listingId: testListing._id,
                offeredPrice: 70,
                transactionMethod: 'delivery',
            },
        };
        let resNew = createMockRes();
        await orderController.createOrder(reqNew, resNew);

        // 买家取消该 offer
        let reqCancel = {
            params: { id: resNew.data._id },
            body: { userId: testBuyer._id },
        };
        let resCancel = createMockRes();
        await orderController.cancelOrder(reqCancel, resCancel);

        if (resCancel.statusCode !== 200 || resCancel.data.order.status !== 'cancelled') {
            throw new Error(`Failed to cancel offer: ${JSON.stringify(resCancel.data)}`);
        }
        console.log(`  ✓ Offer cancelled successfully! Status: [${resCancel.data.order.status}]`);

        console.log('\n' + '='.repeat(60));
        console.log('🎉 ALL T12 NEGOTIATION TESTS PASSED PERFECTLY!');
        console.log('='.repeat(60));

    } catch (err) {
        console.error('\n❌ Test Error:', err);
    } finally {
        await mongoose.connection.close();
        console.log('\n✓ MongoDB connection closed.');
    }
}

runOrderWorkflowTest();