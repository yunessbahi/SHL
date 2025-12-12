import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DoubleBorderCard() {
  return (
    <div className="max-w-md mx-auto py-6 px-4">
      <div className="relative p-[6px] rounded-lg">
        {/* Outer border */}
        <div className="absolute inset-0 rounded-lg border border-primary/30"></div>

        {/* Inner border */}
        <div className="absolute inset-[3px] rounded-md border border-primary/50"></div>

        <Card className="relative">
          <CardHeader>
            <CardTitle>Create project</CardTitle>
            <CardDescription>
              Deploy your new project in one-click.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your new project will be created with the latest version of our
              framework, complete with authentication, database, and API routes.
            </p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline">Cancel</Button>
            <Button>Deploy</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
