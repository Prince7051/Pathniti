import React from "react";
import { ShieldCheck } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-16 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-10">
        <div className="flex items-center gap-4 mb-6">
          <ShieldCheck className="h-10 w-10 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Terms of Service
            </h1>
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
              <a href="#user-responsibilities" className="hover:underline">
                2. User Responsibilities
              </a>
            </li>
            <li>
              <a href="#account" className="hover:underline">
                3. Account Registration
              </a>
            </li>
            <li>
              <a href="#acceptable-use" className="hover:underline">
                4. Acceptable Use
              </a>
            </li>
            <li>
              <a href="#intellectual-property" className="hover:underline">
                5. Intellectual Property
              </a>
            </li>
            <li>
              <a href="#termination" className="hover:underline">
                6. Termination
              </a>
            </li>
            <li>
              <a href="#disclaimer" className="hover:underline">
                7. Disclaimer
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
            Welcome to PathNiti. By accessing or using our website and services,
            you agree to comply with and be bound by these Terms of Service.
            Please read them carefully.
          </p>
        </section>
        <section id="user-responsibilities" className="mb-8">
          <h2 className="text-xl font-semibold mb-2">
            2. User Responsibilities
          </h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-1">
            <li>
              Provide accurate and up-to-date information when creating an
              account.
            </li>
            <li>Keep your account credentials confidential.</li>
            <li>
              Use PathNiti in accordance with all applicable laws and
              regulations.
            </li>
          </ul>
        </section>
        <section id="account" className="mb-8">
          <h2 className="text-xl font-semibold mb-2">
            3. Account Registration
          </h2>
          <p className="text-gray-700">
            You may need to register for an account to access certain features.
            You are responsible for maintaining the security of your account and
            for all activities that occur under your account.
          </p>
        </section>
        <section id="acceptable-use" className="mb-8">
          <h2 className="text-xl font-semibold mb-2">4. Acceptable Use</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-1">
            <li>
              Do not misuse, disrupt, or attempt to gain unauthorized access to
              PathNiti or its users.
            </li>
            <li>
              Do not upload or share harmful, offensive, or illegal content.
            </li>
            <li>Respect the privacy and rights of other users.</li>
          </ul>
        </section>
        <section id="intellectual-property" className="mb-8">
          <h2 className="text-xl font-semibold mb-2">
            5. Intellectual Property
          </h2>
          <p className="text-gray-700">
            All content, trademarks, and data on PathNiti are the property of
            PathNiti or its licensors. You may not use, reproduce, or distribute
            any content without permission.
          </p>
        </section>
        <section id="termination" className="mb-8">
          <h2 className="text-xl font-semibold mb-2">6. Termination</h2>
          <p className="text-gray-700">
            We reserve the right to suspend or terminate your access to PathNiti
            at our discretion, without notice, for conduct that violates these
            Terms or is harmful to other users or us.
          </p>
        </section>
        <section id="disclaimer" className="mb-8">
          <h2 className="text-xl font-semibold mb-2">7. Disclaimer</h2>
          <p className="text-gray-700">
            PathNiti is provided &quot;as is&quot; without warranties of any
            kind. We do not guarantee the accuracy, completeness, or reliability
            of our services.
          </p>
        </section>
        <section id="contact" className="mb-4">
          <h2 className="text-xl font-semibold mb-2">8. Contact</h2>
          <p className="text-gray-700">
            If you have any questions about these Terms, please contact us at{" "}
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
