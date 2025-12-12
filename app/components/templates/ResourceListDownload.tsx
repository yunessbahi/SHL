import { Button } from "@/components/ui/button";
import {
  Download,
  FileText,
  FileSpreadsheet,
  FileCode,
  Paintbrush,
  ArrowUpRight,
} from "lucide-react";

export default function PortfolioMinimalistResourceList() {
  const resources = [
    {
      id: 1,
      title: "Front-End Development Checklist",
      description: "A comprehensive checklist for launching flawless websites",
      icon: <FileCode className="h-5 w-5" />,
      fileType: "PDF",
      fileSize: "1.2 MB",
    },
    {
      id: 2,
      title: "Web Design Style Guide Template",
      description:
        "Create consistent brand experiences with this style guide framework",
      icon: <Paintbrush className="h-5 w-5" />,
      fileType: "Figma",
      fileSize: "35 MB",
    },
    {
      id: 3,
      title: "Freelance Project Proposal Template",
      description: "Win more clients with this proven proposal structure",
      icon: <FileText className="h-5 w-5" />,
      fileType: "DOCX",
      fileSize: "850 KB",
    },
    {
      id: 4,
      title: "Website Cost Calculator",
      description: "Accurately estimate project costs for clients",
      icon: <FileSpreadsheet className="h-5 w-5" />,
      fileType: "XLSX",
      fileSize: "1.5 MB",
    },
    {
      id: 5,
      title: "UX Audit Template & Guide",
      description: "Evaluate website usability with this structured framework",
      icon: <FileText className="h-5 w-5" />,
      fileType: "PDF",
      fileSize: "2.4 MB",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-10 md:py-14">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center md:text-left">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            Free Resources
          </h2>
          <p className="text-muted-foreground mt-2 md:text-lg">
            A collection of tools, templates, and guides I&apos;ve created to
            help other professionals.
          </p>
        </div>

        <div className="border-border divide-border rounded-lg border">
          {resources.map((resource, index) => (
            <div
              key={resource.id}
              className={`hover:bg-muted flex flex-col items-start justify-between gap-4 p-5 transition-colors sm:flex-row sm:items-center ${
                index !== resources.length - 1 ? "border-border border-b" : ""
              }`}
            >
              <div className="flex items-start sm:items-center">
                <div className="text-primary mt-1 mr-4 sm:mt-0">
                  {resource.icon}
                </div>

                <div>
                  <h3 className="font-medium">{resource.title}</h3>
                  <p className="text-muted-foreground text-sm">
                    {resource.description}
                  </p>
                </div>
              </div>

              <div className="flex w-full items-center justify-between sm:w-auto sm:flex-shrink-0 sm:justify-end">
                <div className="text-muted-foreground mr-4 flex flex-row gap-1.5 text-xs sm:flex-col sm:gap-0">
                  <span>{resource.fileType}</span>
                  <span>{resource.fileSize}</span>
                </div>

                <Button asChild variant="ghost" size="sm" className="group">
                  <a href="#">
                    <Download className="mr-1 h-4 w-4" />
                    <span className="sr-only sm:not-sr-only">Download</span>
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 text-right">
          <Button asChild variant="link" className="group">
            <a href="#">
              View all resources
              <ArrowUpRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
