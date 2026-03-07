"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
} from "@/components/ui";
import {
  GraduationCap,
  Briefcase,
  TrendingUp,
  MapPin,
  Search,
  ArrowRight,
  BookOpen,
  DollarSign,
  Clock,
  Star,
  Target,
  Brain,
  Sparkles,
  Zap,
  Award,
  CheckCircle,
  Filter,
  X,
  User,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "../providers";
import StreamComparison from "@/components/StreamComparison";
import type { SarthiUserProfile } from "@/lib/sarthi-ai";

interface CareerPathway {
  id: string;
  title: string;
  description: string;
  stream: string;
  education_requirements: string[];
  skills_required: string[];
  job_opportunities: string[];
  salary_range: {
    min: number;
    max: number;
    currency: string;
  };
  growth_prospects: string;
  related_exams: string[];
  duration: string;
  difficulty: string;
}

// interface PathwayNode {
//   id: string
//   type: 'education' | 'exam' | 'job' | 'skill'
//   title: string
//   description: string
//   level: number
//   prerequisites: string[]
//   outcomes: string[]
// }

export default function CareerPathwaysPage() {
  const { user, profile, signOut } = useAuth();
  const [pathways, setPathways] = useState<CareerPathway[]>([]);
  const [selectedPathway, setSelectedPathway] = useState<CareerPathway | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStream, setSelectedStream] = useState("");
  const [loading, setLoading] = useState(true);
  const [showComparison, setShowComparison] = useState(false);
  const [userProfile] = useState<SarthiUserProfile | null>(null);

  const streams = [
    "science",
    "arts",
    "commerce",
    "engineering",
    "medical",
    "vocational",
  ];

  useEffect(() => {
    fetchCareerPathways();
  }, []);

  const fetchCareerPathways = async () => {
    try {
      // Comprehensive career pathways data
      const samplePathways: CareerPathway[] = [
        // Technology & Engineering
        {
          id: "1",
          title: "Software Engineer",
          description:
            "Design, develop, and maintain software applications and systems",
          stream: "engineering",
          education_requirements: [
            "B.Tech Computer Science",
            "M.Tech (Optional)",
            "Certifications",
          ],
          skills_required: [
            "Programming",
            "Problem Solving",
            "Mathematics",
            "Communication",
          ],
          job_opportunities: [
            "Software Developer",
            "System Analyst",
            "Tech Lead",
            "CTO",
          ],
          salary_range: { min: 500000, max: 2000000, currency: "INR" },
          growth_prospects: "High",
          related_exams: ["JEE Main", "JEE Advanced", "GATE"],
          duration: "4-6 years",
          difficulty: "Medium",
        },
        {
          id: "2",
          title: "Cybersecurity Analyst",
          description:
            "Protect organizations from cyber threats and ensure data security",
          stream: "engineering",
          education_requirements: [
            "B.Tech IT/Cybersecurity",
            "Certifications (CEH, CISSP)",
            "M.Tech (Optional)",
          ],
          skills_required: [
            "Network Security",
            "Risk Assessment",
            "Incident Response",
            "Ethical Hacking",
          ],
          job_opportunities: [
            "Security Analyst",
            "Penetration Tester",
            "Security Architect",
            "CISO",
          ],
          salary_range: { min: 600000, max: 1800000, currency: "INR" },
          growth_prospects: "Very High",
          related_exams: ["JEE Main", "GATE", "Certification Exams"],
          duration: "4-6 years",
          difficulty: "High",
        },
        {
          id: "3",
          title: "AI/ML Engineer",
          description:
            "Develop artificial intelligence and machine learning solutions",
          stream: "engineering",
          education_requirements: [
            "B.Tech Computer Science",
            "M.Tech AI/ML",
            "PhD (Research)",
          ],
          skills_required: [
            "Python",
            "Machine Learning",
            "Deep Learning",
            "Statistics",
          ],
          job_opportunities: [
            "ML Engineer",
            "AI Researcher",
            "Data Scientist",
            "AI Product Manager",
          ],
          salary_range: { min: 800000, max: 3000000, currency: "INR" },
          growth_prospects: "Very High",
          related_exams: ["JEE Main", "GATE", "GRE"],
          duration: "4-8 years",
          difficulty: "High",
        },
        {
          id: "4",
          title: "DevOps Engineer",
          description:
            "Bridge development and operations to improve software delivery",
          stream: "engineering",
          education_requirements: [
            "B.Tech Computer Science",
            "Cloud Certifications",
            "Experience",
          ],
          skills_required: [
            "Cloud Computing",
            "CI/CD",
            "Containerization",
            "Infrastructure as Code",
          ],
          job_opportunities: [
            "DevOps Engineer",
            "Site Reliability Engineer",
            "Cloud Architect",
            "Platform Engineer",
          ],
          salary_range: { min: 700000, max: 2200000, currency: "INR" },
          growth_prospects: "High",
          related_exams: ["JEE Main", "GATE", "Cloud Certifications"],
          duration: "4-6 years",
          difficulty: "High",
        },
        {
          id: "5",
          title: "Product Manager",
          description:
            "Lead product development and strategy in tech companies",
          stream: "engineering",
          education_requirements: [
            "B.Tech + MBA",
            "Business Experience",
            "Product Certifications",
          ],
          skills_required: [
            "Strategic Thinking",
            "User Research",
            "Data Analysis",
            "Leadership",
          ],
          job_opportunities: [
            "Product Manager",
            "Senior PM",
            "Product Director",
            "CPO",
          ],
          salary_range: { min: 1000000, max: 4000000, currency: "INR" },
          growth_prospects: "High",
          related_exams: ["JEE Main", "CAT", "GMAT"],
          duration: "5-7 years",
          difficulty: "High",
        },

        // Healthcare & Medical
        {
          id: "6",
          title: "Doctor",
          description:
            "Diagnose and treat medical conditions, provide healthcare services",
          stream: "medical",
          education_requirements: [
            "MBBS",
            "MD/MS (Specialization)",
            "Residency",
          ],
          skills_required: [
            "Biology",
            "Chemistry",
            "Empathy",
            "Communication",
            "Problem Solving",
          ],
          job_opportunities: [
            "General Practitioner",
            "Specialist",
            "Surgeon",
            "Medical Researcher",
          ],
          salary_range: { min: 800000, max: 3000000, currency: "INR" },
          growth_prospects: "High",
          related_exams: ["NEET", "AIIMS", "JIPMER"],
          duration: "7-10 years",
          difficulty: "High",
        },
        {
          id: "7",
          title: "Nurse",
          description:
            "Provide patient care and support in healthcare settings",
          stream: "medical",
          education_requirements: [
            "B.Sc Nursing",
            "M.Sc Nursing (Optional)",
            "Registration",
          ],
          skills_required: [
            "Patient Care",
            "Medical Knowledge",
            "Compassion",
            "Communication",
          ],
          job_opportunities: [
            "Staff Nurse",
            "Nurse Manager",
            "Nurse Educator",
            "Public Health Nurse",
          ],
          salary_range: { min: 300000, max: 800000, currency: "INR" },
          growth_prospects: "High",
          related_exams: ["NEET", "State Nursing Exams"],
          duration: "3-4 years",
          difficulty: "Medium",
        },
        {
          id: "8",
          title: "Pharmacist",
          description: "Dispense medications and provide pharmaceutical care",
          stream: "medical",
          education_requirements: [
            "B.Pharm",
            "M.Pharm (Optional)",
            "Registration",
          ],
          skills_required: [
            "Pharmaceutical Knowledge",
            "Attention to Detail",
            "Communication",
            "Ethics",
          ],
          job_opportunities: [
            "Community Pharmacist",
            "Hospital Pharmacist",
            "Clinical Pharmacist",
            "Pharmaceutical Researcher",
          ],
          salary_range: { min: 400000, max: 1000000, currency: "INR" },
          growth_prospects: "Medium",
          related_exams: ["NEET", "GPAT"],
          duration: "4-5 years",
          difficulty: "Medium",
        },
        {
          id: "9",
          title: "Physiotherapist",
          description:
            "Help patients recover from injuries and improve mobility",
          stream: "medical",
          education_requirements: [
            "BPT",
            "MPT (Specialization)",
            "Registration",
          ],
          skills_required: [
            "Anatomy Knowledge",
            "Manual Therapy",
            "Communication",
            "Patience",
          ],
          job_opportunities: [
            "Clinical Physiotherapist",
            "Sports Physiotherapist",
            "Pediatric Physiotherapist",
            "Rehabilitation Specialist",
          ],
          salary_range: { min: 350000, max: 900000, currency: "INR" },
          growth_prospects: "High",
          related_exams: ["NEET", "State Entrance Exams"],
          duration: "4-5 years",
          difficulty: "Medium",
        },

        // Business & Finance
        {
          id: "10",
          title: "Chartered Accountant",
          description:
            "Provide financial advice, audit accounts, and ensure compliance",
          stream: "commerce",
          education_requirements: [
            "B.Com",
            "CA Foundation",
            "CA Intermediate",
            "CA Final",
          ],
          skills_required: [
            "Mathematics",
            "Analytical Skills",
            "Attention to Detail",
            "Ethics",
          ],
          job_opportunities: [
            "CA in Practice",
            "Financial Analyst",
            "Auditor",
            "Tax Consultant",
          ],
          salary_range: { min: 600000, max: 1500000, currency: "INR" },
          growth_prospects: "High",
          related_exams: ["CA Foundation", "CA Intermediate", "CA Final"],
          duration: "4-5 years",
          difficulty: "High",
        },
        {
          id: "11",
          title: "Investment Banker",
          description:
            "Help companies raise capital and provide financial advisory services",
          stream: "commerce",
          education_requirements: [
            "MBA Finance",
            "CFA (Optional)",
            "Strong Academic Record",
          ],
          skills_required: [
            "Financial Modeling",
            "Analytical Skills",
            "Communication",
            "Networking",
          ],
          job_opportunities: [
            "Analyst",
            "Associate",
            "VP",
            "Managing Director",
          ],
          salary_range: { min: 1200000, max: 5000000, currency: "INR" },
          growth_prospects: "High",
          related_exams: ["CAT", "GMAT", "CFA"],
          duration: "5-7 years",
          difficulty: "Very High",
        },
        {
          id: "12",
          title: "Management Consultant",
          description:
            "Help organizations improve performance and solve business problems",
          stream: "commerce",
          education_requirements: [
            "MBA from Top Tier",
            "Strong Problem Solving",
            "Industry Experience",
          ],
          skills_required: [
            "Strategic Thinking",
            "Problem Solving",
            "Communication",
            "Data Analysis",
          ],
          job_opportunities: [
            "Business Analyst",
            "Consultant",
            "Senior Consultant",
            "Partner",
          ],
          salary_range: { min: 1000000, max: 4000000, currency: "INR" },
          growth_prospects: "High",
          related_exams: ["CAT", "GMAT"],
          duration: "5-8 years",
          difficulty: "Very High",
        },
        {
          id: "13",
          title: "Digital Marketer",
          description: "Promote products and services through digital channels",
          stream: "commerce",
          education_requirements: [
            "BBA/MBA Marketing",
            "Digital Marketing Certifications",
            "Experience",
          ],
          skills_required: [
            "SEO/SEM",
            "Social Media",
            "Analytics",
            "Content Creation",
          ],
          job_opportunities: [
            "Digital Marketing Specialist",
            "Marketing Manager",
            "Growth Hacker",
            "CMO",
          ],
          salary_range: { min: 400000, max: 1200000, currency: "INR" },
          growth_prospects: "High",
          related_exams: ["CAT", "Digital Marketing Certifications"],
          duration: "3-5 years",
          difficulty: "Medium",
        },

        // Science & Research
        {
          id: "14",
          title: "Data Scientist",
          description:
            "Analyze complex data to help organizations make informed decisions",
          stream: "science",
          education_requirements: [
            "B.Sc/M.Sc Statistics/Mathematics",
            "M.Tech Data Science",
            "Certifications",
          ],
          skills_required: [
            "Statistics",
            "Programming",
            "Machine Learning",
            "Business Acumen",
          ],
          job_opportunities: [
            "Data Analyst",
            "Data Scientist",
            "ML Engineer",
            "Data Architect",
          ],
          salary_range: { min: 700000, max: 2500000, currency: "INR" },
          growth_prospects: "Very High",
          related_exams: ["JEE Main", "GATE", "GRE"],
          duration: "4-6 years",
          difficulty: "High",
        },
        {
          id: "15",
          title: "Research Scientist",
          description:
            "Conduct scientific research and develop new technologies",
          stream: "science",
          education_requirements: [
            "PhD in Relevant Field",
            "Research Experience",
            "Publications",
          ],
          skills_required: [
            "Research Methodology",
            "Critical Thinking",
            "Data Analysis",
            "Communication",
          ],
          job_opportunities: [
            "Research Scientist",
            "Senior Scientist",
            "Research Director",
            "Professor",
          ],
          salary_range: { min: 800000, max: 2000000, currency: "INR" },
          growth_prospects: "Medium",
          related_exams: ["GATE", "CSIR NET", "GRE"],
          duration: "6-10 years",
          difficulty: "Very High",
        },
        {
          id: "16",
          title: "Environmental Scientist",
          description: "Study environmental problems and develop solutions",
          stream: "science",
          education_requirements: [
            "B.Sc Environmental Science",
            "M.Sc/M.Tech",
            "PhD (Optional)",
          ],
          skills_required: [
            "Environmental Knowledge",
            "Data Analysis",
            "Problem Solving",
            "Communication",
          ],
          job_opportunities: [
            "Environmental Consultant",
            "Research Scientist",
            "Policy Analyst",
            "Environmental Manager",
          ],
          salary_range: { min: 400000, max: 1200000, currency: "INR" },
          growth_prospects: "High",
          related_exams: ["GATE", "CSIR NET"],
          duration: "4-6 years",
          difficulty: "Medium",
        },

        // Arts & Humanities
        {
          id: "17",
          title: "Teacher",
          description:
            "Educate students and help them develop knowledge and skills",
          stream: "arts",
          education_requirements: [
            "B.Ed",
            "M.A. in Subject",
            "Teaching Certification",
          ],
          skills_required: [
            "Communication",
            "Patience",
            "Subject Knowledge",
            "Leadership",
          ],
          job_opportunities: [
            "School Teacher",
            "College Professor",
            "Educational Consultant",
            "Curriculum Developer",
          ],
          salary_range: { min: 300000, max: 800000, currency: "INR" },
          growth_prospects: "Medium",
          related_exams: ["CTET", "TET", "NET"],
          duration: "3-5 years",
          difficulty: "Medium",
        },
        {
          id: "18",
          title: "Journalist",
          description:
            "Research, write, and report news stories for various media outlets",
          stream: "arts",
          education_requirements: [
            "B.A. Journalism",
            "M.A. Mass Communication",
            "Internships",
          ],
          skills_required: [
            "Writing",
            "Communication",
            "Research",
            "Critical Thinking",
          ],
          job_opportunities: [
            "Reporter",
            "Editor",
            "News Anchor",
            "Content Writer",
          ],
          salary_range: { min: 250000, max: 800000, currency: "INR" },
          growth_prospects: "Medium",
          related_exams: ["CUET", "University Entrance Exams"],
          duration: "3-4 years",
          difficulty: "Medium",
        },
        {
          id: "19",
          title: "Graphic Designer",
          description:
            "Create visual concepts to communicate ideas and messages",
          stream: "arts",
          education_requirements: [
            "B.F.A/B.Des",
            "Portfolio",
            "Software Skills",
          ],
          skills_required: [
            "Creativity",
            "Design Software",
            "Typography",
            "Color Theory",
          ],
          job_opportunities: [
            "Graphic Designer",
            "UI/UX Designer",
            "Art Director",
            "Creative Director",
          ],
          salary_range: { min: 300000, max: 1000000, currency: "INR" },
          growth_prospects: "High",
          related_exams: ["NID", "NIFT", "CEED"],
          duration: "3-4 years",
          difficulty: "Medium",
        },
        {
          id: "20",
          title: "Content Writer",
          description:
            "Create engaging content for websites, blogs, and marketing materials",
          stream: "arts",
          education_requirements: [
            "B.A. English/Journalism",
            "Writing Portfolio",
            "SEO Knowledge",
          ],
          skills_required: ["Writing", "Research", "SEO", "Creativity"],
          job_opportunities: [
            "Content Writer",
            "Copywriter",
            "Content Manager",
            "Editor",
          ],
          salary_range: { min: 250000, max: 800000, currency: "INR" },
          growth_prospects: "High",
          related_exams: ["University Entrance Exams"],
          duration: "3-4 years",
          difficulty: "Low",
        },

        // Emerging Fields
        {
          id: "21",
          title: "Blockchain Developer",
          description:
            "Develop decentralized applications and blockchain solutions",
          stream: "engineering",
          education_requirements: [
            "B.Tech Computer Science",
            "Blockchain Certifications",
            "Experience",
          ],
          skills_required: [
            "Solidity",
            "Smart Contracts",
            "Cryptography",
            "Web3",
          ],
          job_opportunities: [
            "Blockchain Developer",
            "Smart Contract Developer",
            "DeFi Developer",
            "Blockchain Architect",
          ],
          salary_range: { min: 800000, max: 2500000, currency: "INR" },
          growth_prospects: "Very High",
          related_exams: ["JEE Main", "GATE"],
          duration: "4-6 years",
          difficulty: "High",
        },
        {
          id: "22",
          title: "UX/UI Designer",
          description:
            "Design user experiences and interfaces for digital products",
          stream: "arts",
          education_requirements: [
            "B.Des/B.F.A",
            "Design Portfolio",
            "User Research Skills",
          ],
          skills_required: [
            "User Research",
            "Prototyping",
            "Design Tools",
            "Psychology",
          ],
          job_opportunities: [
            "UX Designer",
            "UI Designer",
            "Product Designer",
            "Design Lead",
          ],
          salary_range: { min: 500000, max: 1500000, currency: "INR" },
          growth_prospects: "Very High",
          related_exams: ["NID", "NIFT", "CEED"],
          duration: "3-4 years",
          difficulty: "Medium",
        },
        {
          id: "23",
          title: "Sustainability Consultant",
          description:
            "Help organizations implement sustainable business practices",
          stream: "science",
          education_requirements: [
            "B.Sc Environmental Science",
            "MBA Sustainability",
            "Certifications",
          ],
          skills_required: [
            "Environmental Knowledge",
            "Business Acumen",
            "Analytics",
            "Communication",
          ],
          job_opportunities: [
            "Sustainability Consultant",
            "ESG Analyst",
            "Sustainability Manager",
            "Chief Sustainability Officer",
          ],
          salary_range: { min: 600000, max: 1500000, currency: "INR" },
          growth_prospects: "Very High",
          related_exams: ["GATE", "CAT"],
          duration: "4-6 years",
          difficulty: "Medium",
        },
        {
          id: "24",
          title: "Digital Health Specialist",
          description:
            "Develop and implement digital health solutions and telemedicine",
          stream: "medical",
          education_requirements: [
            "Medical Degree + Tech Skills",
            "Health Informatics",
            "Certifications",
          ],
          skills_required: [
            "Medical Knowledge",
            "Technology",
            "Data Analysis",
            "Patient Care",
          ],
          job_opportunities: [
            "Digital Health Consultant",
            "Telemedicine Specialist",
            "Health Tech Product Manager",
            "Chief Medical Officer",
          ],
          salary_range: { min: 800000, max: 2000000, currency: "INR" },
          growth_prospects: "Very High",
          related_exams: ["NEET", "Health Informatics Certifications"],
          duration: "6-8 years",
          difficulty: "High",
        },

        // Traditional & Skilled Trades
        {
          id: "25",
          title: "Civil Engineer",
          description:
            "Design and oversee construction of infrastructure projects",
          stream: "engineering",
          education_requirements: [
            "B.Tech Civil Engineering",
            "M.Tech (Optional)",
            "Professional License",
          ],
          skills_required: [
            "Structural Design",
            "Project Management",
            "CAD Software",
            "Problem Solving",
          ],
          job_opportunities: [
            "Site Engineer",
            "Project Manager",
            "Structural Engineer",
            "Construction Manager",
          ],
          salary_range: { min: 400000, max: 1200000, currency: "INR" },
          growth_prospects: "Medium",
          related_exams: ["JEE Main", "GATE"],
          duration: "4-5 years",
          difficulty: "Medium",
        },
        {
          id: "26",
          title: "Mechanical Engineer",
          description:
            "Design, develop, and maintain mechanical systems and machinery",
          stream: "engineering",
          education_requirements: [
            "B.Tech Mechanical Engineering",
            "M.Tech (Optional)",
            "Industry Experience",
          ],
          skills_required: [
            "CAD/CAM",
            "Manufacturing",
            "Thermodynamics",
            "Problem Solving",
          ],
          job_opportunities: [
            "Design Engineer",
            "Manufacturing Engineer",
            "Project Engineer",
            "Engineering Manager",
          ],
          salary_range: { min: 400000, max: 1000000, currency: "INR" },
          growth_prospects: "Medium",
          related_exams: ["JEE Main", "GATE"],
          duration: "4-5 years",
          difficulty: "Medium",
        },
        {
          id: "27",
          title: "Electrician",
          description:
            "Install, maintain, and repair electrical systems and equipment",
          stream: "vocational",
          education_requirements: [
            "ITI Electrical",
            "Diploma in Electrical",
            "Licensing",
          ],
          skills_required: [
            "Electrical Knowledge",
            "Safety Procedures",
            "Problem Solving",
            "Manual Dexterity",
          ],
          job_opportunities: [
            "Electrician",
            "Electrical Technician",
            "Maintenance Electrician",
            "Electrical Contractor",
          ],
          salary_range: { min: 200000, max: 600000, currency: "INR" },
          growth_prospects: "Medium",
          related_exams: ["ITI Entrance", "State Trade Exams"],
          duration: "2-3 years",
          difficulty: "Low",
        },
        {
          id: "28",
          title: "Chef",
          description:
            "Prepare and cook food in restaurants, hotels, and other establishments",
          stream: "vocational",
          education_requirements: [
            "Culinary Arts Diploma",
            "Hotel Management",
            "Apprenticeship",
          ],
          skills_required: [
            "Cooking Techniques",
            "Food Safety",
            "Creativity",
            "Time Management",
          ],
          job_opportunities: [
            "Line Cook",
            "Sous Chef",
            "Head Chef",
            "Executive Chef",
          ],
          salary_range: { min: 250000, max: 800000, currency: "INR" },
          growth_prospects: "Medium",
          related_exams: ["Hotel Management Entrance"],
          duration: "2-4 years",
          difficulty: "Medium",
        },
      ];

      setPathways(samplePathways);
    } catch (error) {
      console.error("Error fetching career pathways:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPathways = pathways.filter((pathway) => {
    const matchesSearch =
      pathway.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pathway.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStream = !selectedStream || pathway.stream === selectedStream;
    return matchesSearch && matchesStream;
  });

  const getStreamColor = (stream: string) => {
    const colors = {
      science: "bg-blue-100 text-blue-800",
      arts: "bg-purple-100 text-purple-800",
      commerce: "bg-green-100 text-green-800",
      engineering: "bg-orange-100 text-orange-800",
      medical: "bg-red-100 text-red-800",
      vocational: "bg-gray-100 text-gray-800",
    };
    return colors[stream as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      Low: "bg-green-100 text-green-800",
      Medium: "bg-yellow-100 text-yellow-800",
      High: "bg-red-100 text-red-800",
    };
    return (
      colors[difficulty as keyof typeof colors] || "bg-gray-100 text-gray-800"
    );
  };

  const getGrowthColor = (growth: string) => {
    const colors = {
      "Very High": "bg-green-100 text-green-800",
      High: "bg-blue-100 text-blue-800",
      Medium: "bg-yellow-100 text-yellow-800",
      Low: "bg-red-100 text-red-800",
    };
    return colors[growth as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <GraduationCap className="h-12 w-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading career pathways...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="border-b bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity duration-200"
          >
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-blue-600 rounded-xl blur-sm opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative bg-white p-2 rounded-xl shadow-lg">
                <GraduationCap className="h-8 w-8 text-primary" />
                <Sparkles className="h-3 w-3 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
              </div>
            </div>
            <span className="text-3xl font-black bg-gradient-to-r from-blue-800 via-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
              PathNiti
            </span>
          </Link>
          <div className="hidden md:flex items-center space-x-8">

            <Link
              href="/comprehensive-assessment"
              className="text-gray-600 hover:text-primary transition-all duration-200 hover:scale-105 font-medium"
            >
              AI Assessment
            </Link>
            <Link
              href="/career-pathways"
              className="text-primary font-semibold transition-all duration-200 hover:scale-105"
            >
              Career Paths
            </Link>
            <Link
              href="/about"
              className="text-gray-600 hover:text-primary transition-all duration-200 hover:scale-105"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-gray-600 hover:text-primary transition-all duration-200 hover:scale-105"
            >
              Contact
            </Link>
          </div>
          <div className="flex items-center space-x-3">
            {user ? (
              <>
                <div className="flex items-center space-x-3 bg-gray-50 rounded-full px-4 py-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {user.email?.split("@")[0]}
                  </span>
                </div>
                <Button
                  variant="outline"
                  className="hover:scale-105 transition-all duration-200 border-2 hover:border-primary hover:bg-primary/5"
                  asChild
                >
                  <Link href={`/dashboard/${profile?.role || "student"}`}>
                    Dashboard
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  onClick={signOut}
                  className="hover:scale-105 transition-all duration-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="hover:scale-105 transition-all duration-200 border-2 hover:border-primary hover:bg-primary/5"
                  asChild
                >
                  <Link href="/auth/login">Login</Link>
                </Button>
                <Button
                  className="relative overflow-hidden bg-gradient-to-r from-primary via-blue-600 to-purple-600 hover:from-purple-600 hover:via-blue-600 hover:to-primary transition-all duration-500 hover:scale-105 shadow-xl hover:shadow-2xl group"
                  asChild
                >
                  <Link
                    href="/auth/signup"
                    className="flex items-center gap-2 relative z-10"
                  >
                    <span className="font-semibold">Get Started</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-blue-600 to-purple-700 text-white">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-2xl"></div>
        </div>

        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-8">
              <Sparkles className="h-4 w-4 text-yellow-300 fill-current" />
              <span className="text-sm font-medium">Discover Your Future</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Career{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">
                Pathways
              </span>
            </h1>

            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90 leading-relaxed">
              Explore detailed career paths, education requirements, and growth
              opportunities to make informed decisions about your future with
              AI-powered insights.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                className="relative overflow-hidden text-lg px-8 py-4 bg-white text-blue-800 hover:bg-gray-50 transition-all duration-500 hover:scale-105 shadow-2xl hover:shadow-3xl group border-2 border-white/20"
                asChild
              >
                <Link
                  href="/quiz"
                  className="flex items-center gap-3 relative z-10"
                >
                  <Brain className="h-6 w-6 text-blue-600 group-hover:rotate-12 transition-transform duration-300" />
                  <span className="font-bold text-lg">Take AI Assessment</span>
                </Link>
              </Button>
              <Button
                size="lg"
                className="relative overflow-hidden text-lg px-8 py-4 bg-white/20 text-white hover:bg-white/30 transition-all duration-500 hover:scale-105 shadow-2xl hover:shadow-3xl group border-2 border-white/40"
                asChild
              >
                <Link href="/colleges" className="flex items-center gap-3">
                  <MapPin className="h-6 w-6 group-hover:rotate-12 transition-transform duration-300" />
                  <span className="font-bold text-lg">Find Colleges</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 -mt-8 relative z-10">
        {/* Search and Filters */}
        <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-white/20 mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-blue-600/20 rounded-xl flex items-center justify-center">
              <Filter className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Find Your Perfect Career
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search career pathways..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 text-lg border-2 border-gray-200 focus:border-primary rounded-xl"
                />
              </div>
            </div>

            <div>
              <select
                value={selectedStream}
                onChange={(e) => setSelectedStream(e.target.value)}
                className="w-full h-12 px-4 border-2 border-gray-200 focus:border-primary rounded-xl text-lg bg-white"
              >
                <option value="">All Streams</option>
                {streams.map((stream) => (
                  <option key={stream} value={stream}>
                    {stream.charAt(0).toUpperCase() + stream.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Button
                onClick={() => setShowComparison(!showComparison)}
                variant={showComparison ? "default" : "outline"}
                className="w-full h-12 text-lg border-2 hover:border-primary hover:bg-primary/5 transition-all duration-300 hover:scale-105"
              >
                <Zap className="h-5 w-5 mr-2" />
                {showComparison ? "Hide AI" : "AI Compare"}
              </Button>
            </div>
          </div>

          {/* Get personalized recommendations prompt for logged-in users */}
          {user && !userProfile && (
            <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                    <Brain className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-blue-900">
                      Get Personalized Recommendations
                    </h3>
                    <p className="text-blue-700">
                      Take our AI-powered quiz to get personalized career
                      guidance with ROI analysis
                    </p>
                  </div>
                </div>
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <Link href="/quiz" className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Take Quiz
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Sarthi AI Stream Comparison */}
        {showComparison && userProfile && (
          <div className="mb-8">
            <StreamComparison
              userProfile={userProfile}
              streamsToCompare={
                selectedStream
                  ? [selectedStream]
                  : ["science", "commerce", "arts"]
              }
            />
          </div>
        )}

        {showComparison && !userProfile && (
          <Card className="mb-8 border-orange-200 bg-orange-50">
            <CardContent className="p-6 text-center">
              <Target className="h-12 w-12 text-orange-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-orange-900 mb-2">
                Complete Your Profile for AI Comparison
              </h3>
              <p className="text-orange-700 mb-4">
                Take our aptitude quiz to unlock personalized stream comparison
                with ROI analysis, parental guidance, and J&K-specific
                recommendations.
              </p>
              <Button asChild>
                <Link href="/quiz">Take Aptitude Quiz</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Career Pathways Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPathways.map((pathway, index) => (
            <Card
              key={pathway.id}
              className="group hover:shadow-2xl transition-all duration-500 cursor-pointer border-0 bg-white/80 backdrop-blur-sm hover:bg-white hover:scale-105 hover:-translate-y-2"
              onClick={() => setSelectedPathway(pathway)}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-blue-600/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Briefcase className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors">
                        {pathway.title}
                      </CardTitle>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${getStreamColor(pathway.stream)}`}
                  >
                    {pathway.stream}
                  </span>
                </div>
                <CardDescription className="text-gray-600 leading-relaxed">
                  {pathway.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Key Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-gray-500">Duration</p>
                      <p className="font-semibold text-gray-900">
                        {pathway.duration}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-xs text-gray-500">Salary</p>
                      <p className="font-semibold text-gray-900">
                        ₹{pathway.salary_range.min / 100000}L-
                        {pathway.salary_range.max / 100000}L
                      </p>
                    </div>
                  </div>
                </div>

                {/* Difficulty and Growth */}
                <div className="flex justify-between items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-orange-500" />
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${getDifficultyColor(pathway.difficulty)}`}
                    >
                      {pathway.difficulty}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${getGrowthColor(pathway.growth_prospects)}`}
                    >
                      {pathway.growth_prospects}
                    </span>
                  </div>
                </div>

                {/* Skills Preview */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    Key Skills:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {pathway.skills_required
                      .slice(0, 3)
                      .map((skill, skillIndex) => (
                        <span
                          key={skillIndex}
                          className="px-3 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 text-sm rounded-full font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    {pathway.skills_required.length > 3 && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full font-medium">
                        +{pathway.skills_required.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                <Button
                  className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary transition-all duration-300 group-hover:scale-105"
                  variant="default"
                >
                  <span>Explore Career</span>
                  <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredPathways.length === 0 && (
          <div className="text-center py-12">
            <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No career pathways found
            </h3>
            <p className="text-gray-600">Try adjusting your search criteria</p>
          </div>
        )}
      </div>

      {/* Pathway Detail Modal */}
      {selectedPathway && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20">
            <div className="p-8">
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-blue-600/20 rounded-2xl flex items-center justify-center">
                    <Briefcase className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                      {selectedPathway.title}
                    </h2>
                    <p className="text-lg text-gray-600">
                      {selectedPathway.description}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPathway(null)}
                  className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Education Path */}
                <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-3 text-xl">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                      </div>
                      <span>Education Path</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedPathway.education_requirements.map(
                        (req, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-4 p-3 bg-gray-50 rounded-xl"
                          >
                            <div className="w-8 h-8 bg-gradient-to-br from-primary to-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </div>
                            <span className="font-medium text-gray-900">
                              {req}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Skills Required */}
                <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-3 text-xl">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center">
                        <Star className="h-5 w-5 text-purple-600" />
                      </div>
                      <span>Skills Required</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3">
                      {selectedPathway.skills_required.map((skill, index) => (
                        <span
                          key={index}
                          className="px-4 py-2 bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 text-sm rounded-full font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Job Opportunities */}
                <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-3 text-xl">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center">
                        <Briefcase className="h-5 w-5 text-green-600" />
                      </div>
                      <span>Job Opportunities</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedPathway.job_opportunities.map((job, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl"
                        >
                          <ArrowRight className="h-5 w-5 text-green-500" />
                          <span className="font-medium text-gray-900">
                            {job}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Key Information */}
                <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-3 text-xl">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-orange-600" />
                      </div>
                      <span>Key Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                      <span className="text-gray-600 font-medium">
                        Duration:
                      </span>
                      <span className="font-bold text-gray-900">
                        {selectedPathway.duration}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                      <span className="text-gray-600 font-medium">
                        Difficulty:
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-bold ${getDifficultyColor(selectedPathway.difficulty)}`}
                      >
                        {selectedPathway.difficulty}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                      <span className="text-gray-600 font-medium">
                        Growth Prospects:
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-bold ${getGrowthColor(selectedPathway.growth_prospects)}`}
                      >
                        {selectedPathway.growth_prospects}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                      <span className="text-gray-600 font-medium">
                        Salary Range:
                      </span>
                      <span className="font-bold text-green-600">
                        ₹{selectedPathway.salary_range.min / 100000}L - ₹
                        {selectedPathway.salary_range.max / 100000}L
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Related Exams */}
              {selectedPathway.related_exams.length > 0 && (
                <Card className="mt-8 border-0 bg-white/80 backdrop-blur-sm shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-3 text-xl">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <span>Related Entrance Exams</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3">
                      {selectedPathway.related_exams.map((exam, index) => (
                        <span
                          key={index}
                          className="px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 text-sm rounded-full font-medium"
                        >
                          {exam}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <Button
                  asChild
                  size="lg"
                  className="h-14 text-lg font-bold bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary transition-all duration-300 hover:scale-105"
                >
                  <Link href="/quiz" className="flex items-center gap-3">
                    <Brain className="h-6 w-6" />
                    Take Aptitude Test
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  asChild
                  size="lg"
                  className="h-14 text-lg font-bold border-2 hover:border-primary hover:bg-primary/5 transition-all duration-300 hover:scale-105"
                >
                  <Link href="/colleges" className="flex items-center gap-3">
                    <MapPin className="h-6 w-6" />
                    Find Colleges
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  asChild
                  size="lg"
                  className="h-14 text-lg font-bold border-2 hover:border-primary hover:bg-primary/5 transition-all duration-300 hover:scale-105"
                >
                  <Link
                    href="/scholarships"
                    className="flex items-center gap-3"
                  >
                    <Award className="h-6 w-6" />
                    View Scholarships
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
