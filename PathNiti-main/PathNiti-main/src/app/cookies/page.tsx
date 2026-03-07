import React from "react";
import { Cookie } from "lucide-react";

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-16 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-10">
        <div className="flex items-center gap-4 mb-6">
          <Cookie className="h-10 w-10 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Cookie Policy</h1>
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
              <a href="#what-are-cookies" className="hover:underline">
                2. What Are Cookies?
              </a>
            </li>
            <li>
              <a href="#how-we-use" className="hover:underline">
                3. How We Use Cookies
              </a>
            </li>
            <li>
              <a href="#types" className="hover:underline">
                4. Types of Cookies We Use
              </a>
            </li>
            <li>
              <a href="#manage" className="hover:underline">
                5. Managing Cookies
              </a>
            </li>
            <li>
              <a href="#changes" className="hover:underline">
                6. Changes to This Policy
              </a>
            </li>
            <li>
              <a href="#contact" className="hover:underline">
                7. Contact
              </a>
            </li>
          </ul>
        </div>
        <section id="introduction" className="mb-8">
          <h2 className="text-xl font-semibold mb-2">1. Introduction</h2>
          <p className="text-gray-700">
            This Cookie Policy explains how PathNiti uses cookies and similar
            technologies to recognize you when you visit our website and use our
            services.
          </p>
        </section>
        <section id="what-are-cookies" className="mb-8">
          <h2 className="text-xl font-semibold mb-2">2. What Are Cookies?</h2>
          <p className="text-gray-700">
            Cookies are small text files stored on your device by your browser.
            They help websites remember information about your visit, such as
            your preferences and login status.
          </p>
        </section>
        <section id="how-we-use" className="mb-8">
          <h2 className="text-xl font-semibold mb-2">3. How We Use Cookies</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-1">
            <li>To remember your preferences and settings.</li>
            <li>To keep you logged in.</li>
            <li>To analyze site traffic and usage patterns.</li>
            <li>To improve our website and services.</li>
          </ul>
        </section>
        <section id="types" className="mb-8">
          <h2 className="text-xl font-semibold mb-2">
            4. Types of Cookies We Use
          </h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-1">
            <li>
              <span className="font-semibold">Essential Cookies:</span> Required
              for the website to function properly.
            </li>
            <li>
              <span className="font-semibold">Analytics Cookies:</span> Help us
              understand how visitors interact with our site.
            </li>
            <li>
              <span className="font-semibold">Preference Cookies:</span>{" "}
              Remember your choices and settings.
            </li>
          </ul>
        </section>
        <section id="manage" className="mb-8">
          <h2 className="text-xl font-semibold mb-2">5. Managing Cookies</h2>
          <p className="text-gray-700">
            You can control and delete cookies through your browser settings.
            Please note that disabling cookies may affect the functionality of
            our website.
          </p>
        </section>
        <section id="changes" className="mb-8">
          <h2 className="text-xl font-semibold mb-2">
            6. Changes to This Policy
          </h2>
          <p className="text-gray-700">
            We may update this Cookie Policy from time to time. Changes will be
            posted on this page with an updated revision date.
          </p>
        </section>
        <section id="contact" className="mb-4">
          <h2 className="text-xl font-semibold mb-2">7. Contact</h2>
          <p className="text-gray-700">
            If you have any questions about our use of cookies, contact us at{" "}
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
