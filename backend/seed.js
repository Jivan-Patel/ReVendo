require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const User = require("./src/models/User");
const Listing = require("./src/models/Listing");

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Copy sample images from client assets if available
const clientAssets = path.join(__dirname, "../client/assets");
const sampleImages = [
  "background.jpg",
  "atakan.jpg",
  "mosh.jpg",
  "splash.png",
  "icon.png",
  "test_logo.png",
];

sampleImages.forEach((img) => {
  const src = path.join(clientAssets, img);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(uploadsDir, `seed_${img}`));
  }
});

const seedDatabase = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/revendo"
    );
    console.log("Connected to MongoDB for seeding...");

    // Clear existing data
    await User.deleteMany({});
    await Listing.deleteMany({});
    console.log("Cleared existing users and listings.");

    // Shared password "12345" for all users
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("12345", salt);

    // 1. Create Users
    const usersData = [
      {
        name: "ReVendo Admin",
        email: "admin@gmail.com",
        password: hashedPassword,
        bio: "ReVendo Marketplace Official Administrator.",
        phone: "+91 99999 88888",
      },
      {
        name: "Aarav Patel",
        email: "aarav@revendo.com",
        password: hashedPassword,
        bio: "Tech & camera enthusiast based in Bhuj, Kutch.",
        phone: "+91 98765 43210",
      },
      {
        name: "Vruti Patel",
        email: "vruti@revendo.com",
        password: hashedPassword,
        bio: "Interior designer selling vintage and modern home furniture in Kalol.",
        phone: "+91 98250 12345",
      },
      {
        name: "Rohan Desai",
        email: "rohan@revendo.com",
        password: hashedPassword,
        bio: "Software developer & avid gamer in Gandhinagar Infocity.",
        phone: "+91 94260 56789",
      },
      {
        name: "Ananya Mehta",
        email: "ananya@revendo.com",
        password: hashedPassword,
        bio: "Fashion curator & designer based in Vastrapur, Ahmedabad.",
        phone: "+91 98980 11223",
      },
      {
        name: "Vikram Malhotra",
        email: "vikram@revendo.com",
        password: hashedPassword,
        bio: "Music producer & sound engineer in Bandra, Mumbai.",
        phone: "+91 99200 44556",
      },
    ];

    const createdUsers = await User.insertMany(usersData);
    console.log(`Created ${createdUsers.length} users with password "12345".`);

    const [adminUser, aarav, vruti, rohan, ananya, vikram] = createdUsers;

    const baseUrl = process.env.BASE_URL || "http://localhost:9000";

    const imgBackground = {
      url: `${baseUrl}/uploads/seed_background.jpg`,
      thumbnailUrl: `${baseUrl}/uploads/seed_background.jpg`,
    };
    const imgSplash = {
      url: `${baseUrl}/uploads/seed_splash.png`,
      thumbnailUrl: `${baseUrl}/uploads/seed_splash.png`,
    };
    const imgLogo = {
      url: `${baseUrl}/uploads/seed_test_logo.png`,
      thumbnailUrl: `${baseUrl}/uploads/seed_test_logo.png`,
    };

    // 2. Create Sample Listings (3 per user across Bhuj, Kalol, Gandhinagar, Ahmedabad, Mumbai)
    const sampleListings = [
      // --- Aarav Patel (Bhuj: 23.2420, 69.6669) ---
      {
        title: "Sony Alpha A7 III Full-Frame Camera",
        price: 1250,
        categoryId: 3, // Cameras
        condition: "Like New",
        description:
          "In pristine condition with shutter count under 4,500. Includes 28-70mm OSS lens kit, original box, and 2 genuine Sony batteries.",
        images: [imgBackground, imgSplash],
        location: { latitude: 23.242, longitude: 69.6669 },
        userId: aarav._id,
      },
      {
        title: "DJI Mini 3 Pro Drone with Smart RC",
        price: 680,
        categoryId: 3, // Cameras
        condition: "Brand New",
        description:
          "Brand new factory-sealed drone. Features 4K/60fps HDR video, obstacle sensing, and 34-min flight time with the lightweight design.",
        images: [imgBackground, imgLogo],
        location: { latitude: 23.2465, longitude: 69.6715 },
        userId: aarav._id,
      },
      {
        title: 'Apple iPad Pro 11" M2 (128GB)',
        price: 590,
        categoryId: 9, // Other
        condition: "Good",
        description:
          "Space Gray 11-inch Liquid Retina display. Battery health at 93%. Very minor edge wear, screen is flawless. Includes fast charger.",
        images: [imgSplash, imgBackground],
        location: { latitude: 23.238, longitude: 69.662 },
        userId: aarav._id,
      },

      // --- Vruti Patel (Kalol: 23.2500, 72.4967) ---
      {
        title: "Mid-Century Teak Wood Coffee Table",
        price: 180,
        categoryId: 1, // Furniture
        condition: "Good",
        description:
          "Solid seasoned Indian teak with brass-tipped tapered legs. Classic 1960s aesthetic with a natural wax finish.",
        images: [imgBackground, imgSplash],
        location: { latitude: 23.25, longitude: 72.4967 },
        userId: vruti._id,
      },
      {
        title: "Ergonomic High-Back Mesh Office Chair",
        price: 140,
        categoryId: 1, // Furniture
        condition: "Like New",
        description:
          "Adjustable 3D armrests, breathable Korean mesh, dynamic lumbar support, and smooth multi-lock recline mechanism.",
        images: [imgSplash, imgBackground],
        location: { latitude: 23.2535, longitude: 72.4925 },
        userId: vruti._id,
      },
      {
        title: "Handwoven Bohemian Geometric Area Rug (5x7)",
        price: 95,
        categoryId: 1, // Furniture
        condition: "Brand New",
        description:
          "100% natural wool hand-tufted geometric rug. Warm earth tones, soft underfoot, brand new and unused with tags.",
        images: [imgBackground, imgLogo],
        location: { latitude: 23.248, longitude: 72.5015 },
        userId: vruti._id,
      },

      // --- Rohan Desai (Gandhinagar: 23.2156, 72.6369) ---
      {
        title: "PlayStation 5 Disc Edition + 2 Controllers",
        price: 440,
        categoryId: 4, // Games
        condition: "Like New",
        description:
          "Barely used PS5 Disc Edition in original retail box. Comes with two DualSense controllers, HDMI 2.1 cable, and vertical stand.",
        images: [imgSplash, imgBackground],
        location: { latitude: 23.2156, longitude: 72.6369 },
        userId: rohan._id,
      },
      {
        title: "SteelSeries Arctis Nova Pro Wireless Headset",
        price: 230,
        categoryId: 7, // Movies & Music
        condition: "Brand New",
        description:
          "Active Noise Cancellation, dual wireless audio stream, and infinite battery hot-swap system. Sealed in original packaging.",
        images: [imgBackground, imgSplash],
        location: { latitude: 23.2205, longitude: 72.6415 },
        userId: rohan._id,
      },
      {
        title: "Nintendo Switch OLED Model (White)",
        price: 260,
        categoryId: 4, // Games
        condition: "Good",
        description:
          "Vibrant 7-inch OLED screen with tempered glass protector installed on day one. Includes Joy-Cons, dock, and 128GB microSD card.",
        images: [imgBackground, imgLogo],
        location: { latitude: 23.2115, longitude: 72.6325 },
        userId: rohan._id,
      },

      // --- Ananya Mehta (Ahmedabad: 23.0225, 72.5714) ---
      {
        title: "Handcrafted Full-Grain Leather Messenger Bag",
        price: 115,
        categoryId: 5, // Clothing
        condition: "Brand New",
        description:
          "Artisan vegetable-tanned leather bag with padded compartment fitting up to 15-inch laptops. Antiqued brass hardware.",
        images: [imgBackground, imgSplash],
        location: { latitude: 23.0225, longitude: 72.5714 },
        userId: ananya._id,
      },
      {
        title: "Vintage Levi's Sherpa Denim Trucker Jacket",
        price: 75,
        categoryId: 5, // Clothing
        condition: "Good",
        description:
          "Classic medium vintage wash Levi's trucker jacket with warm cream sherpa fleece lining. Size Medium, authentic vintage piece.",
        images: [imgSplash, imgBackground],
        location: { latitude: 23.0285, longitude: 72.5655 },
        userId: ananya._id,
      },
      {
        title: "Minimalist Matte Ceramic Scandinavian Desk Lamp",
        price: 45,
        categoryId: 1, // Furniture
        condition: "Like New",
        description:
          "Matte sand finish ceramic base with dimmable warm LED bulb and braided fabric cord. Beautiful warm ambient light.",
        images: [imgBackground, imgLogo],
        location: { latitude: 23.0195, longitude: 72.5785 },
        userId: ananya._id,
      },

      // --- Vikram Malhotra (Mumbai: 19.0760, 72.8777) ---
      {
        title: "Fender Player Stratocaster Electric Guitar",
        price: 580,
        categoryId: 7, // Movies & Music
        condition: "Like New",
        description:
          "3-Color Sunburst finish with maple fingerboard and Alnico 5 single-coil pickups. Fully set up with low action and fresh strings.",
        images: [imgBackground, imgSplash],
        location: { latitude: 19.076, longitude: 72.8777 },
        userId: vikram._id,
      },
      {
        title: "Audio-Technica ATH-M50x Studio Monitor Headphones",
        price: 125,
        categoryId: 7, // Movies & Music
        condition: "Good",
        description:
          "Exceptional clarity across an extended frequency range with deep bass response. Includes 3 detachable cables and carry pouch.",
        images: [imgSplash, imgBackground],
        location: { latitude: 19.0825, longitude: 72.8825 },
        userId: vikram._id,
      },
      {
        title: 'Apple MacBook Pro 14" M1 Pro (16GB RAM / 512GB SSD)',
        price: 1150,
        categoryId: 9, // Other
        condition: "Good",
        description:
          "Space Gray with 120Hz ProMotion Liquid Retina XDR screen. Fast M1 Pro 8-core CPU / 14-core GPU. Battery health 91%. Comes with MagSafe charger.",
        images: [imgBackground, imgLogo],
        location: { latitude: 19.0715, longitude: 72.8725 },
        userId: vikram._id,
      },
    ];

    await Listing.insertMany(sampleListings);
    console.log(`Seeded ${sampleListings.length} initial listings across 5 cities.`);

    console.log("==================================================");
    console.log("Seeding complete! User Accounts (Password: 12345):");
    console.log("1. admin@gmail.com - ReVendo Admin");
    console.log("2. aarav@revendo.com - Aarav Patel (Bhuj)");
    console.log("3. vruti@revendo.com - Vruti Patel (Kalol)");
    console.log("4. rohan@revendo.com - Rohan Desai (Gandhinagar)");
    console.log("5. ananya@revendo.com - Ananya Mehta (Ahmedabad)");
    console.log("6. vikram@revendo.com - Vikram Malhotra (Mumbai)");
    console.log("==================================================");

    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
};

seedDatabase();
