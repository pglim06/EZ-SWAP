/**
 * EZ Swap — Comprehensive Category & Subcategory Mock Data Seeder
 *
 * Seeds at least 10 listings for every subcategory across all 6 categories
 * (31 subcategories × 10 items = 310 listings), including identical products
 * offered at different prices and conditions by different UTM student sellers.
 *
 * Usage:
 *   node scripts/seedCategories.js
 */

require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');
const User = require('../models/User');
const Listing = require('../models/Listing');

const DEMO_SELLERS = [
  { name: 'Ahmad Faris', email: 'seed_ahmad@graduate.utm.my', universityId: 'A23CS0101', averageRating: 4.9, ratingsCount: 18 },
  { name: 'Sarah Tan', email: 'seed_sarah@graduate.utm.my', universityId: 'A23KE0102', averageRating: 5.0, ratingsCount: 24 },
  { name: 'Wei Ming', email: 'seed_weiming@graduate.utm.my', universityId: 'A23KM0103', averageRating: 4.8, ratingsCount: 11 },
  { name: 'Nurul Huda', email: 'seed_nurul@graduate.utm.my', universityId: 'A23KA0104', averageRating: 4.7, ratingsCount: 9 },
  { name: 'Hafiz Azman', email: 'seed_hafiz@graduate.utm.my', universityId: 'A23KT0105', averageRating: 4.9, ratingsCount: 15 },
  { name: 'Kevin Lee', email: 'seed_kevin@graduate.utm.my', universityId: 'A23CS0106', averageRating: 4.6, ratingsCount: 7 },
];

const SUBCATEGORY_IMAGES = {
  'Engineering Maths': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
  'Calculus': 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&auto=format&fit=crop&q=80',
  'Computer Science': 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80',
  'Physics': 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80',
  'Chemistry': 'https://images.unsplash.com/photo-1614935151651-0bea6508db6b?w=600&auto=format&fit=crop&q=80',
  'Lecture Notes': 'https://images.unsplash.com/photo-1540350394557-8d14678e7f91?w=600&auto=format&fit=crop&q=80',
  'Laptops & PC': 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&auto=format&fit=crop&q=80',
  'Monitors': 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80',
  'Keyboards & Mice': 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&auto=format&fit=crop&q=80',
  'Calculators': 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=600&auto=format&fit=crop&q=80',
  'Audio & Earphones': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
  'Chargers & Cables': 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&auto=format&fit=crop&q=80',
  'Desk Lamps': 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&auto=format&fit=crop&q=80',
  'Table Fans': 'https://images.unsplash.com/photo-1618941716939-553df3c6c278?w=600&auto=format&fit=crop&q=80',
  'Mattress & Bedding': 'https://images.unsplash.com/photo-1549388604-817d15aa0110?w=600&auto=format&fit=crop&q=80',
  'Storage & Racks': 'https://images.unsplash.com/photo-1615873968403-89e068629265?w=600&auto=format&fit=crop&q=80',
  'Kettles & Cookware': 'https://images.unsplash.com/photo-1585683034983-b8c9d72a095a?w=600&auto=format&fit=crop&q=80',
  'UTM Corporate Polo': 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80',
  'Baju Kurung': 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&auto=format&fit=crop&q=80',
  'Hoodies & Jackets': 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80',
  'Sneakers & Shoes': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
  'Bags & Backpacks': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
  'Printing & Binding': 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&auto=format&fit=crop&q=80',
  'PC & Phone Repair': 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
  'Tutoring & Proofreading': 'https://images.unsplash.com/photo-1580537659466-0a9bfa916a54?w=600&auto=format&fit=crop&q=80',
  'Campus Carpool': 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&auto=format&fit=crop&q=80',
  'Event Photography': 'https://images.unsplash.com/photo-1627556704353-016baeb12c79?w=600&auto=format&fit=crop&q=80',
  'Campus Bicycles': 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&auto=format&fit=crop&q=80',
  'Badminton Rackets': 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600&auto=format&fit=crop&q=80',
  'Football / Futsal': 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600&auto=format&fit=crop&q=80',
  'Gym & Fitness': 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=600&auto=format&fit=crop&q=80',
};

/**
 * Each entry defines a DB category + frontend subcategory + 10 items.
 * Every subcategory includes multiple listings of the SAME product at DIFFERENT prices.
 */
const SUBCATEGORY_DATA = [
  // ═══════════════════════════════════════════════════════════════════════════
  // 1. TEXTBOOKS (DB category: 'Textbooks')
  // ═══════════════════════════════════════════════════════════════════════════
  {
    category: 'Textbooks',
    subcategory: 'Engineering Maths',
    items: [
      { title: 'Engineering Maths 1 (Stroud 7th Ed) - Clean Copy', price: 32, condition: 'Used', desc: 'Engineering Maths textbook by K.A. Stroud. Light pencil notes, great for Year 1 FKE/FKM.' },
      { title: 'Engineering Maths 1 (Stroud 7th Ed) - Like New', price: 48, condition: 'Used', desc: 'Engineering Maths textbook by K.A. Stroud. No highlights, wrapped in plastic cover.' },
      { title: 'Engineering Maths 1 (Stroud 7th Ed) - Brand New', price: 65, condition: 'New', desc: 'Engineering Maths textbook by K.A. Stroud. Unused spare copy from UTM bookstore.' },
      { title: 'Engineering Maths 2 (Kreyszig Advanced 10th Ed)', price: 45, condition: 'Used', desc: 'Advanced Engineering Maths by Erwin Kreyszig. Covers ODEs, Laplace, and Fourier series.' },
      { title: 'Engineering Maths 2 (Kreyszig Advanced 10th Ed)', price: 58, condition: 'Used', desc: 'Advanced Engineering Maths by Erwin Kreyszig. Mint condition with formula sheet.' },
      { title: 'UTM SEMM1013 Engineering Maths Tutorial Workbook', price: 12, condition: 'Used', desc: 'Engineering Maths past tutorial and worked solution booklet for UTM engineering students.' },
      { title: 'UTM SEMM1013 Engineering Maths Tutorial Workbook', price: 18, condition: 'New', desc: 'Engineering Maths fresh printed workbook with complete answer key.' },
      { title: 'Vector Calculus & Linear Algebra for Engineering Maths', price: 28, condition: 'Used', desc: 'Engineering Maths reference covering eigenvalues, matrices, and Green theorem.' },
      { title: 'Differential Equations for Engineering Maths (Zill)', price: 38, condition: 'Used', desc: 'Engineering Maths differential equations textbook, clean pages, meetup at Arked Meranti.' },
      { title: 'Numerical Methods in Engineering Maths (Chapra)', price: 42, condition: 'Used', desc: 'Engineering Maths numerical methods book with MATLAB examples.' },
    ],
  },
  {
    category: 'Textbooks',
    subcategory: 'Calculus',
    items: [
      { title: 'Thomas Calculus Early Transcendentals (14th Ed)', price: 40, condition: 'Used', desc: 'Calculus textbook by George Thomas. Slight wear on spine, all pages intact.' },
      { title: 'Thomas Calculus Early Transcendentals (14th Ed)', price: 55, condition: 'Used', desc: 'Calculus textbook by George Thomas. Like new condition, no markings inside.' },
      { title: 'Thomas Calculus Early Transcendentals (14th Ed)', price: 78, condition: 'New', desc: 'Calculus textbook by George Thomas. Brand new sealed copy.' },
      { title: 'Stewart Calculus: Single & Multivariable (8th Ed)', price: 35, condition: 'Used', desc: 'Calculus by James Stewart. Great for Calculus I and II at UTM.' },
      { title: 'Stewart Calculus: Single & Multivariable (8th Ed)', price: 50, condition: 'Used', desc: 'Calculus by James Stewart. Hardcover edition in very good condition.' },
      { title: 'Multivariable Calculus Study Guide & Solution Manual', price: 20, condition: 'Used', desc: 'Calculus step-by-step solutions for triple integrals and partial derivatives.' },
      { title: 'Calculus 1 Past Year Exam Compilation (UTM 2021-2025)', price: 10, condition: 'Used', desc: 'Calculus bound past-year papers with handwritten marking schemes.' },
      { title: 'Calculus 1 Past Year Exam Compilation (UTM 2021-2025)', price: 15, condition: 'New', desc: 'Calculus freshly printed and comb-bound exam pack.' },
      { title: 'Anton Calculus Early Transcendentals (11th Ed)', price: 36, condition: 'Used', desc: 'Calculus textbook by Howard Anton. Clean copy, pickup at PSZ Library.' },
      { title: 'Schaum Outline of Calculus (6th Edition)', price: 22, condition: 'Used', desc: 'Calculus 1,105 solved problems for quick exam revision.' },
    ],
  },
  {
    category: 'Textbooks',
    subcategory: 'Computer Science',
    items: [
      { title: 'Starting Out with C++ (Tony Gaddis 9th Ed)', price: 38, condition: 'Used', desc: 'Computer Science Programming Technique I/II textbook for UTM FC students.' },
      { title: 'Starting Out with C++ (Tony Gaddis 9th Ed)', price: 52, condition: 'Used', desc: 'Computer Science C++ textbook in near-mint condition with code CD.' },
      { title: 'Introduction to Algorithms (CLRS 3rd Edition)', price: 65, condition: 'Used', desc: 'Computer Science classic algorithms reference book.' },
      { title: 'Introduction to Algorithms (CLRS 3rd Edition)', price: 85, condition: 'New', desc: 'Computer Science CLRS hardcover, brand new unread copy.' },
      { title: 'Operating System Concepts (Silberschatz 10th Ed)', price: 45, condition: 'Used', desc: 'Computer Science dinosaur book for OS course, minimal highlights.' },
      { title: 'Database Systems (Elmasri & Navathe 7th Ed)', price: 40, condition: 'Used', desc: 'Computer Science database design and SQL textbook.' },
      { title: 'Computer Networking: A Top-Down Approach (Kurose)', price: 44, condition: 'Used', desc: 'Computer Science networking textbook, great for SECJ/SECR courses.' },
      { title: 'Discrete Mathematics and Its Applications (Rosen)', price: 34, condition: 'Used', desc: 'Computer Science discrete structures textbook, clean pages.' },
      { title: 'Discrete Mathematics and Its Applications (Rosen)', price: 48, condition: 'New', desc: 'Computer Science discrete structures textbook, unused copy.' },
      { title: 'Clean Code by Robert C. Martin (Paperback)', price: 29, condition: 'Used', desc: 'Computer Science software engineering best practices handbook.' },
    ],
  },
  {
    category: 'Textbooks',
    subcategory: 'Physics',
    items: [
      { title: 'University Physics with Modern Physics (Young & Freedman)', price: 42, condition: 'Used', desc: 'Physics textbook 14th edition, ideal for engineering mechanics & optics.' },
      { title: 'University Physics with Modern Physics (Young & Freedman)', price: 60, condition: 'Used', desc: 'Physics textbook 14th edition, like-new condition with zero highlights.' },
      { title: 'Fundamentals of Physics (Halliday & Resnick 11th Ed)', price: 38, condition: 'Used', desc: 'Physics core textbook covering kinematics, electromagnetism, and waves.' },
      { title: 'Fundamentals of Physics (Halliday & Resnick 11th Ed)', price: 55, condition: 'New', desc: 'Physics textbook brand new paperback copy.' },
      { title: 'Engineering Mechanics: Statics (Hibbeler 14th Ed)', price: 35, condition: 'Used', desc: 'Physics and statics textbook for mechanical & civil engineering.' },
      { title: 'Engineering Mechanics: Dynamics (Hibbeler 14th Ed)', price: 36, condition: 'Used', desc: 'Physics dynamics textbook, clean diagrams and worked examples.' },
      { title: 'UTM Engineering Physics Lab Manual & Formula Sheet', price: 10, condition: 'Used', desc: 'Physics lab preparation booklet with uncertainty calculation guides.' },
      { title: 'Modern Physics for Scientists and Engineers (Thornton)', price: 32, condition: 'Used', desc: 'Physics quantum and nuclear concepts textbook.' },
      { title: 'Electromagnetics for Engineers (Ulaby)', price: 40, condition: 'Used', desc: 'Physics and electrical field theory textbook for FKE students.' },
      { title: 'Schaum Outline of College Physics (12th Ed)', price: 19, condition: 'Used', desc: 'Physics quick revision guide with solved problems.' },
    ],
  },
  {
    category: 'Textbooks',
    subcategory: 'Chemistry',
    items: [
      { title: 'Chemistry: The Central Science (Brown, LeMay 14th Ed)', price: 38, condition: 'Used', desc: 'Chemistry foundational textbook for chemical engineering & science.' },
      { title: 'Chemistry: The Central Science (Brown, LeMay 14th Ed)', price: 54, condition: 'Used', desc: 'Chemistry textbook, plastic wrapped, almost brand new.' },
      { title: 'Organic Chemistry (Wade 9th Edition)', price: 42, condition: 'Used', desc: 'Chemistry organic reactions and mechanisms textbook.' },
      { title: 'Organic Chemistry (Wade 9th Edition)', price: 60, condition: 'New', desc: 'Chemistry organic textbook, unused with molecular model guide.' },
      { title: 'Physical Chemistry (Atkins & de Paula 11th Ed)', price: 45, condition: 'Used', desc: 'Chemistry thermodynamics and kinetics reference book.' },
      { title: 'Analytical Chemistry (Skoog & West 9th Ed)', price: 35, condition: 'Used', desc: 'Chemistry titration, spectroscopy, and lab analysis textbook.' },
      { title: 'Elementary Principles of Chemical Processes (Felder)', price: 40, condition: 'Used', desc: 'Chemistry mass and energy balance textbook for FKT students.' },
      { title: 'Elementary Principles of Chemical Processes (Felder)', price: 52, condition: 'Used', desc: 'Chemistry Felder & Rousseau 4th Ed, clean copy with appendix.' },
      { title: 'UTM General Chemistry Lab Coat & Goggles Bundle', price: 24, condition: 'Used', desc: 'Chemistry lab safety set, washed and sanitized, size M.' },
      { title: 'Inorganic Chemistry (Miessler & Tarr 5th Ed)', price: 34, condition: 'Used', desc: 'Chemistry molecular orbital and coordination compounds book.' },
    ],
  },
  {
    category: 'Textbooks',
    subcategory: 'Lecture Notes',
    items: [
      { title: 'SECR1013 Digital Logic Complete Lecture Notes', price: 10, condition: 'Used', desc: 'Lecture Notes with K-map examples, flip-flops, and colored annotations.' },
      { title: 'SECR1013 Digital Logic Complete Lecture Notes', price: 15, condition: 'New', desc: 'Lecture Notes freshly printed in color with spiral binding.' },
      { title: 'Engineering Mathematics 1 & 2 Handwritten Lecture Notes', price: 12, condition: 'Used', desc: 'Lecture Notes compiled by Dean List student, clear handwriting.' },
      { title: 'Engineering Mathematics 1 & 2 Handwritten Lecture Notes', price: 18, condition: 'New', desc: 'Lecture Notes laser-printed copy with past-year solutions.' },
      { title: 'Data Structures & Algorithms C++ Lecture Notes', price: 14, condition: 'Used', desc: 'Lecture Notes covering linked lists, trees, graphs, and sorting.' },
      { title: 'Thermodynamics 1 Complete Formula & Lecture Notes', price: 11, condition: 'Used', desc: 'Lecture Notes including steam tables and cycle diagrams.' },
      { title: 'Object-Oriented Programming Java Lecture Notes', price: 12, condition: 'Used', desc: 'Lecture Notes with UML diagrams and inheritance examples.' },
      { title: 'Fluid Mechanics FKM Bound Lecture Notes & Tutorials', price: 13, condition: 'Used', desc: 'Lecture Notes for Bernoulli, pipe flow, and Reynolds number.' },
      { title: 'Artificial Intelligence & Machine Learning Lecture Notes', price: 16, condition: 'New', desc: 'Lecture Notes covering search, neural nets, and Python snippets.' },
      { title: 'Software Engineering Requirements & UML Lecture Notes', price: 10, condition: 'Used', desc: 'Lecture Notes for SRS, use case, and sequence diagrams.' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. ELECTRONICS (DB category: 'Electronics')
  // ═══════════════════════════════════════════════════════════════════════════
  {
    category: 'Electronics',
    subcategory: 'Laptops & PC',
    items: [
      { title: 'Lenovo ThinkPad T480 (i5 8th Gen, 16GB RAM, 512GB SSD)', price: 950, condition: 'Used', desc: 'Laptops & PC deal: reliable coding laptop, battery lasts 4 hours.' },
      { title: 'Lenovo ThinkPad T480 (i5 8th Gen, 16GB RAM, 512GB SSD)', price: 1100, condition: 'Used', desc: 'Laptops & PC deal: upgraded dual battery, mint body, original charger.' },
      { title: 'ASUS VivoBook 15 (Ryzen 5, 8GB RAM, 512GB SSD)', price: 1250, condition: 'Used', desc: 'Laptops & PC deal: lightweight 15.6-inch student laptop, great for assignments.' },
      { title: 'ASUS VivoBook 15 (Ryzen 5, 8GB RAM, 512GB SSD)', price: 1400, condition: 'Used', desc: 'Laptops & PC deal: barely used, includes laptop sleeve and mouse.' },
      { title: 'Apple MacBook Air M1 (8GB, 256GB) Space Grey', price: 2350, condition: 'Used', desc: 'Laptops & PC deal: 91% battery health, full box with original Type-C cable.' },
      { title: 'Apple MacBook Air M1 (8GB, 256GB) Space Grey', price: 2550, condition: 'Used', desc: 'Laptops & PC deal: 96% battery health, zero scratches, meetup at KRP.' },
      { title: 'HP Pavilion Gaming 15 (GTX 1650, 16GB RAM)', price: 1650, condition: 'Used', desc: 'Laptops & PC deal: great for CAD, SolidWorks, and light gaming.' },
      { title: 'Dell Latitude 7490 Business Ultrabook (i7, 16GB)', price: 980, condition: 'Used', desc: 'Laptops & PC deal: compact 14-inch FHD matte screen, Windows 11 Pro.' },
      { title: 'Acer Aspire 5 (i5 11th Gen, 8GB, 512GB SSD)', price: 1350, condition: 'Used', desc: 'Laptops & PC deal: clean keyboard, fast boot, ready for semester.' },
      { title: 'Custom Mini ITX Study PC (Ryzen 5 5600G, 16GB)', price: 1450, condition: 'Used', desc: 'Laptops & PC deal: compact dorm desktop PC, silent cooling.' },
    ],
  },
  {
    category: 'Electronics',
    subcategory: 'Monitors',
    items: [
      { title: 'Dell 24-inch IPS FHD Monitor (P2419H)', price: 260, condition: 'Used', desc: 'Monitors: height-adjustable pivot stand, HDMI + DP, zero dead pixels.' },
      { title: 'Dell 24-inch IPS FHD Monitor (P2419H)', price: 310, condition: 'Used', desc: 'Monitors: comes with original box and HDMI cable, like new.' },
      { title: 'LG 24MK600M 24-inch Borderless IPS Monitor', price: 240, condition: 'Used', desc: 'Monitors: 75Hz FreeSync, great second screen for coding in dorm.' },
      { title: 'LG 24MK600M 24-inch Borderless IPS Monitor', price: 285, condition: 'Used', desc: 'Monitors: barely used 4 months, crisp colors, pickup at KTDI.' },
      { title: 'Xiaomi Mi Desktop Monitor 27-inch FHD', price: 320, condition: 'Used', desc: 'Monitors: ultra-thin bezel 27-inch IPS display with low blue light.' },
      { title: 'AOC 24G2 144Hz IPS Gaming Monitor', price: 390, condition: 'Used', desc: 'Monitors: 144Hz 1ms response time, height adjustable stand.' },
      { title: 'Samsung 22-inch Essential S3 LED Monitor', price: 180, condition: 'Used', desc: 'Monitors: compact 22-inch screen that fits small dorm study desks.' },
      { title: 'Portable 15.6-inch USB-C FHD Monitor', price: 250, condition: 'New', desc: 'Monitors: single Type-C cable display for laptop dual-screen setup.' },
      { title: 'Portable 15.6-inch USB-C FHD Monitor', price: 210, condition: 'Used', desc: 'Monitors: used 1 semester, includes magnetic smart cover.' },
      { title: 'Prism+ W240 24-inch Productivity Monitor', price: 230, condition: 'Used', desc: 'Monitors: IPS panel with VESA mount support, clean screen.' },
    ],
  },
  {
    category: 'Electronics',
    subcategory: 'Keyboards & Mice',
    items: [
      { title: 'Logitech M331 Silent Plus Wireless Mouse', price: 35, condition: 'Used', desc: 'Keyboards & Mice: ultra-quiet clicks for PSZ library, includes receiver.' },
      { title: 'Logitech M331 Silent Plus Wireless Mouse', price: 48, condition: 'New', desc: 'Keyboards & Mice: brand new sealed Logitech M331 black.' },
      { title: 'Logitech K380 Multi-Device Bluetooth Keyboard', price: 75, condition: 'Used', desc: 'Keyboards & Mice: connects up to 3 devices (laptop, iPad, phone).' },
      { title: 'Logitech K380 Multi-Device Bluetooth Keyboard', price: 95, condition: 'New', desc: 'Keyboards & Mice: brand new unopened K380 off-white.' },
      { title: 'Keychron K2 V2 Mechanical Keyboard (Brown Switch)', price: 195, condition: 'Used', desc: 'Keyboards & Mice: wireless/wired 75% mechanical keyboard with white backlight.' },
      { title: 'Keychron K2 V2 Mechanical Keyboard (Brown Switch)', price: 230, condition: 'Used', desc: 'Keyboards & Mice: hot-swappable RGB aluminum frame with extra keycaps.' },
      { title: 'RK61 60% Wireless Mechanical Keyboard (Red Switch)', price: 110, condition: 'Used', desc: 'Keyboards & Mice: compact dorm-friendly mechanical keyboard.' },
      { title: 'Logitech G304 Lightspeed Wireless Gaming Mouse', price: 85, condition: 'Used', desc: 'Keyboards & Mice: Hero sensor, lightweight AA battery mod included.' },
      { title: 'Logitech G304 Lightspeed Wireless Gaming Mouse', price: 115, condition: 'New', desc: 'Keyboards & Mice: brand new sealed G304 white.' },
      { title: 'Aula F75 Gasket Mechanical Keyboard', price: 165, condition: 'Used', desc: 'Keyboards & Mice: creamy linear switches, tri-mode wireless.' },
    ],
  },
  {
    category: 'Electronics',
    subcategory: 'Calculators',
    items: [
      { title: 'Casio fx-570EX ClassWiz Scientific Calculator', price: 45, condition: 'Used', desc: 'Calculators: official UTM exam-approved model, crisp LCD screen.' },
      { title: 'Casio fx-570EX ClassWiz Scientific Calculator', price: 60, condition: 'Used', desc: 'Calculators: like new with hard slide cover and manual.' },
      { title: 'Casio fx-570EX ClassWiz Scientific Calculator', price: 78, condition: 'New', desc: 'Calculators: brand new original Casio fx-570EX sealed.' },
      { title: 'Casio fx-570MS 2nd Edition Scientific Calculator', price: 30, condition: 'Used', desc: 'Calculators: classic reliable engineering exam calculator.' },
      { title: 'Casio fx-570MS 2nd Edition Scientific Calculator', price: 42, condition: 'New', desc: 'Calculators: brand new unopened 2nd edition fx-570MS.' },
      { title: 'Casio fx-991EX ClassWiz Solar Scientific Calculator', price: 65, condition: 'Used', desc: 'Calculators: dual solar + battery power, matrix & integration solver.' },
      { title: 'Casio fx-991CW Latest ClassWiz Calculator', price: 82, condition: 'New', desc: 'Calculators: newest Casio model with high-res 4-gradation display.' },
      { title: 'Texas Instruments TI-84 Plus CE Graphing Calculator', price: 290, condition: 'Used', desc: 'Calculators: color graphing calculator with USB charging cable.' },
      { title: 'Canon F-789SGA Scientific Calculator', price: 32, condition: 'Used', desc: 'Calculators: 605 functions, approved for university exams.' },
      { title: 'Casio fx-350EX ClassWiz Entry Scientific Calculator', price: 35, condition: 'Used', desc: 'Calculators: lightweight scientific calculator, fresh battery.' },
    ],
  },
  {
    category: 'Electronics',
    subcategory: 'Audio & Earphones',
    items: [
      { title: 'Sony WH-1000XM4 Wireless ANC Headphones', price: 520, condition: 'Used', desc: 'Audio & Earphones: top-tier noise cancelling for noisy dorms, with case.' },
      { title: 'Sony WH-1000XM4 Wireless ANC Headphones', price: 620, condition: 'Used', desc: 'Audio & Earphones: mint earpads, barely used, full original box.' },
      { title: 'Apple AirPods Pro (2nd Gen USB-C)', price: 580, condition: 'Used', desc: 'Audio & Earphones: genuine Apple, clean ear tips, ANC works perfectly.' },
      { title: 'Moondrop Chu II IEM Wired Earphones', price: 55, condition: 'Used', desc: 'Audio & Earphones: audiophile metal IEM with 3.5mm jack.' },
      { title: 'Moondrop Chu II IEM Wired Earphones', price: 75, condition: 'New', desc: 'Audio & Earphones: brand new sealed Moondrop Chu II.' },
      { title: 'Soundcore Life Q30 ANC Over-Ear Headphones', price: 165, condition: 'Used', desc: 'Audio & Earphones: 40-hour battery life, great for library study.' },
      { title: 'Soundcore Life Q30 ANC Over-Ear Headphones', price: 210, condition: 'New', desc: 'Audio & Earphones: brand new sealed box with carrying case.' },
      { title: 'JBL Go 3 Portable Bluetooth Speaker', price: 85, condition: 'Used', desc: 'Audio & Earphones: waterproof mini speaker for dorm room.' },
      { title: 'Baseus Bowie WM02 True Wireless Earbuds', price: 38, condition: 'New', desc: 'Audio & Earphones: compact transparent case, Bluetooth 5.3.' },
      { title: 'HyperX Cloud II Gaming Headset (Red)', price: 150, condition: 'Used', desc: 'Audio & Earphones: detachable mic, USB 7.1 sound card included.' },
    ],
  },
  {
    category: 'Electronics',
    subcategory: 'Chargers & Cables',
    items: [
      { title: 'UGREEN 65W GaN 3-Port Fast Charger (USB-C + USB-A)', price: 65, condition: 'Used', desc: 'Chargers & Cables: charges MacBook/laptop and phone simultaneously.' },
      { title: 'UGREEN 65W GaN 3-Port Fast Charger (USB-C + USB-A)', price: 88, condition: 'New', desc: 'Chargers & Cables: brand new sealed UK 3-pin plug 65W GaN.' },
      { title: 'Anker PowerCore 20000mAh Power Bank', price: 95, condition: 'Used', desc: 'Chargers & Cables: dual USB fast charging, great for full-day classes.' },
      { title: 'Anker PowerCore 20000mAh Power Bank', price: 125, condition: 'New', desc: 'Chargers & Cables: brand new sealed Anker 20K power bank.' },
      { title: 'UGREEN 100W Braided USB-C to USB-C Cable (2m)', price: 22, condition: 'New', desc: 'Chargers & Cables: E-marker chip, supports PD fast laptop charging.' },
      { title: 'UGREEN 100W Braided USB-C to USB-C Cable (2m)', price: 15, condition: 'Used', desc: 'Chargers & Cables: lightly used 2m braided Type-C cable.' },
      { title: 'Baseus 6-in-1 USB-C Hub (HDMI 4K, 3x USB 3.0, PD)', price: 55, condition: 'Used', desc: 'Chargers & Cables: essential dongle for MacBook & ultrabooks.' },
      { title: 'Apple 20W USB-C Power Adapter (Original UK Pin)', price: 45, condition: 'Used', desc: 'Chargers & Cables: genuine Apple 20W brick, tested working.' },
      { title: 'LDNIO 4-Socket Extension Cord with 4 USB Ports', price: 32, condition: 'New', desc: 'Chargers & Cables: SIRIM approved 2m dorm power strip.' },
      { title: '2m Cat6 Gigabit Ethernet LAN Cable', price: 10, condition: 'New', desc: 'Chargers & Cables: flat LAN cable for UTM dorm wall port.' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. DORM ESSENTIALS (DB category: 'Dorm')
  // ═══════════════════════════════════════════════════════════════════════════
  {
    category: 'Dorm',
    subcategory: 'Desk Lamps',
    items: [
      { title: 'Xiaomi Mi LED Desk Lamp 1S (Smart Wi-Fi)', price: 75, condition: 'Used', desc: 'Desk Lamps: flicker-free warm/cool dimming, minimal aluminum design.' },
      { title: 'Xiaomi Mi LED Desk Lamp 1S (Smart Wi-Fi)', price: 105, condition: 'New', desc: 'Desk Lamps: brand new sealed Xiaomi Mi LED Desk Lamp 1S.' },
      { title: 'Rechargeable Clip-On LED Study Desk Lamp', price: 18, condition: 'Used', desc: 'Desk Lamps: 3 brightness modes, clips onto dorm bed or desk.' },
      { title: 'Rechargeable Clip-On LED Study Desk Lamp', price: 26, condition: 'New', desc: 'Desk Lamps: brand new USB-rechargeable flexible neck lamp.' },
      { title: 'Baseus Magnetic Screenbar Monitor Light', price: 65, condition: 'Used', desc: 'Desk Lamps: saves desk space, stepless dimming dial.' },
      { title: 'Baseus Magnetic Screenbar Monitor Light', price: 85, condition: 'New', desc: 'Desk Lamps: brand new i-wok series monitor light bar.' },
      { title: 'IKEA Tertial Architect Work Desk Lamp (Black)', price: 35, condition: 'Used', desc: 'Desk Lamps: sturdy metal clamp arm with warm E27 LED bulb.' },
      { title: 'Foldable Touch-Control LED Desk Lamp with Pen Holder', price: 22, condition: 'New', desc: 'Desk Lamps: includes phone stand and pen cup for study table.' },
      { title: 'IKEA Fado Glass Table Night Lamp (White)', price: 28, condition: 'Used', desc: 'Desk Lamps: cozy ambient warm glow for dorm room.' },
      { title: 'USB Powered Flexible Gooseneck Reading Light', price: 12, condition: 'New', desc: 'Desk Lamps: plugs into laptop or power bank for late-night study.' },
    ],
  },
  {
    category: 'Dorm',
    subcategory: 'Table Fans',
    items: [
      { title: 'Pensonic 12-inch Table Fan (3 Speed)', price: 35, condition: 'Used', desc: 'Table Fans: strong airflow, clean blades, quiet motor for dorm.' },
      { title: 'Pensonic 12-inch Table Fan (3 Speed)', price: 52, condition: 'New', desc: 'Table Fans: brand new in box Pensonic 12-inch fan.' },
      { title: 'Jisulife Portable USB Rechargeable Table Fan', price: 38, condition: 'Used', desc: 'Table Fans: 4000mAh battery, lasts 12 hours, super quiet.' },
      { title: 'Jisulife Portable USB Rechargeable Table Fan', price: 50, condition: 'New', desc: 'Table Fans: brand new sealed Jisulife desk fan.' },
      { title: 'Khind 16-inch Stand & Table Fan', price: 48, condition: 'Used', desc: 'Table Fans: oscillating 3-speed fan, pickup at KDSE.' },
      { title: 'Xiaomi Smart Standing Fan 2 Lite', price: 95, condition: 'Used', desc: 'Table Fans: adjustable height (table or floor mode), app control.' },
      { title: 'Mini Clip-On Oscillating Bedside Table Fan', price: 25, condition: 'Used', desc: 'Table Fans: clips onto hostel bunk bed frame securely.' },
      { title: 'Mini Clip-On Oscillating Bedside Table Fan', price: 34, condition: 'New', desc: 'Table Fans: brand new rechargeable clip-on fan.' },
      { title: 'Midea 10-inch Turbo Air Circulator Table Fan', price: 55, condition: 'Used', desc: 'Table Fans: 90-degree tilt head for fast room cooling.' },
      { title: 'USB Silent Brushless Mini Desk Fan', price: 15, condition: 'New', desc: 'Table Fans: compact metal frame USB fan for study desk.' },
    ],
  },
  {
    category: 'Dorm',
    subcategory: 'Mattress & Bedding',
    items: [
      { title: 'Single Foam Mattress Topper (5cm Memory Foam)', price: 55, condition: 'Used', desc: 'Mattress & Bedding: washed removable cover, makes dorm bed super comfy.' },
      { title: 'Single Foam Mattress Topper (5cm Memory Foam)', price: 85, condition: 'New', desc: 'Mattress & Bedding: brand new vacuum-packed 5cm topper.' },
      { title: 'IKEA Single Fitted Bedsheet + Pillowcase Set (Grey)', price: 22, condition: 'Used', desc: 'Mattress & Bedding: 100% cotton, freshly laundered, no stains.' },
      { title: 'IKEA Single Fitted Bedsheet + Pillowcase Set (Grey)', price: 35, condition: 'New', desc: 'Mattress & Bedding: brand new unopened IKEA single sheet set.' },
      { title: 'Hilton Ergonomic Down-Alternative Pillow', price: 20, condition: 'New', desc: 'Mattress & Bedding: soft medium-firm hotel pillow, sealed bag.' },
      { title: 'Hilton Ergonomic Down-Alternative Pillow', price: 14, condition: 'Used', desc: 'Mattress & Bedding: used with protector for 1 semester, clean.' },
      { title: 'Foldable Single Floor Mattress (Tilam Lipat)', price: 40, condition: 'Used', desc: 'Mattress & Bedding: convenient for guests or extra dorm padding.' },
      { title: 'Breathable Microfiber Single Comforter Quilt', price: 32, condition: 'Used', desc: 'Mattress & Bedding: lightweight all-season blanket, navy blue.' },
      { title: 'Waterproof Single Mattress Protector', price: 18, condition: 'New', desc: 'Mattress & Bedding: essential hygiene cover for hostel mattress.' },
      { title: 'Bolster Pillow with Cotton Cover (Bantal Peluk)', price: 16, condition: 'New', desc: 'Mattress & Bedding: firm polyester bolster, brand new.' },
    ],
  },
  {
    category: 'Dorm',
    subcategory: 'Storage & Racks',
    items: [
      { title: 'IKEA Raskog 3-Tier Rolling Utility Cart (White)', price: 65, condition: 'Used', desc: 'Storage & Racks: sturdy metal trolley with smooth wheels.' },
      { title: 'IKEA Raskog 3-Tier Rolling Utility Cart (White)', price: 90, condition: 'New', desc: 'Storage & Racks: brand new unassembled in box.' },
      { title: '4-Tier Plastic Slim Storage Drawer Tower', price: 28, condition: 'Used', desc: 'Storage & Racks: fits neatly beside dorm wardrobe, clean.' },
      { title: '4-Tier Plastic Slim Storage Drawer Tower', price: 42, condition: 'New', desc: 'Storage & Racks: brand new 4-tier drawer organizer.' },
      { title: '4-Layer Foldable Shoe Rack (50cm Wide)', price: 15, condition: 'Used', desc: 'Storage & Racks: lightweight steel & fabric rack for 12 pairs.' },
      { title: '4-Layer Foldable Shoe Rack (50cm Wide)', price: 22, condition: 'New', desc: 'Storage & Racks: brand new boxed shoe rack.' },
      { title: '2-Tier Desktop Book & Stationery Shelf', price: 24, condition: 'Used', desc: 'Storage & Racks: wooden desk organizer for textbooks and laptop.' },
      { title: 'Under-Bed Zippered Clothes Storage Bag (Set of 2)', price: 14, condition: 'New', desc: 'Storage & Racks: dustproof foldable organizer bags.' },
      { title: 'Over-the-Door 6-Hook Stainless Steel Hanger', price: 10, condition: 'New', desc: 'Storage & Racks: no drilling required, fits UTM dorm doors.' },
      { title: 'Heavy-Duty Canvas Laundry Basket with Handles', price: 16, condition: 'Used', desc: 'Storage & Racks: collapsible 60L hamper, clean interior.' },
    ],
  },
  {
    category: 'Dorm',
    subcategory: 'Kettles & Cookware',
    items: [
      { title: 'Cornell 1.7L Stainless Steel Electric Kettle', price: 25, condition: 'Used', desc: 'Kettles & Cookware: fast boiling, auto shut-off, descaled and clean.' },
      { title: 'Cornell 1.7L Stainless Steel Electric Kettle', price: 40, condition: 'New', desc: 'Kettles & Cookware: brand new in box with 3-pin Malaysia plug.' },
      { title: 'Multipurpose Electric Mini Hotpot / Ramen Cooker (1.5L)', price: 28, condition: 'Used', desc: 'Kettles & Cookware: non-stick inner pot with steamer tray.' },
      { title: 'Multipurpose Electric Mini Hotpot / Ramen Cooker (1.5L)', price: 39, condition: 'New', desc: 'Kettles & Cookware: brand new dorm electric cooker, dual power.' },
      { title: 'Pensonic 1.0L Mini Rice Cooker', price: 35, condition: 'Used', desc: 'Kettles & Cookware: ideal for 1-2 students, includes measuring cup.' },
      { title: 'Midea 1.5L Double-Wall Anti-Scald Electric Kettle', price: 32, condition: 'Used', desc: 'Kettles & Cookware: cool-touch exterior, 304 stainless steel.' },
      { title: 'Tupperware Lunch Box & Tumbler Set (3 pcs)', price: 22, condition: 'New', desc: 'Kettles & Cookware: leakproof microwave-safe meal prep containers.' },
      { title: 'Tupperware Lunch Box & Tumbler Set (3 pcs)', price: 15, condition: 'Used', desc: 'Kettles & Cookware: lightly used, clean with no food stains.' },
      { title: 'LocknLock 500ml Insulated Thermal Flask', price: 24, condition: 'New', desc: 'Kettles & Cookware: keeps coffee hot for 12 hours during lectures.' },
      { title: 'Ceramic Ramen Bowl with Lid & Spoon Set', price: 14, condition: 'New', desc: 'Kettles & Cookware: microwave-safe dorm noodle bowl.' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. FASHION (DB category: 'Clothing')
  // ═══════════════════════════════════════════════════════════════════════════
  {
    category: 'Clothing',
    subcategory: 'UTM Corporate Polo',
    items: [
      { title: 'Official UTM Corporate Polo Shirt (Maroon, Size M)', price: 18, condition: 'Used', desc: 'UTM Corporate Polo: worn twice for presentation, clean & ironed.' },
      { title: 'Official UTM Corporate Polo Shirt (Maroon, Size M)', price: 28, condition: 'New', desc: 'UTM Corporate Polo: brand new with tag, official UTM maroon.' },
      { title: 'Official UTM Corporate Polo Shirt (Maroon, Size L)', price: 20, condition: 'Used', desc: 'UTM Corporate Polo: great condition, breathable microfiber.' },
      { title: 'Official UTM Corporate Polo Shirt (Maroon, Size L)', price: 30, condition: 'New', desc: 'UTM Corporate Polo: brand new unused faculty corporate shirt.' },
      { title: 'UTM Faculty of Computing Polo Tee (Size S)', price: 16, condition: 'Used', desc: 'UTM Corporate Polo: FC collared shirt, no fading or loose threads.' },
      { title: 'UTM FKE Engineering Corporate Polo (Size XL)', price: 22, condition: 'Used', desc: 'UTM Corporate Polo: worn once during industrial visit.' },
      { title: 'UTM Corporate Polo Long Sleeve Muslimah (Size M)', price: 25, condition: 'Used', desc: 'UTM Corporate Polo: comfortable long sleeve cut, maroon/white.' },
      { title: 'UTM Corporate Polo Long Sleeve Muslimah (Size M)', price: 35, condition: 'New', desc: 'UTM Corporate Polo: brand new sealed in plastic.' },
      { title: 'UTM Student Council Event Polo Shirt (Size L)', price: 15, condition: 'Used', desc: 'UTM Corporate Polo: navy blue collared polo, clean.' },
      { title: 'UTM Convocation & Formal Corporate Polo (Size S)', price: 24, condition: 'New', desc: 'UTM Corporate Polo: crisp collar, never worn.' },
    ],
  },
  {
    category: 'Clothing',
    subcategory: 'Baju Kurung',
    items: [
      { title: 'Baju Kurung Moden Cotton (Pastel Blue, Size S)', price: 35, condition: 'Used', desc: 'Baju Kurung: worn once for Raya/convocation, breathable cotton.' },
      { title: 'Baju Kurung Moden Cotton (Pastel Blue, Size S)', price: 55, condition: 'New', desc: 'Baju Kurung: brand new with tag, never worn.' },
      { title: 'Baju Kurung Pahang Songket Trim (Emerald, Size M)', price: 45, condition: 'Used', desc: 'Baju Kurung: elegant emerald green, great for UTM formal dinner.' },
      { title: 'Baju Kurung Pahang Songket Trim (Emerald, Size M)', price: 68, condition: 'New', desc: 'Baju Kurung: brand new unworn set with matching kain.' },
      { title: 'Baju Kurung Kedah Minimalist (Cream, Size L)', price: 30, condition: 'Used', desc: 'Baju Kurung: ironless crepe fabric, super comfortable for lectures.' },
      { title: 'Baju Kurung Riau Floral Print (Dusty Pink, Size M)', price: 38, condition: 'Used', desc: 'Baju Kurung: nursing-friendly zip, clean with no flaws.' },
      { title: 'Baju Kurung Batik Jawa (Maroon, Size L)', price: 42, condition: 'Used', desc: 'Baju Kurung: classic batik motif, worn twice.' },
      { title: 'Baju Kurung Satin Silk Plain (Champagne, Size S)', price: 48, condition: 'New', desc: 'Baju Kurung: brand new satin set for gala night.' },
      { title: 'Baju Kurung Cekak Musang (Navy, Size XL)', price: 36, condition: 'Used', desc: 'Baju Kurung: neat stitching, side pocket on baju.' },
      { title: 'Baju Kurung Lace Kebarung (Sage Green, Size M)', price: 52, condition: 'Used', desc: 'Baju Kurung: soft sage green, meetup at KTDI/KRP.' },
    ],
  },
  {
    category: 'Clothing',
    subcategory: 'Hoodies & Jackets',
    items: [
      { title: 'Uniqlo Airism UV Protection Zip Hoodie (Grey, M)', price: 38, condition: 'Used', desc: 'Hoodies & Jackets: lightweight for cold lecture halls, clean.' },
      { title: 'Uniqlo Airism UV Protection Zip Hoodie (Grey, M)', price: 58, condition: 'New', desc: 'Hoodies & Jackets: brand new with Uniqlo price tag.' },
      { title: 'H&M Oversized Fleece Pullover Hoodie (Black, L)', price: 35, condition: 'Used', desc: 'Hoodies & Jackets: thick warm fleece, no pilling.' },
      { title: 'H&M Oversized Fleece Pullover Hoodie (Black, L)', price: 50, condition: 'New', desc: 'Hoodies & Jackets: brand new unworn black hoodie.' },
      { title: 'UTM Varsity Bomber Jacket (Maroon/Cream, M)', price: 45, condition: 'Used', desc: 'Hoodies & Jackets: official campus varsity jacket, great condition.' },
      { title: 'Nike Sportswear Windbreaker Jacket (Navy, L)', price: 65, condition: 'Used', desc: 'Hoodies & Jackets: water-resistant shell for rainy campus walks.' },
      { title: 'Adidas Essentials 3-Stripes Zip Hoodie (Black, S)', price: 55, condition: 'Used', desc: 'Hoodies & Jackets: authentic Adidas hoodie, worn 3 times.' },
      { title: 'Uniqlo Sweatshirt Pullover (Olive Green, M)', price: 32, condition: 'Used', desc: 'Hoodies & Jackets: soft cotton crewneck sweatshirt.' },
      { title: 'Decathlon Quechua Rain & Wind Jacket (Blue, L)', price: 40, condition: 'New', desc: 'Hoodies & Jackets: packable waterproof jacket for motorcycle.' },
      { title: 'Corduroy Overshirt Jacket (Beige, M)', price: 36, condition: 'Used', desc: 'Hoodies & Jackets: smart casual layer for presentations.' },
    ],
  },
  {
    category: 'Clothing',
    subcategory: 'Sneakers & Shoes',
    items: [
      { title: 'Nike Air Force 1 Low White (UK 8 / EU 42)', price: 140, condition: 'Used', desc: 'Sneakers & Shoes: clean uppers, slight crease, 8.5/10 condition.' },
      { title: 'Nike Air Force 1 Low White (UK 8 / EU 42)', price: 195, condition: 'Used', desc: 'Sneakers & Shoes: 9.5/10 near-new with original Nike box.' },
      { title: 'Converse Chuck Taylor All Star High (Black, UK 7)', price: 75, condition: 'Used', desc: 'Sneakers & Shoes: classic canvas high-top, clean soles.' },
      { title: 'Converse Chuck Taylor All Star High (Black, UK 7)', price: 110, condition: 'New', desc: 'Sneakers & Shoes: brand new in box, wrong size gift.' },
      { title: 'Vans Old Skool Classic (Black/White, UK 8.5)', price: 85, condition: 'Used', desc: 'Sneakers & Shoes: comfortable daily campus walking shoes.' },
      { title: 'Adidas Ultraboost Running Sneakers (Grey, UK 9)', price: 160, condition: 'Used', desc: 'Sneakers & Shoes: super cushioned boost sole, freshly washed.' },
      { title: 'New Balance 574 Classic (Navy, UK 6)', price: 120, condition: 'Used', desc: 'Sneakers & Shoes: suede & mesh, great arch support.' },
      { title: 'Bata Comfit Formal Black Loafers (UK 8)', price: 45, condition: 'Used', desc: 'Sneakers & Shoes: worn twice for FYP viva presentation.' },
      { title: 'Crocs Classic Clogs (Bone White, UK 7)', price: 65, condition: 'New', desc: 'Sneakers & Shoes: brand new with tags, comfy dorm footwear.' },
      { title: 'Puma Smash v2 Leather Sneakers (White, UK 9)', price: 80, condition: 'Used', desc: 'Sneakers & Shoes: clean white leather court shoes.' },
    ],
  },
  {
    category: 'Clothing',
    subcategory: 'Bags & Backpacks',
    items: [
      { title: 'Doughnut Macaroon Laptop Backpack 16L (Navy)', price: 65, condition: 'Used', desc: 'Bags & Backpacks: fits 14-inch laptop, water-repellent, clean.' },
      { title: 'Doughnut Macaroon Laptop Backpack 16L (Navy)', price: 95, condition: 'New', desc: 'Bags & Backpacks: brand new with tag, never used.' },
      { title: 'Xiaomi Classic Business Backpack 2 (15.6-inch)', price: 42, condition: 'Used', desc: 'Bags & Backpacks: padded laptop sleeve, sleek black design.' },
      { title: 'Xiaomi Classic Business Backpack 2 (15.6-inch)', price: 60, condition: 'New', desc: 'Bags & Backpacks: brand new sealed Xiaomi laptop bag.' },
      { title: 'Herschel Little America Backpack (Black, 25L)', price: 110, condition: 'Used', desc: 'Bags & Backpacks: magnetic strap closure, padded 15-inch sleeve.' },
      { title: 'Uniqlo Round Mini Shoulder Bag (Beige)', price: 28, condition: 'Used', desc: 'Bags & Backpacks: viral lightweight sling bag, freshly washed.' },
      { title: 'Nike Brasilia Training Duffel Bag (41L)', price: 55, condition: 'Used', desc: 'Bags & Backpacks: separate shoe compartment for gym/sports.' },
      { title: 'Anello Kuchigane Clasp Backpack (Regular, Maroon)', price: 58, condition: 'Used', desc: 'Bags & Backpacks: wide mouth opening, fits A4 files & textbooks.' },
      { title: 'Canvas Tote Bag with Zip & Laptop Pocket', price: 18, condition: 'New', desc: 'Bags & Backpacks: thick 16oz canvas tote for lectures.' },
      { title: 'Samsonite 15.6-inch Padded Laptop Sleeve', price: 32, condition: 'Used', desc: 'Bags & Backpacks: shockproof inner lining with front pocket.' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. SERVICES (DB category: 'Services')
  // ═══════════════════════════════════════════════════════════════════════════
  {
    category: 'Services',
    subcategory: 'Printing & Binding',
    items: [
      { title: 'FYP Thesis Hardcover Printing & Gold Stamping', price: 35, condition: 'New', desc: 'Printing & Binding: UTM format compliant, 24-hour express turnaround.' },
      { title: 'FYP Thesis Hardcover Printing & Gold Stamping', price: 48, condition: 'New', desc: 'Printing & Binding: same-day express hardcover + 200 color pages.' },
      { title: 'A4 Black & White Laser Printing (100 Pages Pack)', price: 8, condition: 'New', desc: 'Printing & Binding: RM 0.08/page 80gsm paper, pickup at KRP.' },
      { title: 'A4 Black & White Laser Printing (100 Pages Pack)', price: 12, condition: 'New', desc: 'Printing & Binding: includes comb binding & transparent cover.' },
      { title: 'A4 Full Color Lecture Notes Printing & Comb Binding', price: 18, condition: 'New', desc: 'Printing & Binding: vivid inkjet/laser color for slides & diagrams.' },
      { title: 'A4 Full Color Lecture Notes Printing & Comb Binding', price: 24, condition: 'New', desc: 'Printing & Binding: heavy 100gsm paper + spiral wire-O binding.' },
      { title: 'A3 Architecture & Engineering CAD Poster Plotting', price: 15, condition: 'New', desc: 'Printing & Binding: high-res matte/glossy poster for FABU/FKA.' },
      { title: 'Document Scanning, Lamination & Booklet Binding', price: 6, condition: 'New', desc: 'Printing & Binding: quick dorm service for forms and certificates.' },
      { title: 'Sticker & Event Poster Printing (A4/A5 Glossy)', price: 10, condition: 'New', desc: 'Printing & Binding: custom club event stickers and flyers.' },
      { title: '200-Page Lab Report Double-Sided Print + Tape Bind', price: 14, condition: 'New', desc: 'Printing & Binding: fast overnight printing, WhatsApp PDF ready.' },
    ],
  },
  {
    category: 'Services',
    subcategory: 'PC & Phone Repair',
    items: [
      { title: 'Laptop Thermal Paste & Deep Dust Cleaning Service', price: 25, condition: 'New', desc: 'PC & Phone Repair: Arctic MX-4 paste, fan cleaning, fixes overheating.' },
      { title: 'Laptop Thermal Paste & Deep Dust Cleaning Service', price: 38, condition: 'New', desc: 'PC & Phone Repair: Thermal Grizzly Kryonaut paste + heatsink polish.' },
      { title: 'Windows 11 / Ubuntu Dual-Boot OS Format & Setup', price: 20, condition: 'New', desc: 'PC & Phone Repair: clean OS install + drivers + campus Wi-Fi setup.' },
      { title: 'Windows 11 / Ubuntu Dual-Boot OS Format & Setup', price: 30, condition: 'New', desc: 'PC & Phone Repair: includes data backup and full software setup.' },
      { title: 'Laptop RAM & NVMe SSD Upgrade Installation', price: 15, condition: 'New', desc: 'PC & Phone Repair: labor & data cloning service at KTDI/KRP.' },
      { title: 'iPhone Screen & Battery Replacement Service (Labor)', price: 35, condition: 'New', desc: 'PC & Phone Repair: careful installation with waterproof seal.' },
      { title: 'Broken Laptop Hinge & Keyboard Replacement Service', price: 40, condition: 'New', desc: 'PC & Phone Repair: epoxy hinge reinforcement and keycap fix.' },
      { title: 'Mechanical Keyboard Switch Lubing & Stabilizer Mod', price: 30, condition: 'New', desc: 'PC & Phone Repair: Krytox 205g0 lubing for thocky sound.' },
      { title: 'Android Bootloop & Software Recovery Service', price: 25, condition: 'New', desc: 'PC & Phone Repair: firmware flash and data rescue.' },
      { title: 'Virus Removal & Slow PC Speedup Tune-Up', price: 18, condition: 'New', desc: 'PC & Phone Repair: malware cleanup and startup optimization.' },
    ],
  },
  {
    category: 'Services',
    subcategory: 'Tutoring & Proofreading',
    items: [
      { title: 'Calculus 1 & Engineering Maths 1-on-1 Tutoring (1 Hr)', price: 20, condition: 'New', desc: 'Tutoring & Proofreading: 4.0 GPA senior, library or online session.' },
      { title: 'Calculus 1 & Engineering Maths 1-on-1 Tutoring (1 Hr)', price: 30, condition: 'New', desc: 'Tutoring & Proofreading: includes custom past-year practice pack.' },
      { title: 'C++ / Python / Java Programming Assignment Tutoring', price: 25, condition: 'New', desc: 'Tutoring & Proofreading: debug help and OOP/DSA concept coaching.' },
      { title: 'C++ / Python / Java Programming Assignment Tutoring', price: 35, condition: 'New', desc: 'Tutoring & Proofreading: intensive 90-min live coding walkthrough.' },
      { title: 'FYP Thesis & Research Paper English Proofreading', price: 30, condition: 'New', desc: 'Tutoring & Proofreading: grammar, flow, and IEEE/APA citation check.' },
      { title: 'FYP Thesis & Research Paper English Proofreading', price: 45, condition: 'New', desc: 'Tutoring & Proofreading: full chapter editing + Turnitin prep.' },
      { title: 'MUET Speaking & Writing Intensive Coaching (1 Hr)', price: 22, condition: 'New', desc: 'Tutoring & Proofreading: Band 5 scorer tips and mock practice.' },
      { title: 'SolidWorks & AutoCAD 3D Modeling Tutoring (1 Hr)', price: 28, condition: 'New', desc: 'Tutoring & Proofreading: assembly, drawing, and stress simulation.' },
      { title: 'Resume & Internship Cover Letter Review Service', price: 15, condition: 'New', desc: 'Tutoring & Proofreading: ATS-friendly formatting for tech/eng roles.' },
      { title: 'Statistical Analysis SPSS / R Studio Guidance (1 Hr)', price: 30, condition: 'New', desc: 'Tutoring & Proofreading: ANOVA, regression, and chart interpretation.' },
    ],
  },
  {
    category: 'Services',
    subcategory: 'Campus Carpool',
    items: [
      { title: 'UTM Skudai to Larkin Sentral / JB Sentral Carpool', price: 12, condition: 'New', desc: 'Campus Carpool: Myvi sedan, AC cold, weekend & Friday trips.' },
      { title: 'UTM Skudai to Larkin Sentral / JB Sentral Carpool', price: 18, condition: 'New', desc: 'Campus Carpool: direct door-to-door solo ride from KRP/KTDI.' },
      { title: 'UTM to Senai International Airport (JHB) Carpool', price: 20, condition: 'New', desc: 'Campus Carpool: shared ride with space for 2 large luggages.' },
      { title: 'UTM to Senai International Airport (JHB) Carpool', price: 32, condition: 'New', desc: 'Campus Carpool: private early-morning airport transfer.' },
      { title: 'Daily Morning Campus Carpool (Taman Universiti to FABU)', price: 4, condition: 'New', desc: 'Campus Carpool: 7:45 AM departure, Mon-Fri semester pass option.' },
      { title: 'UTM to Paradigm Mall / AEON Taman U Weekend Ride', price: 6, condition: 'New', desc: 'Campus Carpool: round-trip grocery & mall run every Saturday.' },
      { title: 'UTM to Mid Valley Southkey Carpool (Per Seat)', price: 10, condition: 'New', desc: 'Campus Carpool: Friday evening & Sunday afternoon slots.' },
      { title: 'UTM Skudai to KL TBS Weekend Intercity Carpool', price: 38, condition: 'New', desc: 'Campus Carpool: comfortable Honda City, highway tolls included.' },
      { title: 'UTM Dorm Moving Helper & Car Boot Transport', price: 25, condition: 'New', desc: 'Campus Carpool: move boxes between residential colleges easily.' },
      { title: 'UTM to Mount Austin Food & Study Cafe Carpool', price: 12, condition: 'New', desc: 'Campus Carpool: evening group ride, up to 4 passengers.' },
    ],
  },
  {
    category: 'Services',
    subcategory: 'Event Photography',
    items: [
      { title: 'UTM Convocation & Graduation Portrait Session (1 Hr)', price: 60, condition: 'New', desc: 'Event Photography: Sony A7III + 50mm f/1.8, 30 edited photos.' },
      { title: 'UTM Convocation & Graduation Portrait Session (1 Hr)', price: 95, condition: 'New', desc: 'Event Photography: 2-hour session + all raw & 60 edited photos.' },
      { title: 'Student Club / Annual Dinner Event Photography (2 Hrs)', price: 110, condition: 'New', desc: 'Event Photography: candid & stage coverage, 48-hour delivery.' },
      { title: 'Student Club / Annual Dinner Event Photography (2 Hrs)', price: 160, condition: 'New', desc: 'Event Photography: includes flash lighting & highlight reel.' },
      { title: 'LinkedIn & Corporate Headshot Mini Shoot (30 Min)', price: 25, condition: 'New', desc: 'Event Photography: 8 retouched professional portraits at PSZ.' },
      { title: 'LinkedIn & Corporate Headshot Mini Shoot (30 Min)', price: 38, condition: 'New', desc: 'Event Photography: studio backdrop + outfit change option.' },
      { title: 'Sports Tournament Action Photography (Half Day)', price: 90, condition: 'New', desc: 'Event Photography: 70-200mm telephoto lens for futsal/badminton.' },
      { title: 'Couple / Friendship Outdoor Campus Photoshoot', price: 50, condition: 'New', desc: 'Event Photography: Tasik Ilmu & Masjid Sultan Ismail locations.' },
      { title: 'Product & E-Commerce Studio Photography (10 Items)', price: 45, condition: 'New', desc: 'Event Photography: clean white/lifestyle shots for student biz.' },
      { title: 'Short Event Recap Reel Videography & Editing', price: 80, condition: 'New', desc: 'Event Photography: 60-second vertical 4K highlight video.' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. SPORTS (DB category: 'Other')
  // ═══════════════════════════════════════════════════════════════════════════
  {
    category: 'Other',
    subcategory: 'Campus Bicycles',
    items: [
      { title: '26-inch Mountain Bike 21-Speed (Black/Red)', price: 180, condition: 'Used', desc: 'Campus Bicycles: smooth gear shifting, front suspension, good tires.' },
      { title: '26-inch Mountain Bike 21-Speed (Black/Red)', price: 240, condition: 'Used', desc: 'Campus Bicycles: newly serviced brakes, includes U-lock & bell.' },
      { title: 'Campus Commute Fixed Gear Bicycle (Matte Grey)', price: 120, condition: 'Used', desc: 'Campus Bicycles: lightweight frame for KRP to faculty commute.' },
      { title: 'Campus Commute Fixed Gear Bicycle (Matte Grey)', price: 155, condition: 'Used', desc: 'Campus Bicycles: new chain and brake pads, ready to ride.' },
      { title: '20-inch Foldable City Bicycle (White)', price: 190, condition: 'Used', desc: 'Campus Bicycles: folds into car boot, 7-speed Shimano gears.' },
      { title: '20-inch Foldable City Bicycle (White)', price: 250, condition: 'New', desc: 'Campus Bicycles: brand new assembled folding bike with basket.' },
      { title: 'Decathlon Btwin Riverside Hybrid Bike (M)', price: 280, condition: 'Used', desc: 'Campus Bicycles: upright posture, great for UTM hilly roads.' },
      { title: 'Ladies City Cruiser Bike with Front Basket (Mint)', price: 165, condition: 'Used', desc: 'Campus Bicycles: comfortable spring saddle and rear rack.' },
      { title: 'Heavy-Duty Bicycle U-Lock + Rechargeable Tail Light', price: 28, condition: 'New', desc: 'Campus Bicycles: anti-theft steel lock and USB safety light.' },
      { title: '700c Road Bike Entry Level (14-Speed)', price: 320, condition: 'Used', desc: 'Campus Bicycles: fast drop-bar road bike for weekend rides.' },
    ],
  },
  {
    category: 'Other',
    subcategory: 'Badminton Rackets',
    items: [
      { title: 'Yonex Astrox 77 Pro Badminton Racket (4U G5)', price: 260, condition: 'Used', desc: 'Badminton Rackets: strung with BG66 Ultimax at 25 lbs, 1 paint chip.' },
      { title: 'Yonex Astrox 77 Pro Badminton Racket (4U G5)', price: 340, condition: 'Used', desc: 'Badminton Rackets: mint condition, original Sunrise hologram.' },
      { title: 'Yonex Nanoray 10F Beginner Badminton Racket', price: 65, condition: 'Used', desc: 'Badminton Rackets: lightweight head-light racket with bag.' },
      { title: 'Yonex Nanoray 10F Beginner Badminton Racket', price: 95, condition: 'New', desc: 'Badminton Rackets: brand new factory strung with Yonex cover.' },
      { title: 'Li-Ning Windstorm 72 Superlight Racket', price: 150, condition: 'Used', desc: 'Badminton Rackets: ultra-light 72g for fast doubles net play.' },
      { title: 'Victor Thruster K Hammer Attacking Racket', price: 115, condition: 'Used', desc: 'Badminton Rackets: strung at 26 lbs, fresh Yonex AC102 grip.' },
      { title: 'Apacs Z-Ziggler Offensive Badminton Racket', price: 75, condition: 'Used', desc: 'Badminton Rackets: great budget smash racket, clean frame.' },
      { title: 'Apacs Z-Ziggler Offensive Badminton Racket', price: 105, condition: 'New', desc: 'Badminton Rackets: brand new unstrung or free 24 lbs string.' },
      { title: 'Yonex 6-Racket Thermal Badminton Bag', price: 55, condition: 'Used', desc: 'Badminton Rackets: 2 main compartments + shoe pocket.' },
      { title: 'RSL Classic Tourney Shuttlecocks (Tube of 12)', price: 48, condition: 'New', desc: 'Badminton Rackets: sealed tube speed 77, great for UTM sports hall.' },
    ],
  },
  {
    category: 'Other',
    subcategory: 'Football / Futsal',
    items: [
      { title: 'Adidas Predator Edge.3 Futsal Boots (UK 8)', price: 85, condition: 'Used', desc: 'Football / Futsal: non-marking rubber sole, clean upper.' },
      { title: 'Adidas Predator Edge.3 Futsal Boots (UK 8)', price: 130, condition: 'New', desc: 'Football / Futsal: brand new in box, never worn on court.' },
      { title: 'Nike Mercurial Vapor 15 Club FG Boots (UK 8.5)', price: 95, condition: 'Used', desc: 'Football / Futsal: firm ground studs for UTM stadium turf.' },
      { title: 'Nike Mercurial Vapor 15 Club FG Boots (UK 8.5)', price: 145, condition: 'New', desc: 'Football / Futsal: brand new with tags, lightweight synthetic.' },
      { title: 'Molten Vantaggio Size 4 Futsal Ball (Low Bounce)', price: 45, condition: 'Used', desc: 'Football / Futsal: holds air well, great grip for court play.' },
      { title: 'Molten Vantaggio Size 4 Futsal Ball (Low Bounce)', price: 68, condition: 'New', desc: 'Football / Futsal: brand new official match-spec futsal ball.' },
      { title: 'Adidas Al Rihla Training Football (Size 5)', price: 50, condition: 'Used', desc: 'Football / Futsal: machine-stitched TPU, clean graphics.' },
      { title: 'Nike Mercurial Lite Shin Guards + Sleeves (M)', price: 28, condition: 'New', desc: 'Football / Futsal: lightweight protective shin pads.' },
      { title: 'Goalkeeper Padded Gloves (Size 9)', price: 35, condition: 'Used', desc: 'Football / Futsal: sticky latex palm, used 3 matches.' },
      { title: 'Kipsta Training Cones & Agility Ladder Set', price: 24, condition: 'New', desc: 'Football / Futsal: 10 cones + 4m speed ladder with carry bag.' },
    ],
  },
  {
    category: 'Other',
    subcategory: 'Gym & Fitness',
    items: [
      { title: '20kg Adjustable Dumbbell & Barbell Set (Cast Iron)', price: 75, condition: 'Used', desc: 'Gym & Fitness: complete plates + spinlocks, great for dorm workouts.' },
      { title: '20kg Adjustable Dumbbell & Barbell Set (Cast Iron)', price: 105, condition: 'New', desc: 'Gym & Fitness: brand new 20kg set in carrying case.' },
      { title: 'TPE Non-Slip Yoga & Exercise Mat (8mm Thick)', price: 22, condition: 'Used', desc: 'Gym & Fitness: sanitized, includes carry strap, navy blue.' },
      { title: 'TPE Non-Slip Yoga & Exercise Mat (8mm Thick)', price: 35, condition: 'New', desc: 'Gym & Fitness: brand new sealed 8mm dual-layer TPE mat.' },
      { title: 'Doorframe Pull-Up Bar (No-Screw Heavy Duty)', price: 32, condition: 'Used', desc: 'Gym & Fitness: foam grips, fits standard hostel room doorways.' },
      { title: '5-Piece Resistance Loop & Tube Bands Set', price: 18, condition: 'New', desc: 'Gym & Fitness: 10-50 lbs resistance with door anchor & handles.' },
      { title: 'Push-Up Board 14-in-1 Foldable Workout System', price: 24, condition: 'Used', desc: 'Gym & Fitness: color-coded chest, shoulder, and tricep angles.' },
      { title: 'Ab Roller Wheel with Knee Pad Mat', price: 16, condition: 'New', desc: 'Gym & Fitness: dual-wheel stability for core workouts.' },
      { title: 'Speed Jump Rope with Ball Bearings & Counter', price: 15, condition: 'New', desc: 'Gym & Fitness: adjustable steel cable for cardio.' },
      { title: 'Optimum Nutrition Shaker Bottle 700ml + Gym Gloves', price: 25, condition: 'New', desc: 'Gym & Fitness: BPA-free leakproof shaker & padded wrist wraps.' },
    ],
  },
];

async function seedCategories() {
  console.log('='.repeat(60));
  console.log('EZ SWAP — Seeding All Categories & Subcategories');
  console.log('='.repeat(60));

  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`Connected to MongoDB: ${mongoose.connection.name}`);

  // 1. Upsert demo sellers
  const sellerIds = [];
  for (const s of DEMO_SELLERS) {
    let user = await User.findOne({ email: s.email });
    if (!user) {
      user = await User.create({
        ...s,
        passwordHash: 'scrypt:demo:hash',
        verificationStatus: 'verified',
        isEmailApproved: true,
        role: 'student',
      });
    }
    sellerIds.push(user._id);
  }
  console.log(`Ready with ${sellerIds.length} verified demo sellers.`);

  // 2. Clear previous listings created by these seed sellers (idempotent)
  const deleted = await Listing.deleteMany({ sellerId: { $in: sellerIds } });
  console.log(`Cleared ${deleted.deletedCount} previous seeded listings.`);

  // 3. Build all 310 listings
  const docs = [];
  let idx = 0;

  for (const group of SUBCATEGORY_DATA) {
    for (const item of group.items) {
      const sellerId = sellerIds[idx % sellerIds.length];
      docs.push({
        sellerId,
        title: item.title,
        description: item.desc,
        price: item.price,
        category: group.category,
        condition: item.condition,
        tags: [
          group.category.toLowerCase(),
          group.subcategory.toLowerCase(),
          item.condition.toLowerCase(),
        ],
        viewsCount: (idx * 7) % 85 + 5,
        images: [{ imageUrl: SUBCATEGORY_IMAGES[group.subcategory], displayOrder: 0 }],
        status: 'active',
      });
      idx++;
    }
  }

  const inserted = await Listing.insertMany(docs);
  console.log(`Inserted ${inserted.length} listings across ${SUBCATEGORY_DATA.length} subcategories!`);

  // 4. Print breakdown by category and verify every subcategory query (>= 10 items)
  const breakdown = await Listing.aggregate([
    { $match: { sellerId: { $in: sellerIds } } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  console.log('Category Breakdown:', JSON.stringify(breakdown));

  let allSubcategoriesOk = true;
  for (const group of SUBCATEGORY_DATA) {
    const count = await Listing.countDocuments({
      category: group.category,
      status: 'active',
      $or: [
        { title: { $regex: group.subcategory, $options: 'i' } },
        { description: { $regex: group.subcategory, $options: 'i' } },
      ],
    });
    if (count < 10) {
      allSubcategoriesOk = false;
      console.error(`LOW COUNT: ${group.category} -> ${group.subcategory} (${count})`);
    }
  }
  console.log(`Subcategory filter verification (all ${SUBCATEGORY_DATA.length} >= 10): ${allSubcategoriesOk}`);

  await mongoose.connection.close();
  console.log('Done.');
}

if (require.main === module) {
  seedCategories().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
}

module.exports = { seedCategories, SUBCATEGORY_DATA, DEMO_SELLERS, SUBCATEGORY_IMAGES };
