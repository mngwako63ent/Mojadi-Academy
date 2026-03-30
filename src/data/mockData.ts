export interface Course {
  id: string;
  title: string;
  instructor: string;
  rating: number;
  students: number;
  price: number;
  duration: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  image: string;
  description: string;
  modules: number;
  lessons: number;
}

export interface Instructor {
  id: string;
  name: string;
  expertise: string;
  image: string;
  bio: string;
  socials: {
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
}

export const courses: Course[] = [
  {
    id: '1',
    title: 'Introduction to Sustainable Farming',
    instructor: 'Dr. Thabo Maseko',
    rating: 4.8,
    students: 245,
    price: 0,
    duration: '4 Weeks',
    level: 'Beginner',
    category: 'Sustainability',
    image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800',
    description: 'Learn the fundamentals of sustainable agriculture practices, soil health, and eco-friendly farming techniques.',
    modules: 8,
    lessons: 24
  },
  {
    id: '2',
    title: 'Advanced Maize Production',
    instructor: 'Prof. Lerato Mokoena',
    rating: 4.9,
    students: 128,
    price: 1500,
    duration: '8 Weeks',
    level: 'Advanced',
    category: 'Crop Production',
    image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800',
    description: 'Master advanced techniques in maize cultivation, pest management, and maximizing yield for commercial farming.',
    modules: 12,
    lessons: 36
  },
  {
    id: '3',
    title: 'Organic Vegetable Farming',
    instructor: 'Sarah Nkosi',
    rating: 4.7,
    students: 189,
    price: 1200,
    duration: '6 Weeks',
    level: 'Intermediate',
    category: 'Organic Farming',
    image: 'https://images.unsplash.com/photo-1615671524827-c1fe3973b648?w=800',
    description: 'Comprehensive guide to growing organic vegetables, from soil preparation to harvest and marketing.',
    modules: 10,
    lessons: 32
  },
  {
    id: '4',
    title: 'Water Management in Agriculture',
    instructor: 'Mpho Dlamini',
    rating: 4.6,
    students: 312,
    price: 0,
    duration: '3 Weeks',
    level: 'Beginner',
    category: 'Farm Management',
    image: 'https://images.unsplash.com/photo-1743742566156-f1745850281a?q=80&w=1225&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    description: 'Learn efficient irrigation systems, water conservation techniques, and rainwater harvesting for farms.',
    modules: 6,
    lessons: 18
  },
  {
    id: '5',
    title: 'Soil Health & Fertility Management',
    instructor: 'Dr. Thabo Maseko',
    rating: 4.8,
    students: 156,
    price: 900,
    duration: '5 Weeks',
    level: 'Intermediate',
    category: 'Crop Production',
    image: 'https://images.unsplash.com/photo-1604135633168-4e1db18ca690?q=80&w=1172&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    description: 'Deep dive into soil science, nutrient management, composting, and maintaining optimal soil health.',
    modules: 9,
    lessons: 27
  },
  {
    id: '6',
    title: 'Pest & Disease Management',
    instructor: 'Sarah Nkosi',
    rating: 4.7,
    students: 267,
    price: 0,
    duration: '4 Weeks',
    level: 'Intermediate',
    category: 'Crop Protection',
    image: 'https://plus.unsplash.com/premium_photo-1661420239238-72a27c154683?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    description: 'Identify, prevent, and manage common crop pests and diseases using integrated pest management strategies.',
    modules: 8,
    lessons: 24
  },
  {
    id: '7',
    title: 'Commercial Wheat Production',
    instructor: 'Prof. Lerato Mokoena',
    rating: 4.9,
    students: 94,
    price: 2000,
    duration: '10 Weeks',
    level: 'Advanced',
    category: 'Crop Production',
    image: 'https://images.unsplash.com/photo-1567332020793-a6f45c7c5da7?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    description: 'Complete guide to commercial wheat farming, including variety selection, planting, and post-harvest handling.',
    modules: 14,
    lessons: 42
  },
  {
    id: '8',
    title: 'Farm Business Management',
    instructor: 'Mpho Dlamini',
    rating: 4.8,
    students: 203,
    price: 1100,
    duration: '6 Weeks',
    level: 'Beginner',
    category: 'Farm Management',
    image: 'https://images.unsplash.com/photo-1665346122645-f23b0685cd52?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    description: 'Learn essential business skills for running a profitable farm, including budgeting, marketing, and financial planning.',
    modules: 10,
    lessons: 30
  }
];

export const instructors: Instructor[] = [
  {
    id: '1',
    name: 'Dr. Thabo Maseko',
    expertise: 'Soil Scientist',
    image: 'https://picsum.photos/seed/thabo/400/400',
    bio: 'With over 15 years of experience in soil health, Dr. Maseko has helped thousands of farmers restore land fertility.',
    socials: { twitter: '#', linkedin: '#' }
  },
  {
    id: '2',
    name: 'Prof. Lerato Mokoena',
    expertise: 'Crop Specialist',
    image: 'https://picsum.photos/seed/lerato/400/400',
    bio: 'A leading researcher in maize and wheat genetics, focusing on drought-resistant crop varieties.',
    socials: { linkedin: '#', instagram: '#' }
  },
  {
    id: '3',
    name: 'Sarah Nkosi',
    expertise: 'Agri-Business Expert',
    image: 'https://picsum.photos/seed/sarah/400/400',
    bio: 'Sarah bridges the gap between traditional farming and modern commercial business management.',
    socials: { twitter: '#', instagram: '#' }
  },
  {
    id: '4',
    name: 'Mpho Dlamini',
    expertise: 'Irrigation Engineer',
    image: 'https://picsum.photos/seed/mpho/400/400',
    bio: 'Mpho specializes in precision irrigation systems that maximize water efficiency in challenging climates.',
    socials: { linkedin: '#' }
  }
];

export const testimonials = [
  {
    id: '1',
    name: 'Johannes Khumalo',
    role: 'Commercial Farmer',
    content: 'AgriAcademy transformed my approach to maize production. My yields have increased by 40% in just two seasons.',
    avatar: 'https://picsum.photos/seed/johannes/100/100'
  },
  {
    id: '2',
    name: 'Nomvula Sithole',
    role: 'Organic Producer',
    content: 'The organic vegetable course gave me the confidence to transition my entire farm to pesticide-free methods.',
    avatar: 'https://picsum.photos/seed/nomvula/100/100'
  },
  {
    id: '3',
    name: 'Pieter van der Merwe',
    role: 'Wheat Farmer',
    content: 'The business management modules are world-class. I finally feel in control of my farm\'s financial future.',
    avatar: 'https://picsum.photos/seed/pieter/100/100'
  }
];
