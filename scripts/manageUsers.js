/**
 * User & Password Manager CLI
 * Run: node scripts/manageUsers.js [list | test <email> <password> | reset <email> <newPassword>]
 */
require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const User = require('../models/User');
const { hashPassword, verifyPassword } = require('../utils/password');

async function main() {
  const args = process.argv.slice(2);
  const action = args[0] || 'list';

  try {
    await mongoose.connect(process.env.MONGODB_URI);

    if (action === 'list') {
      console.log('\n=================== EZ-SWAP USERS ===================');
      const users = await User.find({}).select('name email role verificationStatus isEmailApproved createdAt');
      console.log('Total registered users:', users.length, '\n');
      users.forEach((u, i) => {
        console.log(`${i + 1}. ${u.name}`);
        console.log(`   Email:   ${u.email}`);
        console.log(`   Role:    ${u.role.toUpperCase()}`);
        console.log(`   Status:  ${u.verificationStatus} (Email approved: ${u.isEmailApproved})`);
        console.log(`   Created: ${new Date(u.createdAt).toLocaleString()}`);
        console.log('-----------------------------------------------------');
      });
      console.log('\nCommands you can run:');
      console.log('  • Test a password:  node scripts/manageUsers.js test <email> <password>');
      console.log('  • Reset a password: node scripts/manageUsers.js reset <email> <newPassword>\n');
    } else if (action === 'test') {
      const email = args[1];
      const password = args[2];
      if (!email || !password) {
        console.log('Usage: node scripts/manageUsers.js test <email> <password>');
        process.exit(1);
      }
      const user = await User.findOne({ email });
      if (!user) {
        console.log(`❌ User with email "${email}" not found.`);
      } else {
        const isMatch = verifyPassword(password, user.passwordHash);
        if (isMatch) {
          console.log(`✅ SUCCESS: Password matches for "${user.name}" (${user.email})! Role: ${user.role}`);
        } else {
          console.log(`❌ FAILED: Password does NOT match for "${user.email}".`);
        }
      }
    } else if (action === 'reset') {
      const email = args[1];
      const newPassword = args[2];
      if (!email || !newPassword) {
        console.log('Usage: node scripts/manageUsers.js reset <email> <newPassword>');
        process.exit(1);
      }
      const user = await User.findOne({ email });
      if (!user) {
        console.log(`❌ User with email "${email}" not found.`);
      } else {
        user.passwordHash = hashPassword(newPassword);
        await user.save();
        console.log(`✅ SUCCESS: Password for "${user.name}" (${user.email}) has been updated to "${newPassword}".`);
      }
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

main();
