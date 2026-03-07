"use client";

import { useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from "@/components/ui";
import {
  GraduationCap,
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  MessageCircle,
  Users,
  HelpCircle,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log("Form submitted:", formData);
    // Reset form
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const contactInfo = [
    {
      icon: Mail,
      title: "Email Us",
      description: "Send us an email and we'll respond within 24 hours",
      contact: "team.pathniti@gmail.com",
      action: "mailto:team.pathniti@gmail.com",
    },
    {
      icon: Phone,
      title: "Call Us",
      description: "Speak with our support team during business hours",
      contact: "+91 8699025107",
      action: "tel:+918699025107",
    },
    {
      icon: MapPin,
      title: "Visit Us",
      description: "Our office is located in Mohali, Punjab",
      contact: "Mohali, Punjab",
      action: "#",
    },
    {
      icon: Clock,
      title: "Business Hours",
      description: "We're available Monday through Friday",
      contact: "9:00 AM - 6:00 PM IST",
      action: "#",
    },
  ];

  const faqs = [
    {
      question: "How does PathNiti help students choose their career path?",
      answer:
        "PathNiti uses AI-powered aptitude assessments and comprehensive data analysis to provide personalized career recommendations based on your interests, strengths, and academic performance.",
    },
    {
      question: "Is PathNiti free to use?",
      answer:
        "Yes, PathNiti offers a free tier with basic features. We also have premium plans with advanced features and personalized guidance.",
    },
    {
      question: "How accurate are the career recommendations?",
      answer:
        "Our AI algorithms have a 95% accuracy rate in career path predictions, based on extensive testing with thousands of students across India.",
    },
    {
      question: "Can I use PathNiti on my mobile phone?",
      answer:
        "Absolutely! PathNiti is available as a mobile app for both iOS and Android, and our web platform is fully responsive for mobile devices.",
    },
    {
      question: "Do you provide support for students with disabilities?",
      answer:
        "Yes, PathNiti is committed to accessibility. Our platform includes features for students with visual, hearing, and motor impairments.",
    },
    {
      question: "How often is the college and scholarship data updated?",
      answer:
        "We update our database daily to ensure you have access to the most current information about colleges, programs, and scholarship opportunities.",
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
              className="text-gray-600 hover:text-primary transition-all duration-200 hover:scale-105"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-primary font-semibold transition-all duration-200 hover:scale-105"
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
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Get in{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-green-600">
              Touch
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Have questions about PathNiti? We&apos;re here to help! Reach out to
            us and we&apos;ll get back to you as soon as possible.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center">
                <MessageCircle className="h-6 w-6 mr-2 text-primary" />
                Send us a Message
              </CardTitle>
              <CardDescription>
                Fill out the form below and we&apos;ll get back to you within 24
                hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Full Name
                    </label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Email Address
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Subject
                  </label>
                  <Input
                    id="subject"
                    name="subject"
                    type="text"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="What's this about?"
                  />
                </div>
                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell us how we can help you..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  />
                </div>
                <Button type="submit" className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center">
                  <Users className="h-6 w-6 mr-2 text-primary" />
                  Contact Information
                </CardTitle>
                <CardDescription>Multiple ways to reach us</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {contactInfo.map((info, index) => {
                  const Icon = info.icon;
                  return (
                    <div
                      key={index}
                      className="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {info.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-2">
                          {info.description}
                        </p>
                        <a
                          href={info.action}
                          className="text-primary font-medium hover:underline"
                        >
                          {info.contact}
                        </a>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Quick Links</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">

                  <Link
                    href="/about"
                    className="block text-primary hover:underline"
                  >
                    About Us
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="block text-primary hover:underline"
                  >
                    Get Started
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Frequently Asked Questions
          </h2>
          <div className="max-w-4xl mx-auto">
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <HelpCircle className="h-5 w-5 mr-2 text-primary" />
                      {faq.question}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Support Hours */}
        <div className="bg-gradient-to-r from-primary to-green-600 rounded-lg p-8 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Need Immediate Help?</h2>
          <p className="text-xl mb-6 opacity-90">
            Our support team is available Monday through Friday, 9:00 AM to 6:00
            PM IST
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <a href="mailto:support@pathniti.in">
                <Mail className="h-4 w-4 mr-2" />
                Email Support
              </a>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <a href="tel:+919876543210">
                <Phone className="h-4 w-4 mr-2" />
                Call Support
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="md:col-span-1">
              <Link
                href="/"
                className="flex items-center space-x-3 mb-6 hover:opacity-80 transition-opacity duration-200"
              >
                <div className="relative">
                  <GraduationCap className="h-8 w-8 text-primary" />
                  <Sparkles className="h-3 w-3 text-yellow-500 absolute -top-1 -right-1" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-800 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                  PathNiti
                </span>
              </Link>
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
