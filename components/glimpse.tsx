"use client";
import {
  Glimpse,
  GlimpseContent,
  GlimpseDescription,
  GlimpseImage,
  GlimpseTitle,
  GlimpseTrigger,
} from "@/components/kibo-ui/glimpse";
import { glimpse } from "@/components/kibo-ui/glimpse/server";

interface GlimpsePreviewProps {
  url: string;
  label?: string;
  className?: string;
}

const GlimpsePreview = ({ url, label, className }: GlimpsePreviewProps) => {
  const data = glimpse(url);

  return (
    <Glimpse closeDelay={0} openDelay={0}>
      <GlimpseTrigger asChild>
        <a
          className={className || "font-medium text-primary underline"}
          href={url}
        >
          {label || data.title || url}
        </a>
      </GlimpseTrigger>
      <GlimpseContent className="w-80">
        <GlimpseImage src={data.image ?? ""} />
        <GlimpseTitle>{data.title}</GlimpseTitle>
        <GlimpseDescription>{data.description}</GlimpseDescription>
      </GlimpseContent>
    </Glimpse>
  );
};

export default GlimpsePreview;
