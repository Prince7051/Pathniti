"use client";

import { Button } from "@/components/ui";
import {
  GraduationCap,
  MapPin,
  Brain,
  Calendar,
  Users,
  BookOpen,
  ArrowRight,
  Star,
  CheckCircle,
  Sparkles,
  Navigation,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "./providers";
import { useState, useEffect } from "react";
import { DynamicHeader } from "@/components/DynamicHeader";
import { InstallAppButton } from "@/components/InstallAppButton";
import { useTranslation } from "@/hooks/useTranslation";
import { TextToSpeech } from "@/components/TextToSpeech";
import { GlobalTTS } from "@/components/GlobalTTS";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const { user, profile } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Navigation */}
      <DynamicHeader />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 text-center relative overflow-hidden bg-white animate-fade-in">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-2000"></div>
        </div>

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 mb-8 shadow-lg">
            <Star className="h-4 w-4 text-yellow-500 fill-current" />
            <span className="text-sm font-medium text-gray-700">
              {t('home.trusted_by')}
            </span>
          </div>

          {user ? (
            <>
              <div className="flex items-center justify-center gap-4 mb-8">
                <h1 className="text-6xl md:text-7xl font-bold text-gray-900 leading-tight">
                  {t('home.welcome_back')}{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-600 to-purple-600">
                    {t('home.ready_to_explore')}
                  </span>
                </h1>
                <TextToSpeech 
                  text={`${t('home.welcome_back')} ${t('home.ready_to_explore')}`}
                  variant="inline"
                  size="lg"
                />
              </div>

              <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
                {t('home.continue_journey')}
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center gap-4 mb-8">
                <h1 className="text-6xl md:text-7xl font-bold text-gray-900 leading-tight">
                  {t('home.title')}
                </h1>
                <TextToSpeech 
                  text={t('home.title')}
                  variant="inline"
                  size="lg"
                />
              </div>

              <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
                {t('home.subtitle')}
              </p>
            </>
          )}

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            {user ? (
              <>
                <Button
                  size="xl"
                  className="relative overflow-hidden text-lg px-12 py-8 bg-gradient-to-r from-primary via-blue-600 to-purple-600 hover:from-purple-600 hover:via-blue-600 hover:to-primary transition-all duration-500 hover:scale-110 shadow-2xl hover:shadow-3xl animate-slide-in-left group"
                  asChild
                >
                  <Link
                    href={`/dashboard/${profile?.role || "student"}`}
                    className="flex items-center gap-3 relative z-10"
                  >
                    <span className="font-bold text-lg">{t('home.go_to_dashboard')}</span>
                    <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform duration-300" />
                  </Link>
                </Button>
                <Button
                  size="xl"
                  variant="outline"
                  className="text-lg px-12 py-8 border-2 hover:border-primary hover:bg-primary/5 transition-all duration-300 hover:scale-105 animate-slide-in-right"
                  asChild
                >
                  <Link href="/quiz" className="flex items-center gap-3">
                    <span className="font-bold">{t('home.take_assessment')}</span>
                    <ArrowRight className="h-6 w-6" />
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="xl"
                  className="relative overflow-hidden text-lg px-12 py-8 bg-gradient-to-r from-primary via-blue-600 to-purple-600 hover:from-purple-600 hover:via-blue-600 hover:to-primary transition-all duration-500 hover:scale-110 shadow-2xl hover:shadow-3xl animate-slide-in-left group"
                  asChild
                >
                  <Link
                    href="/auth/signup"
                    className="flex items-center gap-3 relative z-10"
                  >
                    <span className="font-bold text-lg">
{t('home.start_journey')}
                    </span>
                    <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform duration-300" />
                  </Link>
                </Button>
                <Button
                  size="xl"
                  variant="outline"
                  className="text-lg px-12 py-8 border-2 hover:border-primary hover:bg-primary/5 transition-all duration-300 hover:scale-105 animate-slide-in-right"
                  asChild
                >
                  <Link href="/quiz" className="flex items-center gap-3">
                    <span className="font-bold">{t('home.take_assessment')}</span>
                    <ArrowRight className="h-6 w-6" />
                  </Link>
                </Button>
              </>
            )}
          </div>

          {/* Trust indicators */}
          <div className="mt-16 flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>{t('home.free_to_use')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>{t('home.government_verified')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>{t('home.ai_powered')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-6">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                {t('features.comprehensive_platform')}
              </span>
            </div>
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              {t('features.everything_you_need')}{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-blue-600 to-purple-600">
                {t('features.career_journey')}
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              {t('features.ai_insights')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Link
              href="/quiz"
              className="group p-8 rounded-2xl bg-white border border-gray-100 hover:border-primary/20 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 animate-scale-in cursor-pointer"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Brain className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">
                {t('features.aptitude_assessment')}
              </h3>
              <p className="text-gray-600 leading-relaxed mb-6">
                {t('features.aptitude_description')}
              </p>
              <div className="flex items-center text-primary font-medium group-hover:translate-x-2 transition-transform duration-300">
                <span>{t('features.start_assessment')}</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </div>
            </Link>

            <Link
              href="/colleges"
              className="group p-8 rounded-2xl bg-white border border-gray-100 hover:border-green-200 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 animate-scale-in cursor-pointer"
              style={{ animationDelay: "0.1s" }}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <MapPin className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">
                {t('features.government_colleges')}
              </h3>
              <p className="text-gray-600 leading-relaxed mb-6">
                {t('features.colleges_description')}
              </p>
              <div className="flex items-center text-green-600 font-medium group-hover:translate-x-2 transition-transform duration-300">
                <span>{t('features.explore_colleges')}</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </div>
            </Link>

            <Link
              href="/colleges?tab=nearby"
              className="group p-8 rounded-2xl bg-white border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 animate-scale-in cursor-pointer"
              style={{ animationDelay: "0.15s" }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Navigation className="h-8 w-8 text-green-600" />
                </div>
                <div className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-medium">
                  NEW FEATURE
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-green-900">
                {t('features.find_nearby_colleges')}
              </h3>
              <p className="text-green-700 leading-relaxed mb-6">
                {t('features.nearby_description')}
              </p>
              <div className="flex items-center text-green-600 font-medium group-hover:translate-x-2 transition-transform duration-300">
                <span>{t('features.find_nearby')}</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </div>
            </Link>

            <Link
              href="/timeline"
              className="group p-8 rounded-2xl bg-white border border-gray-100 hover:border-blue-200 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 animate-scale-in cursor-pointer"
              style={{ animationDelay: "0.25s" }}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">
                {t('features.timeline_tracker')}
              </h3>
              <p className="text-gray-600 leading-relaxed mb-6">
                {t('features.timeline_description')}
              </p>
              <div className="flex items-center text-blue-600 font-medium group-hover:translate-x-2 transition-transform duration-300">
                <span>{t('features.track_deadlines')}</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </div>
            </Link>

            <Link
              href="/career-pathways"
              className="group p-8 rounded-2xl bg-white border border-gray-100 hover:border-purple-200 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 animate-scale-in cursor-pointer"
              style={{ animationDelay: "0.3s" }}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <BookOpen className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">
                {t('features.career_pathways')}
              </h3>
              <p className="text-gray-600 leading-relaxed mb-6">
                {t('features.career_description')}
              </p>
              <div className="flex items-center text-purple-600 font-medium group-hover:translate-x-2 transition-transform duration-300">
                <span>{t('features.explore_careers')}</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </div>
            </Link>



            <Link
              href="/scholarships"
              className="group p-8 rounded-2xl bg-white border border-gray-100 hover:border-orange-200 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 animate-scale-in cursor-pointer"
              style={{ animationDelay: "0.4s" }}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <BookOpen className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">
                {t('features.scholarships')}
              </h3>
              <p className="text-gray-600 leading-relaxed mb-6">
                {t('features.scholarships_description')}
              </p>
              <div className="flex items-center text-orange-600 font-medium group-hover:translate-x-2 transition-transform duration-300">
                <span>{t('features.find_scholarships')}</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </div>
            </Link>

            <Link
              href="/dashboard"
              className="group p-8 rounded-2xl bg-white border border-gray-100 hover:border-red-200 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 animate-scale-in cursor-pointer"
              style={{ animationDelay: "0.5s" }}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <GraduationCap className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">
                {t('features.ai_recommendations')}
              </h3>
              <p className="text-gray-600 leading-relaxed mb-6">
                {t('features.ai_description')}
              </p>
              <div className="flex items-center text-red-600 font-medium group-hover:translate-x-2 transition-transform duration-300">
                <span>{t('features.get_recommendations')}</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Google Maps Feature Highlight */}
      <section className="py-24 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-green-100 rounded-full px-4 py-2 mb-6">
                <Navigation className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  New Feature
                </span>
              </div>
              <h2 className="text-5xl font-bold text-gray-900 mb-6">
                Find Colleges Near You with{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">
                  Google Maps
                </span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Discover nearby government colleges using real-time Google Maps
                data. Get detailed information about programs, ratings, and
                facilities all in one place.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Location-Based Search
                    </h3>
                    <p className="text-gray-600">
                      Use your current location or enter any address to find
                      colleges within your preferred radius.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Star className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Real-Time Data
                    </h3>
                    <p className="text-gray-600">
                      Get up-to-date information including ratings, reviews,
                      photos, and contact details from Google Places.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Navigation className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Interactive Maps
                    </h3>
                    <p className="text-gray-600">
                      Explore colleges on an interactive map with custom markers
                      and detailed info windows.
                    </p>
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    size="lg"
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-4"
                    asChild
                  >
                    <Link
                      href="/colleges?tab=nearby"
                      className="flex items-center gap-3"
                    >
                      <Navigation className="h-5 w-5" />
                      <span className="font-bold">Try Nearby Search</span>
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="relative">
                <div className="bg-white rounded-2xl shadow-2xl p-8 border border-green-200">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <MapPin className="h-4 w-4 text-green-600" />
                      </div>
                      <h4 className="font-bold text-gray-900">
                        Nearby Colleges Found
                      </h4>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            Delhi University
                          </p>
                          <p className="text-sm text-gray-600">
                            2.1 km away • ⭐ 4.2 (1,200 reviews)
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            Jawaharlal Nehru University
                          </p>
                          <p className="text-sm text-gray-600">
                            3.5 km away • ⭐ 4.5 (890 reviews)
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            Indian Institute of Technology
                          </p>
                          <p className="text-sm text-gray-600">
                            4.2 km away • ⭐ 4.8 (2,100 reviews)
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-500 text-center">
                        Powered by Google Maps Places API
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-primary via-blue-600 to-purple-700 text-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-8">
              <Star className="h-4 w-4 text-yellow-300 fill-current" />
              <span className="text-sm font-medium">
                {t('cta.join_students')}
              </span>
            </div>

            <h2 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              {t('cta.ready_to_shape')}{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">
                {t('cta.future')}
              </span>
            </h2>

            <p className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto opacity-90 leading-relaxed">
              {t('cta.join_description')}
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button
                size="lg"
                className="relative overflow-hidden text-lg px-16 py-10 bg-white text-blue-800 hover:bg-gray-50 transition-all duration-500 hover:scale-110 shadow-2xl hover:shadow-3xl group border-2 border-white/20"
                asChild
              >
                <Link
                  href="/dashboard"
                  className="flex items-center gap-4 relative z-10"
                >
                  <Sparkles className="h-7 w-7 text-blue-600 group-hover:rotate-12 transition-transform duration-300" />
                  <span className="font-bold text-xl text-blue-800">
                    {t('cta.get_started_free')}
                  </span>
                </Link>
              </Button>
              
              <InstallAppButton 
                variant="outline"
                size="lg"
                className="px-8 py-4 text-lg border-2 border-white/30 bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-500 hover:scale-110 shadow-xl hover:shadow-2xl"
              />
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-300 mb-2">
                  10,000+
                </div>
                <div className="text-white/80">{t('cta.active_students')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-300 mb-2">
                  500+
                </div>
                <div className="text-white/80">{t('cta.government_colleges_count')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-300 mb-2">
                  95%
                </div>
                <div className="text-white/80">{t('cta.success_rate')}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="md:col-span-1">
              <Link
                href="/"
                className="flex items-center mb-6 hover:opacity-80 transition-opacity duration-200"
              >
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-800 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                  <span className="font-bold text-blue-800">Path</span>
                  <span className="font-normal text-gray-600">Niti</span>
                </span>
              </Link>
              <p className="text-gray-400 leading-relaxed mb-6">
                {t('footer.tagline')}
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
              <h3 className="font-bold text-lg mb-6 text-white">{t('footer.product')}</h3>
              <ul className="space-y-4 text-gray-400">

                <li>
                  <Link
                    href="/pricing"
                    className="hover:text-primary transition-colors duration-200 hover:translate-x-1 inline-block"
                  >
{t('footer.pricing')}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/quiz"
                    className="hover:text-primary transition-colors duration-200 hover:translate-x-1 inline-block"
                  >
{t('footer.aptitude_test')}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-6 text-white">{t('footer.support')}</h3>
              <ul className="space-y-4 text-gray-400">
                <li>
                  <Link
                    href="/help"
                    className="hover:text-primary transition-colors duration-200 hover:translate-x-1 inline-block"
                  >
{t('footer.help_center')}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="hover:text-primary transition-colors duration-200 hover:translate-x-1 inline-block"
                  >
{t('footer.contact_us')}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/faq"
                    className="hover:text-primary transition-colors duration-200 hover:translate-x-1 inline-block"
                  >
{t('footer.faq')}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/community"
                    className="hover:text-primary transition-colors duration-200 hover:translate-x-1 inline-block"
                  >
{t('footer.community')}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-6 text-white">{t('footer.company')}</h3>
              <ul className="space-y-4 text-gray-400">
                <li>
                  <Link
                    href="/about"
                    className="hover:text-primary transition-colors duration-200 hover:translate-x-1 inline-block"
                  >
{t('footer.about')}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/blog"
                    className="hover:text-primary transition-colors duration-200 hover:translate-x-1 inline-block"
                  >
{t('footer.blog')}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/career-pathways"
                    className="hover:text-primary transition-colors duration-200 hover:translate-x-1 inline-block"
                  >
{t('footer.careers')}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="hover:text-primary transition-colors duration-200 hover:translate-x-1 inline-block"
                  >
{t('footer.privacy')}
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 mb-4 md:mb-0">
                {t('footer.copyright')}
              </p>
              <div className="flex space-x-6 text-sm text-gray-400">
                <Link
                  href="/terms"
                  className="hover:text-primary transition-colors"
                >
{t('footer.terms_of_service')}
                </Link>
                <Link
                  href="/privacy"
                  className="hover:text-primary transition-colors"
                >
{t('footer.privacy_policy')}
                </Link>
                <Link
                  href="/cookies"
                  className="hover:text-primary transition-colors"
                >
{t('footer.cookie_policy')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Global TTS Component */}
      <GlobalTTS position="top-right" variant="button" />
      
    </div>
  );
}
