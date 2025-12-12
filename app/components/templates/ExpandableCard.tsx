"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState } from "react";
import { ChevronDownIcon } from "lucide-react";

export default function ExpandableCard() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <Card className="transition-all duration-300">
        <CardHeader>
          <CardTitle>Create project</CardTitle>
          <CardDescription>
            Deploy your new project in one-click.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Your new project will be created with the latest version of our
            framework, complete with authentication, database, and API routes.
          </p>

          <div
            className={`overflow-hidden transition-all duration-300 ${
              isExpanded ? "mt-4 max-h-[500px]" : "max-h-0"
            }`}
          >
            <div className="space-y-4 border-t pt-2">
              <h4 className="text-sm font-medium">Additional Features:</h4>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li>• Responsive design for all devices</li>
                <li>• Dark mode support</li>
                <li>• SEO optimization</li>
                <li>• Performance monitoring</li>
                <li>• Automatic backups</li>
              </ul>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline">Cancel</Button>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="rounded-full"
            >
              <ChevronDownIcon
                className={`h-5 w-5 transition-transform duration-300 ${
                  isExpanded ? "rotate-180" : ""
                }`}
              />
            </Button>
            <Button>Deploy</Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
