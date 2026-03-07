"use client";

import { useAuth } from "../providers";
import { DynamicHeader } from "@/components/DynamicHeader";
import { Button } from "@/components/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { User, Mail, Phone, MapPin, Calendar, Shield, LogOut } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <DynamicHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Settings</h1>
            <p className="text-gray-600">Manage your account information and preferences</p>
          </div>

          <div className="grid gap-6">
            {/* Profile Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Your personal information and account details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <div className="p-3 bg-gray-50 rounded-md border">
                      {profile?.first_name || "Not provided"}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <div className="p-3 bg-gray-50 rounded-md border">
                      {profile?.last_name || "Not provided"}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <div className="p-3 bg-gray-50 rounded-md border flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      {user?.email || "Not provided"}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <div className="p-3 bg-gray-50 rounded-md border flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      {(profile as any)?.phone || "Not provided"}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Role
                    </label>
                    <div className="p-3 bg-gray-50 rounded-md border flex items-center gap-2">
                      <Shield className="h-4 w-4 text-gray-500" />
                      {profile?.role || "Not assigned"}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Status
                    </label>
                    <div className="p-3 bg-gray-50 rounded-md border flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${profile?.is_verified ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                      {profile?.is_verified ? "Verified" : "Pending Verification"}
                    </div>
                  </div>
                </div>
                <div className="pt-4">
                  <Button asChild>
                    <a href="/auth/complete-profile">
                      Update Profile
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Account Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Account Actions
                </CardTitle>
                <CardDescription>
                  Manage your account security and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button variant="outline" asChild>
                    <a href="/auth/complete-profile">
                      Edit Profile
                    </a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="/dashboard">
                      Go to Dashboard
                    </a>
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {isSigningOut ? "Signing Out..." : "Sign Out"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Help & Support */}
            <Card>
              <CardHeader>
                <CardTitle>Help & Support</CardTitle>
                <CardDescription>
                  Need help? We&apos;re here to assist you.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" asChild>
                    <a href="/contact">
                      Contact Support
                    </a>
                  </Button>

                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
