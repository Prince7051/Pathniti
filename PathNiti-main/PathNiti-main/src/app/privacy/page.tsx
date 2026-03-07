import React from "react";
import { Lock } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-16 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-10">
        <div className="flex items-center gap-4 mb-6">
          <Lock className="h-10 w-10 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
            <p className="text-gray-500 text-sm">Last updated: June 2024</p>
          </div>
        </div>
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Table of Contents</h2>
          <ul className="list-decimal pl-6 text-blue-700 space-y-1 text-sm">
            <li>
              <a href="#introduction" className="hover:underline">
                1. Introduction
              </a>
            </li>
            <li>
              <a href="#information" className="hover:underline">
                2. Information We Collect
              </a>
            </li>
            <li>
              <a href="#use" className="hover:underline">
                3. How We Use Your Information
              </a>
            </li>
            <li>
              <a href="#sharing" className="hover:underline">
                4. Sharing Your Information
              </a>
            </li>
            <li>
              <a href="#security" className="hover:underline">
                5. Data Security
              </a>
            </li>
            <li>
              <a href="#rights" className="hover:underline">
                6. Your Rights
              </a>
            </li>
            <li>
              <a href="#cookies" className="hover:underline">
                7. Cookies
              </a>
            </li>
            <li>
              <a href="#contact" className="hover:underline">
                8. Contact
              </a>
            </li>
          </ul>
        </div>
        <section id="introduction" className="mb-8">
          <h2 className="text-xl font-semibold mb-2">1. Introduction</h2>
          <p className="text-gray-700">
            Your privacy is important to us. This Privacy Policy explains how
            PathNiti collects, uses, and protects your information when you use
            our services.
          </p>
        </section>
        <section id="information" className="mb-8">
          <h2 className="text-xl font-semibold mb-2">
            2. Information We Collect
          </h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-1">
            <li>
              Personal information (name, email, phone number, etc.) provided
              during registration or contact.
            </li>
            <li>
              Usage data (pages visited, features used, device information,
              etc.).
            </li>
            <li>Cookies and similar tracking technologies.</li>
          </ul>
        </section>
        <section id="use" className="mb-8">
          <h2 className="text-xl font-semibold mb-2">
            3. How We Use Your Information
          </h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-1">
            <li>To provide and improve our services.</li>
            <li>To communicate with you about updates, offers, and support.</li>
            <li>To personalize your experience on PathNiti.</li>
            <li>To comply with legal obligations.</li>
          </ul>
        </section>
        <section id="sharing" className="mb-8">
          <h2 className="text-xl font-semibold mb-2">
            4. Sharing Your Information
          </h2>
          <p className="text-gray-700">
            We do not sell or rent your personal information. We may share data
            with trusted partners who assist us in operating our website and
            services, subject to confidentiality agreements.
          </p>
        </section>
        <section id="security" className="mb-8">
          <h2 className="text-xl font-semibold mb-2">5. Data Security</h2>
          <p className="text-gray-700">
            We implement industry-standard security measures to protect your
            data from unauthorized access, alteration, or disclosure.
          </p>
        </section>
        <section id="rights" className="mb-8">
          <h2 className="text-xl font-semibold mb-2">6. Your Rights</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-1">
            <li>
              You can access, update, or delete your personal information at any
              time.
            </li>
            <li>You may opt out of marketing communications.</li>
            <li>
              Contact us to exercise your rights or for any privacy-related
              questions.
            </li>
          </ul>
        </section>
        <section id="cookies" className="mb-8">
          <h2 className="text-xl font-semibold mb-2">7. Cookies</h2>
          <p className="text-gray-700">
            We use cookies to enhance your experience, analyze usage, and
            improve our services. You can control cookie preferences in your
            browser settings.
          </p>
        </section>
        <section id="contact" className="mb-4">
          <h2 className="text-xl font-semibold mb-2">8. Contact</h2>
          <p className="text-gray-700">
            For questions about this Privacy Policy, contact us at{" "}
            <a
              href="mailto:team.pathniti@gmail.com"
              className="text-blue-700 hover:underline"
            >
              team.pathniti@gmail.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
