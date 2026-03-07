"use client";

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import {
  GraduationCap,
  Users,
  Target,
  Heart,
  Award,
  Globe,
  Lightbulb,
  Linkedin,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
  const team = [
    {
      name: "Deepak Pandey",
      role: "Team Leader",
      description:
        "Founder of Codeunia and AI/ML specialist with expertise in modern web technologies",
      image: "/api/placeholder/150/150",
      linkedin: "https://linkedin.com/in/848deepak",
    },
    {
      name: "Parisha",
      role: "Full-Stack Developer",
      description:
        "Co-founder of Codeunia and full-stack specialist focused on creating intuitive user experiences",
      image: "/api/placeholder/150/150",
      linkedin: "https://www.linkedin.com/in/parishasharma93/",
    },
    {
      name: "Lisa",
      role: "Backend Developer",
      description:
        "Backend systems architect with expertise in scalable solutions",
      image: "/api/placeholder/150/150",
    },
    {
      name: "Gauranvit",
      role: "Full-Stack Developer",
      description:
        "Versatile developer with skills in both frontend and backend technologies",
      image: "/api/placeholder/150/150",
    },
    {
      name: "Deepika",
      role: "UI/UX Designer",
      description:
        "Creative designer focused on user-centered design and accessibility",
      image: "/api/placeholder/150/150",
    },
    {
      name: "Ojaswini",
      role: "Data Analyst",
      description:
        "Data specialist with expertise in analytics and insights for student guidance",
      image: "/api/placeholder/150/150",
    },
  ];

  const values = [
    {
      icon: Target,
      title: "Student-Centric",
      description:
        "Every decision we make is focused on empowering students to make informed choices about their future.",
    },
    {
      icon: Heart,
      title: "Accessibility",
      description:
        "We believe quality education guidance should be accessible to every student, regardless of their background.",
    },
    {
      icon: Award,
      title: "Excellence",
      description:
        "We strive for excellence in everything we do, from our technology to our user experience.",
    },
    {
      icon: Globe,
      title: "Innovation",
      description:
        "We leverage cutting-edge technology to solve real-world problems in education and career guidance.",
    },
  ];

  const milestones = [
    {
      year: "2024",
      title: "PathNiti Founded",
      description:
        "Started with a vision to democratize career guidance for Indian students",
    },
    {
      year: "2024",
      title: "Platform Development",
      description:
        "Building our comprehensive platform with AI-powered career guidance features",
    },
    {
      year: "2024",
      title: "Team Assembly",
      description:
        "Brought together a talented team of developers, designers, and data analysts",
    },
    {
      year: "2025",
      title: "Launch Ready",
      description:
        "Preparing for launch to help students across India discover their career paths",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
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
              href="/about"
              className="text-primary font-semibold transition-all duration-200 hover:scale-105"
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
            <Button
              variant="outline"
              className="hover:scale-105 transition-all duration-200 border-2 hover:border-primary hover:bg-primary/5"
              asChild
            >
              <Link href="/dashboard">Demo Login</Link>
            </Button>
            <Button
              className="relative overflow-hidden bg-gradient-to-r from-primary via-blue-600 to-purple-600 hover:from-purple-600 hover:via-blue-600 hover:to-primary transition-all duration-500 hover:scale-105 shadow-xl hover:shadow-2xl group"
              asChild
            >
              <Link
                href="/dashboard"
                className="flex items-center gap-2 relative z-10"
              >
                <span className="font-semibold">Get Started</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            About{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-800 via-blue-600 to-purple-600">
              PathNiti
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We&apos;re on a mission to empower every Indian student with
            personalized career guidance, helping them make informed decisions
            about their education and future.
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Our Mission</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-lg">
                To democratize access to quality career guidance and education
                resources, ensuring every student in India has the tools and
                information they need to make informed decisions about their
                future.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Lightbulb className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Our Vision</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-lg">
                To become India&apos;s most trusted platform for career
                guidance, helping millions of students discover their potential
                and achieve their educational and professional goals.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Values */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Our Values
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <Card key={index}>
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {value.title}
                    </h3>
                    <p className="text-gray-600 text-sm">{value.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Story */}
        <div className="bg-white rounded-lg p-8 mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Our Story
          </h2>
          <div className="max-w-4xl mx-auto">
            <p className="text-lg text-gray-600 mb-6">
              PathNiti was born from a simple observation: millions of Indian
              students struggle to make informed decisions about their education
              and career paths. With limited access to quality guidance and
              overwhelming amounts of information, students often make choices
              that don&apos;t align with their true potential.
            </p>
            <p className="text-lg text-gray-600 mb-6">
              Our founders, having experienced these challenges firsthand, set
              out to create a comprehensive platform that would democratize
              access to career guidance. We believe that every student deserves
              personalized, data-driven insights to help them discover their
              strengths and make informed decisions.
            </p>
            <p className="text-lg text-gray-600">
              Today, PathNiti is being built with the vision to serve students
              across India, helping them navigate their educational journey with
              confidence and clarity. We&apos;re excited to launch and make a
              meaningful impact on the future of education in India.
            </p>
          </div>
        </div>

        {/* Team */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Meet Our Team
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <Card key={index}>
                <CardContent className="p-6 text-center">
                  <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Users className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {member.name}
                  </h3>
                  <p className="text-primary font-medium mb-2">{member.role}</p>
                  <p className="text-gray-600 text-sm mb-3">
                    {member.description}
                  </p>
                  {member.linkedin && (
                    <Link
                      href={member.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-primary hover:text-primary/80 transition-colors"
                    >
                      <Linkedin className="h-4 w-4 mr-1" />
                      LinkedIn
                    </Link>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Milestones */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Our Journey
          </h2>
          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold text-lg">
                      {milestone.year}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {milestone.title}
                    </h3>
                    <p className="text-gray-600">{milestone.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Impact */}
        <div className="bg-gradient-to-r from-primary to-green-600 rounded-lg p-8 text-white mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Our Impact</h2>
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">Coming Soon</div>
              <div className="text-lg opacity-90">Students to Help</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">1000+</div>
              <div className="text-lg opacity-90">Colleges in Database</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">AI-Powered</div>
              <div className="text-lg opacity-90">Recommendations</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">All India</div>
              <div className="text-lg opacity-90">Coverage Planned</div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Join Our Mission
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Be part of the movement to democratize career guidance in India
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/auth/signup">Get Started</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="md:col-span-1">
              <div className="flex items-center space-x-3 mb-6">
                <div className="relative">
                  <GraduationCap className="h-8 w-8 text-primary" />
                  <Sparkles className="h-3 w-3 text-yellow-500 absolute -top-1 -right-1" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-800 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                  PathNiti
                </span>
              </div>
              <p className="text-gray-400 leading-relaxed mb-6">
                Empowering students with personalized career guidance and
                education resources. Your future starts here.
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-primary transition-colors cursor-pointer">
                  <span className="text-sm font-bold">f</span>
                </div>
                <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-primary transition-colors cursor-pointer">
                  <span className="text-sm font-bold">t</span>
                </div>
                <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-primary transition-colors cursor-pointer">
                  <span className="text-sm font-bold">in</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Features</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link
                    href="/quiz"
                    className="hover:text-primary transition-colors"
                  >
                    Aptitude Assessment
                  </Link>
                </li>
                <li>
                  <Link
                    href="/colleges"
                    className="hover:text-primary transition-colors"
                  >
                    College Directory
                  </Link>
                </li>
                <li>
                  <Link
                    href="/timeline"
                    className="hover:text-primary transition-colors"
                  >
                    Timeline Tracker
                  </Link>
                </li>
                <li>
                  <Link
                    href="/scholarships"
                    className="hover:text-primary transition-colors"
                  >
                    Scholarships
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link
                    href="/about"
                    className="hover:text-primary transition-colors"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="hover:text-primary transition-colors"
                  >
                    Contact
                  </Link>
                </li>
                <li>
                  <Link
                    href="/demo"
                    className="hover:text-primary transition-colors"
                  >
                    Demo
                  </Link>
                </li>

              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link
                    href="/contact"
                    className="hover:text-primary transition-colors"
                  >
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="hover:text-primary transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="hover:text-primary transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="hover:text-primary transition-colors"
                  >
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 mb-4 md:mb-0">
                &copy; 2025 PathNiti. All rights reserved. Made with ❤️ for
                Indian students.
              </p>
              <div className="flex space-x-6 text-sm text-gray-400">
                <Link
                  href="/terms"
                  className="hover:text-primary transition-colors"
                >
                  Terms of Service
                </Link>
                <Link
                  href="/privacy"
                  className="hover:text-primary transition-colors"
                >
                  Privacy Policy
                </Link>
                <Link
                  href="/cookies"
                  className="hover:text-primary transition-colors"
                >
                  Cookie Policy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
