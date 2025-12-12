import { Button } from "@/components/ui/button";

export default function SlideButtons() {
  return (
    <div className="flex flex-wrap justify-center gap-4 p-6">
      <Button
        variant="default"
        className="before:bg-foreground/10 relative overflow-hidden before:absolute before:inset-0 before:translate-x-[-101%] before:transition-transform before:duration-300 hover:before:translate-x-0"
      >
        <span className="relative z-10">Default</span>
      </Button>

      <Button
        variant="secondary"
        className="before:bg-foreground/10 relative overflow-hidden before:absolute before:inset-0 before:translate-x-[-101%] before:transition-transform before:duration-300 hover:before:translate-x-0"
      >
        <span className="relative z-10">Secondary</span>
      </Button>

      <Button
        variant="destructive"
        className="before:bg-foreground/10 relative overflow-hidden before:absolute before:inset-0 before:translate-x-[-101%] before:transition-transform before:duration-300 hover:before:translate-x-0"
      >
        <span className="relative z-10">Destructive</span>
      </Button>

      <Button
        variant="outline"
        className="before:bg-foreground/10 relative overflow-hidden before:absolute before:inset-0 before:translate-x-[-101%] before:transition-transform before:duration-300 hover:before:translate-x-0"
      >
        <span className="relative z-10">Outline</span>
      </Button>

      <Button
        variant="ghost"
        className="before:bg-foreground/10 relative overflow-hidden before:absolute before:inset-0 before:translate-x-[-101%] before:transition-transform before:duration-300 hover:before:translate-x-0"
      >
        <span className="relative z-10">Ghost</span>
      </Button>
    </div>
  );
}
