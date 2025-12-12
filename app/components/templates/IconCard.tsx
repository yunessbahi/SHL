import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RocketIcon } from "lucide-react";

export default function IconCard() {
  return (
    <div className="max-w-md mx-auto py-6 px-4">
      <Card>
        <CardHeader className="flex flex-row items-center gap-4 pb-2">
          <div className="p-2 rounded-full bg-muted flex items-center justify-center">
            <RocketIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle>Quick Start</CardTitle>
            <CardDescription>Get your project up and running</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Follow our streamlined process to deploy your application in
            minutes. No complex configuration required.
          </p>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button>Launch Project</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
