const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Worker = require('../models/Worker');

dotenv.config();

const workers = [
  // Electricians
  {
    name: 'Rajesh Kumar',
    phone: '9876543210',
    serviceCategory: 'Electrician',
    pricePerHour: 300,
    rating: 4.8,
    totalRatings: 127,
    totalReviews: 127,
    experience: 8,
    availability: true,
    location: {
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001'
    },
    skills: ['Wiring', 'Fan Installation', 'Switchboard Repair', 'Inverter Setup'],
    completedJobs: 245
  },
  {
    name: 'Amit Sharma',
    phone: '9876543211',
    serviceCategory: 'Electrician',
    pricePerHour: 350,
    rating: 4.9,
    totalRatings: 203,
    totalReviews: 203,
    experience: 12,
    availability: true,
    location: {
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001'
    },
    skills: ['Industrial Wiring', 'Solar Installation', 'Home Automation'],
    completedJobs: 389
  },
  {
    name: 'Suresh Patel',
    phone: '9876543212',
    serviceCategory: 'Electrician',
    pricePerHour: 280,
    rating: 4.6,
    totalRatings: 89,
    totalReviews: 89,
    experience: 5,
    availability: true,
    location: {
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001'
    },
    skills: ['Basic Wiring', 'Light Fixtures', 'Socket Repairs'],
    completedJobs: 156
  },
  
  // Plumbers
  {
    name: 'Mohammed Rafi',
    phone: '9876543213',
    serviceCategory: 'Plumbing',
    pricePerHour: 320,
    rating: 4.7,
    totalRatings: 145,
    totalReviews: 145,
    experience: 10,
    availability: true,
    location: {
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600001'
    },
    skills: ['Pipe Installation', 'Leak Repairs', 'Bathroom Fitting', 'Water Heater'],
    completedJobs: 298
  },
  {
    name: 'Vikram Singh',
    phone: '9876543214',
    serviceCategory: 'Plumbing',
    pricePerHour: 290,
    rating: 4.5,
    totalRatings: 78,
    totalReviews: 78,
    experience: 6,
    availability: true,
    location: {
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411001'
    },
    skills: ['Drainage', 'Tap Repairs', 'Toilet Installation'],
    completedJobs: 167
  },
  {
    name: 'Prakash Yadav',
    phone: '9876543215',
    serviceCategory: 'Plumbing',
    pricePerHour: 310,
    rating: 4.8,
    totalRatings: 156,
    totalReviews: 156,
    experience: 9,
    availability: true,
    location: {
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500001'
    },
    skills: ['Commercial Plumbing', 'Pipe Fitting', 'Water Tank Installation'],
    completedJobs: 312
  },

  // Painters
  {
    name: 'Ramesh Verma',
    phone: '9876543216',
    serviceCategory: 'Painting',
    pricePerHour: 250,
    rating: 4.6,
    totalRatings: 112,
    totalReviews: 112,
    experience: 7,
    availability: true,
    location: {
      city: 'Jaipur',
      state: 'Rajasthan',
      pincode: '302001'
    },
    skills: ['Interior Painting', 'Exterior Painting', 'Texture Work', 'Wall Putty'],
    completedJobs: 223
  },
  {
    name: 'Santosh Kumar',
    phone: '9876543217',
    serviceCategory: 'Painting',
    pricePerHour: 280,
    rating: 4.9,
    totalRatings: 189,
    totalReviews: 189,
    experience: 11,
    availability: true,
    location: {
      city: 'Kolkata',
      state: 'West Bengal',
      pincode: '700001'
    },
    skills: ['Asian Paints Expert', 'Waterproofing', 'Decorative Painting'],
    completedJobs: 401
  },
  {
    name: 'Dinesh Gupta',
    phone: '9876543218',
    serviceCategory: 'Painting',
    pricePerHour: 260,
    rating: 4.4,
    totalRatings: 67,
    totalReviews: 67,
    experience: 4,
    availability: true,
    location: {
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '380001'
    },
    skills: ['Basic Painting', 'Touch-ups', 'Color Consultation'],
    completedJobs: 134
  },

  // Carpenters
  {
    name: 'Anil Thakur',
    phone: '9876543219',
    serviceCategory: 'Carpenter',
    pricePerHour: 330,
    rating: 4.7,
    totalRatings: 134,
    totalReviews: 134,
    experience: 9,
    availability: true,
    location: {
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001'
    },
    skills: ['Furniture Making', 'Door Repair', 'Wardrobe Installation', 'Modular Kitchen'],
    completedJobs: 267
  },
  {
    name: 'Manoj Carpenter',
    phone: '9876543220',
    serviceCategory: 'Carpenter',
    pricePerHour: 350,
    rating: 4.9,
    totalRatings: 198,
    totalReviews: 198,
    experience: 13,
    availability: true,
    location: {
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001'
    },
    skills: ['Custom Furniture', 'Wood Polishing', 'Interior Design', 'Modular Work'],
    completedJobs: 425
  },
  {
    name: 'Ravi Sharma',
    phone: '9876543221',
    serviceCategory: 'Carpenter',
    pricePerHour: 300,
    rating: 4.5,
    totalRatings: 92,
    totalReviews: 92,
    experience: 6,
    availability: true,
    location: {
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001'
    },
    skills: ['Basic Carpentry', 'Furniture Repair', 'Window Fitting'],
    completedJobs: 178
  }
];

const seedWorkers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('📡 Connected to MongoDB');

    // Clear existing workers
    await Worker.deleteMany({});
    console.log('🗑️  Cleared existing workers');

    // Insert new workers
    await Worker.insertMany(workers);
    console.log('✅ Successfully seeded workers data');
    console.log(`📊 Total workers added: ${workers.length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

seedWorkers();
