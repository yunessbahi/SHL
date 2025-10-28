"use client";

import React from "react";
import { SafeUser } from "@/lib/getSafeSession";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { useRouter } from "next/navigation";

interface WorkspacePageProps {
  user: SafeUser;
}

export default function WorkspacePage({ user }: WorkspacePageProps) {
  const router = useRouter();

  const handleCreateSingleLink = () => {
    router.push("/workspace/create?type=single");
  };

  const handleCreateSmartLink = () => {
    router.push("/workspace/create?type=smart");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to Your Workspace
          </h1>
          <p className="text-lg text-gray-600">
            Choose how you'd like to create your link. Single links are perfect
            for simple redirects, while smart links enable advanced features
            like A/B testing and geo-targeting.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={handleCreateSingleLink}
          >
            <CardHeader>
              <CardTitle>Create Single Link</CardTitle>
              <CardDescription>
                Perfect for simple redirects. Create a straightforward link that
                takes users directly to your destination.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Get Started</Button>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={handleCreateSmartLink}
          >
            <CardHeader>
              <CardTitle>Create Smart Link</CardTitle>
              <CardDescription>
                Advanced link management with A/B testing, geo-targeting, and
                more. Optimize your links for better performance.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Get Started</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
