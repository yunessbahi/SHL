import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function BorderHighlightCard() {
  return (
    <div className="max-w-md mx-auto py-6 px-4">
      <Card className="relative before:absolute before:inset-0 before:rounded-lg before:border before:border-transparent before:transition-colors hover:before:border-primary/50 before:pointer-events-none">
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
  );
}
