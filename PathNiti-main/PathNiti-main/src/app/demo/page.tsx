"use client";

import { Button, Card, CardContent } from "@/components/ui";
import {
  GraduationCap,
  ArrowLeft,
  CheckCircle,
  Star,
  Users,
  TrendingUp,
  Award,
} from "lucide-react";
import Link from "next/link";
import { PathNitiLogo } from "@/components/PathNitiLogo";
import { DynamicHeader } from "@/components/DynamicHeader";

export default function DemoPage() {
  const features = [
    {
      title: "Aptitude Assessment",
      description:
        "Take our comprehensive quiz to discover your strengths and interests",
      icon: "🧠",
      time: "2:30",
    },
    {
      title: "College Discovery",
      description:
        "Find government colleges near you with detailed information",
      icon: "🏛️",
      time: "1:45",
    },
    {
      title: "Timeline Tracker",
      description:
        "Never miss important deadlines with our smart notification system",
      icon: "📅",
      time: "1:20",
    },
    {
      title: "AI Recommendations",
      description: "Get personalized career guidance based on your profile",
      icon: "🤖",
      time: "2:10",
    },
  ];

  const testimonials = [
    {
      name: "Priya Sharma",
      role: "Class 12 Student",
      content:
        "PathNiti helped me discover my passion for computer science. The aptitude test was incredibly accurate!",
      rating: 5,
      image: "👩‍🎓",
    },
    {
      name: "Rahul Kumar",
      role: "Engineering Student",
      content:
        "The college directory saved me so much time. I found the perfect government college near my home.",
      rating: 5,
      image: "👨‍🎓",
    },
    {
      name: "Anita Singh",
      role: "Scholarship Recipient",
      content:
        "I wouldn't have known about the scholarship opportunities without PathNiti. It changed my life!",
      rating: 5,
      image: "👩‍💼",
    },
  ];

  const stats = [
    {
      number: "10,000+",
      label: "Students Helped",
      icon: Users,
    },
    {
      number: "95%",
      label: "Success Rate",
      icon: TrendingUp,
    },
    {
      number: "500+",
      label: "Colleges Listed",
      icon: Award,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <DynamicHeader />

      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            See PathNiti in{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-green-600">
              Action
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Watch our interactive demo to see how PathNiti can help you discover
            your perfect career path and find the right educational
            opportunities.
          </p>
        </div>

        {/* Demo Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            What You&apos;ll See in the Demo
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    {feature.description}
                  </p>
                  <div className="text-primary font-medium text-sm">
                    Duration: {feature.time}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-gradient-to-r from-primary to-green-600 rounded-lg p-8 text-white mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">
            Join Thousands of Successful Students
          </h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index}>
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-8 w-8" />
                  </div>
                  <div className="text-4xl font-bold mb-2">{stat.number}</div>
                  <div className="text-lg opacity-90">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Testimonials */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            What Students Say
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="text-center mb-4">
                    <div className="text-4xl mb-2">{testimonial.image}</div>
                    <div className="flex items-center justify-center mb-2">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star
                          key={i}
                          className="h-4 w-4 text-yellow-400 fill-current"
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4 italic text-center">
                    &ldquo;{testimonial.content}&rdquo;
                  </p>
                  <div className="text-center">
                    <div className="font-semibold text-gray-900">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {testimonial.role}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Interactive Demo CTA */}
        <div className="text-center mb-16">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Ready to Try It Yourself?
              </h2>
              <p className="text-gray-600 mb-6">
                Experience PathNiti firsthand with our interactive demo. No
                signup required - just explore and discover!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link href="/auth/signup">Start Free Trial</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/quiz">Take Aptitude Test</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Checklist */}
        <div className="bg-white rounded-lg p-8 mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Everything You Get with PathNiti
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Core Features
              </h3>
              <div className="space-y-3">
                {[
                  "AI-powered aptitude assessment",
                  "Comprehensive college directory",
                  "Smart timeline tracker",
                  "Personalized recommendations",
                  "Scholarship finder",
                  "Career pathway visualizer",
                ].map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Additional Benefits
              </h3>
              <div className="space-y-3">
                {[
                  "Mobile app for iOS & Android",
                  "Offline access capability",
                  "Real-time notifications",
                  "24/7 customer support",
                  "Regular data updates",
                  "Privacy & security protection",
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Start Your Journey Today
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of students who have already discovered their path
            with PathNiti
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/auth/signup">Get Started Free</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/contact">Contact Sales</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
